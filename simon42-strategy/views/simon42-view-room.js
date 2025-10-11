// ====================================================================
// VIEW STRATEGY - RAUM (generiert Raum-Details mit Sensor-Badges) - OPTIMIERT
// ====================================================================
import { stripAreaName, isEntityHiddenOrDisabled, sortByLastChanged } from '../utils/simon42-helpers.js';

class Simon42ViewRoomStrategy {
  static async generate(config, hass) {
    const { area, devices, entities } = config;
    
    // Hole groups_options aus der Dashboard-Config (falls vorhanden)
    const groupsOptions = config.groups_options || {};
    
    // Finde alle Geräte im Raum - als Set für O(1) Lookup
    const areaDevices = new Set();
    for (const device of devices) {
      if (device.area_id === area.area_id) {
        areaDevices.add(device.id);
      }
    }

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

    // Labels für Filterung - als Set für O(1) Lookup
    const excludeLabels = new Set(
      entities
        .filter(e => e.labels?.includes("no_dboard"))
        .map(e => e.entity_id)
    );
    
    const showDboardLabels = new Set(
      entities
        .filter(e => e.labels?.includes("show_dboard"))
        .map(e => e.entity_id)
    );

    // OPTIMIERT: Hauptfilter-Loop
    for (const entity of entities) {
      const entityId = entity.entity_id;
      
      // 1. Prüfe ob Entität zum Raum gehört (früh ausschließen)
      let belongsToArea = false;
      
      if (entity.area_id) {
        belongsToArea = entity.area_id === area.area_id;
      } else if (entity.device_id && areaDevices.has(entity.device_id)) {
        belongsToArea = true;
      }
      
      if (!belongsToArea) continue;
      
      // 2. Exclude-Check (Set-Lookup = O(1))
      if (excludeLabels.has(entityId)) continue;

      // 3. State-Existence-Check
      const state = hass.states[entityId];
      if (!state) continue;

      // 4. Hidden/Disabled-Check
      if (isEntityHiddenOrDisabled(entity, hass)) continue;

      // 5. Domain-basierte Kategorisierung
      const domain = entityId.split('.')[0];
      const deviceClass = state.attributes?.device_class;
      const unit = state.attributes?.unit_of_measurement;

      // Kategorisiere nach Domain (frühe Returns für Performance)
      if (domain === 'light') {
        roomEntities.lights.push(entityId);
        continue;
      }
      
      if (domain === 'cover') {
        if (deviceClass === 'curtain' || deviceClass === 'blind') {
          roomEntities.covers_curtain.push(entityId);
        } else {
          roomEntities.covers.push(entityId);
        }
        continue;
      }
      
      if (domain === 'scene') {
        roomEntities.scenes.push(entityId);
        continue;
      }
      
      if (domain === 'climate') {
        roomEntities.climate.push(entityId);
        continue;
      }
      
      if (domain === 'media_player') {
        roomEntities.media_player.push(entityId);
        continue;
      }
      
      if (domain === 'vacuum') {
        roomEntities.vacuum.push(entityId);
        continue;
      }
      
      if (domain === 'fan') {
        roomEntities.fan.push(entityId);
        continue;
      }
      
      if (domain === 'switch') {
        roomEntities.switches.push(entityId);
        continue;
      }
      
      // === SENSOREN FÜR BADGES ===
      if (domain === 'sensor') {
        // Temperatur
        if (deviceClass === 'temperature' || unit === '°C' || unit === '°F') {
          sensorEntities.temperature.push(entityId);
          continue;
        }
        // Luftfeuchtigkeit
        if (deviceClass === 'humidity' || unit === '%') {
          sensorEntities.humidity.push(entityId);
          continue;
        }
        // Feinstaub PM2.5 (String-includes ist schneller als komplexe Checks)
        if (deviceClass === 'pm25' || entityId.includes('pm_2_5') || entityId.includes('pm25')) {
          sensorEntities.pm25.push(entityId);
          continue;
        }
        // Feinstaub PM10
        if (deviceClass === 'pm10' || entityId.includes('pm_10') || entityId.includes('pm10')) {
          sensorEntities.pm10.push(entityId);
          continue;
        }
        // CO2
        if (deviceClass === 'carbon_dioxide' || entityId.includes('co2')) {
          sensorEntities.co2.push(entityId);
          continue;
        }
        // VOC
        if (deviceClass === 'volatile_organic_compounds' || entityId.includes('voc')) {
          sensorEntities.voc.push(entityId);
          continue;
        }
        // Helligkeit
        if (deviceClass === 'illuminance' || unit === 'lx') {
          sensorEntities.illuminance.push(entityId);
          continue;
        }
        // Batterie (nur niedrige Werte < 20%)
        if (deviceClass === 'battery') {
          const batteryLevel = parseFloat(state.state);
          if (!isNaN(batteryLevel) && batteryLevel < 20) {
            sensorEntities.battery.push(entityId);
          }
          continue;
        }
      }
      
      // Binäre Sensoren
      if (domain === 'binary_sensor') {
        // Bewegung
        if (deviceClass === 'motion') {
          sensorEntities.motion.push(entityId);
          continue;
        }
        // Präsenz
        if (deviceClass === 'occupancy') {
          sensorEntities.occupancy.push(entityId);
        }
      }
    }

    // === WENDE GROUPS_OPTIONS AN ===
    // Filtere versteckte Entities aus groups_options
    const applyGroupFilter = (groupKey) => {
      const groupOptions = groupsOptions[groupKey];
      if (!groupOptions) return roomEntities[groupKey];
      
      let filtered = roomEntities[groupKey];
      
      // Filtere versteckte Entities
      if (groupOptions.hidden && groupOptions.hidden.length > 0) {
        const hiddenSet = new Set(groupOptions.hidden);
        filtered = filtered.filter(e => !hiddenSet.has(e));
      }
      
      // Sortiere nach order (falls vorhanden)
      if (groupOptions.order && groupOptions.order.length > 0) {
        const orderMap = new Map(groupOptions.order.map((id, index) => [id, index]));
        filtered.sort((a, b) => {
          const indexA = orderMap.has(a) ? orderMap.get(a) : 9999;
          const indexB = orderMap.has(b) ? orderMap.get(b) : 9999;
          return indexA - indexB;
        });
      }
      
      return filtered;
    };

    // Wende Filter auf alle Gruppen an
    roomEntities.lights = applyGroupFilter('lights');
    roomEntities.covers = applyGroupFilter('covers');
    roomEntities.covers_curtain = applyGroupFilter('covers_curtain');
    roomEntities.scenes = applyGroupFilter('scenes');
    roomEntities.climate = applyGroupFilter('climate');
    roomEntities.media_player = applyGroupFilter('media_player');
    roomEntities.vacuum = applyGroupFilter('vacuum');
    roomEntities.fan = applyGroupFilter('fan');
    roomEntities.switches = applyGroupFilter('switches');

    // === BADGES ERSTELLEN ===
    const badges = [];

    // Priorisiere Temperatur und Luftfeuchtigkeit aus area.temperature_entity_id und area.humidity_entity_id
    // wenn diese existieren und im Raum sind
    let primaryTempSensor = null;
    let primaryHumiditySensor = null;

    // Prüfe ob area Attribute für Temperatur/Luftfeuchtigkeit gesetzt sind
    if (area.temperature_entity_id && 
        hass.states[area.temperature_entity_id] && 
        !excludeLabels.has(area.temperature_entity_id)) {
      // Prüfe ob versteckt über hass.entities
      const entityRegistry = hass.entities?.[area.temperature_entity_id];
      if (!entityRegistry || (!entityRegistry.hidden_by && !entityRegistry.disabled_by)) {
        primaryTempSensor = area.temperature_entity_id;
      }
    }

    if (area.humidity_entity_id && 
        hass.states[area.humidity_entity_id] && 
        !excludeLabels.has(area.humidity_entity_id)) {
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

    // Sortiere Lights nach last_changed (nur wenn keine custom order vorhanden)
    if (!groupsOptions.lights?.order) {
      roomEntities.lights.sort((a, b) => sortByLastChanged(a, b, hass));
    }

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
            name: stripAreaName(entity, area, hass),
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
            name: stripAreaName(entity, area, hass),
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
            name: stripAreaName(entity, area, hass),
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
            name: stripAreaName(entity, area, hass),
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
            name: stripAreaName(entity, area, hass),
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
            name: stripAreaName(entity, area, hass),
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
        name: stripAreaName(entity, area, hass),
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
        name: stripAreaName(entity, area, hass),
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
        name: stripAreaName(entity, area, hass),
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