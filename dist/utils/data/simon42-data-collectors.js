// ====================================================================
// DATA COLLECTORS - Collects and prepares entity data
// ====================================================================
// Uses centralized entity filter logic for consistency and maintainability
// ====================================================================

import { logDebug } from '../system/simon42-logger.js';
import { filterStates } from '../filters/simon42-entity-filter.js';
// Re-export config extractors for backward compatibility
export { getHiddenEntitiesFromConfig } from '../config/simon42-config-extractors.js';

/**
 * Collects all person entities
 * @param {Object} hass - Home Assistant object
 * @param {Array<string>} excludeLabels - Entity IDs to exclude
 * @param {Object} config - Dashboard configuration
 * @returns {Array<Object>} Array of person objects with entity_id, name, state, isHome
 */
export function collectPersons(hass, excludeLabels, config = {}) {
  logDebug('[Data Collector] Collecting persons...');
  const hiddenFromConfig = getHiddenEntitiesFromConfig(config);
  
  const persons = filterStates(hass, {
    domain: 'person',
    excludeLabels: new Set(excludeLabels),
    hiddenFromConfig,
    checkCategory: false // Persons don't have category restrictions
  }).map(state => ({
    entity_id: state.entity_id,
    name: state.attributes?.friendly_name || state.entity_id.split('.')[1],
    state: state.state,
    isHome: state.state === 'home'
  }));
  logDebug('[Data Collector] Found', persons.length, 'persons');
  return persons;
}

/**
 * Collects all lights that are currently on
 * @param {Object} hass - Home Assistant object
 * @param {Array<string>} excludeLabels - Entity IDs to exclude
 * @param {Object} config - Dashboard configuration
 * @returns {Array<Object>} Array of light state objects
 */
export function collectLights(hass, excludeLabels, config = {}) {
  logDebug('[Data Collector] Collecting lights...');
  const hiddenFromConfig = getHiddenEntitiesFromConfig(config);
  
  const lights = filterStates(hass, {
    domain: 'light',
    state: 'on',
    excludeLabels: new Set(excludeLabels),
    hiddenFromConfig
  });
  logDebug('[Data Collector] Found', lights.length, 'lights on');
  return lights;
}

/**
 * Collects all covers that are open or opening
 * @param {Object} hass - Home Assistant object
 * @param {Array<string>} excludeLabels - Entity IDs to exclude
 * @param {Object} config - Dashboard configuration
 * @returns {Array<Object>} Array of cover state objects
 */
export function collectCovers(hass, excludeLabels, config = {}) {
  logDebug('[Data Collector] Collecting covers...');
  const hiddenFromConfig = getHiddenEntitiesFromConfig(config);
  
  const covers = filterStates(hass, {
    domain: 'cover',
    state: ['open', 'opening'],
    excludeLabels: new Set(excludeLabels),
    hiddenFromConfig
  });
  logDebug('[Data Collector] Found', covers.length, 'covers open');
  return covers;
}

/**
 * Collects all unsafe security entities (unlocked locks, open doors/windows)
 * @param {Object} hass - Home Assistant object
 * @param {Array<string>} excludeLabels - Entity IDs to exclude
 * @param {Object} config - Dashboard configuration
 * @returns {Array<string>} Array of unsafe security entity IDs
 */
export function collectSecurityUnsafe(hass, excludeLabels, config = {}) {
  logDebug('[Data Collector] Collecting security entities...');
  const hiddenFromConfig = getHiddenEntitiesFromConfig(config);
  const excludeSet = new Set(excludeLabels);
  
  // Filter by domain first, then apply security-specific logic
  const allSecurityStates = filterStates(hass, {
    domain: ['lock', 'cover', 'binary_sensor'],
    excludeLabels: excludeSet,
    hiddenFromConfig,
    checkCategory: false
  });
  logDebug('[Data Collector] Found', allSecurityStates.length, 'security entities, filtering unsafe...');
  
  const unsafe = allSecurityStates
    .filter(stateObj => {
      const entityId = stateObj.entity_id;
      const state = stateObj.state;
      
      // Locks: unlocked = unsafe
      if (entityId.startsWith('lock.') && state === 'unlocked') {
        return true;
      }
      
      // Covers: open doors/garages/gates = unsafe
      if (entityId.startsWith('cover.')) {
        const deviceClass = stateObj.attributes?.device_class;
        if (['door', 'garage', 'gate'].includes(deviceClass) && state === 'open') {
          return true;
        }
      }
      
      // Binary sensors: on = unsafe (doors/windows open)
      if (entityId.startsWith('binary_sensor.')) {
        const deviceClass = stateObj.attributes?.device_class;
        if (['door', 'window', 'garage_door', 'opening'].includes(deviceClass) && state === 'on') {
          return true;
        }
      }
      
      return false;
    })
    .map(stateObj => stateObj.entity_id);
  logDebug('[Data Collector] Found', unsafe.length, 'unsafe security entities');
  return unsafe;
}

/**
 * Collects all batteries with charge level below 20%
 * Ignores hidden_by (integration), but respects manual hidden flag
 * @param {Object} hass - Home Assistant object
 * @param {Array<string>} excludeLabels - Entity IDs to exclude
 * @param {Object} config - Dashboard configuration
 * @returns {Array<string>} Array of critical battery entity IDs
 */
export function collectBatteriesCritical(hass, excludeLabels, config = {}) {
  logDebug('[Data Collector] Collecting critical batteries...');
  const hiddenFromConfig = getHiddenEntitiesFromConfig(config);
  const excludeSet = new Set(excludeLabels);
  
  const allStates = Object.values(hass.states || {});
  logDebug('[Data Collector] Checking', allStates.length, 'states for batteries...');
  
  const critical = allStates
    .filter(stateObj => {
      const entityId = stateObj.entity_id;
      if (!entityId) return false;
      
      // Check if entity is a battery (string includes is fast)
      const isBattery = entityId.includes('battery') || 
                       stateObj.attributes?.device_class === 'battery';
      if (!isBattery) return false;
      
      // Registry check: only exclude manually hidden (hidden_by is ignored)
      const registryEntry = hass.entities?.[entityId];
      if (registryEntry?.hidden === true) return false;
      
      // Exclude checks
      if (excludeSet.has(entityId)) return false;
      if (hiddenFromConfig.has(entityId)) return false;
      
      // Value check: battery level below 20%
      const value = parseFloat(stateObj.state);
      return !isNaN(value) && value < 20;
    })
    .map(stateObj => stateObj.entity_id);
  logDebug('[Data Collector] Found', critical.length, 'critical batteries');
  return critical;
}

/**
 * Finds the first available weather entity
 * @param {Object} hass - Home Assistant object
 * @param {Array<string>} excludeLabels - Entity IDs to exclude
 * @param {Object} config - Dashboard configuration
 * @returns {string|undefined} Weather entity ID or undefined if not found
 */
export function findWeatherEntity(hass, excludeLabels, config = {}) {
  logDebug('[Data Collector] Finding weather entity...');
  const hiddenFromConfig = getHiddenEntitiesFromConfig(config);
  
  const weatherStates = filterStates(hass, {
    domain: 'weather',
    excludeLabels: new Set(excludeLabels),
    hiddenFromConfig,
    checkCategory: false
  });
  
  const weatherEntity = weatherStates.length > 0 ? weatherStates[0].entity_id : undefined;
  logDebug('[Data Collector] Weather entity:', weatherEntity || 'none found');
  return weatherEntity;
}

/**
 * Finds a dummy sensor entity for tile cards
 * Tries sensor first, falls back to light, then sun.sun
 * @param {Object} hass - Home Assistant object
 * @param {Array<string>} excludeLabels - Entity IDs to exclude
 * @param {Object} config - Dashboard configuration
 * @returns {string} Entity ID to use for tile cards
 */
export function findDummySensor(hass, excludeLabels, config = {}) {
  logDebug('[Data Collector] Finding dummy sensor...');
  const hiddenFromConfig = getHiddenEntitiesFromConfig(config);
  const excludeSet = new Set(excludeLabels);
  
  // Try to find a sensor first (filter out unavailable/unknown states)
  const sensorStates = filterStates(hass, {
    domain: 'sensor',
    excludeLabels: excludeSet,
    hiddenFromConfig
  }).filter(stateObj => 
    stateObj.state !== 'unavailable' && stateObj.state !== 'unknown'
  );
  logDebug('[Data Collector] Found', sensorStates.length, 'available sensors');
  
  if (sensorStates.length > 0) {
    return sensorStates[0].entity_id;
  }
  
  // Fallback to light
  const lightStates = filterStates(hass, {
    domain: 'light',
    excludeLabels: excludeSet,
    hiddenFromConfig
  });
  
  return lightStates.length > 0 ? lightStates[0].entity_id : 'sun.sun';
}