// ====================================================================
// VIEW STRATEGY - BATTERIEN (Batterie-Übersicht) - OPTIMIERT
// ====================================================================
import { getExcludedLabels } from '../utils/simon42-helpers.js';

class Simon42ViewBatteriesStrategy {
  static async generate(config, hass) {
    const { entities } = config;
    
    const excludeLabels = getExcludedLabels(entities);
    const excludeSet = new Set(excludeLabels);
    
    // Hole hidden entities aus areas_options (wenn config übergeben wurde)
    // Batterien könnten in verschiedenen Gruppen sein, daher alle durchsuchen
    const hiddenFromConfig = new Set();
    if (config.config?.areas_options) {
      for (const areaOptions of Object.values(config.config.areas_options)) {
        if (areaOptions.groups_options) {
          // Durchsuche alle Gruppen nach versteckten Entities
          for (const groupOptions of Object.values(areaOptions.groups_options)) {
            if (groupOptions.hidden) {
              groupOptions.hidden.forEach(id => hiddenFromConfig.add(id));
            }
          }
        }
      }
    }

    // OPTIMIERT: Filter-Reihenfolge
    const batteryEntities = Object.keys(hass.states)
      .filter(entityId => {
        const state = hass.states[entityId];
        if (!state) return false;
        
        // 1. Battery-Check zuerst (String-includes ist schnell)
        const isBattery = entityId.includes('battery') || 
                         state.attributes?.device_class === 'battery';
        if (!isBattery) return false;
        
        // 2. Exclude-Checks (Set-Lookup = O(1))
        if (excludeSet.has(entityId)) return false;
        if (hiddenFromConfig.has(entityId)) return false;
        
        // 3. Value-Check am Ende
        const value = parseFloat(state.state);
        return !isNaN(value); // Nur numerische Werte
      });

    // Gruppiere nach Batteriestatus
    const critical = []; // < 20%
    const low = []; // 20-50%
    const good = []; // > 50%
    
    batteryEntities.forEach(entityId => {
      const state = hass.states[entityId];
      const value = parseFloat(state.state);
      
      if (value < 20) {
        critical.push(entityId);
      } else if (value <= 50) {
        low.push(entityId);
      } else {
        good.push(entityId);
      }
    });

    const sections = [];

    // Kritische Batterien
    if (critical.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: `🔴 Kritisch (< 20%) - ${critical.length} ${critical.length === 1 ? 'Batterie' : 'Batterien'}`,
            heading_style: "title"
          },
          ...critical.map(entity => ({
            type: "tile",
            entity: entity,
            vertical: false,
            state_content: ["state", "last_changed"],
            color: "red"
          }))
        ]
      });
    }

    // Niedrige Batterien
    if (low.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: `🟡 Niedrig (20-50%) - ${low.length} ${low.length === 1 ? 'Batterie' : 'Batterien'}`,
            heading_style: "title"
          },
          ...low.map(entity => ({
            type: "tile",
            entity: entity,
            vertical: false,
            state_content: ["state", "last_changed"],
            color: "yellow"
          }))
        ]
      });
    }

    // Gute Batterien
    if (good.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: `🟢 Gut (> 50%) - ${good.length} ${good.length === 1 ? 'Batterie' : 'Batterien'}`,
            heading_style: "title"
          },
          ...good.map(entity => ({
            type: "tile",
            entity: entity,
            vertical: false,
            state_content: ["state", "last_changed"],
            color: "green"
          }))
        ]
      });
    }

    return {
      type: "sections",
      sections: sections
    };
  }
}

// Registriere Custom Element
customElements.define("ll-strategy-simon42-view-batteries", Simon42ViewBatteriesStrategy);