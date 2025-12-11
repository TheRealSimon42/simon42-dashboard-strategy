// ====================================================================
// SIMON42 HELPER FUNCTIONS
// ====================================================================
// Common helper functions for all strategies
// ====================================================================

import { logWarn } from '../system/simon42-logger.js';
import { getLanguage } from '../i18n/simon42-i18n.js';

/**
 * Filters and sorts areas based on configuration
 * @param {Array} areas - All available areas
 * @param {Object} displayConfig - Display configuration (hidden, order)
 * @returns {Array} Filtered and sorted areas
 */
export function getVisibleAreas(areas, displayConfig) {
  const hiddenAreas = displayConfig?.hidden || [];
  const orderConfig = displayConfig?.order || [];
  
  let visibleAreas = areas.filter(area => !hiddenAreas.includes(area.area_id));
  
  if (orderConfig.length > 0) {
    visibleAreas.sort((a, b) => {
      const indexA = orderConfig.indexOf(a.area_id);
      const indexB = orderConfig.indexOf(b.area_id);
      
      // Both in order list: sort by order
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // Only A in order list: A comes first
      if (indexA !== -1) return -1;
      // Only B in order list: B comes first
      if (indexB !== -1) return 1;
      // Neither in order list: alphabetical
      return a.name.localeCompare(b.name);
    });
  } else {
    // Default alphabetical sorting
    visibleAreas.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  return visibleAreas;
}

/**
 * Applies substring translations to names (for entity and area names)
 * Uses word boundaries to avoid partial matches (e.g., "Bedroom" won't match "BedroomLight")
 * @param {string} name - Name to transform
 * @param {Array} translations - Array of translation objects (from/to/from_lang/to_lang)
 * @returns {string} Transformed name
 */
function applyNameTranslations(name, translations) {
  if (!translations || !Array.isArray(translations) || translations.length === 0) {
    return name;
  }
  
  const currentLanguage = getLanguage();
  let translatedName = name;
  
  translations.forEach(translation => {
    if (!translation.from || !translation.to) {
      return;
    }
    
    // Language-aware: only apply if to_lang matches current language
    // If to_lang is not set, translation is always applied (backward compatibility)
    if (translation.to_lang && translation.to_lang !== currentLanguage) {
      return;
    }
    
    // Replace substring (case-insensitive, whole words only)
    // Use \b for word boundaries to prevent partial matches
    const regex = new RegExp(`\\b${translation.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    translatedName = translatedName.replace(regex, translation.to);
  });
  
  // Clean up multiple spaces and trim
  translatedName = translatedName.replace(/\s+/g, ' ').trim();
  
  return translatedName;
}

/**
 * Translates an area name based on configured translations
 * @param {string} areaName - Area name to translate
 * @param {Object} config - Dashboard config with entity_name_translations
 * @returns {string} Translated area name
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
 * Transforms entity names based on configured regex patterns
 * Supports domain-specific patterns (single domain or array of domains)
 * @param {string} name - Name to transform
 * @param {Array} patterns - Array of regex patterns (strings or objects with pattern/domain)
 * @param {string} entityId - Optional: Entity ID for domain filtering
 * @returns {string} Transformed name
 */
function applyNamePatterns(name, patterns, entityId = null) {
  if (!patterns || !Array.isArray(patterns) || patterns.length === 0) {
    return name;
  }
  
  const entityDomain = entityId ? entityId.split('.')[0] : null;
  let transformedName = name;
  
  patterns.forEach(pattern => {
    try {
      // Pattern can be a string (regex) or object with pattern property
      const regexPattern = typeof pattern === 'string' ? pattern : pattern.pattern;
      if (!regexPattern) return;
      
      // Domain filtering: check if pattern applies to this entity's domain
      if (typeof pattern === 'object' && pattern.domain) {
        if (entityDomain !== pattern.domain) {
          return;
        }
      } else if (typeof pattern === 'object' && pattern.domains && Array.isArray(pattern.domains)) {
        if (!pattern.domains.includes(entityDomain)) {
          return;
        }
      }
      
      const regex = new RegExp(regexPattern, 'gi');
      transformedName = transformedName.replace(regex, '');
    } catch (error) {
      logWarn('Invalid entity name pattern:', pattern, error);
    }
  });
  
  // Clean up multiple spaces and trim
  transformedName = transformedName.replace(/\s+/g, ' ').trim();
  
  // Post-processing: remove possessive prefixes (e.g., "Phillipp's " → remove)
  // Helps with names like "Socket - Phillipp's PC" → after "^.* - " becomes "Phillipp's PC" → becomes "PC"
  const possessivePattern = /^[A-Za-z]+'s\s+/;
  if (possessivePattern.test(transformedName)) {
    transformedName = transformedName.replace(possessivePattern, '').trim();
  }
  
  // Only use if meaningful name remains
  if (transformedName && transformedName.length > 0) {
    return transformedName;
  }
  
  return name;
}

/**
 * Removes area name from entity name and applies optional configured patterns
 * Processing order: 1) Remove area name, 2) Apply patterns, 3) Apply translations
 * @param {string} entityId - Entity ID
 * @param {Object} area - Area object
 * @param {Object} hass - Home Assistant object
 * @param {Object} config - Optional: Dashboard config with entity_name_patterns and entity_name_translations
 * @returns {string|null} Cleaned name or null if state not found
 */
export function stripAreaName(entityId, area, hass, config = {}) {
  const state = hass.states[entityId];
  if (!state) return null;
  
  let name = state.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
  const areaName = area?.name;
  
  // 1. Remove area name (if present)
  if (areaName && name) {
    // Remove area name at beginning, end, or middle
    const cleanName = name
      .replace(new RegExp(`^${areaName}\\s+`, 'i'), '')
      .replace(new RegExp(`\\s+${areaName}$`, 'i'), '')
      .replace(new RegExp(`\\s+${areaName}\\s+`, 'i'), ' ')
      .trim();
    
    // Only use if meaningful name remains
    if (cleanName && cleanName.length > 0 && cleanName.toLowerCase() !== areaName.toLowerCase()) {
      name = cleanName;
    }
  }
  
  // 2. Apply configured name patterns (if present)
  const namePatterns = config.entity_name_patterns;
  if (namePatterns) {
    name = applyNamePatterns(name, namePatterns, entityId);
  }
  
  // 3. Apply configured name translations (if present)
  // Translations applied AFTER patterns so they work on transformed names
  const nameTranslations = config.entity_name_translations;
  if (nameTranslations) {
    name = applyNameTranslations(name, nameTranslations);
  }
  
  return name;
}

/**
 * Removes cover type terms from entity name
 * @param {string} entityId - Entity ID
 * @param {Object} hass - Home Assistant object
 * @returns {string|null} Cleaned name or null if state not found
 */
export function stripCoverType(entityId, hass) {
  const state = hass.states[entityId];
  if (!state) return null;
  
  let name = state.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
  
  const coverTypes = [
    'Rollo', 'Rollos',
    'Rolladen', 'Rolläden',
    'Vorhang', 'Vorhänge',
    'Jalousie', 'Jalousien',
    'Shutter', 'Shutters',
    'Blind', 'Blinds'
  ];
  
  // Remove cover types using word boundaries
  coverTypes.forEach(type => {
    const regex = new RegExp(`\\b${type}\\b`, 'gi');
    name = name.replace(regex, '').trim();
  });
  
  // Clean up multiple spaces
  name = name.replace(/\s+/g, ' ').trim();
  
  if (name && name.length > 0) {
    return name;
  }
  
  return state.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
}

/**
 * Checks if an entity is hidden, disabled, or should not be displayed
 * @param {Object} entity - Entity object from registry
 * @param {Object} hass - Home Assistant object
 * @returns {boolean} True if hidden, disabled, or not visible
 */
export function isEntityHiddenOrDisabled(entity, hass) {
  // Check entity object directly (from Entity Registry)
  // Note: 'hidden' field (boolean) is set when entity is set to "Visible = false" in UI
  if (entity.hidden === true) {
    return true;
  }
  
  if (entity.hidden_by) {
    return true;
  }
  
  if (entity.disabled_by) {
    return true;
  }
  
  // Check entity_category in registry
  // These categories are treated as "not visible" in Home Assistant UI
  if (entity.entity_category === 'config' || entity.entity_category === 'diagnostic') {
    return true;
  }
  
  // Also check state object (some entity categories are only available there)
  const state = hass.states?.[entity.entity_id];
  if (state?.attributes?.entity_category === 'config' || 
      state?.attributes?.entity_category === 'diagnostic') {
    return true;
  }
  
  return false;
}

/**
 * Sorts entities by last_changed (newest first)
 * @param {string} a - Entity ID A
 * @param {string} b - Entity ID B
 * @param {Object} hass - Home Assistant object
 * @returns {number} Sort result
 */
export function sortByLastChanged(a, b, hass) {
  const stateA = hass.states[a];
  const stateB = hass.states[b];
  if (!stateA || !stateB) return 0;
  const dateA = new Date(stateA.last_changed);
  const dateB = new Date(stateB.last_changed);
  return dateB - dateA;
}

/**
 * Creates a list of excluded entity IDs based on labels
 * @param {Array} entities - Entity list from registry
 * @returns {Array<string>} List of entity IDs to exclude
 */
export function getExcludedLabels(entities) {
  return entities
    .filter(e => e.labels?.includes("no_dboard"))
    .map(e => e.entity_id);
}

/**
 * Checks if a camera stream is available
 * Note: Privacy mode may hide stream_source or access_token
 * @param {string} cameraId - Camera entity ID
 * @param {Object} hass - Home Assistant object
 * @returns {boolean} True if stream is available
 */
export function isCameraStreamAvailable(cameraId, hass) {
  const cameraState = hass.states?.[cameraId];
  if (!cameraState) {
    return false;
  }
  
  if (cameraState.state === 'unavailable') {
    return false;
  }
  
  const streamSource = cameraState.attributes?.stream_source;
  const accessToken = cameraState.attributes?.access_token;
  
  if (!streamSource || (typeof streamSource === 'string' && streamSource.trim() === '')) {
    return false;
  }
  
  if (!accessToken || (typeof accessToken === 'string' && accessToken.trim() === '')) {
    return false;
  }
  
  return true;
}