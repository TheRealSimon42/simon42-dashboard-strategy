// ====================================================================
// SIMON42 LIGHTS GROUP CARD - Reaktive Card für eine Licht-Gruppe
// ====================================================================
// Diese Card zeigt entweder eingeschaltete ODER ausgeschaltete Lichter
// und aktualisiert sich automatisch bei State-Änderungen
// ====================================================================

import { t, initLanguage } from '../utils/i18n/simon42-i18n.js';
import { filterEntities } from '../utils/filters/simon42-entity-filter.js';
import { getExcludedLabels } from '../utils/helpers/simon42-helpers.js';
import { getHiddenEntitiesFromConfig } from '../utils/data/simon42-data-collectors.js';

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
    
    // Initialisiere Sprache aus hass-Einstellungen (falls noch nicht geschehen)
    if (hass && this._config?.config) {
      initLanguage(this._config.config, hass);
    }
    
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
    // Use centralized utilities
    const excludeLabels = getExcludedLabels(this._entities);
    this._excludeSet = new Set(excludeLabels);
    
    // Use centralized hidden entities extraction
    this._hiddenFromConfigSet = getHiddenEntitiesFromConfig(this._config.config || {});
  }

  _getFilteredLightEntities() {
    if (!this._hass) return [];
    
    // REFACTORED: Use centralized filterEntities utility
    return filterEntities(this._entities, {
      domain: 'light',
      excludeLabels: this._excludeSet,
      hiddenFromConfig: this._hiddenFromConfigSet,
      hass: this._hass,
      checkRegistry: true,
      checkState: true
    });
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
    const title = isOn ? t('lightsOn') : t('lightsOff');
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
            ${isOn ? t('turnAllOff') : t('turnAllOn')}
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

