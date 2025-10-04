// ====================================================================
// CARD GENERATOR - Zentrale Card-Erstellung
// ====================================================================

export class CardGenerator {
  /**
   * Erstellt eine Tile-Card
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
   * @param {Object} options - Optionen für die Summary-Card
   * @returns {Object} Summary Tile-Card
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
   * @param {Object} area - Area-Objekt
   * @param {Object} options - Zusätzliche Optionen
   * @returns {Object} Area-Card Konfiguration
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
   * @param {string} heading - Überschrift
   * @param {Object} options - Zusätzliche Optionen
   * @returns {Object} Heading-Card Konfiguration
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
    
    if (options.tap_action) {
      defaultConfig.tap_action = options.tap_action;
    }
    
    return { ...defaultConfig, ...options };
  }

  /**
   * Erstellt eine Grid-Section
   * @param {Array} cards - Array von Cards
   * @param {Object} options - Grid-Optionen
   * @returns {Object} Grid-Konfiguration
   */
  static createGridSection(cards, options = {}) {
    return {
      type: "grid",
      cards: cards,
      ...options
    };
  }

  /**
   * Erstellt eine Personen-Card
   * @param {Object} person - Personen-Objekt
   * @returns {Object} Person-Card Konfiguration
   */
  static createPersonCard(person) {
    return {
      type: "tile",
      entity: person.entity_id,
      show_entity_picture: true,
      vertical: true,
      tap_action: {
        action: "more-info"
      }
    };
  }

  /**
   * Erstellt eine Weather-Forecast Card
   * @param {string} entityId - Weather Entity ID
   * @returns {Object} Weather-Card Konfiguration
   */
  static createWeatherCard(entityId) {
    return {
      type: "weather-forecast",
      entity: entityId,
      forecast_type: "daily",
      show_current: true,
      show_forecast: true
    };
  }

  /**
   * Erstellt eine Energy-Distribution Card
   * @returns {Object} Energy-Card Konfiguration
   */
  static createEnergyCard() {
    return {
      type: "energy-distribution",
      link_dashboard: true
    };
  }

  /**
   * Erstellt Cards für einen Raum/Bereich
   * @param {Object} area - Area-Objekt
   * @param {Array} entities - Entities im Bereich
   * @param {Object} hass - Home Assistant Objekt
   * @returns {Array} Array von Cards
   */
  static createRoomCards(area, entities, hass) {
    const cards = [];
    const groupedEntities = this.groupEntitiesByDomain(entities, hass);
    
    // Lichter
    if (groupedEntities.lights.length > 0) {
      cards.push(this.createHeadingCard("Lichter", { 
        heading_style: "subtitle",
        icon: "mdi:lamps" 
      }));
      groupedEntities.lights.forEach(entity => {
        cards.push(this.createEntityCard(entity, hass));
      });
    }
    
    // Klima
    if (groupedEntities.climate.length > 0) {
      cards.push(this.createHeadingCard("Klima", { 
        heading_style: "subtitle",
        icon: "mdi:thermometer" 
      }));
      groupedEntities.climate.forEach(entity => {
        cards.push(this.createEntityCard(entity, hass));
      });
    }
    
    // Schalter
    if (groupedEntities.switches.length > 0) {
      cards.push(this.createHeadingCard("Schalter", { 
        heading_style: "subtitle",
        icon: "mdi:toggle-switch" 
      }));
      groupedEntities.switches.forEach(entity => {
        cards.push(this.createEntityCard(entity, hass));
      });
    }
    
    // Sensoren
    if (groupedEntities.sensors.length > 0) {
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
   * Erstellt eine Entity-Card basierend auf Domain
   * @param {string} entityId - Entity ID
   * @param {Object} hass - Home Assistant Objekt
   * @returns {Object} Entity-Card Konfiguration
   */
  static createEntityCard(entityId, hass) {
    const state = hass.states[entityId];
    if (!state) return null;
    
    const domain = entityId.split('.')[0];
    const deviceClass = state.attributes?.device_class;
    
    // Basis-Konfiguration
    let cardConfig = {
      type: "tile",
      entity: entityId
    };
    
    // Domain-spezifische Anpassungen
    switch (domain) {
      case 'light':
        cardConfig.features = [
          { type: "light-brightness" }
        ];
        if (state.attributes?.supported_color_modes?.includes('rgb')) {
          cardConfig.features.push({ type: "light-color-temp" });
        }
        break;
        
      case 'climate':
        cardConfig.features = [
          { type: "climate-hvac-modes" },
          { type: "target-temperature" }
        ];
        break;
        
      case 'cover':
        cardConfig.features = [
          { type: "cover-open-close" },
          { type: "cover-position" }
        ];
        break;
        
      case 'fan':
        cardConfig.features = [
          { type: "fan-speed" }
        ];
        break;
        
      case 'lock':
        cardConfig.features = [
          { type: "lock-open-door" }
        ];
        break;
        
      case 'media_player':
        return {
          type: "media-control",
          entity: entityId
        };
        
      case 'camera':
        return {
          type: "picture-entity",
          entity: entityId,
          camera_view: "live"
        };
    }
    
    return cardConfig;
  }

  /**
   * Erstellt eine Sensor-Card
   * @param {string} entityId - Entity ID
   * @param {Object} hass - Home Assistant Objekt
   * @returns {Object} Sensor-Card Konfiguration
   */
  static createSensorCard(entityId, hass) {
    const state = hass.states[entityId];
    if (!state) return null;
    
    const deviceClass = state.attributes?.device_class;
    
    // Für Graphen-fähige Sensoren
    const graphClasses = ['temperature', 'humidity', 'pressure', 'power', 'energy'];
    
    if (graphClasses.includes(deviceClass)) {
      return {
        type: "tile",
        entity: entityId,
        features: [
          { type: "sensor-value" }
        ],
        graph: "line"
      };
    }
    
    // Standard Sensor Tile
    return {
      type: "tile",
      entity: entityId
    };
  }

  /**
   * Gruppiert Entities nach Domain
   * @param {Array} entities - Array von Entity IDs
   * @param {Object} hass - Home Assistant Objekt
   * @returns {Object} Gruppierte Entities
   */
  static groupEntitiesByDomain(entities, hass) {
    const groups = {
      lights: [],
      climate: [],
      covers: [],
      switches: [],
      sensors: [],
      binary_sensors: [],
      media_players: [],
      cameras: [],
      others: []
    };
    
    entities.forEach(entityId => {
      const domain = entityId.split('.')[0];
      
      switch (domain) {
        case 'light':
          groups.lights.push(entityId);
          break;
        case 'climate':
        case 'water_heater':
          groups.climate.push(entityId);
          break;
        case 'cover':
          groups.covers.push(entityId);
          break;
        case 'switch':
        case 'input_boolean':
          groups.switches.push(entityId);
          break;
        case 'sensor':
        case 'input_number':
          groups.sensors.push(entityId);
          break;
        case 'binary_sensor':
          groups.binary_sensors.push(entityId);
          break;
        case 'media_player':
          groups.media_players.push(entityId);
          break;
        case 'camera':
          groups.cameras.push(entityId);
          break;
        default:
          groups.others.push(entityId);
      }
    });
    
    return groups;
  }

  /**
   * Erstellt eine Batterie-Status Card
   * @param {string} entityId - Entity ID
   * @param {Object} hass - Home Assistant Objekt
   * @param {number} batteryLevel - Batteriestand
   * @returns {Object} Battery-Card Konfiguration
   */
  static createBatteryCard(entityId, hass, batteryLevel) {
    const state = hass.states[entityId];
    const name = state?.attributes?.friendly_name || entityId.split('.')[1];
    
    return {
      type: "tile",
      entity: entityId,
      name: `${name} (${batteryLevel}%)`,
      icon: this.getBatteryIcon(batteryLevel),
      color: this.getBatteryColor(batteryLevel),
      tap_action: {
        action: "more-info"
      }
    };
  }

  /**
   * Ermittelt das passende Batterie-Icon
   * @param {number} level - Batteriestand in Prozent
   * @returns {string} Icon-Name
   */
  static getBatteryIcon(level) {
    if (level <= 10) return "mdi:battery-alert";
    if (level <= 20) return "mdi:battery-20";
    if (level <= 40) return "mdi:battery-40";
    if (level <= 60) return "mdi:battery-60";
    if (level <= 80) return "mdi:battery-80";
    return "mdi:battery";
  }

  /**
   * Ermittelt die passende Batterie-Farbe
   * @param {number} level - Batteriestand in Prozent
   * @returns {string} Farbe
   */
  static getBatteryColor(level) {
    if (level <= 20) return "red";
    if (level <= 40) return "orange";
    return "green";
  }
}