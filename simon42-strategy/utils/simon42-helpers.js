// ====================================================================
// SIMON42 HELPER FUNCTIONS
// ====================================================================
// Gemeinsame Helper-Funktionen für alle Strategies
// ====================================================================

/**
 * Filtert und sortiert Bereiche basierend auf der Konfiguration
 * @param {Array} areas - Alle verfügbaren Bereiche
 * @param {Object} displayConfig - Anzeige-Konfiguration (hidden, order)
 * @returns {Array} Gefilterte und sortierte Bereiche
 */
export function getVisibleAreas(areas, displayConfig) {
  const hiddenAreas = displayConfig?.hidden || [];
  const orderConfig = displayConfig?.order || [];
  
  // Filtere versteckte Areale
  let visibleAreas = areas.filter(area => !hiddenAreas.includes(area.area_id));
  
  // Sortiere nach Konfiguration
  if (orderConfig.length > 0) {
    visibleAreas.sort((a, b) => {
      const indexA = orderConfig.indexOf(a.area_id);
      const indexB = orderConfig.indexOf(b.area_id);
      
      // Wenn beide in der Order-Liste sind
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // Wenn nur A in der Order-Liste ist
      if (indexA !== -1) return -1;
      // Wenn nur B in der Order-Liste ist
      if (indexB !== -1) return 1;
      // Wenn beide nicht in der Order-Liste sind, alphabetisch sortieren
      return a.name.localeCompare(b.name);
    });
  } else {
    // Standard alphabetische Sortierung
    visibleAreas.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  return visibleAreas;
}

/**
 * Entfernt den Raumnamen aus dem Entity-Namen
 * @param {string} entityId - Entity ID
 * @param {Object} area - Bereich-Objekt
 * @param {Object} hass - Home Assistant Objekt
 * @returns {string} Bereinigter Name
 */
export function stripAreaName(entityId, area, hass) {
  const state = hass.states[entityId];
  if (!state) return null;
  
  let name = state.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
  const areaName = area.name;
  
  if (areaName && name) {
    // Entferne Raumnamen am Anfang, Ende oder in der Mitte
    const cleanName = name
      .replace(new RegExp(`^${areaName}\\s+`, 'i'), '')  // Am Anfang
      .replace(new RegExp(`\\s+${areaName}$`, 'i'), '')  // Am Ende
      .replace(new RegExp(`\\s+${areaName}\\s+`, 'i'), ' ')  // In der Mitte
      .trim();
    
    // Nur verwenden wenn noch ein sinnvoller Name übrig ist
    if (cleanName && cleanName.length > 0 && cleanName.toLowerCase() !== areaName.toLowerCase()) {
      return cleanName;
    }
  }
  
  return name;
}

/**
 * Entfernt Cover-Typ-Begriffe aus dem Entity-Namen
 * @param {string} entityId - Entity ID
 * @param {Object} hass - Home Assistant Objekt
 * @returns {string} Bereinigter Name
 */
export function stripCoverType(entityId, hass) {
  const state = hass.states[entityId];
  if (!state) return null;
  
  let name = state.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
  
  // Liste der zu entfernenden Begriffe
  const coverTypes = [
    'Rollo', 'Rollos',
    'Rolladen', 'Rolläden',
    'Vorhang', 'Vorhänge',
    'Jalousie', 'Jalousien',
    'Shutter', 'Shutters',
    'Blind', 'Blinds'
  ];
  
  // Entferne Cover-Typen am Anfang, Ende oder in der Mitte
  coverTypes.forEach(type => {
    const regex = new RegExp(`\\b${type}\\b`, 'gi');
    name = name.replace(regex, '').trim();
  });
  
  // Entferne mehrfache Leerzeichen
  name = name.replace(/\s+/g, ' ').trim();
  
  // Nur verwenden wenn noch ein sinnvoller Name übrig ist
  if (name && name.length > 0) {
    return name;
  }
  
  // Fallback zum Original-Namen
  return state.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
}

/**
 * Prüft ob eine Entität versteckt oder deaktiviert ist
 * @param {Object} entity - Entity-Objekt aus der Registry
 * @param {Object} hass - Home Assistant Objekt
 * @returns {boolean} True wenn versteckt oder deaktiviert
 */
export function isEntityHiddenOrDisabled(entity, hass) {
  // Prüfe direkt im entity-Objekt (aus der Entity Registry)
  if (entity.hidden_by) {
    return true;
  }
  
  if (entity.disabled_by) {
    return true;
  }
  
  // Zusätzlich auch in hass.entities prüfen (falls vorhanden)
  const entityRegistry = hass.entities?.[entity.entity_id];
  if (entityRegistry) {
    if (entityRegistry.hidden_by) {
      return true;
    }
    
    if (entityRegistry.disabled_by) {
      return true;
    }
  }
  
  return false;
}

/**
 * Sortiert Entities nach last_changed (neueste zuerst)
 * @param {string} a - Entity ID A
 * @param {string} b - Entity ID B
 * @param {Object} hass - Home Assistant Objekt
 * @returns {number} Sortier-Ergebnis
 */
export function sortByLastChanged(a, b, hass) {
  const stateA = hass.states[a];
  const stateB = hass.states[b];
  if (!stateA || !stateB) return 0;
  const dateA = new Date(stateA.last_changed);
  const dateB = new Date(stateB.last_changed);
  return dateB - dateA; // Neueste zuerst
}

/**
 * Erstellt eine Liste von ausgeschlossenen Entity-IDs basierend auf Labels
 * @param {Array} entities - Entity-Liste aus der Registry
 * @returns {Array} Liste von Entity-IDs die ausgeschlossen werden sollen
 */
export function getExcludedLabels(entities) {
  return entities
    .filter(e => e.labels?.includes("no_dboard"))
    .map(e => e.entity_id);
}