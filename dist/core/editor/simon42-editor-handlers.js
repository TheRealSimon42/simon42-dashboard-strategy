// ====================================================================
// SIMON42 EDITOR HANDLERS
// ====================================================================
// Event-Handler für den Dashboard Strategy Editor

import { renderAreaEntitiesHTML } from './simon42-editor-template.js';

export function attachPersonBadgesCheckboxListener(element, callback) {
  const personBadgesCheckbox = element.querySelector('#show-person-badges');
  if (personBadgesCheckbox) {
    personBadgesCheckbox.addEventListener('change', (e) => {
      callback(e.target.checked);
    });
  }
}

export function attachWeatherCheckboxListener(element, callback) {
  const weatherCheckbox = element.querySelector('#show-weather');
  if (weatherCheckbox) {
    weatherCheckbox.addEventListener('change', (e) => {
      callback(e.target.checked);
    });
  }
}

export function attachEnergyCheckboxListener(element, callback) {
  const energyCheckbox = element.querySelector('#show-energy');
  if (energyCheckbox) {
    energyCheckbox.addEventListener('change', (e) => {
      callback(e.target.checked);
    });
  }
}

export function attachSearchCardCheckboxListener(element, callback) {
  const searchCardCheckbox = element.querySelector('#show-search-card');
  if (searchCardCheckbox) {
    searchCardCheckbox.addEventListener('change', (e) => {
      callback(e.target.checked);
    });
  }
}

export function attachSummaryViewsCheckboxListener(element, callback) {
  const summaryViewsCheckbox = element.querySelector('#show-summary-views');
  if (summaryViewsCheckbox) {
    summaryViewsCheckbox.addEventListener('change', (e) => {
      callback(e.target.checked);
    });
  }
}

export function attachRoomViewsCheckboxListener(element, callback) {
  const roomViewsCheckbox = element.querySelector('#show-room-views');
  if (roomViewsCheckbox) {
    roomViewsCheckbox.addEventListener('change', (e) => {
      callback(e.target.checked);
    });
  }
}

export function attachGroupByFloorsCheckboxListener(element, callback) {
  const groupByFloorsCheckbox = element.querySelector('#group-by-floors');
  if (groupByFloorsCheckbox) {
    groupByFloorsCheckbox.addEventListener('change', (e) => {
      callback(e.target.checked);
    });
  }
}

export function attachCoversSummaryCheckboxListener(element, callback) {
  const coversSummaryCheckbox = element.querySelector('#show-covers-summary');
  if (coversSummaryCheckbox) {
    coversSummaryCheckbox.addEventListener('change', (e) => {
      callback(e.target.checked);
    });
  }
}

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
      
      if (content.style.display === 'none') {
        // Expand
        content.style.display = 'block';
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
        content.style.display = 'none';
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
        if (entityList.style.display === 'none') {
          entityList.style.display = 'block';
          button.classList.add('expanded');
          
          // Track expanded state
          if (editorElement._expandedGroups) {
            if (!editorElement._expandedGroups.has(areaId)) {
              editorElement._expandedGroups.set(areaId, new Set());
            }
            editorElement._expandedGroups.get(areaId).add(group);
          }
        } else {
          entityList.style.display = 'none';
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
  };

  const handleDragEnd = (ev) => {
    const areaItem = ev.target.closest('.area-item');
    if (areaItem) {
      areaItem.classList.remove('dragging');
    }
    
    // Entferne alle drag-over Klassen
    const items = areaList.querySelectorAll('.area-item');
    items.forEach(item => item.classList.remove('drag-over'));
  };

  const handleDragOver = (ev) => {
    if (ev.preventDefault) {
      ev.preventDefault();
    }
    ev.dataTransfer.dropEffect = 'move';
    
    const item = ev.currentTarget;
    if (item !== draggedElement) {
      item.classList.add('drag-over');
    }
    
    return false;
  };

  const handleDragLeave = (ev) => {
    ev.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (ev) => {
    if (ev.stopPropagation) {
      ev.stopPropagation();
    }
    if (ev.preventDefault) {
      ev.preventDefault();
    }

    const dropTarget = ev.currentTarget;
    dropTarget.classList.remove('drag-over');

    if (draggedElement && draggedElement !== dropTarget) {
      const allItems = Array.from(areaList.querySelectorAll('.area-item'));
      const draggedIndex = allItems.indexOf(draggedElement);
      const dropIndex = allItems.indexOf(dropTarget);

      if (draggedIndex < dropIndex) {
        dropTarget.parentNode.insertBefore(draggedElement, dropTarget.nextSibling);
      } else {
        dropTarget.parentNode.insertBefore(draggedElement, dropTarget);
      }

      // Update die Reihenfolge in der Config
      onOrderChange();
    }

    return false;
  };

  areaItems.forEach(item => {
    item.setAttribute('draggable', 'true');
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragleave', handleDragLeave);
  });
}

// Helper-Funktionen

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
  
  // Gruppiere Entitäten
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
  
  // Labels für Filterung
  const excludeLabels = entities
    .filter(e => e.labels?.includes("no_dboard"))
    .map(e => e.entity_id);
  
  for (const entity of entities) {
    // Prüfe ob Entität zum Raum gehört
    let belongsToArea = false;
    
    if (entity.area_id) {
      belongsToArea = entity.area_id === areaId;
    } else if (entity.device_id && areaDevices.has(entity.device_id)) {
      belongsToArea = true;
    }
    
    if (!belongsToArea) continue;
    if (excludeLabels.includes(entity.entity_id)) continue;
    if (!hass.states[entity.entity_id]) continue;
    if (entity.hidden_by || entity.disabled_by) continue;
    
    const entityRegistry = hass.entities?.[entity.entity_id];
    if (entityRegistry && (entityRegistry.hidden_by || entityRegistry.disabled_by)) continue;
    
    const domain = entity.entity_id.split('.')[0];
    const state = hass.states[entity.entity_id];
    const deviceClass = state.attributes?.device_class;
    
    // Kategorisiere nach Domain
    if (domain === 'light') {
      roomEntities.lights.push(entity.entity_id);
    } 
    else if (domain === 'cover') {
      if (deviceClass === 'curtain' || deviceClass === 'blind') {
        roomEntities.covers_curtain.push(entity.entity_id);
      } else {
        roomEntities.covers.push(entity.entity_id);
      }
    }
    else if (domain === 'scene') {
      roomEntities.scenes.push(entity.entity_id);
    }
    else if (domain === 'climate') {
      roomEntities.climate.push(entity.entity_id);
    }
    else if (domain === 'media_player') {
      roomEntities.media_player.push(entity.entity_id);
    }
    else if (domain === 'vacuum') {
      roomEntities.vacuum.push(entity.entity_id);
    }
    else if (domain === 'fan') {
      roomEntities.fan.push(entity.entity_id);
    }
    else if (domain === 'switch') {
      roomEntities.switches.push(entity.entity_id);
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