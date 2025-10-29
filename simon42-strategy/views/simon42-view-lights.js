// ====================================================================
// VIEW STRATEGY - LICHTER (alle Lichter) - MIT REAKTIVEN GROUP-CARDS
// ====================================================================
// Nutzt zwei reaktive Group-Cards (on/off) die sich automatisch aktualisieren
// ====================================================================
import { getExcludedLabels } from '../utils/simon42-helpers.js';

class Simon42ViewLightsStrategy {
  static async generate(config, hass) {
    // Die Strategy generiert zwei reaktive Group-Cards
    // Eine für eingeschaltete, eine für ausgeschaltete Lichter
    // Jede Card aktualisiert sich automatisch und zeigt/versteckt sich bei Bedarf
    
    return {
      type: "sections",
      sections: [
        {
          type: "grid",
          cards: [
            {
              type: "custom:simon42-lights-group-card",
              entities: config.entities,
              config: config.config,
              group_type: "on"
            },
            {
              type: "custom:simon42-lights-group-card",
              entities: config.entities,
              config: config.config,
              group_type: "off"
            }
          ]
        }
      ]
    };
  }
}

// Registriere Custom Element
customElements.define("ll-strategy-simon42-view-lights", Simon42ViewLightsStrategy);

console.log('✅ Simon42 View Lights Strategy (with reactive group cards) loaded');
