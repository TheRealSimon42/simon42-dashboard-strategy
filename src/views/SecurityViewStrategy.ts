// ====================================================================
// VIEW STRATEGY — SECURITY (Locks, Doors, Garages, Windows, Smoke/Gas)
// ====================================================================

import type { HomeAssistant, HassEntity } from '../types/homeassistant';
import type { Simon42StrategyConfig } from '../types/strategy';
import type { LovelaceViewConfig, LovelaceCardConfig, LovelaceSectionConfig, LovelaceViewSidebarConfig } from '../types/lovelace';
import type { FloorRegistryEntry } from '../types/registries';
import type { CameraBlock } from './CctvViewStrategy';
import { Registry } from '../Registry';
import { localize } from '../utils/localize';
import { SECURITY_EXCLUDED_PLATFORMS } from '../utils/entity-filter';
import { getVisibleAreasFromHass } from '../utils/name-utils';
import { collectCameraBlocks, cameraBlockAreaId, leanCameraCard } from './CctvViewStrategy';
import { defineViewStrategy } from './view-strategy-base';

/** Reflect.get keeps dynamic state lookups off the object-injection radar. */
function stateFor(hass: HomeAssistant, entityId: string): HassEntity | undefined {
  return Reflect.get(hass.states, entityId) as HassEntity | undefined;
}

/** Typed category access without a dynamic object-index expression. */
function categoryEntities(entities: SecurityEntities, category: keyof SecurityEntities): string[] {
  return Reflect.get(entities, category) as string[];
}

// -- Entity collection --------------------------------------------------

/** Category buckets of the security view. Order = render order. */
interface SecurityEntities {
  locks: string[];
  doors: string[]; // cover.door + cover.gate (security: open/closed)
  motorizedWindows: string[]; // cover.window (electric Velux etc.)
  garages: string[];
  windows: string[]; // binary_sensor.door/window/opening (contact sensors)
  smokeGas: string[];
  waterLeak: string[];
  /** binary_sensor safety/tamper/lock — e.g. Versatile Thermostat's
   *  per-room "Sicherheitsstatus" (device_class safety). Matches the
   *  filter set of HA's security panel. */
  safety: string[];
}

function collectSecurityEntities(hass: HomeAssistant): SecurityEntities {
  const result: SecurityEntities = {
    locks: [],
    doors: [],
    motorizedWindows: [],
    garages: [],
    windows: [],
    smokeGas: [],
    waterLeak: [],
    safety: [],
  };

  for (const id of [
    ...Registry.getVisibleEntityIdsForDomain('lock'),
    ...Registry.getVisibleEntityIdsForDomain('cover'),
    ...Registry.getVisibleEntityIdsForDomain('binary_sensor'),
  ]) {
    if (!hass.states[id]) continue;

    const state = hass.states[id];
    const deviceClass = state.attributes?.device_class;

    if (id.startsWith('lock.')) {
      result.locks.push(id);
    } else if (id.startsWith('cover.')) {
      if (deviceClass === 'garage') result.garages.push(id);
      else if (deviceClass === 'window') result.motorizedWindows.push(id);
      else if (deviceClass === 'door' || deviceClass === 'gate') result.doors.push(id);
    } else if (id.startsWith('binary_sensor.')) {
      const entry = Registry.getEntity(id);
      if (entry?.platform && SECURITY_EXCLUDED_PLATFORMS.has(entry.platform)) continue;
      // Drop relay-style devices that incidentally expose an opening
      // binary_sensor (e.g. SONOFF ZBMINIR2/L2 — they're switches whose
      // "opening" state mirrors the relay, not a real door/window contact).
      // Heuristic: if the same parent device also exposes a switch.*
      // entity, the binary_sensor is the relay-state indicator.
      if (deviceClass === 'opening' && entry?.device_id) {
        const siblings = Registry.getEntityIdsForDevice(entry.device_id);
        if (siblings.some((sid) => sid.startsWith('switch.'))) continue;
      }
      if (deviceClass && ['door', 'window', 'garage_door', 'opening'].includes(deviceClass)) result.windows.push(id);
      else if (deviceClass && ['smoke', 'gas', 'heat', 'carbon_monoxide'].includes(deviceClass)) result.smokeGas.push(id);
      else if (deviceClass === 'moisture') result.waterLeak.push(id);
      else if (deviceClass && ['safety', 'tamper', 'lock'].includes(deviceClass)) result.safety.push(id);
    }
  }
  return result;
}

// -- Shared card builders ------------------------------------------------

/** Tile config per security category — same in category and area mode. */
function securityTileCard(id: string, category: keyof SecurityEntities): LovelaceCardConfig {
  if (category === 'locks') {
    return { type: 'tile', entity: id, features: [{ type: 'lock-commands' }], state_content: 'last_changed' };
  }
  if (category === 'doors' || category === 'motorizedWindows' || category === 'garages') {
    return {
      type: 'tile',
      entity: id,
      features: [{ type: 'cover-open-close' }],
      features_position: 'inline',
      state_content: 'last_changed',
    };
  }
  return { type: 'tile', entity: id, state_content: 'last_changed' };
}

/** Extra-entities section (both modes, appended last). */
function buildExtraEntitiesSection(
  hass: HomeAssistant,
  dashboardConfig: Simon42StrategyConfig
): LovelaceSectionConfig | null {
  const extraEntities = (dashboardConfig.security_extra_entities || []).filter(
    (id: string) => hass.states[id] !== undefined
  );
  if (extraEntities.length === 0) return null;
  return {
    type: 'grid',
    cards: [
      {
        type: 'heading',
        heading: localize('security.extra_entities'),
        heading_style: 'subtitle',
        icon: 'mdi:home-alert',
      },
      ...extraEntities.map((e) => ({
        type: 'tile',
        entity: e,
        state_content: ['state', 'last_changed'],
      })),
    ],
  };
}

/**
 * Cameras section for the category layout — lean HA-style cards. The
 * heading deep-links to the CCTV view when that view is enabled.
 */
function buildCamerasSection(
  blocks: CameraBlock[],
  cameraViewEnabled: boolean
): LovelaceSectionConfig | null {
  if (blocks.length === 0) return null;
  return {
    type: 'grid',
    cards: [
      {
        type: 'heading',
        heading: localize('security.cameras'),
        heading_style: 'subtitle',
        icon: 'mdi:cctv',
        ...(cameraViewEnabled
          ? { tap_action: { action: 'navigate', navigation_path: 'cameras' } }
          : {}),
      },
      ...blocks.map(leanCameraCard),
    ],
  };
}

// -- Area-grouped layout ---------------------------------------------

const AREA_MODE_CATEGORY_ORDER: (keyof SecurityEntities)[] = [
  'locks',
  'doors',
  'motorizedWindows',
  'garages',
  'windows',
  'smokeGas',
  'waterLeak',
  'safety',
];

function resolveAreaId(entityId: string): string | null {
  const entry = Registry.getEntity(entityId);
  if (!entry) return null;
  if (entry.area_id) return entry.area_id;
  if (entry.device_id) return Registry.getDevice(entry.device_id)?.area_id || null;
  return null;
}

/**
 * HA-security-panel layout: one stacked section per floor (column_span 2
 * on a max_columns-3 view keeps them under each other), inside per area a
 * subtitle heading (tap → room view) followed by cameras and security
 * tiles. Area order follows the user's area sorting; floors appear in
 * first-seen order of that sorting. Entities without an area land in a
 * trailing section.
 */
function buildAreaGroupedSections(
  hass: HomeAssistant,
  dashboardConfig: Simon42StrategyConfig,
  entities: SecurityEntities,
  cameraBlocks: CameraBlock[]
): LovelaceSectionConfig[] {
  // cards per area, categories in fixed order; cameras lead each area
  const cardsByArea = new Map<string, LovelaceCardConfig[]>();
  const unassigned: LovelaceCardConfig[] = [];

  function push(areaId: string | null, card: LovelaceCardConfig): void {
    if (!areaId) {
      unassigned.push(card);
      return;
    }
    const list = cardsByArea.get(areaId) || [];
    list.push(card);
    cardsByArea.set(areaId, list);
  }

  for (const block of cameraBlocks) {
    push(cameraBlockAreaId(block), leanCameraCard(block));
  }
  for (const category of AREA_MODE_CATEGORY_ORDER) {
    for (const id of categoryEntities(entities, category)) {
      push(resolveAreaId(id), securityTileCard(id, category));
    }
  }

  // Bucket the ordered visible areas by floor — first-seen order keeps
  // the user's area sorting authoritative, no separate floor sort.
  interface FloorBucket {
    floorId: string | null;
    areas: { area_id: string; name: string }[];
  }
  const buckets: FloorBucket[] = [];
  const bucketByFloor = new Map<string | null, FloorBucket>();
  const areas = getVisibleAreasFromHass(hass, dashboardConfig.areas_display, dashboardConfig.use_default_area_sort);
  for (const area of areas) {
    const cards = cardsByArea.get(area.area_id);
    if (!cards || cards.length === 0) continue;
    const floorId = area.floor_id || null;
    let bucket = bucketByFloor.get(floorId);
    if (!bucket) {
      bucket = { floorId, areas: [] };
      bucketByFloor.set(floorId, bucket);
      buckets.push(bucket);
    }
    bucket.areas.push(area);
  }

  // With a single group the floor name adds nothing — HA labels it
  // "Areas" then; floorless areas get "Other areas" among floors.
  const multipleBuckets = buckets.length > 1;
  const sections: LovelaceSectionConfig[] = [];
  for (const bucket of buckets) {
    const floor = bucket.floorId
      ? (Reflect.get(hass.floors, bucket.floorId) as FloorRegistryEntry | undefined)
      : undefined;
    const cards: LovelaceCardConfig[] = [
      {
        type: 'heading',
        heading: multipleBuckets
          ? floor?.name || localize('security.other_areas')
          : localize('security.areas'),
        heading_style: 'title',
        ...(floor?.icon ? { icon: floor.icon } : {}),
      },
    ];
    for (const area of bucket.areas) {
      cards.push({
        type: 'heading',
        heading: area.name,
        heading_style: 'subtitle',
        tap_action: { action: 'navigate', navigation_path: area.area_id },
      });
      cards.push(...(cardsByArea.get(area.area_id) || []));
    }
    sections.push({ type: 'grid', column_span: 2, cards });
  }

  if (unassigned.length > 0) {
    sections.push({
      type: 'grid',
      column_span: 2,
      cards: [
        {
          type: 'heading',
          heading: localize('security.no_area'),
          heading_style: 'title',
          icon: 'mdi:help-circle-outline',
        },
        ...unassigned,
      ],
    });
  }
  return sections;
}

// -- Cameras shown in the security view -----------------------------------

/**
 * Camera blocks for the security view: the shared device dedup MINUS the
 * hidden_cameras exclusion list (shared with the CCTV view — only room
 * views keep showing those cameras).
 */
function securityCameraBlocks(
  hass: HomeAssistant,
  dashboardConfig: Simon42StrategyConfig
): CameraBlock[] {
  if (dashboardConfig.show_cameras_in_security !== true) return [];
  const hidden = new Set(dashboardConfig.hidden_cameras || []);
  return collectCameraBlocks(hass, dashboardConfig).filter(function notHidden(block) {
    return !hidden.has(block.cameraId);
  });
}

// -- Activity log (24h logbook à la HA's security panel) -------------------

// Entities carrying this label stay in the security sections but are
// excluded from the activity logbook — e.g. interior door contacts whose
// history is just noise there (same convention as no_dboard).
const SECLOG_EXCLUDE_LABEL = 'no_seclog';

function isExcludedFromSecurityLog(entityId: string): boolean {
  return Registry.getEntity(entityId)?.labels.includes(SECLOG_EXCLUDE_LABEL) === true;
}

function buildActivitySection(
  hass: HomeAssistant,
  dashboardConfig: Simon42StrategyConfig,
  logbookRows?: number
): LovelaceSectionConfig | null {
  if (dashboardConfig.show_security_activity === false) return null;
  if (!hass.config?.components?.includes('logbook')) return null;

  const entities = collectSecurityEntities(hass);
  const logbookEntityIds = [
    ...AREA_MODE_CATEGORY_ORDER.flatMap(function categoryIds(category) {
      return categoryEntities(entities, category);
    }),
    ...securityCameraBlocks(hass, dashboardConfig).map(function blockCameraId(block) {
      return block.cameraId;
    }),
    ...Registry.getVisibleEntityIdsForDomain('person'),
  ].filter(function notLogExcluded(id) {
    return !isExcludedFromSecurityLog(id);
  });
  if (logbookEntityIds.length === 0) return null;

  return {
    type: 'grid',
    cards: [
      {
        type: 'heading',
        heading: localize('security.activity'),
        heading_style: 'title',
      },
      {
        type: 'logbook',
        target: { entity_id: logbookEntityIds },
        hours_to_show: 24,
        grid_options: { columns: 12, ...(logbookRows ? { rows: logbookRows } : {}) },
      },
    ],
  };
}

/**
 * Activity log as view sidebar — exclusive to the area-grouped (HA-style)
 * layout: pinned to the right on wide screens, own tab on narrow ones
 * (sections view sidebar, HA 2026.x — older frontends simply ignore the
 * extra key). Taller logbook (rows: 8) so the pane fills the column next
 * to the stacked area list. Exported for tests.
 */
export function buildSecurityActivitySidebar(
  hass: HomeAssistant,
  dashboardConfig: Simon42StrategyConfig
): LovelaceViewSidebarConfig | undefined {
  if (dashboardConfig.group_security_by_areas !== true) return undefined;
  const section = buildActivitySection(hass, dashboardConfig, 8);
  if (!section) return undefined;
  return {
    sections: [section],
    content_label: localize('security.devices'),
    sidebar_label: localize('security.activity'),
  };
}

// -- View assembly ------------------------------------------------------

/** Assemble all security view sections. Exported for tests. */
export function buildSecuritySections(
  hass: HomeAssistant,
  dashboardConfig: Simon42StrategyConfig
): LovelaceSectionConfig[] {
  const entities = collectSecurityEntities(hass);
  const cameraBlocks = securityCameraBlocks(hass, dashboardConfig);
  const cameraViewEnabled = dashboardConfig.show_camera_view === true;

  function appendTrailingSections(sections: LovelaceSectionConfig[]): LovelaceSectionConfig[] {
    const extraSection = buildExtraEntitiesSection(hass, dashboardConfig);
    if (extraSection) sections.push(extraSection);
    // Activity section: leads the view by default, optionally trails
    // (security_activity_position: 'end'). The area-grouped layout uses
    // the sidebar instead.
    if (dashboardConfig.group_security_by_areas !== true) {
      const activity = buildActivitySection(hass, dashboardConfig);
      if (activity) {
        if (dashboardConfig.security_activity_position === 'end') sections.push(activity);
        else sections.unshift(activity);
      }
    }
    return sections;
  }

  if (dashboardConfig.group_security_by_areas === true) {
    return appendTrailingSections(
      buildAreaGroupedSections(hass, dashboardConfig, entities, cameraBlocks)
    );
  }

  const { locks, doors, motorizedWindows, garages, windows, smokeGas, waterLeak, safety } = entities;
  const sections: LovelaceSectionConfig[] = [];


  // Locks
  if (locks.length > 0) {
    const unlocked = locks.filter((e) => hass.states[e]?.state === 'unlocked');
    const locked = locks.filter((e) => hass.states[e]?.state === 'locked');
    const cards: LovelaceCardConfig[] = [];

    if (unlocked.length > 0) {
      cards.push({
        type: 'heading',
        heading: localize('security.locks_unlocked'),
        heading_style: 'subtitle',
        icon: 'mdi:lock-open',
        badges: [
          {
            type: 'entity',
            entity: unlocked[0],
            show_name: false,
            show_state: false,
            tap_action: { action: 'perform-action', perform_action: 'lock.lock', target: { entity_id: unlocked } },
            icon: 'mdi:lock',
          },
        ],
      });
      cards.push(
        ...unlocked.map((e) => ({
          type: 'tile',
          entity: e,
          features: [{ type: 'lock-commands' }],
          state_content: 'last_changed',
        }))
      );
    }
    if (locked.length > 0) {
      cards.push({ type: 'heading', heading: localize('security.locks_locked'), heading_style: 'subtitle', icon: 'mdi:lock' });
      cards.push(
        ...locked.map((e) => ({
          type: 'tile',
          entity: e,
          features: [{ type: 'lock-commands' }],
          state_content: 'last_changed',
        }))
      );
    }
    if (cards.length > 0) sections.push({ type: 'grid', cards });
  }

  // Doors/Gates
  if (doors.length > 0) {
    const open = doors.filter((e) => hass.states[e]?.state === 'open');
    const closed = doors.filter((e) => hass.states[e]?.state === 'closed');
    const cards: LovelaceCardConfig[] = [];

    if (open.length > 0) {
      cards.push({
        type: 'heading',
        heading: localize('security.doors_open'),
        heading_style: 'subtitle',
        icon: 'mdi:door-open',
        badges: [
          {
            type: 'entity',
            entity: open[0],
            show_name: false,
            show_state: false,
            tap_action: {
              action: 'perform-action',
              perform_action: 'cover.close_cover',
              target: { entity_id: open },
            },
            icon: 'mdi:arrow-down',
          },
        ],
      });
      cards.push(
        ...open.map((e) => ({
          type: 'tile',
          entity: e,
          features: [{ type: 'cover-open-close' }],
          features_position: 'inline',
          state_content: 'last_changed',
        }))
      );
    }
    if (closed.length > 0) {
      cards.push({ type: 'heading', heading: localize('security.doors_closed'), heading_style: 'subtitle', icon: 'mdi:door-closed' });
      cards.push(
        ...closed.map((e) => ({
          type: 'tile',
          entity: e,
          features: [{ type: 'cover-open-close' }],
          features_position: 'inline',
          state_content: 'last_changed',
        }))
      );
    }
    if (cards.length > 0) sections.push({ type: 'grid', cards });
  }

  // Motorized windows (cover.* with device_class=window — e.g. Velux electric)
  if (motorizedWindows.length > 0) {
    const open = motorizedWindows.filter((e) => hass.states[e]?.state === 'open');
    const closed = motorizedWindows.filter((e) => hass.states[e]?.state === 'closed');
    const cards: LovelaceCardConfig[] = [];

    if (open.length > 0) {
      cards.push({
        type: 'heading',
        heading: localize('security.motorized_windows_open'),
        heading_style: 'subtitle',
        icon: 'mdi:window-open-variant',
        badges: [
          {
            type: 'entity',
            entity: open[0],
            show_name: false,
            show_state: false,
            tap_action: {
              action: 'perform-action',
              perform_action: 'cover.close_cover',
              target: { entity_id: open },
            },
            icon: 'mdi:arrow-down',
          },
        ],
      });
      cards.push(
        ...open.map((e) => ({
          type: 'tile',
          entity: e,
          features: [{ type: 'cover-open-close' }],
          features_position: 'inline',
          state_content: 'last_changed',
        }))
      );
    }
    if (closed.length > 0) {
      cards.push({ type: 'heading', heading: localize('security.motorized_windows_closed'), heading_style: 'subtitle', icon: 'mdi:window-closed-variant' });
      cards.push(
        ...closed.map((e) => ({
          type: 'tile',
          entity: e,
          features: [{ type: 'cover-open-close' }],
          features_position: 'inline',
          state_content: 'last_changed',
        }))
      );
    }
    if (cards.length > 0) sections.push({ type: 'grid', cards });
  }

  // Garages
  if (garages.length > 0) {
    const open = garages.filter((e) => hass.states[e]?.state === 'open');
    const closed = garages.filter((e) => hass.states[e]?.state === 'closed');
    const cards: LovelaceCardConfig[] = [];

    if (open.length > 0) {
      cards.push({
        type: 'heading',
        heading: localize('security.garages_open'),
        heading_style: 'subtitle',
        icon: 'mdi:garage-open',
        badges: [
          {
            type: 'entity',
            entity: open[0],
            show_name: false,
            show_state: false,
            tap_action: {
              action: 'perform-action',
              perform_action: 'cover.close_cover',
              target: { entity_id: open },
            },
            icon: 'mdi:arrow-down',
          },
        ],
      });
      cards.push(
        ...open.map((e) => ({
          type: 'tile',
          entity: e,
          features: [{ type: 'cover-open-close' }],
          features_position: 'inline',
          state_content: 'last_changed',
        }))
      );
    }
    if (closed.length > 0) {
      cards.push({ type: 'heading', heading: localize('security.garages_closed'), heading_style: 'subtitle', icon: 'mdi:garage' });
      cards.push(
        ...closed.map((e) => ({
          type: 'tile',
          entity: e,
          features: [{ type: 'cover-open-close' }],
          features_position: 'inline',
          state_content: 'last_changed',
        }))
      );
    }
    if (cards.length > 0) sections.push({ type: 'grid', cards });
  }

  // Windows/Openings
  if (windows.length > 0) {
    const open = windows.filter((e) => hass.states[e]?.state === 'on');
    const closed = windows.filter((e) => hass.states[e]?.state === 'off');
    const cards: LovelaceCardConfig[] = [];

    if (open.length > 0) {
      cards.push({ type: 'heading', heading: localize('security.windows_open'), heading_style: 'subtitle', icon: 'mdi:window-open' });
      cards.push(...open.map((e) => ({ type: 'tile', entity: e, state_content: 'last_changed' })));
    }
    if (closed.length > 0) {
      cards.push({ type: 'heading', heading: localize('security.windows_closed'), heading_style: 'subtitle', icon: 'mdi:window-closed' });
      cards.push(...closed.map((e) => ({ type: 'tile', entity: e, state_content: 'last_changed' })));
    }
    if (cards.length > 0) sections.push({ type: 'grid', cards });
  }

  // Smoke/Gas detectors
  if (smokeGas.length > 0) {
    const active = smokeGas.filter((e) => hass.states[e]?.state === 'on');
    const inactive = smokeGas.filter((e) => hass.states[e]?.state === 'off');
    const cards: LovelaceCardConfig[] = [];

    if (active.length > 0) {
      cards.push({ type: 'heading', heading: localize('security.smoke_gas_active'), heading_style: 'subtitle', icon: 'mdi:smoke-detector-alert' });
      cards.push(...active.map((e) => ({ type: 'tile', entity: e, state_content: 'last_changed' })));
    }
    if (inactive.length > 0) {
      cards.push({ type: 'heading', heading: localize('security.smoke_gas_inactive'), heading_style: 'subtitle', icon: 'mdi:smoke-detector' });
      cards.push(...inactive.map((e) => ({ type: 'tile', entity: e, state_content: 'last_changed' })));
    }
    if (cards.length > 0) sections.push({ type: 'grid', cards });
  }

  // Water leak / moisture sensors
  if (waterLeak.length > 0) {
    const active = waterLeak.filter((e) => hass.states[e]?.state === 'on');
    const inactive = waterLeak.filter((e) => hass.states[e]?.state === 'off');
    const cards: LovelaceCardConfig[] = [];

    if (active.length > 0) {
      cards.push({ type: 'heading', heading: localize('security.water_leak_active'), heading_style: 'subtitle', icon: 'mdi:water-alert' });
      cards.push(...active.map((e) => ({ type: 'tile', entity: e, state_content: 'last_changed' })));
    }
    if (inactive.length > 0) {
      cards.push({ type: 'heading', heading: localize('security.water_leak_inactive'), heading_style: 'subtitle', icon: 'mdi:water-check' });
      cards.push(...inactive.map((e) => ({ type: 'tile', entity: e, state_content: 'last_changed' })));
    }
    if (cards.length > 0) sections.push({ type: 'grid', cards });
  }

  // Safety status sensors (device_class safety/tamper/lock — e.g.
  // Versatile Thermostat's per-room "Sicherheitsstatus")
  if (safety.length > 0) {
    const active = safety.filter((e) => stateFor(hass, e)?.state === 'on');
    const inactive = safety.filter((e) => stateFor(hass, e)?.state === 'off');
    const cards: LovelaceCardConfig[] = [];

    if (active.length > 0) {
      cards.push({ type: 'heading', heading: localize('security.safety_active'), heading_style: 'subtitle', icon: 'mdi:shield-alert' });
      cards.push(...active.map((e) => ({ type: 'tile', entity: e, state_content: 'last_changed' })));
    }
    if (inactive.length > 0) {
      cards.push({ type: 'heading', heading: localize('security.safety_inactive'), heading_style: 'subtitle', icon: 'mdi:shield-check' });
      cards.push(...inactive.map((e) => ({ type: 'tile', entity: e, state_content: 'last_changed' })));
    }
    if (cards.length > 0) sections.push({ type: 'grid', cards });
  }

  // Cameras after the device categories (lean cards; the rich blocks
  // live in the CCTV view). The area-grouped mode keeps cameras leading
  // each area block instead.
  const camerasSection = buildCamerasSection(cameraBlocks, cameraViewEnabled);
  if (camerasSection) sections.push(camerasSection);

  return appendTrailingSections(sections);
}

async function generateSecurityView(
  config: { config?: Simon42StrategyConfig },
  hass: HomeAssistant
): Promise<LovelaceViewConfig> {
  // Ensure Registry is initialized (idempotent — no-op if already done)
  Registry.initialize(hass, config.config || {});
  const dashboardConfig = config.config || {};
  const sidebar = buildSecurityActivitySidebar(hass, dashboardConfig);
  // max_columns 3 + column_span 2 sections stack the floor groups under
  // each other in the HA-style layout (matches HA's security panel).
  const grouped = dashboardConfig.group_security_by_areas === true;
  return {
    type: 'sections',
    ...(grouped ? { max_columns: 3 } : {}),
    sections: buildSecuritySections(hass, dashboardConfig),
    ...(sidebar ? { sidebar } : {}),
  };
}

defineViewStrategy('ll-strategy-simon42-view-security', generateSecurityView);
