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
      areas_options: config.areas_options || {}
    }
  ];

  // Covers optional hinzufügen
  if (showCoversSummary) {
    summaryCards.push({
      type: "custom:simon42-summary-card",
      summary_type: "covers",
      areas_options: config.areas_options || {}
    });
  }

  summaryCards.push(
    {
      type: "custom:simon42-summary-card",
      summary_type: "security",
      areas_options: config.areas_options || {}
    },
    {
      type: "custom:simon42-summary-card",
      summary_type: "batteries",
      areas_options: config.areas_options || {}
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
  const publicTransportEntities = (config.public_transport_entities || [])
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
    cardConfig.type = 'custom:flex-table-card';
    
    if (config.hvv_title) {
      cardConfig.title = config.hvv_title;
    }
    
    // Try to create a wildcard pattern from selected entities
    // db_info entities follow pattern: sensor.*_verbindung_*
    // If all entities share a common prefix, use wildcard pattern
    let useWildcardPattern = false;
    let wildcardPattern = null;
    
    if (publicTransportEntities.length > 0) {
      // Extract common prefix (everything before the last _verbindung_ or _connection_)
      const firstEntity = publicTransportEntities[0];
      const verbindungIndex = firstEntity.indexOf('_verbindung_');
      const connectionIndex = firstEntity.indexOf('_connection_');
      const separatorIndex = verbindungIndex > -1 ? verbindungIndex : connectionIndex;
      
      if (separatorIndex > -1) {
        const prefix = firstEntity.substring(0, separatorIndex);
        // Check if all entities share this prefix
        const allSharePrefix = publicTransportEntities.every(entity => 
          entity.startsWith(prefix + '_verbindung_') || entity.startsWith(prefix + '_connection_')
        );
        
        if (allSharePrefix) {
          // Create wildcard pattern
          const separator = verbindungIndex > -1 ? '_verbindung_' : '_connection_';
          wildcardPattern = prefix + separator + '*';
          useWildcardPattern = true;
        }
      }
    }
    
    // Configure entities - use wildcard pattern if available, otherwise list entities directly
    if (useWildcardPattern && wildcardPattern) {
      cardConfig.entities = {
        include: wildcardPattern
      };
    } else {
      // Use direct entity list (flex-table-card supports both)
      cardConfig.entities = publicTransportEntities;
    }
    
    // Add sorting by departure time
    cardConfig.sort_by = 'sort_time';
    
    // Get current language for locale settings
    const currentLang = getLanguage();
    const locale = currentLang === 'de' ? 'de-DE' : 'en-US';
    
    // Format modify functions as multiline strings following the official example
    // The modify property expects a string that will be evaluated as code
    // Values are returned implicitly (no return statements needed)
    const formatTimeWithDelayStr = `var time = new Date(x.split(" ")[0]); var timeReal = new Date(x.split(" ")[1]); if (isNaN(timeReal.getTime())) {
  time.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit'});
} else if (time >= timeReal) {
  '<div style="color:green">' +
  time.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit'}) +
  '</div>';
} else {
  var delayMinutes = (timeReal - time) / (1000 * 60);
  if (delayMinutes > 4) {
    '<s><div style="color:grey">' +
    time.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit'}) +
    '</div></s><div style="color:red">' +
    timeReal.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit'}) +
    '</div>';
  } else {
    '<s><div style="color:grey">' +
    time.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit'}) +
    '</div></s><div style="color:green">' +
    timeReal.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit'}) +
    '</div>';
  }
}`;
    
    const formatSortTimeStr = `var time = new Date(x.split(" ")[0]); var timeReal = new Date(x.split(" ")[1]); if (isNaN(timeReal.getTime())) {
  time.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit'});
} else {
  '<div style="color:green">' +
  timeReal.toLocaleTimeString('${locale}', {hour: '2-digit', minute: '2-digit'}) +
  '</div>';
}`;
    
    // Configure columns as per db_info README (following official example)
    cardConfig.columns = [
      {
        name: t('publicTransportColumnStart'),
        data: 'Departure'
      },
      {
        name: t('publicTransportColumnConnection'),
        data: 'Name'
      },
      {
        name: t('publicTransportColumnDeparture'),
        multi: [
          ['attr', 'Departure Time'],
          ['attr', 'Departure Time Real']
        ],
        modify: formatTimeWithDelayStr
      },
      {
        name: t('publicTransportColumnArrival'),
        multi: [
          ['attr', 'Arrival Time'],
          ['attr', 'Arrival Time Real']
        ],
        modify: formatTimeWithDelayStr
      },
      {
        name: 'sort_time',
        multi: [
          ['attr', 'Departure Time'],
          ['attr', 'Departure Time Real']
        ],
        modify: formatSortTimeStr,
        hidden: true
      }
    ];
    
    // Add CSS styling (as per README: css: table+: "padding: 1px 5px 16px 5px;")
    cardConfig.css = {
      'table+': 'padding: 1px 5px 16px 5px;'
    };
    
    // Add card_mod styling for header (as per README)
    cardConfig.card_mod = {
      style: {
        '$': 'h1.card-header { font-size: 20px; padding-top: 3px; padding-bottom: 1px; }'
      }
    };
  }
  
  const cards = [
    {
      type: "heading",
      heading: t('publicTransport'),
      heading_style: "title",
      icon: "mdi:bus"
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