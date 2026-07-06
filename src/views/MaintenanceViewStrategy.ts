// ====================================================================
// VIEW STRATEGY — MAINTENANCE (Updates, Unavailable Devices, Batteries, Repairs)
// ====================================================================
// Admin-flavoured maintenance view behind the "Wartung" summary tile.
// Mirrors HA's Home strategy: the built-in repairs / updates /
// discovered-devices cards live in a right-hand SIDEBAR (HA >= 2026.3;
// the cards gate themselves to admins and hide when empty), together
// with a HACS quick link. Main content:
//   1. Pending updates as tiles — FALLBACK only for HA < 2026.3
//      (newer frontends get the built-in updates card in the sidebar)
//   2. Critical batteries (heading deep-links to the batteries view)
//   3. Video tips ("Expertentipps", opt-in via show_video_tips)
//   4. Unavailable devices, grouped by area — deliberately last
// Shows a friendly all-clear card when nothing is pending.
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
import { defineViewStrategy } from './view-strategy-base';
import {
  buildMaintenanceScan,
  pendingUpdateIds,
  listUnavailableBlocks,
  criticalBatteryIds,
  haVersionAtLeast,
} from '../utils/maintenance-utils';
import { matchVideoTips, readDismissedTips } from '../utils/video-tips';

// -- Section builders (exported for unit tests) -------------------------

/** Small HACS quick link card — only when the integration is loaded. */
function hacsHintCard(hass: HomeAssistant): LovelaceCardConfig | null {
  if (!hass.config?.components?.includes('hacs')) return null;
  return {
    type: 'markdown',
    content: `🧩 ${localize('maintenance.hacs_hint')}\n\n[${localize('maintenance.hacs_open')}](/hacs)`,
  };
}

/**
 * HA built-in admin cards: repairs + updates + discovered devices, all
 * full width. They hide themselves for non-admins and when empty — but
 * the card TYPES only exist since HA 2026.3, so older frontends get
 * nothing here (an unknown card type would render as a red error card).
 */
export function buildAdminCards(hass: HomeAssistant): LovelaceCardConfig[] {
  if (!haVersionAtLeast(hass, 2026, 3)) return [];
  return [
    {
      type: 'repairs',
      hide_empty: true,
      grid_options: { columns: 'full' },
      tap_action: { action: 'navigate', navigation_path: '/config/repairs?historyBack=1' },
    },
    {
      type: 'updates',
      hide_empty: true,
      grid_options: { columns: 'full' },
      tap_action: { action: 'navigate', navigation_path: '/config/updates?historyBack=1' },
    },
    {
      type: 'discovered-devices',
      hide_empty: true,
      grid_options: { columns: 'full' },
    },
  ];
}

/** Logbook queries get heavy with long entity lists — bound it. */
const MAX_ACTIVITY_ENTITIES = 50;

/**
 * Activity log scoped to exactly the entities this view surfaces:
 * pending updates, unavailable devices (their representative entity)
 * and critical batteries. Opt-out via show_maintenance_activity;
 * auto-hides without the logbook integration or when nothing's wrong.
 */
export function buildMaintenanceActivitySection(
  hass: HomeAssistant,
  config: Simon42StrategyConfig,
  logbookRows?: number
): LovelaceSectionConfig | null {
  if (config.show_maintenance_activity === false) return null;
  if (!hass.config?.components?.includes('logbook')) return null;

  const scan = buildMaintenanceScan(hass, config);
  const criticalThreshold = config.battery_critical_threshold ?? 20;
  const ids = new Set<string>([
    ...pendingUpdateIds(hass, scan),
    ...listUnavailableBlocks(hass, scan).map(function toRepresentative(block) {
      return block.representativeId;
    }),
    ...criticalBatteryIds(hass, scan, criticalThreshold),
  ]);
  if (ids.size === 0) return null;

  return {
    type: 'grid',
    cards: [
      {
        type: 'heading',
        heading: localize('maintenance.activity'),
        heading_style: 'title',
        icon: 'mdi:history',
      },
      {
        type: 'logbook',
        target: { entity_id: [...ids].slice(0, MAX_ACTIVITY_ENTITIES) },
        hours_to_show: 24,
        grid_options: { columns: 12, ...(logbookRows ? { rows: logbookRows } : {}) },
      },
    ],
  };
}

/**
 * Sidebar with the admin cards + HACS link + activity log + video tips —
 * HA-Home-style placement (HA puts repairs/updates/discovered in the
 * overview sidebar too). Only on HA >= 2026.3; older frontends have no
 * built-in cards to show, so everything stays in the main content there.
 */
export function buildMaintenanceSidebar(
  hass: HomeAssistant,
  config: Simon42StrategyConfig
): LovelaceViewSidebarConfig | undefined {
  const adminCards = buildAdminCards(hass);
  if (adminCards.length === 0) return undefined;

  const cards: LovelaceCardConfig[] = [...adminCards];
  const hacsCard = hacsHintCard(hass);
  if (hacsCard) cards.push(hacsCard);

  const sections: LovelaceSectionConfig[] = [{ type: 'grid', cards }];
  const activitySection = buildMaintenanceActivitySection(hass, config, 8);
  if (activitySection) sections.push(activitySection);
  const videoTipsSection = buildVideoTipsSection(hass, config);
  if (videoTipsSection) sections.push(videoTipsSection);

  return {
    sections,
    content_label: localize('maintenance.content_label'),
    sidebar_label: localize('maintenance.sidebar_label'),
  };
}

/**
 * Pending updates as tiles — fallback for HA < 2026.3 where the
 * built-in updates card doesn't exist yet. Auto-hides when empty.
 */
export function buildUpdatesFallbackSection(
  hass: HomeAssistant,
  config: Simon42StrategyConfig
): LovelaceSectionConfig | null {
  const scan = buildMaintenanceScan(hass, config);
  const pending = pendingUpdateIds(hass, scan);
  if (pending.length === 0) return null;

  const cards: LovelaceCardConfig[] = [
    {
      type: 'heading',
      heading_style: 'title',
      heading: localize('sections.maintenance'),
      icon: 'mdi:update',
    },
  ];
  for (const entityId of pending) {
    cards.push({
      type: 'tile',
      entity: entityId,
      vertical: false,
      state_content: ['state', 'installed_version'],
      color: 'orange',
    });
  }
  return { type: 'grid', cards };
}

/** Unavailable devices/entities as tiles with area-prefixed names. */
export function buildUnavailableSection(
  hass: HomeAssistant,
  config: Simon42StrategyConfig
): LovelaceSectionConfig | null {
  const scan = buildMaintenanceScan(hass, config);
  const blocks = listUnavailableBlocks(hass, scan);
  if (blocks.length === 0) return null;

  const cards: LovelaceCardConfig[] = [
    {
      type: 'heading',
      heading: `${localize('maintenance.unavailable')} (${blocks.length})`,
      heading_style: 'title',
      icon: 'mdi:lan-disconnect',
    },
  ];

  for (const block of blocks) {
    cards.push({
      type: 'tile',
      entity: block.representativeId,
      name: block.areaName ? `${block.areaName} • ${block.name}` : block.name,
      vertical: false,
      state_content: 'last_changed',
    });
  }

  return { type: 'grid', cards };
}

/** Critical batteries; heading deep-links to the batteries view when it exists. */
export function buildCriticalBatteriesSection(
  hass: HomeAssistant,
  config: Simon42StrategyConfig
): LovelaceSectionConfig | null {
  const scan = buildMaintenanceScan(hass, config);
  const criticalThreshold = config.battery_critical_threshold ?? 20;
  const critical = criticalBatteryIds(hass, scan, criticalThreshold);
  if (critical.length === 0) return null;

  critical.sort(function byLevel(a, b) {
    const valA = parseFloat((Reflect.get(hass.states, a) as { state?: string } | undefined)?.state ?? '');
    const valB = parseFloat((Reflect.get(hass.states, b) as { state?: string } | undefined)?.state ?? '');
    if (isNaN(valA)) return -1;
    if (isNaN(valB)) return 1;
    return valA - valB;
  });

  const batteriesViewExists =
    config.show_battery_summary !== false || config.show_battery_view === true;

  const cards: LovelaceCardConfig[] = [
    {
      type: 'heading',
      heading: `${localize('maintenance.batteries_critical')} (${critical.length})`,
      heading_style: 'title',
      icon: 'mdi:battery-alert',
      ...(batteriesViewExists
        ? { tap_action: { action: 'navigate', navigation_path: 'batteries' } }
        : {}),
    },
  ];

  for (const entityId of critical) {
    cards.push({
      type: 'tile',
      entity: entityId,
      vertical: false,
      state_content: ['state', 'last_changed'],
      color: 'red',
    });
  }

  return { type: 'grid', cards };
}

/**
 * "Expertentipps" — curated simon42 videos matched to the installed
 * integrations. Default ON (opt-out via show_video_tips: false), max 3
 * at once, each dismissable ("seen" — stored per browser in
 * localStorage; dismissed tips are skipped on the next generate).
 */
export function buildVideoTipsSection(
  hass: HomeAssistant,
  config: Simon42StrategyConfig
): LovelaceSectionConfig | null {
  if (config.show_video_tips === false) return null;
  const tips = matchVideoTips(hass, readDismissedTips());
  if (tips.length === 0) return null;

  const cards: LovelaceCardConfig[] = [
    {
      type: 'heading',
      heading: localize('maintenance.video_tips'),
      heading_style: 'title',
      icon: 'mdi:school-outline',
    },
  ];
  for (const tip of tips) {
    cards.push({
      type: 'custom:simon42-video-tip-card',
      tip_id: tip.id,
      title: tip.title,
      url: tip.url,
      grid_options: { columns: 'full' },
    });
  }
  return { type: 'grid', cards };
}

export function buildMaintenanceView(
  hass: HomeAssistant,
  config: Simon42StrategyConfig
): LovelaceViewConfig {
  const sidebar = buildMaintenanceSidebar(hass, config);
  const sections: LovelaceSectionConfig[] = [];

  // Updates tiles only when the sidebar (built-in updates card) is not
  // available — otherwise updates would show up twice for admins.
  if (!sidebar) {
    const updatesSection = buildUpdatesFallbackSection(hass, config);
    if (updatesSection) sections.push(updatesSection);
  }

  const batteriesSection = buildCriticalBatteriesSection(hass, config);
  if (batteriesSection) sections.push(batteriesSection);

  // Unavailable devices deliberately LAST — usually the longest list
  const unavailableSection = buildUnavailableSection(hass, config);
  if (unavailableSection) sections.push(unavailableSection);

  // All clear? Friendly empty state instead of a blank main column.
  // Video tips don't count as maintenance content here.
  if (sections.length === 0) {
    sections.push({
      type: 'grid',
      cards: [
        {
          type: 'markdown',
          content: `✅ ${localize('maintenance.all_ok')}`,
        },
      ],
    });
  }

  // Without the sidebar, activity + video tips + HACS link trail the
  // main content
  if (!sidebar) {
    const activitySection = buildMaintenanceActivitySection(hass, config);
    if (activitySection) sections.push(activitySection);
    const videoTipsSection = buildVideoTipsSection(hass, config);
    if (videoTipsSection) sections.push(videoTipsSection);
    const hacsCard = hacsHintCard(hass);
    if (hacsCard) sections.push({ type: 'grid', cards: [hacsCard] });
  }

  return {
    type: 'sections',
    max_columns: 2,
    sections,
    ...(sidebar ? { sidebar } : {}),
  };
}

// -- Strategy element ----------------------------------------------------

async function generateMaintenanceView(
  config: { config?: Simon42StrategyConfig },
  hass: HomeAssistant
): Promise<LovelaceViewConfig> {
  // Ensure Registry is initialized (idempotent — no-op if already done)
  Registry.initialize(hass, config.config || {});
  return buildMaintenanceView(hass, config.config || {});
}

defineViewStrategy('ll-strategy-simon42-view-maintenance', generateMaintenanceView);
