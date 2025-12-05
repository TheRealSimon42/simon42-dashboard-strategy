// ====================================================================
// SECTION BUILDER - Erstellt Dashboard-Sections
// ====================================================================

import { t, getLanguage } from './simon42-i18n.js';

/**
 * Erstellt die Übersichts-Section mit Zusammenfassungen
 */
export function createOverviewSection(data) {
  const { someSensorId, showSearchCard, config, hass } = data;
  
  const cards = [
    {
      type: "heading",
      heading: t('overview'),
      heading_style: "title",
      icon: "mdi:overscan"
    }
  ];

  // Prüfe ob Alarm-Entity konfiguriert ist
  const alarmEntity = config.alarm_entity;

  if (alarmEntity) {
    // Uhr und Alarm-Panel nebeneinander
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

  // Füge Search-Card hinzu wenn aktiviert
  if (showSearchCard) {
    cards.push({
      type: "custom:search-card",
      grid_options: {
        columns: "full",
      }
    });
  }

  // Prüfe ob summaries_columns konfiguriert ist (Standard: 2)
  const summariesColumns = config.summaries_columns || 2;
  const showCoversSummary = config.show_covers_summary !== false;

  // Füge Zusammenfassungen hinzu
  cards.push({
    type: "heading",
    heading: t('summaries')
  });

  // Erstelle die Summary-Cards basierend auf Konfiguration
  const summaryCards = [
    {
      type: "custom:simon42-summary-card",
      summary_type: "lights",
      areas_options: config.areas_options || {},
      language: config.language
    }
  ];

  // Covers optional hinzufügen
  if (showCoversSummary) {
    summaryCards.push({
      type: "custom:simon42-summary-card",
      summary_type: "covers",
      areas_options: config.areas_options || {},
      language: config.language
    });
  }

  summaryCards.push(
    {
      type: "custom:simon42-summary-card",
      summary_type: "security",
      areas_options: config.areas_options || {},
      language: config.language
    },
    {
      type: "custom:simon42-summary-card",
      summary_type: "batteries",
      areas_options: config.areas_options || {},
      language: config.language
    }
  );

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
 */
export function createAreasSection(visibleAreas, groupByFloors = false, hass = null) {
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
        ...visibleAreas.map((area) => ({
          type: "area",
          area: area.area_id,
          display_type: "compact",
          alert_classes: [ "motion", "moisture", "occupancy" ],
          sensor_classes: [ "temperature", "humidity", "volatile_organic_compounds_parts" ],
          features: [{ type: "area-controls" }],
          features_position: "inline",
          navigation_path: area.area_id,
          vertical: false
        }))
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
        ...areas.map((area) => ({
          type: "area",
          area: area.area_id,
          display_type: "compact",
          alert_classes: [ "motion", "moisture", "occupancy" ],
          sensor_classes: [ "temperature", "humidity", "volatile_organic_compounds_parts" ],
          features: [{ type: "area-controls" }],
          features_position: "inline",
          navigation_path: area.area_id,
          vertical: false
        }))
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
        ...areasWithoutFloor.map((area) => ({
          type: "area",
          area: area.area_id,
          display_type: "compact",
          alert_classes: [ "motion", "moisture", "occupancy" ],
          sensor_classes: [ "temperature", "humidity", "volatile_organic_compounds_parts" ],
          features: [{ type: "area-controls" }],
          features_position: "inline",
          navigation_path: area.area_id,
          vertical: false
        }))
      ]
    });
  }

  return sections;
}

/**
 * Erstellt die Wetter-Section
 * @param {string} weatherEntity - Weather Entity ID
 * @param {boolean} showWeather - Ob Wetter-Karte angezeigt werden soll
 * @param {Object} config - Konfigurationsobjekt (für Horizon Card)
 * @returns {Object|null} Section oder null wenn keine Karte angezeigt wird
 */
export function createWeatherSection(weatherEntity, showWeather, config = {}) {
  const showHorizonCard = config.show_horizon_card === true;
  const horizonCardExtended = config.horizon_card_extended === true;
  
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
  
  // Füge Weather Forecast hinzu, wenn eine Weather-Entität gefunden wurde UND aktiviert
  if (weatherEntity && showWeather) {
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
  let publicTransportEntities = (config.public_transport_entities || [])
    .filter(entityId => hass.states[entityId] !== undefined);

  if (!showPublicTransport || publicTransportEntities.length === 0) {
    return null;
  }
  
  // Determine card type from config
  const integration = config.public_transport_integration;
  
  // If no integration configured, don't show section
  if (!integration) {
    return null;
  }
  
  // Auto-determine card type based on integration (hardcoded mapping)
  // This ensures backward compatibility if card is not set
  const cardMapping = {
    'hvv': 'hvv-card',
    'ha-departures': 'ha-departures-card',
    'db_info': 'db-info-card'
  };
  
  const cardType = config.public_transport_card || cardMapping[integration];
  
  // For ha-departures-card, filter entities to only include those with valid departure times
  if (cardType === 'ha-departures-card') {
    publicTransportEntities = publicTransportEntities.filter(entityId => {
      const state = hass.states[entityId];
      if (!state || !state.attributes) {
        return false;
      }
      
      const attrs = state.attributes;
      // Check if entity has at least one valid departure time
      // Check planned_departure_time (main) or planned_departure_time_1 through _4
      const hasPlannedTime = attrs.planned_departure_time !== null && 
                            attrs.planned_departure_time !== undefined;
      
      // Also check numbered departure times
      const hasAnyPlannedTime = hasPlannedTime || 
        (attrs.planned_departure_time_1 !== null && attrs.planned_departure_time_1 !== undefined) ||
        (attrs.planned_departure_time_2 !== null && attrs.planned_departure_time_2 !== undefined) ||
        (attrs.planned_departure_time_3 !== null && attrs.planned_departure_time_3 !== undefined) ||
        (attrs.planned_departure_time_4 !== null && attrs.planned_departure_time_4 !== undefined);
      
      // Entity is valid if it has at least one planned departure time
      return hasAnyPlannedTime;
    });
    
    // If no valid entities remain, don't show section
    if (publicTransportEntities.length === 0) {
      return null;
    }
  }
  
  // Validate card/integration combination
  const validCombinations = {
    'hvv': ['hvv-card'],
    'ha-departures': ['ha-departures-card'],
    'db_info': ['db-info-card'] // Note: db_info uses flex-table-card, but we keep this for UI consistency
  };

  const validCards = validCombinations[integration] || [];
  if (!cardType || !validCards.includes(cardType)) {
    // Invalid combination, don't show section
    console.warn(`[simon42-dashboard] Invalid public transport card/integration combination: ${cardType} with ${integration}`);
    return null;
  }

  // Build card configuration based on card type
  // Note: We only check cardType, not integration, since cardType determines which card is rendered
  let cardConfig = {};

  // Set card type and add card-specific options
  if (cardType === 'hvv-card') {
    // HVV card uses entities array
    cardConfig.entities = publicTransportEntities;
    // HVV card specific options
    cardConfig.type = 'custom:hvv-card';
    cardConfig.max = config.hvv_max !== undefined ? config.hvv_max : 10;
    cardConfig.show_time = config.hvv_show_time !== undefined ? config.hvv_show_time : false;
    cardConfig.show_title = config.hvv_show_title !== undefined ? config.hvv_show_title : false;
    cardConfig.title = config.hvv_title || 'HVV';
  } else if (cardType === 'ha-departures-card') {
    // ha-departures-card uses 'departures-card' as the type
    // Based on ha-departures-card README: type is 'custom:departures-card'
    cardConfig.type = 'custom:departures-card';
    // ha-departures-card uses entities array
    cardConfig.entities = publicTransportEntities;
    // ha-departures-card uses 'departuresToShow' instead of 'max' (max 5 departures)
    if (config.hvv_max !== undefined) {
      cardConfig.departuresToShow = Math.min(config.hvv_max, 5); // Limit to max 5 as per card docs
    } else {
      cardConfig.departuresToShow = 1; // Default is 1
    }
    if (config.hvv_title) {
      cardConfig.title = config.hvv_title;
    }
    // Optional: showCardHeader defaults to true, but we can respect hvv_show_title if needed
    if (config.hvv_show_title === false) {
      cardConfig.showCardHeader = false;
    }
  } else if (cardType === 'db-info-card') {
    // db_info integration uses flex-table-card with complex configuration
    // Based on db_info README: https://homeassistant.phil-lipp.de/hacs/repository/1075370780
    
    // Group entities by path (extract path name from friendly_name)
    // friendly_name format: "Phillipp Jäger → Fürstenberg Institut Verbindung 1"
    // Extract path name by removing "Verbindung X" or "Connection X" suffix
    const pathGroups = {};
    
    publicTransportEntities.forEach(entityId => {
      const entity = hass.states[entityId];
      if (!entity || !entity.attributes) {
        return;
      }
      
      const friendlyName = entity.attributes.friendly_name || '';
      // Extract path name by removing "Verbindung X" or "Connection X" pattern
      // Match both German and English patterns, with optional whitespace
      const pathName = friendlyName
        .replace(/\s*(?:Verbindung|Connection)\s+\d+$/, '')
        .trim();
      
      // Use original friendly_name as fallback if pattern doesn't match
      const groupKey = pathName || friendlyName || entityId;
      
      if (!pathGroups[groupKey]) {
        pathGroups[groupKey] = [];
      }
      pathGroups[groupKey].push(entityId);
    });
    
    // Get current language for locale settings
    const currentLang = getLanguage();
    const locale = currentLang === 'de' ? 'de-DE' : 'en-US';
    
    // Format modify functions as direct JavaScript expressions
    // The modify property expects a string that will be evaluated as JavaScript code
    // x is automatically available and represents the cell value
    // Based on official examples: https://github.com/custom-cards/flex-table-card/blob/master/docs/example-cfg-advanced-cell-formatting.md
    // When data contains multiple comma-separated attributes like 'Departure Time,Departure Time Real',
    // x will be a string with both values joined by space (default multi_delimiter)
    // db_info uses ISO format: "2025-12-03T22:49:00 2025-12-03T22:49:00" or "2025-12-03T22:51:00 null"
    // Format time with delay handling - parse ISO datetime strings, handle null values
    const formatTimeWithDelayStr = `(function() { try { var str = (x || '').toString().trim(); if (!str || str === 'undefined' || str === 'null') { return '-'; } var parts = str.split(' '); var timeStr = parts[0] || ''; var timeRealStr = parts[1] || ''; if (!timeStr || timeStr === 'null' || timeStr === 'undefined') { return '-'; } var time = new Date(timeStr); if (isNaN(time.getTime())) { return '-'; } var timeFormatted = time.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit'}); if (!timeRealStr || timeRealStr === 'null' || timeRealStr === 'undefined') { return timeFormatted; } var timeReal = new Date(timeRealStr); if (isNaN(timeReal.getTime())) { return timeFormatted; } if (time >= timeReal) { return '<div style="color:green">' + timeFormatted + '</div>'; } else { var delayMinutes = (timeReal - time) / (1000 * 60); var timeRealFormatted = timeReal.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit'}); if (delayMinutes > 4) { return '<s><div style="color:grey">' + timeFormatted + '</div></s><div style="color:red">' + timeRealFormatted + '</div>'; } else { return '<s><div style="color:grey">' + timeFormatted + '</div></s><div style="color:green">' + timeRealFormatted + '</div>'; } } } catch(e) { return '-'; } })()`;
    
    // Format sort time (use actual time if available, otherwise planned time)
    const formatSortTimeStr = `(function() { try { var str = (x || '').toString().trim(); if (!str || str === 'undefined' || str === 'null') { return ''; } var parts = str.split(' '); var timeStr = parts[0] || ''; var timeRealStr = parts[1] || ''; if (!timeStr || timeStr === 'null' || timeStr === 'undefined') { return ''; } var time = new Date(timeStr); if (isNaN(time.getTime())) { return ''; } if (!timeRealStr || timeRealStr === 'null' || timeRealStr === 'undefined') { return time.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit'}); } var timeReal = new Date(timeRealStr); if (isNaN(timeReal.getTime())) { return time.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit'}); } return timeReal.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit'}); } catch(e) { return ''; } })()`;
    
    // Configure columns as per db_info README (following official example)
    // Use new data syntax: comma-separated attribute names (replaces old multi syntax)
    // The card will combine multiple values with space (default multi_delimiter)
    // db_info attributes use spaces in names (e.g., "Departure Time", "Arrival Time")
    // Attribute names must match exactly as they appear in the entity attributes
    const tableColumns = [
      {
        name: t('publicTransportColumnStart'),
        data: 'Departure'  // Start station name (e.g., "Kaltenkircher Platz, Hamburg")
      },
      {
        name: t('publicTransportColumnConnection'),
        data: 'Name'  // Connection/route name (e.g., "Bus 3")
      },
      {
        name: t('publicTransportColumnDeparture'),
        data: 'Departure Time,Departure Time Real',  // ISO format: "2025-12-03T22:49:00 2025-12-03T22:49:00"
        modify: formatTimeWithDelayStr
      },
      {
        name: t('publicTransportColumnArrival'),
        data: 'Arrival Time,Arrival Time Real',  // ISO format: "2025-12-03T22:58:00 2025-12-03T22:58:00"
        modify: formatTimeWithDelayStr
      },
      {
        name: 'sort_time',
        data: 'Departure Time,Departure Time Real',
        modify: formatSortTimeStr,
        hidden: true
      }
    ];
    
    // Create cards array with header + table for each path group
    const pathCards = [];
    const pathNames = Object.keys(pathGroups);
    
    pathNames.forEach((pathName, index) => {
      const pathEntities = pathGroups[pathName];
      
      // Add slim header row for path name
      pathCards.push({
        type: 'markdown',
        content: `**${pathName}**`,
        card_mod: {
          style: {
            '$': '.card-content { padding: 8px 16px 4px 16px; font-size: 14px; }'
          }
        }
      });
      
      // Add table card for this path's connections
      const tableCard = {
        type: 'custom:flex-table-card',
        entities: pathEntities,
        sort_by: 'sort_time',
        columns: tableColumns,
        css: {
          'table+': 'padding: 1px 5px 16px 5px;'
        },
        card_mod: {
          style: {
            '$': 'h1.card-header { font-size: 20px; padding-top: 3px; padding-bottom: 1px; }'
          }
        }
      };
      
      // Only add title if it's the first path group and config has a title
      if (index === 0 && config.hvv_title) {
        tableCard.title = config.hvv_title;
      }
      
      pathCards.push(tableCard);
    });
    
    // Use pathCards as cardConfig for db_info
    cardConfig = pathCards;
  }
  
  // Build cards array - handle db_info differently since it returns an array
  const cards = [
    {
      type: "heading",
      heading: t('publicTransport'),
      heading_style: "title",
      icon: "mdi:bus"
    }
  ];
  
  // For db_info, cardConfig is an array of cards, otherwise it's a single card
  if (cardType === 'db-info-card' && Array.isArray(cardConfig)) {
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