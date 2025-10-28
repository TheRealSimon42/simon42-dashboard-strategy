// ====================================================================
// VIEW STRATEGY - COVERS (Rollos/Vorhänge) - OPTIMIERT
// ====================================================================
import { getExcludedLabels, stripCoverType } from '../utils/simon42-helpers.js';

class Simon42ViewCoversStrategy {
  static async generate(config, hass) {
    const { entities, device_classes } = config;
    
    const excludeLabels = getExcludedLabels(entities);
    const excludeSet = new Set(excludeLabels);
    
    // Hole hidden entities aus areas_options (wenn config übergeben wurde)
    const hiddenFromConfig = new Set();
    if (config.config?.areas_options) {
      for (const areaOptions of Object.values(config.config.areas_options)) {
        // Covers und covers_curtain zusammenfassen
        if (areaOptions.groups_options?.covers?.hidden) {
          areaOptions.groups_options.covers.hidden.forEach(id => hiddenFromConfig.add(id));
        }
        if (areaOptions.groups_options?.covers_curtain?.hidden) {
          areaOptions.groups_options.covers_curtain.hidden.forEach(id => hiddenFromConfig.add(id));
        }
      }
    }

    // OPTIMIERT: Filter-Reihenfolge
    const coverEntities = entities
      .filter(e => {
        const id = e.entity_id;
        
        // 1. Domain-Check zuerst
        if (!id.startsWith('cover.')) return false;
        
        // 2. Hidden/Disabled-Checks (Registry)
        if (e.hidden === true) return false;
        if (e.hidden_by) return false;
        if (e.disabled_by) return false;
        
        // 3. Entity Category Check
        if (e.entity_category === 'config' || e.entity_category === 'diagnostic') return false;
        
        // 4. State-Existence-Check
        if (hass.states[id] === undefined) return false;
        
        // 5. Exclude-Checks (Set-Lookup = O(1))
        if (excludeSet.has(id)) return false;
        if (hiddenFromConfig.has(id)) return false;
        
        return true;
      })
      .map(e => e.entity_id)
      .filter(entity => {
        const state = hass.states[entity];
        const deviceClass = state.attributes?.device_class;
        return device_classes.includes(deviceClass) || !deviceClass;
      });

    const coversOpen = [];
    const coversClosed = [];

    coverEntities.forEach(entity => {
      const state = hass.states[entity];
      if (state?.state === 'open') {
        coversOpen.push(entity);
      } else {
        coversClosed.push(entity);
      }
    });

    const sections = [];

    // Offene Rollos
    if (coversOpen.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: `🪟 Offene Rollos & Vorhänge (${coversOpen.length})`,
            heading_style: "title",
            badges: [
              {
                type: "entity",
                entity: coversOpen[0], // Dummy entity für den Badge
                show_name: false,
                show_state: false,
                tap_action: {
                  action: "perform-action",
                  perform_action: "cover.close_cover",
                  target: {
                    entity_id: coversOpen
                  }
                },
                icon: "mdi:arrow-down"
              }
            ]
          },
          ...coversOpen.map(entity => ({
            type: "tile",
            entity: entity,
            name: stripCoverType(entity, hass),
            features: [{ type: "cover-open-close" }],
            vertical: false,
            features_position: "inline",
            state_content: ["current_position", "last_changed"]
          }))
        ]
      });
    }

    // Geschlossene Rollos
    if (coversClosed.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: `🔒 Geschlossene Rollos & Vorhänge (${coversClosed.length})`,
            heading_style: "title",
            badges: coversClosed.length > 0 ? [
              {
                type: "entity",
                entity: coversClosed[0], // Dummy entity für den Badge
                show_name: false,
                show_state: false,
                tap_action: {
                  action: "perform-action",
                  perform_action: "cover.open_cover",
                  target: {
                    entity_id: coversClosed
                  }
                },
                icon: "mdi:arrow-up"
              }
            ] : []
          },
          ...coversClosed.map(entity => ({
            type: "tile",
            entity: entity,
            name: stripCoverType(entity, hass),
            features: [{ type: "cover-open-close" }],
            vertical: false,
            features_position: "inline",
            state_content: ["current_position", "last_changed"]
          }))
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
customElements.define("ll-strategy-simon42-view-covers", Simon42ViewCoversStrategy);