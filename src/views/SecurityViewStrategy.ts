// ====================================================================
// VIEW STRATEGY — SECURITY (Locks, Doors, Garages, Windows, Smoke/Gas)
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { Simon42StrategyConfig } from '../types/strategy';
import type {
  LovelaceViewConfig,
  LovelaceCardConfig,
  LovelaceSectionConfig,
  LovelaceViewSidebarConfig,
} from '../types/lovelace';
import { Registry } from '../Registry';
import { localize } from '../utils/localize';
import { SECURITY_EXCLUDED_PLATFORMS } from '../utils/entity-filter';
import { getVisibleAreasFromHass } from '../utils/name-utils';
import { collectCameraBlocks, cameraBlockAreaId, leanCameraCard, type CameraBlock } from './CctvViewStrategy';
import { StrategyBaseElement } from './view-strategy-base';

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
      else if (deviceClass && ['smoke', 'gas', 'heat'].includes(deviceClass)) result.smokeGas.push(id);
      else if (deviceClass === 'moisture') result.waterLeak.push(id);
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
];

function resolveAreaId(entityId: string): string | null {
  const entry = Registry.getEntity(entityId);
  if (!entry) return null;
  if (entry.area_id) return entry.area_id;
  if (entry.device_id) return Registry.getDevice(entry.device_id)?.area_id || null;
  return null;
}

/**
 * Alternative layout à la HA's security panel: one section per area
 * (heading taps through to the room view), cameras first, then the
 * security tiles. Entities without an area land in a trailing section.
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

  const push = (areaId: string | null, card: LovelaceCardConfig): void => {
    if (!areaId) {
      unassigned.push(card);
      return;
    }
    const list = cardsByArea.get(areaId) || [];
    list.push(card);
    cardsByArea.set(areaId, list);
  };

  for (const block of cameraBlocks) {
    push(cameraBlockAreaId(block), leanCameraCard(block));
  }
  for (const category of AREA_MODE_CATEGORY_ORDER) {
    for (const id of entities[category]) {
      push(resolveAreaId(id), securityTileCard(id, category));
    }
  }

  const sections: LovelaceSectionConfig[] = [];
  const areas = getVisibleAreasFromHass(hass, dashboardConfig.areas_display, dashboardConfig.use_default_area_sort);
  for (const area of areas) {
    const cards = cardsByArea.get(area.area_id);
    if (!cards || cards.length === 0) continue;
    sections.push({
      type: 'grid',
      cards: [
        {
          type: 'heading',
          heading: area.name,
          heading_style: 'title',
          icon: area.icon || 'mdi:floor-plan',
          tap_action: { action: 'navigate', navigation_path: area.area_id },
        },
        ...cards,
      ],
    });
    cardsByArea.delete(area.area_id);
  }
  // Areas hidden via areas_display fall through to the unassigned bucket
  // ONLY if they still have cards — hidden areas' entities are dropped,
  // matching the areas concept everywhere else in the strategy.
  if (unassigned.length > 0) {
    sections.push({
      type: 'grid',
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

function buildActivitySection(hass: HomeAssistant, dashboardConfig: Simon42StrategyConfig): LovelaceSectionConfig | null {
  if (dashboardConfig.show_security_activity === false) return null;
  if (!hass.config?.components?.includes('logbook')) return null;

  const entities = collectSecurityEntities(hass);
  const logbookEntityIds = [
    ...AREA_MODE_CATEGORY_ORDER.flatMap(function categoryIds(category) {
      return entities[category];
    }),
    ...securityCameraBlocks(hass, dashboardConfig).map(function blockCameraId(block) {
      return block.cameraId;
    }),
    ...Registry.getVisibleEntityIdsForDomain('person'),
  ];
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
        grid_options: { columns: 12 },
      },
    ],
  };
}

/**
 * Activity log as view sidebar (opt-in layout): pinned to the right on
 * wide screens, own tab on narrow ones (sections view sidebar, HA 2026.x —
 * older frontends simply ignore the extra key). Returns undefined in the
 * default section layout. Exported for tests.
 */
export function buildSecurityActivitySidebar(
  hass: HomeAssistant,
  dashboardConfig: Simon42StrategyConfig
): LovelaceViewSidebarConfig | undefined {
  if (dashboardConfig.security_activity_layout !== 'sidebar') return undefined;
  const section = buildActivitySection(hass, dashboardConfig);
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

  const appendTrailingSections = (sections: LovelaceSectionConfig[]): LovelaceSectionConfig[] => {
    const extraSection = buildExtraEntitiesSection(hass, dashboardConfig);
    if (extraSection) sections.push(extraSection);
    if (dashboardConfig.security_activity_layout !== 'sidebar') {
      const activity = buildActivitySection(hass, dashboardConfig);
      if (activity) sections.push(activity);
    }
    return sections;
  };

  if (dashboardConfig.group_security_by_areas === true) {
    return appendTrailingSections(
      buildAreaGroupedSections(hass, dashboardConfig, entities, cameraBlocks)
    );
  }

  const { locks, doors, motorizedWindows, garages, windows, smokeGas, waterLeak } = entities;
  const sections: LovelaceSectionConfig[] = [];

  // Cameras (lean cards; the rich blocks live in the CCTV view)
  const camerasSection = buildCamerasSection(cameraBlocks, cameraViewEnabled);
  if (camerasSection) sections.push(camerasSection);

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

    // Extra entities + optional activity section (both modes, trailing)
    return appendTrailingSections(sections);
}

class Simon42ViewSecurityStrategy extends StrategyBaseElement {
  static async generate(
    config: { config?: Simon42StrategyConfig },
    hass: HomeAssistant
  ): Promise<LovelaceViewConfig> {
    // Ensure Registry is initialized (idempotent — no-op if already done)
    Registry.initialize(hass, config.config || {});
    const dashboardConfig = config.config || {};
    const sidebar = buildSecurityActivitySidebar(hass, dashboardConfig);
    return {
      type: 'sections',
      sections: buildSecuritySections(hass, dashboardConfig),
      ...(sidebar ? { sidebar } : {}),
    };
  }
}

if (typeof customElements !== 'undefined') {
  customElements.define('ll-strategy-simon42-view-security', Simon42ViewSecurityStrategy);
}
