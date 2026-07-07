// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR ENTITY OPTION HELPERS
// ====================================================================
// Pure helpers building entity option lists for editor pickers.
// Extracted verbatim from StrategyEditor.ts (module split) — the only
// change is `this._hass` becoming an explicit `hass` parameter.
// ====================================================================

import type { HomeAssistant, HassEntity } from '../types/homeassistant';

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

  // Build device-to-area lookup
  const deviceAreaMap = new Map<string, string>();
  devices.forEach((device) => {
    if (device.area_id) {
      deviceAreaMap.set(device.id, device.area_id);
    }
  });

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
  filterWithArea = false,
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
