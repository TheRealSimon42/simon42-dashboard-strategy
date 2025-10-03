// ====================================================================
// SIMON42 DASHBOARD STRATEGY V2 - MIT KONFIGURATION
// ====================================================================
// Erweiterte Version mit:
// - Bereiche ausblenden/einblenden
// - Views ausblenden/einblenden
// - Persistente Speicherung
// - Einstellungen-Dialog im Edit-Modus
// ====================================================================

class Simon42DashboardStrategy {
  static async generate(config, hass) {
    // Lade oder erstelle Config Manager
    if (!window.simon42ConfigManager) {
      window.simon42ConfigManager = new Simon42ConfigManager(hass);
      await window.simon42ConfigManager.loadConfig();
    }
    
    const configManager = window.simon42ConfigManager;

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
      .filter(state => state.state === 'on')
      .length;

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
      .filter(state => state.state === 'open')
      .length;

    // Zähle unsichere Elemente
    const securityUnsafe = Object.values(hass.states)
      .filter(state => {
        if (excludeLabels.includes(state.entity_id)) return false;
        if (state.attributes?.entity_category === 'config') return false;
        if (state.attributes?.entity_category === 'diagnostic') return false;
        
        if (state.entity_id.startsWith('lock.') && state.state === 'unlocked') return true;
        
        if (state.entity_id.startsWith('cover.')) {
          const deviceClass = state.attributes?.device_class;
          if (['door', 'garage', 'gate'].includes(deviceClass) && state.state === 'open') return true;
        }
        
        if (state.entity_id.startsWith('binary_sensor.')) {
          const deviceClass = state.attributes?.device_class;
          if (['door', 'window', 'garage_door', 'opening'].includes(deviceClass) && state.state === 'on') return true;
        }
        
        return false;
      })
      .length;

    // Zähle kritische Batterien (unter 20%)
    const batteriesCritical = Object.values(hass.states)
      .filter(state => {
        if (excludeLabels.includes(state.entity_id)) return false;
        if (!state.entity_id.includes('battery')) return false;
        const value = parseFloat(state.state);
        return !isNaN(value) && value < 20;
      })
      .length;

    // Sortiere und filtere Bereiche nach Konfiguration
    const sortedAreas = configManager.sortAreas(areas);

    // Erstelle die Hauptübersichts-View mit Einstellungen-Button
    const views = [
      {
        title: "Übersicht",
        path: "home",
        icon: "mdi:home",
        type: "sections",
        max_columns: 1,
        sections: [
          {
            type: "grid",
            cards: [
              {
                type: "heading",
                heading: "Übersicht",
                heading_style: "title",
                icon: "mdi:overscan"
              },
              // Einstellungen-Button (nur im Edit-Modus sichtbar)
              {
                type: "custom:simon42-settings-card",
                configManager: configManager
              },
              {
                type: "clock",
                clock_size: "small",
                show_seconds: false
              },
              {
                type: "heading",
                heading: "Zusammenfassungen"
              },
              // Lichter Summary (nur wenn View nicht ausgeblendet)
              ...(!configManager.isViewHidden('lights') ? [{
                type: "button",
                icon: "mdi:lamps",
                name: lightsOn > 0 ? `${lightsOn} ${lightsOn === 1 ? 'Licht an' : 'Lichter an'}` : 'Alle Lichter aus',
                show_name: true,
                show_icon: true,
                tap_action: {
                  action: "navigate",
                  navigation_path: "lights"
                }
              }] : []),
              // Covers Summary (nur wenn View nicht ausgeblendet)
              ...(!configManager.isViewHidden('covers') ? [{
                type: "button",
                icon: "mdi:blinds-horizontal",
                name: coversOpen > 0 ? `${coversOpen} ${coversOpen === 1 ? 'Rollo offen' : 'Rollos offen'}` : 'Alle Rollos geschlossen',
                show_name: true,
                show_icon: true,
                tap_action: {
                  action: "navigate",
                  navigation_path: "covers"
                }
              }] : []),
              // Security Summary (nur wenn View nicht ausgeblendet)
              ...(!configManager.isViewHidden('security') ? [{
                type: "button",
                icon: "mdi:security",
                name: securityUnsafe > 0 ? `${securityUnsafe} unsicher` : 'Alles gesichert',
                show_name: true,
                show_icon: true,
                tap_action: {
                  action: "navigate",
                  navigation_path: "security"
                }
              }] : []),
              // Batterie Summary (nur wenn View nicht ausgeblendet)
              ...(!configManager.isViewHidden('batteries') ? [{
                type: "button",
                icon: "mdi:battery-alert",
                name: batteriesCritical > 0 ? `${batteriesCritical} ${batteriesCritical === 1 ? 'Batterie kritisch' : 'Batterien kritisch'}` : 'Alle Batterien OK',
                show_name: true,
                show_icon: true,
                tap_action: {
                  action: "navigate",
                  navigation_path: "batteries"
                }
              }] : [])
            ]
          },
          // Bereiche/Räume Section (nur sichtbare Bereiche)
          {
            type: "grid",
            cards: [
              {
                type: "heading",
                heading_style: "title",
                heading: "Bereiche"
              },
              ...sortedAreas.map((area) => ({
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
      }
    ];

    // Füge Views nur hinzu, wenn sie nicht ausgeblendet sind
    if (!configManager.isViewHidden('lights')) {
      views.push({
        title: "Lichter",
        path: "lights",
        icon: "mdi:lamps",
        strategy: {
          type: "custom:simon42-view-lights",
          entities
        }
      });
    }

    if (!configManager.isViewHidden('covers')) {
      views.push({
        title: "Rollos & Vorhänge",
        path: "covers",
        icon: "mdi:blinds-horizontal",
        strategy: {
          type: "custom:simon42-view-covers",
          entities,
          device_classes: ["awning", "blind", "curtain", "shade", "shutter", "window"]
        }
      });
    }

    if (!configManager.isViewHidden('security')) {
      views.push({
        title: "Sicherheit",
        path: "security",
        icon: "mdi:security",
        strategy: {
          type: "custom:simon42-view-security",
          entities
        }
      });
    }

    if (!configManager.isViewHidden('batteries')) {
      views.push({
        title: "Batterien",
        path: "batteries",
        icon: "mdi:battery-alert",
        strategy: {
          type: "custom:simon42-view-batteries",
          entities
        }
      });
    }

    // Füge für jeden sichtbaren Bereich eine View hinzu
    sortedAreas.forEach(area => {
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
      title: "Simon42 Dashboard",
      views
    };
  }
}

// Registriere Custom Element
customElements.define("ll-strategy-simon42-dashboard", Simon42DashboardStrategy);
