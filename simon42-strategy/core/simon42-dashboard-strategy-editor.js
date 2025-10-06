// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR
// ====================================================================

class Simon42DashboardStrategyEditor extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass || !this._config) {
      return;
    }

    const showEnergy = this._config.show_energy !== false;
    
    // Hole alle Bereiche und sortiere sie alphabetisch
    const allAreas = Object.values(this._hass.areas).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    
    const hiddenAreas = this._config.areas_display?.hidden || [];
    const areaOrder = this._config.areas_display?.order || [];

    this.innerHTML = `
      <style>
        .card-config {
          padding: 16px;
        }
        
        .section {
          margin-bottom: 24px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 12px;
          color: var(--primary-text-color);
        }
        
        .form-row {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .form-row input[type="checkbox"] {
          margin-right: 8px;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        
        .form-row label {
          cursor: pointer;
          user-select: none;
        }
        
        .description {
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-top: 4px;
          margin-left: 26px;
          margin-bottom: 16px;
        }
        
        .area-list {
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .area-item {
          display: flex;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid var(--divider-color);
          background: var(--card-background-color);
          cursor: move;
        }
        
        .area-item:last-child {
          border-bottom: none;
        }
        
        .area-item.dragging {
          opacity: 0.5;
        }
        
        .area-item.drag-over {
          border-top: 2px solid var(--primary-color);
        }
        
        .drag-handle {
          margin-right: 12px;
          color: var(--secondary-text-color);
          cursor: move;
        }
        
        .area-checkbox {
          margin-right: 12px;
        }
        
        .area-name {
          flex: 1;
        }
        
        .area-icon {
          margin-left: 8px;
          color: var(--secondary-text-color);
        }
        
        .empty-state {
          padding: 24px;
          text-align: center;
          color: var(--secondary-text-color);
          font-style: italic;
        }
      </style>
      
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
          <div class="section-title">Bereiche</div>
          <div class="description" style="margin-left: 0; margin-bottom: 12px;">
            Wähle aus, welche Bereiche im Dashboard angezeigt werden sollen und in welcher Reihenfolge.
          </div>
          <div class="area-list" id="area-list">
            ${allAreas.length > 0 ? allAreas.map((area, index) => {
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
            }).join('') : '<div class="empty-state">Keine Bereiche verfügbar</div>'}
          </div>
        </div>
      </div>
    `;

    // Event Listener für Energie-Checkbox
    const energyCheckbox = this.querySelector('#show-energy');
    if (energyCheckbox) {
      energyCheckbox.addEventListener('change', (e) => this._showEnergyChanged(e));
    }

    // Event Listener für Area-Checkboxen
    const areaCheckboxes = this.querySelectorAll('.area-checkbox');
    areaCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => this._areaVisibilityChanged(e));
    });

    // Sortiere die Area-Items nach displayOrder
    this._sortAreaItems();

    // Drag & Drop Event Listener
    const areaItems = this.querySelectorAll('.area-item');
    areaItems.forEach(item => {
      item.addEventListener('dragstart', (e) => this._handleDragStart(e));
      item.addEventListener('dragend', (e) => this._handleDragEnd(e));
      item.addEventListener('dragover', (e) => this._handleDragOver(e));
      item.addEventListener('drop', (e) => this._handleDrop(e));
      item.addEventListener('dragleave', (e) => this._handleDragLeave(e));
    });
  }

  _sortAreaItems() {
    const areaList = this.querySelector('#area-list');
    if (!areaList) return;

    const items = Array.from(areaList.querySelectorAll('.area-item'));
    items.sort((a, b) => {
      const orderA = parseInt(a.dataset.order);
      const orderB = parseInt(b.dataset.order);
      return orderA - orderB;
    });

    items.forEach(item => areaList.appendChild(item));
  }

  _handleDragStart(ev) {
    ev.currentTarget.classList.add('dragging');
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/html', ev.currentTarget.innerHTML);
    this._draggedElement = ev.currentTarget;
  }

  _handleDragEnd(ev) {
    ev.currentTarget.classList.remove('dragging');
    
    // Entferne alle drag-over Klassen
    const items = this.querySelectorAll('.area-item');
    items.forEach(item => item.classList.remove('drag-over'));
  }

  _handleDragOver(ev) {
    if (ev.preventDefault) {
      ev.preventDefault();
    }
    ev.dataTransfer.dropEffect = 'move';
    
    const item = ev.currentTarget;
    if (item !== this._draggedElement) {
      item.classList.add('drag-over');
    }
    
    return false;
  }

  _handleDragLeave(ev) {
    ev.currentTarget.classList.remove('drag-over');
  }

  _handleDrop(ev) {
    if (ev.stopPropagation) {
      ev.stopPropagation();
    }

    const dropTarget = ev.currentTarget;
    dropTarget.classList.remove('drag-over');

    if (this._draggedElement !== dropTarget) {
      const areaList = this.querySelector('#area-list');
      const allItems = Array.from(areaList.querySelectorAll('.area-item'));
      const draggedIndex = allItems.indexOf(this._draggedElement);
      const dropIndex = allItems.indexOf(dropTarget);

      if (draggedIndex < dropIndex) {
        dropTarget.parentNode.insertBefore(this._draggedElement, dropTarget.nextSibling);
      } else {
        dropTarget.parentNode.insertBefore(this._draggedElement, dropTarget);
      }

      // Update die Reihenfolge in der Config
      this._updateAreaOrder();
    }

    return false;
  }

  _updateAreaOrder() {
    const areaList = this.querySelector('#area-list');
    const items = Array.from(areaList.querySelectorAll('.area-item'));
    const newOrder = items.map(item => item.dataset.areaId);

    const newConfig = {
      ...this._config,
      areas_display: {
        ...this._config.areas_display,
        order: newOrder
      }
    };

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _showEnergyChanged(ev) {
    if (!this._config || !this._hass) {
      return;
    }

    const showEnergy = ev.target.checked;
    
    const newConfig = {
      ...this._config,
      show_energy: showEnergy
    };

    // Wenn der Standardwert (true) gesetzt ist, entfernen wir die Property
    if (showEnergy === true) {
      delete newConfig.show_energy;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _areaVisibilityChanged(ev) {
    if (!this._config || !this._hass) {
      return;
    }

    const areaId = ev.target.dataset.areaId;
    const isVisible = ev.target.checked;
    
    let hiddenAreas = [...(this._config.areas_display?.hidden || [])];
    
    if (isVisible) {
      // Entferne aus hidden
      hiddenAreas = hiddenAreas.filter(id => id !== areaId);
    } else {
      // Füge zu hidden hinzu
      if (!hiddenAreas.includes(areaId)) {
        hiddenAreas.push(areaId);
      }
    }

    const newConfig = {
      ...this._config,
      areas_display: {
        ...this._config.areas_display,
        hidden: hiddenAreas
      }
    };

    // Entferne hidden array wenn leer
    if (newConfig.areas_display.hidden.length === 0) {
      delete newConfig.areas_display.hidden;
    }

    // Entferne areas_display wenn leer
    if (Object.keys(newConfig.areas_display).length === 0) {
      delete newConfig.areas_display;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _fireConfigChanged(config) {
    const event = new CustomEvent('config-changed', {
      detail: { config },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
}

// Registriere Custom Element
customElements.define("simon42-dashboard-strategy-editor", Simon42DashboardStrategyEditor);