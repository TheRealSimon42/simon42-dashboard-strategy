// ====================================================================
// VIEW STRATEGY - RAUM (generiert Raum-Details mit Sensor-Badges)
// ====================================================================
class Simon42ViewRoomStrategy {
  static async generate(config, hass) {
    const { area, devices, entities } = config;
    
    // Finde alle Geräte im Raum
    const areaDevices = new Set();
    for (const device of devices) {
      if (device.area_id === area.area_id) {
        areaDevices.add(device.id);
      }
    }

    // Helper-Funktion zum Sortieren nach last_changed
    const sortByLastChanged = (a, b) => {
      const stateA = hass.states[a];
      const stateB = hass.states[b];
      if (!stateA || !stateB) return 0;
      const dateA = new Date(stateA.last_changed);
      const dateB = new Date(stateB.last_changed);
      return dateB - dateA; // Neueste zuerst
    };

    // Helper-Funktion: Raumnamen aus Entity-Namen entfernen
    const stripAreaName = (entityId) => {
      const state = hass.states[entityId];
      if (!state) return null;
      
      let name = state.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
      const areaName = area.name;
      
      if (areaName && name) {
        // Entferne Raumnamen am Anfang, Ende oder in der Mitte
        const cleanName = name
          .replace(new RegExp(`^${areaName}\\s+`, 'i'), '')  // Am Anfang
          .replace(new RegExp(`\\s+${areaName}$`, 'i'), '')  // Am Ende
          .replace(new RegExp(`\\s+${areaName}\\s+`, 'i'), ' ')  // In der Mitte
          .trim();
        
        // Nur verwenden wenn noch ein sinnvoller Name übrig ist
        if (cleanName && cleanName.length > 0 && cleanName.toLowerCase() !== areaName.toLowerCase()) {
          return cleanName;
        }
      }
      
      return name;
    };

    // Helper-Funktion: Prüfe ob Entität versteckt oder deaktiviert ist
    const isEntityHiddenOrDisabled = (entity) => {
      // Prüfe direkt im entity-Objekt (aus der Entity Registry)
      if (entity.hidden_by) {
        return true;
      }
      
      if (entity.disabled_by) {
        return true;
      }
      
      // Zusätzlich auch in hass.entities prüfen (falls vorhanden)
      const entityRegistry = hass.entities?.[entity.entity_id];
      if (entityRegistry) {
        if (entityRegistry.hidden_by) {
          return true;
        }
        
        if (entityRegistry.disabled_by) {
          return true;
        }
      }
      
      return false;
    };

    // Finde alle Entitäten im Raum und gruppiere nach Domain
    const roomEntities = {
      lights: [],
      covers: [],
      covers_curtain: [],
      scenes: [],
      climate: [],
      media_player: [],
      vacuum: [],
      fan: [],
      switches: []
    };

    // Sensor-Kategorien für Badges
    const sensorEntities = {
      temperature: [],
      humidity: [],
      pm25: [],        // Feinstaub PM2.5
      pm10: [],        // Feinstaub PM10
      co2: [],         // CO2
      voc: [],         // VOC (flüchtige organische Verbindungen)
      motion: [],      // Bewegungsmelder
      occupancy: [],   // Präsenzmelder
      illuminance: [], // Helligkeit
      battery: []      // Batterie (nur niedrige Werte)
    };

    // Labels für Filterung
    const excludeLabels = entities
      .filter(e => e.labels?.includes("no_dboard"))
      .map(e => e.entity_id);
    
    const showDboardLabels = entities
      .filter(e => e.labels?.includes("show_dboard"))
      .map(e => e.entity_id);

    for (const entity of entities) {
      // Prüfe ob Entität zum Raum gehört
      // Fall 1: Entität hat direkte Area-Zuweisung -> nur diese zählt
      // Fall 2: Entität hat keine Area-Zuweisung -> verwende Area vom Gerät
      let belongsToArea = false;
      
      if (entity.area_id) {
        // Entität hat explizite Area-Zuweisung
        belongsToArea = entity.area_id === area.area_id;
      } else if (entity.device_id && areaDevices.has(entity.device_id)) {
        // Entität hat keine Area-Zuweisung, aber Gerät ist im Raum
        belongsToArea = true;
      }
      
      if (!belongsToArea) continue;
      
      // Exkludiere no_dboard Entitäten
      if (excludeLabels.includes(entity.entity_id)) continue;

      // Prüfe ob Entität in hass.states existiert
      if (!hass.states[entity.entity_id]) continue;

      // NEUE PRÜFUNG: Filtere versteckte und deaktivierte Entitäten
      if (isEntityHiddenOrDisabled(entity)) continue;

      const domain = entity.entity_id.split('.')[0];
      const state = hass.states[entity.entity_id];
      const deviceClass = state.attributes?.device_class;
      const unit = state.attributes?.unit_of_measurement;

      // Kategorisiere nach Domain
      if (domain === 'light') {
        roomEntities.lights.push(entity.entity_id);
      } 
      else if (domain === 'cover') {
        if (deviceClass === 'curtain' || deviceClass === 'blind') {
          roomEntities.covers_curtain.push(entity.entity_id);
        } else {
          roomEntities.covers.push(entity.entity_id);
        }
      }
      else if (domain === 'scene') {
        roomEntities.scenes.push(entity.entity_id);
      }
      else if (domain === 'climate') {
        roomEntities.climate.push(entity.entity_id);
      }
      else if (domain === 'media_player') {
        roomEntities.media_player.push(entity.entity_id);
      }
      else if (domain === 'vacuum') {
        roomEntities.vacuum.push(entity.entity_id);
      }
      else if (domain === 'fan') {
        roomEntities.fan.push(entity.entity_id);
      }
      else if (domain === 'switch') {
        roomEntities.switches.push(entity.entity_id);
      }
      
      // === SENSOREN FÜR BADGES ===
      else if (domain === 'sensor') {
        // Temperatur
        if (deviceClass === 'temperature' || unit === '°C' || unit === '°F') {
          sensorEntities.temperature.push(entity.entity_id);
        }
        // Luftfeuchtigkeit
        else if (deviceClass === 'humidity' || unit === '%') {
          sensorEntities.humidity.push(entity.entity_id);
        }
        // Feinstaub PM2.5
        else if (deviceClass === 'pm25' || entity.entity_id.includes('pm_2_5') || entity.entity_id.includes('pm25')) {
          sensorEntities.pm25.push(entity.entity_id);
        }
        // Feinstaub PM10
        else if (deviceClass === 'pm10' || entity.entity_id.includes('pm_10') || entity.entity_id.includes('pm10')) {
          sensorEntities.pm10.push(entity.entity_id);
        }
        // CO2
        else if (deviceClass === 'carbon_dioxide' || entity.entity_id.includes('co2')) {
          sensorEntities.co2.push(entity.entity_id);
        }
        // VOC
        else if (deviceClass === 'volatile_organic_compounds' || entity.entity_id.includes('voc')) {
          sensorEntities.voc.push(entity.entity_id);
        }
        // Helligkeit
        else if (deviceClass === 'illuminance' || unit === 'lx') {
          sensorEntities.illuminance.push(entity.entity_id);
        }
        // Batterie (nur niedrige Werte < 20%)
        else if (deviceClass === 'battery') {
          const batteryLevel = parseFloat(state.state);
          if (!isNaN(batteryLevel) && batteryLevel < 20) {
            sensorEntities.battery.push(entity.entity_id);
          }
        }
      }
      // Binäre Sensoren
      else if (domain === 'binary_sensor') {
        // Bewegung
        if (deviceClass === 'motion') {
          sensorEntities.motion.push(entity.entity_id);
        }
        // Präsenz
        else if (deviceClass === 'occupancy') {
          sensorEntities.occupancy.push(entity.entity_id);
        }
      }
    }

    // === BADGES ERSTELLEN ===
    const badges = [];

    // Priorisiere Temperatur und Luftfeuchtigkeit aus area.temperature_entity_id und area.humidity_entity_id
    // wenn diese existieren und im Raum sind
    let primaryTempSensor = null;
    let primaryHumiditySensor = null;

    // Prüfe ob area Attribute für Temperatur/Luftfeuchtigkeit gesetzt sind
    if (area.temperature_entity_id && 
        hass.states[area.temperature_entity_id] && 
        !excludeLabels.includes(area.temperature_entity_id)) {
      // Prüfe ob versteckt über hass.entities
      const entityRegistry = hass.entities?.[area.temperature_entity_id];
      if (!entityRegistry || (!entityRegistry.hidden_by && !entityRegistry.disabled_by)) {
        primaryTempSensor = area.temperature_entity_id;
      }
    }

    if (area.humidity_entity_id && 
        hass.states[area.humidity_entity_id] && 
        !excludeLabels.includes(area.humidity_entity_id)) {
      // Prüfe ob versteckt über hass.entities
      const entityRegistry = hass.entities?.[area.humidity_entity_id];
      if (!entityRegistry || (!entityRegistry.hidden_by && !entityRegistry.disabled_by)) {
        primaryHumiditySensor = area.humidity_entity_id;
      }
    }

    // Temperatur Badge
    const tempSensor = primaryTempSensor || sensorEntities.temperature[0];
    if (tempSensor) {
      badges.push({
        type: "entity",
        entity: tempSensor,
        color: "red",
        tap_action: { action: "more-info" }
      });
    }

    // Luftfeuchtigkeit Badge
    const humiditySensor = primaryHumiditySensor || sensorEntities.humidity[0];
    if (humiditySensor) {
      badges.push({
        type: "entity",
        entity: humiditySensor,
        color: "indigo",
        tap_action: { action: "more-info" }
      });
    }

    // Feinstaub PM2.5
    if (sensorEntities.pm25.length > 0) {
      badges.push({
        type: "entity",
        entity: sensorEntities.pm25[0],
        color: "orange",
        tap_action: { action: "more-info" }
      });
    }

    // Feinstaub PM10
    if (sensorEntities.pm10.length > 0) {
      badges.push({
        type: "entity",
        entity: sensorEntities.pm10[0],
        color: "orange",
        tap_action: { action: "more-info" }
      });
    }

    // CO2
    if (sensorEntities.co2.length > 0) {
      badges.push({
        type: "entity",
        entity: sensorEntities.co2[0],
        color: "green",
        tap_action: { action: "more-info" }
      });
    }

    // VOC
    if (sensorEntities.voc.length > 0) {
      badges.push({
        type: "entity",
        entity: sensorEntities.voc[0],
        color: "purple",
        tap_action: { action: "more-info" }
      });
    }

    // Bewegung (zeige Badge nur wenn Bewegung erkannt)
    const activeMotion = sensorEntities.motion.filter(id => {
      const state = hass.states[id];
      return state && state.state === 'on';
    });
    if (activeMotion.length > 0) {
      badges.push({
        type: "entity",
        entity: activeMotion[0],
        color: "yellow",
        tap_action: { action: "more-info" }
      });
    }

    // Präsenz (zeige Badge nur wenn Präsenz erkannt)
    const activeOccupancy = sensorEntities.occupancy.filter(id => {
      const state = hass.states[id];
      return state && state.state === 'on';
    });
    if (activeOccupancy.length > 0) {
      badges.push({
        type: "entity",
        entity: activeOccupancy[0],
        color: "cyan",
        tap_action: { action: "more-info" }
      });
    }

    // Helligkeit
    if (sensorEntities.illuminance.length > 0) {
      badges.push({
        type: "entity",
        entity: sensorEntities.illuminance[0],
        color: "amber",
        tap_action: { action: "more-info" }
      });
    }

    // Batterie (niedrige Werte)
    if (sensorEntities.battery.length > 0) {
      badges.push({
        type: "entity",
        entity: sensorEntities.battery[0],
        color: "red",
        tap_action: { action: "more-info" }
      });
    }

    // === HAUPTINHALT - SECTIONS ===
    const sections = [];

    // Sortiere Lights nach last_changed
    roomEntities.lights.sort(sortByLastChanged);

    // Licht-Section
    if (roomEntities.lights.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: "Beleuchtung",
            heading_style: "title",
            icon: "mdi:lightbulb"
          },
          ...roomEntities.lights.map(entity => ({
            type: "tile",
            entity: entity,
            name: stripAreaName(entity),
            features: [{ type: "light-brightness" }],
            vertical: false,
            features_position: "inline",
            state_content: "last_changed"
          }))
        ]
      });
    }

    // Klima-Section
    if (roomEntities.climate.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: "Klima",
            heading_style: "title",
            icon: "mdi:thermostat"
          },
          ...roomEntities.climate.map(entity => ({
            type: "tile",
            entity: entity,
            name: stripAreaName(entity),
            features: [
              { type: "climate-hvac-modes" }
            ],
            features_position: "inline",
            vertical: false,
            state_content: ["hvac_action", "current_temperature"]
          }))
        ]
      });
    }

    // Rollos/Jalousien
    if (roomEntities.covers.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: "Rollos & Jalousien",
            heading_style: "title",
            icon: "mdi:window-shutter"
          },
          ...roomEntities.covers.map(entity => ({
            type: "tile",
            entity: entity,
            name: stripAreaName(entity),
            features: [{ type: "cover-open-close" }],
            vertical: false,
            features_position: "inline",
            state_content: ["current_position", "last_changed"]
          }))
        ]
      });
    }

    // Vorhänge
    if (roomEntities.covers_curtain.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: "Vorhänge",
            heading_style: "title",
            icon: "mdi:curtains"
          },
          ...roomEntities.covers_curtain.map(entity => ({
            type: "tile",
            entity: entity,
            name: stripAreaName(entity),
            features: [{ type: "cover-open-close" }],
            vertical: false,
            features_position: "inline",
            state_content: ["current_position", "last_changed"]
          }))
        ]
      });
    }

    // Media Player
    if (roomEntities.media_player.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: "Medien",
            heading_style: "title",
            icon: "mdi:speaker"
          },
          ...roomEntities.media_player.map(entity => ({
            type: "tile",
            entity: entity,
            name: stripAreaName(entity),
            vertical: false,
            features: [{ type: "media-player-playback" }],
            features_position: "inline",
            state_content: ["media_title", "media_artist"]
          }))
        ]
      });
    }

    // Szenen
    if (roomEntities.scenes.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: "Szenen",
            heading_style: "title",
            icon: "mdi:palette"
          },
          ...roomEntities.scenes.map(entity => ({
            type: "tile",
            entity: entity,
            name: stripAreaName(entity),
            vertical: false,
            state_content: "last_changed"
          }))
        ]
      });
    }

    // Sonstiges (Vacuum, Fan, Switches)
    const miscCards = [];

    // Vacuum mit Commands
    roomEntities.vacuum.forEach(entity => {
      miscCards.push({
        type: "tile",
        entity: entity,
        name: stripAreaName(entity),
        features: [{ type: "vacuum-commands" }],
        features_position: "inline",
        vertical: false,
        state_content: "last_changed"
      });
    });

    // Fan mit Speed Control
    roomEntities.fan.forEach(entity => {
      miscCards.push({
        type: "tile",
        entity: entity,
        name: stripAreaName(entity),
        features: [{ type: "fan-speed" }],
        features_position: "inline",
        vertical: false,
        state_content: "last_changed"
      });
    });

    // Switches
    roomEntities.switches.forEach(entity => {
      miscCards.push({
        type: "tile",
        entity: entity,
        name: stripAreaName(entity),
        vertical: false,
        state_content: "last_changed"
      });
    });

    // Sortiere miscCards nach last_changed
    miscCards.sort((a, b) => {
      const stateA = hass.states[a.entity];
      const stateB = hass.states[b.entity];
      if (!stateA || !stateB) return 0;
      const dateA = new Date(stateA.last_changed);
      const dateB = new Date(stateB.last_changed);
      return dateB - dateA;
    });

    if (miscCards.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: "Sonstiges",
            heading_style: "title",
            icon: "mdi:dots-horizontal"
          },
          ...miscCards
        ]
      });
    }

    return {
      type: "sections",
      header: {
        badges_position: "bottom"
      },
      sections: sections,
      badges: badges
    };
  }
}

// Registriere Custom Element
customElements.define("ll-strategy-simon42-view-room", Simon42ViewRoomStrategy);