// ====================================================================
// SIMON42 HELPER FUNCTIONS - OPTIMIZED
// ====================================================================
// Gemeinsame Helper-Funktionen für alle Strategies
// KEIN redundantes Caching oder doppelte Registry-Lookups mehr!
// ====================================================================

import { logWarn } from './simon42-logger.js';
import { getLanguage } from './simon42-i18n.js';

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
 * Wendet Substring-Übersetzungen auf Namen an (für Entity-Namen und Area-Namen)
 * @param {string} name - Der zu transformierende Name
 * @param {Array} translations - Array von Übersetzungen (Objekte mit from/to/from_lang/to_lang)
 * @returns {string} Transformierter Name
 */
function applyNameTranslations(name, translations) {
  if (!translations || !Array.isArray(translations) || translations.length === 0) {
    return name;
  }
  
  // Hole die aktuelle Dashboard-Sprache
  const currentLanguage = getLanguage();
  
  let translatedName = name;
  
  // Wende jede Übersetzung an
  translations.forEach(translation => {
    // Übersetzung muss from und to haben
    if (!translation.from || !translation.to) {
      return;
    }
    
    // Language-aware: Nur anwenden wenn to_lang mit aktueller Sprache übereinstimmt
    // Wenn to_lang nicht gesetzt ist, wird die Übersetzung immer angewendet (Rückwärtskompatibilität)
    if (translation.to_lang && translation.to_lang !== currentLanguage) {
      return; // Übersetzung nicht anwenden, Sprache stimmt nicht überein
    }
    
    // Ersetze Substring (case-insensitive, ganze Wörter)
    // Verwende \b für Wortgrenzen, damit "Bedroom" nicht "BedroomLight" ersetzt
    const regex = new RegExp(`\\b${translation.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    translatedName = translatedName.replace(regex, translation.to);
  });
  
  // Bereinige mehrfache Leerzeichen und trimme
  translatedName = translatedName.replace(/\s+/g, ' ').trim();
  
  return translatedName;
}

/**
 * Übersetzt einen Area-Namen basierend auf konfigurierten Übersetzungen
 * @param {string} areaName - Der zu übersetzende Area-Name
 * @param {Object} config - Dashboard-Config mit entity_name_translations
 * @returns {string} Übersetzter Area-Name
 */
export function translateAreaName(areaName, config = {}) {
  if (!areaName) {
    return areaName;
  }
  
  const nameTranslations = config.entity_name_translations;
  if (nameTranslations) {
    return applyNameTranslations(areaName, nameTranslations);
  }
  
  return areaName;
}

/**
 * Transformiert Entity-Namen basierend auf konfigurierten Regex-Mustern
 * @param {string} name - Der zu transformierende Name
 * @param {Array} patterns - Array von Regex-Mustern (Strings oder Objekte mit pattern/domain)
 * @param {string} entityId - Optional: Entity ID für Domain-Filterung
 * @returns {string} Transformierter Name
 */
function applyNamePatterns(name, patterns, entityId = null) {
  if (!patterns || !Array.isArray(patterns) || patterns.length === 0) {
    return name;
  }
  
  // Extrahiere Domain aus entityId falls vorhanden
  const entityDomain = entityId ? entityId.split('.')[0] : null;
  
  let transformedName = name;
  
  // Wende jedes Pattern an
  patterns.forEach(pattern => {
    try {
      // Pattern kann ein String (Regex) oder ein Objekt mit pattern-Eigenschaft sein
      const regexPattern = typeof pattern === 'string' ? pattern : pattern.pattern;
      if (!regexPattern) return;
      
      // Domain-Filterung: Wenn Pattern eine Domain-Restriktion hat, prüfe ob sie zutrifft
      if (typeof pattern === 'object' && pattern.domain) {
        // Pattern hat eine einzelne Domain-Restriktion
        if (entityDomain !== pattern.domain) {
          return; // Pattern nicht anwenden, Domain stimmt nicht überein
        }
      } else if (typeof pattern === 'object' && pattern.domains && Array.isArray(pattern.domains)) {
        // Pattern hat mehrere Domain-Restriktionen
        if (!pattern.domains.includes(entityDomain)) {
          return; // Pattern nicht anwenden, Domain nicht in Liste
        }
      }
      // Wenn Pattern ein String ist oder keine Domain-Restriktion hat, wende es auf alle Entities an
      
      const regex = new RegExp(regexPattern, 'gi');
      transformedName = transformedName.replace(regex, '');
    } catch (error) {
      // Bei ungültigem Regex-Pattern, ignoriere es und logge Warnung
      logWarn('Ungültiges Entity-Name-Pattern:', pattern, error);
    }
  });
  
  // Bereinige mehrfache Leerzeichen und trimme
  transformedName = transformedName.replace(/\s+/g, ' ').trim();
  
  // Post-Processing: Entferne possessive Präfixe (z.B. "Phillipp's " → entfernen)
  // Dies hilft bei Namen wie "Socket - Phillipp's PC" → nach "^.* - " bleibt "Phillipp's PC" → wird zu "PC"
  const possessivePattern = /^[A-Za-z]+'s\s+/;
  if (possessivePattern.test(transformedName)) {
    transformedName = transformedName.replace(possessivePattern, '').trim();
  }
  
  // Nur verwenden wenn noch ein sinnvoller Name übrig ist
  if (transformedName && transformedName.length > 0) {
    return transformedName;
  }
  
  // Fallback zum Original-Namen
  return name;
}

/**
 * Entfernt den Raumnamen aus dem Entity-Namen und wendet optional konfigurierte Patterns an
 * @param {string} entityId - Entity ID
 * @param {Object} area - Bereich-Objekt
 * @param {Object} hass - Home Assistant Objekt
 * @param {Object} config - Optional: Dashboard-Config mit entity_name_patterns und entity_name_translations
 * @returns {string} Bereinigter Name
 */
export function stripAreaName(entityId, area, hass, config = {}) {
  const state = hass.states[entityId];
  if (!state) return null;
  
  let name = state.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
  const areaName = area?.name;
  
  // 1. Entferne Raumnamen (falls vorhanden)
  if (areaName && name) {
    // Entferne Raumnamen am Anfang, Ende oder in der Mitte
    const cleanName = name
      .replace(new RegExp(`^${areaName}\\s+`, 'i'), '')  // Am Anfang
      .replace(new RegExp(`\\s+${areaName}$`, 'i'), '')  // Am Ende
      .replace(new RegExp(`\\s+${areaName}\\s+`, 'i'), ' ')  // In der Mitte
      .trim();
    
    // Nur verwenden wenn noch ein sinnvoller Name übrig ist
    if (cleanName && cleanName.length > 0 && cleanName.toLowerCase() !== areaName.toLowerCase()) {
      name = cleanName;
    }
  }
  
  // 2. Wende konfigurierte Name-Patterns an (falls vorhanden)
  const namePatterns = config.entity_name_patterns;
  if (namePatterns) {
    name = applyNamePatterns(name, namePatterns, entityId);
  }
  
  // 3. Wende konfigurierte Name-Übersetzungen an (falls vorhanden)
  // Übersetzungen werden NACH den Patterns angewendet, damit sie auf die transformierten Namen wirken
  const nameTranslations = config.entity_name_translations;
  if (nameTranslations) {
    name = applyNameTranslations(name, nameTranslations);
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
 * Prüft ob eine Entität versteckt, deaktiviert ist oder nicht angezeigt werden soll
 * OPTIMIERT: Keine redundanten Registry-Lookups mehr!
 * @param {Object} entity - Entity-Objekt aus der Registry
 * @param {Object} hass - Home Assistant Objekt
 * @returns {boolean} True wenn versteckt, deaktiviert oder nicht sichtbar
 */
export function isEntityHiddenOrDisabled(entity, hass) {
  // Prüfe direkt im entity-Objekt (aus der Entity Registry)
  // WICHTIG: Das 'hidden' Feld (boolean) wird gesetzt wenn die Entität in der UI auf "Sichtbar = false" gesetzt wird
  if (entity.hidden === true) {
    return true;
  }
  
  if (entity.hidden_by) {
    return true;
  }
  
  if (entity.disabled_by) {
    return true;
  }
  
  // Prüfe entity_category in der Registry
  // Diese Kategorien werden in Home Assistant als "nicht sichtbar" in der UI behandelt
  if (entity.entity_category === 'config' || entity.entity_category === 'diagnostic') {
    return true;
  }
  
  // Prüfe auch im State-Objekt (manche Entity Categories sind nur dort verfügbar)
  const state = hass.states?.[entity.entity_id];
  if (state?.attributes?.entity_category === 'config' || 
      state?.attributes?.entity_category === 'diagnostic') {
    return true;
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

/**
 * Prüft ob ein Kamera-Stream verfügbar ist
 * @param {string} cameraId - Entity ID der Kamera
 * @param {Object} hass - Home Assistant Objekt
 * @returns {boolean} True wenn der Stream verfügbar ist
 */
export function isCameraStreamAvailable(cameraId, hass) {
  const cameraState = hass.states?.[cameraId];
  if (!cameraState) {
    return false;
  }
  
  // Prüfe ob die Kamera verfügbar ist (nicht "unavailable")
  if (cameraState.state === 'unavailable') {
    return false;
  }
  
  // Prüfe ob ein Stream-Source vorhanden ist
  // Wenn privacy mode aktiv ist, fehlt oft der stream_source oder access_token
  const streamSource = cameraState.attributes?.stream_source;
  const accessToken = cameraState.attributes?.access_token;
  
  // Wenn kein stream_source vorhanden oder leer ist, ist der Stream nicht verfügbar
  if (!streamSource || (typeof streamSource === 'string' && streamSource.trim() === '')) {
    return false;
  }
  
  // Wenn kein access_token vorhanden oder leer ist, kann der Stream nicht abgerufen werden
  if (!accessToken || (typeof accessToken === 'string' && accessToken.trim() === '')) {
    return false;
  }
  
  return true;
}