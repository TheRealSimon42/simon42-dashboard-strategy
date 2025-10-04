// ====================================================================
// VIEW STRATEGY - SICHERHEIT (Refactored mit Helpers)
// ====================================================================

import { EntityHelper } from '../../helpers/simon42-entity-helper.js';
import { StateCalculator } from '../../helpers/simon42-state-calculator.js';
import { CardGenerator } from '../../helpers/simon42-card-generator.js';

class Simon42ViewSecurityStrategy {
  static async generate(config, hass) {
    const { entities } = config;
    
    // ====== 1. FILTERUNG ======
    const excludeList = EntityHelper.getEntitiesWithLabel(entities, 'no_dboard');
    
    // ====== 2. SECURITY ENTITIES ======
    const securityUnsafe = StateCalculator.getUnsecureEntities(hass.states, excludeList);
    
    // Alle Security-relevanten Entitäten
    const securityDomains = ['binary_sensor', 'lock', 'alarm_control_panel'];
    const securityDeviceClasses = ['door', 'window', 'motion', 'smoke', 'gas', 'safety', 'opening'];
    
    const allSecurityEntities = [];
    
    // Binary Sensors mit Security Device Classes
    const binarySensors = EntityHelper.getEntitiesByDeviceClass(
      hass.states,
      'binary_sensor',
      securityDeviceClasses,
      excludeList
    );
    allSecurityEntities.push(...binarySensors);
    
    // Locks
    const locks = EntityHelper.getEntitiesByDomain(hass.states, 'lock', excludeList);
    allSecurityEntities.push(...locks);
    
    // Alarm Control Panels
    const alarms = EntityHelper.getEntitiesByDomain(hass.states, 'alarm_control_panel', excludeList);
    allSecurityEntities.push(...alarms);
    
    // ====== 3. GRUPPIERUNG ======
    const unsafe = [];
    const safe = [];
    
    allSecurityEntities.forEach(state => {
      if (securityUnsafe.includes(state.entity_id)) {
        unsafe.push(state);
      } else {
        safe.push(state);
      }
    });
    
    // Nach Device Class gruppieren
    const byType = {
      doors: [],
      windows: [],
      motion: [],
      smoke: [],
      locks: [],
      alarms: [],
      other: []
    };
    
    allSecurityEntities.forEach(state => {
      const deviceClass = state.attributes?.device_class;
      const domain = state.entity_id.split('.')[0];
      
      if (domain === 'lock') {
        byType.locks.push(state);
      } else if (domain === 'alarm_control_panel') {
        byType.alarms.push(state);
      } else if (deviceClass === 'door' || deviceClass === 'opening') {
        byType.doors.push(state);
      } else if (deviceClass === 'window') {
        byType.windows.push(state);
      } else if (deviceClass === 'motion') {
        byType.motion.push(state);
      } else if (deviceClass === 'smoke' || deviceClass === 'gas' || deviceClass === 'safety') {
        byType.smoke.push(state);
      } else {
        byType.other.push(state);
      }
    });
    
    // ====== 4. CARDS GENERIEREN ======
    const cards = [];
    
    // Status-Übersicht
    cards.push({
      type: "grid",
      cards: [
        CardGenerator.createHeadingCard(
          unsafe.length > 0 
            ? `⚠️ ${unsafe.length} ${unsafe.length === 1 ? 'Problem' : 'Probleme'} gefunden`
            : "✅ Alles sicher",
          {
            heading_style: "title",
            icon: unsafe.length > 0 ? "mdi:shield-alert" : "mdi:shield-check"
          }
        )
      ]
    });
    
    // Unsichere Entitäten
    if (unsafe.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard("🚨 Benötigt Aufmerksamkeit", {
            heading_style: "subtitle"
          }),
          ...unsafe.map(state => {
            const domain = state.entity_id.split('.')[0];
            return CardGenerator.createTileCard({
              entity: state.entity_id,
              color: 'red',
              vertical: false,
              state_content: domain === 'lock' ? 'state' : 'last_changed'
            });
          })
        ]
      });
    }
    
    // Gruppiert nach Typ
    const typeConfig = {
      doors: { title: "Türen", icon: "mdi:door-closed" },
      windows: { title: "Fenster", icon: "mdi:window-closed" },
      locks: { title: "Schlösser", icon: "mdi:lock" },
      alarms: { title: "Alarmanlagen", icon: "mdi:shield-home" },
      motion: { title: "Bewegungsmelder", icon: "mdi:motion-sensor" },
      smoke: { title: "Rauch & Gas", icon: "mdi:smoke-detector" },
      other: { title: "Sonstiges", icon: "mdi:security" }
    };
    
    Object.entries(byType).forEach(([type, entities]) => {
      if (entities.length > 0) {
        const config = typeConfig[type];
        cards.push({
          type: "grid",
          cards: [
            CardGenerator.createHeadingCard(config.title, {
              heading_style: "subtitle",
              icon: config.icon
            }),
            ...entities.map(state => {
              const domain = state.entity_id.split('.')[0];
              const isUnsafe = securityUnsafe.includes(state.entity_id);
              
              return CardGenerator.createTileCard({
                entity: state.entity_id,
                color: isUnsafe ? 'red' : 'green',
                vertical: false,
                state_content: domain === 'lock' ? 'state' : 'last_changed'
              });
            })
          ]
        });
      }
    });
    
    // Fallback wenn keine Security-Entitäten
    if (allSecurityEntities.length === 0) {
      cards.push({
        type: "markdown",
        content: "## 🔒 Keine Sicherheits-Entitäten gefunden\n\nEs wurden keine Türen, Fenster, Schlösser oder Alarmanlagen gefunden."
      });
    }
    
    return { cards };
  }
}

// Registriere Custom Element
customElements.define("ll-strategy-simon42-view-security", Simon42ViewSecurityStrategy);
