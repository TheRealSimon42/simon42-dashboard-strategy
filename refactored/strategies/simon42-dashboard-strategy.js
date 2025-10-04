// ====================================================================
// SIMON42 DASHBOARD STRATEGY - REFACTORED VERSION
// ====================================================================
// Hauptstrategie mit modularen Helpers
// Version: 2.0.0
// ====================================================================

import { WebSocketHelper } from './helpers/WebSocketHelper.js';
import { EntityHelper } from './helpers/EntityHelper.js';
import { StateCalculator } from './helpers/StateCalculator.js';
import { CardGenerator } from './helpers/CardGenerator.js';

class Simon42DashboardStrategy {
  static async generate(config, hass) {
    try {
      // ====== 1. DATEN LADEN ======
      const data = await WebSocketHelper.fetchAllData(hass);
      const { areas, devices, entities } = data;

      // ====== 2. FILTERUNG ======
      // Entities mit no_dboard Label ausschließen
      const excludeList = EntityHelper.getEntitiesWithLabel(entities, 'no_dboard');
      
      // Sichtbare Bereiche (ohne no_dboard Label)
      const visibleAreas = EntityHelper.filterAreasByLabel(areas, 'no_dboard');

      // ====== 3. STATUS-BERECHNUNGEN ======
      const summary = StateCalculator.getDashboardSummary(hass.states, excludeList);
      
      // Detaillierte Listen für Navigation
      const lightsOn = StateCalculator.getLightsOn(hass.states, excludeList);
      const coversOpen = StateCalculator.getOpenCovers(hass.states, excludeList);
      const securityUnsafe = StateCalculator.getUnsecureEntities(hass.states, excludeList);
      const batteriesCritical = StateCalculator.getCriticalBatteries(hass.states, excludeList);

      // ====== 4. SPEZIELLE ENTITIES ======
      const persons = EntityHelper.getPersons(hass.states, excludeList);
      const weatherEntity = StateCalculator.findWeatherEntity(hass.states);
      
      // Dummy-Entity für Tiles (falls keine echte Entity verfügbar)
      const fallbackEntity = EntityHelper.findFirstAvailable(hass.states, 'sensor', excludeList) 
        || EntityHelper.findFirstAvailable(hass.states, 'light', excludeList)
        || 'sensor.dummy';

      // ====== 5. VIEWS GENERIEREN ======
      const views = this.generateViews({
        visibleAreas,
        persons,
        summary,
        lightsOn,
        coversOpen,
        securityUnsafe,
        batteriesCritical,
        weatherEntity,
        fallbackEntity,
        devices,
        entities,
        excludeList
      });

      return {
        title: config?.title || "Simon42 Dashboard",
        views
      };
      
    } catch (error) {
      console.error("Error generating dashboard:", error);
      return {
        title: "Error",
        views: [{
          title: "Error",
          cards: [{
            type: "markdown",
            content: `## Fehler beim Generieren des Dashboards\n\n${error.message}`
          }]
        }]
      };
    }
  }

  static generateViews(data) {
    const {
      visibleAreas,
      persons,
      summary,
      lightsOn,
      coversOpen,
      securityUnsafe,
      batteriesCritical,
      weatherEntity,
      fallbackEntity,
      devices,
      entities
    } = data;

    const views = [];

    // ====== HOME VIEW ======
    views.push(this.generateHomeView({
      persons,
      summary,
      lightsOn,
      coversOpen,
      securityUnsafe,
      batteriesCritical,
      weatherEntity,
      fallbackEntity,
      visibleAreas
    }));

    // ====== SPEZIAL-VIEWS ======
    views.push({
      title: "Lichter",
      path: "lights",
      icon: "mdi:lamps",
      strategy: {
        type: "custom:simon42-view-lights",
        entities
      }
    });

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

    views.push({
      title: "Sicherheit",
      path: "security",
      icon: "mdi:security",
      strategy: {
        type: "custom:simon42-view-security",
        entities
      }
    });

    views.push({
      title: "Batterien",
      path: "batteries",
      icon: "mdi:battery-alert",
      strategy: {
        type: "custom:simon42-view-batteries",
        entities
      }
    });

    // ====== RAUM-VIEWS ======
    visibleAreas.forEach(area => {
      views.push({
        title: area.name,
        path: area.area_id,
        icon: area.icon || "mdi:floor-plan",
        strategy: {
          type: "custom:simon42-view-room",
          area,
          devices,
          entities
        }
      });
    });

    return views;
  }

  static generateHomeView(data) {
    const {
      persons,
      summary,
      lightsOn,
      coversOpen,
      securityUnsafe,
      batteriesCritical,
      weatherEntity,
      fallbackEntity,
      visibleAreas
    } = data;

    const cards = [];

    // ====== PERSONEN SECTION ======
    if (persons.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard("Personen", { icon: "mdi:account-multiple" }),
          ...persons.map(person => CardGenerator.createPersonCard(person))
        ]
      });
    }

    // ====== STATUS ÜBERSICHT ======
    cards.push({
      type: "grid",
      cards: [
        CardGenerator.createHeadingCard("Übersicht"),
        
        // Lichter
        CardGenerator.createSummaryCard({
          icon: lightsOn.length > 0 ? "mdi:lightbulb-on" : "mdi:lightbulb-off",
          name: lightsOn.length > 0 
            ? `${lightsOn.length} ${lightsOn.length === 1 ? 'Licht an' : 'Lichter an'}` 
            : 'Alle Lichter aus',
          entity: lightsOn.length > 0 ? lightsOn[0].entity_id : fallbackEntity,
          color: 'orange',
          count: lightsOn.length,
          path: 'lights'
        }),
        
        // Covers
        CardGenerator.createSummaryCard({
          icon: "mdi:blinds-horizontal",
          name: coversOpen.length > 0 
            ? `${coversOpen.length} ${coversOpen.length === 1 ? 'Rollo offen' : 'Rollos offen'}` 
            : 'Alle Rollos geschlossen',
          entity: coversOpen.length > 0 ? coversOpen[0].entity_id : fallbackEntity,
          color: 'purple',
          count: coversOpen.length,
          path: 'covers'
        }),
        
        // Security
        CardGenerator.createSummaryCard({
          icon: "mdi:security",
          name: securityUnsafe.length > 0 
            ? `${securityUnsafe.length} unsicher` 
            : 'Alles gesichert',
          entity: securityUnsafe.length > 0 ? securityUnsafe[0] : fallbackEntity,
          color: 'yellow',
          count: securityUnsafe.length,
          path: 'security'
        }),
        
        // Batterien
        CardGenerator.createSummaryCard({
          icon: batteriesCritical.length > 0 ? "mdi:battery-alert" : 'mdi:battery-charging',
          name: batteriesCritical.length > 0 
            ? `${batteriesCritical.length} ${batteriesCritical.length === 1 ? 'Batterie kritisch' : 'Batterien kritisch'}` 
            : 'Alle Batterien OK',
          entity: batteriesCritical.length > 0 ? batteriesCritical[0] : fallbackEntity,
          color: 'red',
          count: batteriesCritical.length,
          path: 'batteries'
        })
      ]
    });

    // ====== BEREICHE SECTION ======
    if (visibleAreas.length > 0) {
      cards.push({
        type: "grid",
        cards: [
          CardGenerator.createHeadingCard("Bereiche", { heading_style: "title" }),
          ...visibleAreas.map(area => CardGenerator.createAreaCard(area))
        ]
      });
    }

    // ====== WETTER & ENERGIE SECTION ======
    const bottomCards = [];
    
    // Wetter
    if (weatherEntity) {
      bottomCards.push(
        CardGenerator.createHeadingCard("Wetter", {
          heading_style: "title",
          icon: "mdi:weather-partly-cloudy"
        }),
        CardGenerator.createWeatherCard(weatherEntity)
      );
    }
    
    // Energie
    bottomCards.push(
      CardGenerator.createHeadingCard("Energie", {
        heading_style: "title",
        icon: "mdi:lightning-bolt"
      }),
      CardGenerator.createEnergyCard()
    );
    
    if (bottomCards.length > 0) {
      cards.push({
        type: "grid",
        cards: bottomCards
      });
    }

    return {
      title: "Home",
      path: "home",
      icon: "mdi:home",
      cards: cards
    };
  }
}

// Registriere Custom Element
customElements.define("ll-strategy-simon42-dashboard", Simon42DashboardStrategy);