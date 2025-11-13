// ====================================================================
// SIMON42 EDITOR TEMPLATE
// ====================================================================
// HTML-Template für den Dashboard Strategy Editor

export function renderEditorHTML({ allAreas, hiddenAreas, areaOrder, showEnergy, showWeather, showSummaryViews, showRoomViews, showSearchCard, hasSearchCardDeps, summariesColumns, alarmEntity, alarmEntities, favoriteEntities, roomPinEntities, allEntities, groupByFloors, showCoversSummary, showSecuritySummary, showBatterySummary, showLightSummary }) {
  return `
    <div class="card-config">
      <div class="section">
        <div class="section-title">Info-Karten</div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-weather" 
            ${showWeather !== false ? 'checked' : ''}
          />
          <label for="show-weather">Wetter-Karte anzeigen</label>
        </div>
        <div class="description">
          Zeigt die Wettervorhersage-Karte in der Übersicht an, wenn eine Wetter-Entität verfügbar ist.
        </div>
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
        <div class="section-title">Alarm-Control-Panel</div>
        <div class="form-row">
          <label for="alarm-entity" style="margin-right: 8px; min-width: 120px;">Alarm-Entität:</label>
          <select id="alarm-entity" style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
            <option value="">Keine (Uhr in voller Breite)</option>
            ${alarmEntities.map(entity => `
              <option value="${entity.entity_id}" ${entity.entity_id === alarmEntity ? 'selected' : ''}>
                ${entity.name}
              </option>
            `).join('')}
          </select>
        </div>
        <div class="description">
          Wähle eine Alarm-Control-Panel-Entität aus, um sie neben der Uhr anzuzeigen. "Keine" auswählen, um nur die Uhr in voller Breite anzuzeigen.
        </div>
      </div>

      <div class="section">
        <div class="section-title">Favoriten</div>
        <div id="favorites-list" style="margin-bottom: 12px;">
          ${renderFavoritesList(favoriteEntities, allEntities)}
        </div>
        <div style="display: flex; gap: 8px; align-items: flex-start;">
          <select id="favorite-entity-select" style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
            <option value="">Entität auswählen...</option>
            ${allEntities.map(entity => `
              <option value="${entity.entity_id}">${entity.name}</option>
            `).join('')}
          </select>
          <button id="add-favorite-btn" style="flex-shrink: 0; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer; white-space: nowrap;">
            + Hinzufügen
          </button>
        </div>
        <div class="description">
          Wähle Entitäten aus, die als Favoriten unter den Zusammenfassungen angezeigt werden sollen. Die Entitäten werden als Kacheln angezeigt.
        </div>
      </div>

      <div class="section">
        <div class="section-title">Raum-Pins</div>
        <div id="room-pins-list" style="margin-bottom: 12px;">
          ${renderRoomPinsList(roomPinEntities, allEntities, allAreas)}
        </div>
        <div style="display: flex; gap: 8px; align-items: flex-start;">
          <select id="room-pin-entity-select" style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
            <option value="">Entität auswählen...</option>
            ${allEntities
              .filter(entity => entity.area_id || entity.device_area_id)
              .map(entity => `
                <option value="${entity.entity_id}">${entity.name}</option>
              `).join('')}
          </select>
          <button id="add-room-pin-btn" style="flex-shrink: 0; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer; white-space: nowrap;">
            + Hinzufügen
          </button>
        </div>
        <div class="description">
          Wähle Entitäten aus, die in ihren zugeordneten Räumen als erstes angezeigt werden sollen. Ideal für Entitäten die normalerweise nicht automatisch erfasst werden (z.B. Wetterstationen, spezielle Sensoren). <strong>Nur Entitäten mit Raum-Zuordnung können ausgewählt werden.</strong> Diese Pins erscheinen nur im jeweiligen Raum, nicht in der Übersicht.
        </div>
      </div>

      <div class="section">
        <div class="section-title">Such-Karte</div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-search-card" 
            ${showSearchCard ? 'checked' : ''}
            ${!hasSearchCardDeps ? 'disabled' : ''}
          />
          <label for="show-search-card" ${!hasSearchCardDeps ? 'class="disabled-label"' : ''}>
            Such-Karte in Übersicht anzeigen
          </label>
        </div>
        <div class="description">
          ${hasSearchCardDeps 
            ? 'Zeigt die custom:search-card direkt unter der Uhr in der Übersicht an.' 
            : '⚠️ Benötigt <strong>custom:search-card</strong> und <strong>card-tools</strong>. Bitte installieren Sie beide Komponenten, um diese Funktion zu nutzen.'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Zusammenfassungen</div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-covers-summary" 
            ${showCoversSummary !== false ? 'checked' : ''}
          />
          <label for="show-covers-summary">Rollo-Zusammenfassung anzeigen</label>
        </div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-security-summary" 
            ${showSecuritySummary !== false ? 'checked' : ''}
          />
          <label for="show-security-summary">Sicherheits-Zusammenfassung anzeigen</label>
        </div>
         <div class="form-row">
          <input 
            type="checkbox" 
            id="show-battery-summary" 
            ${showBatterySummary !== false ? 'checked' : ''}
          />
          <label for="show-battery-summary">Batterie-Zusammenfassung anzeigen</label>
        </div>
         <div class="form-row">
          <input 
            type="checkbox" 
            id="show-light-summary" 
            ${showLightSummary !== false ? 'checked' : ''}
          />
          <label for="show-light-summary">Licht-Zusammenfassung anzeigen</label>
        </div>
        <div class="description">
          Wähle aus, welche Zusammenfassungskarten angezeigt werden sollen. Das Layout passt sich automatisch an, wenn Karten ausgeblendet werden. Ist keine Karte ausgewählt, wird der gesamte Zusammenfassungsbereich inklusive Überschrift ausgeblendet.
        </div>
      </div>

      <div class="section">
        <div class="section-title">Zusammenfassungen Layout</div>
        <div class="form-row">
          <input 
            type="radio" 
            id="summaries-2-columns" 
            name="summaries-columns"
            value="2"
            ${summariesColumns === 2 ? 'checked' : ''}
          />
          <label for="summaries-2-columns">2 Spalten (2x2 Grid)</label>
        </div>
        <div class="form-row">
          <input 
            type="radio" 
            id="summaries-4-columns" 
            name="summaries-columns"
            value="4"
            ${summariesColumns === 4 ? 'checked' : ''}
          />
          <label for="summaries-4-columns">4 Spalten (1x4 Reihe)</label>
        </div>
        <div class="description">
          Wähle aus, wie die Zusammenfassungskarten angezeigt werden sollen. Das Layout passt sich automatisch an, wenn Karten ausgeblendet werden.
        </div>
      </div>

      <div class="section">
        <div class="section-title">Ansichten</div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-summary-views" 
            ${showSummaryViews ? 'checked' : ''}
          />
          <label for="show-summary-views">Zusammenfassungs-Views anzeigen</label>
        </div>
        <div class="description">
          Zeigt die Zusammenfassungs-Views (Lichter, Rollos, Sicherheit, Batterien) in der oberen Navigation an.
        </div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-room-views" 
            ${showRoomViews ? 'checked' : ''}
          />
          <label for="show-room-views">Raum-Views anzeigen</label>
        </div>
        <div class="description">
          Zeigt die einzelnen Raum-Views in der oberen Navigation an.
        </div>
      </div>

      <div class="section">
        <div class="section-title">Bereiche-Ansicht</div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="group-by-floors" 
            ${groupByFloors ? 'checked' : ''}
          />
          <label for="group-by-floors">Bereiche in Etagen gliedern</label>
        </div>
        <div class="description">
          Gruppiert die Bereiche in der Übersicht nach Etagen. Wenn aktiviert, wird für jede Etage eine separate Section erstellt.
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

function renderFavoritesList(favoriteEntities, allEntities) {
  if (!favoriteEntities || favoriteEntities.length === 0) {
    return '<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">Keine Favoriten hinzugefügt</div>';
  }

  // Erstelle Map für schnellen Zugriff auf Entity-Namen
  const entityMap = new Map(allEntities.map(e => [e.entity_id, e.name]));

  return `
    <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
      ${favoriteEntities.map((entityId, index) => {
        const name = entityMap.get(entityId) || entityId;
        return `
          <div class="favorite-item" data-entity-id="${entityId}" style="display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); background: var(--card-background-color);">
            <span class="drag-handle" style="margin-right: 12px; cursor: grab; color: var(--secondary-text-color);">☰</span>
            <span style="flex: 1; font-size: 14px;">
              <strong>${name}</strong>
              <span style="margin-left: 8px; font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">${entityId}</span>
            </span>
            <button class="remove-favorite-btn" data-entity-id="${entityId}" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer;">
              ✕
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export function renderRoomPinsList(roomPinEntities, allEntities, allAreas) {
  if (!roomPinEntities || roomPinEntities.length === 0) {
    return '<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">Keine Raum-Pins hinzugefügt</div>';
  }

  // Erstelle Maps für schnellen Zugriff
  const entityMap = new Map(allEntities.map(e => [e.entity_id, e]));
  const areaMap = new Map(allAreas.map(a => [a.area_id, a.name]));

  return `
    <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
      ${roomPinEntities.map((entityId, index) => {
        const entity = entityMap.get(entityId);
        const name = entity?.name || entityId;
        const areaId = entity?.area_id || entity?.device_area_id;
        const areaName = areaId ? areaMap.get(areaId) || areaId : 'Kein Raum';
        
        return `
          <div class="room-pin-item" data-entity-id="${entityId}" style="display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); background: var(--card-background-color);">
            <span class="drag-handle" style="margin-right: 12px; cursor: grab; color: var(--secondary-text-color);">☰</span>
            <span style="flex: 1; font-size: 14px;">
              <strong>${name}</strong>
              <span style="margin-left: 8px; font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">${entityId}</span>
              <br>
              <span style="font-size: 11px; color: var(--secondary-text-color);">📍 ${areaName}</span>
            </span>
            <button class="remove-room-pin-btn" data-entity-id="${entityId}" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer;">
              ✕
            </button>
          </div>
        `;
      }).join('')}
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