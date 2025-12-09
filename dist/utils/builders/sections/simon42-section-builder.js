// ====================================================================
// SECTION BUILDER - Creates dashboard sections
// ====================================================================

import { t, getLanguage } from '../../i18n/simon42-i18n.js';
import {
  filterValidEntities,
  filterHaDeparturesEntities,
  getCardType,
  validateCombination,
  CARD_BUILDERS
} from '../cards/simon42-public-transport-builders.js';
import { WEATHER_CARD_BUILDERS } from '../cards/simon42-weather-card-builders.js';
import { logWarn, logDebug, logInfo } from '../../system/simon42-logger.js';
import { translateAreaName } from '../../helpers/simon42-helpers.js';

/**
 * Creates the overview section with summaries
 * @param {Object} data - Section data including lightsOn, coversOpen, securityUnsafe, etc.
 * @returns {Object} Overview section definition
 */
export function createOverviewSection(data) {
  logDebug('[Section Builder] Creating overview section...');
  const { someSensorId, showSearchCard, showClockCard, config, hass } = data;
  
  // Get search card domain settings
  const includedDomains = config.search_card_included_domains || [];
  const excludedDomains = config.search_card_excluded_domains || [];
  
  const cards = [
    {
      type: "heading",
      heading: t('overview'),
      heading_style: "title",
      icon: "mdi:overscan"
    }
  ];

  if (showClockCard) {
    const alarmEntity = config.alarm_entity ? String(config.alarm_entity).trim() : null;

    if (alarmEntity && alarmEntity.length > 0) {
      if (!hass?.states?.[alarmEntity]) {
        logWarn('[Section Builder] Alarm entity not found:', alarmEntity);
      } else {
        const useAlarmoCard = config.use_alarmo_card === true;
        const isValidAlarmEntity = alarmEntity.startsWith('alarm_control_panel.');
        const isAlarmoCard = useAlarmoCard && isValidAlarmEntity && hass?.entities?.[alarmEntity]?.platform === 'alarmo';
        
        // If Alarmo card is used, clock takes full width (Alarmo card is large)
        if (isAlarmoCard) {
          cards.push({
            type: "clock",
            clock_size: "small",
            show_seconds: false,
            grid_options: {
              columns: "full",
            }
          });
          
          cards.push({
            type: "custom:alarmo-card",
            entity: alarmEntity,
            grid_options: {
              columns: "full",
            }
          });
        } else {
          // Clock and alarm panel side by side
          cards.push({
            type: "clock",
            clock_size: "small",
            show_seconds: false
          });
          
          cards.push({
            type: "tile",
            entity: alarmEntity,
            vertical: false
          });
        }
      }
    } else {
      // Clock only, full width
      cards.push({
        type: "clock",
        clock_size: "small",
        show_seconds: false,
        grid_options: {
          columns: "full",
        }
      });
    }
  } else {
    // No clock, but alarm entity present: show only alarm panel
    const alarmEntity = config.alarm_entity ? String(config.alarm_entity).trim() : null;
    if (alarmEntity && alarmEntity.length > 0) {
      // Validate entity exists
      if (!hass?.states?.[alarmEntity]) {
        logWarn('[Section Builder] Alarm entity not found:', alarmEntity);
      } else {
        // Check if Alarmo card should be used
        const useAlarmoCard = config.use_alarmo_card === true;
        // Validate entity is an alarm_control_panel entity and from Alarmo platform
        const isValidAlarmEntity = alarmEntity.startsWith('alarm_control_panel.');
        if (useAlarmoCard && isValidAlarmEntity && hass?.entities?.[alarmEntity]?.platform === 'alarmo') {
          cards.push({
            type: "custom:alarmo-card",
            entity: alarmEntity
          });
        } else {
          cards.push({
            type: "tile",
            entity: alarmEntity,
            vertical: false,
            grid_options: {
              columns: "full",
            }
          });
        }
      }
    }
  }

  if (showSearchCard) {
    const searchCardConfig = {
      type: "custom:search-card",
      search_text: t('searchCardPlaceholder'),
      grid_options: {
        columns: "full",
      }
    };
    
    // Add included_domains if configured
    if (includedDomains.length > 0) {
      searchCardConfig.included_domains = includedDomains;
    }
    
    // Add excluded_domains if configured
    if (excludedDomains.length > 0) {
      searchCardConfig.excluded_domains = excludedDomains;
    }
    
    cards.push(searchCardConfig);
  }

  // Prüfe Master-Toggle für Zusammenfassungen (Standard: true)
  const showSummaries = config.show_summaries !== false;
  
  // Prüfe ob summaries_columns konfiguriert ist (Standard: 2)
  const summariesColumns = config.summaries_columns || 2;
  const showCoversSummary = config.show_covers_summary !== false;
  const showSecuritySummary = config.show_security_summary !== false;
  const showLightSummary = config.show_light_summary !== false;
  const showBatterySummary = config.show_battery_summary !== false;

  // Erstelle die Summary-Cards basierend auf Konfiguration
  const summaryCards = [];

  // Nur Summary-Cards hinzufügen wenn Master-Toggle aktiviert ist
  if (!showSummaries) {
    // Wenn Master-Toggle aus ist, keine Summary-Cards hinzufügen
  } else {
    // Lights optional hinzufügen
    if (showLightSummary) {
    summaryCards.push({
      type: "custom:simon42-summary-card",
      summary_type: "lights",
      areas_options: config.areas_options || {},
      language: config.language
    });
  }

  // Covers optional hinzufügen
  if (showCoversSummary) {
    summaryCards.push({
      type: "custom:simon42-summary-card",
      summary_type: "covers",
      areas_options: config.areas_options || {},
      language: config.language
    });
  }

  // Security optional hinzufügen
  if (showSecuritySummary) {
    summaryCards.push({
      type: "custom:simon42-summary-card",
      summary_type: "security",
      areas_options: config.areas_options || {},
      language: config.language
    });
  }

    // Batteries optional hinzufügen
    if (showBatterySummary) {
      summaryCards.push({
        type: "custom:simon42-summary-card",
        summary_type: "batteries",
        areas_options: config.areas_options || {},
        language: config.language
      });
    }
  }

  if (summaryCards.length > 0) {
    cards.push({
      type: "heading",
      heading: t('summaries')
    });
  }

  // Layout-Logik: Dynamisch an Anzahl der Cards anpassen
  if (summariesColumns === 4) {
    // Bei 4 Spalten: Alle Cards in einer Reihe
    cards.push({
      type: "horizontal-stack",
      cards: summaryCards
    });
  } else {
    // Bei 2 Spalten: Aufteilen in mehrere Reihen à 2 Cards
    for (let i = 0; i < summaryCards.length; i += 2) {
      const rowCards = summaryCards.slice(i, i + 2);
      
      // If only one card remains (odd number), still use horizontal-stack
      cards.push({
        type: "horizontal-stack",
        cards: rowCards
      });
    }
  }

  // Favoriten Section
  const favoriteEntities = (config.favorite_entities || [])
    .filter(entityId => hass.states[entityId] !== undefined);

  if (favoriteEntities.length > 0) {
    cards.push({
      type: "heading",
      heading: t('favorites')
    });
    
    favoriteEntities.forEach(entityId => {
      cards.push({
        type: "tile",
        entity: entityId,
        show_entity_picture: true,
        vertical: false,
        state_content: "last_changed"
      });
    });
  }

  logDebug('[Section Builder] Overview section created with', cards.length, 'cards');
  return {
    type: "grid",
    cards: cards
  };
}

/**
 * Erstellt die Bereiche-Section(s)
 * @param {Array} visibleAreas - Sichtbare Bereiche
 * @param {boolean} groupByFloors - Ob nach Etagen gruppiert werden soll
 * @param {Object} hass - Home Assistant Objekt (für Floor-Namen)
 * @param {Object} config - Dashboard-Config (für Übersetzungen)
 */
export function createAreasSection(visibleAreas, groupByFloors = false, hass = null, config = {}) {
  // Wenn keine Etagen-Gruppierung gewünscht: alte Logik
  if (!groupByFloors || !hass) {
    return {
      type: "grid",
      cards: [
        {
          type: "heading",
          heading_style: "title",
          heading: t('areas')
        },
        ...visibleAreas.map((area) => {
          const translatedAreaName = translateAreaName(area.name, config);
          return {
            type: "area",
            area: area.area_id,
            name: translatedAreaName, // Übersetzter Name für die Area-Card
            display_type: "compact",
            alert_classes: [ "motion", "moisture", "occupancy" ],
            sensor_classes: [ "temperature", "humidity", "volatile_organic_compounds_parts" ],
            features: [{ type: "area-controls" }],
            features_position: "inline",
            navigation_path: area.area_id,
            vertical: false
          };
        })
      ]
    };
  }

  // Gruppiere Areas nach Floor
  const areasByFloor = new Map();
  const areasWithoutFloor = [];

  visibleAreas.forEach(area => {
    if (area.floor_id) {
      if (!areasByFloor.has(area.floor_id)) {
        areasByFloor.set(area.floor_id, []);
      }
      areasByFloor.get(area.floor_id).push(area);
    } else {
      areasWithoutFloor.push(area);
    }
  });

  // Erstelle Sections für jede Etage
  const sections = [];

  // Sortiere Floors nach Name (alphabetisch)
  const sortedFloors = Array.from(areasByFloor.keys()).sort((a, b) => {
    const floorA = hass.floors?.[a];
    const floorB = hass.floors?.[b];
    const nameA = floorA?.name || a;
    const nameB = floorB?.name || b;
    return nameA.localeCompare(nameB);
  });

  sortedFloors.forEach(floorId => {
    const areas = areasByFloor.get(floorId);
    const floor = hass.floors?.[floorId];
    const floorName = floor?.name || floorId;
    const floorIcon = floor?.icon || "mdi:floor-plan";

    sections.push({
      type: "grid",
      cards: [
        {
          type: "heading",
          heading_style: "title",
          heading: floorName,
          icon: floorIcon
        },
        ...areas.map((area) => {
          const translatedAreaName = translateAreaName(area.name, config);
          return {
            type: "area",
            area: area.area_id,
            name: translatedAreaName, // Übersetzter Name für die Area-Card
            display_type: "compact",
            alert_classes: [ "motion", "moisture", "occupancy" ],
            sensor_classes: [ "temperature", "humidity", "volatile_organic_compounds_parts" ],
            features: [{ type: "area-controls" }],
            features_position: "inline",
            navigation_path: area.area_id,
            vertical: false
          };
        })
      ]
    });
  });

  // Bereiche ohne Etage (falls vorhanden)
  if (areasWithoutFloor.length > 0) {
    sections.push({
      type: "grid",
      cards: [
        {
          type: "heading",
          heading_style: "title",
          heading: t('moreAreas'),
          icon: "mdi:home-outline"
        },
        ...areasWithoutFloor.map((area) => {
          const translatedAreaName = translateAreaName(area.name, config);
          return {
            type: "area",
            area: area.area_id,
            name: translatedAreaName, // Übersetzter Name für die Area-Card
            display_type: "compact",
            alert_classes: [ "motion", "moisture", "occupancy" ],
            sensor_classes: [ "temperature", "humidity", "volatile_organic_compounds_parts" ],
            features: [{ type: "area-controls" }],
            features_position: "inline",
            navigation_path: area.area_id,
            vertical: false
          };
        })
      ]
    });
  }

  return sections;
}

/**
 * Erstellt die Wetter-Section
 * @param {string} weatherEntity - Weather Entity ID
 * @param {boolean} showWeather - Ob Wetter-Karte angezeigt werden soll
 * @param {Object} config - Konfigurationsobjekt (für Horizon Card und Clock Weather Card)
 * @param {Object} hass - Home Assistant Objekt (für Clock Weather Card)
 * @returns {Object|null} Section oder null wenn keine Karte angezeigt wird
 */
export function createWeatherSection(weatherEntity, showWeather, config = {}, hass = null) {
  const showHorizonCard = config.show_horizon_card === true;
  const horizonCardExtended = config.horizon_card_extended === true;
  const useClockWeatherCard = config.use_clock_weather_card === true;
  
  // Erstelle Horizon Card Konfiguration
  const createHorizonCardConfig = () => {
    const baseConfig = {
      type: "custom:horizon-card",
      moon: true,
      refresh_period: 60,
      fields: {
        sunrise: true,
        sunset: true,
        moonrise: true,
        moonset: true
      }
    };
    
    if (horizonCardExtended) {
      baseConfig.fields = {
        sunrise: true,
        sunset: true,
        dawn: true,
        noon: true,
        dusk: true,
        moonrise: true,
        moonset: true,
        azimuth: true,
        elevation: true,
        moon_phase: true
      };
    }
    
    return baseConfig;
  };
  
  const cards = [];
  
  // Wenn Clock Weather Card verwendet werden soll
  if (weatherEntity && showWeather && useClockWeatherCard) {
    cards.push({
      type: "heading",
      heading: t('weather'),
      heading_style: "title",
      icon: "mdi:weather-partly-cloudy"
    });
    
    // Build clock-weather-card configuration
    const builder = WEATHER_CARD_BUILDERS['clock-weather-card'];
    if (builder) {
      const clockWeatherCardConfig = builder(weatherEntity, config, hass);
      cards.push(clockWeatherCardConfig);
    } else {
      logWarn('[Section Builder] Clock weather card builder not found');
      // Fallback to standard weather card
      cards.push({
        type: "weather-forecast",
        entity: weatherEntity,
        forecast_type: "daily"
      });
    }
    
    // Füge Horizon Card hinzu wenn aktiviert
    if (showHorizonCard) {
      cards.push(createHorizonCardConfig());
    }
  } else if (weatherEntity && showWeather) {
    // Standard Weather Forecast Card
    cards.push({
      type: "heading",
      heading: t('weather'),
      heading_style: "title",
      icon: "mdi:weather-partly-cloudy"
    });
    cards.push({
      type: "weather-forecast",
      entity: weatherEntity,
      forecast_type: "daily"
    });
    
    // Füge Horizon Card hinzu wenn aktiviert
    if (showHorizonCard) {
      cards.push(createHorizonCardConfig());
    }
  } else if (showHorizonCard) {
    // Wenn nur Horizon Card ohne Weather Card
    cards.push({
      type: "heading",
      heading: t('weather'),
      heading_style: "title",
      icon: "mdi:weather-partly-cloudy"
    });
    cards.push(createHorizonCardConfig());
  }
  
  // Gib null zurück wenn keine Karten vorhanden
  if (cards.length === 0) {
    return null;
  }
  
  return {
    type: "grid",
    cards: cards
  };
}

/**
 * Erstellt die Public Transport-Section
 * @param {Object} config - Konfigurationsobjekt
 * @param {Object} hass - Home Assistant Objekt
 * @returns {Object|null} Section oder null wenn keine Karte angezeigt wird
 */
export function createPublicTransportSection(config, hass) {
  const showPublicTransport = config.show_public_transport === true;
  if (!showPublicTransport) {
    return null;
  }

  // Get integration and card type
  const integration = config.public_transport_integration;
  if (!integration) {
    return null;
  }

  const cardType = getCardType(integration, config.public_transport_card);
  if (!cardType) {
    return null;
  }

  // Validate combination
  if (!validateCombination(integration, cardType)) {
    logWarn('Invalid public transport card/integration combination:', cardType, 'with', integration);
    return null;
  }

  // Filter entities
  let publicTransportEntities = filterValidEntities(config.public_transport_entities || [], hass);
  
  // Special filtering for ha-departures-card
  if (cardType === 'ha-departures-card') {
    publicTransportEntities = filterHaDeparturesEntities(publicTransportEntities, hass);
    if (publicTransportEntities.length === 0) {
      return null;
    }
  }

  if (publicTransportEntities.length === 0) {
    return null;
  }

  // Get builder function
  const builder = CARD_BUILDERS[cardType];
  if (!builder) {
    logWarn('No builder found for card type:', cardType);
    return null;
  }

  // Build card configuration
  const cardConfig = builder(publicTransportEntities, config, hass);

  // Build section with heading
  const cards = [
    {
      type: "heading",
      heading: t('publicTransport'),
      heading_style: "title",
      icon: "mdi:bus"
    }
  ];

  // Handle arrays (db-info-card, kvv-departures-card) vs single card
  if (Array.isArray(cardConfig)) {
    cards.push(...cardConfig);
  } else {
    cards.push(cardConfig);
  }

  return {
    type: "grid",
    cards: cards
  };
}

/**
 * Erstellt die Scheduler-Card-Section
 * @param {Object} config - Konfigurationsobjekt
 * @param {Object} hass - Home Assistant Objekt
 * @returns {Object|null} Section oder null wenn keine Karte angezeigt wird
 */
export function createSchedulerCardSection(config, hass) {
  const showSchedulerCard = config.show_scheduler_card === true;
  if (!showSchedulerCard) {
    return null;
  }

  // Support both old scheduler_entity (singular) and new scheduler_entities (plural)
  const schedulerEntities = config.scheduler_entities || 
    (config.scheduler_entity ? [config.scheduler_entity] : []);
  
  if (schedulerEntities.length === 0) {
    return null;
  }

  // Filter valid entities and get their names
  const validEntities = schedulerEntities
    .filter(entityId => {
      if (!hass?.states?.[entityId]) {
        logWarn('[Section Builder] Scheduler entity not found:', entityId);
        return false;
      }
      return true;
    })
    .map(entityId => {
      const state = hass.states[entityId];
      const name = state?.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
      return { entityId, name };
    });

  if (validEntities.length === 0) {
    return null;
  }

  // Build cards: one heading + one scheduler card per entity (each with its own heading)
  const cards = [
    {
      type: "heading",
      heading: t('scheduler'),
      heading_style: "title",
      icon: "mdi:calendar-clock"
    },
    ...validEntities.flatMap(({ entityId, name }) => [
      {
        type: "heading",
        heading: name,
        heading_style: "subtitle",
        icon: "mdi:calendar-clock"
      },
      {
        type: "custom:scheduler-card",
        entity: entityId,
        discover_existing: false
      }
    ])
  ];

  return {
    type: "grid",
    cards: cards
  };
}

/**
 * Erstellt die Calendar-Card-Section
 * @param {Object} config - Konfigurationsobjekt
 * @param {Object} hass - Home Assistant Objekt
 * @returns {Object|null} Section oder null wenn keine Karte angezeigt wird
 */
export function createCalendarCardSection(config, hass) {
  const showCalendarCard = config.show_calendar_card === true;
  if (!showCalendarCard) {
    return null;
  }

  const calendarEntities = config.calendar_entities || [];
  if (calendarEntities.length === 0) {
    return null;
  }

  // Filter valid entities
  const validEntities = calendarEntities.filter(entityId => {
    return hass?.states?.[entityId] !== undefined;
  });

  if (validEntities.length === 0) {
    return null;
  }

  // Check if Calendar Card Pro should be used
  const useCalendarCardPro = config.use_calendar_card_pro === true;
  
  // Build card config
  let cardConfig;
  if (useCalendarCardPro) {
    // calendar-card-pro expects entities array with entity property
    cardConfig = {
      type: 'custom:calendar-card-pro',
      entities: validEntities.map(entityId => ({
        entity: entityId
      }))
    };
  } else {
    // Standard Home Assistant calendar card
    cardConfig = {
      type: 'calendar',
      initial_view: 'dayGridDay',
      entities: validEntities
    };
  }

  const cards = [
    {
      type: "heading",
      heading: t('calendar'),
      heading_style: "title",
      icon: "mdi:calendar"
    },
    cardConfig
  ];

  return {
    type: "grid",
    cards: cards
  };
}

/**
 * Erstellt die Todo Swipe Card-Section
 * @param {Object} config - Konfigurationsobjekt
 * @param {Object} hass - Home Assistant Objekt
 * @returns {Object|null} Section oder null wenn keine Karte angezeigt wird
 */
export function createTodoSwipeCardSection(config, hass) {
  const showTodoSwipeCard = config.show_todo_swipe_card === true;
  if (!showTodoSwipeCard) {
    return null;
  }

  const todoEntities = config.todo_entities || [];
  if (todoEntities.length === 0) {
    return null;
  }

  // Filter valid entities
  const validEntities = todoEntities.filter(entityId => {
    return hass?.states?.[entityId] !== undefined;
  });

  if (validEntities.length === 0) {
    return null;
  }

  // Build card config - support both simple array and entity objects
  let entitiesConfig;
  if (typeof validEntities[0] === 'string') {
    // Simple array of entity IDs
    entitiesConfig = validEntities;
  } else {
    // Array of entity objects with additional config
    entitiesConfig = validEntities;
  }

  // Build card configuration
  const cardConfig = {
    type: 'custom:todo-swipe-card',
    entities: entitiesConfig
  };

  // Add optional properties if configured
  if (config.todo_swipe_card_show_pagination !== undefined) {
    cardConfig.show_pagination = config.todo_swipe_card_show_pagination;
  }
  if (config.todo_swipe_card_show_icons !== undefined) {
    cardConfig.show_icons = config.todo_swipe_card_show_icons;
  }
  if (config.todo_swipe_card_show_addbutton !== undefined) {
    cardConfig.show_addbutton = config.todo_swipe_card_show_addbutton;
  }
  if (config.todo_swipe_card_show_create !== undefined) {
    cardConfig.show_create = config.todo_swipe_card_show_create;
  }
  if (config.todo_swipe_card_show_completed !== undefined) {
    cardConfig.show_completed = config.todo_swipe_card_show_completed;
  }
  if (config.todo_swipe_card_show_completed_menu !== undefined) {
    cardConfig.show_completed_menu = config.todo_swipe_card_show_completed_menu;
  }
  if (config.todo_swipe_card_enable_search !== undefined) {
    cardConfig.enable_search = config.todo_swipe_card_enable_search;
  }
  if (config.todo_swipe_card_clear_search_on_uncheck !== undefined) {
    cardConfig.clear_search_on_uncheck = config.todo_swipe_card_clear_search_on_uncheck;
  }
  if (config.todo_swipe_card_delete_confirmation !== undefined) {
    cardConfig.delete_confirmation = config.todo_swipe_card_delete_confirmation;
  }
  if (config.todo_swipe_card_card_spacing !== undefined) {
    cardConfig.card_spacing = config.todo_swipe_card_card_spacing;
  }

  const cards = [
    {
      type: "heading",
      heading: t('todo'),
      heading_style: "title",
      icon: "mdi:format-list-checks"
    },
    cardConfig
  ];

  return {
    type: "grid",
    cards: cards
  };
}

/**
 * Erstellt die Energie-Section
 * @param {boolean} showEnergy - Ob Energie-Dashboard angezeigt werden soll
 * @returns {Object|null} Section oder null wenn keine Karte angezeigt wird
 */
export function createEnergySection(showEnergy) {
  if (!showEnergy) {
    return null;
  }
  
  return {
    type: "grid",
    cards: [
      {
        type: "heading",
        heading: t('energy'),
        heading_style: "title",
        icon: "mdi:lightning-bolt"
      },
      {
        type: "energy-distribution",
        link_dashboard: true
      }
    ]
  };
}