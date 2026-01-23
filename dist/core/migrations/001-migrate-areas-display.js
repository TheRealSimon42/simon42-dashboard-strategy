// ====================================================================
// MIGRATION 001: Migrate areas_display format
// ====================================================================
// Migrates areas_display from old array-based format to new object-based format
// 
// Old format: { hidden: [area1, area2], order: [area3, area1, area2] }
// New format: { area1: { hidden: true, order: 1 }, area2: { hidden: true, order: 2 }, area3: { hidden: false, order: 0 } }
// ====================================================================

/**
 * Migrates areas_display from old format to new format
 * @param {Object} config - Config object that may contain old format areas_display
 * @returns {Object} Config with migrated areas_display (if needed)
 */
export function migrateAreasDisplay(config) {
  if (!config || !config.areas_display) {
    return config;
  }

  const areasDisplay = config.areas_display;
  
  // Validate areas_display structure
  if (typeof areasDisplay !== 'object' || Array.isArray(areasDisplay)) {
    // Invalid structure - return config as-is
    return config;
  }
  
  // Check if already in new format (has area IDs as keys with hidden/order properties)
  // New format: object with area IDs as keys, each value is { hidden: boolean, order: number }
  // Old format: object with 'hidden' and/or 'order' arrays
  const hasOldFormat = (areasDisplay.hidden && Array.isArray(areasDisplay.hidden)) || 
                       (areasDisplay.order && Array.isArray(areasDisplay.order));
  
  if (!hasOldFormat) {
    // Already in new format or no migration needed
    // Verify it's actually new format by checking if any key looks like an area ID
    // (area IDs are strings, not 'hidden' or 'order')
    const keys = Object.keys(areasDisplay);
    const hasAreaIdKeys = keys.some(key => key !== 'hidden' && key !== 'order');
    
    if (hasAreaIdKeys) {
      // Confirmed new format
      return config;
    }
    
    // Empty or unknown format - return as-is
    return config;
  }

  // Migrate to new format
  const newAreasDisplay = {};
  const hiddenAreas = new Set();
  const orderArray = [];
  
  // Safely extract hidden areas
  if (Array.isArray(areasDisplay.hidden)) {
    areasDisplay.hidden.forEach(areaId => {
      if (areaId && typeof areaId === 'string' && areaId.trim().length > 0) {
        hiddenAreas.add(areaId.trim());
      }
    });
  }
  
  // Safely extract order array
  if (Array.isArray(areasDisplay.order)) {
    areasDisplay.order.forEach(areaId => {
      if (areaId && typeof areaId === 'string' && areaId.trim().length > 0) {
        orderArray.push(areaId.trim());
      }
    });
  }

  // Process all areas from order array first (to preserve order)
  orderArray.forEach((areaId, index) => {
    if (areaId && !newAreasDisplay[areaId]) {
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
  const migratedConfig = { ...config };
  
  // Only set areas_display if it has entries, otherwise remove it
  if (Object.keys(newAreasDisplay).length > 0) {
    migratedConfig.areas_display = newAreasDisplay;
  } else {
    delete migratedConfig.areas_display;
  }
  
  return migratedConfig;
}
