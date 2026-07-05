// ====================================================================
// VIEW STRATEGY — MAINTENANCE (Updates, Unavailable Devices, Batteries, Repairs)
// ====================================================================
// Admin-flavoured maintenance view behind the "Wartung" summary tile.
// Mirrors the spirit of HA's own maintenance panel + the repairs/updates
// cards on the Home strategy overview:
//   1. HA built-in repairs + discovered-devices cards (HA >= 2026.3;
//      they gate themselves to admins and hide when empty)
//   2. Pending updates (same tiles as the overview maintenance section)
//   3. Unavailable devices, grouped by area
//   4. Critical batteries (heading deep-links to the batteries view)
//   5. HACS quick link when the integration is installed
// Shows a friendly all-clear card when nothing is pending.
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { Simon42StrategyConfig } from '../types/strategy';
import type { LovelaceViewConfig, LovelaceCardConfig, LovelaceSectionConfig } from '../types/lovelace';
import { Registry } from '../Registry';
import { localize } from '../utils/localize';
import { createMaintenanceSection } from '../sections/MaintenanceSection';
import { defineViewStrategy } from './view-strategy-base';
import {
  buildMaintenanceScan,
  listUnavailableBlocks,
  criticalBatteryIds,
  haVersionAtLeast,
} from '../utils/maintenance-utils';

// -- Section builders (exported for unit tests) -------------------------

/**
 * HA built-in admin cards: repairs + discovered devices. Both hide
 * themselves for non-admins and when empty — but the card TYPES only
 * exist since HA 2026.3, so older frontends get no section at all
 * (an unknown card type would render as a red error card).
 */
export function buildAdminCardsSection(hass: HomeAssistant): LovelaceSectionConfig | null {
  if (!haVersionAtLeast(hass, 2026, 3)) return null;
  return {
    type: 'grid',
    cards: [
      {
        type: 'repairs',
        hide_empty: true,
        tap_action: { action: 'navigate', navigation_path: '/config/repairs?historyBack=1' },
      },
      {
        type: 'discovered-devices',
        hide_empty: true,
      },
    ],
  };
}

/** Unavailable devices/entities as grey tiles with area-prefixed names. */
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

/** Small HACS quick link — only when the integration is loaded. */
export function buildHacsHintSection(hass: HomeAssistant): LovelaceSectionConfig | null {
  if (!hass.config?.components?.includes('hacs')) return null;
  return {
    type: 'grid',
    cards: [
      {
        type: 'markdown',
        content: `🧩 ${localize('maintenance.hacs_hint')}\n\n[${localize('maintenance.hacs_open')}](/hacs)`,
      },
    ],
  };
}

export function buildMaintenanceView(
  hass: HomeAssistant,
  config: Simon42StrategyConfig
): LovelaceViewConfig {
  const sections: LovelaceSectionConfig[] = [];

  // Pending updates — same builder as the overview's maintenance section
  // (auto-hides when nothing is pending)
  const updatesSection = createMaintenanceSection(hass, true, false);
  if (updatesSection) sections.push(updatesSection);

  const unavailableSection = buildUnavailableSection(hass, config);
  if (unavailableSection) sections.push(unavailableSection);

  const batteriesSection = buildCriticalBatteriesSection(hass, config);
  if (batteriesSection) sections.push(batteriesSection);

  // All clear? Friendly empty state instead of a blank view. The admin
  // cards don't count here — they self-hide and are empty most of the time.
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

  // Repairs / discovered devices on top — like HA's home overview
  const adminSection = buildAdminCardsSection(hass);
  if (adminSection) sections.unshift(adminSection);

  const hacsSection = buildHacsHintSection(hass);
  if (hacsSection) sections.push(hacsSection);

  return { type: 'sections', max_columns: 2, sections };
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
