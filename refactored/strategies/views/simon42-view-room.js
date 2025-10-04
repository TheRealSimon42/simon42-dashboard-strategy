// ====================================================================
// VIEW STRATEGY - RAUM (Refactored mit Helpers)
// ====================================================================

import { EntityHelper } from '../../helpers/simon42-entity-helper.js';
import { CardGenerator } from '../../helpers/simon42-card-generator.js';

class Simon42ViewRoomStrategy {
  static async generate(config, hass) {
    const { area, devices, entities } = config;
    
    // ====== 1. FILTERUNG ======
    const excludeList = EntityHelper.getEntitiesWithLabel(entities, 'no_dboard');
    const showDboardLabels = EntityHelper.getEntitiesWithLabel(entities, 'show_dboard');
    
    // ====== 2. ENTITIES FÜR DIESEN RAUM ======
    const roomDevices = devices
      .filter(d => d.area_id === area.area_id)
      .map(d => d.id);
    
    const roomEntities = entities
      .filter(e => roomDevices.includes(e.device_id))
      .filter(e => !excludeList.includes(e.entity_id))
      .filter(e => hass.states[e.entity_id] !== undefined);
    
    // ====== 3. GRUPPIERUNG NACH DOMAIN ======
    const grouped = {
      scenes: [],
      lights: [],
      covers_shutter: [],
      covers_curtain: [],
      climate: [],
      media_player: [],
      vacuum: [],
      fan: [],
      switches: [],
      sensors: []
    };
    
    roomEntities.forEach(entity => {
      const domain = entity.entity_id.split('.')[0];
      const state = hass.states[entity.entity_id];
      
      switch(domain) {
        case 'scene':
          grouped.scenes.push(entity.entity_id);
          break;
        case 'light':
          grouped.lights.push(entity.entity_id);
          break;
        case 'cover':
          if (state?.attributes?.device_class === 'shutter') {
            grouped.covers_shutter.push(entity.entity_id);
          } else if (state?.attributes?.device_class === 'curtain') {
            grouped.covers_curtain.push(entity.entity_id);
          }
          break;
        case 'climate':
          grouped.climate.push(entity.entity_id);
          break;
        case 'media_player':
          grouped.media_player.push(entity.entity_id);
          break;
        case 'vacuum':
          grouped.vacuum.push(entity.entity_id);
          break;
        case 'fan':
          grouped.fan.push(entity.entity_id);
          break;
        case 'switch':
          // Nur Switches mit show_dboard Label
          if (showDboardLabels.includes(entity.entity_id)) {
            grouped.switches.push(entity.entity_id);
          }
          break;
        case 'sensor':
        case 'binary_sensor':
          // Sensoren die nützlich sind (nicht diagnostic/config)
          if (!EntityHelper.isConfigOrDiagnostic(state)) {
            grouped.sensors.push(entity.entity_id);
          }
          break;
      }
    });
    
    // Sortiere alle Gruppen nach last_changed
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        const stateA = hass.states[a];
        const stateB = hass.states[b];
        const timeA = new Date(stateA?.last_changed || 0);
        const timeB = new Date(stateB?.last_changed || 0);
        return timeB - timeA; // Neueste zuerst
      });
    });
    
    // ====== 4. CARDS GENERIEREN ======
    const cards = [];
    
    // Szenen (wenn vorhanden)
    if (grouped.scenes.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard("Szenen", {
            heading_style: "title",
            icon: "mdi:palette-outline"
          }),
          ...grouped.scenes.map(entityId => 
            CardGenerator.createSceneCard(entityId)
          )
        ]
      });
    }
    
    // Lichter (wenn vorhanden)
    if (grouped.lights.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard("Lampen", {
            heading_style: "title",
            icon: "mdi:lamps-outline"
          }),
          ...grouped.lights.map(entityId => 
            CardGenerator.createLightCard(entityId, {
              vertical: false,
              state_content: "last_changed"
            })
          )
        ]
      });
    }
    
    // Rollos/Shutters (wenn vorhanden)
    if (grouped.covers_shutter.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard("Rollos", {
            heading_style: "title",
            icon: "mdi:window-shutter"
          }),
          ...grouped.covers_shutter.map(entityId => 
            CardGenerator.createCoverCard(entityId, {
              vertical: false
            })
          )
        ]
      });
    }
    
    // Vorhänge/Curtains (wenn vorhanden)
    if (grouped.covers_curtain.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard("Vorhänge", {
            heading_style: "title",
            icon: "mdi:curtains"
          }),
          ...grouped.covers_curtain.map(entityId => 
            CardGenerator.createCoverCard(entityId, {
              vertical: false
            })
          )
        ]
      });
    }
    
    // Klima (wenn vorhanden)
    if (grouped.climate.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard("Klima", {
            heading_style: "title",
            icon: "mdi:thermostat"
          }),
          ...grouped.climate.map(entityId => 
            CardGenerator.createClimateCard(entityId, {
              vertical: false
            })
          )
        ]
      });
    }
    
    // Media Player (wenn vorhanden)
    if (grouped.media_player.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard("Medien", {
            heading_style: "title",
            icon: "mdi:speaker"
          }),
          ...grouped.media_player.map(entityId => 
            CardGenerator.createMediaPlayerCard(entityId, {
              vertical: false
            })
          )
        ]
      });
    }
    
    // Staubsauger (wenn vorhanden)
    if (grouped.vacuum.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard("Staubsauger", {
            heading_style: "title",
            icon: "mdi:robot-vacuum"
          }),
          ...grouped.vacuum.map(entityId => 
            CardGenerator.createTileCard({
              entity: entityId,
              vertical: false,
              features: [{ type: "vacuum-commands" }]
            })
          )
        ]
      });
    }
    
    // Ventilatoren (wenn vorhanden)
    if (grouped.fan.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard("Ventilatoren", {
            heading_style: "title",
            icon: "mdi:fan"
          }),
          ...grouped.fan.map(entityId => 
            CardGenerator.createTileCard({
              entity: entityId,
              vertical: false
            })
          )
        ]
      });
    }
    
    // Schalter (wenn vorhanden)
    if (grouped.switches.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard("Schalter", {
            heading_style: "title",
            icon: "mdi:toggle-switch"
          }),
          ...grouped.switches.map(entityId => 
            CardGenerator.createTileCard({
              entity: entityId,
              vertical: false
            })
          )
        ]
      });
    }
    
    // Sensoren (wenn vorhanden)
    if (grouped.sensors.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard("Sensoren", {
            heading_style: "title",
            icon: "mdi:eye"
          }),
          ...grouped.sensors.map(entityId => 
            CardGenerator.createSensorCard(entityId, hass)
          )
        ]
      });
    }
    
    // Fallback wenn Raum leer ist
    if (cards.length === 0) {
      cards.push({
        type: "markdown",
        content: `## 🏠 ${area.name}\n\nKeine Geräte in diesem Raum gefunden.`
      });
    }
    
    return { cards };
  }
}

// Registriere Custom Element
customElements.define("ll-strategy-simon42-view-room", Simon42ViewRoomStrategy);