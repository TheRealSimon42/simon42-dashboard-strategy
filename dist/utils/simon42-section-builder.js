// ====================================================================
// SECTION BUILDER - Erstellt Dashboard-Sections
// ====================================================================

import { t, getLanguage } from './simon42-i18n.js';
import {
  filterValidEntities,
  filterHaDeparturesEntities,
  getCardType,
  validateCombination,
  CARD_BUILDERS
} from './simon42-public-transport-builders.js';
import { WEATHER_CARD_BUILDERS } from './simon42-weather-card-builders.js';
import { logWarn, logDebug, logInfo } from './simon42-logger.js';
import { translateAreaName } from './simon42-helpers.js';

/**
 * Erstellt die Übersichts-Section mit Zusammenfassungen
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

  // Prüfe ob Uhr-Karte angezeigt werden soll
  if (showClockCard) {
    // Prüfe ob Alarm-Entity konfiguriert ist
    const alarmEntity = config.alarm_entity;

    if (alarmEntity) {
      // Validate entity exists
      if (!hass?.states?.[alarmEntity]) {
        logWarn('[Section Builder] Alarm entity not found:', alarmEntity);
      } else {
        // Uhr und Alarm-Panel nebeneinander
        cards.push({
          type: "clock",
          clock_size: "small",
          show_seconds: false
        });
        
        // Check if Alarmo card should be used
        const useAlarmoCard = config.use_alarmo_card === true;
        if (useAlarmoCard && hass?.entities?.[alarmEntity]?.platform === 'alarmo') {
          cards.push({
            type: "custom:alarmo-card",
            entity: alarmEntity
          });
        } else {
          cards.push({
            type: "tile",
            entity: alarmEntity,
            vertical: false
          });
        }
      }
    } else {
      // Nur Uhr in voller Breite
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
    // Wenn keine Uhr, aber Alarm-Entity vorhanden, zeige nur Alarm-Panel
    const alarmEntity = config.alarm_entity;
    if (alarmEntity) {
      // Validate entity exists
      if (!hass?.states?.[alarmEntity]) {
        logWarn('[Section Builder] Alarm entity not found:', alarmEntity);
      } else {
        // Check if Alarmo card should be used
        const useAlarmoCard = config.use_alarmo_card === true;
        if (useAlarmoCard && hass?.entities?.[alarmEntity]?.platform === 'alarmo') {
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

  // Füge Search-Card hinzu wenn aktiviert
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

  // Füge Zusammenfassungen hinzu nur wenn mindestens eine Card vorhanden ist
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
      
      // Wenn nur eine Karte übrig (ungerade Anzahl), trotzdem horizontal-stack verwenden
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

  const schedulerEntity = config.scheduler_entity;
  if (!schedulerEntity) {
    return null;
  }

  // Validate entity exists
  if (!hass?.states?.[schedulerEntity]) {
    logWarn('[Section Builder] Scheduler entity not found:', schedulerEntity);
    return null;
  }

  const cards = [
    {
      type: "heading",
      heading: t('scheduler'),
      heading_style: "title",
      icon: "mdi:calendar-clock"
    },
    {
      type: "custom:scheduler-card",
      entity: schedulerEntity
    }
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
  const cardType = useCalendarCardPro ? 'custom:calendar-card-pro' : 'custom:calendar-card';
  
  // Build card config - calendar-card-pro uses entities array with entity property
  let cardConfig;
  if (useCalendarCardPro) {
    // calendar-card-pro expects entities array with entity property
    cardConfig = {
      type: cardType,
      entities: validEntities.map(entityId => ({
        entity: entityId
      }))
    };
  } else {
    // calendar-card expects simple entities array
    cardConfig = {
      type: cardType,
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