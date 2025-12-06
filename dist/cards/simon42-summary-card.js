// ====================================================================
// SIMON42 SUMMARY CARD - Reactive Summary Tile - OPTIMIZED
// ====================================================================
// Eine reactive Card die automatisch auf State-Änderungen reagiert
// und die Anzahl von Entities dynamisch zählt
// KEIN redundantes Caching von Registry-Daten mehr!
// ====================================================================

import { t, initLanguage } from '../utils/simon42-i18n.js';
import { filterEntities } from '../utils/simon42-entity-filter.js';
import { logWarn } from '../utils/simon42-logger.js';

/**
 * Configuration for summary types
 * Defines domain, filtering logic, counting logic, and relevant groups for each summary type
 */
const SUMMARY_TYPE_CONFIG = {
  lights: {
    domain: 'light',
    countFilter: (state) => state === 'on',
    relevantGroups: ['lights']
  },
  covers: {
    domain: 'cover',
    countFilter: (state) => ['open', 'opening'].includes(state),
    relevantGroups: ['covers', 'covers_curtain']
  },
  security: {
    domains: ['lock', 'cover', 'binary_sensor'],
    countFilter: (id, state) => {
      if (id.startsWith('lock.') && state === 'unlocked') return true;
      if (id.startsWith('cover.') && state === 'open') return true;
      if (id.startsWith('binary_sensor.') && state === 'on') return true;
      return false;
    },
    deviceClassFilter: (entityId, deviceClass, domain) => {
      // Locks: no device class filter needed
      if (domain === 'lock') return true;
      
      // Covers: only door, garage, gate
      if (domain === 'cover') {
        return ['door', 'garage', 'gate'].includes(deviceClass);
      }
      
      // Binary sensors: only door, window, garage_door, opening
      if (domain === 'binary_sensor') {
        return ['door', 'window', 'garage_door', 'opening'].includes(deviceClass);
      }
      
      return false;
    },
    relevantGroups: ['covers', 'covers_curtain', 'switches']
  },
  batteries: {
    domain: null, // Special case - checks for 'battery' in ID or device_class
    countFilter: (state) => {
      const value = parseFloat(state);
      return !isNaN(value) && value < 20;
    },
    customFilter: (entity, hass) => {
      const entityId = entity.entity_id;
      const state = hass.states[entityId];
      if (!state) return false;
      
      // Battery-Check (String-includes is faster than attribute lookup)
      return entityId.includes('battery') || state.attributes?.device_class === 'battery';
    },
    relevantGroups: ['lights', 'covers', 'covers_curtain', 'climate', 
                    'media_player', 'vacuum', 'fan', 'switches']
  }
};

class Simon42SummaryCard extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this.config = null;
    this._count = 0;
    this._excludeLabelsSet = new Set(); // OPTIMIERT: Set statt Array für O(1) Lookups
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
    
    // Initialisiere Sprache aus hass-Einstellungen (falls noch nicht geschehen)
    if (hass && this.config) {
      // Versuche Sprache aus config zu lesen, sonst aus hass
      const languageConfig = { language: this.config.language || hass.language };
      initLanguage(languageConfig, hass);
    }
    
    // Beim ersten Mal oder wenn sich Entities geändert haben: Lade excluded Labels
    if (!oldHass || oldHass.entities !== hass.entities) {
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
    // OPTIMIERT: Als Set für O(1) Lookups
    this._excludeLabelsSet = new Set();
    
    if (!this._hass.entities) {
      logWarn('[Summary Card] hass.entities not available');
      return;
    }

    // Konvertiere Entity Registry Object zu Array und filtere nach no_dboard Label
    Object.values(this._hass.entities).forEach(entity => {
      if (entity.labels?.includes("no_dboard")) {
        this._excludeLabelsSet.add(entity.entity_id);
      }
    });
  }

  _getRelevantEntities(hass) {
    const typeConfig = SUMMARY_TYPE_CONFIG[this.config.summary_type];
    if (!typeConfig) {
      return [];
    }
    
    // Cache hidden entities (nur 1x berechnen pro hass-Update)
    if (this._hiddenFromConfigCache === null) {
      this._hiddenFromConfigCache = this._getHiddenFromConfig();
    }
    
    const hiddenFromConfig = this._hiddenFromConfigCache;
    const entities = Object.values(hass.entities || {});
    
    // Build filter options
    const filterOptions = {
      domain: typeConfig.domain || typeConfig.domains,
      excludeLabels: this._excludeLabelsSet,
      hiddenFromConfig,
      hass,
      checkRegistry: true,
      checkState: true
    };
    
    // Add custom filter for special cases (batteries, security device classes)
    if (typeConfig.customFilter) {
      filterOptions.customFilter = typeConfig.customFilter;
    } else if (typeConfig.deviceClassFilter) {
      // Security: filter by device class
      filterOptions.customFilter = (entity, hass) => {
        const entityId = entity.entity_id;
        const state = hass.states[entityId];
        if (!state) return false;
        
        const domain = entityId.split('.')[0];
        const deviceClass = state.attributes?.device_class;
        
        return typeConfig.deviceClassFilter(entityId, deviceClass, domain);
      };
    }
    
    // Use centralized filter utility
    return filterEntities(entities, filterOptions);
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
    const typeConfig = SUMMARY_TYPE_CONFIG[this.config.summary_type];
    return typeConfig?.relevantGroups || [];
  }

  _calculateCount() {
    if (!this.hass) return 0;
    
    const relevantEntities = this._getRelevantEntities(this.hass);
    const typeConfig = SUMMARY_TYPE_CONFIG[this.config.summary_type];
    
    if (!typeConfig || !typeConfig.countFilter) {
      return 0;
    }
    
    // Use configuration-based count filter
    return relevantEntities.filter(entityId => {
      const state = this.hass.states[entityId]?.state;
      if (state === undefined || state === null) return false;
      
      // For security, countFilter needs entityId as well
      if (this.config.summary_type === 'security') {
        return typeConfig.countFilter(entityId, state);
      }
      
      // For others, countFilter only needs state
      return typeConfig.countFilter(state);
    }).length;
  }

  _getDisplayConfig() {
    const count = this._count;
    const hasItems = count > 0;
    
    const configs = {
      lights: {
        icon: 'mdi:lamps',
        name: hasItems ? `${count} ${count === 1 ? t('summaryLightOn') : t('summaryLightsOn')}` : t('summaryAllLightsOff'),
        color: hasItems ? 'orange' : 'grey',
        path: 'lights'
      },
      covers: {
        icon: 'mdi:blinds-horizontal',
        name: hasItems ? `${count} ${count === 1 ? t('summaryCoverOpen') : t('summaryCoversOpen')}` : t('summaryAllCoversClosed'),
        color: hasItems ? 'purple' : 'grey',
        path: 'covers'
      },
      security: {
        icon: 'mdi:security',
        name: hasItems ? `${count} ${t('summaryInsecure')}` : t('summaryAllSecure'),
        color: hasItems ? 'yellow' : 'grey',
        path: 'security'
      },
      batteries: {
        icon: hasItems ? 'mdi:battery-alert' : 'mdi:battery-charging',
        name: hasItems ? `${count} ${count === 1 ? t('battery') : t('batteriesPlural')} ${t('summaryBatteryCritical')}` : t('summaryAllBatteriesOK'),
        color: hasItems ? 'red' : 'grey',
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