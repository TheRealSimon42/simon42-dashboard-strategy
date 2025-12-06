// ====================================================================
// ENTITY FILTER UTILITY - Centralized Entity Filtering Logic
// ====================================================================
// Provides consistent filtering logic across all views and collectors
// Eliminates duplication and ensures consistent behavior
// ====================================================================

// Lazy access to logger to avoid loading order issues
// Logger is made available via window.Simon42Logger in simon42-logger.js
function getLogDebug() {
  if (typeof window !== 'undefined' && window.Simon42Logger?.logDebug) {
    return window.Simon42Logger.logDebug;
  }
  return () => {}; // No-op fallback if logger not available
}

/**
 * Filter options for entity filtering
 * @typedef {Object} EntityFilterOptions
 * @property {string|string[]} domain - Domain(s) to filter (e.g., 'light', ['light', 'switch'])
 * @property {string|string[]} [state] - Required state(s) (e.g., 'on', ['open', 'opening'])
 * @property {Set<string>} [excludeLabels] - Entity IDs to exclude (no_dboard label)
 * @property {Set<string>} [hiddenFromConfig] - Entity IDs hidden via config
 * @property {Object} [hass] - Home Assistant object
 * @property {boolean} [checkRegistry=true] - Check entity registry for hidden/disabled
 * @property {boolean} [checkState=true] - Check if state exists
 * @property {string[]} [deviceClasses] - Required device classes
 * @property {Function} [customFilter] - Additional custom filter function (entity, hass) => boolean
 */

/**
 * Filters entities based on provided options
 * @param {Array} entities - Array of entity objects from registry
 * @param {EntityFilterOptions} options - Filter options
 * @returns {Array} Filtered entity IDs
 */
export function filterEntities(entities, options = {}) {
  const {
    domain,
    state,
    excludeLabels = new Set(),
    hiddenFromConfig = new Set(),
    hass = null,
    checkRegistry = true,
    checkState = true,
    deviceClasses = null,
    customFilter = null
  } = options;

  if (!entities || !Array.isArray(entities)) {
    return [];
  }

  // Collect entities hidden by visibility upfront for logging
  const hiddenByVisibility = checkRegistry 
    ? entities.filter(e => e.hidden === true).map(e => e.entity_id)
    : [];

  getLogDebug()('[Entity Filter] Filtering', entities.length, 'entities with options:', {
    domain: options.domain || options.domains,
    excludeLabels: options.excludeLabels?.size || 0,
    hiddenFromConfig: options.hiddenFromConfig?.size || 0,
    hiddenByVisibility: hiddenByVisibility
  });

  const domains = domain ? (Array.isArray(domain) ? domain : [domain]) : null;
  const states = state ? (Array.isArray(state) ? state : [state]) : null;

  const result = entities
    .filter(entity => {
      const entityId = entity.entity_id;
      if (!entityId) return false;

      // 1. Domain-Check (early return for performance)
      if (domains && !domains.some(d => entityId.startsWith(`${d}.`))) {
        return false;
      }

      // 2. Registry-Checks (if enabled)
      if (checkRegistry) {
        if (entity.hidden === true) {
          return false;
        }
        if (entity.hidden_by) return false;
        if (entity.disabled_by) return false;
        if (entity.entity_category === 'config' || entity.entity_category === 'diagnostic') {
          return false;
        }
      }

      // 3. State-Existence-Check (if enabled)
      if (checkState && hass) {
        const stateObj = hass.states[entityId];
        if (!stateObj) return false;

        // 4. State-Value-Check (if specified)
        if (states && !states.includes(stateObj.state)) {
          return false;
        }

        // 5. Device-Class-Check (if specified)
        if (deviceClasses && deviceClasses.length > 0) {
          const deviceClass = stateObj.attributes?.device_class;
          if (!deviceClasses.includes(deviceClass)) {
            return false;
          }
        }
      }

      // 6. Exclude-Checks (Set-Lookup = O(1))
      if (excludeLabels.has(entityId)) return false;
      if (hiddenFromConfig.has(entityId)) return false;

      // 7. Custom Filter (if provided)
      if (customFilter && !customFilter(entity, hass)) {
        return false;
      }

      return true;
    })
    .map(entity => entity.entity_id);
  
  getLogDebug()('[Entity Filter] Filtered', entities.length, 'entities to', result.length);
  return result;
}

/**
 * Filters entities from hass.states (for data collectors)
 * @param {Object} hass - Home Assistant object
 * @param {EntityFilterOptions} options - Filter options
 * @returns {Array} Filtered state objects
 */
export function filterStates(hass, options = {}) {
  const {
    domain,
    state,
    excludeLabels = new Set(),
    hiddenFromConfig = new Set(),
    checkCategory = true
  } = options;

  if (!hass || !hass.states) {
    return [];
  }

  const domains = domain ? (Array.isArray(domain) ? domain : [domain]) : null;
  const states = state ? (Array.isArray(state) ? state : [state]) : null;

  return Object.values(hass.states)
    .filter(stateObj => {
      const id = stateObj.entity_id;
      if (!id) return false;

      // 1. Domain-Check
      if (domains && !domains.some(d => id.startsWith(`${d}.`))) {
        return false;
      }

      // 2. State-Value-Check
      if (states && !states.includes(stateObj.state)) {
        return false;
      }

      // 3. Exclude-Checks
      if (excludeLabels.has(id)) return false;
      if (hiddenFromConfig.has(id)) return false;

      // 4. Category-Check
      if (checkCategory) {
        const category = stateObj.attributes?.entity_category;
        if (category === 'config' || category === 'diagnostic') {
          return false;
        }
      }

      return true;
    });
}

/**
 * Convenience function for filtering by area
 * @param {Array} entities - Array of entity objects
 * @param {string} areaId - Area ID to filter by
 * @param {Set<string>} areaDevices - Set of device IDs in the area
 * @returns {Array} Filtered entity objects (not IDs)
 */
export function filterByArea(entities, areaId, areaDevices = new Set()) {
  if (!entities || !Array.isArray(entities)) {
    return [];
  }

  return entities.filter(entity => {
    if (entity.area_id === areaId) return true;
    if (entity.device_id && areaDevices.has(entity.device_id)) return true;
    return false;
  });
}

/**
 * Usage Examples:
 * 
 * // Filter lights:
 * filterEntities(entities, { domain: 'light', ...options })
 * 
 * // Filter covers:
 * filterEntities(entities, { domain: 'cover', ...options })
 * 
 * // Filter multiple domains:
 * filterEntities(entities, { domain: ['light', 'switch'], ...options })
 */

