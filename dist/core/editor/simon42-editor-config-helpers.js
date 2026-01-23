// ====================================================================
// EDITOR CONFIG HELPERS - Utility Functions for Complex Config Updates
// ====================================================================
// Provides helper functions for complex nested config updates and
// integration-specific property management
// ====================================================================

/**
 * Defines which properties belong to which public transport integration.
 * Used for clearing integration-specific settings when switching integrations.
 */
export const INTEGRATION_PROPERTIES = {
  'hvv': [
    'hvv_max',
    'hvv_show_time',
    'hvv_show_title',
    'hvv_title'
  ],
  'ha-departures': [
    'ha_departures_max',
    'ha_departures_icon',
    'ha_departures_show_card_header',
    'ha_departures_show_animation',
    'ha_departures_show_transport_icon',
    'ha_departures_hide_empty_departures',
    'ha_departures_time_style'
  ],
  'db_info': [
    // db_info uses flex-table-card, no specific properties yet
  ],
  'kvv': [
    // KVV uses kvv-departures-card, no specific properties yet
  ],
  // Common properties that apply to all integrations
  'common': [
    'public_transport_entities'
  ]
};

/**
 * Gets all properties that should be cleared for a given integration.
 * @param {string} integration - The integration ID (e.g., 'hvv', 'ha-departures')
 * @returns {string[]} Array of property names to clear
 */
export function getIntegrationSpecificProperties(integration) {
  const integrationProps = INTEGRATION_PROPERTIES[integration] || [];
  const commonProps = INTEGRATION_PROPERTIES['common'] || [];
  
  // Combine integration-specific and common properties
  return [...integrationProps, ...commonProps];
}

/**
 * Gets all properties that should be cleared when switching integrations.
 * This includes properties from all integrations except the current one.
 * @param {string} currentIntegration - The current integration (if any)
 * @returns {string[]} Array of property names to clear
 */
export function getAllIntegrationProperties(currentIntegration = null) {
  const allProps = new Set();
  
  // Add all integration-specific properties
  Object.values(INTEGRATION_PROPERTIES).forEach(props => {
    if (Array.isArray(props)) {
      props.forEach(prop => allProps.add(prop));
    }
  });
  
  // Add common properties
  INTEGRATION_PROPERTIES['common'].forEach(prop => allProps.add(prop));
  
  return Array.from(allProps);
}

/**
 * Updates a nested config structure, automatically cleaning up empty objects.
 * Handles deep nested structures like: areas_options[areaId].groups_options[group].hidden
 * 
 * @param {Object} config - Current config object
 * @param {string[]} path - Array of keys representing the path (e.g., ['areas_options', areaId, 'groups_options', group])
 * @param {*} value - Value to set at the path
 * @param {Function} [shouldRemove] - Optional function to determine if the value should be removed
 * @returns {Object} New config object with updated nested structure
 */
export function updateNestedConfig(config, path, value, shouldRemove = null) {
  if (!config) {
    return config;
  }
  
  const newConfig = { ...config };
  
  // Build nested structure
  let current = newConfig;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!current[key]) {
      current[key] = {};
    } else {
      current[key] = { ...current[key] };
    }
    current = current[key];
  }
  
  // Set or remove the final value
  const finalKey = path[path.length - 1];
  const shouldDelete = shouldRemove ? shouldRemove(value) : (value === undefined || value === null || 
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0));
  
  if (shouldDelete) {
    delete current[finalKey];
  } else {
    current[finalKey] = value;
  }
  
  // Clean up empty nested objects
  return cleanupEmptyNestedObjects(newConfig, path.slice(0, -1));
}

/**
 * Recursively removes empty objects from a nested config structure.
 * @param {Object} obj - Object to clean up
 * @param {string[]} path - Path to the object being cleaned (for recursive calls)
 * @returns {Object} Cleaned object
 */
export function cleanupEmptyNestedObjects(obj, path = []) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  
  const cleaned = { ...obj };
  
  // Recursively clean nested objects
  Object.keys(cleaned).forEach(key => {
    const value = cleaned[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = cleanupEmptyNestedObjects(value, [...path, key]);
      
      // Remove if empty after cleaning
      if (Object.keys(cleaned[key]).length === 0) {
        delete cleaned[key];
      }
    }
  });
  
  return cleaned;
}

/**
 * Migrates areas_display from old format to new format.
 * Old format: { hidden: [area1, area2], order: [area3, area1, area2] }
 * New format: { area1: { hidden: true, order: 1 }, area2: { hidden: true, order: 2 }, area3: { hidden: false, order: 0 } }
 * @param {Object} config - Config object that may contain old format areas_display
 * @returns {Object} Config with migrated areas_display (if needed)
 */
export function migrateAreasDisplay(config) {
  if (!config || !config.areas_display) {
    return config;
  }

  const areasDisplay = config.areas_display;
  
  // Check if already in new format (has area IDs as keys with hidden/order properties)
  const hasOldFormat = (areasDisplay.hidden && Array.isArray(areasDisplay.hidden)) || 
                       (areasDisplay.order && Array.isArray(areasDisplay.order));
  
  if (!hasOldFormat) {
    // Already in new format or no migration needed
    return config;
  }

  // Migrate to new format
  const newAreasDisplay = {};
  const hiddenAreas = new Set(areasDisplay.hidden || []);
  const orderArray = areasDisplay.order || [];

  // Process all areas from order array first (to preserve order)
  orderArray.forEach((areaId, index) => {
    if (areaId) {
      newAreasDisplay[areaId] = {
        hidden: hiddenAreas.has(areaId),
        order: index
      };
    }
  });

  // Add any hidden areas that weren't in the order array
  hiddenAreas.forEach(areaId => {
    if (!newAreasDisplay[areaId]) {
      // Assign a high order number so they appear at the end
      newAreasDisplay[areaId] = {
        hidden: true,
        order: 9999 + Object.keys(newAreasDisplay).length
      };
    }
  });

  // Return new config with migrated structure
  return {
    ...config,
    areas_display: Object.keys(newAreasDisplay).length > 0 ? newAreasDisplay : undefined
  };
}

/**
 * Gets entities from DOM for a specific area and group.
 * @param {HTMLElement} editorElement - The editor element
 * @param {string} areaId - Area ID
 * @param {string} group - Group name
 * @returns {string[]} Array of entity IDs
 */
export function getEntitiesFromDOM(editorElement, areaId, group) {
  const entityList = editorElement.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${group}"]`);
  if (!entityList) {
    return [];
  }
  
  const entityCheckboxes = entityList.querySelectorAll('.entity-checkbox');
  return Array.from(entityCheckboxes).map(cb => cb.dataset.entityId);
}

