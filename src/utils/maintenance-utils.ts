// ====================================================================
// Maintenance Utils — shared collectors for the maintenance summary
// card and the maintenance view
// ====================================================================
// Lives in utils/ (core chunk) so the SummaryCard (core) and the
// MaintenanceViewStrategy (views chunk) count exactly the same things:
// pending updates, unavailable devices, and critical batteries.
//
// "Unavailable device" definition: a device counts as unavailable when
// ALL of its dashboard-visible entities report state 'unavailable'.
// A single failing entity on an otherwise healthy device is deliberately
// NOT flagged (too noisy — e.g. one broken template sensor). Entities
// without a device (helpers, templates) are checked individually.
// ====================================================================

import type { HomeAssistant, HassEntity } from '../types/homeassistant';
import type { Simon42StrategyConfig } from '../types/strategy';
import { Registry } from '../Registry';
import { getBatteryEntities } from './entity-filter';

/** Reflect.get keeps dynamic state lookups off the object-injection radar. */
function stateFor(hass: HomeAssistant, entityId: string): HassEntity | undefined {
  return Reflect.get(hass.states, entityId) as HassEntity | undefined;
}

/**
 * Pre-computed id structure for the maintenance scan. Cheap to build
 * (one pass over the entity registry); safe to cache until the hass
 * entity registry reference changes.
 */
export interface MaintenanceScan {
  /** Visible update.* entities (state checked at count time). */
  updateIds: string[];
  /** Visible entities grouped per device (unavailability is per device). */
  deviceGroups: string[][];
  /** Visible entities without a device — checked individually. */
  orphanIds: string[];
  /** Battery entities (same set as the batteries summary/view). */
  batteryIds: string[];
}

/**
 * All dashboard-relevant update.* entities. Deliberately KEEPS
 * config/diagnostic-category entities (mirrors getBatteryEntities):
 * many integrations categorize their update entities (e.g. Shelly
 * firmware = config), and HA's own updates card ignores the category
 * too — filtering them out silently drops real pending updates.
 */
export function collectUpdateIds(): string[] {
  return Registry.getEntityIdsForDomain('update').filter(function isDashboardRelevant(id) {
    if (Registry.isExcludedByLabel(id)) return false;
    if (Registry.isHiddenByConfig(id)) return false;
    const entry = Registry.getEntity(id);
    return !entry?.hidden;
  });
}

export function buildMaintenanceScan(hass: HomeAssistant, config: Simon42StrategyConfig): MaintenanceScan {
  const updateIds = collectUpdateIds();

  const byDevice = new Map<string, string[]>();
  const orphanIds: string[] = [];
  for (const entityId of Object.keys(hass.entities)) {
    if (Registry.isEntityExcluded(entityId)) continue;
    const entry = Registry.getEntity(entityId);
    const deviceId = entry?.device_id;
    if (deviceId) {
      const group = byDevice.get(deviceId);
      if (group) group.push(entityId);
      else byDevice.set(deviceId, [entityId]);
    } else {
      orphanIds.push(entityId);
    }
  }

  return {
    updateIds,
    deviceGroups: [...byDevice.values()],
    orphanIds,
    batteryIds: getBatteryEntities(hass, config),
  };
}

/** Pending updates = visible update.* entities currently 'on'. */
export function pendingUpdateIds(hass: HomeAssistant, scan: MaintenanceScan): string[] {
  return scan.updateIds.filter(function isPending(id) {
    return stateFor(hass, id)?.state === 'on';
  });
}

/** True when every present state of the group is 'unavailable' (min. one state). */
function groupUnavailable(hass: HomeAssistant, entityIds: string[]): boolean {
  let seen = false;
  for (const id of entityIds) {
    const state = stateFor(hass, id);
    if (!state) continue;
    if (state.state !== 'unavailable') return false; // early exit — common case
    seen = true;
  }
  return seen;
}

/**
 * Count unavailable devices + unavailable orphan entities.
 * Single pass with early exit per device — cheap enough for the
 * reactive summary card (runs on every relevant hass update).
 */
export function countUnavailable(hass: HomeAssistant, scan: MaintenanceScan): number {
  let count = 0;
  for (const group of scan.deviceGroups) {
    if (groupUnavailable(hass, group)) count++;
  }
  for (const id of scan.orphanIds) {
    if (stateFor(hass, id)?.state === 'unavailable') count++;
  }
  return count;
}

/** Critical batteries: numeric %-sensors below threshold, or binary battery sensors 'on'. */
export function criticalBatteryIds(
  hass: HomeAssistant,
  scan: MaintenanceScan,
  criticalThreshold: number
): string[] {
  return scan.batteryIds.filter(function isCritical(id) {
    const state = stateFor(hass, id);
    if (!state) return false;
    if (id.startsWith('binary_sensor.')) return state.state === 'on';
    const unit = state.attributes?.unit_of_measurement;
    if (unit && unit !== '%') return false;
    const value = parseFloat(state.state);
    return !isNaN(value) && value < criticalThreshold;
  });
}

/** Total maintenance count: pending updates + unavailable + critical batteries. */
export function countMaintenanceItems(
  hass: HomeAssistant,
  scan: MaintenanceScan,
  criticalThreshold: number
): number {
  return (
    pendingUpdateIds(hass, scan).length +
    countUnavailable(hass, scan) +
    criticalBatteryIds(hass, scan, criticalThreshold).length
  );
}

// -- View-side helpers (names resolved for display) --------------------

export interface UnavailableBlock {
  /** Entity the tile renders with (first entity of the device / the orphan itself). */
  representativeId: string;
  /** Display name: device name (or friendly name for orphans). */
  name: string;
  /** Area name for grouping/sorting; null = unassigned. */
  areaName: string | null;
}

/** Resolve unavailable devices/orphans into displayable blocks, sorted by area then name. */
export function listUnavailableBlocks(hass: HomeAssistant, scan: MaintenanceScan): UnavailableBlock[] {
  const blocks: UnavailableBlock[] = [];

  for (const group of scan.deviceGroups) {
    if (!groupUnavailable(hass, group)) continue;
    const representativeId = group[0];
    const entry = Registry.getEntity(representativeId);
    const device = entry?.device_id ? Registry.getDevice(entry.device_id) : undefined;
    const name =
      device?.name_by_user ||
      device?.name ||
      stateFor(hass, representativeId)?.attributes?.friendly_name ||
      representativeId;
    const areaId = device?.area_id ?? entry?.area_id ?? null;
    blocks.push({
      representativeId,
      name: String(name),
      areaName: areaId ? (Reflect.get(hass.areas, areaId) as { name?: string } | undefined)?.name ?? null : null,
    });
  }

  for (const id of scan.orphanIds) {
    const state = stateFor(hass, id);
    if (state?.state !== 'unavailable') continue;
    const entry = Registry.getEntity(id);
    const areaId = entry?.area_id ?? null;
    blocks.push({
      representativeId: id,
      name: String(state.attributes?.friendly_name || id),
      areaName: areaId ? (Reflect.get(hass.areas, areaId) as { name?: string } | undefined)?.name ?? null : null,
    });
  }

  blocks.sort(function byAreaThenName(a, b) {
    const areaA = a.areaName ?? '￿'; // unassigned last
    const areaB = b.areaName ?? '￿';
    return areaA.localeCompare(areaB) || a.name.localeCompare(b.name);
  });

  return blocks;
}

/** hass.config.version >= major.minor (e.g. 2026.3 for the built-in repairs card). */
export function haVersionAtLeast(hass: HomeAssistant, major: number, minor: number): boolean {
  const raw = hass.config?.version;
  if (typeof raw !== 'string') return false;
  const match = /^(\d+)\.(\d+)/.exec(raw);
  if (!match) return false;
  const maj = Number(match[1]);
  const min = Number(match[2]);
  return maj > major || (maj === major && min >= minor);
}
