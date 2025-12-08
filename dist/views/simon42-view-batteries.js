// ====================================================================
// VIEW STRATEGY - BATTERIEN (Batterie-Übersicht) - REFACTORED
// ====================================================================
// Uses centralized filtering utilities for consistency
// ====================================================================

import { getExcludedLabels } from '../utils/helpers/simon42-helpers.js';
import { t, initLanguage } from '../utils/system/simon42-i18n.js';
import { filterEntities } from '../utils/filters/simon42-entity-filter.js';
import { getHiddenEntitiesFromConfig } from '../utils/data/simon42-data-collectors.js';

class Simon42ViewBatteriesStrategy {
  static async generate(config, hass) {
    // Initialisiere Sprache (falls noch nicht geschehen)
    if (config.config) {
      initLanguage(config.config, hass);
    }
    
    const { entities } = config;
    
    const excludeLabels = getExcludedLabels(entities);
    const excludeSet = new Set(excludeLabels);
    
    // Use centralized hidden entities extraction
    const hiddenFromConfig = getHiddenEntitiesFromConfig(config.config || {});

    // REFACTORED: Use centralized filterEntities utility with battery-specific custom filter
    // Battery filtering has special requirements: ignore hidden_by (integration), but respect manual hidden
    const batteryEntities = filterEntities(entities, {
      excludeLabels: excludeSet,
      hiddenFromConfig,
      hass,
      checkRegistry: false, // Handle manually in customFilter for battery-specific registry handling
      checkState: true,
      customFilter: (entity, hass) => {
        const entityId = entity.entity_id;
        const state = hass.states[entityId];
        if (!state) return false;
        
        // Battery detection
        const isBattery = entityId.includes('battery') || 
                         state.attributes?.device_class === 'battery';
        if (!isBattery) return false;
        
        // Battery-specific registry check: only exclude manually hidden (ignore hidden_by)
        if (entity.hidden === true) return false;
        if (entity.disabled_by) return false;
        if (entity.entity_category === 'config' || entity.entity_category === 'diagnostic') return false;
        
        // Check state attributes entity_category too
        if (state.attributes?.entity_category === 'config' || 
            state.attributes?.entity_category === 'diagnostic') return false;
        
        // Value check: only numeric values
        const value = parseFloat(state.state);
        return !isNaN(value);
      }
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
            heading: `🔴 ${t('batteriesCritical')} - ${critical.length} ${critical.length === 1 ? t('battery') : t('batteriesPlural')}`,
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
            heading: `🟡 ${t('batteriesLow')} - ${low.length} ${low.length === 1 ? t('battery') : t('batteriesPlural')}`,
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
            heading: `🟢 ${t('batteriesGood')} - ${good.length} ${good.length === 1 ? t('battery') : t('batteriesPlural')}`,
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