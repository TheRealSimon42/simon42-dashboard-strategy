// ====================================================================
// VIEW STRATEGY - BATTERIEN (Refactored mit Helpers)
// ====================================================================

import { EntityHelper } from '../../helpers/simon42-entity-helper.js';
import { StateCalculator } from '../../helpers/simon42-state-calculator.js';
import { CardGenerator } from '../../helpers/simon42-card-generator.js';

class Simon42ViewBatteriesStrategy {
  static async generate(config, hass) {
    const { entities } = config;
    
    // ====== 1. FILTERUNG ======
    const excludeList = EntityHelper.getEntitiesWithLabel(entities, 'no_dboard');
    
    // ====== 2. BATTERIE ENTITIES ======
    const allBatteries = EntityHelper.getEntitiesByDeviceClass(
      hass.states,
      'sensor',
      ['battery'],
      excludeList
    );
    
    const batteriesCritical = StateCalculator.getCriticalBatteries(hass.states, excludeList);
    
    // ====== 3. GRUPPIERUNG ======
    const critical = [];
    const low = [];
    const medium = [];
    const good = [];
    
    allBatteries.forEach(state => {
      const level = parseFloat(state.state);
      
      if (isNaN(level)) {
        return; // Ignoriere ungültige Werte
      }
      
      if (level <= 10) {
        critical.push({ ...state, level });
      } else if (level <= 25) {
        low.push({ ...state, level });
      } else if (level <= 50) {
        medium.push({ ...state, level });
      } else {
        good.push({ ...state, level });
      }
    });
    
    // Sortiere nach Level (niedrigster zuerst)
    const sortByLevel = (a, b) => a.level - b.level;
    critical.sort(sortByLevel);
    low.sort(sortByLevel);
    medium.sort(sortByLevel);
    good.sort(sortByLevel);
    
    // ====== 4. HELPER FUNKTION ======
    const getBatteryIcon = (level) => {
      if (level <= 10) return 'mdi:battery-10';
      if (level <= 20) return 'mdi:battery-20';
      if (level <= 30) return 'mdi:battery-30';
      if (level <= 40) return 'mdi:battery-40';
      if (level <= 50) return 'mdi:battery-50';
      if (level <= 60) return 'mdi:battery-60';
      if (level <= 70) return 'mdi:battery-70';
      if (level <= 80) return 'mdi:battery-80';
      if (level <= 90) return 'mdi:battery-90';
      return 'mdi:battery';
    };
    
    const getBatteryColor = (level) => {
      if (level <= 10) return 'red';
      if (level <= 25) return 'orange';
      if (level <= 50) return 'yellow';
      return 'green';
    };
    
    // ====== 5. CARDS GENERIEREN ======
    const cards = [];
    
    // Status-Übersicht
    const totalBatteries = allBatteries.length;
    const criticalCount = critical.length;
    
    cards.push({
      type: "grid",
      cards: [
        CardGenerator.createHeadingCard(
          criticalCount > 0 
            ? `🔋 ${criticalCount} von ${totalBatteries} ${criticalCount === 1 ? 'Batterie kritisch' : 'Batterien kritisch'}`
            : `✅ Alle ${totalBatteries} Batterien OK`,
          {
            heading_style: "title",
            icon: criticalCount > 0 ? "mdi:battery-alert" : "mdi:battery-charging"
          }
        )
      ]
    });
    
    // Kritische Batterien
    if (critical.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard(`🚨 Kritisch (≤10%)`, {
            heading_style: "subtitle",
            icon: "mdi:battery-10"
          }),
          ...critical.map(state => 
            CardGenerator.createTileCard({
              entity: state.entity_id,
              icon: getBatteryIcon(state.level),
              color: getBatteryColor(state.level),
              vertical: false,
              state_content: "state"
            })
          )
        ]
      });
    }
    
    // Niedrige Batterien
    if (low.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard(`⚠️ Niedrig (11-25%)`, {
            heading_style: "subtitle",
            icon: "mdi:battery-20"
          }),
          ...low.map(state => 
            CardGenerator.createTileCard({
              entity: state.entity_id,
              icon: getBatteryIcon(state.level),
              color: getBatteryColor(state.level),
              vertical: false,
              state_content: "state"
            })
          )
        ]
      });
    }
    
    // Mittlere Batterien
    if (medium.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard(`🔋 Mittel (26-50%)`, {
            heading_style: "subtitle",
            icon: "mdi:battery-50"
          }),
          ...medium.map(state => 
            CardGenerator.createTileCard({
              entity: state.entity_id,
              icon: getBatteryIcon(state.level),
              color: getBatteryColor(state.level),
              vertical: false,
              state_content: "state"
            })
          )
        ]
      });
    }
    
    // Gute Batterien (optional, kann ausgeblendet werden)
    if (good.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard(`✅ Gut (>50%)`, {
            heading_style: "subtitle",
            icon: "mdi:battery-charging",
            tap_action: {
              action: "toggle"
            }
          }),
          ...good.map(state => 
            CardGenerator.createTileCard({
              entity: state.entity_id,
              icon: getBatteryIcon(state.level),
              color: getBatteryColor(state.level),
              vertical: false,
              state_content: "state"
            })
          )
        ]
      });
    }
    
    // Fallback wenn keine Batterien
    if (allBatteries.length === 0) {
      cards.push({
        type: "markdown",
        content: "## 🔋 Keine Batterien gefunden\n\nEs wurden keine Batterie-Sensoren gefunden."
      });
    }
    
    return { cards };
  }
}

// Registriere Custom Element
customElements.define("ll-strategy-simon42-view-batteries", Simon42ViewBatteriesStrategy);
