// ====================================================================
// VIEW STRATEGY - RAUM (generiert Raum-Details mit Sensor-Badges) - OPTIMIERT + KAMERAS
// ====================================================================
import { stripAreaName, isEntityHiddenOrDisabled, sortByLastChanged, isCameraStreamAvailable, getExcludedLabels } from '../utils/helpers/simon42-helpers.js';
import { t, initLanguage } from '../utils/i18n/simon42-i18n.js';
import { filterByArea, filterEntities } from '../utils/filters/simon42-entity-filter.js';
import { getHiddenEntitiesFromConfig } from '../utils/data/simon42-data-collectors.js';

/**
 * Prüft ob eine Entity eine Better Thermostat Entity ist
 * @param {string} entityId - Entity ID
 * @param {Object} hass - Home Assistant Objekt
 * @returns {boolean} True wenn es eine Better Thermostat Entity ist
 */
function isBetterThermostatEntity(entityId, hass) {
  if (!entityId.startsWith('climate.')) {
    return false;
  }
  
  const entity = hass.entities?.[entityId];
  return entity?.platform === 'better_thermostat';
}

class Simon42ViewRoomStrategy {
  static async generate(config, hass) {
    const { area, devices, entities } = config;
    
    // Hole Dashboard-Config für Raum-Pins (wird über ViewBuilder übergeben)
    const dashboardConfig = config.dashboardConfig || {};
    
    // Initialisiere Sprache (falls noch nicht geschehen)
    initLanguage(dashboardConfig, hass);
    
    // Hole groups_options aus der Dashboard-Config (falls vorhanden)
    const groupsOptions = config.groups_options || {};
    
    // Helper-Funktion für Entity-Namen mit Config-Unterstützung
    const getEntityName = (entityId) => stripAreaName(entityId, area, hass, dashboardConfig);
    
    // Finde alle Geräte im Raum - als Set für O(1) Lookup
    const areaDevices = new Set();
    const areaDeviceObjects = []; // Speichere Device-Objekte für Reolink-Check
    for (const device of devices) {
      if (device.area_id === area.area_id) {
        areaDevices.add(device.id);
        areaDeviceObjects.push(device);
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
      switches: [],
      cameras: [] // NEU: Kameras
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
    const excludeLabels = new Set(getExcludedLabels(entities));
    
    const showDboardLabels = new Set(
      entities
        .filter(e => e.labels?.includes("show_dboard"))
        .map(e => e.entity_id)
    );

    // Map für Device-ID zu Entity-ID (für Reolink-Zuordnung)
    const entityDeviceMap = new Map();
    for (const entity of entities) {
      if (entity.device_id) {
        if (!entityDeviceMap.has(entity.device_id)) {
          entityDeviceMap.set(entity.device_id, []);
        }
        entityDeviceMap.get(entity.device_id).push(entity.entity_id);
      }
    }

    // REFACTORED: Use centralized filtering utilities
    // Step 1: Filter by area using centralized utility
    const areaFilteredEntities = filterByArea(entities, area.area_id, areaDevices);
    
    // Step 2: Get hidden entities from config using centralized utility
    // Note: This gets ALL hidden entities from all areas, but we filter by area first
    // so only entities in this area will be affected
    const hiddenFromConfig = getHiddenEntitiesFromConfig(dashboardConfig);
    
    // Step 3: Apply centralized filtering with custom filter for battery sensor handling
    // Note: We use checkRegistry: false and handle registry checks in customFilter
    // because battery sensors need special handling (ignore hidden_by)
    const filteredEntityIds = filterEntities(areaFilteredEntities, {
      excludeLabels,
      hiddenFromConfig,
      hass,
      checkRegistry: false, // Handle manually in customFilter for battery sensor special case
      checkState: true,
      customFilter: (entity, hass) => {
        const entityId = entity.entity_id;
        const state = hass.states[entityId];
        // Enhanced battery detection (case-insensitive, multiple patterns)
        const entityIdLower = entityId.toLowerCase();
        const deviceClass = state?.attributes?.device_class;
        const unitOfMeasurement = state?.attributes?.unit_of_measurement;
        
        const isBatterySensor = 
          entityIdLower.includes('battery') ||
          deviceClass === 'battery' ||
          (deviceClass === null && unitOfMeasurement === '%' && 
           (entityIdLower.includes('battery') || entityIdLower.includes('charge') || entityIdLower.includes('level')));
        
        if (isBatterySensor) {
          // Battery sensor special handling: Only check manual hidden, ignore hidden_by
          // Note: Battery sensors are often marked as 'diagnostic', but we still want to show them
          // (consistent with Battery-View and Summary)
          if (entity.hidden === true) return false;
          if (entity.disabled_by) return false;
          // Only exclude config category, NOT diagnostic (batteries are often diagnostic)
          if (entity.entity_category === 'config') return false;
          // Check state attributes entity_category too (only exclude config, not diagnostic)
          if (state?.attributes?.entity_category === 'config') return false;
          return true;
        } else {
          // For all others: Use full hidden/disabled check
          return !isEntityHiddenOrDisabled(entity, hass);
        }
      }
    });

    // Step 4: Create entity map for quick lookup
    const entityMap = new Map(entities.map(e => [e.entity_id, e]));

    // Step 5: Categorize filtered entities by domain
    for (const entityId of filteredEntityIds) {
      const entity = entityMap.get(entityId);
      if (!entity) continue;
      
      const state = hass.states[entityId];
      if (!state) continue;

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
      
      // NEU: Kamera-Erkennung
      if (domain === 'camera') {
        roomEntities.cameras.push(entityId);
        continue;
      }
      
      // === SENSOREN FÜR BADGES ===
      if (domain === 'sensor') {
        // Batterie (nur niedrige Werte < 20%) - ZUERST prüfen, bevor % für Humidity matcht!
        // Enhanced battery detection (case-insensitive, multiple patterns)
        const entityIdLower = entityId.toLowerCase();
        const unitOfMeasurement = state.attributes?.unit_of_measurement;
        const isBatterySensor = 
          entityIdLower.includes('battery') ||
          deviceClass === 'battery' ||
          (deviceClass === null && unitOfMeasurement === '%' && 
           (entityIdLower.includes('battery') || entityIdLower.includes('charge') || entityIdLower.includes('level')));
        
        if (isBatterySensor) {
          const batteryLevel = parseFloat(state.state);
          if (!isNaN(batteryLevel) && batteryLevel < 20) {
            sensorEntities.battery.push(entityId);
          }
          continue;
        }
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
      }
      
      // Binäre Sensoren
      if (domain === 'binary_sensor') {
        // Bewegung
        if (deviceClass === 'motion') {
          sensorEntities.motion.push(entityId);
          continue;
        }
        // Präsenz
        if (deviceClass === 'presence') {
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
    roomEntities.cameras = applyGroupFilter('cameras'); // NEU

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

    // NEU: Kameras-Section (ganz oben nach Badges)
    if (roomEntities.cameras.length > 0) {
      const cameraCards = [];
      
      roomEntities.cameras.forEach(cameraId => {
        const cameraState = hass.states[cameraId];
        if (!cameraState) return;
        
        // Prüfe ob der Stream verfügbar ist (z.B. nicht im Privacy-Modus)
        if (!isCameraStreamAvailable(cameraId, hass)) return;
        
        // Finde Device-ID der Kamera
        const cameraEntity = entities.find(e => e.entity_id === cameraId);
        const deviceId = cameraEntity?.device_id;
        
        // Prüfe ob es ein Reolink-Gerät ist
        let isReolink = false;
        if (deviceId) {
          const device = devices.find(d => d.id === deviceId);
          if (device) {
            // Prüfe Manufacturer oder Model
            const manufacturer = device.manufacturer?.toLowerCase() || '';
            const model = device.model?.toLowerCase() || '';
            isReolink = manufacturer.includes('reolink') || model.includes('reolink');
          }
        }
        
        if (isReolink && deviceId) {
          // Reolink: picture-glance mit zusätzlichen Entitäten
          const deviceEntities = entityDeviceMap.get(deviceId) || [];
          
          // Suche spezifische Entitäten des gleichen Geräts
          const spotlightEntity = deviceEntities.find(id => 
            id.startsWith('light.') && 
            hass.states[id] && 
            !excludeLabels.has(id)
          );
          
          const motionEntity = deviceEntities.find(id => 
            id.startsWith('binary_sensor.') && 
            hass.states[id]?.attributes?.device_class === 'motion' &&
            !excludeLabels.has(id)
          );
          
          const sirenEntity = deviceEntities.find(id => 
            id.startsWith('siren.') && 
            hass.states[id] &&
            !excludeLabels.has(id)
          );
          
          // Baue entities-Array (nur verfügbare Entities)
          const glanceEntities = [];
          if (spotlightEntity) glanceEntities.push({ entity: spotlightEntity });
          if (motionEntity) glanceEntities.push({ entity: motionEntity });
          if (sirenEntity) glanceEntities.push({ entity: sirenEntity });
          
          cameraCards.push({
            type: "picture-glance",
            camera_image: cameraId,
            camera_view: "auto",
            fit_mode: "cover",
            title: getEntityName(cameraId),
            entities: glanceEntities
          });
        } else {
          // Standard-Kamera: picture-entity
          cameraCards.push({
            type: "picture-entity",
            entity: cameraId,
            camera_image: cameraId,
            camera_view: "auto",
            name: getEntityName(cameraId),
            show_name: true,
            show_state: false
          });
        }
      });
      
      if (cameraCards.length > 0) {
        sections.push({
          type: "grid",
          cards: [
            {
              type: "heading",
              heading: t('cameras'),
              heading_style: "title",
              icon: "mdi:cctv"
            },
            ...cameraCards
          ]
        });
      }
    }

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
            heading: t('lighting'),
            heading_style: "title",
            icon: "mdi:lightbulb"
          },
          ...roomEntities.lights.map(entity => ({
            type: "tile",
            entity: entity,
            name: getEntityName(entity),
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
      // Prüfe ob Better Thermostat aktiviert ist
      const showBetterThermostat = dashboardConfig.show_better_thermostat === true;
      
      // Wenn Better Thermostat aktiviert ist, trenne Better Thermostat und Standard-Thermostate
      if (showBetterThermostat) {
        const betterThermostatEntities = [];
        const standardThermostatEntities = [];
        
        roomEntities.climate.forEach(entityId => {
          const isBT = isBetterThermostatEntity(entityId, hass);
          if (isBT) {
            betterThermostatEntities.push(entityId);
          } else {
            standardThermostatEntities.push(entityId);
          }
        });
        
        // Better Thermostat Cards
        if (betterThermostatEntities.length > 0) {
          sections.push({
            type: "grid",
            cards: [
              {
                type: "heading",
                heading: t('climate'),
                heading_style: "title",
                icon: "mdi:thermostat"
              },
              ...betterThermostatEntities.map(entityId => ({
                type: "custom:better-thermostat-ui-card",
                entity: entityId,
                name: getEntityName(entityId)
              }))
            ]
          });
        }
        
        // Standard Thermostat Cards (nur wenn es auch Standard-Thermostate gibt)
        if (standardThermostatEntities.length > 0) {
          sections.push({
            type: "grid",
            cards: [
              ...(betterThermostatEntities.length === 0 ? [{
                type: "heading",
                heading: t('climate'),
                heading_style: "title",
                icon: "mdi:thermostat"
              }] : []),
              ...standardThermostatEntities.map(entity => ({
                type: "tile",
                entity: entity,
                name: getEntityName(entity),
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
      } else {
        // Standard-Verhalten: Alle Thermostate als Standard-Cards
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
              name: getEntityName(entity),
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
    }

    // Rollos/Jalousien
    if (roomEntities.covers.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: t('blinds'),
            heading_style: "title",
            icon: "mdi:window-shutter"
          },
          ...roomEntities.covers.map(entity => ({
            type: "tile",
            entity: entity,
            name: getEntityName(entity),
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
            heading: t('curtains'),
            heading_style: "title",
            icon: "mdi:curtains"
          },
          ...roomEntities.covers_curtain.map(entity => ({
            type: "tile",
            entity: entity,
            name: getEntityName(entity),
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
            heading: t('media'),
            heading_style: "title",
            icon: "mdi:speaker"
          },
          ...roomEntities.media_player.map(entity => ({
            type: "tile",
            entity: entity,
            name: getEntityName(entity),
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
            heading: t('scenes'),
            heading_style: "title",
            icon: "mdi:palette"
          },
          ...roomEntities.scenes.map(entity => ({
            type: "tile",
            entity: entity,
            name: getEntityName(entity),
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
                name: getEntityName(entity),
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
                name: getEntityName(entity),
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
                name: getEntityName(entity),
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
            heading: t('misc'),
            heading_style: "title",
            icon: "mdi:dots-horizontal"
          },
          ...miscCards
        ]
      });
    }

    // === RAUM-PINS SECTION (am Ende) ===
    // Filtere Raum-Pins für diesen Raum
    const roomPinEntities = dashboardConfig.room_pin_entities || [];
    const roomPinsForThisArea = roomPinEntities.filter(entityId => {
      const entity = entities.find(e => e.entity_id === entityId);
      if (!entity) return false;
      
      // Prüfe ob Entity diesem Raum zugeordnet ist
      if (entity.area_id === area.area_id) return true;
      
      // Oder über Device zugeordnet
      if (entity.device_id && areaDevices.has(entity.device_id)) return true;
      
      return false;
    });

    if (roomPinsForThisArea.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: t('roomPins'),
            heading_style: "title",
            icon: "mdi:pin"
          },
          ...roomPinsForThisArea.map(entity => ({
            type: "tile",
            entity: entity,
            name: getEntityName(entity),
            vertical: false,
            state_content: "last_changed"
          }))
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