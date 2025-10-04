// ====================================================================
// CARD GENERATOR - Zentrale Card-Erstellung (Extended Version)
// ====================================================================

export class CardGenerator {
  /**
   * Erstellt eine Tile-Card (Basis)
   * @param {Object} config - Card-Konfiguration
   * @returns {Object} Tile-Card Konfiguration
   */
  static createTileCard(config) {
    const baseConfig = {
      type: "tile",
      hide_state: false,
      vertical: false
    };
    
    return { ...baseConfig, ...config };
  }

  /**
   * Erstellt eine Summary-Card für Navigation
   */
  static createSummaryCard(options) {
    const {
      icon,
      name,
      entity,
      color = 'grey',
      count = 0,
      path,
      showState = false
    } = options;
    
    return {
      type: "tile",
      icon: icon,
      name: name,
      entity: entity,
      color: count > 0 ? color : 'grey',
      hide_state: !showState,
      vertical: true,
      icon_tap_action: {
        action: "none"
      },
      tap_action: {
        action: "navigate",
        navigation_path: path
      }
    };
  }

  /**
   * Erstellt eine Area-Card
   */
  static createAreaCard(area, options = {}) {
    const defaultConfig = {
      type: "area",
      area: area.area_id,
      display_type: "compact",
      alert_classes: ["motion", "moisture", "occupancy"],
      sensor_classes: ["temperature", "humidity", "volatile_organic_compounds_parts"],
      features: [{ type: "area-controls" }],
      features_position: "inline",
      navigation_path: area.area_id,
      vertical: false
    };
    
    return { ...defaultConfig, ...options };
  }

  /**
   * Erstellt eine Heading-Card
   */
  static createHeadingCard(heading, options = {}) {
    const defaultConfig = {
      type: "heading",
      heading: heading,
      heading_style: "title"
    };
    
    if (options.icon) {
      defaultConfig.icon = options.icon;
    }
    
    if (options.badges) {
      defaultConfig.badges = options.badges;
    }
    
    if (options.tap_action) {
      defaultConfig.tap_action = options.tap_action;
    }
    
    return { ...defaultConfig, ...options };
  }

  /**
   * Erstellt eine Person-Card
   */
  static createPersonCard(person) {
    return {
      type: "tile",
      entity: person.entity_id,
      color: person.isHome ? 'green' : 'grey',
      vertical: true,
      icon_tap_action: {
        action: "none"
      }
    };
  }

  /**
   * Erstellt eine Wetter-Card
   */
  static createWeatherCard(weatherEntity) {
    return {
      type: "weather-forecast",
      entity: weatherEntity,
      forecast_type: "daily"
    };
  }

  /**
   * Erstellt eine Energie-Card
   */
  static createEnergyCard() {
    return {
      type: "energy-distribution",
      link_dashboard: true
    };
  }

  /**
   * Erstellt eine Light-Card mit Brightness Control
   */
  static createLightCard(entityId, options = {}) {
    return this.createTileCard({
      entity: entityId,
      features: [{ type: "light-brightness" }],
      features_position: "inline",
      ...options
    });
  }

  /**
   * Erstellt eine Cover-Card mit Position Control
   */
  static createCoverCard(entityId, options = {}) {
    return this.createTileCard({
      entity: entityId,
      features: [{ type: "cover-position" }],
      features_position: "inline",
      ...options
    });
  }

  /**
   * Erstellt eine Climate-Card mit Temperature Control
   */
  static createClimateCard(entityId, options = {}) {
    return this.createTileCard({
      entity: entityId,
      features: [
        { type: "climate-hvac-modes" },
        { type: "climate-preset-modes" }
      ],
      features_position: "inline",
      ...options
    });
  }

  /**
   * Erstellt eine Scene-Card
   */
  static createSceneCard(entityId, options = {}) {
    return this.createTileCard({
      entity: entityId,
      icon: "mdi:palette",
      color: "purple",
      vertical: true,
      tap_action: {
        action: "perform-action",
        perform_action: "scene.turn_on",
        target: {
          entity_id: entityId
        }
      },
      ...options
    });
  }

  /**
   * Erstellt eine Media Player Card
   */
  static createMediaPlayerCard(entityId, options = {}) {
    return this.createTileCard({
      entity: entityId,
      features: [{ type: "media-control" }],
      features_position: "inline",
      ...options
    });
  }

  /**
   * Erstellt eine Sensor-Card (mit Auto-Erkennung)
   */
  static createSensorCard(entityId, hass) {
    const state = hass.states[entityId];
    if (!state) return null;
    
    const config = {
      entity: entityId,
      vertical: false
    };
    
    // Binary Sensor spezielle Behandlung
    if (entityId.startsWith('binary_sensor.')) {
      const deviceClass = state.attributes?.device_class;
      if (deviceClass === 'door' || deviceClass === 'window' || deviceClass === 'opening') {
        config.color = state.state === 'on' ? 'red' : 'green';
      } else if (deviceClass === 'motion' || deviceClass === 'occupancy') {
        config.color = state.state === 'on' ? 'orange' : 'grey';
      }
    }
    
    return this.createTileCard(config);
  }

  /**
   * Erstellt Cards für einen Raum basierend auf gruppierten Entities
   * @param {Object} groupedEntities - Gruppierte Entity-IDs
   * @param {Object} hass - Home Assistant Objekt
   * @returns {Array} Array von Cards
   */
  static createRoomCards(groupedEntities, hass) {
    const cards = [];
    
    // Lichter
    if (groupedEntities.lights?.length > 0) {
      cards.push(this.createHeadingCard("Lichter", { 
        heading_style: "subtitle",
        icon: "mdi:lamps" 
      }));
      groupedEntities.lights.forEach(entity => {
        cards.push(this.createLightCard(entity));
      });
    }
    
    // Klima
    if (groupedEntities.climate?.length > 0) {
      cards.push(this.createHeadingCard("Klima", { 
        heading_style: "subtitle",
        icon: "mdi:thermometer" 
      }));
      groupedEntities.climate.forEach(entity => {
        cards.push(this.createClimateCard(entity));
      });
    }
    
    // Schalter
    if (groupedEntities.switches?.length > 0) {
      cards.push(this.createHeadingCard("Schalter", { 
        heading_style: "subtitle",
        icon: "mdi:toggle-switch" 
      }));
      groupedEntities.switches.forEach(entity => {
        cards.push(this.createTileCard({ entity }));
      });
    }
    
    // Sensoren
    if (groupedEntities.sensors?.length > 0) {
      cards.push(this.createHeadingCard("Sensoren", { 
        heading_style: "subtitle",
        icon: "mdi:eye" 
      }));
      groupedEntities.sensors.forEach(entity => {
        cards.push(this.createSensorCard(entity, hass));
      });
    }
    
    return cards;
  }

  /**
   * Erstellt eine Grid-Section
   * @param {Array} cards - Array von Cards
   * @param {Object} options - Zusätzliche Optionen
   * @returns {Object} Grid-Section
   */
  static createGridSection(cards, options = {}) {
    return {
      type: "grid",
      cards: cards,
      ...options
    };
  }

  /**
   * Erstellt eine Markdown-Card
   * @param {string} content - Markdown Content
   * @returns {Object} Markdown-Card
   */
  static createMarkdownCard(content) {
    return {
      type: "markdown",
      content: content
    };
  }

  /**
   * Erstellt eine Error-Card
   * @param {string} message - Fehlermeldung
   * @returns {Object} Error Markdown-Card
   */
  static createErrorCard(message) {
    return this.createMarkdownCard(`## ⚠️ Fehler\n\n${message}`);
  }

  /**
   * Erstellt eine Empty-State-Card
   * @param {string} title - Titel
   * @param {string} message - Nachricht
   * @param {string} icon - Icon (optional)
   * @returns {Object} Empty-State Markdown-Card
   */
  static createEmptyStateCard(title, message, icon = "🏠") {
    return this.createMarkdownCard(`## ${icon} ${title}\n\n${message}`);
  }
}
