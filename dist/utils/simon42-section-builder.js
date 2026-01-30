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
  const showCoversSummary = config.show_covers_summary !== false;

  // Füge Zusammenfassungen hinzu
  cards.push({
    type: "heading",
    heading: "Zusammenfassungen"
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
      heading: "Favoriten"
    });
    
    favoriteEntities.forEach(entityId => {
      cards.push({
        type: "tile",
        entity: entityId,
        show_entity_picture: true,
        vertical: false,
        features_position: "bottom"
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
          heading: "Weitere Bereiche",
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
 * Erstellt die Wetter & Energie-Section(s)
 * @param {string} weatherEntity - Weather Entity ID
 * @param {boolean} showWeather - Ob Wetter-Karte angezeigt werden soll
 * @param {boolean} showEnergy - Ob Energie-Dashboard angezeigt werden soll
 * @param {boolean} groupByFloors - Ob nach Etagen gruppiert wird
 * @returns {Array|Object|null} Section(s) oder null wenn keine Karten angezeigt werden
 */
export function createWeatherEnergySection(weatherEntity, showWeather, showEnergy, groupByFloors = false) {
  // Wenn Etagen-Gruppierung aktiv: Separate Sections zurückgeben
  if (groupByFloors) {
    const sections = [];
    
    // Weather Section (wenn vorhanden UND aktiviert)
    if (weatherEntity && showWeather) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: "Wetter",
            heading_style: "title",
            icon: "mdi:weather-partly-cloudy"
          },
          {
            type: "weather-forecast",
            entity: weatherEntity,
            forecast_type: "daily"
          }
        ]
      });
    }
    
    // Energie Section (wenn aktiviert)
    if (showEnergy) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: "Energie",
            heading_style: "title",
            icon: "mdi:lightning-bolt"
          },
          {
            type: "energy-distribution",
            link_dashboard: true
          }
        ]
      });
    }
    
    // Gib leeres Array zurück wenn keine Sections vorhanden
    return sections;
  }
  
  // Standard: Alles in einer Section (wie bisher)
  const cards = [];
  
  // Füge Weather Forecast hinzu, wenn eine Weather-Entität gefunden wurde UND aktiviert
  if (weatherEntity && showWeather) {
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
  
  // Gib null zurück wenn keine Karten vorhanden (verhindert leere Section)
  if (cards.length === 0) {
    return null;
  }
  
  return {
    type: "grid",
    cards: cards
  };
}
