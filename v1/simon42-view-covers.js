// ====================================================================
// VIEW STRATEGY - COVERS (Rollos/Vorhänge)
// ====================================================================
class Simon42ViewCoversStrategy {
  static async generate(config, hass) {
    const { entities, device_classes } = config;
    
    const excludeLabels = entities
      .filter(e => e.labels?.includes("no_dboard"))
      .map(e => e.entity_id);

    const coverEntities = entities
      .filter(e => e.entity_id.startsWith('cover.'))
      .filter(e => !excludeLabels.includes(e.entity_id))
      .filter(e => hass.states[e.entity_id] !== undefined)
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
            features: [{ type: "cover-open-close" }],
            vertical: false,
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
            features: [{ type: "cover-open-close" }],
            vertical: false,
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