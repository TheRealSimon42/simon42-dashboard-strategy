// ====================================================================
// SIMON42 EDITOR TEMPLATE
// ====================================================================
// HTML-Template für den Dashboard Strategy Editor

export function renderEditorHTML({ allAreas, hiddenAreas, areaOrder, showEnergy, showSubviews }) {
  return `
    <div class="card-config">
      <div class="section">
        <div class="section-title">Energie-Dashboard</div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-energy" 
            ${showEnergy ? 'checked' : ''}
          />
          <label for="show-energy">Energie-Dashboard anzeigen</label>
        </div>
        <div class="description">
          Zeigt die Energie-Verteilungskarte in der Übersicht an, wenn Energiedaten verfügbar sind.
        </div>
      </div>

      <div class="section">
        <div class="section-title">Ansichten</div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-subviews" 
            ${showSubviews ? 'checked' : ''}
          />
          <label for="show-subviews">Unteransichten anzeigen</label>
        </div>
        <div class="description">
          Zeigt die Unteransichten (Lichter, Rollos, Sicherheit, Batterien, Räume) in der oberen Navigation an.
        </div>
      </div>

      <div class="section">
        <div class="section-title">Bereiche</div>
        <div class="description" style="margin-left: 0; margin-bottom: 12px;">
          Wähle aus, welche Bereiche im Dashboard angezeigt werden sollen und in welcher Reihenfolge. Klappe Bereiche auf, um einzelne Entitäten zu verwalten.
        </div>
        <div class="area-list" id="area-list">
          ${renderAreaItems(allAreas, hiddenAreas, areaOrder)}
        </div>
      </div>
    </div>
  `;
}

function renderAreaItems(allAreas, hiddenAreas, areaOrder) {
  if (allAreas.length === 0) {
    return '<div class="empty-state">Keine Bereiche verfügbar</div>';
  }

  return allAreas.map((area, index) => {
    const isHidden = hiddenAreas.includes(area.area_id);
    const orderIndex = areaOrder.indexOf(area.area_id);
    const displayOrder = orderIndex !== -1 ? orderIndex : 9999 + index;
    
    return `
      <div class="area-item" 
           data-area-id="${area.area_id}"
           data-order="${displayOrder}">
        <div class="area-header">
          <span class="drag-handle" draggable="true">☰</span>
          <input 
            type="checkbox" 
            class="area-checkbox" 
            data-area-id="${area.area_id}"
            ${!isHidden ? 'checked' : ''}
          />
          <span class="area-name">${area.name}</span>
          ${area.icon ? `<ha-icon class="area-icon" icon="${area.icon}"></ha-icon>` : ''}
          <button class="expand-button" data-area-id="${area.area_id}" ${isHidden ? 'disabled' : ''}>
            <span class="expand-icon">▶</span>
          </button>
        </div>
        <div class="area-content" data-area-id="${area.area_id}" style="display: none;">
          <div class="loading-placeholder">Lade Entitäten...</div>
        </div>
      </div>
    `;
  }).join('');
}

export function renderAreaEntitiesHTML(areaId, groupedEntities, hiddenEntities, entityOrders, hass) {
  const domainGroups = [
    { key: 'lights', label: 'Beleuchtung', icon: 'mdi:lightbulb' },
    { key: 'climate', label: 'Klima', icon: 'mdi:thermostat' },
    { key: 'covers', label: 'Rollos & Jalousien', icon: 'mdi:window-shutter' },
    { key: 'covers_curtain', label: 'Vorhänge', icon: 'mdi:curtains' },
    { key: 'media_player', label: 'Medien', icon: 'mdi:speaker' },
    { key: 'scenes', label: 'Szenen', icon: 'mdi:palette' },
    { key: 'vacuum', label: 'Staubsauger', icon: 'mdi:robot-vacuum' },
    { key: 'fan', label: 'Ventilatoren', icon: 'mdi:fan' },
    { key: 'switches', label: 'Schalter', icon: 'mdi:light-switch' }
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
          <input 
            type="checkbox" 
            class="group-checkbox" 
            data-area-id="${areaId}"
            data-group="${group.key}"
            ${!allHidden ? 'checked' : ''}
            ${someHidden ? 'data-indeterminate="true"' : ''}
          />
          <ha-icon icon="${group.icon}"></ha-icon>
          <span class="group-name">${group.label}</span>
          <span class="entity-count">(${entities.length})</span>
          <button class="expand-button-small" data-area-id="${areaId}" data-group="${group.key}">
            <span class="expand-icon-small">▶</span>
          </button>
        </div>
        <div class="entity-list" data-area-id="${areaId}" data-group="${group.key}" style="display: none;">
          ${entities.map(entityId => {
            const state = hass.states[entityId];
            const name = state?.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
            const isHidden = hiddenInGroup.includes(entityId);
            
            return `
              <div class="entity-item">
                <input 
                  type="checkbox" 
                  class="entity-checkbox" 
                  data-area-id="${areaId}"
                  data-group="${group.key}"
                  data-entity-id="${entityId}"
                  ${!isHidden ? 'checked' : ''}
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
    return '<div class="empty-state">Keine Entitäten in diesem Bereich gefunden</div>';
  }

  return html;
}