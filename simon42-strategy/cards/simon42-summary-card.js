// ====================================================================
// SIMON42 SUMMARY CARD - Reactive Summary Tile
// ====================================================================
// Eine reactive Card die automatisch auf State-Änderungen reagiert
// und die Anzahl von Entities dynamisch zählt
// ====================================================================

class Simon42SummaryCard extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this.config = null;
    this._count = 0;
    this._excludeLabels = [];
    this._hiddenFromConfigCache = null;
  }

  async setConfig(config) {
    if (!config.summary_type) {
      throw new Error("You need to define a summary_type");
    }
    this.config = config;
    // Cache invalidieren bei Config-Änderung
    this._hiddenFromConfigCache = null;
  }

  set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;
    
    // Beim ersten Mal: Lade excluded Labels aus Entity Registry
    if (!oldHass && hass) {
      this._loadExcludedLabels();
    }
    
    // Berechne Count neu
    const newCount = this._calculateCount();
    
    // Nur rendern wenn sich der Count geändert hat
    if (oldHass === null || this._count !== newCount) {
      this._count = newCount;
      this._render();
    }
  }

  get hass() {
    return this._hass;
  }

  _loadExcludedLabels() {
    // Nutze die bereits im hass-Objekt verfügbare Entity Registry
    // Keine WebSocket-Calls mehr nötig!
    if (!this._hass.entities) {
      console.warn('[Simon42 Summary Card] hass.entities not available');
      this._excludeLabels = [];
      return;
    }

    // Konvertiere Entity Registry Object zu Array und filtere nach no_dboard Label
    const entities = Object.values(this._hass.entities);
    this._excludeLabels = entities
      .filter(e => e.labels?.includes("no_dboard"))
      .map(e => e.entity_id);
  }

  _getRelevantEntities(hass) {
    // Cache hidden entities (nur 1x berechnen pro hass-Update)
    if (this._hiddenFromConfigCache === null) {
      this._hiddenFromConfigCache = this._getHiddenFromConfig();
    }
    
    const hiddenFromConfig = this._hiddenFromConfigCache;
    const allEntityIds = Object.keys(hass.states);
    
    // OPTIMIERT: Reihenfolge der Filter für maximale Performance
    // 1. Domain-Filter (reduziert drastisch die Entity-Anzahl)
    // 2. State-Existence-Check (schnell)
    // 3. Exclude-Checks (Set-Lookup ist O(1))
    // 4. Komplexere Attribute-Checks am Ende
    
    switch (this.config.summary_type) {
      case 'lights':
        return allEntityIds.filter(id => {
          // 1. Domain-Check (z.B. 500 → 30 Entities)
          if (!id.startsWith('light.')) return false;
          
          // 2. State-Check (verhindert undefined-Zugriffe)
          const state = hass.states[id];
          if (!state) return false;
          
          // 3. Exclude-Checks (Set-Lookup = O(1))
          if (this._excludeLabels.includes(id)) return false;
          if (hiddenFromConfig.has(id)) return false;
          
          // 4. Attribute-Checks am Ende
          if (state.attributes?.entity_category === 'config') return false;
          if (state.attributes?.entity_category === 'diagnostic') return false;
          
          return true;
        });
      
      case 'covers':
        return allEntityIds.filter(id => {
          if (!id.startsWith('cover.')) return false;
          
          const state = hass.states[id];
          if (!state) return false;
          
          if (this._excludeLabels.includes(id)) return false;
          if (hiddenFromConfig.has(id)) return false;
          
          if (state.attributes?.entity_category === 'config') return false;
          if (state.attributes?.entity_category === 'diagnostic') return false;
          
          return true;
        });
      
      case 'security':
        return allEntityIds.filter(id => {
          const state = hass.states[id];
          if (!state) return false;
          
          // Domain-Check zuerst (locks, covers, binary_sensors)
          const isLock = id.startsWith('lock.');
          const isCover = id.startsWith('cover.');
          const isBinarySensor = id.startsWith('binary_sensor.');
          
          if (!isLock && !isCover && !isBinarySensor) return false;
          
          // Exclude-Checks
          if (this._excludeLabels.includes(id)) return false;
          if (hiddenFromConfig.has(id)) return false;
          
          // Device-Class-Check nur für relevante Domains
          if (isLock) return true;
          
          if (isCover) {
            const deviceClass = state.attributes?.device_class;
            return ['door', 'garage', 'gate'].includes(deviceClass);
          }
          
          if (isBinarySensor) {
            const deviceClass = state.attributes?.device_class;
            return ['door', 'window', 'garage_door', 'opening'].includes(deviceClass);
          }
          
          return false;
        });
      
      case 'batteries':
        return allEntityIds.filter(id => {
          const state = hass.states[id];
          if (!state) return false;
          
          // Exclude-Checks früh
          if (this._excludeLabels.includes(id)) return false;
          if (hiddenFromConfig.has(id)) return false;
          
          // Battery-Check (String-includes ist schneller als Attribute-Lookup)
          if (id.includes('battery')) return true;
          if (state.attributes?.device_class === 'battery') return true;
          
          return false;
        });
      
      default:
        return [];
    }
  }

  _getHiddenFromConfig() {
    const hiddenEntities = new Set();
    
    if (!this.config.areas_options) {
      return hiddenEntities;
    }
    
    // Welche Gruppen sind für diesen Summary-Type relevant?
    const relevantGroups = this._getRelevantGroupsForSummary();
    
    // Durchlaufe alle Bereiche und sammle versteckte Entities
    for (const areaOptions of Object.values(this.config.areas_options)) {
      if (!areaOptions.groups_options) continue;
      
      for (const groupKey of relevantGroups) {
        const groupOptions = areaOptions.groups_options[groupKey];
        if (groupOptions?.hidden && Array.isArray(groupOptions.hidden)) {
          groupOptions.hidden.forEach(entityId => hiddenEntities.add(entityId));
        }
      }
    }
    
    return hiddenEntities;
  }

  _getRelevantGroupsForSummary() {
    // Welche Gruppen sind für welchen Summary-Type relevant?
    switch (this.config.summary_type) {
      case 'lights':
        return ['lights'];
      
      case 'covers':
        return ['covers', 'covers_curtain'];
      
      case 'security':
        // Security kann aus verschiedenen Gruppen kommen
        return ['covers', 'covers_curtain', 'switches'];
      
      case 'batteries':
        // Batterien können theoretisch in jeder Gruppe sein
        return ['lights', 'covers', 'covers_curtain', 'climate', 
                'media_player', 'vacuum', 'fan', 'switches'];
      
      default:
        return [];
    }
  }

  _calculateCount() {
    if (!this.hass) return 0;
    
    const relevantEntities = this._getRelevantEntities(this.hass);
    
    switch (this.config.summary_type) {
      case 'lights':
        // Zähle eingeschaltete Lichter
        return relevantEntities.filter(id => 
          this.hass.states[id]?.state === 'on'
        ).length;
      
      case 'covers':
        // Zähle offene Covers
        return relevantEntities.filter(id => 
          ['open', 'opening'].includes(this.hass.states[id]?.state)
        ).length;
      
      case 'security':
        // Zähle unsichere Items
        return relevantEntities.filter(id => {
          const state = this.hass.states[id];
          if (!state) return false;
          
          // Locks (unlocked)
          if (id.startsWith('lock.') && state.state === 'unlocked') return true;
          
          // Covers (open)
          if (id.startsWith('cover.') && state.state === 'open') return true;
          
          // Binary sensors (on)
          if (id.startsWith('binary_sensor.') && state.state === 'on') return true;
          
          return false;
        }).length;
      
      case 'batteries':
        // Zähle kritische Batterien (< 20%)
        return relevantEntities.filter(id => {
          const state = this.hass.states[id];
          if (!state) return false;
          
          const value = parseFloat(state.state);
          return !isNaN(value) && value < 20;
        }).length;
      
      default:
        return 0;
    }
  }

  _getDisplayConfig() {
    const count = this._count;
    const hasItems = count > 0;
    
    const configs = {
      lights: {
        icon: 'mdi:lamps',
        name: hasItems ? `${count} ${count === 1 ? 'Licht an' : 'Lichter an'}` : 'Alle Lichter aus',
        color: hasItems ? 'orange' : 'grey',
        path: 'lights'
      },
      covers: {
        icon: 'mdi:blinds-horizontal',
        name: hasItems ? `${count} ${count === 1 ? 'Rollo offen' : 'Rollos offen'}` : 'Alle Rollos geschlossen',
        color: hasItems ? 'purple' : 'grey',
        path: 'covers'
      },
      security: {
        icon: 'mdi:security',
        name: hasItems ? `${count} unsicher` : 'Alles gesichert',
        color: hasItems ? 'yellow' : 'grey',
        path: 'security'
      },
      batteries: {
        icon: hasItems ? 'mdi:battery-alert' : 'mdi:battery-charging',
        name: hasItems ? `${count} ${count === 1 ? 'Batterie kritisch' : 'Batterien kritisch'}` : 'Alle Batterien OK',
        color: hasItems ? 'red' : 'green',
        path: 'batteries'
      }
    };
    
    return configs[this.config.summary_type] || {};
  }

  _render() {
    if (!this.hass || !this.config) {
      return;
    }

    const displayConfig = this._getDisplayConfig();
    
    // Finde eine Dummy-Entity die "on" ist, damit die Farbe angezeigt wird
    // Tile Cards zeigen nur Farbe wenn die Entity state === 'on' hat
    let dummyEntity = null;
    
    // Suche nach einem Sensor der nicht unavailable ist
    const availableSensors = Object.keys(this.hass.states).filter(id => {
      const state = this.hass.states[id];
      return id.startsWith('sensor.') && 
             state.state !== 'unavailable' && 
             state.state !== 'unknown';
    });
    
    if (availableSensors.length > 0) {
      dummyEntity = availableSensors[0];
    } else {
      // Fallback zu sun.sun
      dummyEntity = 'sun.sun';
    }

    // Erstelle die Tile-Card Config MIT color Property
    const tileConfig = {
      type: 'tile',
      entity: dummyEntity,
      icon: displayConfig.icon,
      name: displayConfig.name,
      color: displayConfig.color,
      hide_state: true,
      vertical: true,
      tap_action: {
        action: 'navigate',
        navigation_path: displayConfig.path
      },
      icon_tap_action: {
        action: 'none'
      }
    };

    // Erstelle oder update die hui-tile-card
    if (!this._card) {
      this._card = document.createElement('hui-tile-card');
      this.appendChild(this._card);
    }

    // WICHTIG: Setze hass VOR setConfig, damit die Card richtig initialisiert wird
    this._card.hass = this.hass;
    this._card.setConfig(tileConfig);
    
    // Force update der Card
    if (this._card.requestUpdate) {
      this._card.requestUpdate();
    }
  }

  getCardSize() {
    return 1;
  }
}

customElements.define('simon42-summary-card', Simon42SummaryCard);

// Registriere für Card Picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'simon42-summary-card',
  name: 'Simon42 Summary Card',
  description: 'Reactive summary card that counts entities dynamically'
});
