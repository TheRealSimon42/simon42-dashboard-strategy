// ====================================================================
// SECTION BUILDER - Erstellt Dashboard-Sections
// ====================================================================

/**
 * Erstellt die Übersichts-Section mit Zusammenfassungen
 */
export function createOverviewSection(data) {
  const { lightsOn, coversOpen, securityUnsafe, batteriesCritical, someSensorId } = data;
  
  return {
    type: "grid",
    cards: [
      {
        type: "heading",
        heading: "Übersicht",
        heading_style: "title",
        icon: "mdi:overscan"
      },
      {
        type: "clock",
        clock_size: "small",
        show_seconds: false,
        grid_options: {
          columns: "full",
        }
      },
      // Zusammenfassungen
      {
        type: "heading",
        heading: "Zusammenfassungen"
      },
      // Lichter Summary
      {
        type: "tile",
        icon: "mdi:lamps",
        name: lightsOn.length > 0 ? `${lightsOn.length} ${lightsOn.length === 1 ? 'Licht an' : 'Lichter an'}` : 'Alle Lichter aus',
        entity: lightsOn.length > 0 ? lightsOn[0].entity_id : someSensorId,
        color: lightsOn.length > 0 ? 'orange' : 'grey',
        hide_state: true,
        vertical: true,
        icon_tap_action: {
          action: "none",
        },
        tap_action: {
          action: "navigate",
          navigation_path: "lights",
        }
      },
      // Covers Summary
      {
        type: "tile",
        icon: "mdi:blinds-horizontal",
        name: coversOpen.length > 0 ? `${coversOpen.length} ${coversOpen.length === 1 ? 'Rollo offen' : 'Rollos offen'}` : 'Alle Rollos geschlossen',
        entity: coversOpen.length > 0 ? coversOpen[0].entity_id : someSensorId,
        color: coversOpen.length > 0 ? 'purple' : 'grey',
        hide_state: true,
        vertical: true,
        icon_tap_action: {
          action: "none",
        },
        tap_action: {
          action: "navigate",
          navigation_path: "covers",
        }
      },
      // Security Summary
      {
        type: "tile",
        icon: "mdi:security",
        name: securityUnsafe.length > 0 ? `${securityUnsafe.length} unsicher` : 'Alles gesichert',
        entity: securityUnsafe.length > 0 ? securityUnsafe[0] : someSensorId,
        color: securityUnsafe.length > 0 ? 'yellow' : 'grey',
        hide_state: true,
        vertical: true,
        icon_tap_action: {
          action: "none",
        },
        tap_action: {
          action: "navigate",
          navigation_path: "security",
        }
      },
      // Batterie Summary
      {
        type: "tile",
        icon: batteriesCritical.length > 0 ? "mdi:battery-alert" : 'mdi:battery-charging',
        name: batteriesCritical.length > 0 ? `${batteriesCritical.length} ${batteriesCritical.length === 1 ? 'Batterie kritisch' : 'Batterien kritisch'}` : 'Alle Batterien OK',
        entity: batteriesCritical.length > 0 ? batteriesCritical[0] : someSensorId,
        color: batteriesCritical.length > 0 ? 'red' : 'green',
        hide_state: true,
        vertical: true,
        icon_tap_action: {
          action: "none",
        },
        tap_action: {
          action: "navigate",
          navigation_path: "batteries",
        }
      }
    ]
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