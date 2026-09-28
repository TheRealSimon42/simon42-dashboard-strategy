// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR ENTITY OPTION HELPERS
// ====================================================================
// Pure helpers building entity option lists for editor pickers.
// Extracted verbatim from StrategyEditor.ts (module split) — the only
// change is `this._hass` becoming an explicit `hass` parameter.
// ====================================================================

import type { HomeAssistant, HassEntity } from '../types/homeassistant';
import { deviceLookupFromRecord, getEffectiveDeviceAreaId } from '../utils/device-utils';

export interface AlarmEntityOption {
  entity_id: string;
  name: string;
}

export interface EntitySelectOption {
  entity_id: string;
  name: string;
  area_id?: string | null;
  device_area_id?: string | null;
}

/** Injection-safe state lookup (see CLAUDE.md Codacy pitfalls). */
export function stateFor(hass: HomeAssistant, entityId: string): HassEntity | undefined {
  return Reflect.get(hass.states, entityId) as HassEntity | undefined;
}

export function getAllEntitiesForSelect(hass: HomeAssistant | null): EntitySelectOption[] {
  if (!hass) return [];

  const entities = Object.values(hass.entities);
  const devices = Object.values(hass.devices);

  // Build device-to-area lookup (child devices inherit their parent's area, HA 2026.9+)
  const lookupDevice = deviceLookupFromRecord(hass.devices);
  const deviceAreaMap = new Map<string, string>();
  for (const device of devices) {
    const effectiveAreaId = getEffectiveDeviceAreaId(device, lookupDevice);
    if (effectiveAreaId) {
      deviceAreaMap.set(device.id, effectiveAreaId);
    }
  }

  return Object.keys(hass.states)
    .map((entityId) => {
      const stateObj = stateFor(hass, entityId);
      const entity = entities.find((e) => e.entity_id === entityId);

      let areaId = entity?.area_id;
      if (!areaId && entity?.device_id) {
        areaId = deviceAreaMap.get(entity.device_id) ?? null;
      }

      return {
        entity_id: entityId,
        name: stateObj?.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' '),
        area_id: areaId,
        device_area_id: areaId,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getAlarmEntities(hass: HomeAssistant | null): AlarmEntityOption[] {
  if (!hass) return [];
  return Object.keys(hass.states)
    .filter((entityId) => entityId.startsWith('alarm_control_panel.'))
    .map((entityId) => {
      const stateObj = stateFor(hass, entityId);
      return {
        entity_id: entityId,
        name: stateObj?.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' '),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** input_select/select helpers for the house-mode picker (#414). */
export function getSelectEntities(hass: HomeAssistant | null): AlarmEntityOption[] {
  if (!hass) return [];
  return Object.keys(hass.states)
    .filter((entityId) => entityId.startsWith('input_select.') || entityId.startsWith('select.'))
    .filter((entityId) => {
      // Device selects are mostly config/diagnostic (camera settings, WLED
      // presets, …) — a house mode is a user-facing control, so hide
      // categorized entities from the picker (same check as #397).
      const registryEntry = Reflect.get(hass.entities, entityId) as { entity_category?: string | null } | undefined;
      return registryEntry?.entity_category !== 'config' && registryEntry?.entity_category !== 'diagnostic';
    })
    .map((entityId) => {
      const stateObj = stateFor(hass, entityId);
      return {
        entity_id: entityId,
        name: stateObj?.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' '),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getWeatherEntities(hass: HomeAssistant | null): AlarmEntityOption[] {
  if (!hass) return [];
  return Object.keys(hass.states)
    .filter((entityId) => entityId.startsWith('weather.'))
    .map((entityId) => {
      const stateObj = stateFor(hass, entityId);
      return {
        entity_id: entityId,
        name: stateObj?.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' '),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Sensor entities reporting power (W / kW). For the optional live power badge. */
export function getPowerSensorEntities(hass: HomeAssistant | null): AlarmEntityOption[] {
  if (!hass) return [];
  return Object.keys(hass.states)
    .filter((entityId) => {
      if (!entityId.startsWith('sensor.')) return false;
      const stateObj = stateFor(hass, entityId);
      const dc = stateObj?.attributes.device_class;
      const unit = stateObj?.attributes.unit_of_measurement;
      return dc === 'power' || unit === 'W' || unit === 'kW';
    })
    .map((entityId) => {
      const stateObj = stateFor(hass, entityId);
      return {
        entity_id: entityId,
        name: stateObj?.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' '),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getFilteredEntities(
  hass: HomeAssistant | null,
  query: string,
  filterWithArea = false
): EntitySelectOption[] {
  if (!hass || query.length < 2) return [];
  const q = query.toLowerCase();
  const all = getAllEntitiesForSelect(hass);
  const filtered = all.filter((entity) => {
    if (filterWithArea && !entity.area_id && !entity.device_area_id) return false;
    return entity.name.toLowerCase().includes(q) || entity.entity_id.toLowerCase().includes(q);
  });
  // Prioritize: exact match > starts-with > contains
  filtered.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aId = a.entity_id.toLowerCase();
    const bId = b.entity_id.toLowerCase();
    const aExact = aName === q || aId === q;
    const bExact = bName === q || bId === q;
    if (aExact !== bExact) return aExact ? -1 : 1;
    const aStarts = aName.startsWith(q) || aId.startsWith(q) || aId.split('.')[1]?.startsWith(q);
    const bStarts = bName.startsWith(q) || bId.startsWith(q) || bId.split('.')[1]?.startsWith(q);
    if (aStarts !== bStarts) return aStarts ? -1 : 1;
    return aName.localeCompare(bName);
  });
  return filtered.slice(0, 21);
}

// -- Devices (maintenance ignore list, #395) ---------------------------

export interface DeviceSelectOption {
  device_id: string;
  name: string;
  /** Secondary line: area and/or model — device ids are opaque to users. */
  detail: string;
}

/**
 * Devices carrying at least one registry entity (a device without
 * entities can never show up as "unavailable"), sorted by name.
 */
export function getAllDevicesForSelect(hass: HomeAssistant | null): DeviceSelectOption[] {
  if (!hass) return [];
  const deviceIdsWithEntities = new Set<string>();
  for (const entity of Object.values(hass.entities)) {
    if (entity.device_id) deviceIdsWithEntities.add(entity.device_id);
  }
  const lookupDevice = deviceLookupFromRecord(hass.devices);
  const options: DeviceSelectOption[] = [];
  for (const device of Object.values(hass.devices)) {
    if (!deviceIdsWithEntities.has(device.id)) continue;
    const areaId = getEffectiveDeviceAreaId(device, lookupDevice);
    const area = areaId ? (Reflect.get(hass.areas, areaId) as { name?: string } | undefined) : undefined;
    const detail = [area?.name, device.model].filter(Boolean).join(' · ') || device.id;
    options.push({ device_id: device.id, name: device.name_by_user || device.name || device.id, detail });
  }
  return options.sort((a, b) => a.name.localeCompare(b.name));
}

/** Search over device name / detail / id — same 2-char minimum and 21-hit cap as the entity picker. */
export function getFilteredDevices(hass: HomeAssistant | null, query: string): DeviceSelectOption[] {
  if (!hass || query.length < 2) return [];
  const q = query.toLowerCase();
  return getAllDevicesForSelect(hass)
    .filter((device) => {
      return (
        device.name.toLowerCase().includes(q) ||
        device.detail.toLowerCase().includes(q) ||
        device.device_id.toLowerCase().includes(q)
      );
    })
    .slice(0, 21);
}
