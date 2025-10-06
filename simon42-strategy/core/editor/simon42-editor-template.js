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
          Wähle aus, welche Bereiche im Dashboard angezeigt werden sollen und in welcher Reihenfolge.
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
           data-order="${displayOrder}"
           draggable="true">
        <span class="drag-handle">☰</span>
        <input 
          type="checkbox" 
          class="area-checkbox" 
          data-area-id="${area.area_id}"
          ${!isHidden ? 'checked' : ''}
        />
        <span class="area-name">${area.name}</span>
        ${area.icon ? `<ha-icon class="area-icon" icon="${area.icon}"></ha-icon>` : ''}
      </div>
    `;
  }).join('');
}
