// ====================================================================
// SIMON42 DASHBOARD EDITOR - Event Handlers
// ====================================================================
// Event-Handler für den grafischen Editor
// ====================================================================

// Export der Attach-Funktionen

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

export function attachSubviewsCheckboxListener(element, callback) {
  const subviewsCheckbox = element.querySelector('#show-subviews');
  if (subviewsCheckbox) {
    subviewsCheckbox.addEventListener('change', (e) => {
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

export function attachAreaCheckboxListeners(element, callback) {
  const areaCheckboxes = element.querySelectorAll('.area-checkbox');
  
  areaCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const areaId = e.target.dataset.areaId;
      const isVisible = e.target.checked;
      
      callback(areaId, null, null, isVisible); // null, null = kompletter Bereich
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
    });
  });
}

export function attachEntityExpandButtonListeners(element, editorElement) {
  const expandButtons = element.querySelectorAll('.expand-group-button');
  
  expandButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const areaId = button.dataset.areaId;
      const group = button.dataset.group;
      const groupId = `${areaId}-${group}`;
      
      const content = element.querySelector(`.entity-list-content[data-group-id="${groupId}"]`);
      
      if (content.style.display === 'none') {
        content.style.display = 'block';
        button.classList.add('expanded');
        
        // Track expanded state pro Bereich UND Gruppe
        if (editorElement._expandedGroups) {
          if (!editorElement._expandedGroups.has(areaId)) {
            editorElement._expandedGroups.set(areaId, new Set());
          }
          editorElement._expandedGroups.get(areaId).add(group);
        }
      } else {
        content.style.display = 'none';
        button.classList.remove('expanded');
        
        if (editorElement._expandedGroups) {
          editorElement._expandedGroups.get(areaId)?.delete(group);
        }
      }
    });
  });
}

export function attachExpandButtonListeners(element, hass, config, onEntitiesLoad) {
  const expandButtons = element.querySelectorAll('.expand-button');
  
  expandButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const areaId = button.dataset.areaId;
      const content = element.querySelector(`.area-content[data-area-id="${areaId}"]`);
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
      const groupId = `${areaId}-${group}`;
      const entityCheckboxes = element.querySelectorAll(
        `.entity-checkbox[data-area-id="${areaId}"][data-group="${group}"]`
      );
      
      entityCheckboxes.forEach(entityCheckbox => {
        if (entityCheckbox.checked !== isVisible) {
          entityCheckbox.checked = isVisible;
          // Trigger auch die Entity-Callback
          const entityId = entityCheckbox.dataset.entityId;
          callback(areaId, group, entityId, isVisible);
        }
      });
      
      // Entferne indeterminate State
      checkbox.indeterminate = false;
    });
  });
}

export function attachDragAndDropListeners(element) {
  const areaItems = element.querySelectorAll('.area-item');
  
  let draggedElement = null;
  let placeholder = null;

  const createPlaceholder = () => {
    const div = document.createElement('div');
    div.className = 'drag-placeholder';
    div.style.height = '60px';
    div.style.background = 'var(--primary-color, #03a9f4)';
    div.style.opacity = '0.2';
    div.style.border = '2px dashed var(--primary-color, #03a9f4)';
    div.style.borderRadius = '8px';
    div.style.margin = '8px 0';
    return div;
  };

  const handleDragStart = (e) => {
    draggedElement = e.target.closest('.area-item');
    draggedElement.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', draggedElement.innerHTML);
    
    // Erstelle Placeholder
    placeholder = createPlaceholder();
  };

  const handleDragEnd = (e) => {
    draggedElement.style.opacity = '1';
    
    // Entferne Placeholder
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.removeChild(placeholder);
    }
    
    // Entferne alle drag-over Klassen
    areaItems.forEach(item => {
      item.classList.remove('drag-over');
    });
  };

  const handleDragOver = (e) => {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    const afterElement = getDragAfterElement(e.target.closest('.area-list'), e.clientY);
    const container = e.target.closest('.area-list');
    
    if (afterElement == null) {
      container.appendChild(placeholder);
    } else {
      container.insertBefore(placeholder, afterElement);
    }
    
    return false;
  };

  const handleDrop = (e) => {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    
    if (draggedElement !== e.target.closest('.area-item')) {
      // Verschiebe das Element
      const afterElement = placeholder;
      const container = e.target.closest('.area-list');
      container.insertBefore(draggedElement, afterElement);
      
      // Trigger custom event für Config-Update
      const event = new CustomEvent('areas-reordered', {
        detail: {
          areaIds: Array.from(container.querySelectorAll('.area-item')).map(
            item => item.dataset.areaId
          )
        },
        bubbles: true,
        composed: true
      });
      element.dispatchEvent(event);
    }
    
    return false;
  };

  const handleDragLeave = (e) => {
    e.target.closest('.area-item')?.classList.remove('drag-over');
  };

  const getDragAfterElement = (container, y) => {
    const draggableElements = [...container.querySelectorAll('.area-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  };

  // Nur Drag-Handles sollen draggable sein
  const dragHandles = element.querySelectorAll('.drag-handle');
  dragHandles.forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      const areaItem = handle.closest('.area-item');
      areaItem.setAttribute('draggable', 'true');
    });
    
    handle.addEventListener('mouseup', (e) => {
      const areaItem = handle.closest('.area-item');
      areaItem.removeAttribute('draggable');
    });
  });

  // Verhindere Drag auf anderen Elementen
  areaItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      if (!item.hasAttribute('draggable')) {
        e.preventDefault();
        return false;
      }
      handleDragStart(e);
    });

    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragleave', handleDragLeave);
  });
}

// Helper-Funktionen

async function getAreaGroupedEntities(areaId, hass) {
  // Nutze die bereits im hass-Objekt verfügbaren Registry-Daten
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

function renderAreaEntitiesHTML(areaId, groupedEntities, hiddenEntities, entityOrders, hass) {
  const groupLabels = {
    lights: 'Beleuchtung',
    covers: 'Rollos & Jalousien',
    covers_curtain: 'Vorhänge',
    scenes: 'Szenen',
    climate: 'Klima',
    media_player: 'Medien',
    vacuum: 'Staubsauger',
    fan: 'Lüfter',
    switches: 'Schalter'
  };

  const groupIcons = {
    lights: 'mdi:lightbulb',
    covers: 'mdi:window-shutter',
    covers_curtain: 'mdi:curtains',
    scenes: 'mdi:palette',
    climate: 'mdi:thermostat',
    media_player: 'mdi:cast',
    vacuum: 'mdi:robot-vacuum',
    fan: 'mdi:fan',
    switches: 'mdi:light-switch'
  };

  let html = '';

  for (const [group, entityIds] of Object.entries(groupedEntities)) {
    if (entityIds.length === 0) continue;

    const groupHidden = hiddenEntities[group] || [];
    const groupOrder = entityOrders[group] || [];
    
    // Sortiere Entities nach Order (falls vorhanden)
    let sortedEntities = [...entityIds];
    if (groupOrder.length > 0) {
      sortedEntities.sort((a, b) => {
        const indexA = groupOrder.indexOf(a);
        const indexB = groupOrder.indexOf(b);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
      });
    }
    
    const visibleCount = entityIds.filter(id => !groupHidden.includes(id)).length;
    const totalCount = entityIds.length;
    const allVisible = visibleCount === totalCount;
    const someVisible = visibleCount > 0 && visibleCount < totalCount;

    const groupId = `${areaId}-${group}`;

    html += `
      <div class="entity-group">
        <div class="entity-group-header">
          <label class="group-checkbox-label">
            <input 
              type="checkbox" 
              class="group-checkbox" 
              data-area-id="${areaId}" 
              data-group="${group}"
              ${allVisible ? 'checked' : ''}
              ${someVisible ? 'data-indeterminate="true"' : ''}
            />
            <ha-icon icon="${groupIcons[group]}" class="group-icon"></ha-icon>
            <span class="group-name">${groupLabels[group]}</span>
            <span class="entity-count">(${visibleCount}/${totalCount})</span>
          </label>
          <button class="expand-group-button" data-area-id="${areaId}" data-group="${group}">
            <ha-icon icon="mdi:chevron-right" class="expand-icon"></ha-icon>
          </button>
        </div>
        <div class="entity-list-content" data-group-id="${groupId}" style="display: none;">
          ${sortedEntities.map(entityId => {
            const state = hass.states[entityId];
            const isHidden = groupHidden.includes(entityId);
            const friendlyName = state?.attributes?.friendly_name || entityId;
            
            return `
              <label class="entity-checkbox-label">
                <input 
                  type="checkbox" 
                  class="entity-checkbox" 
                  data-area-id="${areaId}" 
                  data-group="${group}" 
                  data-entity-id="${entityId}"
                  ${!isHidden ? 'checked' : ''}
                />
                <span class="entity-name">${friendlyName}</span>
                <span class="entity-id">${entityId}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  return html || '<div class="no-entities">Keine Entitäten gefunden</div>';
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
