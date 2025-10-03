// ====================================================================
// DASHBOARD STRATEGY - Generiert die Hauptstruktur
// ====================================================================
class Simon42DashboardStrategy {
  static async generate(config, hass) {
    // Hole alle benötigten Daten
    const [areas, devices, entities] = await Promise.all([
      hass.callWS({ type: "config/area_registry/list" }),
      hass.callWS({ type: "config/device_registry/list" }),
      hass.callWS({ type: "config/entity_registry/list" }),
    ]);

    // Labels für Filterung
    const excludeLabels = entities
      .filter(e => e.labels?.includes("no_dboard"))
      .map(e => e.entity_id);

    // Zähle eingeschaltete Lichter
    const lightsOn = Object.values(hass.states)
      .filter(state => state.entity_id.startsWith('light.'))
      .filter(state => !excludeLabels.includes(state.entity_id))
      .filter(state => state.attributes?.entity_category !== 'config')
      .filter(state => state.attributes?.entity_category !== 'diagnostic')
      .filter(state => state.state === 'on');

    // Dummy-Entität für Tile-Card
    const someLight = Object.values(hass.states)
        .find(state => 
            state.entity_id.startsWith('light.') &&
            !excludeLabels.includes(state.entity_id) &&
            state.attributes?.entity_category !== 'config' &&
            state.attributes?.entity_category !== 'diagnostic'
        );

    // Zähle offene Rollos/Covers
    const coversOpen = Object.values(hass.states)
      .filter(state => state.entity_id.startsWith('cover.'))
      .filter(state => !excludeLabels.includes(state.entity_id))
      .filter(state => state.attributes?.entity_category !== 'config')
      .filter(state => state.attributes?.entity_category !== 'diagnostic')
      .filter(state => {
        const deviceClass = state.attributes?.device_class;
        return ['awning', 'blind', 'curtain', 'shade', 'shutter', 'window'].includes(deviceClass) || !deviceClass;
      })
      .filter(state => state.state === 'open');

    // Zähle unsichere Elemente
    const securityUnsafe = Object.values(hass.states)
      .filter(state => {
        if (excludeLabels.includes(state.entity_id)) return false;
        if (state.attributes?.entity_category === 'config') return false;
        if (state.attributes?.entity_category === 'diagnostic') return false;
        
        // Locks (entriegelt)
        if (state.entity_id.startsWith('lock.') && state.state === 'unlocked') return true;
        
        // Covers mit device_class door, garage, gate (offen)
        if (state.entity_id.startsWith('cover.')) {
          const deviceClass = state.attributes?.device_class;
          if (['door', 'garage', 'gate'].includes(deviceClass) && state.state === 'open') return true;
        }
        
        // Binary sensors (offen/on)
        if (state.entity_id.startsWith('binary_sensor.')) {
          const deviceClass = state.attributes?.device_class;
          if (['door', 'window', 'garage_door', 'opening'].includes(deviceClass) && state.state === 'on') return true;
        }
        
        return false;
      });

    // Zähle kritische Batterien (unter 20%)
    const batteriesCritical = Object.values(hass.states)
      .filter(state => {
        if (excludeLabels.includes(state.entity_id)) return false;
        if (!state.entity_id.includes('battery')) return false;
        const value = parseFloat(state.state);
        return !isNaN(value) && value < 20;
      });

    // Erstelle Views
    const views = [
      // Haupt-Übersichts-View
      {
        title: "Übersicht",
        path: "home",
        icon: "mdi:home",
        type: "sections",
        max_columns: 3,
        sections: [
          // Übersichts-Abschnitt
          {
            type: "grid",
            cards: [
              {
                type: "heading",
                heading: "Übersicht",
                heading_style: "title",
                icon: "mdi:overscan"
              },
              {
                type: "clock",
                clock_size: "small",
                show_seconds: false
              },
              // Zusammenfassungen
              {
                type: "heading",
                heading: "Zusammenfassungen"
              },
              // Lichter Summary
              {
                type: "tile",
                icon: "mdi:lamps",
                name: lightsOn.length > 0 ? `${lightsOn.length} ${lightsOn.length === 1 ? 'Licht an' : 'Lichter an'}` : 'Alle Lichter aus',
                entity: lightsOn.length > 0 ? lightsOn[0].entity_id : "sensor.update",
                color: lightsOn.length > 0 ? 'orange' : 'grey',
                hide_state: true,
                vertical: true,
                icon_tap_action: {
                  action: "none",
                },
                tap_action: {
                  action: "navigate",
                  navigation_path: "lights",
                }
              },
              // Covers Summary
              {
                type: "tile",
                icon: "mdi:blinds-horizontal",
                name: coversOpen.length > 0 ? `${coversOpen.length} ${coversOpen.length === 1 ? 'Rollo offen' : 'Rollos offen'}` : 'Alle Rollos geschlossen',
                entity: coversOpen.length > 0 ? coversOpen[0].entity_id : "sensor.update",
                color: securityUnsafe.length > 0 ? 'purple' : 'grey',
                hide_state: true,
                vertical: true,
                icon_tap_action: {
                  action: "none",
                },
                tap_action: {
                  action: "navigate",
                  navigation_path: "covers",
                }
              },
              // Security Summary
             {
                type: "tile",
                icon: "mdi:security",
                name: securityUnsafe.length > 0 ? `${securityUnsafe.length} unsicher` : 'Alles gesichert',
                entity: securityUnsafe.length > 0 ? securityUnsafe[0].entity_id : "sensor.update",
                color: securityUnsafe.length > 0 ? 'yellow' : 'grey',
                hide_state: true,
                vertical: true,
                icon_tap_action: {
                  action: "none",
                },
                tap_action: {
                  action: "navigate",
                  navigation_path: "security",
                }
              },
              // Batterie Summary
             {
                type: "tile",
                icon: batteriesCritical.length > 0 ? "mdi:battery-alert" : 'mdi:battery-charging',
                name: batteriesCritical.length > 0 ? `${batteriesCritical.length} ${batteriesCritical.length === 1 ? 'Batterie kritisch' : 'Batterien kritisch'}` : 'Alle Batterien OK',
                entity: batteriesCritical.length > 0 ? batteriesCritical[0].entity_id : "sensor.update",
                color: batteriesCritical.length > 0 ? 'red' : 'green',
                hide_state: true,
                vertical: true,
                icon_tap_action: {
                  action: "none",
                },
                tap_action: {
                  action: "navigate",
                  navigation_path: "batteries",
                }
              }
            ]
          },
          // Bereiche/Räume Section
          {
            type: "grid",
            cards: [
              {
                type: "heading",
                heading_style: "title",
                heading: "Bereiche"
              },
              ...areas.map((area) => ({
                type: "area",
                area: area.area_id,
                display_type: "compact",
                alert_classes: [ "motion", "moisture", "occupancy" ],
                sensor_classes: [ "temperature", "humidity", "volatile_organic_compounds_parts" ],
                features: [{ type: "area-controls" }],
                features_position: "inline",
                navigation_path: area.area_id,
                vertical: false
              }))
            ]
          }
        ]
      },
      // View für Lichter
      {
        title: "Lichter",
        path: "lights",
        icon: "mdi:lamps",
        strategy: {
          type: "custom:simon42-view-lights",
          entities
        }
      },
      // View für Covers
      {
        title: "Rollos & Vorhänge",
        path: "covers",
        icon: "mdi:blinds-horizontal",
        strategy: {
          type: "custom:simon42-view-covers",
          entities,
          device_classes: ["awning", "blind", "curtain", "shade", "shutter", "window"]
        }
      },
      // View für Security
      {
        title: "Sicherheit",
        path: "security",
        icon: "mdi:security",
        strategy: {
          type: "custom:simon42-view-security",
          entities
        }
      },
      // View für Batterien
      {
        title: "Batterien",
        path: "batteries",
        icon: "mdi:battery-alert",
        strategy: {
          type: "custom:simon42-view-batteries",
          entities
        }
      }
    ];

    // Füge für jeden Bereich eine View hinzu
    areas.forEach(area => {
      views.push({
        title: area.name,
        path: area.area_id,
        icon: "mdi:floor-plan",
        strategy: {
          type: "custom:simon42-view-room",
          area,
          devices,
          entities
        }
      });
    });

    return {
      title: "Dynamisches Dashboard",
      views
    };
  }
}

// Registriere Custom Element
customElements.define("ll-strategy-simon42-dashboard", Simon42DashboardStrategy);