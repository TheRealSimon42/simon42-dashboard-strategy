// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR
// ====================================================================
import { getEditorStyles } from './editor/simon42-editor-styles.js';
import { renderEditorHTML } from './editor/simon42-editor-template.js';
import { initLanguage, t } from '../utils/simon42-i18n.js';
import { ConfigManager } from './editor/simon42-config-manager.js';
import { logWarn, initLogger } from '../utils/simon42-logger.js';
import { checkDependency, checkPublicTransportDependencies } from '../utils/simon42-dependency-checker.js';
import { PUBLIC_TRANSPORT_MAPPING } from '../utils/simon42-public-transport-builders.js';
import { 
  getAllIntegrationProperties,
  updateNestedConfig,
  getEntitiesFromDOM
} from './editor/simon42-editor-config-helpers.js';
import { 
  attachWeatherCheckboxListener,
  attachEnergyCheckboxListener,
  attachPersonBadgesCheckboxListener,
  attachSearchCardCheckboxListener,
  attachClockCardCheckboxListener,
  attachSummaryViewsCheckboxListener,
  attachRoomViewsCheckboxListener,
  attachGroupByFloorsCheckboxListener, // NEU
  attachCoversSummaryCheckboxListener,
  attachSecuritySummaryCheckboxListener,
  attachLightSummaryCheckboxListener,
  attachBatterySummaryCheckboxListener,
  attachBetterThermostatCheckboxListener,
  attachHorizonCardCheckboxListener,
  attachHorizonCardExtendedCheckboxListener,
  attachPublicTransportCheckboxListener,
  attachAreaCheckboxListeners,
  attachDragAndDropListeners,
  attachExpandButtonListeners,
  sortAreaItems
} from './editor/simon42-editor-handlers.js';

class Simon42DashboardStrategyEditor extends HTMLElement {
  constructor() {
    super();
    // Persistenter State für aufgeklappte Areas und Gruppen
    this._expandedAreas = new Set();
    this._expandedGroups = new Map(); // Map<areaId, Set<groupKey>>
    this._isRendering = false;
    // Config Manager für zentrale Config-Verwaltung
    this._configManager = new ConfigManager(this);
  }

  setConfig(config) {
    this._config = config || {};
    // Nur rendern wenn wir nicht gerade selbst die Config ändern
    if (!this._isUpdatingConfig) {
      this._render();
    }
  }

  set hass(hass) {
    const shouldRender = !this._hass; // Nur beim ersten Mal rendern
    this._hass = hass;
    if (shouldRender) {
      this._render();
    }
  }

  // Dependency checks now use centralized dependency checker utility
  // See dist/utils/simon42-dependency-checker.js

  _render() {
    if (!this._hass || !this._config) {
      return;
    }

    // Initialisiere Logger für Editor
    initLogger(this._config);
    
    // Initialisiere Sprache für Editor
    initLanguage(this._config, this._hass);

    const showWeather = this._config.show_weather !== false;
    const showEnergy = this._config.show_energy !== false;
    const showPersonBadges = this._config.show_person_badges !== false;
    const showSearchCard = this._config.show_search_card === true;
    const showClockCard = this._config.show_clock_card === true;
    const showSummaryViews = this._config.show_summary_views === true; // Standard: false
    const showRoomViews = this._config.show_room_views === true; // Standard: false
    const groupByFloors = this._config.group_by_floors === true; // NEU
    const showCoversSummary = this._config.show_covers_summary !== false;
    const showSecuritySummary = this._config.show_security_summary !== false;
    const showLightSummary = this._config.show_light_summary !== false;
    const showBatterySummary = this._config.show_battery_summary !== false;
    const showBetterThermostat = this._config.show_better_thermostat === true;
    const showHorizonCard = this._config.show_horizon_card === true;
    const horizonCardExtended = this._config.horizon_card_extended === true;
    const showPublicTransport = this._config.show_public_transport === true;
    const publicTransportEntities = this._config.public_transport_entities || [];
    const publicTransportIntegration = this._config.public_transport_integration || '';
    const publicTransportCard = this._config.public_transport_card || '';
    
    // Prüfe ob die gewählte Integration/Card verfügbar ist
    let hasPublicTransportDeps = false;
    // Auto-determine card based on integration if not set (for dependency check)
    const cardMapping = {
      'hvv': 'hvv-card',
      'ha-departures': 'ha-departures-card',
      'db_info': 'db-info-card',
      'kvv': 'kvv-departures-card'
    };
    const cardToCheck = publicTransportCard || (publicTransportIntegration ? cardMapping[publicTransportIntegration] : null);
    
    if (publicTransportIntegration && cardToCheck) {
      hasPublicTransportDeps = checkPublicTransportDependencies(publicTransportIntegration, cardToCheck, this._hass);
    }
    const hvvMax = this._config.hvv_max !== undefined ? this._config.hvv_max : 10;
    const hvvShowTime = this._config.hvv_show_time === true;
    const hvvShowTitle = this._config.hvv_show_title === true;
    const hvvTitle = this._config.hvv_title || 'HVV';
    // ha-departures specific config
    const haDeparturesMax = this._config.ha_departures_max !== undefined ? this._config.ha_departures_max : 3;
    const haDeparturesShowCardHeader = this._config.ha_departures_show_card_header !== false; // Default true
    const haDeparturesShowAnimation = this._config.ha_departures_show_animation !== false; // Default true
    const haDeparturesShowTransportIcon = this._config.ha_departures_show_transport_icon === true; // Default false
    const haDeparturesHideEmptyDepartures = this._config.ha_departures_hide_empty_departures === true; // Default false
    const haDeparturesTimeStyle = this._config.ha_departures_time_style || 'dynamic'; // Default dynamic
    const haDeparturesIcon = this._config.ha_departures_icon || 'mdi:bus-multiple';
    const summariesColumns = this._config.summaries_columns || 2;
    const alarmEntity = this._config.alarm_entity || '';
    const favoriteEntities = this._config.favorite_entities || [];
    const roomPinEntities = this._config.room_pin_entities || [];
    // Check dependencies using centralized dependency checker
    const hasSearchCardDeps = checkDependency('search-card', this._hass);
    const hasBetterThermostatDeps = checkDependency('better-thermostat', this._hass);
    const hasHorizonCardDeps = checkDependency('horizon-card', this._hass);
    
    // Sammle alle Alarm-Control-Panel-Entitäten
    const alarmEntities = Object.keys(this._hass.states)
      .filter(entityId => entityId.startsWith('alarm_control_panel.'))
      .map(entityId => {
        const state = this._hass.states[entityId];
        return {
          entity_id: entityId,
          name: state.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ')
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Alle Entitäten für Favoriten-Select
    const allEntities = this._getAllEntitiesForSelect();
    
    // FEHLENDE VARIABLEN - HIER WAR DAS PROBLEM
    const allAreas = Object.values(this._hass.areas).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    const hiddenAreas = this._config.areas_display?.hidden || [];
    const areaOrder = this._config.areas_display?.order || [];

    // Setze HTML-Inhalt mit Styles und Template
    this.innerHTML = `
      <style>${getEditorStyles()}</style>
      ${renderEditorHTML({ 
        allAreas, 
        hiddenAreas, 
        areaOrder, 
        showWeather,
        showEnergy,
        showPersonBadges,
        showSummaryViews, 
        showRoomViews,
        showSearchCard,
        showClockCard,
        hasSearchCardDeps,
        summariesColumns,
        alarmEntity,
        alarmEntities,
        favoriteEntities,
        roomPinEntities,
        allEntities,
        groupByFloors, // NEU
        showCoversSummary,
        showSecuritySummary,
        showLightSummary,
        showBatterySummary,
        showBetterThermostat,
        hasBetterThermostatDeps,
        showHorizonCard,
        hasHorizonCardDeps,
        horizonCardExtended,
        showPublicTransport,
        publicTransportEntities,
        publicTransportIntegration,
        publicTransportCard,
        hasPublicTransportDeps,
        hvvMax,
        hvvShowTime,
        hvvShowTitle,
        hvvTitle,
        haDeparturesMax,
        haDeparturesShowCardHeader,
        haDeparturesShowAnimation,
        haDeparturesShowTransportIcon,
        haDeparturesHideEmptyDepartures,
        haDeparturesTimeStyle,
        haDeparturesIcon,
        entityNamePatterns: this._config.entity_name_patterns || [],
        logLevel: this._config.log_level || 'warn',
        hass: this._hass
      })}
    `;

    // Binde Event-Listener
    attachWeatherCheckboxListener(this, (showWeather) => this._showWeatherChanged(showWeather));
    attachEnergyCheckboxListener(this, (showEnergy) => this._showEnergyChanged(showEnergy));
    attachPersonBadgesCheckboxListener(this, (showPersonBadges) => this._showPersonBadgesChanged(showPersonBadges));
    attachSearchCardCheckboxListener(this, (showSearchCard) => this._showSearchCardChanged(showSearchCard));
    attachClockCardCheckboxListener(this, (showClockCard) => this._showClockCardChanged(showClockCard));
    attachSummaryViewsCheckboxListener(this, (showSummaryViews) => this._showSummaryViewsChanged(showSummaryViews));
    attachRoomViewsCheckboxListener(this, (showRoomViews) => this._showRoomViewsChanged(showRoomViews));
    attachGroupByFloorsCheckboxListener(this, (groupByFloors) => this._groupByFloorsChanged(groupByFloors)); // NEU
    attachCoversSummaryCheckboxListener(this, (showCoversSummary) => this._showCoversSummaryChanged(showCoversSummary));
    attachSecuritySummaryCheckboxListener(this, (showSecuritySummary) => this._showSecuritySummaryChanged(showSecuritySummary));
    attachLightSummaryCheckboxListener(this, (showLightSummary) => this._showLightSummaryChanged(showLightSummary));
    attachBatterySummaryCheckboxListener(this, (showBatterySummary) => this._showBatterySummaryChanged(showBatterySummary));
    attachBetterThermostatCheckboxListener(this, (showBetterThermostat) => this._showBetterThermostatChanged(showBetterThermostat));
    attachHorizonCardCheckboxListener(this, (showHorizonCard) => this._showHorizonCardChanged(showHorizonCard));
    attachHorizonCardExtendedCheckboxListener(this, (horizonCardExtended) => this._horizonCardExtendedChanged(horizonCardExtended));
    attachPublicTransportCheckboxListener(this, (showPublicTransport) => this._showPublicTransportChanged(showPublicTransport));
    this._attachPublicTransportIntegrationListeners();
    this._attachHvvCardListeners();
    this._attachHaDeparturesCardListeners();
    this._attachSummariesColumnsListener();
    this._attachAlarmEntityListener();
    this._attachFavoritesListeners();
    this._attachRoomPinsListeners();
    this._attachPublicTransportListeners();
    this._attachEntityNamePatternsListeners();
    this._attachLogLevelListener();
    attachAreaCheckboxListeners(this, (areaId, isVisible) => this._areaVisibilityChanged(areaId, isVisible));
    
    // Sortiere die Area-Items nach displayOrder
    sortAreaItems(this);
    
    // Drag & Drop Event Listener
    attachDragAndDropListeners(
      this,
      () => this._updateAreaOrder()
    );
    
    // Expand Button Listener
    attachExpandButtonListeners(
      this,
      this._hass,
      this._config,
      (areaId, group, entityId, isVisible) => this._entityVisibilityChanged(areaId, group, entityId, isVisible)
    );
    
    // Restore expanded state
    this._restoreExpandedState();
  }

  _createFavoritesPicker(favoriteEntities) {
    const container = this.querySelector('#favorites-picker-container');
    if (!container) {
      logWarn('[Editor] Favorites picker container not found');
      return;
    }

    // Erstelle ha-entities-picker Element
    const picker = document.createElement('ha-entities-picker');
    
    // Füge Picker zum Container hinzu
    container.innerHTML = '';
    container.appendChild(picker);
    
    // Setze Properties nach einem kurzen Delay (gibt dem Element Zeit zu initialisieren)
    requestAnimationFrame(() => {
      picker.hass = this._hass;
      picker.value = favoriteEntities || [];
      
      // Setze Attribute
      picker.setAttribute('label', 'Favoriten-Entitäten');
      picker.setAttribute('placeholder', 'Entität hinzufügen...');
      picker.setAttribute('allow-custom-entity', '');
      
      // Event Listener für Änderungen
      picker.addEventListener('value-changed', (e) => {
        e.stopPropagation();
        this._favoriteEntitiesChanged(e.detail.value);
      });
    });
  }

  _attachSummariesColumnsListener() {
    const radio2 = this.querySelector('#summaries-2-columns');
    const radio4 = this.querySelector('#summaries-4-columns');
    
    if (radio2) {
      radio2.addEventListener('change', (e) => {
        if (e.target.checked) {
          this._summariesColumnsChanged(2);
        }
      });
    }
    
    if (radio4) {
      radio4.addEventListener('change', (e) => {
        if (e.target.checked) {
          this._summariesColumnsChanged(4);
        }
      });
    }
  }

  _summariesColumnsChanged(columns) {
    this._configManager.updateProperty('summaries_columns', columns, 2);
  }

  _attachAlarmEntityListener() {
    const alarmSelect = this.querySelector('#alarm-entity');
    if (alarmSelect) {
      alarmSelect.addEventListener('change', (e) => {
        this._alarmEntityChanged(e.target.value);
      });
    }
  }

  _alarmEntityChanged(entityId) {
    this._configManager.updatePropertyCustom('alarm_entity', entityId, (val) => !val || val === '');
  }

  _attachFavoritesListeners() {
    // Add Button
    const addBtn = this.querySelector('#add-favorite-btn');
    const select = this.querySelector('#favorite-entity-select');
    
    if (addBtn && select) {
      addBtn.addEventListener('click', () => {
        const entityId = select.value;
        if (entityId && entityId !== '') {
          this._addFavoriteEntity(entityId);
          select.value = ''; // Reset selection
        }
      });
    }

    // Remove Buttons
    const removeButtons = this.querySelectorAll('.remove-favorite-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const entityId = e.target.dataset.entityId;
        this._removeFavoriteEntity(entityId);
      });
    });
  }

  _addFavoriteEntity(entityId) {
    if (!this._config || !this._hass) {
      return;
    }

    const currentFavorites = this._config.favorite_entities || [];
    
    // Prüfe ob bereits vorhanden
    if (currentFavorites.includes(entityId)) {
      return;
    }

    const newFavorites = [...currentFavorites, entityId];

    const newConfig = {
      ...this._config,
      favorite_entities: newFavorites
    };

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Favoriten-Liste
    this._updateFavoritesList();
  }

  _removeFavoriteEntity(entityId) {
    if (!this._config || !this._hass) {
      return;
    }

    const currentFavorites = this._config.favorite_entities || [];
    const newFavorites = currentFavorites.filter(id => id !== entityId);

    const newConfig = {
      ...this._config,
      favorite_entities: newFavorites.length > 0 ? newFavorites : undefined
    };

    // Entferne Property wenn leer
    if (newFavorites.length === 0) {
      delete newConfig.favorite_entities;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Favoriten-Liste
    this._updateFavoritesList();
  }

  _updateFavoritesList() {
    const container = this.querySelector('#favorites-list');
    if (!container) return;

    const favoriteEntities = this._config.favorite_entities || [];
    const allEntities = this._getAllEntitiesForSelect();
    
    // Importiere die Render-Funktion
    import('./editor/simon42-editor-template.js').then(module => {
      container.innerHTML = module.renderFavoritesList?.(favoriteEntities, allEntities) || 
                          this._renderFavoritesListFallback(favoriteEntities, allEntities);
      
      // Reattach listeners
      this._attachFavoritesListeners();
    }).catch((error) => {
      // Fallback falls Import fehlschlägt
      logWarn('[Editor] Failed to load favorites list component, using fallback:', error);
      container.innerHTML = this._renderFavoritesListFallback(favoriteEntities, allEntities);
      this._attachFavoritesListeners();
    });
  }

  _renderFavoritesListFallback(favoriteEntities, allEntities) {
    if (!favoriteEntities || favoriteEntities.length === 0) {
      return '<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">Keine Favoriten hinzugefügt</div>';
    }

    const entityMap = new Map(allEntities.map(e => [e.entity_id, e.name]));

    return `
      <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
        ${favoriteEntities.map((entityId) => {
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

  _attachRoomPinsListeners() {
    // Add Button
    const addBtn = this.querySelector('#add-room-pin-btn');
    const select = this.querySelector('#room-pin-entity-select');
    
    if (addBtn && select) {
      addBtn.addEventListener('click', () => {
        const entityId = select.value;
        if (entityId && entityId !== '') {
          this._addRoomPinEntity(entityId);
          select.value = ''; // Reset selection
        }
      });
    }

    // Remove Buttons
    const removeButtons = this.querySelectorAll('.remove-room-pin-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const entityId = e.target.dataset.entityId;
        this._removeRoomPinEntity(entityId);
      });
    });
  }

  _addRoomPinEntity(entityId) {
    if (!this._config || !this._hass) {
      return;
    }

    const currentPins = this._config.room_pin_entities || [];
    
    // Prüfe ob bereits vorhanden
    if (currentPins.includes(entityId)) {
      return;
    }

    const newPins = [...currentPins, entityId];

    const newConfig = {
      ...this._config,
      room_pin_entities: newPins
    };

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Raum-Pins-Liste
    this._updateRoomPinsList();
  }

  _removeRoomPinEntity(entityId) {
    if (!this._config || !this._hass) {
      return;
    }

    const currentPins = this._config.room_pin_entities || [];
    const newPins = currentPins.filter(id => id !== entityId);

    const newConfig = {
      ...this._config,
      room_pin_entities: newPins.length > 0 ? newPins : undefined
    };

    // Entferne Property wenn leer
    if (newPins.length === 0) {
      delete newConfig.room_pin_entities;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Raum-Pins-Liste
    this._updateRoomPinsList();
  }

  _updateRoomPinsList() {
    const container = this.querySelector('#room-pins-list');
    if (!container) return;

    const roomPinEntities = this._config.room_pin_entities || [];
    const allEntities = this._getAllEntitiesForSelect();
    const allAreas = Object.values(this._hass.areas).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    
    // Importiere die Render-Funktion
    import('./editor/simon42-editor-template.js').then(module => {
      container.innerHTML = module.renderRoomPinsList?.(roomPinEntities, allEntities, allAreas) || 
                          this._renderRoomPinsListFallback(roomPinEntities, allEntities, allAreas);
      
      // Reattach listeners
      this._attachRoomPinsListeners();
    }).catch((error) => {
      // Fallback falls Import fehlschlägt
      logWarn('[Editor] Failed to load room pins list component, using fallback:', error);
      container.innerHTML = this._renderRoomPinsListFallback(roomPinEntities, allEntities, allAreas);
      this._attachRoomPinsListeners();
    });
  }

  _renderRoomPinsListFallback(roomPinEntities, allEntities, allAreas) {
    if (!roomPinEntities || roomPinEntities.length === 0) {
      return '<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">Keine Raum-Pins hinzugefügt</div>';
    }

    const entityMap = new Map(allEntities.map(e => [e.entity_id, e]));
    const areaMap = new Map(allAreas.map(a => [a.area_id, a.name]));

    return `
      <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
        ${roomPinEntities.map((entityId) => {
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

  _getAllEntitiesForSelect() {
    if (!this._hass) return [];

    const entities = Object.values(this._hass.entities || {});
    const devices = Object.values(this._hass.devices || {});
    
    // Erstelle Device-zu-Area Map für Lookup
    const deviceAreaMap = new Map();
    devices.forEach(device => {
      if (device.area_id) {
        deviceAreaMap.set(device.id, device.area_id);
      }
    });

    return Object.keys(this._hass.states)
      .map(entityId => {
        const state = this._hass.states[entityId];
        const entity = entities.find(e => e.entity_id === entityId);
        
        // Ermittle area_id: Entweder direkt oder über Device
        let areaId = entity?.area_id;
        if (!areaId && entity?.device_id) {
          areaId = deviceAreaMap.get(entity.device_id);
        }
        
        return {
          entity_id: entityId,
          name: state.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' '),
          area_id: areaId,
          device_area_id: areaId // Für Backward-Kompatibilität
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Handles changes to favorite entities list
   * @param {Array} entities - Array of favorite entity IDs
   */
  _favoriteEntitiesChanged(entities) {
    if (!this._config || !this._hass) {
      return;
    }

    const newConfig = {
      ...this._config,
      favorite_entities: entities
    };

    // Wenn leer, entfernen wir die Property
    if (!entities || entities.length === 0) {
      delete newConfig.favorite_entities;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _restoreExpandedState() {
    // Restore expanded areas
    this._expandedAreas.forEach(areaId => {
      const button = this.querySelector(`.expand-button[data-area-id="${areaId}"]`);
      const content = this.querySelector(`.area-content[data-area-id="${areaId}"]`);
      
      if (button && content) {
        content.style.display = 'block';
        button.classList.add('expanded');
        
        // Restore expanded groups for this area
        const expandedGroups = this._expandedGroups.get(areaId);
        if (expandedGroups) {
          expandedGroups.forEach(groupKey => {
            const groupButton = content.querySelector(`.expand-button-small[data-area-id="${areaId}"][data-group="${groupKey}"]`);
            const entityList = content.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${groupKey}"]`);
            
            if (groupButton && entityList) {
              entityList.style.display = 'block';
              groupButton.classList.add('expanded');
            }
          });
        }
      }
    });
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

  _showWeatherChanged(showWeather) {
    this._configManager.updateProperty('show_weather', showWeather, true);
  }

  _showEnergyChanged(showEnergy) {
    this._configManager.updateProperty('show_energy', showEnergy, true);
  }

  _showPersonBadgesChanged(showPersonBadges) {
    this._configManager.updateProperty('show_person_badges', showPersonBadges, true);
  }

  _showSearchCardChanged(showSearchCard) {
    this._configManager.updateProperty('show_search_card', showSearchCard, false);
  }

  _showSummaryViewsChanged(showSummaryViews) {
    this._configManager.updateProperty('show_summary_views', showSummaryViews, false);
  }

  _showRoomViewsChanged(showRoomViews) {
    this._configManager.updateProperty('show_room_views', showRoomViews, false);
  }

  _areaVisibilityChanged(areaId, isVisible) {
    if (!this._config || !this._hass) {
      return;
    }

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

  _entityVisibilityChanged(areaId, group, entityId, isVisible) {
    if (!this._config || !this._hass) {
      return;
    }

    // Get current hidden entities for this group
    const currentAreaOptions = this._config.areas_options?.[areaId] || {};
    const currentGroupsOptions = currentAreaOptions.groups_options || {};
    const currentGroupOptions = currentGroupsOptions[group] || {};
    let hiddenEntities = [...(currentGroupOptions.hidden || [])];
    
    if (entityId === null) {
      // All entities in the group - get from DOM
      const allEntities = getEntitiesFromDOM(this, areaId, group);
      
      if (!isVisible) {
        // Add all entities to hidden list
        hiddenEntities = [...new Set([...hiddenEntities, ...allEntities])];
      } else {
        // Remove all entities from hidden list
        hiddenEntities = hiddenEntities.filter(e => !allEntities.includes(e));
      }
    } else {
      // Single entity
      if (isVisible) {
        // Remove from hidden
        hiddenEntities = hiddenEntities.filter(e => e !== entityId);
      } else {
        // Add to hidden (avoid duplicates)
        if (!hiddenEntities.includes(entityId)) {
          hiddenEntities.push(entityId);
        }
      }
    }

    // Update nested config structure with automatic cleanup
    const newConfig = updateNestedConfig(
      this._config,
      ['areas_options', areaId, 'groups_options', group, 'hidden'],
      hiddenEntities.length > 0 ? hiddenEntities : undefined
    );

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  // Für Bereiche nach Etage anzeigen
  _groupByFloorsChanged(groupByFloors) {
    this._configManager.updateProperty('group_by_floors', groupByFloors, false);
  }

  _showClockCardChanged(showClockCard) {
    this._configManager.updateProperty('show_clock_card', showClockCard, false);
  }

  _showCoversSummaryChanged(showCoversSummary) {
    this._configManager.updateProperty('show_covers_summary', showCoversSummary, true);
  }

  _showSecuritySummaryChanged(showSecuritySummary) {
    this._configManager.updateProperty('show_security_summary', showSecuritySummary, true);
  }

  _showLightSummaryChanged(showLightSummary) {
    this._configManager.updateProperty('show_light_summary', showLightSummary, true);
  }

  _showBatterySummaryChanged(showBatterySummary) {
    this._configManager.updateProperty('show_battery_summary', showBatterySummary, true);
  }

  _showBetterThermostatChanged(showBetterThermostat) {
    this._configManager.updateProperty('show_better_thermostat', showBetterThermostat, false);
  }

  _showHorizonCardChanged(showHorizonCard) {
    this._configManager.updateProperty('show_horizon_card', showHorizonCard, false);
    this._render();
  }

  _horizonCardExtendedChanged(horizonCardExtended) {
    this._configManager.updateProperty('horizon_card_extended', horizonCardExtended, false);
  }

  _showPublicTransportChanged(showPublicTransport) {
    this._configManager.updateProperty('show_public_transport', showPublicTransport, false);
    // Re-render to show/hide integration selection
    this._render();
  }

  _attachPublicTransportIntegrationListeners() {
    // Integration dropdown
    const integrationSelect = this.querySelector('#public-transport-integration');
    if (integrationSelect) {
      integrationSelect.addEventListener('change', (e) => {
        const integration = e.target.value;
        this._publicTransportIntegrationChanged(integration);
        // Re-render to update dependency check and entity selection
        this._render();
      });
    }
  }

  _getAvailableCardsForIntegration(integration) {
    // Map integration to available cards
    // This structure allows for multiple cards per integration in the future
    const integrationCards = {
      'hvv': ['hvv-card'],
      'ha-departures': ['ha-departures-card'],
      'db_info': ['db-info-card'],
      'kvv': ['kvv-departures-card']
    };
    
    return integrationCards[integration] || [];
  }

  _updateCardBasedOnIntegration(integration) {
    const cardSelect = this.querySelector('#public-transport-card');
    if (!cardSelect) return;

    const availableCards = this._getAvailableCardsForIntegration(integration);
    
    if (availableCards.length > 0) {
      cardSelect.disabled = false;
      
      // Check if current card is valid for this integration
      const currentCard = this._config.public_transport_card || '';
      const isValidCard = availableCards.includes(currentCard);
      
      // Use current card if valid, otherwise use first available card
      const cardToSelect = isValidCard ? currentCard : availableCards[0];
      cardSelect.value = cardToSelect;
      this._publicTransportCardChanged(cardToSelect);
    } else {
      // No cards available for this integration
      cardSelect.disabled = true;
      cardSelect.value = '';
      this._publicTransportCardChanged('');
    }
  }

  _publicTransportIntegrationChanged(integration) {
    if (!this._config || !this._hass) {
      return;
    }

    const currentIntegration = this._config.public_transport_integration;
    const isChanging = currentIntegration !== integration;
    
    const newConfig = { ...this._config };

    if (integration) {
      // Set new integration
      newConfig.public_transport_integration = integration;
      
      // Auto-set card based on integration using centralized mapping
      newConfig.public_transport_card = PUBLIC_TRANSPORT_MAPPING[integration];
      
      // Clear all integration-specific settings when changing integration
      if (isChanging) {
        // Clear properties from all integrations (they'll be set fresh for the new one)
        const allProps = getAllIntegrationProperties();
        allProps.forEach(prop => {
          delete newConfig[prop];
        });
      }
    } else {
      // Remove integration and card if integration is cleared
      delete newConfig.public_transport_integration;
      delete newConfig.public_transport_card;
      
      // Clear all integration-specific properties
      const allProps = getAllIntegrationProperties();
      allProps.forEach(prop => {
        delete newConfig[prop];
      });
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _publicTransportCardChanged(card) {
    this._configManager.updatePropertyCustom('public_transport_card', card, (val) => !val || val === '');
  }

  _attachPublicTransportListeners() {
    // Add Button
    const addBtn = this.querySelector('#add-public-transport-btn');
    const select = this.querySelector('#public-transport-entity-select');
    
    if (addBtn && select) {
      addBtn.addEventListener('click', () => {
        const entityId = select.value;
        if (entityId && entityId !== '') {
          this._addPublicTransportEntity(entityId);
          select.value = ''; // Reset selection
        }
      });
    }

    // Remove Buttons
    const removeButtons = this.querySelectorAll('.remove-public-transport-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const entityId = e.target.dataset.entityId;
        this._removePublicTransportEntity(entityId);
      });
    });
  }

  _addPublicTransportEntity(entityId) {
    if (!this._config || !this._hass) {
      return;
    }

    const currentEntities = this._config.public_transport_entities || [];
    
    // Prüfe ob bereits vorhanden
    if (currentEntities.includes(entityId)) {
      return;
    }

    const newEntities = [...currentEntities, entityId];

    const newConfig = {
      ...this._config,
      public_transport_entities: newEntities
    };

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Public Transport-Liste
    this._updatePublicTransportList();
  }

  _removePublicTransportEntity(entityId) {
    if (!this._config || !this._hass) {
      return;
    }

    const currentEntities = this._config.public_transport_entities || [];
    const newEntities = currentEntities.filter(id => id !== entityId);

    const newConfig = {
      ...this._config,
      public_transport_entities: newEntities.length > 0 ? newEntities : undefined
    };

    // Entferne Property wenn leer
    if (newEntities.length === 0) {
      delete newConfig.public_transport_entities;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Public Transport-Liste
    this._updatePublicTransportList();
  }

  _updatePublicTransportList() {
    const container = this.querySelector('#public-transport-list');
    if (!container) return;

    const publicTransportEntities = this._config.public_transport_entities || [];
    const allEntities = this._getAllEntitiesForSelect();
    
    // Importiere die Render-Funktion
    import('./editor/simon42-editor-template.js').then(module => {
      // Die renderPublicTransportList Funktion ist nicht exportiert, verwende Fallback
      container.innerHTML = this._renderPublicTransportListFallback(publicTransportEntities, allEntities);
      
      // Reattach listeners
      this._attachPublicTransportListeners();
    }).catch((error) => {
      // Fallback falls Import fehlschlägt
      logWarn('[Editor] Failed to load public transport list component, using fallback:', error);
      container.innerHTML = this._renderPublicTransportListFallback(publicTransportEntities, allEntities);
      this._attachPublicTransportListeners();
    });
  }

  _renderPublicTransportListFallback(publicTransportEntities, allEntities) {
    if (!publicTransportEntities || publicTransportEntities.length === 0) {
      return '<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">Keine Entitäten hinzugefügt</div>';
    }

    const entityMap = new Map(allEntities.map(e => [e.entity_id, e.name]));

    return `
      <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
        ${publicTransportEntities.map((entityId) => {
          const name = entityMap.get(entityId) || entityId;
          return `
            <div class="public-transport-item" data-entity-id="${entityId}" style="display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); background: var(--card-background-color);">
              <span class="drag-handle" style="margin-right: 12px; cursor: grab; color: var(--secondary-text-color);">☰</span>
              <span style="flex: 1; font-size: 14px;">
                <strong>${name}</strong>
                <span style="margin-left: 8px; font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">${entityId}</span>
              </span>
              <button class="remove-public-transport-btn" data-entity-id="${entityId}" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer;">
                ✕
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  _attachLogLevelListener() {
    const logLevelSelect = this.querySelector('#log-level');
    if (logLevelSelect) {
      logLevelSelect.addEventListener('change', (e) => {
        this._logLevelChanged(e.target.value);
      });
    }
  }

  _logLevelChanged(level) {
    this._configManager.updateProperty('log_level', level, 'warn');
    // Re-initialize logger with new level
    initLogger(this._config);
  }

  _attachEntityNamePatternsListeners() {
    // Add Button
    const addBtn = this.querySelector('#add-pattern-btn');
    const input = this.querySelector('#entity-name-pattern-input');
    
    if (addBtn && input) {
      // Add on Enter key press
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addBtn.click();
        }
      });

      // Add on button click
      addBtn.addEventListener('click', () => {
        const pattern = input.value.trim(); // Trim leading/trailing whitespace
        
        if (pattern) { // Prüfe ob nicht leer
          // Validate regex pattern
          try {
            new RegExp(pattern);
            // Neue Patterns werden immer als String hinzugefügt (ohne Domain-Restriktion)
            // Domain kann später über den Selector in der Liste gesetzt werden
            this._addEntityNamePattern(pattern);
            input.value = ''; // Clear input
          } catch (error) {
            alert(`Ungültiges Regex-Pattern: ${error.message}`);
          }
        }
      });
    }

    // Remove Buttons
    const removeButtons = this.querySelectorAll('.remove-pattern-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.patternIndex, 10);
        this._removeEntityNamePattern(index);
      });
    });

    // Domain Selectors for existing patterns
    const domainSelectors = this.querySelectorAll('.pattern-domain-select');
    domainSelectors.forEach(select => {
      select.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.patternIndex, 10);
        const selectedDomain = e.target.value;
        this._updatePatternDomain(index, selectedDomain);
      });
    });
  }

  _addEntityNamePattern(pattern) {
    if (!this._config || !this._hass) {
      return;
    }

    const currentPatterns = this._config.entity_name_patterns || [];
    
    // Prüfe ob bereits vorhanden (für Strings direkt, für Objekte vergleiche pattern und domain)
    const isDuplicate = currentPatterns.some(existing => {
      if (typeof pattern === 'string' && typeof existing === 'string') {
        return existing === pattern;
      }
      if (typeof pattern === 'object' && typeof existing === 'object') {
        return existing.pattern === pattern.pattern && 
               (existing.domain === pattern.domain || 
                (Array.isArray(existing.domains) && Array.isArray(pattern.domains) && 
                 JSON.stringify(existing.domains.sort()) === JSON.stringify(pattern.domains.sort())));
      }
      return false;
    });
    
    if (isDuplicate) {
      return;
    }

    const newPatterns = [...currentPatterns, pattern];

    const newConfig = {
      ...this._config,
      entity_name_patterns: newPatterns
    };

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Patterns-Liste
    this._updateEntityNamePatternsList();
  }

  _removeEntityNamePattern(index) {
    if (!this._config || !this._hass) {
      return;
    }

    const currentPatterns = this._config.entity_name_patterns || [];
    const newPatterns = currentPatterns.filter((_, i) => i !== index);

    const newConfig = {
      ...this._config,
      entity_name_patterns: newPatterns.length > 0 ? newPatterns : undefined
    };

    // Entferne Property wenn leer
    if (newPatterns.length === 0) {
      delete newConfig.entity_name_patterns;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Patterns-Liste
    this._updateEntityNamePatternsList();
  }

  _updatePatternDomain(index, domain) {
    if (!this._config || !this._hass) {
      return;
    }

    const currentPatterns = this._config.entity_name_patterns || [];
    if (index < 0 || index >= currentPatterns.length) {
      return;
    }

    const pattern = currentPatterns[index];
    let updatedPattern;

    if (domain === '') {
      // Domain entfernen: Wenn Pattern ein Objekt ist, konvertiere zu String
      if (typeof pattern === 'object' && pattern.pattern) {
        updatedPattern = pattern.pattern;
      } else {
        // Bereits ein String oder kein pattern property
        updatedPattern = pattern;
      }
    } else {
      // Domain setzen: Wenn Pattern ein String ist, konvertiere zu Objekt
      if (typeof pattern === 'string') {
        updatedPattern = { pattern: pattern, domain: domain };
      } else if (typeof pattern === 'object') {
        // Aktualisiere bestehendes Objekt
        updatedPattern = { ...pattern, domain: domain };
        // Entferne domains property falls vorhanden (wir verwenden nur domain)
        delete updatedPattern.domains;
      } else {
        updatedPattern = pattern;
      }
    }

    const newPatterns = [...currentPatterns];
    newPatterns[index] = updatedPattern;

    const newConfig = {
      ...this._config,
      entity_name_patterns: newPatterns
    };

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Patterns-Liste
    this._updateEntityNamePatternsList();
  }

  _updateEntityNamePatternsList() {
    const container = this.querySelector('#entity-name-patterns-list');
    if (!container) return;

    const patterns = this._config.entity_name_patterns || [];
    
    // Importiere die Render-Funktion
    import('./editor/simon42-editor-template.js').then(module => {
      if (module.renderEntityNamePatternsList) {
        container.innerHTML = module.renderEntityNamePatternsList(patterns);
      } else {
        container.innerHTML = this._renderEntityNamePatternsListFallback(patterns);
      }
      
      // Reattach listeners
      this._attachEntityNamePatternsListeners();
    }).catch((error) => {
      // Fallback falls Import fehlschlägt
      logWarn('[Editor] Failed to load entity name patterns list component, using fallback:', error);
      container.innerHTML = this._renderEntityNamePatternsListFallback(patterns);
      this._attachEntityNamePatternsListeners();
    });
  }

  _renderEntityNamePatternsListFallback(patterns) {
    if (!patterns || patterns.length === 0) {
      return '<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">Keine Patterns hinzugefügt</div>';
    }

    // Hilfsfunktion: Escaped HTML-Sonderzeichen und ersetzt Leerzeichen durch sichtbare Zeichen
    const makeSpacesVisible = (text) => {
      // Escaped zuerst HTML-Sonderzeichen
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      
      // Ersetze dann normale Leerzeichen durch · (middle dot) für bessere Sichtbarkeit
      // Verwende HTML-Entity für zuverlässige Darstellung
      return escaped.replace(/ /g, '&middot;');
    };

    const getDomainSelectorOptions = (selectedDomain = '') => {
      const domains = [
        { value: '', label: t('patternDomainAll') },
        { value: 'light', label: t('domainLight') },
        { value: 'switch', label: t('domainSwitch') },
        { value: 'cover', label: t('domainCover') },
        { value: 'climate', label: t('domainClimate') },
        { value: 'sensor', label: t('domainSensor') },
        { value: 'binary_sensor', label: t('domainBinarySensor') },
        { value: 'media_player', label: t('domainMediaPlayer') },
        { value: 'scene', label: t('domainScene') },
        { value: 'vacuum', label: t('domainVacuum') },
        { value: 'fan', label: t('domainFan') },
        { value: 'camera', label: t('domainCamera') },
        { value: 'lock', label: t('domainLock') },
        { value: 'input_boolean', label: t('domainInputBoolean') },
        { value: 'input_number', label: t('domainInputNumber') },
        { value: 'input_select', label: t('domainInputSelect') },
        { value: 'input_text', label: t('domainInputText') }
      ];
      
      return domains.map(domain => 
        `<option value="${domain.value}" ${domain.value === selectedDomain ? 'selected' : ''}>${domain.label}</option>`
      ).join('');
    };

    return `
      <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
        ${patterns.map((pattern, index) => {
          const patternText = typeof pattern === 'string' ? pattern : pattern.pattern || '';
          const displayText = makeSpacesVisible(patternText);
          const currentDomain = typeof pattern === 'object' ? pattern.domain : '';
          return `
            <div class="entity-name-pattern-item" data-pattern-index="${index}" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); background: var(--card-background-color);">
              <span style="flex: 1; font-size: 14px; font-family: monospace; word-break: break-all; white-space: pre-wrap;" title="${patternText.replace(/"/g, '&quot;')}">${displayText}</span>
              <select 
                class="pattern-domain-select" 
                data-pattern-index="${index}"
                style="min-width: 150px; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font-size: 12px;"
              >
                ${getDomainSelectorOptions(currentDomain)}
              </select>
              <button class="remove-pattern-btn" data-pattern-index="${index}" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer; flex-shrink: 0;">
                ✕
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  _attachHvvCardListeners() {
    // Max input
    const maxInput = this.querySelector('#hvv-max');
    if (maxInput) {
      maxInput.addEventListener('change', (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 1 && value <= 50) {
          this._hvvMaxChanged(value);
        }
      });
    }

    // Show time checkbox
    const showTimeCheckbox = this.querySelector('#hvv-show-time');
    if (showTimeCheckbox) {
      showTimeCheckbox.addEventListener('change', (e) => {
        this._hvvShowTimeChanged(e.target.checked);
      });
    }

    // Show title checkbox
    const showTitleCheckbox = this.querySelector('#hvv-show-title');
    if (showTitleCheckbox) {
      showTitleCheckbox.addEventListener('change', (e) => {
        this._hvvShowTitleChanged(e.target.checked);
      });
    }

    // Title input
    const titleInput = this.querySelector('#hvv-title');
    if (titleInput) {
      titleInput.addEventListener('change', (e) => {
        this._hvvTitleChanged(e.target.value);
      });
    }
  }

  _hvvMaxChanged(max) {
    this._configManager.updateProperty('hvv_max', max, 10);
  }

  _hvvShowTimeChanged(showTime) {
    this._configManager.updateProperty('hvv_show_time', showTime, false);
  }

  _hvvShowTitleChanged(showTitle) {
    this._configManager.updateProperty('hvv_show_title', showTitle, false);
  }

  _hvvTitleChanged(title) {
    this._configManager.updatePropertyCustom('hvv_title', title, (val) => !val || val === 'HVV');
  }

  _attachHaDeparturesCardListeners() {
    // Max input
    const maxInput = this.querySelector('#ha-departures-max');
    if (maxInput) {
      maxInput.addEventListener('change', (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 1 && value <= 5) {
          this._haDeparturesMaxChanged(value);
        }
      });
    }

    // Icon input
    const iconInput = this.querySelector('#ha-departures-icon');
    if (iconInput) {
      iconInput.addEventListener('change', (e) => {
        this._haDeparturesIconChanged(e.target.value);
      });
    }

    // Show card header checkbox
    const showCardHeaderCheckbox = this.querySelector('#ha-departures-show-card-header');
    if (showCardHeaderCheckbox) {
      showCardHeaderCheckbox.addEventListener('change', (e) => {
        this._haDeparturesShowCardHeaderChanged(e.target.checked);
      });
    }

    // Show animation checkbox
    const showAnimationCheckbox = this.querySelector('#ha-departures-show-animation');
    if (showAnimationCheckbox) {
      showAnimationCheckbox.addEventListener('change', (e) => {
        this._haDeparturesShowAnimationChanged(e.target.checked);
      });
    }

    // Show transport icon checkbox
    const showTransportIconCheckbox = this.querySelector('#ha-departures-show-transport-icon');
    if (showTransportIconCheckbox) {
      showTransportIconCheckbox.addEventListener('change', (e) => {
        this._haDeparturesShowTransportIconChanged(e.target.checked);
      });
    }

    // Hide empty departures checkbox
    const hideEmptyDeparturesCheckbox = this.querySelector('#ha-departures-hide-empty-departures');
    if (hideEmptyDeparturesCheckbox) {
      hideEmptyDeparturesCheckbox.addEventListener('change', (e) => {
        this._haDeparturesHideEmptyDeparturesChanged(e.target.checked);
      });
    }

    // Time style select
    const timeStyleSelect = this.querySelector('#ha-departures-time-style');
    if (timeStyleSelect) {
      timeStyleSelect.addEventListener('change', (e) => {
        this._haDeparturesTimeStyleChanged(e.target.value);
      });
    }
  }

  _haDeparturesMaxChanged(max) {
    this._configManager.updateProperty('ha_departures_max', max, 3);
  }

  _haDeparturesIconChanged(icon) {
    this._configManager.updatePropertyCustom('ha_departures_icon', icon, (val) => !val || val.trim() === '' || val === 'mdi:bus-multiple');
  }

  _haDeparturesShowCardHeaderChanged(showCardHeader) {
    this._configManager.updateProperty('ha_departures_show_card_header', showCardHeader, true);
  }

  _haDeparturesShowAnimationChanged(showAnimation) {
    this._configManager.updateProperty('ha_departures_show_animation', showAnimation, true);
  }

  _haDeparturesShowTransportIconChanged(showTransportIcon) {
    this._configManager.updateProperty('ha_departures_show_transport_icon', showTransportIcon, false);
  }

  _haDeparturesHideEmptyDeparturesChanged(hideEmptyDepartures) {
    this._configManager.updateProperty('ha_departures_hide_empty_departures', hideEmptyDepartures, false);
  }

  _haDeparturesTimeStyleChanged(timeStyle) {
    this._configManager.updateProperty('ha_departures_time_style', timeStyle, 'dynamic');
  }

  _fireConfigChanged(config) {
    // Setze Flag, damit setConfig() nicht erneut rendert
    this._isUpdatingConfig = true;
    this._config = config;
    
    const event = new CustomEvent('config-changed', {
      detail: { config },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
    
    // Reset Flag nach einem Tick
    setTimeout(() => {
      this._isUpdatingConfig = false;
    }, 0);
  }
}

// Registriere Custom Element
customElements.define("simon42-dashboard-strategy-editor", Simon42DashboardStrategyEditor);