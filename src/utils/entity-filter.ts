// ====================================================================
// ENTITY FILTER — Central entity filtering utilities
// ====================================================================
// Uses Registry for pre-computed exclusion sets and Maps.
// Replaces the scattered filtering logic from data-collectors.js.
// ====================================================================

import { Registry } from '../Registry';
import type { HomeAssistant } from '../types/homeassistant';
import type { Simon42StrategyConfig, PersonData } from '../types/strategy';

/**
 * Collects person entities with home/away state.
 * Uses pre-filtered Registry method — no manual exclusion checks needed.
 */
export function collectPersons(hass: HomeAssistant, _config: Simon42StrategyConfig): PersonData[] {
  const personIds = Registry.getVisibleEntityIdsForDomain('person');

  return personIds
    .filter((id) => !!hass.states[id])
    .map((id) => {
      const state = hass.states[id];
      return {
        entity_id: id,
        name: state.attributes?.friendly_name || id.split('.')[1],
        state: state.state,
        isHome: state.state === 'home',
      };
    });
}

/**
 * Finds the first available weather entity.
 * Uses pre-filtered Registry method — no manual exclusion checks needed.
 */
export function findWeatherEntity(hass: HomeAssistant): string | undefined {
  const weatherIds = Registry.getVisibleEntityIdsForDomain('weather');
  return weatherIds.find((id) => !!hass.states[id]);
}

/**
 * Finds a dummy sensor entity for tile card color rendering.
 * Uses pre-filtered Registry method — no manual exclusion checks needed.
 * Cached per call — should only be called once per generate().
 */
export function findDummySensor(hass: HomeAssistant): string {
  const sensorIds = Registry.getVisibleEntityIdsForDomain('sensor');
  for (const id of sensorIds) {
    const state = hass.states[id];
    if (!state) continue;
    if (state.state === 'unavailable' || state.state === 'unknown') continue;
    return id;
  }
  // Fallback: try any visible light
  const lightIds = Registry.getVisibleEntityIdsForDomain('light');
  for (const id of lightIds) {
    const state = hass.states[id];
    if (state) return id;
  }
  return 'sun.sun';
}


/**
 * Platforms that create binary_sensor entities with security-like device_classes
 * (opening, door, window) but are NOT actual physical security sensors.
 * Excluded from SecurityView and security SummaryCard count.
 */
export const SECURITY_EXCLUDED_PLATFORMS = new Set(['tankerkoenig']);

export function getBatteryEntities(hass: HomeAssistant, config: Simon42StrategyConfig): string[] {
  const sensorIds = Registry.getEntityIdsForDomain('sensor');
  const binarySensorIds = Registry.getEntityIdsForDomain('binary_sensor');

  // Filter battery entities — exclude hidden/no_dboard but keep diagnostic
  const batteryEntities = [...sensorIds, ...binarySensorIds].filter((entityId) => {
    const state = hass.states[entityId];
    if (!state) return false;

    // Exclude hidden and no_dboard entities (but NOT diagnostic — batteries are often diagnostic)
    if (Registry.isExcludedByLabel(entityId)) return false;
    if (Registry.isHiddenByConfig(entityId)) return false;

    const entry = Registry.getEntity(entityId);
    if (entry?.hidden) return false;
    // Platform-specific filter: hide mobile_app batteries if configured
    if (config.hide_mobile_app_batteries) {
      if (entry?.platform === 'mobile_app') return false;
    }

    if (entityId.startsWith('binary_sensor.') && entityId.includes('battery')) return true;
    if (state.attributes?.device_class === 'battery' && state.attributes?.unit_of_measurement === '%') return true;
    return false;
  });

  // Deduplication: remove binary_sensor if %-sensor exists on same device
  const sensorDeviceIds = new Set<string>();
  for (const id of batteryEntities) {
    if (id.startsWith('sensor.')) {
      const deviceId = hass.entities[id]?.device_id;
      if (deviceId) sensorDeviceIds.add(deviceId);
    }
  }

  return batteryEntities.filter((id) => {
    if (!id.startsWith('binary_sensor.')) return true;
    const deviceId = hass.entities[id]?.device_id;
    return !deviceId || !sensorDeviceIds.has(deviceId);
  })
}
