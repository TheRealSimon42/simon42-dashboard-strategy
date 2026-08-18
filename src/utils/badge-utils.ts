// ====================================================================
// BADGE UTILITIES — Shared badge detection, color, and display logic
// ====================================================================
// Single source of truth for badge-related decisions used by both
// RoomViewStrategy (runtime) and the Editor (configuration UI).

import type { HomeAssistant } from '../types/homeassistant';
import type { GroupOptions } from '../types/strategy';

// -- Badge color map (device_class → HA color name) -------------------

export const BADGE_COLOR_MAP: Record<string, string> = {
  temperature: 'red',
  humidity: 'indigo',
  pm1: 'orange',
  pm25: 'orange',
  pm10: 'orange',
  carbon_dioxide: 'green',
  volatile_organic_compounds: 'purple',
  illuminance: 'amber',
  battery: 'red',
  motion: 'yellow',
  occupancy: 'cyan',
  presence: 'cyan',
  moisture: 'blue',
  window: 'teal',
  opening: 'teal',
  door: 'teal',
  smoke: 'red',
  gas: 'red',
  heat: 'red',
  wind_speed: 'blue',
  pressure: 'deep-purple',
  power: 'orange',
  energy: 'orange',
};

/** Whether a binary sensor represents a window-style open/closed contact. */
export function isWindowContactDeviceClass(deviceClass: string | undefined): boolean {
  return deviceClass === 'window' || deviceClass === 'opening';
}

// -- Badge color for a specific entity --------------------------------

/** Get badge color for an entity based on its device_class, with unit fallbacks */
export function getColorForEntity(entityId: string, hass: HomeAssistant): string {
  const state = hass.states[entityId];
  if (!state) return 'grey';
  const dc = state.attributes?.device_class as string | undefined;
  if (dc && BADGE_COLOR_MAP[dc]) return BADGE_COLOR_MAP[dc];
  const unit = state.attributes?.unit_of_measurement as string | undefined;
  if (unit === 'lx') return 'amber';
  if (unit === 'g/m³') return 'blue';
  return 'grey';
}

// -- Energy block routing ---------------------------------------------

/** Sensor device classes that belong to the per-room energy block (ordered — defines section sort order). */
export const ROOM_ENERGY_SENSOR_CLASSES = ['power', 'energy', 'water', 'gas'] as const;

const ROOM_ENERGY_SENSOR_CLASS_SET = new Set<string>(ROOM_ENERGY_SENSOR_CLASSES);

/**
 * Check if a sensor belongs to the room energy block (device_class
 * power/energy/water/gas). The runtime routes these into the energy
 * section BEFORE badge classification and has no badge branch for them,
 * so they can never render as auto-detected badges — the editor must not
 * offer them as badge candidates either (#396). Explicitly picking one
 * via badges.additional remains possible as per-room override.
 */
export function isEnergyBlockSensor(domain: string, deviceClass: string | undefined): boolean {
  return domain === 'sensor' && deviceClass !== undefined && ROOM_ENERGY_SENSOR_CLASS_SET.has(deviceClass);
}

// -- Badge candidate detection ----------------------------------------

/**
 * Check if a sensor/binary_sensor entity qualifies as a badge candidate.
 * Temperature and humidity are excluded (handled by HA area config).
 * Battery detection returns true but threshold check remains with the caller.
 */
export function isBadgeCandidate(
  domain: string,
  deviceClass: string | undefined,
  unit: string | undefined,
  entityId: string
): boolean {
  if (domain === 'sensor') {
    // Battery (caller must check threshold)
    if (deviceClass === 'battery' || entityId.includes('battery')) return true;
    // Soil/plant moisture sensors (e.g. plant.*, soil moisture %). Check before
    // the generic '%'-unit reject below — soil moisture also uses '%' but is
    // semantically distinct from air humidity.
    if (deviceClass === 'moisture') return true;
    // Skip temperature/humidity (handled by HA area config, not auto-detected)
    if (deviceClass === 'temperature' || unit === '°C' || unit === '°F') return false;
    if (deviceClass === 'humidity' || unit === '%') return false;
    // Air quality
    if (deviceClass === 'pm1' || entityId.includes('pm_1') || /(^|_)pm1($|_)/.test(entityId)) return true;
    if (deviceClass === 'pm25' || entityId.includes('pm_2_5') || entityId.includes('pm25')) return true;
    if (deviceClass === 'pm10' || entityId.includes('pm_10') || entityId.includes('pm10')) return true;
    if (deviceClass === 'carbon_dioxide' || entityId.includes('co2')) return true;
    if (deviceClass === 'volatile_organic_compounds' || entityId.includes('voc')) return true;
    // Light / humidity
    if (deviceClass === 'illuminance' || unit === 'lx') return true;
    if (unit === 'g/m³') return true; // absolute humidity
    // Power/energy/water/gas sensors are deliberately NOT candidates:
    // the runtime routes them into the room energy block and has no
    // badge branch for them, so offering them here would present badges
    // that never render (#396). See isEnergyBlockSensor().
    return false;
  }
  if (domain === 'binary_sensor') {
    return (
      deviceClass === 'motion' ||
      deviceClass === 'occupancy' ||
      deviceClass === 'presence' ||
      isWindowContactDeviceClass(deviceClass) ||
      deviceClass === 'door' ||
      deviceClass === 'smoke' ||
      deviceClass === 'gas' ||
      deviceClass === 'heat'
    );
  }
  return false;
}

// -- Badge group options ----------------------------------------------

/** Auto-detected badge candidate before it becomes a Lovelace badge config. */
export interface BadgeCandidate {
  entity: string;
  color: string;
  showName?: boolean;
}

/**
 * Apply the per-area 'badges' group options to the auto-detected candidates:
 * drop deselected badges (badges.hidden) and append manually added entities
 * (badges.additional, only when they have a state).
 *
 * badges.hidden is deliberately NOT part of the Registry's global exclusion
 * set (#396) — deselecting a badge must only remove the badge, not hide the
 * entity in other dashboard sections. This function is the single place
 * where badges.hidden takes effect.
 */
export function applyBadgeGroupOptions(
  candidates: BadgeCandidate[],
  badgeOpts: GroupOptions | undefined,
  hass: HomeAssistant
): BadgeCandidate[] {
  if (!badgeOpts) return candidates;
  let filtered = [...candidates];
  if (badgeOpts.hidden?.length) {
    const hiddenSet = new Set<string>(badgeOpts.hidden);
    filtered = filtered.filter(function notDeselected(candidate) {
      return !hiddenSet.has(candidate.entity);
    });
  }
  if (badgeOpts.additional?.length) {
    for (const entityId of badgeOpts.additional) {
      const hasState = Reflect.get(hass.states, entityId) !== undefined;
      const alreadyListed = filtered.some(function sameEntity(candidate) {
        return candidate.entity === entityId;
      });
      if (hasState && !alreadyListed) {
        filtered.push({ entity: entityId, color: getColorForEntity(entityId, hass) });
      }
    }
  }
  return filtered;
}

// -- Single-type badge selection --------------------------------------

/**
 * Pick which auto-detected sensors of ONE badge type (e.g. illuminance)
 * become badges.
 *
 * Default — the user never touched the type in the editor (badges.hidden
 * contains none of its sensors): exactly the first detected sensor, so
 * areas with many sensors don't get badge spam.
 *
 * Curated — badges.hidden contains at least one sensor of the type: the
 * user's explicit editor selection wins, and EVERY still-selected sensor
 * of the type renders (#396). This also keeps a badge alive when the
 * user deselects the first-detected sensor but leaves another selected.
 */
export function selectBadgeEntitiesOfType(entities: string[], hiddenBadges: ReadonlySet<string>): string[] {
  const first = entities.at(0);
  if (first === undefined) return [];
  const curated = entities.some(function isDeselected(entityId) {
    return hiddenBadges.has(entityId);
  });
  if (!curated) return [first];
  return entities.filter(function isSelected(entityId) {
    return !hiddenBadges.has(entityId);
  });
}

// -- Default show_name ------------------------------------------------

/** Whether a badge with this device_class shows its entity name by default */
export function isDefaultShowName(deviceClass: string | undefined): boolean {
  return isWindowContactDeviceClass(deviceClass) || deviceClass === 'door';
}

// -- Show name resolution ---------------------------------------------

/** Resolve whether a badge should show its entity name (config overrides > defaults) */
export function resolveShowName(
  entityId: string,
  defaultShowName: boolean,
  namesVisible: Set<string> | null | undefined,
  namesHidden: Set<string> | null | undefined
): boolean {
  if (namesHidden?.has(entityId)) return false;
  if (namesVisible?.has(entityId)) return true;
  return defaultShowName;
}
