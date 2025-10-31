// ====================================================================
// SIMON42 LIGHTS GROUP CARD - Reaktive Card für eine Licht-Gruppe
// ====================================================================
// Diese Card zeigt entweder eingeschaltete ODER ausgeschaltete Lichter
// und aktualisiert sich automatisch bei State-Änderungen
// ====================================================================

class Simon42LightsGroupCard extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._config = null;
    this._entities = null;
    this._excludeSet = new Set();
    this._hiddenFromConfigSet = new Set();
    this._lastLightsList = '';
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error("You need to define entities");
    }
    if (!config.group_type) {
      throw new Error("You need to define group_type (on/off)");
    }
    
    this._config = config;
    this._entities = config.entities;
    this._calculateExcludeSets();
  }

  set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;
    
    // Beim ersten Mal: Entity Registry hat sich möglicherweise geändert
    if (!oldHass || oldHass.entities !== hass.entities) {
      this._calculateExcludeSets();
    }
    
    // Berechne aktuelle Licht-Liste
    const currentLights = this._getRelevantLights();
    const lightsKey = currentLights.join(',');
    
    // Nur rendern wenn sich die Liste geändert hat
    if (!oldHass || this._lastLightsList !== lightsKey) {
      this._lastLightsList = lightsKey;
      this._render();
    }
  }

  _calculateExcludeSets() {
    // no_dboard Label
    this._excludeSet = new Set();
    this._entities.forEach(e => {
      if (e.labels?.includes("no_dboard")) {
        this._excludeSet.add(e.entity_id);
      }
    });
    
    // Hidden from config
    this._hiddenFromConfigSet = new Set();
    if (this._config.config?.areas_options) {
      for (const areaOptions of Object.values(this._config.config.areas_options)) {
        if (areaOptions.groups_options?.lights?.hidden) {
          areaOptions.groups_options.lights.hidden.forEach(id => 
            this._hiddenFromConfigSet.add(id)
          );
        }
      }
    }
  }

  _getFilteredLightEntities() {
    if (!this._hass) return [];
    
    return this._entities
      .filter(e => {
        const id = e.entity_id;
        
        if (!id.startsWith('light.')) return false;
        if (e.hidden === true) return false;
        if (e.hidden_by) return false;
        if (e.disabled_by) return false;
        if (e.entity_category === 'config' || e.entity_category === 'diagnostic') return false;
        if (this._hass.states[id] === undefined) return false;
        if (this._excludeSet.has(id)) return false;
        if (this._hiddenFromConfigSet.has(id)) return false;
        
        return true;
      })
      .map(e => e.entity_id);
  }

  _getRelevantLights() {
    const allLights = this._getFilteredLightEntities();
    const targetState = this._config.group_type === 'on' ? 'on' : 'off';
    
    const relevantLights = allLights.filter(id => {
      const state = this._hass.states[id];
      return state && state.state === targetState;
    });
    
    // Sortiere nach last_changed
    relevantLights.sort((a, b) => {
      const stateA = this._hass.states[a];
      const stateB = this._hass.states[b];
      if (!stateA || !stateB) return 0;
      return new Date(stateB.last_changed) - new Date(stateA.last_changed);
    });
    
    return relevantLights;
  }

  _render() {
    if (!this._hass) return;
    
    const lights = this._getRelevantLights();
    const isOn = this._config.group_type === 'on';
    
    if (lights.length === 0) {
      this.style.display = 'none';
      return;
    }
    
    this.style.display = 'block';
    
    const icon = isOn ? '💡' : '🌙';
    const title = isOn ? 'Eingeschaltete Lichter' : 'Ausgeschaltete Lichter';
    const headingStyle = isOn ? 'title' : 'subtitle';
    const actionIcon = isOn ? 'mdi:lightbulb-off' : 'mdi:lightbulb-on';
    const actionService = isOn ? 'light.turn_off' : 'light.turn_on';
    
    // Erstelle HTML
    this.innerHTML = `
      <style>
        .lights-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
        }
        .section-heading {
          font-size: ${isOn ? '20px' : '16px'};
          font-weight: ${isOn ? '500' : '400'};
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .batch-button {
          padding: 8px 12px;
          border-radius: 18px;
          background: var(--primary-color);
          color: var(--text-primary-color);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
        }
        .batch-button:hover {
          background: var(--primary-color-dark);
        }
        .batch-button ha-icon {
          --mdc-icon-size: 18px;
        }
        .light-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 8px;
        }
      </style>
      <div class="lights-section">
        <div class="section-header">
          <h${isOn ? '2' : '3'} class="section-heading">
            ${icon} ${title} (${lights.length})
          </h${isOn ? '2' : '3'}>
          <button class="batch-button" id="batch-action">
            <ha-icon icon="${actionIcon}"></ha-icon>
            Alle ${isOn ? 'ausschalten' : 'einschalten'}
          </button>
        </div>
        <div class="light-grid" id="light-grid"></div>
      </div>
    `;
    
    // Batch-Action Button Event
    const batchButton = this.querySelector('#batch-action');
    if (batchButton) {
      batchButton.addEventListener('click', () => {
        this._hass.callService('light', isOn ? 'turn_off' : 'turn_on', {
          entity_id: lights
        });
      });
    }
    
    // Erstelle die Tile-Cards
    const grid = this.querySelector('#light-grid');
    lights.forEach(entityId => {
      const card = document.createElement('hui-tile-card');
      card.hass = this._hass;
      const cardConfig = {
        type: 'tile',
        entity: entityId,
        vertical: false,
        state_content: 'last_changed'
      };
      
      // Nur bei eingeschalteten Lichtern: Brightness-Feature
      if (isOn) {
        cardConfig.features = [{ type: 'light-brightness' }];
        cardConfig.features_position = 'inline';
      }
      
      card.setConfig(cardConfig);
      grid.appendChild(card);
    });
  }

  getCardSize() {
    const lights = this._getRelevantLights();
    return Math.ceil(lights.length / 3) + 1;
  }
}

// Registriere Custom Element
customElements.define("simon42-lights-group-card", Simon42LightsGroupCard);

console.log('✅ Simon42 Lights Group Card loaded');
