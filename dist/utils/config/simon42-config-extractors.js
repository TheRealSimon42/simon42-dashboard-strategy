// ====================================================================
// CONFIG EXTRACTORS - Extracts data from dashboard configuration
// ====================================================================
// Centralized utilities for extracting configuration data
// ====================================================================

/**
 * Gets all hidden entity IDs from areas_options config
 * Returns a Set for O(1) lookup performance
 * 
 * @param {Object} config - Dashboard configuration
 * @param {Object} options - Extraction options
 * @param {string|null} options.areaId - Filter by specific area ID (null = all areas)
 * @param {Array<string>|null} options.groupKeys - Filter by specific group keys (null = all groups)
 * @param {boolean} options.allAreas - Search all areas (default: true)
 * @param {boolean} options.allGroups - Search all groups (default: true)
 * @returns {Set<string>} Set of hidden entity IDs
 */
export function getHiddenEntitiesFromConfig(config, options = {}) {
  const {
    areaId = null,
    groupKeys = null,
    allAreas = true,
    allGroups = true
  } = options;
  
  const hiddenEntities = new Set();
  
  if (!config.areas_options) {
    return hiddenEntities;
  }
  
  // Determine which areas to process
  const areasToProcess = areaId && !allAreas
    ? [config.areas_options[areaId]].filter(Boolean)
    : Object.values(config.areas_options);
  
  for (const areaOptions of areasToProcess) {
    if (!areaOptions.groups_options) continue;
    
    // Determine which groups to process
    const groupsToProcess = groupKeys && !allGroups
      ? groupKeys.map(key => [key, areaOptions.groups_options[key]]).filter(([_, opts]) => opts)
      : Object.entries(areaOptions.groups_options);
    
    for (const [groupKey, groupOptions] of groupsToProcess) {
      if (groupOptions.hidden && Array.isArray(groupOptions.hidden)) {
        groupOptions.hidden.forEach(entityId => hiddenEntities.add(entityId));
      }
    }
  }
  
  return hiddenEntities;
}

/**
 * Gets hidden entities grouped by group key for a specific area
 * Used by editor to display hidden entities per group
 * 
 * @param {string} areaId - Area ID
 * @param {Object} config - Dashboard configuration
 * @returns {Object} Object with group keys as keys and arrays of hidden entity IDs as values
 */
export function getHiddenEntitiesForArea(areaId, config) {
  const areaOptions = config.areas_options?.[areaId];
  if (!areaOptions || !areaOptions.groups_options) {
    return {};
  }
  
  const hidden = {};
  for (const [group, options] of Object.entries(areaOptions.groups_options)) {
    if (options.hidden) {
      hidden[group] = options.hidden;
    }
  }
  
  return hidden;
}

