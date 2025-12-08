// ====================================================================
// PUBLIC TRANSPORT CARD BUILDERS - Card-Specific Builders
// ====================================================================
// Separates card building logic for each public transport integration
// Makes it easier to add new integrations and maintain existing ones
// ====================================================================

import { t, getLanguage } from './simon42-i18n.js';
import { getUserDarkMode, getUserLocale, getUserHour12 } from './simon42-user-preferences.js';
import { translateAreaName } from './simon42-helpers.js';


/**
 * Integration/Card mapping
 */
export const PUBLIC_TRANSPORT_MAPPING = {
  'hvv': 'hvv-card',
  'ha-departures': 'ha-departures-card',
  'db_info': 'db-info-card',
  'kvv': 'kvv-departures-card'
};

/**
 * Valid integration/card combinations
 */
export const VALID_COMBINATIONS = {
  'hvv': ['hvv-card'],
  'ha-departures': ['ha-departures-card'],
  'db_info': ['db-info-card'],
  'kvv': ['kvv-departures-card']
};

/**
 * Filters entities to only include valid ones
 * @param {string[]} entityIds - Array of entity IDs
 * @param {Object} hass - Home Assistant object
 * @returns {string[]} Filtered entity IDs
 */
export function filterValidEntities(entityIds, hass) {
  return entityIds.filter(entityId => {
    const state = hass.states[entityId];
    return state !== undefined && 
           state.state !== 'unavailable' && 
           state.state !== 'unknown';
  });
}

/**
 * Filters ha-departures entities to only include those with valid departure times
 * @param {string[]} entityIds - Array of entity IDs
 * @param {Object} hass - Home Assistant object
 * @returns {string[]} Filtered entity IDs
 */
export function filterHaDeparturesEntities(entityIds, hass) {
  return entityIds.filter(entityId => {
    const state = hass.states[entityId];
    if (!state || !state.attributes) {
      return false;
    }
    
    const attrs = state.attributes;
    // Check if entity has at least one valid departure time
    const hasPlannedTime = attrs.planned_departure_time !== null && 
                          attrs.planned_departure_time !== undefined;
    
    // Also check numbered departure times
    const hasAnyPlannedTime = hasPlannedTime || 
      (attrs.planned_departure_time_1 !== null && attrs.planned_departure_time_1 !== undefined) ||
      (attrs.planned_departure_time_2 !== null && attrs.planned_departure_time_2 !== undefined) ||
      (attrs.planned_departure_time_3 !== null && attrs.planned_departure_time_3 !== undefined) ||
      (attrs.planned_departure_time_4 !== null && attrs.planned_departure_time_4 !== undefined);
    
    return hasAnyPlannedTime;
  });
}

/**
 * Builds HVV card configuration
 * @param {string[]} entityIds - Entity IDs
 * @param {Object} config - Configuration object
 * @param {Object} hass - Home Assistant object (for translating entity names)
 * @returns {Object} Card configuration
 */
export function buildHvvCard(entityIds, config, hass = null) {
  const cardConfig = {
    type: 'custom:hvv-card',
    entities: entityIds,
    max: config.hvv_max !== undefined ? config.hvv_max : 10,
    show_time: config.hvv_show_time !== undefined ? config.hvv_show_time : false,
    show_title: config.hvv_show_title !== undefined ? config.hvv_show_title : false,
    title: config.hvv_title || 'HVV'
  };
  
  // Note on translation: The HVV card reads departure information directly from entity attributes
  // (next[].direction, next[].name, etc.). These nested attribute values cannot be translated
  // directly from this codebase since the card reads them from hass.states.
  // 
  // The HVV card expects entity IDs as strings, not entity objects. Entity names displayed
  // by the card come from hass.states and cannot be overridden via configuration.
  // For departure names in attributes, users may need to:
  // 1. Configure translations at the HVV integration level (if supported)
  // 2. Use Home Assistant's translation system (if the card supports it)
  // 3. Use entity_name_translations for common terms that appear in departure names
  //
  // The card's title can be translated by setting hvv_title in the config.
  
  return cardConfig;
}

/**
 * Builds ha-departures card configuration
 * @param {string[]} entityIds - Entity IDs
 * @param {Object} config - Configuration object
 * @param {Object} hass - Home Assistant object
 * @returns {Object} Card configuration
 */
export function buildHaDeparturesCard(entityIds, config, hass) {
  // Get dark mode preference
  const isDarkMode = getUserDarkMode(hass);
  
  // Use accent color that adapts to theme
  const lineColor = isDarkMode 
    ? '#EB5A3C'  // Lighter orange-red for dark mode
    : '#03A9F4';   // Blue for light mode
  
  const timeStyle = config.ha_departures_time_style || 'dynamic';
  
  // Build entity configurations
  const entities = entityIds.map(entityId => {
    const entityConfig = {
      entity: entityId,
      lineColor: lineColor
    };
    
    if (timeStyle !== 'dynamic') {
      entityConfig.timeStyle = timeStyle;
    }
    
    return entityConfig;
  });
  
  // Build card configuration
  const cardConfig = {
    type: 'custom:departures-card',
    entities: entities,
    departuresToShow: Math.min(config.ha_departures_max !== undefined ? config.ha_departures_max : 3, 5),
    icon: config.ha_departures_icon || 'mdi:bus-multiple'
  };
  
  // Optional properties (only add if not default)
  if (config.ha_departures_show_card_header === false) {
    cardConfig.showCardHeader = false;
  }
  
  if (config.ha_departures_show_animation === false) {
    cardConfig.showAnimation = false;
  }
  
  if (config.ha_departures_show_transport_icon === true) {
    cardConfig.showTransportIcon = true;
  }
  
  if (config.ha_departures_hide_empty_departures === true) {
    cardConfig.hideEmptyDepartures = true;
  }
  
  return cardConfig;
}

// Time format preference now uses centralized user preferences utility

/**
 * Builds db_info (flex-table-card) configuration
 * @param {string[]} entityIds - Entity IDs
 * @param {Object} config - Configuration object
 * @param {Object} hass - Home Assistant object
 * @returns {Array} Array of card configurations (header + table for each path)
 */
export function buildDbInfoCard(entityIds, config, hass) {
  // Group entities by path (extract path name from friendly_name)
  const pathGroups = {};
  
  entityIds.forEach(entityId => {
    const entity = hass.states[entityId];
    if (!entity || !entity.attributes) {
      return;
    }
    
    let friendlyName = entity.attributes.friendly_name || '';
    
    // Apply translations to friendly name FIRST, then extract path name
    // This ensures any translatable parts (city names, route names, etc.) are translated
    friendlyName = translateAreaName(friendlyName, config);
    
    // Extract path name by removing "Verbindung X" or "Connection X" pattern
    let pathName = friendlyName
      .replace(/\s*(?:Verbindung|Connection)\s+\d+$/, '')
      .trim();
    
    const groupKey = pathName || friendlyName || entityId;
    
    if (!pathGroups[groupKey]) {
      pathGroups[groupKey] = [];
    }
    pathGroups[groupKey].push(entityId);
  });
  
  // Get locale and time format from user preferences
  const locale = getUserLocale(hass, config);
  const hour12 = getUserHour12(hass, config);
  
  // Format time with delay handling
  const formatTimeWithDelayStr = `(function() { try { var str = (x || '').toString().trim(); if (!str || str === 'undefined' || str === 'null') { return '-'; } var parts = str.split(' '); var timeStr = parts[0] || ''; var timeRealStr = parts[1] || ''; if (!timeStr || timeStr === 'null' || timeStr === 'undefined') { return '-'; } var time = new Date(timeStr); if (isNaN(time.getTime())) { return '-'; } var timeFormatted = time.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit', hour12: ${hour12}}); if (!timeRealStr || timeRealStr === 'null' || timeRealStr === 'undefined') { return timeFormatted; } var timeReal = new Date(timeRealStr); if (isNaN(timeReal.getTime())) { return timeFormatted; } if (time >= timeReal) { return '<div style="color:green">' + timeFormatted + '</div>'; } else { var delayMinutes = (timeReal - time) / (1000 * 60); var timeRealFormatted = timeReal.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit', hour12: ${hour12}}); if (delayMinutes > 4) { return '<s><div style="color:grey">' + timeFormatted + '</div></s><div style="color:red">' + timeRealFormatted + '</div>'; } else { return '<s><div style="color:grey">' + timeFormatted + '</div></s><div style="color:green">' + timeRealFormatted + '</div>'; } } } catch(e) { return '-'; } })()`;
  
  // Format sort time
  const formatSortTimeStr = `(function() { try { var str = (x || '').toString().trim(); if (!str || str === 'undefined' || str === 'null') { return ''; } var parts = str.split(' '); var timeStr = parts[0] || ''; var timeRealStr = parts[1] || ''; if (!timeStr || timeStr === 'null' || timeStr === 'undefined') { return ''; } var time = new Date(timeStr); if (isNaN(time.getTime())) { return ''; } if (!timeRealStr || timeRealStr === 'null' || timeRealStr === 'undefined') { return time.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit', hour12: ${hour12}}); } var timeReal = new Date(timeRealStr); if (isNaN(timeReal.getTime())) { return time.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit', hour12: ${hour12}}); } return timeReal.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit', hour12: ${hour12}}); } catch(e) { return ''; } })()`;
  
  // Configure table columns
  const tableColumns = [
    {
      name: t('publicTransportColumnStart'),
      data: 'Departure'
    },
    {
      name: t('publicTransportColumnConnection'),
      data: 'Name'
    },
    {
      name: t('publicTransportColumnDeparture'),
      data: 'Departure Time,Departure Time Real',
      modify: formatTimeWithDelayStr
    },
    {
      name: t('publicTransportColumnArrival'),
      data: 'Arrival Time,Arrival Time Real',
      modify: formatTimeWithDelayStr
    },
    {
      name: 'sort_time',
      data: 'Departure Time,Departure Time Real',
      modify: formatSortTimeStr,
      hidden: true
    }
  ];
  
  // Create cards array with header + table for each path group
  const pathCards = [];
  const pathNames = Object.keys(pathGroups);
  
  pathNames.forEach((pathName, index) => {
    const pathEntities = pathGroups[pathName];
    
    // Add slim header row for path name
    pathCards.push({
      type: 'markdown',
      content: `**${pathName}**`,
      card_mod: {
        style: {
          '$': '.card-content { padding: 8px 16px 4px 16px; font-size: 14px; }'
        }
      }
    });
    
    // Add table card for this path's connections
    const tableCard = {
      type: 'custom:flex-table-card',
      entities: pathEntities,
      sort_by: 'sort_time',
      columns: tableColumns,
      css: {
        'table+': 'padding: 1px 5px 16px 5px;'
      },
      card_mod: {
        style: {
          '$': 'h1.card-header { font-size: 20px; padding-top: 3px; padding-bottom: 1px; }'
        }
      }
    };
    
    // Only add title if it's the first path group and config has a title
    if (index === 0 && config.hvv_title) {
      tableCard.title = config.hvv_title;
    }
    
    pathCards.push(tableCard);
  });
  
  return pathCards;
}

/**
 * Builds KVV card configuration
 * @param {string[]} entityIds - Entity IDs
 * @returns {Array} Array of card configurations (one per entity)
 */
export function buildKvvCard(entityIds) {
  return entityIds.map(entityId => ({
    type: 'custom:kvv-departures-card',
    entity: entityId
  }));
}

/**
 * Card builder registry
 * Maps card types to their builder functions
 */
export const CARD_BUILDERS = {
  'hvv-card': buildHvvCard,
  'ha-departures-card': buildHaDeparturesCard,
  'db-info-card': buildDbInfoCard,
  'kvv-departures-card': buildKvvCard
};

/**
 * Validates integration/card combination
 * @param {string} integration - Integration name
 * @param {string} cardType - Card type
 * @returns {boolean} True if combination is valid
 */
export function validateCombination(integration, cardType) {
  const validCards = VALID_COMBINATIONS[integration] || [];
  return validCards.includes(cardType);
}

/**
 * Gets card type from integration (with fallback)
 * @param {string} integration - Integration name
 * @param {string} configuredCard - Configured card type (optional)
 * @returns {string|null} Card type or null if not found
 */
export function getCardType(integration, configuredCard) {
  return configuredCard || PUBLIC_TRANSPORT_MAPPING[integration] || null;
}

