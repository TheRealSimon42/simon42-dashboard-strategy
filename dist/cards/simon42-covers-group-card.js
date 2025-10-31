// ====================================================================
// SIMON42 COVERS GROUP CARD - Reaktive Card für eine Cover-Gruppe
// ====================================================================
// Diese Card zeigt entweder offene ODER geschlossene Covers
// und aktualisiert sich automatisch bei State-Änderungen
// ====================================================================

class Simon42CoversGroupCard extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._config = null;
    this._entities = null;
    this._excludeSet = new Set();
    this._hiddenFromConfigSet = new Set();
    this._lastCoversList = '';
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error("You need to define entities");
    }
    if (!config.group_type) {
      throw new Error("You need to define group_type (open/closed)");
    }
    
    this._config = config;
    this._entities = config.entities;
    this._deviceClasses = config.device_classes || ["awning", "blind", "curtain", "shade", "shutter", "window"];
    this._calculateExcludeSets();
  }

  set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;
    
    // Beim ersten Mal: Entity Registry hat sich möglicherweise geändert
    if (!oldHass || oldHass.entities !== hass.entities) {
      this._calculateExcludeSets();
    }
    
    // Berechne aktuelle Cover-Liste
    const currentCovers = this._getRelevantCovers();
    const coversKey = this._calculateRenderKey(currentCovers);
    
    // Nur rendern wenn sich die Liste ODER die States geändert haben
    if (!oldHass || this._lastCoversList !== coversKey) {
      this._lastCoversList = coversKey;
      this._render();
    }
  }

  _calculateRenderKey(covers) {
    // Erstelle einen Key der sich ändert wenn:
    // 1. Die Cover-Liste sich ändert
    // 2. Ein Cover opening/closing ist (dann State + Position als Key)
    const keyParts = covers.map(id => {
      const state = this._hass.states[id];
      if (!state) return id;
      
      // Bei opening/closing: Inkludiere Position im Key für kontinuierliche Updates
      if (state.state === 'opening' || state.state === 'closing') {
        const position = state.attributes.current_position || 0;
        return `${id}:${state.state}:${position}`;
      }
      
      // Bei open/closed: nur ID und State
      return `${id}:${state.state}`;
    });
    
    return keyParts.join(',');
  }

  _calculateExcludeSets() {
    // no_dboard Label
    this._excludeSet = new Set();
    this._entities.forEach(e => {
      if (e.labels?.includes("no_dboard")) {
        this._excludeSet.add(e.entity_id);
      }
    });
    
    // Hidden from config (covers + covers_curtain)
    this._hiddenFromConfigSet = new Set();
    if (this._config.config?.areas_options) {
      for (const areaOptions of Object.values(this._config.config.areas_options)) {
        if (areaOptions.groups_options?.covers?.hidden) {
          areaOptions.groups_options.covers.hidden.forEach(id => 
            this._hiddenFromConfigSet.add(id)
          );
        }
        if (areaOptions.groups_options?.covers_curtain?.hidden) {
          areaOptions.groups_options.covers_curtain.hidden.forEach(id => 
            this._hiddenFromConfigSet.add(id)
          );
        }
      }
    }
  }

  _getFilteredCoverEntities() {
    if (!this._hass) return [];
    
    return this._entities
      .filter(e => {
        const id = e.entity_id;
        
        if (!id.startsWith('cover.')) return false;
        if (e.hidden === true) return false;
        if (e.hidden_by) return false;
        if (e.disabled_by) return false;
        if (e.entity_category === 'config' || e.entity_category === 'diagnostic') return false;
        if (this._hass.states[id] === undefined) return false;
        if (this._excludeSet.has(id)) return false;
        if (this._hiddenFromConfigSet.has(id)) return false;
        
        return true;
      })
      .map(e => e.entity_id)
      .filter(entityId => {
        const state = this._hass.states[entityId];
        const deviceClass = state?.attributes?.device_class;
        return this._deviceClasses.includes(deviceClass) || !deviceClass;
      });
  }

  _getRelevantCovers() {
    const allCovers = this._getFilteredCoverEntities();
    
    const relevantCovers = allCovers.filter(id => {
      const state = this._hass.states[id];
      if (!state) return false;
      
      // Gruppe "open": zeigt open + opening
      if (this._config.group_type === 'open') {
        return state.state === 'open' || state.state === 'opening';
      }
      
      // Gruppe "closed": zeigt closed + closing
      return state.state === 'closed' || state.state === 'closing';
    });
    
    // Sortiere nach last_changed
    relevantCovers.sort((a, b) => {
      const stateA = this._hass.states[a];
      const stateB = this._hass.states[b];
      if (!stateA || !stateB) return 0;
      return new Date(stateB.last_changed) - new Date(stateA.last_changed);
    });
    
    return relevantCovers;
  }

  _stripCoverType(entityId) {
    // Name-Stripping: Entferne "Rollo", "Vorhang", "Cover" etc. aus deutschen/englischen Namen
    const state = this._hass.states[entityId];
    if (!state) return entityId;
    
    let name = state.attributes.friendly_name || entityId;
    
    // Deutsche und englische Cover-Begriffe
    const coverTerms = [
      'Rollo', 'Rollladen', 'Jalousie', 'Vorhang', 'Gardine',
      'Rolladen', 'Beschattung', 'Raffstore', 'Fenster',
      'Cover', 'Blind', 'Curtain', 'Shade', 'Shutter', 'Window'
    ];
    
    coverTerms.forEach(term => {
      // Entferne Begriff am Anfang oder Ende (mit optionalem Leerzeichen)
      const regex = new RegExp(`^${term}\\s+|\\s+${term}$`, 'gi');
      name = name.replace(regex, '');
    });
    
    return name.trim() || state.attributes.friendly_name;
  }

  _render() {
    if (!this._hass) return;
    
    const covers = this._getRelevantCovers();
    const isOpen = this._config.group_type === 'open';
    
    if (covers.length === 0) {
      this.style.display = 'none';
      return;
    }
    
    this.style.display = 'block';
    
    const icon = isOpen ? '🪟' : '🔒';
    const title = isOpen ? 'Offene Rollos & Vorhänge' : 'Geschlossene Rollos & Vorhänge';
    const headingStyle = isOpen ? 'title' : 'subtitle';
    const actionIcon = isOpen ? 'mdi:arrow-down' : 'mdi:arrow-up';
    const actionService = isOpen ? 'close_cover' : 'open_cover';
    
    // Erstelle HTML
    this.innerHTML = `
      <style>
        .covers-section {
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
          font-size: ${isOpen ? '20px' : '16px'};
          font-weight: ${isOpen ? '500' : '400'};
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
        .cover-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 8px;
        }
      </style>
      <div class="covers-section">
        <div class="section-header">
          <h${isOpen ? '2' : '3'} class="section-heading">
            ${icon} ${title} (${covers.length})
          </h${isOpen ? '2' : '3'}>
          <button class="batch-button" id="batch-action">
            <ha-icon icon="${actionIcon}"></ha-icon>
            Alle ${isOpen ? 'schließen' : 'öffnen'}
          </button>
        </div>
        <div class="cover-grid" id="cover-grid"></div>
      </div>
    `;
    
    // Batch-Action Button Event
    const batchButton = this.querySelector('#batch-action');
    if (batchButton) {
      batchButton.addEventListener('click', () => {
        this._hass.callService('cover', actionService, {
          entity_id: covers
        });
      });
    }
    
    // Erstelle die Tile-Cards
    const grid = this.querySelector('#cover-grid');
    covers.forEach(entityId => {
      const card = document.createElement('hui-tile-card');
      card.hass = this._hass;
      card.setConfig({
        type: 'tile',
        entity: entityId,
        name: this._stripCoverType(entityId),
        features: [{ type: 'cover-open-close' }],
        vertical: false,
        features_position: 'inline', // FIX: Features inline anzeigen
        state_content: ['current_position', 'last_changed']
      });
      grid.appendChild(card);
    });
  }

  getCardSize() {
    const covers = this._getRelevantCovers();
    return Math.ceil(covers.length / 3) + 1;
  }
}

// Registriere Custom Element
customElements.define("simon42-covers-group-card", Simon42CoversGroupCard);

console.log('✅ Simon42 Covers Group Card loaded');
