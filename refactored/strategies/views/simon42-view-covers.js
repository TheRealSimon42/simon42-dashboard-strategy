// ====================================================================
// VIEW STRATEGY - COVERS/ROLLOS (Refactored mit Helpers)
// ====================================================================

import { EntityHelper } from '../../helpers/simon42-entity-helper.js';
import { StateCalculator } from '../../helpers/simon42-state-calculator.js';
import { CardGenerator } from '../../helpers/simon42-card-generator.js';

class Simon42ViewCoversStrategy {
  static async generate(config, hass) {
    const { entities, device_classes = ["awning", "blind", "curtain", "shade", "shutter", "window"] } = config;
    
    // ====== 1. FILTERUNG ======
    const excludeList = EntityHelper.getEntitiesWithLabel(entities, 'no_dboard');
    
    // Alle Cover-Entitäten mit den gewünschten Device Classes
    const allCovers = EntityHelper.getEntitiesByDeviceClass(
      hass.states, 
      'cover', 
      device_classes, 
      excludeList
    );
    
    // ====== 2. GRUPPIERUNG ======
    const coversOpen = StateCalculator.getOpenCovers(hass.states, excludeList);
    const coversClosed = allCovers.filter(state => 
      state.state === 'closed' || state.state === 'closing'
    );
    
    // Nach Device Class gruppieren
    const byDeviceClass = {};
    device_classes.forEach(dc => {
      byDeviceClass[dc] = allCovers.filter(state => 
        state.attributes?.device_class === dc
      );
    });
    
    // ====== 3. CARDS GENERIEREN ======
    const cards = [];
    
    // Offene Covers
    if (coversOpen.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard(
            `📖 Offene Rollos & Vorhänge (${coversOpen.length})`,
            {
              heading_style: "title",
              badges: [
                {
                  type: "entity",
                  entity: coversOpen[0].entity_id,
                  show_name: false,
                  show_state: false,
                  tap_action: {
                    action: "perform-action",
                    perform_action: "cover.close_cover",
                    target: {
                      entity_id: coversOpen.map(c => c.entity_id)
                    }
                  },
                  icon: "mdi:window-shutter"
                }
              ]
            }
          ),
          ...coversOpen.map(state => 
            CardGenerator.createCoverCard(state.entity_id, {
              vertical: false,
              state_content: "last_changed"
            })
          )
        ]
      });
    }
    
    // Geschlossene Covers
    if (coversClosed.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard(
            `📕 Geschlossene Rollos & Vorhänge (${coversClosed.length})`,
            {
              heading_style: "title",
              badges: coversClosed.length > 0 ? [
                {
                  type: "entity",
                  entity: coversClosed[0].entity_id,
                  show_name: false,
                  show_state: false,
                  tap_action: {
                    action: "perform-action",
                    perform_action: "cover.open_cover",
                    target: {
                      entity_id: coversClosed.map(c => c.entity_id)
                    }
                  },
                  icon: "mdi:window-shutter-open"
                }
              ] : []
            }
          ),
          ...coversClosed.map(state => 
            CardGenerator.createCoverCard(state.entity_id, {
              vertical: false
            })
          )
        ]
      });
    }
    
    // Nach Device Class gruppiert (optional, nur wenn gewünscht)
    Object.entries(byDeviceClass).forEach(([deviceClass, covers]) => {
      if (covers.length > 0) {
        const typeNames = {
          shutter: "Rollos",
          curtain: "Vorhänge",
          blind: "Jalousien",
          awning: "Markisen",
          shade: "Sonnenschutz",
          window: "Fenster"
        };
        
        cards.push({
          type: "grid",
          cards: [
            CardGenerator.createHeadingCard(
              typeNames[deviceClass] || deviceClass,
              {
                heading_style: "subtitle",
                icon: deviceClass === 'shutter' ? "mdi:window-shutter" : 
                      deviceClass === 'curtain' ? "mdi:curtains" :
                      "mdi:blinds-horizontal"
              }
            ),
            ...covers.map(state => 
              CardGenerator.createCoverCard(state.entity_id, {
                vertical: false
              })
            )
          ]
        });
      }
    });
    
    // Fallback wenn keine Covers
    if (allCovers.length === 0) {
      cards.push({
        type: "markdown",
        content: "## 🪟 Keine Rollos oder Vorhänge gefunden\n\nEs wurden keine Cover-Entitäten gefunden."
      });
    }
    
    return { cards };
  }
}

// Registriere Custom Element
customElements.define("ll-strategy-simon42-view-covers", Simon42ViewCoversStrategy);
