// ====================================================================
// SECTION BUILDER - Erstellt Dashboard-Sections
// ====================================================================

import { t } from './simon42-i18n.js';

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
  const cardType = config.public_transport_card;
  const integration = config.public_transport_integration;
  
  // If no integration/card configured, don't show section
  if (!cardType || !integration) {
    return null;
  }
  
  // Validate card/integration combination
  const validCombinations = {
    'hvv': ['hvv-card'],
    'ha-departures': ['ha-departures-card'],
    'db_info': ['db-info-card']
  };
  
  const validCards = validCombinations[integration] || [];
  if (!validCards.includes(cardType)) {
    // Invalid combination, don't show section
    console.warn(`[simon42-dashboard] Invalid public transport card/integration combination: ${cardType} with ${integration}`);
    return null;
  }
  
  // Build card configuration based on card type
  let cardConfig = {
    type: `custom:${cardType}`,
    entities: publicTransportEntities
  };
  
  // Add integration-specific options
  if (cardType === 'hvv-card' || integration === 'hvv') {
    // HVV card specific options
    cardConfig.max = config.hvv_max !== undefined ? config.hvv_max : 10;
    cardConfig.show_time = config.hvv_show_time !== undefined ? config.hvv_show_time : true;
    cardConfig.show_title = config.hvv_show_title !== undefined ? config.hvv_show_title : true;
    cardConfig.title = config.hvv_title || 'HVV';
  } else if (cardType === 'ha-departures-card' || integration === 'ha-departures') {
    // ha-departures card specific options (if needed)
    // Add any ha-departures specific config here
    if (config.hvv_max !== undefined) {
      cardConfig.max = config.hvv_max;
    }
    if (config.hvv_title) {
      cardConfig.title = config.hvv_title;
    }
  } else if (cardType === 'db-info-card' || integration === 'db_info') {
    // db_info card specific options (if needed)
    // Add any db_info specific config here
    if (config.hvv_max !== undefined) {
      cardConfig.max = config.hvv_max;
    }
    if (config.hvv_title) {
      cardConfig.title = config.hvv_title;
    }
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
