// ====================================================================
// DATA COLLECTORS - Sammelt und bereitet Daten auf
// ====================================================================

/**
 * Sammelt alle Personen-Entitäten
 */
export function collectPersons(hass, excludeLabels) {
  return Object.values(hass.states)
    .filter(state => state.entity_id.startsWith('person.'))
    .filter(state => !excludeLabels.includes(state.entity_id))
    .map(state => ({
      entity_id: state.entity_id,
      name: state.attributes?.friendly_name || state.entity_id.split('.')[1],
      state: state.state,
      isHome: state.state === 'home'
    }));
}

/**
 * Zählt eingeschaltete Lichter
 */
export function collectLights(hass, excludeLabels) {
  return Object.values(hass.states)
    .filter(state => state.entity_id.startsWith('light.'))
    .filter(state => !excludeLabels.includes(state.entity_id))
    .filter(state => state.attributes?.entity_category !== 'config')
    .filter(state => state.attributes?.entity_category !== 'diagnostic')
    .filter(state => state.state === 'on');
}

/**
 * Zählt offene Covers
 */
export function collectCovers(hass, excludeLabels) {
  return Object.values(hass.states)
    .filter(state => state.entity_id.startsWith('cover.'))
    .filter(state => !excludeLabels.includes(state.entity_id))
    .filter(state => state.attributes?.entity_category !== 'config')
    .filter(state => state.attributes?.entity_category !== 'diagnostic')
    .filter(state => ['open', 'opening'].includes(state.state));
}

/**
 * Zählt unsichere Security-Entitäten
 */
export function collectSecurityUnsafe(hass, excludeLabels) {
  return Object.keys(hass.states)
    .filter(entityId => !excludeLabels.includes(entityId))
    .filter(entityId => {
      const state = hass.states[entityId];
      if (!state) return false;
      
      // Locks (unlocked)
      if (state.entity_id.startsWith('lock.') && state.state === 'unlocked') return true;
      
      // Covers mit device_class door, garage, gate (offen)
      if (state.entity_id.startsWith('cover.')) {
        const deviceClass = state.attributes?.device_class;
        if (['door', 'garage', 'gate'].includes(deviceClass) && state.state === 'open') return true;
      }
      
      // Binary sensors (offen/on)
      if (state.entity_id.startsWith('binary_sensor.')) {
        const deviceClass = state.attributes?.device_class;
        if (['door', 'window', 'garage_door', 'opening'].includes(deviceClass) && state.state === 'on') return true;
      }
      
      return false;
    });
}

/**
 * Zählt kritische Batterien (unter 20%)
 */
export function collectBatteriesCritical(hass, excludeLabels) {
  return Object.keys(hass.states)
    .filter(entityId => !excludeLabels.includes(entityId))
    .filter(entityId => {
      const state = hass.states[entityId];
      if (!state) return false;
      
      // Prüfe ob es eine Batterie-Entität ist
      if (entityId.includes('battery')) return true;
      if (state.attributes?.device_class === 'battery') return true;
      
      return false;
    })
    .filter(entityId => {
      const state = hass.states[entityId];
      const value = parseFloat(state.state);
      return !isNaN(value) && value < 20;
    });
}

/**
 * Findet eine Weather-Entität
 */
export function findWeatherEntity(hass, excludeLabels) {
  return Object.keys(hass.states).find(entityId => {
    if (!entityId.startsWith('weather.')) return false;
    if (excludeLabels.includes(entityId)) return false;
    
    const state = hass.states[entityId];
    if (!state) return false;
    
    // Nur Entitäten ohne entity_category (also keine config/diagnostic Entitäten)
    if (state.attributes?.entity_category) return false;
    
    return true;
  });
}

/**
 * Findet eine Dummy-Sensor-Entität für Tile-Cards
 */
export function findDummySensor(hass, excludeLabels) {
  const someLight = Object.values(hass.states)
    .find(state => 
      state.entity_id.startsWith('light.') &&
      !excludeLabels.includes(state.entity_id) &&
      state.attributes?.entity_category !== 'config' &&
      state.attributes?.entity_category !== 'diagnostic'
    );
  
  const someSensorState = Object.values(hass.states)
    .find(state => 
      state.entity_id.startsWith('sensor.') &&
      !excludeLabels.includes(state.entity_id) &&
      state.attributes?.entity_category !== 'config' &&
      state.attributes?.entity_category !== 'diagnostic' &&
      state.state !== 'unavailable'
    );

  return someSensorState ? someSensorState.entity_id : (someLight ? someLight.entity_id : 'sun.sun');
}