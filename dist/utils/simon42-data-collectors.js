// ====================================================================
// DATA COLLECTORS - Sammelt und bereitet Daten auf (OPTIMIERT)
// ====================================================================

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
 * OPTIMIERT: Domain-Filter zuerst, dann Exclude-Checks
 */
export function collectPersons(hass, excludeLabels, config = {}) {
  const hiddenFromConfig = getHiddenEntitiesFromConfig(config);
  const excludeSet = new Set(excludeLabels);
  
  return Object.values(hass.states)
    .filter(state => {
      const id = state.entity_id;
      
      // 1. Domain-Check zuerst
      if (!id.startsWith('person.')) return false;
      
      // 2. Exclude-Checks (Set-Lookup = O(1))
      if (excludeSet.has(id)) return false;
      if (hiddenFromConfig.has(id)) return false;
      
      return true;
    })
    .map(state => ({
      entity_id: state.entity_id,
      name: state.attributes?.friendly_name || state.entity_id.split('.')[1],
      state: state.state,
      isHome: state.state === 'home'
    }));
}

/**
 * Zählt eingeschaltete Lichter
 * OPTIMIERT: Domain + State-Check kombiniert, dann Exclude-Checks
 */
export function collectLights(hass, excludeLabels, config = {}) {
  const hiddenFromConfig = getHiddenEntitiesFromConfig(config);
  const excludeSet = new Set(excludeLabels);
  
  return Object.values(hass.states)
    .filter(state => {
      const id = state.entity_id;
      
      // 1. Domain + State-Check kombiniert (reduziert massiv)
      if (!id.startsWith('light.')) return false;
      if (state.state !== 'on') return false;
      
      // 2. Exclude-Checks
      if (excludeSet.has(id)) return false;
      if (hiddenFromConfig.has(id)) return false;
      
      // 3. Category-Checks am Ende
      if (state.attributes?.entity_category === 'config') return false;
      if (state.attributes?.entity_category === 'diagnostic') return false;
      
      return true;
    });
}

/**
 * Zählt offene Covers
 * OPTIMIERT: Domain + State-Check kombiniert
 */
export function collectCovers(hass, excludeLabels, config = {}) {
  const hiddenFromConfig = getHiddenEntitiesFromConfig(config);
  const excludeSet = new Set(excludeLabels);
  
  return Object.values(hass.states)
    .filter(state => {
      const id = state.entity_id;
      
      // 1. Domain-Check zuerst
      if (!id.startsWith('cover.')) return false;
      
      // 2. State-Check früh (filtert viele raus)
      if (!['open', 'opening'].includes(state.state)) return false;
      
      // 3. Exclude-Checks
      if (excludeSet.has(id)) return false;
      if (hiddenFromConfig.has(id)) return false;
      
      // 4. Category-Checks am Ende
      if (state.attributes?.entity_category === 'config') return false;
      if (state.attributes?.entity_category === 'diagnostic') return false;
      
      return true;
    });
}

/**
 * Zählt unsichere Security-Entitäten
 * OPTIMIERT: Domain-Checks zuerst, dann State-Validierung
 */
export function collectSecurityUnsafe(hass, excludeLabels, config = {}) {
  const hiddenFromConfig = getHiddenEntitiesFromConfig(config);
  const excludeSet = new Set(excludeLabels);
  
  return Object.keys(hass.states)
    .filter(entityId => {
      const state = hass.states[entityId];
      if (!state) return false;
      
      // 1. Domain-Pre-Filter (nur relevante Domains)
      const isLock = entityId.startsWith('lock.');
      const isCover = entityId.startsWith('cover.');
      const isBinarySensor = entityId.startsWith('binary_sensor.');
      
      if (!isLock && !isCover && !isBinarySensor) return false;
      
      // 2. Exclude-Checks
      if (excludeSet.has(entityId)) return false;
      if (hiddenFromConfig.has(entityId)) return false;
      
      // 3. State + Device-Class-Checks (nur für relevante Domains)
      if (isLock && state.state === 'unlocked') return true;
      
      if (isCover) {
        const deviceClass = state.attributes?.device_class;
        if (['door', 'garage', 'gate'].includes(deviceClass) && state.state === 'open') {
          return true;
        }
      }
      
      if (isBinarySensor) {
        const deviceClass = state.attributes?.device_class;
        if (['door', 'window', 'garage_door', 'opening'].includes(deviceClass) && state.state === 'on') {
          return true;
        }
      }
      
      return false;
    });
}

/**
 * Zählt kritische Batterien (unter 20%)
 * OPTIMIERT: Battery-ID-Check zuerst, dann Exclude-Checks
 * Ignoriert hidden_by (Integration), respektiert aber manuelles hidden
 */
export function collectBatteriesCritical(hass, excludeLabels, config = {}) {
  const hiddenFromConfig = getHiddenEntitiesFromConfig(config);
  const excludeSet = new Set(excludeLabels);
  
  return Object.keys(hass.states)
    .filter(entityId => {
      const state = hass.states[entityId];
      if (!state) return false;
      
      // 1. Battery-Check zuerst (String-includes ist schnell)
      const isBattery = entityId.includes('battery') || 
                       state.attributes?.device_class === 'battery';
      if (!isBattery) return false;
      
      // 2. Registry-Check: Nur manuell versteckte ausschließen (hidden_by wird ignoriert)
      const registryEntry = hass.entities?.[entityId];
      if (registryEntry?.hidden === true) return false;
      
      // 3. Exclude-Checks
      if (excludeSet.has(entityId)) return false;
      if (hiddenFromConfig.has(entityId)) return false;
      
      // 4. Value-Check am Ende
      const value = parseFloat(state.state);
      return !isNaN(value) && value < 20;
    });
}

/**
 * Findet eine Weather-Entität
 * OPTIMIERT: Domain-Check zuerst, dann Validierung
 */
export function findWeatherEntity(hass, excludeLabels, config = {}) {
  const hiddenFromConfig = getHiddenEntitiesFromConfig(config);
  const excludeSet = new Set(excludeLabels);
  
  return Object.keys(hass.states).find(entityId => {
    // 1. Domain-Check zuerst
    if (!entityId.startsWith('weather.')) return false;
    
    // 2. Exclude-Checks
    if (excludeSet.has(entityId)) return false;
    if (hiddenFromConfig.has(entityId)) return false;
    
    const state = hass.states[entityId];
    if (!state) return false;
    
    // 3. Category-Check am Ende
    if (state.attributes?.entity_category) return false;
    
    return true;
  });
}

/**
 * Findet eine Dummy-Sensor-Entität für Tile-Cards
 * OPTIMIERT: Domain-Checks zuerst, dann Validierung
 */
export function findDummySensor(hass, excludeLabels, config = {}) {
  const hiddenFromConfig = getHiddenEntitiesFromConfig(config);
  const excludeSet = new Set(excludeLabels);
  
  const someLight = Object.values(hass.states)
    .find(state => {
      const id = state.entity_id;
      
      // Domain-Check zuerst
      if (!id.startsWith('light.')) return false;
      
      // Exclude-Checks
      if (excludeSet.has(id)) return false;
      if (hiddenFromConfig.has(id)) return false;
      
      // Category-Checks
      if (state.attributes?.entity_category === 'config') return false;
      if (state.attributes?.entity_category === 'diagnostic') return false;
      
      return true;
    });
  
  const someSensorState = Object.values(hass.states)
    .find(state => {
      const id = state.entity_id;
      
      // Domain + State-Check kombiniert
      if (!id.startsWith('sensor.')) return false;
      if (state.state === 'unavailable') return false;
      
      // Exclude-Checks
      if (excludeSet.has(id)) return false;
      if (hiddenFromConfig.has(id)) return false;
      
      // Category-Checks
      if (state.attributes?.entity_category === 'config') return false;
      if (state.attributes?.entity_category === 'diagnostic') return false;
      
      return true;
    });

  return someSensorState ? someSensorState.entity_id : (someLight ? someLight.entity_id : 'sun.sun');
}