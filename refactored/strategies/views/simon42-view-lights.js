// ====================================================================
// VIEW STRATEGY - LICHTER (alle Lichter)
// ====================================================================
class Simon42ViewLightsStrategy {
  static async generate(config, hass) {
    const { entities } = config;
    
    const excludeLabels = entities
      .filter(e => e.labels?.includes("no_dboard"))
      .map(e => e.entity_id);

    const lightEntities = entities
      .filter(e => e.entity_id.startsWith('light.'))
      .filter(e => !excludeLabels.includes(e.entity_id))
      .filter(e => hass.states[e.entity_id] !== undefined)
      .map(e => e.entity_id);

    const lightsOn = [];
    const lightsOff = [];

    lightEntities.forEach(entity => {
      const state = hass.states[entity];
      if (state?.state === 'on') {
        lightsOn.push(entity);
      } else {
        lightsOff.push(entity);
      }
    });

    const sections = [];

    // Eingeschaltete Lichter
    if (lightsOn.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: `💡 Eingeschaltete Lichter (${lightsOn.length})`,
            heading_style: "title",
            badges: [
              {
                type: "entity",
                entity: lightsOn[0], // Dummy entity für den Badge
                show_name: false,
                show_state: false,
                tap_action: {
                  action: "perform-action",
                  perform_action: "light.turn_off",
                  target: {
                    entity_id: lightsOn
                  }
                },
                icon: "mdi:lightbulb-off"
              }
            ]
          },
          ...lightsOn.map(entity => ({
            type: "tile",
            entity: entity,
            features: [{ type: "light-brightness" }],
            vertical: false,
            state_content: "last_changed"
          }))
        ]
      });
    }

    // Ausgeschaltete Lichter
    if (lightsOff.length > 0) {
      sections.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: `🌙 Ausgeschaltete Lichter (${lightsOff.length})`,
            heading_style: "title",
            badges: lightsOff.length > 0 ? [
              {
                type: "entity",
                entity: lightsOff[0], // Dummy entity für den Badge
                show_name: false,
                show_state: false,
                tap_action: {
                  action: "perform-action",
                  perform_action: "light.turn_on",
                  target: {
                    entity_id: lightsOff
                  }
                },
                icon: "mdi:lightbulb-on"
              }
            ] : []
          },
          ...lightsOff.map(entity => ({
            type: "tile",
            entity: entity,
            features: [{ type: "light-brightness" }],
            vertical: false,
            state_content: "last_changed"
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
customElements.define("ll-strategy-simon42-view-lights", Simon42ViewLightsStrategy);