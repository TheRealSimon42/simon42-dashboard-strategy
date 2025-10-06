// ====================================================================
// DASHBOARD STRATEGY - Generiert die Hauptstruktur
// ====================================================================
import { getVisibleAreas } from '../utils/simon42-helpers.js';
import { 
  collectPersons, 
  collectLights, 
  collectCovers, 
  collectSecurityUnsafe, 
  collectBatteriesCritical, 
  findWeatherEntity, 
  findDummySensor 
} from '../utils/simon42-data-collectors.js';
import { createPersonBadges } from '../utils/simon42-badge-builder.js';
import { 
  createOverviewSection, 
  createAreasSection, 
  createWeatherEnergySection 
} from '../utils/simon42-section-builder.js';
import { 
  createOverviewView, 
  createUtilityViews, 
  createAreaViews 
} from '../utils/simon42-view-builder.js';

class Simon42DashboardStrategy {
  static async generate(config, hass) {
    // Hole alle benötigten Daten
    const [areas, devices, entities] = await Promise.all([
      hass.callWS({ type: "config/area_registry/list" }),
      hass.callWS({ type: "config/device_registry/list" }),
      hass.callWS({ type: "config/entity_registry/list" }),
    ]);

    // Labels für Filterung von Entitäten
    const excludeLabels = entities
      .filter(e => e.labels?.includes("no_dboard"))
      .map(e => e.entity_id);

    // Filtere und sortiere Areale basierend auf Config
    const visibleAreas = getVisibleAreas(areas, config.areas_display);

    // Sammle alle benötigten Daten
    const persons = collectPersons(hass, excludeLabels);
    const lightsOn = collectLights(hass, excludeLabels);
    const coversOpen = collectCovers(hass, excludeLabels);
    const securityUnsafe = collectSecurityUnsafe(hass, excludeLabels);
    const batteriesCritical = collectBatteriesCritical(hass, excludeLabels);
    const weatherEntity = findWeatherEntity(hass, excludeLabels);
    const someSensorId = findDummySensor(hass, excludeLabels);

    // Erstelle Person-Badges
    const personBadges = createPersonBadges(persons);

    // Prüfe ob Energie-Dashboard angezeigt werden soll (Standard: true)
    const showEnergy = config.show_energy !== false;

    // Prüfe ob Unteransichten angezeigt werden sollen (Standard: false)
    const showSubviews = config.show_subviews === true;

    // Erstelle Sections für den Haupt-View
    const overviewSections = [
      createOverviewSection({
        lightsOn,
        coversOpen,
        securityUnsafe,
        batteriesCritical,
        someSensorId
      }),
      createAreasSection(visibleAreas),
      createWeatherEnergySection(weatherEntity, showEnergy)
    ];

    // Erstelle alle Views
    const views = [
      createOverviewView(overviewSections, personBadges),
      ...createUtilityViews(entities, showSubviews),
      ...createAreaViews(visibleAreas, devices, entities, showSubviews)
    ];

    return {
      title: "Dynamisches Dashboard",
      views
    };
  }

  // Füge die Methode hinzu, um den Config-Editor zu laden
  static async getConfigElement() {
    // Der Editor sollte schon geladen sein, da er im Loader ist
    // Warte kurz, falls er noch lädt
    await import('/local/simon42-strategy/core/simon42-dashboard-strategy-editor.js');
    await customElements.whenDefined('simon42-dashboard-strategy-editor');
    return document.createElement('simon42-dashboard-strategy-editor');
  }
}

// Registriere Custom Element mit dem korrekten Namen
customElements.define("ll-strategy-simon42-dashboard", Simon42DashboardStrategy);
