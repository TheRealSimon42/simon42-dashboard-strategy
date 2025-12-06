// ====================================================================
// DATA COLLECTORS - Sammelt und bereitet Daten auf (REFACTORED)
// ====================================================================
// Nutzt zentrale Entity-Filter-Logik für Konsistenz und Wartbarkeit
// ====================================================================

// Import logger FIRST to ensure it's available for entity-filter
import { logDebug } from './simon42-logger.js';
import { filterStates } from './simon42-entity-filter.js';

/**
 * Erstellt eine Liste aller versteckten Entity-IDs aus areas_options
 * OPTIMIERT: Wird als Set zurückgegeben für O(1) Lookup
 */
function getHiddenEntitiesFromConfig(config) {
  const hiddenEntities = new Set();
  
  if (!config.areas_options) {
    return hiddenEntities;
  }
  
  // Durchlaufe alle Bereiche
  for (const areaOptions of Object.values(config.areas_options)) {
    if (!areaOptions.groups_options) continue;
    
    // Durchlaufe alle Gruppen im Bereich
    for (const groupOptions of Object.values(areaOptions.groups_options)) {
      if (groupOptions.hidden && Array.isArray(groupOptions.hidden)) {
        groupOptions.hidden.forEach(entityId => hiddenEntities.add(entityId));
      }
    }
  }
  
  return hiddenEntities;
}

/**
 * Sammelt alle Personen-Entitäten
 * REFACTORED: Nutzt zentrale filterStates Funktion
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
 * Zählt eingeschaltete Lichter
 * REFACTORED: Nutzt zentrale filterStates Funktion
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
 * Zählt offene Covers
 * REFACTORED: Nutzt zentrale filterStates Funktion
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
 * Zählt unsichere Security-Entitäten
 * REFACTORED: Nutzt zentrale filterStates Funktion mit customFilter
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
    checkCategory: false // Security entities need special handling
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
 * Zählt kritische Batterien (unter 20%)
 * REFACTORED: Nutzt zentrale filterStates Funktion mit customFilter
 * Ignoriert hidden_by (Integration), respektiert aber manuelles hidden
 */
export function collectBatteriesCritical(hass, excludeLabels, config = {}) {
  logDebug('[Data Collector] Collecting critical batteries...');
  const hiddenFromConfig = getHiddenEntitiesFromConfig(config);
  const excludeSet = new Set(excludeLabels);
  
  // Get all states and filter for batteries
  const allStates = Object.values(hass.states || {});
  logDebug('[Data Collector] Checking', allStates.length, 'states for batteries...');
  
  const critical = allStates
    .filter(stateObj => {
      const entityId = stateObj.entity_id;
      if (!entityId) return false;
      
      // 1. Battery-Check (String-includes ist schnell)
      const isBattery = entityId.includes('battery') || 
                       stateObj.attributes?.device_class === 'battery';
      if (!isBattery) return false;
      
      // 2. Registry-Check: Nur manuell versteckte ausschließen (hidden_by wird ignoriert)
      const registryEntry = hass.entities?.[entityId];
      if (registryEntry?.hidden === true) return false;
      
      // 3. Exclude-Checks
      if (excludeSet.has(entityId)) return false;
      if (hiddenFromConfig.has(entityId)) return false;
      
      // 4. Value-Check am Ende
      const value = parseFloat(stateObj.state);
      return !isNaN(value) && value < 20;
    })
    .map(stateObj => stateObj.entity_id);
  logDebug('[Data Collector] Found', critical.length, 'critical batteries');
  return critical;
}

/**
 * Findet eine Weather-Entität
 * REFACTORED: Nutzt zentrale filterStates Funktion
 */
export function findWeatherEntity(hass, excludeLabels, config = {}) {
  logDebug('[Data Collector] Finding weather entity...');
  const hiddenFromConfig = getHiddenEntitiesFromConfig(config);
  
  const weatherStates = filterStates(hass, {
    domain: 'weather',
    excludeLabels: new Set(excludeLabels),
    hiddenFromConfig,
    checkCategory: false // Weather entities don't have category restrictions typically
  });
  
  // Return first weather entity found
  const weatherEntity = weatherStates.length > 0 ? weatherStates[0].entity_id : undefined;
  logDebug('[Data Collector] Weather entity:', weatherEntity || 'none found');
  return weatherEntity;
}

/**
 * Findet eine Dummy-Sensor-Entität für Tile-Cards
 * REFACTORED: Nutzt zentrale filterStates Funktion
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