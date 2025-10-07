// ====================================================================
// SECTION BUILDER - Erstellt Dashboard-Sections
// ====================================================================

/**
 * Erstellt die Übersichts-Section mit Zusammenfassungen
 */
export function createOverviewSection(data) {
  const { someSensorId, showSearchCard, config, hass } = data;
  
  const cards = [
    {
      type: "heading",
      heading: "Übersicht",
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

  // Füge Zusammenfassungen hinzu
  cards.push({
    type: "heading",
    heading: "Zusammenfassungen"
  });

  // Erstelle die Summary-Cards
  const summaryCards = [
    {
      type: "custom:simon42-summary-card",
      summary_type: "lights",
      areas_options: config.areas_options || {}
    },
    {
      type: "custom:simon42-summary-card",
      summary_type: "covers",
      areas_options: config.areas_options || {}
    },
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
  ];

  // Wenn 4 Spalten gewünscht: Wrappen in horizontal-stack
  if (summariesColumns === 4) {
    cards.push({
      type: "horizontal-stack",
      cards: summaryCards
    });
  } else {
    // Bei 2 Spalten: Zwei horizontal-stacks mit je 2 Cards
    cards.push(
      {
        type: "horizontal-stack",
        cards: [summaryCards[0], summaryCards[1]]
      },
      {
        type: "horizontal-stack",
        cards: [summaryCards[2], summaryCards[3]]
      }
    );
  }

  // Favoriten Section
  const favoriteEntities = (config.favorite_entities || [])
    .filter(entityId => hass.states[entityId] !== undefined);

  if (favoriteEntities.length > 0) {
    cards.push({
      type: "heading",
      heading: "Favoriten"
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
 * Erstellt die Bereiche-Section
 */
export function createAreasSection(visibleAreas) {
  return {
    type: "grid",
    cards: [
      {
        type: "heading",
        heading_style: "title",
        heading: "Bereiche"
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

/**
 * Erstellt die Wetter & Energie-Section
 */
export function createWeatherEnergySection(weatherEntity, showEnergy) {
  const cards = [];
  
  // Füge Weather Forecast hinzu, wenn eine Weather-Entität gefunden wurde
  if (weatherEntity) {
    cards.push({
      type: "heading",
      heading: "Wetter",
      heading_style: "title",
      icon: "mdi:weather-partly-cloudy"
    });
    cards.push({
      type: "weather-forecast",
      entity: weatherEntity,
      forecast_type: "daily"
    });
  }
  
  // Energie-Dashboard (nur wenn aktiviert)
  if (showEnergy) {
    cards.push({
      type: "heading",
      heading: "Energie",
      heading_style: "title",
      icon: "mdi:lightning-bolt"
    });
    cards.push({
      type: "energy-distribution",
      link_dashboard: true
    });
  }
  
  return {
    type: "grid",
    cards: cards
  };
}