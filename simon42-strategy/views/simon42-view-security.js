// ====================================================================
// VIEW STRATEGY - SECURITY (Schlösser + Türen/Garagen + Fenster) - OPTIMIERT
// ====================================================================
import { getExcludedLabels } from '../utils/simon42-helpers.js';

class Simon42ViewSecurityStrategy {
  static async generate(config, hass) {
    const { entities } = config;
    
    const excludeLabels = getExcludedLabels(entities);
    const excludeSet = new Set(excludeLabels);
    
    // Hole hidden entities aus areas_options (wenn config übergeben wurde)
    const hiddenFromConfig = new Set();
    if (config.config?.areas_options) {
      for (const areaOptions of Object.values(config.config.areas_options)) {
        // Alle relevanten Gruppen durchsuchen
        const relevantGroups = ['covers', 'covers_curtain', 'switches'];
        relevantGroups.forEach(group => {
          if (areaOptions.groups_options?.[group]?.hidden) {
            areaOptions.groups_options[group].hidden.forEach(id => hiddenFromConfig.add(id));
          }
        });
      }
    }

    // Gruppiere nach Typ
    const locks = [];
    const doors = []; // Cover mit door/gate device_class
    const garages = []; // Cover mit garage device_class
    const windows = []; // Binary Sensors mit door/window device_class

    // OPTIMIERT: Filter-Logik
    entities
      .filter(e => {
        const id = e.entity_id;
        
        // 1. State-Existence-Check
        if (hass.states[id] === undefined) return false;
        
        // 2. Exclude-Checks (Set-Lookup = O(1))
        if (excludeSet.has(id)) return false;
        if (hiddenFromConfig.has(id)) return false;
        
        return true;
      })
      .forEach(entity => {
        const entityId = entity.entity_id;
        const state = hass.states[entityId];
        if (!state) return;
        
        // Domain-Checks mit frühem Return
        if (entityId.startsWith('lock.')) {
          locks.push(entityId);
          return;
        }
        
        if (entityId.startsWith('cover.')) {
          const deviceClass = state.attributes?.device_class;
          if (deviceClass === 'garage') {
            garages.push(entityId);
          } else if (['door', 'gate'].includes(deviceClass)) {
            doors.push(entityId);
          }
          return;
        }
        
        if (entityId.startsWith('binary_sensor.')) {
          const deviceClass = state.attributes?.device_class;
          if (['door', 'window', 'garage_door', 'opening'].includes(deviceClass)) {
            windows.push(entityId);
          }
        }
      });

    const sections = [];

    // Schlösser Section
    if (locks.length > 0) {
      const locksOpen = locks.filter(e => hass.states[e]?.state === 'unlocked');
      const locksClosed = locks.filter(e => hass.states[e]?.state === 'locked');
      
      const lockCards = [];
      
      if (locksOpen.length > 0) {
        lockCards.push({
          type: "heading",
          heading: "🔓 Entriegelt",
          heading_style: "subtitle",
          badges: [
            {
              type: "entity",
              entity: locksOpen[0],
              show_name: false,
              show_state: false,
              tap_action: {
                action: "perform-action",
                perform_action: "lock.lock",
                target: { entity_id: locksOpen }
              },
              icon: "mdi:lock"
            }
          ]
        });
        lockCards.push(...locksOpen.map(entity => ({
          type: "tile",
          entity: entity,
          features_position: "inline",
          state_content: "last_changed"
        })));
      }
      
      if (locksClosed.length > 0) {
        lockCards.push({
          type: "heading",
          heading: "🔒 Verriegelt",
          heading_style: "subtitle"
        });
        lockCards.push(...locksClosed.map(entity => ({
          type: "tile",
          entity: entity,
          features_position: "inline",
          state_content: "last_changed"
        })));
      }
      
      if (lockCards.length > 0) {
        sections.push({
          type: "grid",
          cards: lockCards
        });
      }
    }

    // Türen/Tore Section
    if (doors.length > 0) {
      const doorsOpen = doors.filter(e => hass.states[e]?.state === 'open');
      const doorsClosed = doors.filter(e => hass.states[e]?.state === 'closed');
      
      const doorCards = [];
      
      if (doorsOpen.length > 0) {
        doorCards.push({
          type: "heading",
          heading: "🚪 Türen & Tore - Offen",
          heading_style: "subtitle",
          badges: [
            {
              type: "entity",
              entity: doorsOpen[0],
              show_name: false,
              show_state: false,
              tap_action: {
                action: "perform-action",
                perform_action: "cover.close_cover",
                target: { entity_id: doorsOpen }
              },
              icon: "mdi:arrow-down"
            }
          ]
        });
        doorCards.push(...doorsOpen.map(entity => ({
          type: "tile",
          entity: entity,
          features: [{ type: "cover-open-close" }],
          features_position: "inline",
          state_content: "last_changed"
        })));
      }
      
      if (doorsClosed.length > 0) {
        doorCards.push({
          type: "heading",
          heading: "🚪 Türen & Tore - Geschlossen",
          heading_style: "subtitle"
        });
        doorCards.push(...doorsClosed.map(entity => ({
          type: "tile",
          entity: entity,
          features: [{ type: "cover-open-close" }],
          features_position: "inline",
          state_content: "last_changed"
        })));
      }
      
      if (doorCards.length > 0) {
        sections.push({
          type: "grid",
          cards: doorCards
        });
      }
    }

    // Garagen Section
    if (garages.length > 0) {
      const garagesOpen = garages.filter(e => hass.states[e]?.state === 'open');
      const garagesClosed = garages.filter(e => hass.states[e]?.state === 'closed');
      
      const garageCards = [];
      
      if (garagesOpen.length > 0) {
        garageCards.push({
          type: "heading",
          heading: "🏠 Garagen - Offen",
          heading_style: "subtitle",
          badges: [
            {
              type: "entity",
              entity: garagesOpen[0],
              show_name: false,
              show_state: false,
              tap_action: {
                action: "perform-action",
                perform_action: "cover.close_cover",
                target: { entity_id: garagesOpen }
              },
              icon: "mdi:arrow-down"
            }
          ]
        });
        garageCards.push(...garagesOpen.map(entity => ({
          type: "tile",
          entity: entity,
          features: [{ type: "cover-open-close" }],
          features_position: "inline",
          state_content: "last_changed"
        })));
      }
      
      if (garagesClosed.length > 0) {
        garageCards.push({
          type: "heading",
          heading: "🏠 Garagen - Geschlossen",
          heading_style: "subtitle"
        });
        garageCards.push(...garagesClosed.map(entity => ({
          type: "tile",
          entity: entity,
          features: [{ type: "cover-open-close" }],
          features_position: "inline",
          state_content: "last_changed"
        })));
      }
      
      if (garageCards.length > 0) {
        sections.push({
          type: "grid",
          cards: garageCards
        });
      }
    }

    // Fenster & Sensoren Section
    if (windows.length > 0) {
      const windowsOpen = windows.filter(e => hass.states[e]?.state === 'on');
      const windowsClosed = windows.filter(e => hass.states[e]?.state === 'off');
      
      const windowCards = [];
      
      if (windowsOpen.length > 0) {
        windowCards.push({
          type: "heading",
          heading: "🪟 Fenster & Öffnungen - Offen",
          heading_style: "subtitle"
        });
        windowCards.push(...windowsOpen.map(entity => ({
          type: "tile",
          entity: entity,
          state_content: "last_changed"
        })));
      }
      
      if (windowsClosed.length > 0) {
        windowCards.push({
          type: "heading",
          heading: "🪟 Fenster & Öffnungen - Geschlossen",
          heading_style: "subtitle"
        });
        windowCards.push(...windowsClosed.map(entity => ({
          type: "tile",
          entity: entity,
          state_content: "last_changed"
        })));
      }
      
      if (windowCards.length > 0) {
        sections.push({
          type: "grid",
          cards: windowCards
        });
      }
    }

    return {
      type: "sections",
      sections: sections
    };
  }
}

// Registriere Custom Element
customElements.define("ll-strategy-simon42-view-security", Simon42ViewSecurityStrategy);