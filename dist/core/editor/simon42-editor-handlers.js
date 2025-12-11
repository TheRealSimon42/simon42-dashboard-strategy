// ====================================================================
// SIMON42 EDITOR HANDLERS
// ====================================================================
// Event-Handler für den Dashboard Strategy Editor

import { renderAreaEntitiesHTML } from './template/simon42-editor-area-renderers.js';
import { t } from '../../utils/i18n/simon42-i18n.js';
import { getExcludedLabels } from '../../utils/helpers/simon42-helpers.js';

/**
 * Creates a checkbox listener attachment function
 * @param {string} selector - CSS selector for the checkbox
 * @returns {Function} Function that attaches listener to element
 */
function createCheckboxListener(selector) {
  return function attachCheckboxListener(element, callback) {
    const switchElement = element.querySelector(selector);
    if (switchElement) {
      // Handle both ha-switch and regular checkboxes
      if (switchElement.tagName === 'HA-SWITCH') {
        switchElement.addEventListener('change', (e) => {
          // Check if switch is disabled
          const isDisabled = switchElement.disabled === true;
          const newValue = e.target.checked;
          
          // If disabled and trying to enable (set to true), prevent the change
          if (isDisabled && newValue === true) {
            // Reset switch to false immediately
            switchElement.checked = false;
            return;
          }
          
          // Allow disabling even if switch is disabled (always safe)
          // Allow all changes if switch is not disabled
          callback(newValue);
        });
      } else {
        switchElement.addEventListener('change', (e) => {
          // Check if switch is disabled
          const isDisabled = switchElement.disabled === true;
          const newValue = e.target.checked;
          
          // If disabled and trying to enable (set to true), prevent the change
          if (isDisabled && newValue === true) {
            // Reset switch to false immediately
            switchElement.checked = false;
            return;
          }
          
          // Allow disabling even if switch is disabled (always safe)
          // Allow all changes if switch is not disabled
          callback(newValue);
        });
      }
    }
  };
}

// Create all checkbox listeners using factory
export const attachWeatherCheckboxListener = createCheckboxListener('#show-weather');
export const attachEnergyCheckboxListener = createCheckboxListener('#show-energy');
export const attachPersonBadgesCheckboxListener = createCheckboxListener('#show-person-badges');
export const attachSearchCardCheckboxListener = createCheckboxListener('#show-search-card');
export const attachClockCardCheckboxListener = createCheckboxListener('#show-clock-card');
export const attachRoomViewsCheckboxListener = createCheckboxListener('#show-room-views');
export const attachGroupByFloorsCheckboxListener = createCheckboxListener('#group-by-floors');
export const attachSummariesCheckboxListener = createCheckboxListener('#show-summaries');
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
  // Attach listeners directly to each visibility toggle button to avoid delegation issues
  const handleVisibilityToggle = (button, listItem) => {
    const areaId = button.dataset.areaId;
    
    // Determine current visibility state from multiple sources for reliability
    const iconElement = button.querySelector('ha-icon');
    const iconState = iconElement?.getAttribute('icon') === 'mdi:eye-off';
    const dataState = listItem.dataset.areaHidden === 'true';
    const classState = listItem.classList.contains('area-hidden');
    // If any indicator says it's hidden, treat it as hidden
    const isCurrentlyHidden = iconState || dataState || classState;
    
    // Toggle: Calculate the NEW visibility state after clicking
    // If currently hidden, clicking should SHOW it (remove from hidden list) → isVisible = true
    // If currently visible, clicking should HIDE it (add to hidden list) → isVisible = false
    // The new state is the opposite of the current hidden state
    const isVisible = !isCurrentlyHidden;
    
    // Update icon
    const icon = button.querySelector('ha-icon');
    if (icon) {
      icon.setAttribute('icon', isVisible ? 'mdi:eye' : 'mdi:eye-off');
    }
    
    // Update list item classes and data attributes
    if (isVisible) {
      listItem.classList.remove('area-hidden');
      listItem.dataset.areaHidden = 'false';
      // Remove hint text if present
      const hint = listItem.querySelector('span.area-hidden-hint');
      if (hint) {
        hint.remove();
      }
    } else {
      listItem.classList.add('area-hidden');
      listItem.dataset.areaHidden = 'true';
      // Remove hint text if present (no longer needed since hidden areas can be expanded)
      const hint = listItem.querySelector('span.area-hidden-hint');
      if (hint) {
        hint.remove();
      }
    }
    
    // Update aria-label
    button.setAttribute('aria-label', `${listItem.querySelector('span[slot="headline"]')?.textContent || areaId} ${isVisible ? t('show') : t('hide')}`);
    
    // Hide/show area content if expanded
    const content = element.querySelector(`.area-content[data-area-id="${areaId}"]`);
    if (content && !isVisible) {
      content.style.display = 'none';
    }
    
    callback(areaId, isVisible);
  };
  
  // Attach listeners to existing buttons
  const buttons = element.querySelectorAll('ha-icon-button.area-visibility-toggle[data-area-id]');
  buttons.forEach(button => {
    // Skip if already has listener attached (marked with data attribute)
    if (button.dataset.visibilityListenerAttached === 'true') {
      return;
    }
    
    const listItem = button.closest('ha-md-list-item[data-area-id]');
    if (!listItem) return;
    
    // Attach listener to button - clicks on icon inside will bubble to button
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      handleVisibilityToggle(button, listItem);
    });
    
    // Mark as having listener attached
    button.dataset.visibilityListenerAttached = 'true';
  });
  
  // Also use event delegation as fallback for dynamically added buttons
  // This handles clicks on the button itself or the icon inside it
  const areaList = element.querySelector('ha-md-list');
  if (areaList) {
    areaList.addEventListener('click', (e) => {
      // Check if click is on the button or icon inside it
      const button = e.target.closest('ha-icon-button.area-visibility-toggle[data-area-id]');
      if (!button) return;
      
      const listItem = button.closest('ha-md-list-item[data-area-id]');
      if (!listItem) return;
      
      // Always handle the click via delegation to ensure it works
      // Stop propagation to prevent list item expansion
      e.stopPropagation();
      e.preventDefault();
      handleVisibilityToggle(button, listItem);
      
      // Attach direct listener for future clicks if not already attached
      if (button.dataset.visibilityListenerAttached !== 'true') {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          handleVisibilityToggle(button, listItem);
        });
        button.dataset.visibilityListenerAttached = 'true';
      }
    });
  }
}

export function attachExpandButtonListeners(element, hass, config, onEntitiesLoad) {
  // Handle clicks on ha-md-list-item for expansion
  const areaItems = element.querySelectorAll('ha-md-list-item[data-area-id]');
  
  areaItems.forEach(item => {
    item.addEventListener('click', async (e) => {
      // Don't expand if clicking on visibility toggle button or handle
      // This allows the button's own click handler to work
      if (e.target.closest('ha-icon-button.area-visibility-toggle') || e.target.closest('.handle')) {
        return; // Return early without stopPropagation to allow event to bubble to delegation handler
      }
      
      e.stopPropagation();
      const areaId = item.dataset.areaId;
      
      const areaList = item.closest('ha-md-list');
      if (!areaList) return;
      
      let content = areaList.querySelector(`.area-content[data-area-id="${areaId}"]`);
      
      if (!content) {
        // Create content container if it doesn't exist
        // Place it as sibling after the list item (ha-sortable will ignore it since it's not draggable)
        const contentDiv = document.createElement('div');
        contentDiv.className = 'area-content';
        contentDiv.setAttribute('data-area-id', areaId);
        contentDiv.innerHTML = `<div class="loading-placeholder">${t('loadingEntities')}</div>`;
        // Insert right after the item within the list
        areaList.insertBefore(contentDiv, item.nextSibling);
        content = contentDiv;
      } else {
        // Ensure content is positioned right after the item
        if (content.parentNode !== areaList || content.previousSibling !== item) {
          // Remove from current position
          if (content.parentNode) {
            content.parentNode.removeChild(content);
          }
          // Insert right after the item
          areaList.insertBefore(content, item.nextSibling);
        }
      }
      
      const finalContent = content;
      
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
      const loadingPlaceholder = finalContent.querySelector('.loading-placeholder');
      const hasEntities = finalContent.querySelector('.entity-groups');
      
      if (loadingPlaceholder || (!hasEntities && finalContent.children.length === 0)) {
        // Show loading state
        if (loadingPlaceholder) {
          loadingPlaceholder.textContent = t('loadingEntities');
        } else {
          finalContent.innerHTML = `<div class="loading-placeholder">${t('loadingEntities')}</div>`;
        }
        
        try {
          const groupedEntities = await getAreaGroupedEntities(areaId, hass);
          const hiddenEntities = getHiddenEntitiesForArea(areaId, config);
          const entityOrders = getEntityOrdersForArea(areaId, config);
          
          const entitiesHTML = renderAreaEntitiesHTML(areaId, groupedEntities, hiddenEntities, entityOrders, hass);
          finalContent.innerHTML = entitiesHTML;
          
          // Attach listeners for the new entity checkboxes
          attachEntityCheckboxListeners(finalContent, onEntitiesLoad);
          attachGroupCheckboxListeners(finalContent, onEntitiesLoad);
          attachEntityExpandButtonListeners(finalContent, element);
          
          // Initialize MDC switches in the newly loaded content
          if (element._initializeMDCSwitches) {
            element._initializeMDCSwitches();
          }
        } catch (error) {
          console.error('Error loading area entities:', error);
          finalContent.innerHTML = `<div class="empty-state">${t('errorLoadingEntities')}</div>`;
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
    
    // Sync ha-switch with hidden checkbox
    const areaId = checkbox.dataset.areaId;
    const group = checkbox.dataset.group;
    const haSwitch = element.querySelector(`#group-checkbox-${areaId}-${group}`);
    if (haSwitch && haSwitch.tagName === 'HA-SWITCH') {
      // Initialize switch state from checkbox
      haSwitch.checked = checkbox.checked;
      
      haSwitch.addEventListener('change', (e) => {
        checkbox.checked = e.target.checked;
        checkbox.dispatchEvent(new Event('change'));
      });
    }
    
    checkbox.addEventListener('change', (e) => {
      const areaId = e.target.dataset.areaId;
      const group = e.target.dataset.group;
      const isVisible = e.target.checked;
      
      // Update ha-switch
      const haSwitch = element.querySelector(`#group-checkbox-${areaId}-${group}`);
      if (haSwitch && haSwitch.tagName === 'HA-SWITCH') {
        haSwitch.checked = isVisible;
      }
      
      callback(areaId, group, null, isVisible); // null = alle Entities in der Gruppe
      
      // Update alle Entity-Checkboxen in dieser Gruppe
      const entityList = element.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${group}"]`);
      if (entityList) {
        const entityCheckboxes = entityList.querySelectorAll('.entity-checkbox');
        entityCheckboxes.forEach(cb => {
          cb.checked = isVisible;
          // Update corresponding ha-switch
          const entityId = cb.dataset.entityId;
          const entityHaSwitch = element.querySelector(`#entity-checkbox-${areaId}-${group}-${entityId}`);
          if (entityHaSwitch && entityHaSwitch.tagName === 'HA-SWITCH') {
            entityHaSwitch.checked = isVisible;
          }
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
    // Sync ha-switch with hidden checkbox
    const entityId = checkbox.dataset.entityId;
    const areaId = checkbox.dataset.areaId;
    const group = checkbox.dataset.group;
    const haSwitch = element.querySelector(`#entity-checkbox-${areaId}-${group}-${entityId}`);
    if (haSwitch && haSwitch.tagName === 'HA-SWITCH') {
      // Initialize switch state from checkbox
      haSwitch.checked = checkbox.checked;
      
      haSwitch.addEventListener('change', (e) => {
        checkbox.checked = e.target.checked;
        checkbox.dispatchEvent(new Event('change'));
      });
    }
    
    checkbox.addEventListener('change', (e) => {
      const areaId = e.target.dataset.areaId;
      const group = e.target.dataset.group;
      const entityId = e.target.dataset.entityId;
      const isVisible = e.target.checked;
      
      // Update ha-switch
      const haSwitch = element.querySelector(`#entity-checkbox-${areaId}-${group}-${entityId}`);
      if (haSwitch && haSwitch.tagName === 'HA-SWITCH') {
        haSwitch.checked = isVisible;
      }
      
      callback(areaId, group, entityId, isVisible);
      
      // Update Group-Checkbox state (all/some/none checked)
      const entityList = element.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${group}"]`);
      const groupCheckbox = element.querySelector(`.group-checkbox[data-area-id="${areaId}"][data-group="${group}"]`);
      
      if (entityList && groupCheckbox) {
        const allCheckboxes = Array.from(entityList.querySelectorAll('.entity-checkbox'));
        const checkedCount = allCheckboxes.filter(cb => cb.checked).length;
        
        const groupHaSwitch = element.querySelector(`#group-checkbox-${areaId}-${group}`);
        
        if (checkedCount === 0) {
          groupCheckbox.checked = false;
          groupCheckbox.indeterminate = false;
          groupCheckbox.removeAttribute('data-indeterminate');
          if (groupHaSwitch && groupHaSwitch.tagName === 'HA-SWITCH') {
            groupHaSwitch.checked = false;
          }
        } else if (checkedCount === allCheckboxes.length) {
          groupCheckbox.checked = true;
          groupCheckbox.indeterminate = false;
          groupCheckbox.removeAttribute('data-indeterminate');
          if (groupHaSwitch && groupHaSwitch.tagName === 'HA-SWITCH') {
            groupHaSwitch.checked = true;
          }
        } else {
          groupCheckbox.checked = false;
          groupCheckbox.indeterminate = true;
          groupCheckbox.setAttribute('data-indeterminate', 'true');
          if (groupHaSwitch && groupHaSwitch.tagName === 'HA-SWITCH') {
            // ha-switch doesn't support indeterminate state, so we'll leave it unchecked
            groupHaSwitch.checked = false;
          }
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
    const content = areaList.querySelector(`.area-content[data-area-id="${areaId}"]`);
    
    // Move the item
    areaList.appendChild(item);
    
    // Move the associated content div right after the item within the list
    if (content) {
      // Remove from current position if it exists
      if (content.parentNode) {
        content.parentNode.removeChild(content);
      }
      // Insert right after the item within the list
      areaList.insertBefore(content, item.nextSibling);
    }
  });
}

export function attachDragAndDropListeners(element, onOrderChange) {
  // Use ha-sortable's built-in event system
  const sortable = element.querySelector('ha-sortable');
  if (!sortable) return;
  
  // Listen for item-moved event from ha-sortable
  sortable.addEventListener('item-moved', () => {
    // After items are moved, ensure all area-content divs are positioned correctly
    // This ensures content stays with its item even if ha-sortable only moves the items
    const areaList = element.querySelector('ha-md-list');
    if (!areaList) {
      onOrderChange();
      return;
    }
    
    // Get all items in their current order
    const items = Array.from(areaList.querySelectorAll('ha-md-list-item[data-area-id]'));
    
    // For each item, ensure its content div is positioned right after it
    items.forEach(item => {
      const areaId = item.dataset.areaId;
      if (!areaId) return;
      
      const content = areaList.querySelector(`.area-content[data-area-id="${areaId}"]`);
      if (!content) return;
      
      // Check if content is already in the right position
      if (content.previousSibling === item && content.parentNode === areaList) {
        // Already in correct position
        return;
      }
      
      // Remove content from current position
      if (content.parentNode) {
        content.parentNode.removeChild(content);
      }
      
      // Insert content right after the item
      const nextSibling = item.nextSibling;
      areaList.insertBefore(content, nextSibling);
    });
    
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
  const excludeLabels = new Set(getExcludedLabels(entities));
  
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

// getHiddenEntitiesForArea is now imported from config extractors

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