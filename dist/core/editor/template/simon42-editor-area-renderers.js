// ====================================================================
// EDITOR AREA RENDERERS
// ====================================================================
// Renders area-specific HTML (area items, area entities)
// ====================================================================

import { t } from '../../../utils/system/simon42-i18n.js';
import { renderMDCSwitch } from './simon42-editor-form-renderers.js';

function getEntityCountForArea(areaId, hass) {
  if (!hass || !hass.devices || !hass.entities) {
    return 0;
  }
  
  // Convert objects to arrays
  const devices = Object.values(hass.devices);
  const entities = Object.values(hass.entities);
  
  // Find all devices in the area
  const areaDevices = new Set();
  for (const device of devices) {
    if (device.area_id === areaId) {
      areaDevices.add(device.id);
    }
  }
  
  // Build exclude labels set for O(1) lookup
  const excludeLabels = new Set(
    entities
      .filter(e => e.labels?.includes("no_dboard"))
      .map(e => e.entity_id)
  );
  
  // Count entities in this area
  let count = 0;
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
    
    // Count this entity
    count++;
  }
  
  return count;
}

export function renderAreaItems(allAreas, hiddenAreas, areaOrder, hass = null) {
  if (allAreas.length === 0) {
    return `<ha-md-list-item disabled><span slot="headline">${t('noAreasAvailable')}</span></ha-md-list-item>`;
  }

  return allAreas.map((area, index) => {
    const isHidden = hiddenAreas.includes(area.area_id);
    const orderIndex = areaOrder.indexOf(area.area_id);
    const displayOrder = orderIndex !== -1 ? orderIndex : 9999 + index;
    
    // Get entity count for this area
    const entityCount = hass ? getEntityCountForArea(area.area_id, hass) : 0;
    
    return `
      <ha-md-list-item type="button" class="draggable ${isHidden ? 'area-hidden' : ''}" data-area-id="${area.area_id}" data-order="${displayOrder}" data-area-hidden="${isHidden}">
        <ha-icon class="icon" slot="start" icon="${area.icon || 'mdi:home'}"></ha-icon>
        <span slot="headline">${area.name}${entityCount > 0 ? ` <span class="entity-count">(${entityCount})</span>` : ''}</span>
        ${isHidden ? `<span slot="supporting-text" class="area-hidden-hint">${t('areaHiddenCannotExpand')}</span>` : ''}
        <ha-icon-button slot="end" class="area-visibility-toggle" data-area-id="${area.area_id}" aria-label="${area.name} ${isHidden ? t('show') : t('hide')}">
          <ha-icon icon="${isHidden ? 'mdi:eye-off' : 'mdi:eye'}"></ha-icon>
        </ha-icon-button>
        <ha-icon class="handle" slot="end" icon="mdi:drag"></ha-icon>
      </ha-md-list-item>
      <div class="area-content" data-area-id="${area.area_id}" style="display: none;">
        <div class="loading-placeholder">${t('loadingEntities')}</div>
      </div>
    `;
  }).join('');
}

export function renderAreaEntitiesHTML(areaId, groupedEntities, hiddenEntities, entityOrders, hass) {
  const domainGroups = [
    { key: 'lights', label: t('lighting'), icon: 'mdi:lightbulb' },
    { key: 'climate', label: t('climate'), icon: 'mdi:thermostat' },
    { key: 'covers', label: t('blinds'), icon: 'mdi:window-shutter' },
    { key: 'covers_curtain', label: t('curtains'), icon: 'mdi:curtains' },
    { key: 'media_player', label: t('media'), icon: 'mdi:speaker' },
    { key: 'scenes', label: t('scenes'), icon: 'mdi:palette' },
    { key: 'vacuum', label: t('vacuum'), icon: 'mdi:robot-vacuum' },
    { key: 'fan', label: t('fans'), icon: 'mdi:fan' },
    { key: 'switches', label: t('switches'), icon: 'mdi:light-switch' }
  ];

  let html = '<div class="entity-groups">';

  domainGroups.forEach(group => {
    const entities = groupedEntities[group.key] || [];
    if (entities.length === 0) return;

    const hiddenInGroup = hiddenEntities[group.key] || [];
    const allHidden = entities.every(e => hiddenInGroup.includes(e));
    const someHidden = entities.some(e => hiddenInGroup.includes(e)) && !allHidden;

    html += `
      <div class="entity-group" data-group="${group.key}">
        <div class="entity-group-header">
          ${renderMDCSwitch(`group-checkbox-${areaId}-${group.key}`, !allHidden, group.label)}
          <input 
            type="checkbox" 
            class="group-checkbox mdc-switch__native-control" 
            id="group-checkbox-hidden-${areaId}-${group.key}"
            data-area-id="${areaId}"
            data-group="${group.key}"
            ${!allHidden ? 'checked' : ''}
            ${someHidden ? 'data-indeterminate="true"' : ''}
            style="display: none;"
          />
          <ha-icon icon="${group.icon}"></ha-icon>
          <span class="group-name">${group.label}</span>
          <span class="entity-count">(${entities.length})</span>
          <button class="expand-button-small" data-area-id="${areaId}" data-group="${group.key}">
            <span class="expand-icon-small">▶</span>
          </button>
        </div>
        <div class="entity-list" data-area-id="${areaId}" data-group="${group.key}">
          ${entities.map(entityId => {
            const state = hass.states[entityId];
            const name = state?.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
            const isHidden = hiddenInGroup.includes(entityId);
            
            return `
              <div class="entity-item">
                ${renderMDCSwitch(`entity-checkbox-${areaId}-${group.key}-${entityId}`, !isHidden, name)}
                <input 
                  type="checkbox" 
                  class="entity-checkbox mdc-switch__native-control" 
                  id="entity-checkbox-hidden-${areaId}-${group.key}-${entityId}"
                  data-area-id="${areaId}"
                  data-group="${group.key}"
                  data-entity-id="${entityId}"
                  ${!isHidden ? 'checked' : ''}
                  style="display: none;"
                />
                <span class="entity-name">${name}</span>
                <span class="entity-id">${entityId}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  });

  html += '</div>';

  if (html === '<div class="entity-groups"></div>') {
    return `<div class="empty-state">${t('noEntitiesInArea')}</div>`;
  }

  return html;
}

