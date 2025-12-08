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
  createEnergySection,
  createSchedulerCardSection,
  createCalendarCardSection
} from '../utils/simon42-section-builder.js';
import { 
  createOverviewView, 
  createUtilityViews, 
  createAreaViews 
} from '../utils/simon42-view-builder.js';
import { initLanguage, t, getLanguage } from '../utils/simon42-i18n.js';
import { initLogger, logDebug, logInfo } from '../utils/simon42-logger.js';

// Cache für letzte Generation, um unnötige Logs zu vermeiden
let lastGenerationState = null;

/**
 * Erstellt einen Hash-Key für die aktuelle Generation basierend auf wichtigen Metriken
 */
function getGenerationKey(entities, areas, persons, lightsOn, coversOpen, securityUnsafe, batteriesCritical, weatherEntity) {
  return JSON.stringify({
    entities: entities.length,
    areas: areas.length,
    persons: persons.length,
    lightsOn: lightsOn.length,
    coversOpen: coversOpen.length,
    securityUnsafe: securityUnsafe.length,
    batteriesCritical: batteriesCritical.length,
    weatherEntity: weatherEntity || null
  });
}

class Simon42DashboardStrategy {
  static async generate(config, hass) {
    // Initialisiere Logger basierend auf Config
    initLogger(config);
    
    // Initialisiere Sprache basierend auf Config und hass-Einstellungen
    // Wichtig: Muss VOR allen t()-Aufrufen passieren!
    initLanguage(config, hass);
    
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
    
    // Prüfe ob sich etwas geändert hat
    const currentKey = getGenerationKey(entities, areas, persons, lightsOn, coversOpen, securityUnsafe, batteriesCritical, weatherEntity);
    const hasChanged = lastGenerationState !== currentKey;
    
    // Nur loggen wenn sich etwas geändert hat oder es die erste Generation ist
    if (hasChanged || lastGenerationState === null) {
      logInfo('[Strategy] Starting dashboard generation' + (hasChanged && lastGenerationState !== null ? ' (changes detected)' : ''));
      logDebug('[Strategy] Config:', config);
      logDebug('[Strategy] Language initialized:', getLanguage());
      logDebug('[Strategy] Loaded data:', {
        areas: areas.length,
        devices: devices.length,
        entities: entities.length,
        floors: floors.length
      });
      logDebug('[Strategy] Excluded labels:', excludeLabels.length, 'entities');
      logDebug('[Strategy] Visible areas:', visibleAreas.length, 'of', areas.length);
      logDebug('[Strategy] Collected entities:', {
        persons: persons.length,
        lightsOn: lightsOn.length,
        coversOpen: coversOpen.length,
        securityUnsafe: securityUnsafe.length,
        batteriesCritical: batteriesCritical.length,
        weatherEntity: weatherEntity || 'none',
        someSensorId: someSensorId || 'none'
      });
      
      // Aktualisiere Cache
      lastGenerationState = currentKey;
    }

    // Prüfe ob Personen-Badges angezeigt werden sollen (Standard: true)
    const showPersonBadges = config.show_person_badges !== false;

    // Prüfe ob Profilbilder für Personen angezeigt werden sollen (Standard: false)
    const showPersonProfilePicture = config.show_person_profile_picture === true;

    // Prüfe ob Wetter-Karte angezeigt werden soll (Standard: true)
    const showWeather = config.show_weather !== false;

    // Prüfe ob Energie-Dashboard angezeigt werden soll (Standard: true)
    const showEnergy = config.show_energy !== false;

    // Prüfe ob Such-Karte angezeigt werden soll (Standard: false)
    const showSearchCard = config.show_search_card === true;

    // Prüfe ob Uhr-Karte angezeigt werden soll (Standard: false)
    const showClockCard = config.show_clock_card === true;

    // Prüfe ob Zusammenfassungs-Views angezeigt werden sollen (Standard: false)
    const showSummaryViews = config.show_summary_views === true;

    // Prüfe ob Raum-Views angezeigt werden sollen (Standard: false)
    const showRoomViews = config.show_room_views === true;

    // Prüfe ob Bereiche nach Etagen gruppiert werden sollen (Standard: false)
    const groupByFloors = config.group_by_floors === true;

    // Erstelle Person-Badges (mit showPersonBadges und showPersonProfilePicture Parameter)
    const personBadges = createPersonBadges(persons, hass, showPersonBadges, showPersonProfilePicture);

    // Erstelle Bereiche-Section(s)
    if (hasChanged || lastGenerationState === null) {
      logDebug('[Strategy] Creating areas section...');
    }
    const areasSections = createAreasSection(visibleAreas, groupByFloors, hass, config);

    // Erstelle separate Sections: Weather, Public Transport, Energy, Scheduler, Calendar
    if (hasChanged || lastGenerationState === null) {
      logDebug('[Strategy] Creating additional sections...');
    }
    const weatherSection = createWeatherSection(weatherEntity, showWeather, config, hass);
    const publicTransportSection = createPublicTransportSection(config, hass);
    const energySection = createEnergySection(showEnergy);
    const schedulerCardSection = createSchedulerCardSection(config, hass);
    const calendarCardSection = createCalendarCardSection(config, hass);
    
    // Erstelle Sections für den Haupt-View
    if (hasChanged || lastGenerationState === null) {
      logDebug('[Strategy] Creating overview section...');
    }
    const overviewSections = [
      createOverviewSection({
        lightsOn,
        coversOpen,
        securityUnsafe,
        batteriesCritical,
        someSensorId,
        showSearchCard,
        showClockCard,
        config,
        hass
      }),
      // Wenn groupByFloors aktiv ist, ist areasSections ein Array von Sections
      ...(Array.isArray(areasSections) ? areasSections : [areasSections]),
      // Füge Sections in der richtigen Reihenfolge hinzu: Weather, Public Transport, Energy, Scheduler, Calendar
      ...(weatherSection ? [weatherSection] : []),
      ...(publicTransportSection ? [publicTransportSection] : []),
      ...(energySection ? [energySection] : []),
      ...(schedulerCardSection ? [schedulerCardSection] : []),
      ...(calendarCardSection ? [calendarCardSection] : [])
    ];
    if (hasChanged || lastGenerationState === null) {
      logDebug('[Strategy] Created', overviewSections.length, 'overview sections');
    }

    // Erstelle alle Views mit areas_options und config
    if (hasChanged || lastGenerationState === null) {
      logDebug('[Strategy] Creating views...');
    }
    const utilityViews = createUtilityViews(entities, showSummaryViews, config);
    const areaViews = createAreaViews(visibleAreas, devices, entities, showRoomViews, config.areas_options || {}, config);
    const views = [
      createOverviewView(overviewSections, personBadges, config, hass),
      ...utilityViews,
      ...areaViews
    ];
    if (hasChanged || lastGenerationState === null) {
      logInfo('[Strategy] Generated', views.length, 'views:', {
        overview: 1,
        utility: utilityViews.length,
        area: areaViews.length
      });
    }

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
