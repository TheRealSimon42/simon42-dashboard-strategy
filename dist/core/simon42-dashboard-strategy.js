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
  createWeatherSection,
  createPublicTransportSection,
  createEnergySection
} from '../utils/simon42-section-builder.js';
import { 
  createOverviewView, 
  createUtilityViews, 
  createAreaViews 
} from '../utils/simon42-view-builder.js';
import { initLanguage, t, getLanguage } from '../utils/simon42-i18n.js';
import { initLogger, logDebug, logInfo } from '../utils/simon42-logger.js';

class Simon42DashboardStrategy {
  static async generate(config, hass) {
    // Initialisiere Logger basierend auf Config
    initLogger(config);
    logInfo('[Strategy] Starting dashboard generation');
    logDebug('[Strategy] Config:', config);
    
    // Initialisiere Sprache basierend auf Config und hass-Einstellungen
    // Wichtig: Muss VOR allen t()-Aufrufen passieren!
    initLanguage(config, hass);
    logDebug('[Strategy] Language initialized:', getLanguage());
    
    // Nutze die bereits im hass-Objekt verfügbaren Registry-Daten
    // Diese sind als Objects verfügbar mit ID als Key
    // Konvertiere sie zu Arrays für die weitere Verarbeitung
    const areas = Object.values(hass.areas || {});
    const devices = Object.values(hass.devices || {});
    const entities = Object.values(hass.entities || {});
    const floors = Object.values(hass.floors || {});
    
    logDebug('[Strategy] Loaded data:', {
      areas: areas.length,
      devices: devices.length,
      entities: entities.length,
      floors: floors.length
    });

    // Labels für Filterung von Entitäten
    const excludeLabels = entities
      .filter(e => e.labels?.includes("no_dboard"))
      .map(e => e.entity_id);
    logDebug('[Strategy] Excluded labels:', excludeLabels.length, 'entities');

    // Filtere und sortiere Areale basierend auf Config
    const visibleAreas = getVisibleAreas(areas, config.areas_display);
    logDebug('[Strategy] Visible areas:', visibleAreas.length, 'of', areas.length);

    // Sammle alle benötigten Daten (übergebe config für areas_options Filterung)
    logDebug('[Strategy] Collecting entities...');
    const persons = collectPersons(hass, excludeLabels, config);
    const lightsOn = collectLights(hass, excludeLabels, config);
    const coversOpen = collectCovers(hass, excludeLabels, config);
    const securityUnsafe = collectSecurityUnsafe(hass, excludeLabels, config);
    const batteriesCritical = collectBatteriesCritical(hass, excludeLabels, config);
    const weatherEntity = findWeatherEntity(hass, excludeLabels, config);
    const someSensorId = findDummySensor(hass, excludeLabels, config);
    
    logDebug('[Strategy] Collected entities:', {
      persons: persons.length,
      lightsOn: lightsOn.length,
      coversOpen: coversOpen.length,
      securityUnsafe: securityUnsafe.length,
      batteriesCritical: batteriesCritical.length,
      weatherEntity: weatherEntity || 'none',
      someSensorId: someSensorId || 'none'
    });

    // Prüfe ob Personen-Badges angezeigt werden sollen (Standard: true)
    const showPersonBadges = config.show_person_badges !== false;

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

    // Erstelle Person-Badges (mit showPersonBadges Parameter)
    const personBadges = createPersonBadges(persons, hass, showPersonBadges);

    // Erstelle Bereiche-Section(s)
    logDebug('[Strategy] Creating areas section...');
    const areasSections = createAreasSection(visibleAreas, groupByFloors, hass);

    // Erstelle separate Sections: Weather, Public Transport, Energy
    logDebug('[Strategy] Creating additional sections...');
    const weatherSection = createWeatherSection(weatherEntity, showWeather, config);
    const publicTransportSection = createPublicTransportSection(config, hass);
    const energySection = createEnergySection(showEnergy);
    
    // Erstelle Sections für den Haupt-View
    logDebug('[Strategy] Creating overview section...');
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
      // Füge Sections in der richtigen Reihenfolge hinzu: Weather, Public Transport, Energy
      ...(weatherSection ? [weatherSection] : []),
      ...(publicTransportSection ? [publicTransportSection] : []),
      ...(energySection ? [energySection] : [])
    ];
    logDebug('[Strategy] Created', overviewSections.length, 'overview sections');

    // Erstelle alle Views mit areas_options und config
    logDebug('[Strategy] Creating views...');
    const utilityViews = createUtilityViews(entities, showSummaryViews, config);
    const areaViews = createAreaViews(visibleAreas, devices, entities, showRoomViews, config.areas_options || {}, config);
    const views = [
      createOverviewView(overviewSections, personBadges, config, hass),
      ...utilityViews,
      ...areaViews
    ];
    logInfo('[Strategy] Generated', views.length, 'views:', {
      overview: 1,
      utility: utilityViews.length,
      area: areaViews.length
    });

    return {
      title: t('dashboardTitle'),
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
