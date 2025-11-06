// ====================================================================
// DASHBOARD STRATEGY - Generiert die Hauptstruktur
// ====================================================================
// Nutzt direkt die im hass-Objekt verfügbaren Registry-Daten
// Keine WebSocket-Calls mehr nötig!
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
    // Nutze die bereits im hass-Objekt verfügbaren Registry-Daten
    // Diese sind als Objects verfügbar mit ID als Key
    // Konvertiere sie zu Arrays für die weitere Verarbeitung
    const areas = Object.values(hass.areas || {});
    const devices = Object.values(hass.devices || {});
    const entities = Object.values(hass.entities || {});
    const floors = Object.values(hass.floors || {});

    // Labels für Filterung von Entitäten
    const excludeLabels = entities
      .filter(e => e.labels?.includes("no_dboard"))
      .map(e => e.entity_id);

    // Filtere und sortiere Areale basierend auf Config
    const visibleAreas = getVisibleAreas(areas, config.areas_display);

    // Sammle alle benötigten Daten (übergebe config für areas_options Filterung)
    const persons = collectPersons(hass, excludeLabels, config);
    const lightsOn = collectLights(hass, excludeLabels, config);
    const coversOpen = collectCovers(hass, excludeLabels, config);
    const securityUnsafe = collectSecurityUnsafe(hass, excludeLabels, config);
    const batteriesCritical = collectBatteriesCritical(hass, excludeLabels, config);
    const weatherEntity = findWeatherEntity(hass, excludeLabels, config);
    const someSensorId = findDummySensor(hass, excludeLabels, config);

    // Erstelle Person-Badges (KORRIGIERT: mit hass Parameter)
    const personBadges = createPersonBadges(persons, hass);

    // Prüfe ob Wetter-Karte angezeigt werden soll (Standard: true)
    const showWeather = config.show_weather !== false;

    // Prüfe ob Energie-Dashboard angezeigt werden soll (Standard: true)
    const showEnergy = config.show_energy !== false;

    // Prüfe ob Such-Karte angezeigt werden soll (Standard: false)
    const showSearchCard = config.show_search_card === true;

    // Prüfe ob Zusammenfassungs-Views angezeigt werden sollen (Standard: false)
    const showSummaryViews = config.show_summary_views === true;

    // Prüfe ob Raum-Views angezeigt werden sollen (Standard: false)
    const showRoomViews = config.show_room_views === true;

    // Prüfe ob Bereiche nach Etagen gruppiert werden sollen (Standard: false)
    const groupByFloors = config.group_by_floors === true;

    // Erstelle Bereiche-Section(s)
    const areasSections = createAreasSection(visibleAreas, groupByFloors, hass);

    // Erstelle Wetter & Energie Section(s)
    const weatherEnergySection = createWeatherEnergySection(weatherEntity, showWeather, showEnergy, groupByFloors);
    
    // Erstelle Sections für den Haupt-View
    const overviewSections = [
      createOverviewSection({
        lightsOn,
        coversOpen,
        securityUnsafe,
        batteriesCritical,
        someSensorId,
        showSearchCard,
        config,
        hass
      }),
      // Wenn groupByFloors aktiv ist, ist areasSections ein Array von Sections
      ...(Array.isArray(areasSections) ? areasSections : [areasSections]),
      // Füge Wetter & Energie Section(s) nur hinzu wenn nicht null/leer
      ...(weatherEnergySection 
        ? (Array.isArray(weatherEnergySection) 
          ? weatherEnergySection 
          : [weatherEnergySection])
        : [])
    ];

    // Erstelle alle Views mit areas_options und config
    const views = [
      createOverviewView(overviewSections, personBadges),
      ...createUtilityViews(entities, showSummaryViews, config),
      ...createAreaViews(visibleAreas, devices, entities, showRoomViews, config.areas_options || {}, config)
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
    await import('./simon42-dashboard-strategy-editor.js');
    await customElements.whenDefined('simon42-dashboard-strategy-editor');
    return document.createElement('simon42-dashboard-strategy-editor');
  }
}

// Registriere Custom Element mit dem korrekten Namen
customElements.define("ll-strategy-simon42-dashboard", Simon42DashboardStrategy);
