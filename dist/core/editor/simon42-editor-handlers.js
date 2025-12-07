// ====================================================================
// SIMON42 EDITOR HANDLERS
// ====================================================================
// Event-Handler für den Dashboard Strategy Editor

import { renderAreaEntitiesHTML } from './simon42-editor-template.js';
import { t } from '../../utils/simon42-i18n.js';

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
  // Handle icon-button clicks for hide/show (replaces checkbox functionality)
  const hideButtons = element.querySelectorAll('ha-icon-button.area-visibility-toggle[data-area-id]');
  hideButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const areaId = button.dataset.areaId;
      const listItem = button.closest('ha-md-list-item[data-area-id]');
      if (!listItem) return;
      
      // Toggle visibility state
      const isCurrentlyHidden = button.querySelector('ha-svg-icon')?.getAttribute('path')?.includes('M12,9A3,3');
      const isVisible = !isCurrentlyHidden;
      
      // Update icon
      const icon = button.querySelector('ha-svg-icon');
      if (icon) {
        icon.setAttribute('path', isVisible ? 'M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z' : 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z');
      }
      
      // Hide/show area content if expanded
      const content = element.querySelector(`.area-content[data-area-id="${areaId}"]`);
      if (content && !isVisible) {
        content.style.display = 'none';
      }
      
      callback(areaId, isVisible);
    });
  });
}

export function attachExpandButtonListeners(element, hass, config, onEntitiesLoad) {
  // Handle clicks on ha-md-list-item for expansion
  const areaItems = element.querySelectorAll('ha-md-list-item[data-area-id]');
  
  areaItems.forEach(item => {
    item.addEventListener('click', async (e) => {
      // Don't expand if clicking on icon-button or handle
      if (e.target.closest('ha-icon-button') || e.target.closest('.handle')) {
        return;
      }
      
      e.stopPropagation();
      const areaId = item.dataset.areaId;
      
      // Check if area is hidden
      const visibilityButton = item.querySelector('ha-icon-button.area-visibility-toggle');
      const isHidden = visibilityButton?.querySelector('ha-svg-icon')?.getAttribute('path')?.includes('M12,9A3,3');
      if (isHidden) {
        return; // Don't expand hidden areas
      }
      
      const content = element.querySelector(`.area-content[data-area-id="${areaId}"]`);
      
      if (!content) {
        // Create content container if it doesn't exist
        // Place it as sibling after the list item (ha-sortable will ignore it since it's not draggable)
        const contentDiv = document.createElement('div');
        contentDiv.className = 'area-content';
        contentDiv.setAttribute('data-area-id', areaId);
        contentDiv.innerHTML = `<div class="loading-placeholder">${t('loadingEntities')}</div>`;
        item.parentNode.insertBefore(contentDiv, item.nextSibling);
      }
      
      const finalContent = element.querySelector(`.area-content[data-area-id="${areaId}"]`);
      
      // Toggle visibility
      if (finalContent.style.display === 'none' || !finalContent.style.display) {
        finalContent.style.display = 'block';
      } else {
        finalContent.style.display = 'none';
        return;
      }
      
      // Track expanded state
      if (element._expandedAreas) {
        element._expandedAreas.add(areaId);
      }
      
      // Load entities if not already loaded
      if (finalContent.querySelector('.loading-placeholder')) {
        const groupedEntities = await getAreaGroupedEntities(areaId, hass);
        const hiddenEntities = getHiddenEntitiesForArea(areaId, config);
        const entityOrders = getEntityOrdersForArea(areaId, config);
        
        const entitiesHTML = renderAreaEntitiesHTML(areaId, groupedEntities, hiddenEntities, entityOrders, hass);
        finalContent.innerHTML = entitiesHTML;
        
        // Attach listeners for the new entity checkboxes
        attachEntityCheckboxListeners(finalContent, onEntitiesLoad);
        attachGroupCheckboxListeners(finalContent, onEntitiesLoad);
        attachEntityExpandButtonListeners(finalContent, element);
      }
    });
  });
}

export function attachGroupCheckboxListeners(element, callback) {
  // Find MDC switch inputs directly (they have the group-checkbox ID pattern)
  const groupSwitchInputs = element.querySelectorAll('input.mdc-switch__native-control[id^="group-checkbox-"]:not([id*="-hidden-"])');
  
  groupSwitchInputs.forEach(switchInput => {
    // Extract area and group from ID: group-checkbox-{areaId}-{group}
    const match = switchInput.id.match(/^group-checkbox-(.+?)-(.+)$/);
    if (!match) return;
    
    const areaId = match[1];
    const group = match[2];
    
    // Find corresponding hidden checkbox for data attributes and indeterminate state
    const hiddenCheckbox = element.querySelector(`#group-checkbox-hidden-${areaId}-${group}`);
    
    // Add data attributes to switch input for easier access
    switchInput.setAttribute('data-area-id', areaId);
    switchInput.setAttribute('data-group', group);
    
    // Set indeterminate state on hidden checkbox if needed
    if (hiddenCheckbox && hiddenCheckbox.dataset.indeterminate === 'true') {
      hiddenCheckbox.indeterminate = true;
    }
    
    switchInput.addEventListener('change', (e) => {
      const isVisible = e.target.checked;
      
      // Sync hidden checkbox if it exists
      if (hiddenCheckbox) {
        hiddenCheckbox.checked = isVisible;
        hiddenCheckbox.indeterminate = false;
        hiddenCheckbox.removeAttribute('data-indeterminate');
      }
      
      callback(areaId, group, null, isVisible); // null = alle Entities in der Gruppe
      
      // Update alle Entity-Checkboxen in dieser Gruppe
      const entityList = element.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${group}"]`);
      if (entityList) {
        const entitySwitchInputs = entityList.querySelectorAll(`input.mdc-switch__native-control[data-area-id="${areaId}"][data-group="${group}"]`);
        entitySwitchInputs.forEach(cb => {
          cb.checked = isVisible;
          // Also sync hidden checkbox
          const entityId = cb.getAttribute('data-entity-id');
          if (entityId) {
            const hiddenEntityCheckbox = element.querySelector(`#entity-checkbox-hidden-${areaId}-${group}-${entityId}`);
            if (hiddenEntityCheckbox) {
              hiddenEntityCheckbox.checked = isVisible;
            }
          }
        });
      }
    });
  });
}

export function attachEntityCheckboxListeners(element, callback) {
  // Find MDC switch inputs directly (they have the entity-checkbox ID pattern)
  const entitySwitchInputs = element.querySelectorAll('input.mdc-switch__native-control[id^="entity-checkbox-"]:not([id*="-hidden-"])');
  
  entitySwitchInputs.forEach(switchInput => {
    // Extract area, group, and entity from ID: entity-checkbox-{areaId}-{group}-{entityId}
    // Use regex to match the pattern more reliably
    const match = switchInput.id.match(/^entity-checkbox-(.+?)-(.+?)-(.+)$/);
    if (!match) return;
    
    const areaId = match[1];
    const group = match[2];
    const entityId = match[3];
    
    // Find corresponding hidden checkbox for data attributes
    const hiddenCheckbox = element.querySelector(`#entity-checkbox-hidden-${areaId}-${group}-${entityId}`);
    
    // Add data attributes to switch input for easier access
    switchInput.setAttribute('data-area-id', areaId);
    switchInput.setAttribute('data-group', group);
    switchInput.setAttribute('data-entity-id', entityId);
    
    switchInput.addEventListener('change', (e) => {
      const isVisible = e.target.checked;
      
      // Sync hidden checkbox if it exists
      if (hiddenCheckbox) {
        hiddenCheckbox.checked = isVisible;
      }
      
      callback(areaId, group, entityId, isVisible);
      
      // Update Group-Checkbox state (all/some/none checked)
      const entityList = element.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${group}"]`);
      const groupSwitchInput = element.querySelector(`input.mdc-switch__native-control[id="group-checkbox-${areaId}-${group}"]`);
      const groupCheckbox = element.querySelector(`.group-checkbox[data-area-id="${areaId}"][data-group="${group}"]`);
      
      if (entityList && groupSwitchInput && groupCheckbox) {
        const allSwitchInputs = Array.from(entityList.querySelectorAll('input.mdc-switch__native-control[id^="entity-checkbox-"]:not([id*="-hidden-"])'));
        const checkedCount = allSwitchInputs.filter(cb => cb.checked).length;
        
        if (checkedCount === 0) {
          groupSwitchInput.checked = false;
          groupCheckbox.checked = false;
          groupCheckbox.indeterminate = false;
          groupCheckbox.removeAttribute('data-indeterminate');
        } else if (checkedCount === allSwitchInputs.length) {
          groupSwitchInput.checked = true;
          groupCheckbox.checked = true;
          groupCheckbox.indeterminate = false;
          groupCheckbox.removeAttribute('data-indeterminate');
        } else {
          groupSwitchInput.checked = false;
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
  const areaList = element.querySelector('ha-md-list');
  if (!areaList) return;

  const items = Array.from(areaList.querySelectorAll('ha-md-list-item[data-area-id]'));
  items.sort((a, b) => {
    const orderA = parseInt(a.dataset.order);
    const orderB = parseInt(b.dataset.order);
    return orderA - orderB;
  });

  items.forEach(item => {
    const areaId = item.dataset.areaId;
    const content = element.querySelector(`.area-content[data-area-id="${areaId}"]`);
    
    // Move the item
    areaList.appendChild(item);
    
    // Move the associated content div right after the item
    if (content && content.parentNode) {
      content.parentNode.removeChild(content);
      areaList.parentNode.insertBefore(content, item.nextSibling);
    }
  });
}

export function attachDragAndDropListeners(element, onOrderChange) {
  // Use ha-sortable's built-in event system
  const sortable = element.querySelector('ha-sortable');
  if (!sortable) return;
  
  // Listen for item-moved event from ha-sortable
  sortable.addEventListener('item-moved', () => {
    // Update order when items are moved
    onOrderChange();
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