// ====================================================================
// VIEW STRATEGY - LICHTER (Refactored mit Helpers)
// ====================================================================

import { EntityHelper } from '../../helpers/simon42-entity-helper.js';
import { StateCalculator } from '../../helpers/simon42-state-calculator.js';
import { CardGenerator } from '../../helpers/simon42-card-generator.js';

class Simon42ViewLightsStrategy {
  static async generate(config, hass) {
    const { entities } = config;
    
    // ====== 1. FILTERUNG ======
    const excludeList = EntityHelper.getEntitiesWithLabel(entities, 'no_dboard');
    
    // Alle Licht-Entitäten
    const allLights = EntityHelper.getEntitiesByDomain(hass.states, 'light', excludeList);
    
    // ====== 2. GRUPPIERUNG ======
    const lightsOn = StateCalculator.getLightsOn(hass.states, excludeList);
    const lightsOff = allLights.filter(state => state.state !== 'on');
    
    // ====== 3. CARDS GENERIEREN ======
    const cards = [];
    
    // Eingeschaltete Lichter
    if (lightsOn.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard(
            `💡 Eingeschaltete Lichter (${lightsOn.length})`,
            {
              heading_style: "title",
              badges: [
                {
                  type: "entity",
                  entity: lightsOn[0].entity_id,
                  show_name: false,
                  show_state: false,
                  tap_action: {
                    action: "perform-action",
                    perform_action: "light.turn_off",
                    target: {
                      entity_id: lightsOn.map(l => l.entity_id)
                    }
                  },
                  icon: "mdi:lightbulb-off"
                }
              ]
            }
          ),
          ...lightsOn.map(state => 
            CardGenerator.createLightCard(state.entity_id, {
              vertical: false,
              state_content: "last_changed"
            })
          )
        ]
      });
    }
    
    // Ausgeschaltete Lichter
    if (lightsOff.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard(
            `🌙 Ausgeschaltete Lichter (${lightsOff.length})`,
            {
              heading_style: "title",
              badges: lightsOff.length > 0 ? [
                {
                  type: "entity",
                  entity: lightsOff[0].entity_id,
                  show_name: false,
                  show_state: false,
                  tap_action: {
                    action: "perform-action",
                    perform_action: "light.turn_on",
                    target: {
                      entity_id: lightsOff.map(l => l.entity_id)
                    }
                  },
                  icon: "mdi:lightbulb-on"
                }
              ] : []
            }
          ),
          ...lightsOff.map(state => 
            CardGenerator.createLightCard(state.entity_id, {
              vertical: false
            })
          )
        ]
      });
    }
    
    // Fallback wenn keine Lichter
    if (allLights.length === 0) {
      cards.push({
        type: "markdown",
        content: "## 💡 Keine Lichter gefunden\n\nEs wurden keine Licht-Entitäten gefunden."
      });
    }
    
    return { cards };
  }
}

// Registriere Custom Element
customElements.define("ll-strategy-simon42-view-lights", Simon42ViewLightsStrategy);
