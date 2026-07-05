// ====================================================================
// VIEW STRATEGY — CCTV (Camera Overview)
// ====================================================================
// Opt-in view (show_camera_view): one block per camera DEVICE with
//  - the camera picture (picture-glance with status entities when the
//    device provides them, picture-entity otherwise)
//  - a spotlight tile when the device has a light entity
//  - a Reolink PTZ pad, detected via the entities' translation_key
//    (never via entity_id patterns — those are localized and unstable)
//  - a deep link into the camera's recordings in HA's media browser
//    (Reolink media source; resolved once via WS and cached)
// plus optional LLM Vision event timelines when both the integration
// and the llmvision-card are present.
//
// Performance: camera_view stays 'auto' (still images, stream on tap) —
// a wall of live streams is exactly the kind of load the performance
// guardrails exist for. Aqara cameras keep 'live' (no still endpoint),
// mirroring RoomViewStrategy.
// ====================================================================

import type { HomeAssistant, HassEntity } from '../types/homeassistant';
import type { Simon42StrategyConfig } from '../types/strategy';
import type { DeviceRegistryEntry, AreaRegistryEntry } from '../types/registries';
import type {
  LovelaceViewConfig,
  LovelaceSectionConfig,
  LovelaceCardConfig,
} from '../types/lovelace';
import { Registry } from '../Registry';
import { localize } from '../utils/localize';
import { debugLog } from '../utils/debug';
import { defineViewStrategy } from './view-strategy-base';
import { densePlacement } from '../utils/view-builder';

// -- Camera stream preference (Reolink) --------------------------------
// Reolink exposes several camera entities per device (sub/main streams,
// snapshot variants, telephoto lenses). Exactly one card per device:
// prefer the fluent/standard resolution — it is the only stream enabled
// by default and the cheapest to render.
const REOLINK_STREAM_PREFERENCE = [
  'sub',
  'telephoto_sub',
  'main',
  'telephoto_main',
  'snapshots_sub',
  'snapshots_main',
];

// -- PTZ pad ------------------------------------------------------------
// Reolink button translation_keys (homeassistant/components/reolink/button.py).
// Only buttons that actually exist on the device are rendered.
const PTZ_KEYS = new Set([
  'ptz_up',
  'ptz_down',
  'ptz_left',
  'ptz_right',
  'ptz_stop',
  'ptz_zoom_in',
  'ptz_zoom_out',
  'ptz_calibrate',
  'guard_go_to',
]);

interface PtzPadCell {
  key: string;
  labelKey: string;
  icon: string;
  columns: number;
  color?: string;
}

// Steering-cross layout: 12-column section grid. Up/down span the full
// width, left/stop/right share one row, zoom and utility buttons pair up.
const PTZ_LAYOUT: PtzPadCell[][] = [
  [{ key: 'ptz_up', labelKey: 'cctv.ptz_up', icon: 'mdi:arrow-up', columns: 12 }],
  [
    { key: 'ptz_left', labelKey: 'cctv.ptz_left', icon: 'mdi:arrow-left', columns: 4 },
    { key: 'ptz_stop', labelKey: 'cctv.ptz_stop', icon: 'mdi:stop', columns: 4, color: 'red' },
    { key: 'ptz_right', labelKey: 'cctv.ptz_right', icon: 'mdi:arrow-right', columns: 4 },
  ],
  [{ key: 'ptz_down', labelKey: 'cctv.ptz_down', icon: 'mdi:arrow-down', columns: 12 }],
  [
    { key: 'ptz_zoom_out', labelKey: 'cctv.ptz_zoom_out', icon: 'mdi:magnify-minus-outline', columns: 6 },
    { key: 'ptz_zoom_in', labelKey: 'cctv.ptz_zoom_in', icon: 'mdi:magnify-plus-outline', columns: 6 },
  ],
  [
    { key: 'ptz_calibrate', labelKey: 'cctv.ptz_calibrate', icon: 'mdi:crosshairs-gps', columns: 6 },
    { key: 'guard_go_to', labelKey: 'cctv.ptz_home', icon: 'mdi:home-map-marker', columns: 6 },
  ],
];

// Same capability set the LightsGroupCard uses for its brightness slider.
const LIGHT_BRIGHTNESS_MODES = ['brightness', 'color_temp', 'hs', 'xy', 'rgb', 'rgbw', 'rgbww', 'white'];

// =====================================================================
// Reolink recordings — media browser deep links
// =====================================================================
// The Reolink integration exposes recordings via the media browser
// (media-source://reolink → CAM|<config_entry_id>|<channel> → …).
// The channel is not visible in the frontend registries, so the CAM
// items are browsed ONCE via WS and matched to devices through their
// config entry (unique for standalone cameras). NVRs share one entry
// across channels — there the item title must match the device name,
// otherwise the link degrades to the Reolink root (one extra tap).

const REOLINK_MEDIA_ROOT = 'media-source://reolink';
const BROWSE_TIMEOUT_MS = 3000;

interface ReolinkCamItem {
  entryId: string;
  title: string;
  mediaContentId: string;
  mediaContentType: string;
}

interface BrowseMediaChild {
  title?: string;
  media_content_id?: string;
  media_content_type?: string;
}

let reolinkItemsCacheKey: string | null = null;
let reolinkItemsPromise: Promise<ReolinkCamItem[]> | null = null;

/** Reset the module-level browse cache between tests. */
export function resetReolinkMediaCacheForTesting(): void {
  reolinkItemsCacheKey = null;
  reolinkItemsPromise = null;
}

async function browseReolinkCamItems(hass: HomeAssistant): Promise<ReolinkCamItem[]> {
  try {
    // Cleared in finally — otherwise the loser of the race would reject
    // AFTER the browse succeeded and surface as an unhandled rejection.
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>(function timeoutExecutor(_resolve, reject) {
        timeoutId = setTimeout(function onBrowseTimeout() {
          reject(new Error('media browse timeout'));
        }, BROWSE_TIMEOUT_MS);
      });
      const result = await Promise.race([
        hass.callWS<{ children?: BrowseMediaChild[] }>({
          type: 'media_source/browse_media',
          media_content_id: REOLINK_MEDIA_ROOT,
        }),
        timeout,
      ]);

      const items: ReolinkCamItem[] = [];
      for (const child of result.children || []) {
        const id = child.media_content_id || '';
        if (!id.startsWith(`${REOLINK_MEDIA_ROOT}/`)) continue;
        // Identifier scheme: CAM|<config_entry_id>|<channel>
        const parts = id.substring(REOLINK_MEDIA_ROOT.length + 1).split('|');
        if (parts.length < 3 || parts[0] !== 'CAM') continue;
        items.push({
          entryId: parts[1],
          title: child.title || '',
          mediaContentId: id,
          mediaContentType: child.media_content_type || 'playlist',
        });
      }
      return items;
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  } catch (error: unknown) {
    // Media source unavailable (no SD card, integration still starting,
    // slow camera) — recordings links fall back to the Reolink root.
    debugLog('Reolink media browse failed', error);
    return [];
  }
}

/**
 * Browse the Reolink media source root, cached until the set of Reolink
 * cameras changes. generate() re-runs on every registry change — without
 * the cache each run would fire a WS browse against the cameras.
 */
export function getReolinkCamItems(hass: HomeAssistant, cacheKey: string): Promise<ReolinkCamItem[]> {
  if (reolinkItemsPromise && reolinkItemsCacheKey === cacheKey) {
    return reolinkItemsPromise;
  }
  reolinkItemsCacheKey = cacheKey;
  reolinkItemsPromise = browseReolinkCamItems(hass);
  return reolinkItemsPromise;
}

// URL scheme of ha-panel-media-browser: one path segment per browse
// level, each `encodeURIComponent("<media_content_type>,<media_content_id>")`.
function mediaBrowserSegment(type: string, id: string): string {
  return '/' + encodeURIComponent(`${type},${id}`);
}

function reolinkRootPath(): string {
  // The Reolink root item is media_class "app" with an empty content type.
  return '/media-browser/browser' + mediaBrowserSegment('', REOLINK_MEDIA_ROOT);
}

function reolinkCamPath(item: ReolinkCamItem): string {
  return reolinkRootPath() + mediaBrowserSegment(item.mediaContentType, item.mediaContentId);
}

/**
 * Resolve the media browser path for a camera device's recordings.
 * Exported for tests.
 */
export function resolveRecordingsPath(
  device: DeviceRegistryEntry | undefined,
  items: ReolinkCamItem[]
): string {
  if (device) {
    const entryMatches = items.filter(
      (item) =>
        item.entryId === device.primary_config_entry ||
        device.config_entries.includes(item.entryId)
    );
    if (entryMatches.length === 1) return reolinkCamPath(entryMatches[0]);
    if (entryMatches.length > 1) {
      // NVR: several channels share one config entry — match by name.
      const deviceName = (device.name_by_user || device.name || '').toLowerCase().trim();
      const titleMatches = entryMatches.filter(
        (item) => item.title.toLowerCase().trim() === deviceName
      );
      if (titleMatches.length === 1) return reolinkCamPath(titleMatches[0]);
    }
  }
  return reolinkRootPath();
}

// =====================================================================
// Camera block collection
// =====================================================================

export interface CameraBlock {
  /** The camera entity rendered for this block */
  cameraId: string;
  deviceId: string | null;
  /** Camera comes from the Reolink integration (platform, not name sniffing) */
  isReolink: boolean;
}

/** Reflect.get keeps dynamic state lookups off the object-injection radar. */
function stateFor(hass: HomeAssistant, entityId: string): HassEntity | undefined {
  return Reflect.get(hass.states, entityId) as HassEntity | undefined;
}

function isVisibleWithState(entityId: string, hass: HomeAssistant): boolean {
  return !!stateFor(hass, entityId) && !Registry.isEntityExcluded(entityId);
}

function pickPrimaryCamera(cameraIds: string[]): string {
  for (const preferredKey of REOLINK_STREAM_PREFERENCE) {
    for (const id of cameraIds) {
      if (Registry.getEntity(id)?.translation_key === preferredKey) return id;
    }
  }
  return cameraIds[0];
}

function cameraDisplayName(cameraId: string, hass: HomeAssistant): string {
  const friendly = stateFor(hass, cameraId)?.attributes.friendly_name;
  return typeof friendly === 'string' && friendly ? friendly : cameraId;
}

/** Resolve a camera block's area (camera entity first, then its device). */
export function cameraBlockAreaId(block: CameraBlock): string | null {
  const entity = Registry.getEntity(block.cameraId);
  if (entity?.area_id) return entity.area_id;
  return block.deviceId ? Registry.getDevice(block.deviceId)?.area_id || null : null;
}

/**
 * Group visible cameras into one block per device (entities without a
 * device get their own block). Cameras in areas excluded from the
 * dashboard (areas_display.hidden) are dropped — their room views don't
 * exist, so neither the security view's area links nor the exclusion
 * picker should offer them. Cameras without any area stay included.
 * Exported for tests.
 */
export function collectCameraBlocks(
  hass: HomeAssistant,
  dashboardConfig: Simon42StrategyConfig
): CameraBlock[] {
  const cameraIds = Registry.getVisibleEntityIdsForDomain('camera').filter(
    (id) => stateFor(hass, id) !== undefined
  );

  const byDevice = new Map<string, string[]>();
  const standalone: string[] = [];
  for (const id of cameraIds) {
    const deviceId = Registry.getEntity(id)?.device_id;
    if (deviceId) {
      const list = byDevice.get(deviceId) || [];
      list.push(id);
      byDevice.set(deviceId, list);
    } else {
      standalone.push(id);
    }
  }

  const blocks: CameraBlock[] = [];
  for (const [deviceId, ids] of byDevice) {
    const cameraId = ids.length === 1 ? ids[0] : pickPrimaryCamera(ids);
    blocks.push({
      cameraId,
      deviceId,
      isReolink: Registry.getEntity(cameraId)?.platform === 'reolink',
    });
  }
  for (const cameraId of standalone) {
    blocks.push({
      cameraId,
      deviceId: null,
      isReolink: Registry.getEntity(cameraId)?.platform === 'reolink',
    });
  }

  // Drop cameras from areas that are excluded from the dashboard
  const hiddenAreas = new Set(dashboardConfig.areas_display?.hidden || []);
  const includedBlocks = blocks.filter(function inDashboard(block) {
    const areaId = cameraBlockAreaId(block);
    return !areaId || !hiddenAreas.has(areaId);
  });

  // Stable order: area name, then camera name
  includedBlocks.sort(function compareBlocks(a, b) {
    return cameraSortKey(a, hass).localeCompare(cameraSortKey(b, hass));
  });
  return includedBlocks;
}

function cameraSortKey(block: CameraBlock, hass: HomeAssistant): string {
  const entity = Registry.getEntity(block.cameraId);
  const areaId =
    entity?.area_id || (block.deviceId ? Registry.getDevice(block.deviceId)?.area_id : null);
  const area = areaId ? (Reflect.get(hass.areas, areaId) as AreaRegistryEntry | undefined) : undefined;
  const areaName = area?.name || '';
  return `${areaName}|${cameraDisplayName(block.cameraId, hass)}`;
}

// =====================================================================
// Companion entities on the camera device
// =====================================================================

interface CameraCompanions {
  spotlight: string | null;
  motion: string | null;
  siren: string | null;
  battery: string | null;
  doorbell: string | null;
  /** PTZ button entity ids keyed by their Reolink translation_key */
  ptz: Map<string, string>;
}

function findCompanions(deviceId: string | null, hass: HomeAssistant): CameraCompanions {
  const companions: CameraCompanions = {
    spotlight: null,
    motion: null,
    siren: null,
    battery: null,
    doorbell: null,
    ptz: new Map<string, string>(),
  };
  if (!deviceId) return companions;

  for (const id of Registry.getEntityIdsForDevice(deviceId)) {
    if (!isVisibleWithState(id, hass) && !id.startsWith('button.')) continue;
    const attributes = stateFor(hass, id)?.attributes;

    if (id.startsWith('light.') && !companions.spotlight) {
      companions.spotlight = id;
    } else if (id.startsWith('siren.') && !companions.siren) {
      companions.siren = id;
    } else if (id.startsWith('binary_sensor.') && !companions.motion) {
      if (attributes?.device_class === 'motion') companions.motion = id;
    } else if (id.startsWith('sensor.') && !companions.battery) {
      if (attributes?.device_class === 'battery') companions.battery = id;
    } else if (id.startsWith('event.') && !companions.doorbell) {
      if (attributes?.device_class === 'doorbell') companions.doorbell = id;
    } else if (id.startsWith('button.')) {
      // PTZ buttons are entity_category "config" — the visibility filter
      // above would drop them, so buttons get their own check (state,
      // no_dboard label, config-hidden, hidden_by).
      const entry = Registry.getEntity(id);
      if (
        !stateFor(hass, id) ||
        entry?.hidden ||
        Registry.isExcludedByLabel(id) ||
        Registry.isHiddenByConfig(id)
      ) {
        continue;
      }
      const translationKey = entry?.translation_key;
      if (translationKey && PTZ_KEYS.has(translationKey) && !companions.ptz.has(translationKey)) {
        companions.ptz.set(translationKey, id);
      }
    }
  }
  return companions;
}

// =====================================================================
// Card builders
// =====================================================================

function buildPtzCards(ptz: Map<string, string>): LovelaceCardConfig[] {
  const cards: LovelaceCardConfig[] = [];
  for (const row of PTZ_LAYOUT) {
    for (const cell of row) {
      const entityId = ptz.get(cell.key);
      if (!entityId) continue;
      cards.push({
        type: 'shortcut',
        vertical: true,
        label: localize(cell.labelKey),
        icon: cell.icon,
        ...(cell.color ? { color: cell.color } : {}),
        grid_options: { columns: cell.columns, rows: 2 },
        tap_action: {
          action: 'perform-action',
          perform_action: 'button.press',
          target: { entity_id: entityId },
        },
      });
    }
  }
  return cards;
}

function buildSpotlightTile(spotlightId: string, hass: HomeAssistant): LovelaceCardConfig {
  const modes = stateFor(hass, spotlightId)?.attributes.supported_color_modes as string[] | undefined;
  const hasBrightness = !!modes?.some(function supportsBrightness(mode: string) {
    return LIGHT_BRIGHTNESS_MODES.includes(mode);
  });
  return {
    type: 'tile',
    entity: spotlightId,
    vertical: false,
    ...(hasBrightness
      ? { features: [{ type: 'light-brightness' }], features_position: 'inline' }
      : {}),
  };
}

function isAqaraDevice(deviceId: string | null): boolean {
  if (!deviceId) return false;
  const device = Registry.getDevice(deviceId);
  const manufacturer = (device?.manufacturer || '').toLowerCase();
  const model = (device?.model || '').toLowerCase();
  return manufacturer.includes('aqara') || model.includes('aqara');
}

/**
 * Lean camera card à la HA security panel: still image, no name/state,
 * half width. Used by the security view — the rich block with PTZ and
 * recordings stays exclusive to the CCTV view. Exported for reuse.
 */
export function leanCameraCard(block: CameraBlock): LovelaceCardConfig {
  return {
    type: 'picture-entity',
    entity: block.cameraId,
    camera_image: block.cameraId,
    camera_view: isAqaraDevice(block.deviceId) ? 'live' : 'auto',
    show_state: false,
    show_name: false,
    grid_options: { columns: 6, rows: 2 },
  };
}

/**
 * Build the section for one camera block. `recordingsPath` is the media
 * browser deep link (null = no recordings link). Exported for tests.
 */
export function buildCameraSection(
  block: CameraBlock,
  hass: HomeAssistant,
  recordingsPath: string | null
): LovelaceSectionConfig {
  const name = cameraDisplayName(block.cameraId, hass);
  const companions = findCompanions(block.deviceId, hass);

  const glanceEntities: Record<string, string>[] = [];
  if (companions.motion) glanceEntities.push({ entity: companions.motion });
  if (companions.siren) glanceEntities.push({ entity: companions.siren });
  if (companions.doorbell) glanceEntities.push({ entity: companions.doorbell });
  if (companions.battery) glanceEntities.push({ entity: companions.battery });

  const cards: LovelaceCardConfig[] = [
    { type: 'heading', heading: name, heading_style: 'title', icon: 'mdi:cctv' },
  ];

  if (glanceEntities.length > 0) {
    cards.push({
      type: 'picture-glance',
      camera_image: block.cameraId,
      camera_view: isAqaraDevice(block.deviceId) ? 'live' : 'auto',
      fit_mode: 'cover',
      title: name,
      entities: glanceEntities,
    });
  } else {
    cards.push({
      type: 'picture-entity',
      entity: block.cameraId,
      camera_image: block.cameraId,
      camera_view: isAqaraDevice(block.deviceId) ? 'live' : 'auto',
      name,
      show_name: true,
      show_state: false,
    });
  }

  if (companions.spotlight) {
    cards.push(buildSpotlightTile(companions.spotlight, hass));
  }

  cards.push(...buildPtzCards(companions.ptz));

  if (recordingsPath) {
    cards.push({
      type: 'shortcut',
      label: localize('cctv.recordings'),
      icon: 'mdi:filmstrip-box-multiple',
      grid_options: { columns: 12, rows: 1 },
      tap_action: { action: 'navigate', navigation_path: recordingsPath },
    });
  }

  return { type: 'grid', cards };
}

// =====================================================================
// LLM Vision event timelines
// =====================================================================

const LLMVISION_CATEGORIES = [
  { filter: 'person', headerKey: 'cctv.events_persons' },
  { filter: 'animal', headerKey: 'cctv.events_animals' },
  { filter: 'vehicle', headerKey: 'cctv.events_vehicles' },
];

function isLlmVisionCardLoaded(): boolean {
  const globals = globalThis as unknown as {
    customElements?: { get(name: string): unknown };
    customCards?: Array<{ type?: string }>;
  };
  if (globals.customElements?.get('llmvision-card')) return true;
  return (
    Array.isArray(globals.customCards) &&
    globals.customCards.some(function isLlmVisionEntry(card) {
      return card.type === 'llmvision-card';
    })
  );
}

/**
 * Event timeline section — only when both the LLM Vision integration
 * (any entity with platform "llmvision") and the llmvision-card custom
 * card are present. Exported for tests.
 */
export function buildLlmVisionSection(hass: HomeAssistant): LovelaceSectionConfig | null {
  const hasIntegration = Object.values(hass.entities).some(function isLlmVisionEntity(entity) {
    return entity.platform === 'llmvision';
  });
  if (!hasIntegration || !isLlmVisionCardLoaded()) return null;

  const language = (hass.locale.language || 'en').split('-')[0];
  const timeFormat = hass.locale.time_format === '12' ? '12h' : '24h';

  const cards: LovelaceCardConfig[] = [
    { type: 'heading', heading: localize('cctv.events'), heading_style: 'title', icon: 'mdi:motion-sensor' },
  ];
  for (const category of LLMVISION_CATEGORIES) {
    cards.push({
      type: 'custom:llmvision-card',
      header: localize(category.headerKey),
      category_filters: [category.filter],
      number_of_days: 24,
      number_of_events: 10,
      language,
      time_format: timeFormat,
      filter_false_positives: true,
      grid_options: { columns: 'full' },
    });
  }
  return { type: 'grid', cards };
}

// =====================================================================
// View strategy
// =====================================================================

/** Assemble all CCTV view sections. Exported for tests. */
export async function buildCctvSections(
  hass: HomeAssistant,
  dashboardConfig: Simon42StrategyConfig
): Promise<LovelaceSectionConfig[]> {
  // hidden_cameras applies to the camera views (CCTV + security) —
  // room views deliberately keep showing these cameras.
  const hiddenCameras = new Set(dashboardConfig.hidden_cameras || []);
  const blocks = collectCameraBlocks(hass, dashboardConfig).filter(function notHidden(block) {
    return !hiddenCameras.has(block.cameraId);
  });

  if (blocks.length === 0) {
    return [
      {
        type: 'grid',
        cards: [{ type: 'markdown', content: localize('cctv.no_cameras') }],
      },
    ];
  }

  // Recordings deep links — one cached browse for all Reolink cameras
  const reolinkBlocks = blocks.filter(function isReolinkBlock(block) {
    return block.isReolink;
  });
  let camItems: ReolinkCamItem[] = [];
  if (reolinkBlocks.length > 0) {
    const cacheKey = reolinkBlocks
      .map(function blockCameraId(block) {
        return block.cameraId;
      })
      .sort()
      .join(',');
    camItems = await getReolinkCamItems(hass, cacheKey);
  }

  const sections: LovelaceSectionConfig[] = [];
  for (const block of blocks) {
    const device = block.deviceId ? Registry.getDevice(block.deviceId) : undefined;
    const recordingsPath = block.isReolink ? resolveRecordingsPath(device, camItems) : null;
    sections.push(buildCameraSection(block, hass, recordingsPath));
  }

  // Opt-in even when LLM Vision is present: the llmvision-card re-fetches
  // its events API on every hass update (no debounce) — three timelines
  // multiply that into a request storm on busy systems.
  if (dashboardConfig.show_camera_events === true) {
    const eventsSection = buildLlmVisionSection(hass);
    if (eventsSection) sections.push(eventsSection);
  }

  return sections;
}

async function generateCctvView(
  config: { config?: Simon42StrategyConfig },
  hass: HomeAssistant
): Promise<LovelaceViewConfig> {
  // Ensure Registry is initialized (idempotent — no-op if already done)
  Registry.initialize(hass, config.config || {});

  const sections = await buildCctvSections(hass, config.config || {});
  return { type: 'sections', max_columns: 3, ...densePlacement(config.config), sections };
}

defineViewStrategy('ll-strategy-simon42-view-cameras', generateCctvView);
