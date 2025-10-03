// ====================================================================
// VIEW STRATEGY - RAUM (generiert Raum-Details)
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

    // Labels für Filterung
    const excludeLabels = entities
      .filter(e => e.labels?.includes("no_dboard"))
      .map(e => e.entity_id);
    
    const showDboardLabels = entities
      .filter(e => e.labels?.includes("show_dboard"))
      .map(e => e.entity_id);

    for (const entity of entities) {
      // Prüfe ob Entität zum Raum gehört
      const belongsToArea = entity.area_id === area.area_id || 
                           (entity.device_id && areaDevices.has(entity.device_id));
      
      if (!belongsToArea) continue;
      
      // Exkludiere no_dboard Entitäten
      if (excludeLabels.includes(entity.entity_id)) continue;

      // Prüfe ob Entität in hass.states existiert
      if (!hass.states[entity.entity_id]) continue;

      const domain = entity.entity_id.split('.')[0];
      
      switch(domain) {
        case 'light':
          roomEntities.lights.push(entity.entity_id);
          break;
        case 'cover':
          const state = hass.states[entity.entity_id];
          if (state?.attributes?.device_class === 'shutter') {
            roomEntities.covers.push(entity.entity_id);
          } else if (state?.attributes?.device_class === 'curtain') {
            roomEntities.covers_curtain.push(entity.entity_id);
          }
          break;
        case 'scene':
          roomEntities.scenes.push(entity.entity_id);
          break;
        case 'climate':
          roomEntities.climate.push(entity.entity_id);
          break;
        case 'media_player':
          roomEntities.media_player.push(entity.entity_id);
          break;
        case 'vacuum':
          roomEntities.vacuum.push(entity.entity_id);
          break;
        case 'fan':
          roomEntities.fan.push(entity.entity_id);
          break;
        case 'switch':
          // Nur Switches mit show_dboard Label
          if (showDboardLabels.includes(entity.entity_id)) {
            roomEntities.switches.push(entity.entity_id);
          }
          break;
      }
    }

    // Sortiere alle Entitäten nach last_changed
    Object.keys(roomEntities).forEach(key => {
      roomEntities[key].sort(sortByLastChanged);
    });

    const sections = [];

    // Lampen Sektion
    if (roomEntities.lights.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: "Lampen",
            heading_style: "title",
            icon: "mdi:lamps-outline"
          },
          ...roomEntities.lights.map(entity => ({
            type: "tile",
            entity: entity,
            features: [{ type: "light-brightness" }],
            features_position: "inline",
            vertical: false,
            state_content: "last_changed"
          }))
        ]
      });
    }

    // Rollos Sektion (Shutters)
    if (roomEntities.covers.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: "Rollos",
            heading_style: "title",
            icon: "mdi:window-shutter"
          },
          ...roomEntities.covers.map(entity => ({
            type: "tile",
            entity: entity,
            features: [{ type: "cover-position" }],
            features_position: "inline",
            vertical: false
          }))
        ]
      });
    }

    // Vorhänge Sektion (Curtains)
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
            features: [{ type: "cover-position" }],
            features_position: "inline",
            vertical: false
          }))
        ]
      });
    }

    // Szenen Sektion
    if (roomEntities.scenes.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: "Szenen",
            heading_style: "title",
            icon: "mdi:projector-screen-variant"
          },
          ...roomEntities.scenes.map(entity => ({
            type: "tile",
            entity: entity,
            vertical: false
          }))
        ]
      });
    }

    // Sonstiges Sektion (Climate, Media Player, Vacuum, Fan, Switches)
    const miscCards = [];
    
    // Climate mit Temperature Control
    roomEntities.climate.forEach(entity => {
      miscCards.push({
        type: "tile",
        entity: entity,
        features: [{ type: "climate-hvac-modes" }, { type: "target-temperature" }],
        features_position: "inline",
        vertical: false,
        state_content: "last_changed"
      });
    });

    // Media Player mit Volume
    roomEntities.media_player.forEach(entity => {
      miscCards.push({
        type: "tile",
        entity: entity,
        features: [{ type: "media-player-playback" }],
        features_position: "inline",
        vertical: false,
        state_content: "last_changed"
      });
    });

    // Vacuum mit Commands
    roomEntities.vacuum.forEach(entity => {
      miscCards.push({
        type: "tile",
        entity: entity,
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
      sections: sections
    };
  }
}

// Registriere Custom Element
customElements.define("ll-strategy-simon42-view-room", Simon42ViewRoomStrategy);