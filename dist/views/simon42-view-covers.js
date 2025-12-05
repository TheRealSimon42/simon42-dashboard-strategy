// ====================================================================
// VIEW STRATEGY - COVERS (Rollos/Vorhänge) - MIT REAKTIVEN GROUP-CARDS
// ====================================================================
// Nutzt zwei reaktive Group-Cards (open/closed) die sich automatisch aktualisieren
// ====================================================================
import { getExcludedLabels, stripCoverType } from '../utils/simon42-helpers.js';

class Simon42ViewCoversStrategy {
  static async generate(config, hass) {
    // Die Strategy generiert zwei reaktive Group-Cards
    // Eine für offene, eine für geschlossene Covers
    // Jede Card aktualisiert sich automatisch und zeigt/versteckt sich bei Bedarf
    
    return {
      type: "sections",
      sections: [
        {
          type: "grid",
          cards: [
            {
              type: "custom:simon42-covers-group-card",
              entities: config.entities,
              config: config.config,
              device_classes: config.device_classes || ["awning", "blind", "curtain", "shade", "shutter", "window"],
              group_type: "open"
            },
            {
              type: "custom:simon42-covers-group-card",
              entities: config.entities,
              config: config.config,
              device_classes: config.device_classes || ["awning", "blind", "curtain", "shade", "shutter", "window"],
              group_type: "closed"
            }
          ]
        }
      ]
    };
  }
}

// Registriere Custom Element
customElements.define("ll-strategy-simon42-view-covers", Simon42ViewCoversStrategy);

