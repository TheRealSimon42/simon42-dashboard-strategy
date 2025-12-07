// ====================================================================
// SIMON42 EDITOR HANDLERS
// ====================================================================
// Event-Handler für den Dashboard Strategy Editor

import { renderAreaEntitiesHTML } from './simon42-editor-template.js';

/**
 * Creates a checkbox listener attachment function
 * @param {string} selector - CSS selector for the checkbox
 * @returns {Function} Function that attaches listener to element
 */
function createCheckboxListener(selector) {
  return function attachCheckboxListener(element, callback) {
    const checkbox = element.querySelector(selector);
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        callback(e.target.checked);
      });
    }
  };
}

// Create all checkbox listeners using factory
export const attachWeatherCheckboxListener = createCheckboxListener('#show-weather');
export const attachEnergyCheckboxListener = createCheckboxListener('#show-energy');
export const attachPersonBadgesCheckboxListener = createCheckboxListener('#show-person-badges');
export const attachPersonProfilePictureCheckboxListener = createCheckboxListener('#show-person-profile-picture');
export const attachSearchCardCheckboxListener = createCheckboxListener('#show-search-card');
export const attachClockCardCheckboxListener = createCheckboxListener('#show-clock-card');
export const attachSummaryViewsCheckboxListener = createCheckboxListener('#show-summary-views');
export const attachRoomViewsCheckboxListener = createCheckboxListener('#show-room-views');
export const attachGroupByFloorsCheckboxListener = createCheckboxListener('#group-by-floors');
export const attachCoversSummaryCheckboxListener = createCheckboxListener('#show-covers-summary');
export const attachSecuritySummaryCheckboxListener = createCheckboxListener('#show-security-summary');
export const attachLightSummaryCheckboxListener = createCheckboxListener('#show-light-summary');
export const attachBatterySummaryCheckboxListener = createCheckboxListener('#show-battery-summary');
export const attachBetterThermostatCheckboxListener = createCheckboxListener('#show-better-thermostat');
export const attachHorizonCardCheckboxListener = createCheckboxListener('#show-horizon-card');
export const attachHorizonCardExtendedCheckboxListener = createCheckboxListener('#horizon-card-extended');
export const attachClockWeatherCardCheckboxListener = createCheckboxListener('#use-clock-weather-card');
export const attachPublicTransportCheckboxListener = createCheckboxListener('#show-public-transport');

export function attachAreaCheckboxListeners(element, callback) {
  const areaCheckboxes = element.querySelectorAll('.area-checkbox');
  areaCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const areaId = e.target.dataset.areaId;
      const isVisible = e.target.checked;
      callback(areaId, isVisible);
      
      // Disable/Enable expand button
      const areaItem = e.target.closest('.area-item');
      const expandButton = areaItem.querySelector('.expand-button');
      if (expandButton) {
        expandButton.disabled = !isVisible;
      }
    });
  });
}

export function attachExpandButtonListeners(element, hass, config, onEntitiesLoad) {
  const expandButtons = element.querySelectorAll('.expand-button');
  
  expandButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      const areaId = button.dataset.areaId;
      const areaItem = button.closest('.area-item');
      const content = areaItem.querySelector(`.area-content[data-area-id="${areaId}"]`);
      const icon = button.querySelector('.expand-icon');
      
      if (!content.classList.contains('expanded')) {
        // Expand
        content.classList.add('expanded');
        button.classList.add('expanded');
        
        // Track expanded state
        if (element._expandedAreas) {
          element._expandedAreas.add(areaId);
        }
        
        // Lade Entitäten, falls noch nicht geladen
        if (content.querySelector('.loading-placeholder')) {
          const groupedEntities = await getAreaGroupedEntities(areaId, hass);
          const hiddenEntities = getHiddenEntitiesForArea(areaId, config);
          const entityOrders = getEntityOrdersForArea(areaId, config);
          
          const entitiesHTML = renderAreaEntitiesHTML(areaId, groupedEntities, hiddenEntities, entityOrders, hass);
          content.innerHTML = entitiesHTML;
          
          // Attach listeners für die neuen Entity-Checkboxen
          attachEntityCheckboxListeners(content, onEntitiesLoad);
          attachGroupCheckboxListeners(content, onEntitiesLoad);
          attachEntityExpandButtonListeners(content, element);
        }
      } else {
        // Collapse
        content.classList.remove('expanded');
        button.classList.remove('expanded');
        
        // Track collapsed state
        if (element._expandedAreas) {
          element._expandedAreas.delete(areaId);
          element._expandedGroups?.delete(areaId);
        }
      }
    });
  });
}

export function attachGroupCheckboxListeners(element, callback) {
  const groupCheckboxes = element.querySelectorAll('.group-checkbox');
  
  groupCheckboxes.forEach(checkbox => {
    // Set indeterminate state
    if (checkbox.dataset.indeterminate === 'true') {
      checkbox.indeterminate = true;
    }
    
    checkbox.addEventListener('change', (e) => {
      const areaId = e.target.dataset.areaId;
      const group = e.target.dataset.group;
      const isVisible = e.target.checked;
      
      callback(areaId, group, null, isVisible); // null = alle Entities in der Gruppe
      
      // Update alle Entity-Checkboxen in dieser Gruppe
      const entityList = element.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${group}"]`);
      if (entityList) {
        const entityCheckboxes = entityList.querySelectorAll('.entity-checkbox');
        entityCheckboxes.forEach(cb => {
          cb.checked = isVisible;
        });
      }
      
      // Entferne indeterminate state
      e.target.indeterminate = false;
      e.target.removeAttribute('data-indeterminate');
    });
  });
}

export function attachEntityCheckboxListeners(element, callback) {
  const entityCheckboxes = element.querySelectorAll('.entity-checkbox');
  
  entityCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const areaId = e.target.dataset.areaId;
      const group = e.target.dataset.group;
      const entityId = e.target.dataset.entityId;
      const isVisible = e.target.checked;
      
      callback(areaId, group, entityId, isVisible);
      
      // Update Group-Checkbox state (all/some/none checked)
      const entityList = element.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${group}"]`);
      const groupCheckbox = element.querySelector(`.group-checkbox[data-area-id="${areaId}"][data-group="${group}"]`);
      
      if (entityList && groupCheckbox) {
        const allCheckboxes = Array.from(entityList.querySelectorAll('.entity-checkbox'));
        const checkedCount = allCheckboxes.filter(cb => cb.checked).length;
        
        if (checkedCount === 0) {
          groupCheckbox.checked = false;
          groupCheckbox.indeterminate = false;
          groupCheckbox.removeAttribute('data-indeterminate');
        } else if (checkedCount === allCheckboxes.length) {
          groupCheckbox.checked = true;
          groupCheckbox.indeterminate = false;
          groupCheckbox.removeAttribute('data-indeterminate');
        } else {
          groupCheckbox.checked = false;
          groupCheckbox.indeterminate = true;
          groupCheckbox.setAttribute('data-indeterminate', 'true');
        }
      }
    });
  });
}

export function attachEntityExpandButtonListeners(element, editorElement) {
  const expandButtons = element.querySelectorAll('.expand-button-small');
  
  expandButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const areaId = button.dataset.areaId;
      const group = button.dataset.group;
      const entityList = element.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${group}"]`);
      
      if (entityList) {
      if (!entityList.classList.contains('expanded')) {
        entityList.classList.add('expanded');
        button.classList.add('expanded');
        
        // Track expanded state
        if (editorElement._expandedGroups) {
          if (!editorElement._expandedGroups.has(areaId)) {
            editorElement._expandedGroups.set(areaId, new Set());
          }
          editorElement._expandedGroups.get(areaId).add(group);
        }
      } else {
        entityList.classList.remove('expanded');
        button.classList.remove('expanded');
        
        // Track collapsed state
        if (editorElement._expandedGroups) {
          const areaGroups = editorElement._expandedGroups.get(areaId);
          if (areaGroups) {
            areaGroups.delete(group);
          }
        }
      }
      }
    });
  });
}

export function sortAreaItems(element) {
  const areaList = element.querySelector('#area-list');
  if (!areaList) return;

  const items = Array.from(areaList.querySelectorAll('.area-item'));
  items.sort((a, b) => {
    const orderA = parseInt(a.dataset.order);
    const orderB = parseInt(b.dataset.order);
    return orderA - orderB;
  });

  items.forEach(item => areaList.appendChild(item));
}

export function attachDragAndDropListeners(element, onOrderChange) {
  const areaList = element.querySelector('#area-list');
  if (!areaList) return;
  
  const areaItems = areaList.querySelectorAll('.area-item');
  
  let draggedElement = null;
  let dragStartY = 0;
  let isDragging = false;

  const handleDragStart = (ev) => {
    // Nur auf dem Header draggable machen
    const dragHandle = ev.target.closest('.drag-handle');
    if (!dragHandle) {
      ev.preventDefault();
      return;
    }
    
    const areaItem = ev.target.closest('.area-item');
    if (!areaItem) {
      ev.preventDefault();
      return;
    }
    
    areaItem.classList.add('dragging');
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/html', areaItem.innerHTML);
    draggedElement = areaItem;
    dragStartY = ev.clientY || (ev.touches && ev.touches[0]?.clientY) || 0;
    isDragging = true;
  };

  const handleDragEnd = (ev) => {
    const areaItem = ev.target.closest('.area-item');
    if (areaItem) {
      areaItem.classList.remove('dragging');
    }
    
    // Entferne alle drag-over Klassen
    const items = areaList.querySelectorAll('.area-item');
    items.forEach(item => {
      item.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
    });
    
    isDragging = false;
    draggedElement = null;
  };

  const handleDragOver = (ev) => {
    if (ev.preventDefault) {
      ev.preventDefault();
    }
    ev.dataTransfer.dropEffect = 'move';
    
    const item = ev.currentTarget;
    if (item !== draggedElement && draggedElement) {
      // Determine if we're dragging over the top or bottom half
      const rect = item.getBoundingClientRect();
      const y = ev.clientY || (ev.touches && ev.touches[0]?.clientY) || rect.top + rect.height / 2;
      const midpoint = rect.top + rect.height / 2;
      
      // Remove all drag-over classes first
      item.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
      
      if (y < midpoint) {
        item.classList.add('drag-over-top');
      } else {
        item.classList.add('drag-over-bottom');
      }
    }
    
    return false;
  };

  const handleDragLeave = (ev) => {
    const item = ev.currentTarget;
    item.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
  };

  const handleDrop = (ev) => {
    if (ev.stopPropagation) {
      ev.stopPropagation();
    }
    if (ev.preventDefault) {
      ev.preventDefault();
    }

    const dropTarget = ev.currentTarget;
    dropTarget.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');

    if (draggedElement && draggedElement !== dropTarget) {
      const allItems = Array.from(areaList.querySelectorAll('.area-item'));
      const draggedIndex = allItems.indexOf(draggedElement);
      const dropIndex = allItems.indexOf(dropTarget);
      
      // Determine insertion position based on drag-over class
      const isTop = dropTarget.classList.contains('drag-over-top');
      
      if (draggedIndex < dropIndex) {
        if (isTop) {
          dropTarget.parentNode.insertBefore(draggedElement, dropTarget);
        } else {
          dropTarget.parentNode.insertBefore(draggedElement, dropTarget.nextSibling);
        }
      } else {
        if (isTop) {
          dropTarget.parentNode.insertBefore(draggedElement, dropTarget);
        } else {
          dropTarget.parentNode.insertBefore(draggedElement, dropTarget.nextSibling);
        }
      }

      // Update die Reihenfolge in der Config
      onOrderChange();
    }

    return false;
  };

  // Touch event handlers for mobile
  let touchStartY = 0;
  let touchStartElement = null;

  const handleTouchStart = (ev) => {
    const dragHandle = ev.target.closest('.drag-handle');
    if (!dragHandle) return;
    
    const areaItem = ev.target.closest('.area-item');
    if (!areaItem) return;
    
    touchStartElement = areaItem;
    touchStartY = ev.touches[0].clientY;
  };

  const handleTouchMove = (ev) => {
    if (!touchStartElement) return;
    
    const touchY = ev.touches[0].clientY;
    const deltaY = touchY - touchStartY;
    
    // Only start dragging if moved more than 10px
    if (Math.abs(deltaY) > 10 && !isDragging) {
      // Create a drag event
      const dragEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        clientY: touchY
      });
      touchStartElement.dispatchEvent(dragEvent);
    }
  };

  const handleTouchEnd = (ev) => {
    touchStartElement = null;
    touchStartY = 0;
  };

  areaItems.forEach(item => {
    item.setAttribute('draggable', 'true');
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragleave', handleDragLeave);
    
    // Touch support for mobile
    const dragHandle = item.querySelector('.drag-handle');
    if (dragHandle) {
      dragHandle.addEventListener('touchstart', handleTouchStart, { passive: true });
      dragHandle.addEventListener('touchmove', handleTouchMove, { passive: true });
      dragHandle.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
  });
}

// Helper-Funktionen

/**
 * Domain categorization configuration for entity grouping.
 * Only defines exceptions where domain name differs from group name or special logic is needed.
 * Domains not listed here default to using the domain name as the group key.
 */
const DOMAIN_GROUP_MAPPING = {
  'light': 'lights',      // Exception: plural form
  'switch': 'switches',   // Exception: plural form
  'scene': 'scenes',      // Exception: plural form
  'cover': {
    group: (deviceClass) => {
      // Special handling for covers: curtain/blind go to covers_curtain, others to covers
      return (deviceClass === 'curtain' || deviceClass === 'blind') ? 'covers_curtain' : 'covers';
    }
  }
};

/**
 * Gets the group key for an entity based on its domain and device class.
 * @param {string} domain - Entity domain (e.g., 'light', 'cover', 'climate')
 * @param {string} deviceClass - Device class (optional, for covers)
 * @returns {string|null} Group key or null if domain is not supported
 */
function getGroupKeyForEntity(domain, deviceClass) {
  const mapping = DOMAIN_GROUP_MAPPING[domain];
  
  // Handle object with group function (for covers with device class logic)
  if (mapping && typeof mapping === 'object' && mapping.group) {
    return mapping.group(deviceClass);
  }
  
  // Handle explicit string mapping (exceptions like 'light' -> 'lights')
  if (mapping && typeof mapping === 'string') {
    return mapping;
  }
  
  // Default: use domain name as group key (for climate, media_player, vacuum, fan, etc.)
  return mapping === undefined ? domain : null;
}

async function getAreaGroupedEntities(areaId, hass) {
  // NEUES CACHING: Nutze hass.devices und hass.entities (Standard Home Assistant Objects)
  // Keine WebSocket-Calls mehr nötig!
  
  // Konvertiere Objects zu Arrays
  const devices = Object.values(hass.devices || {});
  const entities = Object.values(hass.entities || {});
  
  // Finde alle Geräte im Raum
  const areaDevices = new Set();
  for (const device of devices) {
    if (device.area_id === areaId) {
      areaDevices.add(device.id);
    }
  }
  
  // Initialize grouped entities structure
  const roomEntities = {
    lights: [],
    covers: [],
    covers_curtain: [],
    scenes: [],
    climate: [],
    media_player: [],
    vacuum: [],
    fan: [],
    switches: []
  };
  
  // Build exclude labels set for O(1) lookup
  const excludeLabels = new Set(
    entities
      .filter(e => e.labels?.includes("no_dboard"))
      .map(e => e.entity_id)
  );
  
  // Filter and categorize entities
  for (const entity of entities) {
    // Check if entity belongs to area
    let belongsToArea = false;
    
    if (entity.area_id) {
      belongsToArea = entity.area_id === areaId;
    } else if (entity.device_id && areaDevices.has(entity.device_id)) {
      belongsToArea = true;
    }
    
    if (!belongsToArea) continue;
    if (excludeLabels.has(entity.entity_id)) continue;
    if (!hass.states[entity.entity_id]) continue;
    if (entity.hidden_by || entity.disabled_by) continue;
    
    const entityRegistry = hass.entities?.[entity.entity_id];
    if (entityRegistry && (entityRegistry.hidden_by || entityRegistry.disabled_by)) continue;
    
    // Categorize by domain
    const domain = entity.entity_id.split('.')[0];
    const state = hass.states[entity.entity_id];
    const deviceClass = state.attributes?.device_class;
    
    const groupKey = getGroupKeyForEntity(domain, deviceClass);
    if (groupKey && roomEntities[groupKey]) {
      roomEntities[groupKey].push(entity.entity_id);
    }
  }
  
  return roomEntities;
}

function getHiddenEntitiesForArea(areaId, config) {
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

function getEntityOrdersForArea(areaId, config) {
  const areaOptions = config.areas_options?.[areaId];
  if (!areaOptions || !areaOptions.groups_options) {
    return {};
  }
  
  const orders = {};
  for (const [group, options] of Object.entries(areaOptions.groups_options)) {
    if (options.order) {
      orders[group] = options.order;
    }
  }
  
  return orders;
}