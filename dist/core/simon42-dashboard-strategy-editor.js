// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR
// ====================================================================
import { getEditorStyles } from './editor/simon42-editor-styles.js';
import { renderEditorHTML } from './editor/simon42-editor-template.js';
import { 
  attachWeatherCheckboxListener,
  attachEnergyCheckboxListener,
  attachSearchCardCheckboxListener,
  attachSummaryViewsCheckboxListener,
  attachRoomViewsCheckboxListener,
  attachGroupByFloorsCheckboxListener, // NEU
  attachCoversSummaryCheckboxListener,
  attachBetterThermostatCheckboxListener,
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

  _checkSearchCardDependencies() {
    // Prüfe ob custom:search-card und card-tools verfügbar sind
    const hasSearchCard = customElements.get('search-card') !== undefined;
    const hasCardTools = window.customCards && window.customCards.some(card => 
      card.type === 'custom:search-card'
    );
    
    // Alternative Prüfung: Versuche zu erkennen ob die Komponenten geladen wurden
    const searchCardExists = hasSearchCard || document.querySelector('search-card') !== null;
    const cardToolsExists = typeof window.customCards !== 'undefined' || typeof window.cardTools !== 'undefined';
    
    // Beide müssen verfügbar sein
    return searchCardExists && cardToolsExists;
  }

  _checkBetterThermostatDependencies() {
    // Prüfe ob better_thermostat Integration vorhanden ist
    // Better Thermostat entities haben platform: "better_thermostat" in der Entity Registry
    const entities = Object.values(this._hass?.entities || {});
    const hasBetterThermostatEntities = entities.some(entity => {
      // Prüfe ob es eine climate entity mit better_thermostat platform ist
      if (entity.entity_id?.startsWith('climate.')) {
        // In Home Assistant wird die Platform in der Entity Registry gespeichert
        // Prüfe über die platform property oder über den device_id
        const platform = entity.platform;
        if (platform === 'better_thermostat') {
          return true;
        }
        // Alternative: Prüfe über den device_id oder config_entry_id
        // Better Thermostat erstellt Entities mit bestimmten Attributen
        const state = this._hass?.states?.[entity.entity_id];
        if (state?.attributes?.integration === 'better_thermostat') {
          return true;
        }
      }
      return false;
    });
    
    // Prüfe ob better-thermostat-ui-card verfügbar ist
    // Die Card sollte als custom element registriert sein
    const hasUICard = customElements.get('better-thermostat-ui-card') !== undefined ||
                      window.customCards?.some(card => card.type === 'custom:better-thermostat-ui-card') ||
                      document.querySelector('better-thermostat-ui-card') !== null;
    
    return hasBetterThermostatEntities && hasUICard;
  }

  _render() {
    if (!this._hass || !this._config) {
      return;
    }

    const showWeather = this._config.show_weather !== false;
    const showEnergy = this._config.show_energy !== false;
    const showSearchCard = this._config.show_search_card === true;
    const showSummaryViews = this._config.show_summary_views === true; // Standard: false
    const showRoomViews = this._config.show_room_views === true; // Standard: false
    const groupByFloors = this._config.group_by_floors === true; // NEU
    const showCoversSummary = this._config.show_covers_summary !== false;
    const showBetterThermostat = this._config.show_better_thermostat === true;
    const summariesColumns = this._config.summaries_columns || 2;
    const alarmEntity = this._config.alarm_entity || '';
    const favoriteEntities = this._config.favorite_entities || [];
    const roomPinEntities = this._config.room_pin_entities || [];
    const hasSearchCardDeps = this._checkSearchCardDependencies();
    let hasBetterThermostatDeps = false;
    try {
      hasBetterThermostatDeps = this._checkBetterThermostatDependencies();
    } catch (e) {
      console.warn('Error checking Better Thermostat dependencies:', e);
      hasBetterThermostatDeps = false;
    }
    
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
        showSummaryViews, 
        showRoomViews,
        showSearchCard,
        hasSearchCardDeps,
        summariesColumns,
        alarmEntity,
        alarmEntities,
        favoriteEntities,
        roomPinEntities,
        allEntities,
        groupByFloors, // NEU
        showCoversSummary,
        showBetterThermostat,
        hasBetterThermostatDeps
      })}
    `;

    // Binde Event-Listener
    attachWeatherCheckboxListener(this, (showWeather) => this._showWeatherChanged(showWeather));
    attachEnergyCheckboxListener(this, (showEnergy) => this._showEnergyChanged(showEnergy));
    attachSearchCardCheckboxListener(this, (showSearchCard) => this._showSearchCardChanged(showSearchCard));
    attachSummaryViewsCheckboxListener(this, (showSummaryViews) => this._showSummaryViewsChanged(showSummaryViews));
    attachRoomViewsCheckboxListener(this, (showRoomViews) => this._showRoomViewsChanged(showRoomViews));
    attachGroupByFloorsCheckboxListener(this, (groupByFloors) => this._groupByFloorsChanged(groupByFloors)); // NEU
    attachCoversSummaryCheckboxListener(this, (showCoversSummary) => this._showCoversSummaryChanged(showCoversSummary));
    attachBetterThermostatCheckboxListener(this, (showBetterThermostat) => this._showBetterThermostatChanged(showBetterThermostat));
    this._attachSummariesColumnsListener();
    this._attachAlarmEntityListener();
    this._attachFavoritesListeners();
    this._attachRoomPinsListeners();
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
      console.warn('Favorites picker container not found');
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
      
      console.log('Favorites picker created:', picker);
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
    if (!this._config || !this._hass) {
      return;
    }

    const newConfig = {
      ...this._config,
      summaries_columns: columns
    };

    // Wenn der Standardwert (2) gesetzt ist, entfernen wir die Property
    if (columns === 2) {
      delete newConfig.summaries_columns;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
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
    if (!this._config || !this._hass) {
      return;
    }

    const newConfig = {
      ...this._config,
      alarm_entity: entityId
    };

    // Wenn leer, entfernen wir die Property
    if (!entityId || entityId === '') {
      delete newConfig.alarm_entity;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
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
    }).catch(() => {
      // Fallback falls Import fehlschlägt
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
    }).catch(() => {
      // Fallback falls Import fehlschlägt
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

  // Kann weg?
  _favoriteEntitiesChanged(entities) {
    if (!this._config || !this._hass) {
      return;
    }

    console.log('Favorites changed:', entities);

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
    if (!this._config || !this._hass) {
      return;
    }

    const newConfig = {
      ...this._config,
      show_weather: showWeather
    };

    // Wenn der Standardwert (true) gesetzt ist, entfernen wir die Property
    if (showWeather === true) {
      delete newConfig.show_weather;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _showEnergyChanged(showEnergy) {
    if (!this._config || !this._hass) {
      return;
    }

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

  _showSearchCardChanged(showSearchCard) {
    if (!this._config || !this._hass) {
      return;
    }

    const newConfig = {
      ...this._config,
      show_search_card: showSearchCard
    };

    // Wenn der Standardwert (false) gesetzt ist, entfernen wir die Property
    if (showSearchCard === false) {
      delete newConfig.show_search_card;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _showSummaryViewsChanged(showSummaryViews) {
    if (!this._config || !this._hass) {
      return;
    }

    const newConfig = {
      ...this._config,
      show_summary_views: showSummaryViews
    };

    // Wenn der Standardwert (false) gesetzt ist, entfernen wir die Property
    if (showSummaryViews === false) {
      delete newConfig.show_summary_views;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _showRoomViewsChanged(showRoomViews) {
    if (!this._config || !this._hass) {
      return;
    }

    const newConfig = {
      ...this._config,
      show_room_views: showRoomViews
    };

    // Wenn der Standardwert (false) gesetzt ist, entfernen wir die Property
    if (showRoomViews === false) {
      delete newConfig.show_room_views;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
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

    // Hole aktuelle groups_options für dieses Areal
    const currentAreaOptions = this._config.areas_options?.[areaId] || {};
    const currentGroupsOptions = currentAreaOptions.groups_options || {};
    const currentGroupOptions = currentGroupsOptions[group] || {};
    
    let hiddenEntities = [...(currentGroupOptions.hidden || [])];
    
    if (entityId === null) {
      // Alle Entities in der Gruppe
      // Wenn isVisible = false, alle Entities zur Hidden-Liste hinzufügen
      // Wenn isVisible = true, alle Entities aus Hidden-Liste entfernen
      
      if (!isVisible) {
        // Hole alle Entities in dieser Gruppe und füge sie zu hidden hinzu
        // Dies erfordert Zugriff auf die Entity-Liste, die wir aus dem DOM lesen können
        const entityList = this.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${group}"]`);
        if (entityList) {
          const entityCheckboxes = entityList.querySelectorAll('.entity-checkbox');
          const allEntities = Array.from(entityCheckboxes).map(cb => cb.dataset.entityId);
          hiddenEntities = [...new Set([...hiddenEntities, ...allEntities])];
        }
      } else {
        // Entferne alle Entities dieser Gruppe aus hidden
        const entityList = this.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${group}"]`);
        if (entityList) {
          const entityCheckboxes = entityList.querySelectorAll('.entity-checkbox');
          const allEntities = Array.from(entityCheckboxes).map(cb => cb.dataset.entityId);
          hiddenEntities = hiddenEntities.filter(e => !allEntities.includes(e));
        }
      }
    } else {
      // Einzelne Entity
      if (isVisible) {
        // Entferne aus hidden
        hiddenEntities = hiddenEntities.filter(e => e !== entityId);
      } else {
        // Füge zu hidden hinzu
        if (!hiddenEntities.includes(entityId)) {
          hiddenEntities.push(entityId);
        }
      }
    }

    // Baue neue Config
    const newGroupOptions = {
      ...currentGroupOptions,
      hidden: hiddenEntities
    };

    // Entferne hidden wenn leer
    if (newGroupOptions.hidden.length === 0) {
      delete newGroupOptions.hidden;
    }

    const newGroupsOptions = {
      ...currentGroupsOptions,
      [group]: newGroupOptions
    };

    // Entferne group wenn leer
    if (Object.keys(newGroupsOptions[group]).length === 0) {
      delete newGroupsOptions[group];
    }

    const newAreaOptions = {
      ...currentAreaOptions,
      groups_options: newGroupsOptions
    };

    // Entferne groups_options wenn leer
    if (Object.keys(newAreaOptions.groups_options).length === 0) {
      delete newAreaOptions.groups_options;
    }

    const newAreasOptions = {
      ...this._config.areas_options,
      [areaId]: newAreaOptions
    };

    // Entferne area wenn leer
    if (Object.keys(newAreasOptions[areaId]).length === 0) {
      delete newAreasOptions[areaId];
    }

    const newConfig = {
      ...this._config,
      areas_options: newAreasOptions
    };

    // Entferne areas_options wenn leer
    if (Object.keys(newConfig.areas_options).length === 0) {
      delete newConfig.areas_options;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  // Für Bereiche nach Etage anzeigen
  _groupByFloorsChanged(groupByFloors) {
    if (!this._config || !this._hass) {
      return;
    }

    const newConfig = {
      ...this._config,
      group_by_floors: groupByFloors
    };

    // Wenn der Standardwert (false) gesetzt ist, entfernen wir die Property
    if (groupByFloors === false) {
      delete newConfig.group_by_floors;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _showCoversSummaryChanged(showCoversSummary) {
    if (!this._config || !this._hass) {
      return;
    }

    const newConfig = {
      ...this._config,
      show_covers_summary: showCoversSummary
    };

    // Wenn der Standardwert (true) gesetzt ist, entfernen wir die Property
    if (showCoversSummary === true) {
      delete newConfig.show_covers_summary;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _showBetterThermostatChanged(showBetterThermostat) {
    if (!this._config || !this._hass) {
      return;
    }

    const newConfig = {
      ...this._config,
      show_better_thermostat: showBetterThermostat
    };

    // Wenn der Standardwert (false) gesetzt ist, entfernen wir die Property
    if (showBetterThermostat === false) {
      delete newConfig.show_better_thermostat;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
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