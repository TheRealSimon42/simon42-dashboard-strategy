// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR
// ====================================================================
import { getEditorStyles } from './editor/simon42-editor-styles.js';
import { 
  renderEditorHTML, 
  renderEntityList,
  renderFavoritesList,
  renderRoomPinsList,
  renderSearchCardDomainsList,
  renderEntityNamePatternsList,
  renderEntityNameTranslationsList,
  renderPublicTransportList
} from './editor/simon42-editor-template.js';
import { initLanguage, t } from '../utils/i18n/simon42-i18n.js';
import { ConfigManager } from './editor/simon42-config-manager.js';
import { logWarn, initLogger } from '../utils/system/simon42-logger.js';
import { checkDependency, checkPublicTransportDependencies } from '../utils/system/simon42-dependency-checker.js';
import { PUBLIC_TRANSPORT_MAPPING } from '../utils/builders/cards/simon42-public-transport-builders.js';
import { VERSION } from '../utils/system/simon42-version.js';
import { 
  getAllIntegrationProperties,
  updateNestedConfig,
  getEntitiesFromDOM
} from './editor/simon42-editor-config-helpers.js';
import { 
  attachWeatherCheckboxListener,
  attachEnergyCheckboxListener,
  attachPersonBadgesCheckboxListener,
  attachPersonProfilePictureCheckboxListener,
  attachSearchCardCheckboxListener,
  attachClockCardCheckboxListener,
  attachRoomViewsCheckboxListener,
  attachGroupByFloorsCheckboxListener, // NEU
  attachSummariesCheckboxListener,
  attachCoversSummaryCheckboxListener,
  attachSecuritySummaryCheckboxListener,
  attachLightSummaryCheckboxListener,
  attachBatterySummaryCheckboxListener,
  attachBetterThermostatCheckboxListener,
  attachHorizonCardCheckboxListener,
  attachHorizonCardExtendedCheckboxListener,
  attachClockWeatherCardCheckboxListener,
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
    // State für Editor-Section-Groups (visibility controlled by navigation)
    this._activeNavItem = 'dashboard-cards'; // Default active nav item
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
    const showPersonProfilePicture = this._config.show_person_profile_picture === true;
    const showSearchCard = this._config.show_search_card === true;
    const showClockCard = this._config.show_clock_card === true;
    const showRoomViews = this._config.show_room_views === true; // Standard: false
    const groupByFloors = this._config.group_by_floors === true; // NEU
    const showSummaries = this._config.show_summaries !== false; // Master toggle, default: true
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
    const searchCardIncludedDomains = this._config.search_card_included_domains || [];
    const searchCardExcludedDomains = this._config.search_card_excluded_domains || [];
    // Check dependencies using centralized dependency checker
    const hasSearchCardDeps = checkDependency('search-card', this._hass);
    const hasBetterThermostatDeps = checkDependency('better-thermostat', this._hass);
    const hasHorizonCardDeps = checkDependency('horizon-card', this._hass);
    const hasClockWeatherCardDeps = checkDependency('clock-weather-card', this._hass);
    const useClockWeatherCard = this._config.use_clock_weather_card === true;
    const hasSchedulerCardDeps = checkDependency('scheduler-card', this._hass);
    const hasAlarmoCardDeps = checkDependency('alarmo-card', this._hass);
    // calendar-card is native Home Assistant card, no dependency check needed
    const hasCalendarCardDeps = true; // Always available (native card)
    const hasCalendarCardProDeps = checkDependency('calendar-card-pro', this._hass);
    
    // Sammle alle Alarm-Control-Panel-Entitäten
    const alarmEntities = Object.keys(this._hass.states)
      .filter(entityId => entityId.startsWith('alarm_control_panel.'))
      .map(entityId => {
        const state = this._hass.states[entityId];
        const entityRegistry = this._hass.entities?.[entityId];
        return {
          entity_id: entityId,
          name: state.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' '),
          isAlarmo: entityRegistry?.platform === 'alarmo'
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Check if selected alarm entity is from Alarmo
    const selectedAlarmEntity = this._config.alarm_entity || '';
    const isSelectedAlarmEntityAlarmo = selectedAlarmEntity && 
      this._hass.entities?.[selectedAlarmEntity]?.platform === 'alarmo';
    const useAlarmoCard = this._config.use_alarmo_card === true;
    
    // Scheduler and Calendar card configs
    const showSchedulerCard = this._config.show_scheduler_card === true;
    const schedulerEntity = this._config.scheduler_entity || '';
    const showCalendarCard = this._config.show_calendar_card === true;
    const calendarEntities = this._config.calendar_entities || [];
    const useCalendarCardPro = this._config.use_calendar_card_pro === true;
    
    // Alle Entitäten für Favoriten-Select
    const allEntities = this._getAllEntitiesForSelect();
    
    // FEHLENDE VARIABLEN - HIER WAR DAS PROBLEM
    const allAreas = this._getSortedAreas();
    const hiddenAreas = this._config.areas_display?.hidden || [];
    const areaOrder = this._config.areas_display?.order || [];
    
    // Extract properties that need explicit values
    const entityNamePatterns = this._config.entity_name_patterns || [];
    const entityNameTranslations = this._config.entity_name_translations || [];
    const logLevel = this._config.log_level || 'warn';
    const version = VERSION;
    const hass = this._hass;

    // Prepare editor config object (using consistent shorthand syntax)
    const editorConfig = { 
      allAreas, 
      hiddenAreas, 
      areaOrder, 
      showWeather,
      showEnergy,
      showPersonBadges,
      showPersonProfilePicture,
      showRoomViews,
      showSearchCard,
      showClockCard,
      hasSearchCardDeps,
      searchCardIncludedDomains,
      searchCardExcludedDomains,
      summariesColumns,
      alarmEntity,
      alarmEntities,
      isSelectedAlarmEntityAlarmo,
      hasAlarmoCardDeps,
      useAlarmoCard,
      showSchedulerCard,
      hasSchedulerCardDeps,
      schedulerEntity,
      showCalendarCard,
      hasCalendarCardDeps,
      hasCalendarCardProDeps,
      useCalendarCardPro,
      calendarEntities,
      favoriteEntities,
      roomPinEntities,
      allEntities,
      groupByFloors, // NEU
      showSummaries,
      showCoversSummary,
      showSecuritySummary,
      showLightSummary,
      showBatterySummary,
      showBetterThermostat,
      hasBetterThermostatDeps,
      showHorizonCard,
      hasHorizonCardDeps,
      horizonCardExtended,
      useClockWeatherCard,
      hasClockWeatherCardDeps,
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
      entityNamePatterns,
      entityNameTranslations,
      logLevel,
      version,
      hass
    };

    // Setze HTML-Inhalt mit Styles und Template
    this.innerHTML = `
      <style>${getEditorStyles()}</style>
      ${renderEditorHTML(editorConfig)}
    `;

    // Binde Event-Listener
    attachWeatherCheckboxListener(this, (showWeather) => this._showWeatherChanged(showWeather));
    attachEnergyCheckboxListener(this, (showEnergy) => this._showEnergyChanged(showEnergy));
    attachPersonBadgesCheckboxListener(this, (showPersonBadges) => this._showPersonBadgesChanged(showPersonBadges));
    attachPersonProfilePictureCheckboxListener(this, (showPersonProfilePicture) => this._showPersonProfilePictureChanged(showPersonProfilePicture));
    attachSearchCardCheckboxListener(this, (showSearchCard) => this._showSearchCardChanged(showSearchCard));
    this._attachSearchCardDomainListeners();
    attachClockCardCheckboxListener(this, (showClockCard) => this._showClockCardChanged(showClockCard));
    attachRoomViewsCheckboxListener(this, (showRoomViews) => this._showRoomViewsChanged(showRoomViews));
    attachGroupByFloorsCheckboxListener(this, (groupByFloors) => this._groupByFloorsChanged(groupByFloors)); // NEU
    attachSummariesCheckboxListener(this, (showSummaries) => this._showSummariesChanged(showSummaries));
    attachCoversSummaryCheckboxListener(this, (showCoversSummary) => this._showCoversSummaryChanged(showCoversSummary));
    attachSecuritySummaryCheckboxListener(this, (showSecuritySummary) => this._showSecuritySummaryChanged(showSecuritySummary));
    attachLightSummaryCheckboxListener(this, (showLightSummary) => this._showLightSummaryChanged(showLightSummary));
    attachBatterySummaryCheckboxListener(this, (showBatterySummary) => this._showBatterySummaryChanged(showBatterySummary));
    attachBetterThermostatCheckboxListener(this, (showBetterThermostat) => this._showBetterThermostatChanged(showBetterThermostat));
    attachHorizonCardCheckboxListener(this, (showHorizonCard) => this._showHorizonCardChanged(showHorizonCard));
    attachHorizonCardExtendedCheckboxListener(this, (horizonCardExtended) => this._horizonCardExtendedChanged(horizonCardExtended));
    attachClockWeatherCardCheckboxListener(this, (useClockWeatherCard) => this._useClockWeatherCardChanged(useClockWeatherCard));
    attachPublicTransportCheckboxListener(this, (showPublicTransport) => this._showPublicTransportChanged(showPublicTransport));
    this._attachPublicTransportIntegrationListeners();
    this._attachHvvCardListeners();
    this._attachHaDeparturesCardListeners();
    this._attachSummariesColumnsListener();
    this._attachAlarmEntityListener();
    this._attachAlarmoCardListener();
    this._attachSchedulerCardListeners();
    this._attachCalendarCardListeners();
    this._attachCalendarCardProListener();
    this._attachFavoritesListeners();
    this._attachRoomPinsListeners();
    this._attachPublicTransportListeners();
    this._attachEntityNamePatternsListeners();
    this._attachEntityNameTranslationsListeners();
    this._attachLogLevelListener();
    this._attachCacheReloadListener();
    attachAreaCheckboxListeners(this, (areaId, isVisible) => this._areaVisibilityChanged(areaId, isVisible));
    
    // Sortiere die Area-Items nach displayOrder
    sortAreaItems(this);
    
    // Drag & Drop Event Listener
    attachDragAndDropListeners(
      this,
      () => this._updateAreaOrder()
    );
    
    // Initialize MDC switches
    this._initializeMDCSwitches();
    
    // Expand Button Listener
    attachExpandButtonListeners(
      this,
      this._hass,
      this._config,
      (areaId, group, entityId, isVisible) => this._entityVisibilityChanged(areaId, group, entityId, isVisible)
    );
    
    // Restore expanded state
    this._restoreExpandedState();
    
    // Attach navigation bar listeners
    this._attachNavigationBarListeners();
    
    // Restore section group visibility state
    this._restoreSectionGroupState();
    
    // Hide dashboard title/header
    this._hideDashboardTitle();
    
    // Remove borders from section groups
    this._removeSectionGroupBorders();
    
    // Remove spacing above navigation bar
    this._removeSpacingAboveNavigation();
  }
  
  _initializeMDCSwitches() {
    // Property bindings don't work with innerHTML, so we need to manually set
    // the checked and disabled properties on all ha-switch elements
    
    // Get all config values
    const showWeather = this._config.show_weather !== false;
    const showEnergy = this._config.show_energy !== false;
    const showPersonBadges = this._config.show_person_badges !== false;
    const showPersonProfilePicture = this._config.show_person_profile_picture === true;
    const showSearchCard = this._config.show_search_card === true;
    const showClockCard = this._config.show_clock_card === true;
    const showRoomViews = this._config.show_room_views === true;
    const groupByFloors = this._config.group_by_floors === true;
    const showSummaries = this._config.show_summaries !== false; // Master toggle, default: true
    const showCoversSummary = this._config.show_covers_summary !== false;
    const showSecuritySummary = this._config.show_security_summary !== false;
    const showLightSummary = this._config.show_light_summary !== false;
    const showBatterySummary = this._config.show_battery_summary !== false;
    const showBetterThermostat = this._config.show_better_thermostat === true;
    const showHorizonCard = this._config.show_horizon_card === true;
    const horizonCardExtended = this._config.horizon_card_extended === true;
    const useClockWeatherCard = this._config.use_clock_weather_card === true;
    const showPublicTransport = this._config.show_public_transport === true;
    
    // Check dependencies
    const hasSearchCardDeps = checkDependency('search-card', this._hass);
    const hasBetterThermostatDeps = checkDependency('better-thermostat', this._hass);
    const hasHorizonCardDeps = checkDependency('horizon-card', this._hass);
    const hasClockWeatherCardDeps = checkDependency('clock-weather-card', this._hass);
    
    // Public transport config
    const hvvShowTime = this._config.hvv_show_time === true;
    const hvvShowTitle = this._config.hvv_show_title === true;
    const haDeparturesShowCardHeader = this._config.ha_departures_show_card_header !== false;
    const haDeparturesShowAnimation = this._config.ha_departures_show_animation !== false;
    const haDeparturesShowTransportIcon = this._config.ha_departures_show_transport_icon === true;
    const haDeparturesHideEmptyDepartures = this._config.ha_departures_hide_empty_departures === true;
    
    // Initialize switches with their correct states
    const switchConfigs = [
      { id: 'show-weather', checked: showWeather, disabled: false },
      { id: 'show-energy', checked: showEnergy, disabled: false },
      { id: 'show-person-badges', checked: showPersonBadges, disabled: false },
      { id: 'show-person-profile-picture', checked: showPersonProfilePicture, disabled: false },
      { id: 'show-search-card', checked: showSearchCard, disabled: !hasSearchCardDeps },
      { id: 'show-clock-card', checked: showClockCard, disabled: false },
      { id: 'show-room-views', checked: showRoomViews, disabled: false },
      { id: 'group-by-floors', checked: groupByFloors, disabled: false },
      { id: 'show-summaries', checked: showSummaries, disabled: false },
      { id: 'show-covers-summary', checked: showCoversSummary, disabled: false },
      { id: 'show-security-summary', checked: showSecuritySummary, disabled: false },
      { id: 'show-light-summary', checked: showLightSummary, disabled: false },
      { id: 'show-battery-summary', checked: showBatterySummary, disabled: false },
      { id: 'show-better-thermostat', checked: showBetterThermostat, disabled: !hasBetterThermostatDeps },
      { id: 'show-horizon-card', checked: showHorizonCard, disabled: !hasHorizonCardDeps },
      { id: 'horizon-card-extended', checked: horizonCardExtended, disabled: !hasHorizonCardDeps },
      { id: 'use-clock-weather-card', checked: useClockWeatherCard, disabled: !hasClockWeatherCardDeps },
      { id: 'show-public-transport', checked: showPublicTransport, disabled: false },
      { id: 'hvv-show-time', checked: hvvShowTime, disabled: false },
      { id: 'hvv-show-title', checked: hvvShowTitle, disabled: false },
      { id: 'ha-departures-show-card-header', checked: haDeparturesShowCardHeader, disabled: false },
      { id: 'ha-departures-show-animation', checked: haDeparturesShowAnimation, disabled: false },
      { id: 'ha-departures-show-transport-icon', checked: haDeparturesShowTransportIcon, disabled: false },
      { id: 'ha-departures-hide-empty-departures', checked: haDeparturesHideEmptyDepartures, disabled: false }
    ];
    
    // Set properties on all switches
    switchConfigs.forEach(({ id, checked, disabled }) => {
      const switchElement = this.querySelector(`#${id}`);
      if (switchElement && switchElement.tagName === 'HA-SWITCH') {
        switchElement.checked = checked;
        switchElement.disabled = disabled;
      }
    });
    
    // Also initialize switches in dynamically loaded entity groups
    // These are handled separately in attachGroupCheckboxListeners and attachEntityCheckboxListeners
  }
  
  _removeSpacingAboveNavigation() {
    // Remove padding/margin from parent elements
    let parent = this.parentElement;
    while (parent && parent !== document.body) {
      // Check if it's a card editor or similar container
      if (parent.matches && (
        parent.matches('ha-card-editor') ||
        parent.matches('ha-card') ||
        parent.matches('[class*="card"]') ||
        parent.matches('[class*="editor"]')
      )) {
        const computedStyle = window.getComputedStyle(parent);
        if (parseFloat(computedStyle.paddingTop) > 0) {
          parent.style.paddingTop = '0';
        }
        if (parseFloat(computedStyle.marginTop) > 0) {
          parent.style.marginTop = '0';
        }
      }
      parent = parent.parentElement;
    }
    
    // Also ensure the card-config has no top padding/margin
    const cardConfig = this.querySelector('.card-config');
    if (cardConfig) {
      cardConfig.style.paddingTop = '0';
      cardConfig.style.marginTop = '0';
    }
    
    // Ensure navigation bar has no top margin
    const navBar = this.querySelector('.editor-navigation-bar');
    if (navBar) {
      navBar.style.marginTop = '0';
    }
  }
  
  _hideDashboardTitle() {
    // Try to find and hide the dashboard title/header
    // Look for common Home Assistant header elements
    const possibleSelectors = [
      '.view-header',
      'ha-card .card-header',
      '.card-header',
      'h1',
      '[class*="header"]',
      '[class*="title"]'
    ];
    
    // Check parent elements
    let parent = this.parentElement;
    while (parent && parent !== document.body) {
      for (const selector of possibleSelectors) {
        const elements = parent.querySelectorAll(selector);
        elements.forEach(el => {
          // Only hide if it's above our editor (not inside it)
          if (!this.contains(el) && el.offsetTop < this.offsetTop) {
            el.style.display = 'none';
          }
        });
      }
      parent = parent.parentElement;
    }
    
    // Also check siblings
    if (this.parentElement) {
      const siblings = Array.from(this.parentElement.children);
      const ourIndex = siblings.indexOf(this);
      siblings.slice(0, ourIndex).forEach(sibling => {
        if (sibling.matches && (
          sibling.matches('.view-header') ||
          sibling.matches('ha-card') ||
          sibling.querySelector('.view-header') ||
          sibling.querySelector('.card-header')
        )) {
          sibling.style.display = 'none';
        }
      });
    }
  }
  
  _removeSectionGroupBorders() {
    // Remove any remaining borders from section groups
    const sectionGroups = this.querySelectorAll('.section-group');
    sectionGroups.forEach(group => {
      group.style.border = 'none';
      group.style.borderRadius = '0';
      group.style.boxShadow = 'none';
    });
  }

  _attachNavigationBarListeners() {
    const navItems = this.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const groupId = e.currentTarget.dataset.group;
        this._navigateToGroup(groupId);
      });
    });
  }

  _navigateToGroup(groupId) {
    const groupElement = this.querySelector(`#${groupId}`);
    if (!groupElement) return;

    // Hide all section groups first
    const allGroups = ['dashboard-cards', 'views-summaries', 'entity-management', 'advanced'];
    allGroups.forEach(id => {
      const group = this.querySelector(`#${id}`);
      if (group) {
        group.style.display = 'none';
      }
    });

    // Show the selected group
    groupElement.style.display = 'block';

    // Scroll to top of editor (since we're showing only one section)
    this.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Update active nav item
    this._setActiveNavItem(groupId);
  }

  _setActiveNavItem(groupId) {
    this._activeNavItem = groupId;
    const navItems = this.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      if (item.dataset.group === groupId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  _restoreSectionGroupState() {
    // Hide all groups first
    const allGroups = ['dashboard-cards', 'views-summaries', 'entity-management', 'advanced'];
    allGroups.forEach(id => {
      const group = this.querySelector(`#${id}`);
      if (group) {
        group.style.display = 'none';
      }
    });

    // Show only the active group
    const activeGroup = this.querySelector(`#${this._activeNavItem}`);
    if (activeGroup) {
      activeGroup.style.display = 'block';
    }
    
    // Set active nav item
    this._setActiveNavItem(this._activeNavItem);
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
    // Re-render to show/hide Alarmo card option
    this._render();
  }

  _attachAlarmoCardListener() {
    const alarmoCardSwitch = this.querySelector('#use-alarmo-card');
    if (alarmoCardSwitch) {
      // Ensure toggle state matches config value
      const useAlarmoCard = this._config.use_alarmo_card === true;
      alarmoCardSwitch.checked = useAlarmoCard;
      
      alarmoCardSwitch.addEventListener('change', (e) => {
        this._useAlarmoCardChanged(e.target.checked);
      });
    }
  }

  _useAlarmoCardChanged(useAlarmoCard) {
    // Ensure value is explicitly a boolean
    const value = useAlarmoCard === true;
    this._configManager.updateProperty('use_alarmo_card', value, false);
  }

  _attachSchedulerCardListeners() {
    const schedulerCardSwitch = this.querySelector('#show-scheduler-card');
    if (schedulerCardSwitch) {
      // Ensure toggle state matches config value
      const showSchedulerCard = this._config.show_scheduler_card === true;
      schedulerCardSwitch.checked = showSchedulerCard;
      
      schedulerCardSwitch.addEventListener('change', (e) => {
        this._showSchedulerCardChanged(e.target.checked);
      });
    }

    const schedulerEntitySelect = this.querySelector('#scheduler-entity');
    if (schedulerEntitySelect) {
      schedulerEntitySelect.addEventListener('change', (e) => {
        this._schedulerEntityChanged(e.target.value);
      });
    }
  }

  _showSchedulerCardChanged(showSchedulerCard) {
    // Ensure value is explicitly a boolean
    const value = showSchedulerCard === true;
    this._configManager.updateProperty('show_scheduler_card', value, false);
    this._render();
  }

  _schedulerEntityChanged(entityId) {
    this._configManager.updatePropertyCustom('scheduler_entity', entityId, (val) => !val || val === '');
  }

  _attachCalendarCardListeners() {
    const calendarCardSwitch = this.querySelector('#show-calendar-card');
    if (calendarCardSwitch) {
      // Ensure toggle state matches config value
      const showCalendarCard = this._config.show_calendar_card === true;
      calendarCardSwitch.checked = showCalendarCard;
      
      calendarCardSwitch.addEventListener('change', (e) => {
        this._showCalendarCardChanged(e.target.checked);
      });
    }

    const addCalendarBtn = this.querySelector('#add-calendar-btn');
    const calendarEntitySelect = this.querySelector('#calendar-entity-select');
    if (addCalendarBtn && calendarEntitySelect) {
      addCalendarBtn.addEventListener('click', () => {
        const entityId = calendarEntitySelect.value;
        if (entityId) {
          const calendarEntities = this._config.calendar_entities || [];
          if (!calendarEntities.includes(entityId)) {
            const newEntities = [...calendarEntities, entityId];
            this._configManager.updateProperty('calendar_entities', newEntities, []);
            calendarEntitySelect.value = '';
            // Update the list after adding
            this._updateCalendarList();
          }
        }
      });
    }

    // Use event delegation on the container for remove buttons
    const calendarList = this.querySelector('#calendar-list');
    if (calendarList) {
      calendarList.addEventListener('click', (e) => {
        if (e.target.classList.contains('entity-list-remove-btn')) {
          const entityId = e.target.getAttribute('data-entity-id');
          if (entityId) {
            const calendarEntities = this._config.calendar_entities || [];
            const newEntities = calendarEntities.filter(id => id !== entityId);
            this._configManager.updateProperty('calendar_entities', newEntities.length > 0 ? newEntities : undefined, []);
            // Update the list after removing
            this._updateCalendarList();
          }
        }
      });
    }
  }

  _showCalendarCardChanged(showCalendarCard) {
    // Ensure value is explicitly a boolean
    const value = showCalendarCard === true;
    this._configManager.updateProperty('show_calendar_card', value, false);
    this._render();
  }

  _updateCalendarList() {
    const container = this.querySelector('#calendar-list');
    if (!container) return;

    const calendarEntities = this._config.calendar_entities || [];
    const allEntities = this._getAllEntitiesForSelect();

    // Use centralized renderEntityList function
    container.innerHTML = renderEntityList(calendarEntities, allEntities, {
      itemClass: 'calendar-item',
      hass: this._hass
    });

    // Reattach listeners
    this._attachCalendarCardListeners();
  }

  _attachCalendarCardProListener() {
    const calendarCardProSwitch = this.querySelector('#use-calendar-card-pro');
    if (calendarCardProSwitch) {
      // Ensure toggle state matches config value
      const useCalendarCardPro = this._config.use_calendar_card_pro === true;
      calendarCardProSwitch.checked = useCalendarCardPro;
      
      calendarCardProSwitch.addEventListener('change', (e) => {
        this._useCalendarCardProChanged(e.target.checked);
      });
    }
  }

  _useCalendarCardProChanged(useCalendarCardPro) {
    // Ensure value is explicitly a boolean
    const value = useCalendarCardPro === true;
    this._configManager.updateProperty('use_calendar_card_pro', value, false);
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

    // Remove Buttons - use event delegation
    const favoritesList = this.querySelector('#favorites-list');
    if (favoritesList) {
      favoritesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('entity-list-remove-btn')) {
          const entityId = e.target.dataset.entityId;
          this._removeFavoriteEntity(entityId);
        }
      });
    }
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
    
    // Use directly imported function
    container.innerHTML = renderFavoritesList(favoriteEntities, allEntities);
    
    // Reattach listeners
    this._attachFavoritesListeners();
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

    // Remove Buttons - use event delegation
    const roomPinsList = this.querySelector('#room-pins-list');
    if (roomPinsList) {
      roomPinsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('entity-list-remove-btn')) {
          const entityId = e.target.dataset.entityId;
          this._removeRoomPinEntity(entityId);
        }
      });
    }
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
    const allAreas = this._getSortedAreas();
    
    // Use directly imported function
    container.innerHTML = renderRoomPinsList(roomPinEntities, allEntities, allAreas);
    
    // Reattach listeners
    this._attachRoomPinsListeners();
  }

  _getSortedAreas() {
    if (!this._hass || !this._hass.areas) return [];
    return Object.values(this._hass.areas).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
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
        content.classList.add('expanded');
        button.classList.add('expanded');
        
        // Restore expanded groups for this area
        const expandedGroups = this._expandedGroups.get(areaId);
        if (expandedGroups) {
          expandedGroups.forEach(groupKey => {
            const groupButton = content.querySelector(`.expand-button-small[data-area-id="${areaId}"][data-group="${groupKey}"]`);
            const entityList = content.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${groupKey}"]`);
            
            if (groupButton && entityList) {
              entityList.classList.add('expanded');
              groupButton.classList.add('expanded');
            }
          });
        }
      }
    });
  }

  _updateAreaOrder() {
    // Get items from ha-md-list (Home Assistant's official structure)
    const areaList = this.querySelector('ha-md-list');
    if (!areaList) return;
    
    const items = Array.from(areaList.querySelectorAll('ha-md-list-item[data-area-id]'));
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
    // Re-render to show/hide sub-options
    this._render();
  }

  _showEnergyChanged(showEnergy) {
    this._configManager.updateProperty('show_energy', showEnergy, true);
  }

  _showPersonBadgesChanged(showPersonBadges) {
    this._configManager.updateProperty('show_person_badges', showPersonBadges, true);
    // Re-render to show/hide profile picture option
    this._render();
  }

  _showPersonProfilePictureChanged(showPersonProfilePicture) {
    this._configManager.updateProperty('show_person_profile_picture', showPersonProfilePicture, false);
  }

  _showSearchCardChanged(showSearchCard) {
    this._configManager.updateProperty('show_search_card', showSearchCard, false);
    // Re-render to show/hide search card sub-options
    this._render();
  }

  _attachSearchCardDomainListeners() {
    // Add included domain button
    const addIncludedBtn = this.querySelector('#add-included-domain-btn');
    if (addIncludedBtn) {
      addIncludedBtn.addEventListener('click', () => {
        const select = this.querySelector('#search-card-included-domain-select');
        if (select && select.value) {
          this._addSearchCardIncludedDomain(select.value);
          select.value = ''; // Reset selector
        }
      });
    }

    // Add excluded domain button
    const addExcludedBtn = this.querySelector('#add-excluded-domain-btn');
    if (addExcludedBtn) {
      addExcludedBtn.addEventListener('click', () => {
        const select = this.querySelector('#search-card-excluded-domain-select');
        if (select && select.value) {
          this._addSearchCardExcludedDomain(select.value);
          select.value = ''; // Reset selector
        }
      });
    }

    // Remove included domain buttons
    const includedList = this.querySelector('#search-card-included-domains-list');
    if (includedList) {
      const removeIncludedBtns = includedList.querySelectorAll('.remove-domain-btn[data-domain]');
      removeIncludedBtns.forEach(btn => {
        const domain = btn.dataset.domain;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._removeSearchCardIncludedDomain(domain);
        });
      });
    }

    // Remove excluded domain buttons
    const excludedList = this.querySelector('#search-card-excluded-domains-list');
    if (excludedList) {
      const removeExcludedBtns = excludedList.querySelectorAll('.remove-domain-btn[data-domain]');
      removeExcludedBtns.forEach(btn => {
        const domain = btn.dataset.domain;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._removeSearchCardExcludedDomain(domain);
        });
      });
    }
  }

  _addSearchCardIncludedDomain(domain) {
    if (!this._config || !domain) {
      return;
    }

    const currentDomains = this._config.search_card_included_domains || [];
    
    // Prüfe ob bereits vorhanden
    if (currentDomains.includes(domain)) {
      return;
    }

    const newDomains = [...currentDomains, domain];

    const newConfig = {
      ...this._config,
      search_card_included_domains: newDomains
    };

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Domain-Liste
    this._updateSearchCardIncludedDomainsList();
  }

  _removeSearchCardIncludedDomain(domain) {
    if (!this._config || !domain) {
      return;
    }

    const currentDomains = this._config.search_card_included_domains || [];
    const newDomains = currentDomains.filter(d => d !== domain);

    const newConfig = {
      ...this._config,
      search_card_included_domains: newDomains.length > 0 ? newDomains : undefined
    };

    // Entferne Property wenn leer
    if (newDomains.length === 0) {
      delete newConfig.search_card_included_domains;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Domain-Liste
    this._updateSearchCardIncludedDomainsList();
  }

  _addSearchCardExcludedDomain(domain) {
    if (!this._config || !domain) {
      return;
    }

    const currentDomains = this._config.search_card_excluded_domains || [];
    
    // Prüfe ob bereits vorhanden
    if (currentDomains.includes(domain)) {
      return;
    }

    const newDomains = [...currentDomains, domain];

    const newConfig = {
      ...this._config,
      search_card_excluded_domains: newDomains
    };

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Domain-Liste
    this._updateSearchCardExcludedDomainsList();
  }

  _removeSearchCardExcludedDomain(domain) {
    if (!this._config || !domain) {
      return;
    }

    const currentDomains = this._config.search_card_excluded_domains || [];
    const newDomains = currentDomains.filter(d => d !== domain);

    const newConfig = {
      ...this._config,
      search_card_excluded_domains: newDomains.length > 0 ? newDomains : undefined
    };

    // Entferne Property wenn leer
    if (newDomains.length === 0) {
      delete newConfig.search_card_excluded_domains;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Domain-Liste
    this._updateSearchCardExcludedDomainsList();
  }

  _updateSearchCardIncludedDomainsList() {
    const container = this.querySelector('#search-card-included-domains-list');
    if (!container) return;

    const domains = this._config.search_card_included_domains || [];
    
    // Use directly imported function
    container.innerHTML = renderSearchCardDomainsList(domains);
    
    // Reattach listeners
    this._attachSearchCardDomainListeners();
  }

  _updateSearchCardExcludedDomainsList() {
    const container = this.querySelector('#search-card-excluded-domains-list');
    if (!container) return;

    const domains = this._config.search_card_excluded_domains || [];
    
    // Use directly imported function
    container.innerHTML = renderSearchCardDomainsList(domains);
    
    // Reattach listeners
    this._attachSearchCardDomainListeners();
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

  _showSummariesChanged(showSummaries) {
    this._configManager.updateProperty('show_summaries', showSummaries, true);
    // Re-render to update disabled state of sub-options
    this._render();
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

  _useClockWeatherCardChanged(useClockWeatherCard) {
    this._configManager.updateProperty('use_clock_weather_card', useClockWeatherCard, false);
    this._render();
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

    // Remove Buttons - use event delegation
    const publicTransportList = this.querySelector('#public-transport-list');
    if (publicTransportList) {
      publicTransportList.addEventListener('click', (e) => {
        if (e.target.classList.contains('entity-list-remove-btn')) {
          const entityId = e.target.dataset.entityId;
          this._removePublicTransportEntity(entityId);
        }
      });
    }
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
    
    // Use directly imported function
    container.innerHTML = renderPublicTransportList(publicTransportEntities, allEntities);
    
    // Reattach listeners
    this._attachPublicTransportListeners();
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

  _attachCacheReloadListener() {
    const cacheReloadBtn = this.querySelector('#cache-reload-btn');
    if (cacheReloadBtn) {
      cacheReloadBtn.addEventListener('click', () => {
        this._reloadCache();
      });
    }
  }

  _reloadCache() {
    if (!this._hass || !this._config) {
      return;
    }

    // Clear internal editor caches
    this._expandedAreas.clear();
    this._expandedGroups.clear();
    
    // Force a full re-render of the editor
    // This will reload all entities and areas from the current hass object
    // Note: This reloads from hass, which is updated by Home Assistant automatically
    // If hass hasn't been updated by HA yet, the data will be the same
    this._render();
    
    // Show feedback to user
    const btn = this.querySelector('#cache-reload-btn');
    if (btn) {
      const originalText = btn.textContent;
      const originalBackground = btn.style.background;
      btn.textContent = '✓ ' + originalText;
      btn.style.background = 'var(--success-color, #4caf50)';
      btn.disabled = true;
      
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = originalBackground;
        btn.disabled = false;
      }, 2000);
    }
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
    
    // Use directly imported function
    container.innerHTML = renderEntityNamePatternsList(patterns);
    
    // Reattach listeners
    this._attachEntityNamePatternsListeners();
  }

  _attachEntityNameTranslationsListeners() {
    // Add Button
    const addBtn = this.querySelector('#add-translation-btn');
    const fromInput = this.querySelector('#entity-name-translation-from-input');
    const toInput = this.querySelector('#entity-name-translation-to-input');
    const fromLangSelect = this.querySelector('#entity-name-translation-from-lang-select');
    const toLangSelect = this.querySelector('#entity-name-translation-to-lang-select');
    
    if (addBtn && fromInput && toInput && fromLangSelect && toLangSelect) {
      // Add on Enter key press in either input
      const handleAdd = () => {
        const from = (fromInput.value || '').trim();
        const to = (toInput.value || '').trim();
        const fromLang = fromLangSelect.value || '';
        const toLang = toLangSelect.value || '';
        
        if (from && to && fromLang && toLang) {
          this._addEntityNameTranslation({ from, to, from_lang: fromLang, to_lang: toLang });
          fromInput.value = '';
          toInput.value = '';
          fromLangSelect.value = '';
          toLangSelect.value = '';
        }
      };
      
      fromInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAdd();
        }
      });
      
      toInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAdd();
        }
      });

      // Add on button click
      addBtn.addEventListener('click', handleAdd);
    }

    // Remove Buttons
    const removeButtons = this.querySelectorAll('.remove-translation-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.translationIndex, 10);
        this._removeEntityNameTranslation(index);
      });
    });

    // Language Selectors for existing translations
    const fromLangSelectors = this.querySelectorAll('.translation-from-lang-select');
    fromLangSelectors.forEach(select => {
      select.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.translationIndex, 10);
        const selectedLang = e.target.value;
        this._updateTranslationFromLang(index, selectedLang);
      });
    });

    const toLangSelectors = this.querySelectorAll('.translation-to-lang-select');
    toLangSelectors.forEach(select => {
      select.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.translationIndex, 10);
        const selectedLang = e.target.value;
        this._updateTranslationToLang(index, selectedLang);
      });
    });
  }

  _addEntityNameTranslation(translation) {
    if (!this._config || !this._hass) {
      return;
    }

    const currentTranslations = this._config.entity_name_translations || [];
    
    // Prüfe ob bereits vorhanden (gleiche from/to/from_lang/to_lang Kombination)
    const isDuplicate = currentTranslations.some(existing => {
      return existing.from === translation.from && 
             existing.to === translation.to &&
             (existing.from_lang || '') === (translation.from_lang || '') &&
             (existing.to_lang || '') === (translation.to_lang || '');
    });
    
    if (isDuplicate) {
      return;
    }

    const newTranslations = [...currentTranslations, translation];

    const newConfig = {
      ...this._config,
      entity_name_translations: newTranslations
    };

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Translations-Liste
    this._updateEntityNameTranslationsList();
  }

  _updateTranslationFromLang(index, fromLang) {
    if (!this._config || !this._hass) {
      return;
    }

    const currentTranslations = this._config.entity_name_translations || [];
    if (index < 0 || index >= currentTranslations.length) {
      return;
    }

    const translation = currentTranslations[index];
    const updatedTranslation = { ...translation };
    
    if (fromLang === '') {
      delete updatedTranslation.from_lang;
    } else {
      updatedTranslation.from_lang = fromLang;
    }

    const newTranslations = [...currentTranslations];
    newTranslations[index] = updatedTranslation;

    const newConfig = {
      ...this._config,
      entity_name_translations: newTranslations
    };

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Translations-Liste
    this._updateEntityNameTranslationsList();
  }

  _updateTranslationToLang(index, toLang) {
    if (!this._config || !this._hass) {
      return;
    }

    const currentTranslations = this._config.entity_name_translations || [];
    if (index < 0 || index >= currentTranslations.length) {
      return;
    }

    const translation = currentTranslations[index];
    const updatedTranslation = { ...translation };
    
    if (toLang === '') {
      delete updatedTranslation.to_lang;
    } else {
      updatedTranslation.to_lang = toLang;
    }

    const newTranslations = [...currentTranslations];
    newTranslations[index] = updatedTranslation;

    const newConfig = {
      ...this._config,
      entity_name_translations: newTranslations
    };

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Translations-Liste
    this._updateEntityNameTranslationsList();
  }

  _removeEntityNameTranslation(index) {
    if (!this._config || !this._hass) {
      return;
    }

    const currentTranslations = this._config.entity_name_translations || [];
    const newTranslations = currentTranslations.filter((_, i) => i !== index);

    const newConfig = {
      ...this._config,
      entity_name_translations: newTranslations.length > 0 ? newTranslations : undefined
    };

    // Entferne Property wenn leer
    if (newTranslations.length === 0) {
      delete newConfig.entity_name_translations;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    
    // Re-render nur die Translations-Liste
    this._updateEntityNameTranslationsList();
  }


  _updateEntityNameTranslationsList() {
    const container = this.querySelector('#entity-name-translations-list');
    if (!container) return;

    const translations = this._config.entity_name_translations || [];
    
    // Use directly imported function
    container.innerHTML = renderEntityNameTranslationsList(translations);
    
    // Reattach listeners
    this._attachEntityNameTranslationsListeners();
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

    // Show time switch (ha-switch)
    const showTimeSwitch = this.querySelector('#hvv-show-time');
    if (showTimeSwitch && showTimeSwitch.tagName === 'HA-SWITCH') {
      showTimeSwitch.addEventListener('change', (e) => {
        this._hvvShowTimeChanged(e.target.checked);
      });
    }

    // Show title switch (ha-switch)
    const showTitleSwitch = this.querySelector('#hvv-show-title');
    if (showTitleSwitch && showTitleSwitch.tagName === 'HA-SWITCH') {
      showTitleSwitch.addEventListener('change', (e) => {
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

    // Show card header switch (ha-switch)
    const showCardHeaderSwitch = this.querySelector('#ha-departures-show-card-header');
    if (showCardHeaderSwitch && showCardHeaderSwitch.tagName === 'HA-SWITCH') {
      showCardHeaderSwitch.addEventListener('change', (e) => {
        this._haDeparturesShowCardHeaderChanged(e.target.checked);
      });
    }

    // Show animation switch (ha-switch)
    const showAnimationSwitch = this.querySelector('#ha-departures-show-animation');
    if (showAnimationSwitch && showAnimationSwitch.tagName === 'HA-SWITCH') {
      showAnimationSwitch.addEventListener('change', (e) => {
        this._haDeparturesShowAnimationChanged(e.target.checked);
      });
    }

    // Show transport icon switch (ha-switch)
    const showTransportIconSwitch = this.querySelector('#ha-departures-show-transport-icon');
    if (showTransportIconSwitch && showTransportIconSwitch.tagName === 'HA-SWITCH') {
      showTransportIconSwitch.addEventListener('change', (e) => {
        this._haDeparturesShowTransportIconChanged(e.target.checked);
      });
    }

    // Hide empty departures switch (ha-switch)
    const hideEmptyDeparturesSwitch = this.querySelector('#ha-departures-hide-empty-departures');
    if (hideEmptyDeparturesSwitch && hideEmptyDeparturesSwitch.tagName === 'HA-SWITCH') {
      hideEmptyDeparturesSwitch.addEventListener('change', (e) => {
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