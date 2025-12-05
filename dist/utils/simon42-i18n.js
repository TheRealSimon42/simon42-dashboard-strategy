// ====================================================================
// I18N UTILITY - Übersetzungs-System für Deutsch und Englisch
// ====================================================================

// Übersetzungen für Deutsch (de) und Englisch (en)
const translations = {
  de: {
    // Übersicht
    overview: "Übersicht",
    summaries: "Zusammenfassungen",
    favorites: "Favoriten",
    areas: "Bereiche",
    moreAreas: "Weitere Bereiche",
    
    // Views
    lights: "Lichter",
    lightsOn: "Eingeschaltete Lichter",
    lightsOff: "Ausgeschaltete Lichter",
    turnAllOn: "Alle einschalten",
    turnAllOff: "Alle ausschalten",
    
    covers: "Rollos & Vorhänge",
    coversOpen: "Offene Rollos & Vorhänge",
    coversClosed: "Geschlossene Rollos & Vorhänge",
    openAll: "Alle öffnen",
    closeAll: "Alle schließen",
    
    security: "Sicherheit",
    locks: "Schlösser",
    locksUnlocked: "Schlösser - Entriegelt",
    locksLocked: "Schlösser - Verriegelt",
    doors: "Türen & Tore",
    doorsOpen: "Türen & Tore - Offen",
    doorsClosed: "Türen & Tore - Geschlossen",
    garages: "Garagen",
    garagesOpen: "Garagen - Offen",
    garagesClosed: "Garagen - Geschlossen",
    windows: "Fenster & Öffnungen",
    windowsOpen: "Fenster & Öffnungen - Offen",
    windowsClosed: "Fenster & Öffnungen - Geschlossen",
    
    batteries: "Batterien",
    batteriesCritical: "Kritisch (< 20%)",
    batteriesLow: "Niedrig (20-50%)",
    batteriesGood: "Gut (> 50%)",
    battery: "Batterie",
    batteriesPlural: "Batterien",
    
    // Summary Card
    summaryLightOn: "Licht an",
    summaryLightsOn: "Lichter an",
    summaryAllLightsOff: "Alle Lichter aus",
    summaryCoverOpen: "Rollo offen",
    summaryCoversOpen: "Rollos offen",
    summaryAllCoversClosed: "Alle Rollos geschlossen",
    summaryInsecure: "unsicher",
    summaryAllSecure: "Alles gesichert",
    summaryBatteryCritical: "kritisch",
    summaryAllBatteriesOK: "Alle Batterien OK",
    
    // Raum-View
    lighting: "Beleuchtung",
    climate: "Klima",
    blinds: "Rollos & Jalousien",
    curtains: "Vorhänge",
    media: "Medien",
    scenes: "Szenen",
    misc: "Sonstiges",
    cameras: "Kameras",
    roomPins: "Raum-Pins",
    
    // Wetter & Energie
    weather: "Wetter",
    energy: "Energie",
    publicTransport: "Öffentlicher Nahverkehr",
    
    // Dashboard-Titel
    dashboardTitle: "Dynamisches Dashboard",
    
    // Editor
    infoCards: "Info-Karten",
    showWeatherCard: "Wetter-Karte anzeigen",
    showEnergyDashboard: "Energie-Dashboard anzeigen",
    alarmControlPanel: "Alarm-Control-Panel",
    alarmEntity: "Alarm-Entität:",
    none: "Keine",
    noneFullWidth: "Keine (Uhr in voller Breite)",
    selectEntity: "Entität auswählen...",
    add: "Hinzufügen",
    noEntitiesAdded: "Keine Entitäten hinzugefügt",
    noFavoritesAdded: "Keine Favoriten hinzugefügt",
    noRoomPinsAdded: "Keine Raum-Pins hinzugefügt",
    noRoom: "Kein Raum",
    searchCard: "Such-Karte",
    showSearchCard: "Such-Karte in Übersicht anzeigen",
    betterThermostat: "Better Thermostat",
    useBetterThermostatUI: "Better Thermostat UI verwenden",
    horizonCard: "Horizon Card",
    showHorizonCard: "Horizon Card anzeigen",
    showExtendedInfo: "Erweiterte Informationen anzeigen",
    showPublicTransport: "Öffentlicher Nahverkehr in Übersicht anzeigen",
    showTime: "Zeit anzeigen",
    showTitle: "Titel anzeigen",
    title: "Titel:",
    maxDepartures: "Max. Abfahrten:",
    showCoversSummary: "Rollo-Zusammenfassung anzeigen",
    summariesLayout: "Zusammenfassungen Layout",
    twoColumns: "2 Spalten (2x2 Grid)",
    fourColumns: "4 Spalten (1x4 Reihe)",
    views: "Ansichten",
    showSummaryViews: "Zusammenfassungs-Views anzeigen",
    showRoomViews: "Raum-Views anzeigen",
    areasView: "Bereiche-Ansicht",
    groupByFloors: "Bereiche in Etagen gliedern",
    noAreasAvailable: "Keine Bereiche verfügbar",
    loadingEntities: "Lade Entitäten...",
    noEntitiesInArea: "Keine Entitäten in diesem Bereich gefunden",
    vacuum: "Staubsauger",
    fans: "Ventilatoren",
    switches: "Schalter",
    
    // Editor Beschreibungen
    weatherCardDescription: "Zeigt die Wettervorhersage-Karte in der Übersicht an, wenn eine Wetter-Entität verfügbar ist.",
    energyCardDescription: "Zeigt die Energie-Verteilungskarte in der Übersicht an, wenn Energiedaten verfügbar sind.",
    alarmEntityDescription: "Wähle eine Alarm-Control-Panel-Entität aus, um sie neben der Uhr anzuzeigen. \"Keine\" auswählen, um nur die Uhr in voller Breite anzuzeigen.",
    favoritesDescription: "Wähle Entitäten aus, die als Favoriten unter den Zusammenfassungen angezeigt werden sollen. Die Entitäten werden als Kacheln angezeigt.",
    roomPinsDescription: "Wähle Entitäten aus, die in ihren zugeordneten Räumen als erstes angezeigt werden sollen. Ideal für Entitäten die normalerweise nicht automatisch erfasst werden (z.B. Wetterstationen, spezielle Sensoren). Nur Entitäten mit Raum-Zuordnung können ausgewählt werden. Diese Pins erscheinen nur im jeweiligen Raum, nicht in der Übersicht.",
    searchCardDescription: "Zeigt die custom:search-card direkt unter der Uhr in der Übersicht an.",
    searchCardMissingDeps: "Benötigt custom:search-card und card-tools. Bitte installiere beide Komponenten, um diese Funktion zu nutzen.",
    betterThermostatDescription: "Ersetzt die Standard-Thermostat-Karten in den Räumen durch Better Thermostat UI-Karten. Erfordert die Installation von better_thermostat Integration und better-thermostat-ui-card.",
    betterThermostatMissingDeps: "Benötigt better_thermostat Integration und better-thermostat-ui-card. Bitte installiere beide Komponenten, um diese Funktion zu nutzen.",
    horizonCardDescription: "Zeigt die Horizon Card in der Wetter-Sektion an, um die Position der Sonne über dem Horizont zu visualisieren.",
    horizonCardMissingDeps: "Benötigt lovelace-horizon-card. Bitte installiere die Card über HACS, um diese Funktion zu nutzen.",
    horizonCardExtendedDescription: "Zeigt zusätzliche Informationen wie Azimut, Elevation, Mondaufgang/-untergang und Mondphase an.",
    publicTransportDescription: "Zeigt Abfahrtszeiten des öffentlichen Nahverkehrs in der Übersicht an.",
    publicTransportIntegration: "Integration:",
    publicTransportCard: "Card:",
    selectIntegration: "Integration auswählen...",
    selectCard: "Card auswählen...",
    publicTransportIntegrationHVV: "HVV",
    publicTransportIntegrationHADepartures: "ha-departures",
    publicTransportIntegrationDBInfo: "db_info",
    publicTransportCardHVV: "hvv-card",
    publicTransportCardHADepartures: "ha-departures-card",
    publicTransportCardDBInfo: "flex-table-card",
    publicTransportCardAvailable: "Die gewählte Card ist verfügbar.",
    publicTransportCardMissingDeps: "Die Card '{card}' ist nicht installiert. Bitte installiere die entsprechende Card über HACS.",
    publicTransportIntegrationRequired: "Bitte wähle zuerst eine Integration aus.",
    publicTransportIntegrationLink: "Integration:",
    publicTransportCardLink: "Card:",
    publicTransportIntegrationAvailableInCore: "Verfügbar in Home Assistant Core (Standard)",
    publicTransportEntitiesDescription: "Wähle eine oder mehrere Entitäten aus, die Abfahrtszeiten bereitstellen. Diese werden in der Übersicht angezeigt.",
    publicTransportColumnStart: "Start",
    publicTransportColumnConnection: "Verbindung",
    publicTransportColumnDeparture: "Abfahrt",
    publicTransportColumnArrival: "Ankunft",
    haDeparturesMaxNote: "Hinweis: Die ha-departures-card unterstützt maximal 5 Abfahrten.",
    coversSummaryDescription: "Zeigt die Rollo-Zusammenfassungskarte in der Übersicht an.",
    summariesLayoutDescription: "Wähle aus, wie die Zusammenfassungskarten angezeigt werden sollen. Das Layout passt sich automatisch an, wenn Karten ausgeblendet werden.",
    summaryViewsDescription: "Zeigt die Zusammenfassungs-Views (Lichter, Rollos, Sicherheit, Batterien) in der oberen Navigation an.",
    roomViewsDescription: "Zeigt die einzelnen Raum-Views in der oberen Navigation an.",
    groupByFloorsDescription: "Gruppiert die Bereiche in der Übersicht nach Etagen. Wenn aktiviert, wird für jede Etage eine separate Section erstellt.",
    entityNamePatterns: "Entity-Namen Transformation",
    entityNamePatternsDescription: "Definiere Regex-Patterns, um Präfixe oder Suffixe aus Entity-Namen zu entfernen. Dies ist nützlich, wenn Entities strukturierte Namen haben (z.B. 'Socket - Raum - Name'). Patterns werden nacheinander angewendet.",
    addPattern: "Pattern hinzufügen",
    patternPlaceholder: "Regex-Pattern (z.B. '^.*? - .*? - ')",
    noPatternsAdded: "Keine Patterns hinzugefügt",
    areasDescription: "Wähle aus, welche Bereiche im Dashboard angezeigt werden sollen und in welcher Reihenfolge. Klappe Bereiche auf, um einzelne Entitäten zu verwalten."
  },
  en: {
    // Overview
    overview: "Overview",
    summaries: "Summaries",
    favorites: "Favorites",
    areas: "Areas",
    moreAreas: "More Areas",
    
    // Views
    lights: "Lights",
    lightsOn: "Lights On",
    lightsOff: "Lights Off",
    turnAllOn: "Turn All On",
    turnAllOff: "Turn All Off",
    
    covers: "Blinds & Curtains",
    coversOpen: "Open Blinds & Curtains",
    coversClosed: "Closed Blinds & Curtains",
    openAll: "Open All",
    closeAll: "Close All",
    
    security: "Security",
    locks: "Locks",
    locksUnlocked: "Locks - Unlocked",
    locksLocked: "Locks - Locked",
    doors: "Doors & Gates",
    doorsOpen: "Doors & Gates - Open",
    doorsClosed: "Doors & Gates - Closed",
    garages: "Garages",
    garagesOpen: "Garages - Open",
    garagesClosed: "Garages - Closed",
    windows: "Windows & Openings",
    windowsOpen: "Windows & Openings - Open",
    windowsClosed: "Windows & Openings - Closed",
    
    batteries: "Batteries",
    batteriesCritical: "Critical (< 20%)",
    batteriesLow: "Low (20-50%)",
    batteriesGood: "Good (> 50%)",
    battery: "Battery",
    batteriesPlural: "Batteries",
    
    // Summary Card
    summaryLightOn: "Light on",
    summaryLightsOn: "Lights on",
    summaryAllLightsOff: "All lights off",
    summaryCoverOpen: "Blind open",
    summaryCoversOpen: "Blinds open",
    summaryAllCoversClosed: "All blinds closed",
    summaryInsecure: "insecure",
    summaryAllSecure: "All secure",
    summaryBatteryCritical: "critical",
    summaryAllBatteriesOK: "All batteries OK",
    
    // Room View
    lighting: "Lighting",
    climate: "Climate",
    blinds: "Blinds & Shutters",
    curtains: "Curtains",
    media: "Media",
    scenes: "Scenes",
    misc: "Miscellaneous",
    cameras: "Cameras",
    roomPins: "Room Pins",
    
    // Weather & Energy
    weather: "Weather",
    energy: "Energy",
    publicTransport: "Public Transport",
    
    // Dashboard Title
    dashboardTitle: "Dynamic Dashboard",
    
    // Editor
    infoCards: "Info Cards",
    showWeatherCard: "Show Weather Card",
    showEnergyDashboard: "Show Energy Dashboard",
    alarmControlPanel: "Alarm Control Panel",
    alarmEntity: "Alarm Entity:",
    none: "None",
    noneFullWidth: "None (Clock full width)",
    selectEntity: "Select entity...",
    add: "Add",
    noEntitiesAdded: "No entities added",
    noFavoritesAdded: "No favorites added",
    noRoomPinsAdded: "No room pins added",
    noRoom: "No Room",
    searchCard: "Search Card",
    showSearchCard: "Show Search Card in Overview",
    betterThermostat: "Better Thermostat",
    useBetterThermostatUI: "Use Better Thermostat UI",
    horizonCard: "Horizon Card",
    showHorizonCard: "Show Horizon Card",
    showExtendedInfo: "Show Extended Information",
    showPublicTransport: "Show Public Transport in Overview",
    showTime: "Show Time",
    showTitle: "Show Title",
    title: "Title:",
    maxDepartures: "Max. Departures:",
    showCoversSummary: "Show Blinds Summary",
    summariesLayout: "Summaries Layout",
    twoColumns: "2 Columns (2x2 Grid)",
    fourColumns: "4 Columns (1x4 Row)",
    views: "Views",
    showSummaryViews: "Show Summary Views",
    showRoomViews: "Show Room Views",
    areasView: "Areas View",
    groupByFloors: "Group Areas by Floors",
    noAreasAvailable: "No areas available",
    loadingEntities: "Loading entities...",
    noEntitiesInArea: "No entities found in this area",
    vacuum: "Vacuum",
    fans: "Fans",
    switches: "Switches",
    
    // Editor Descriptions
    weatherCardDescription: "Shows the weather forecast card in the overview when a weather entity is available.",
    energyCardDescription: "Shows the energy distribution card in the overview when energy data is available.",
    alarmEntityDescription: "Select an Alarm Control Panel entity to display it next to the clock. Select \"None\" to show only the clock at full width.",
    favoritesDescription: "Select entities to display as favorites under the summaries. The entities will be displayed as tiles.",
    roomPinsDescription: "Select entities to display first in their assigned rooms. Ideal for entities that are not automatically detected (e.g., weather stations, special sensors). Only entities with room assignment can be selected. These pins appear only in the respective room, not in the overview.",
    searchCardDescription: "Shows the custom:search-card directly under the clock in the overview.",
    searchCardMissingDeps: "Requires custom:search-card and card-tools. Please install both components to use this feature.",
    betterThermostatDescription: "Replaces the standard thermostat cards in rooms with Better Thermostat UI cards. Requires installation of better_thermostat integration and better-thermostat-ui-card.",
    betterThermostatMissingDeps: "Requires better_thermostat integration and better-thermostat-ui-card. Please install both components to use this feature.",
    horizonCardDescription: "Shows the Horizon Card in the weather section to visualize the position of the sun above the horizon.",
    horizonCardMissingDeps: "Requires lovelace-horizon-card. Please install the card via HACS to use this feature.",
    horizonCardExtendedDescription: "Shows additional information such as azimuth, elevation, moonrise/moonset and moon phase.",
    publicTransportDescription: "Shows public transport departure times in the overview.",
    publicTransportIntegration: "Integration:",
    publicTransportCard: "Card:",
    selectIntegration: "Select integration...",
    selectCard: "Select card...",
    publicTransportIntegrationHVV: "HVV",
    publicTransportIntegrationHADepartures: "ha-departures",
    publicTransportIntegrationDBInfo: "db_info",
    publicTransportCardHVV: "hvv-card",
    publicTransportCardHADepartures: "ha-departures-card",
    publicTransportCardDBInfo: "flex-table-card",
    publicTransportCardAvailable: "The selected card is available.",
    publicTransportCardMissingDeps: "The card '{card}' is not installed. Please install the corresponding card via HACS.",
    publicTransportIntegrationRequired: "Please select an integration first.",
    publicTransportIntegrationLink: "Integration:",
    publicTransportCardLink: "Card:",
    publicTransportIntegrationAvailableInCore: "Available in Home Assistant Core (default)",
    publicTransportEntitiesDescription: "Select one or more entities that provide departure times. These will be displayed in the overview.",
    publicTransportColumnStart: "Start",
    publicTransportColumnConnection: "Connection",
    publicTransportColumnDeparture: "Departure",
    publicTransportColumnArrival: "Arrival",
    haDeparturesMaxNote: "Note: The ha-departures-card supports a maximum of 5 departures.",
    coversSummaryDescription: "Shows the blinds summary card in the overview.",
    summariesLayoutDescription: "Choose how the summary cards should be displayed. The layout automatically adjusts when cards are hidden.",
    summaryViewsDescription: "Shows the summary views (Lights, Blinds, Security, Batteries) in the top navigation.",
    roomViewsDescription: "Shows the individual room views in the top navigation.",
    groupByFloorsDescription: "Groups areas in the overview by floors. When enabled, a separate section is created for each floor.",
    entityNamePatterns: "Entity Name Transformation",
    entityNamePatternsDescription: "Define regex patterns to remove prefixes or suffixes from entity names. Useful when entities have structured names (e.g., 'Socket - Room - Name'). Patterns are applied sequentially.",
    addPattern: "Add Pattern",
    patternPlaceholder: "Regex pattern (e.g., '^.*? - .*? - ')",
    noPatternsAdded: "No patterns added",
    areasDescription: "Choose which areas should be displayed in the dashboard and in what order. Expand areas to manage individual entities."
  }
};

// Standard-Sprache (de)
const DEFAULT_LANGUAGE = 'de';

// Aktuelle Sprache
let currentLanguage = DEFAULT_LANGUAGE;

/**
 * Setzt die aktuelle Sprache
 * @param {string} lang - Sprachcode ('de' oder 'en')
 */
export function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
  } else {
    console.warn(`[i18n] Language '${lang}' not found, using default '${DEFAULT_LANGUAGE}'`);
    currentLanguage = DEFAULT_LANGUAGE;
  }
}

/**
 * Gibt die aktuelle Sprache zurück
 * @returns {string} Sprachcode
 */
export function getLanguage() {
  return currentLanguage;
}

/**
 * Übersetzt einen Schlüssel in die aktuelle Sprache
 * @param {string} key - Übersetzungsschlüssel
 * @param {Object} params - Optionale Parameter für Platzhalter
 * @returns {string} Übersetzter Text
 */
export function t(key, params = {}) {
  const translation = translations[currentLanguage]?.[key];
  
  if (!translation) {
    console.warn(`[i18n] Translation key '${key}' not found for language '${currentLanguage}'`);
    return key;
  }
  
  // Ersetze Platzhalter falls vorhanden
  if (Object.keys(params).length > 0) {
    let result = translation;
    Object.keys(params).forEach(paramKey => {
      result = result.replace(`{${paramKey}}`, params[paramKey]);
    });
    return result;
  }
  
  return translation;
}

/**
 * Initialisiert die Sprache basierend auf der Config und/oder hass-Einstellungen
 * @param {Object} config - Dashboard-Konfiguration
 * @param {Object} hass - Home Assistant Objekt (optional)
 */
export function initLanguage(config, hass = null) {
  // 1. Prüfe explizite Spracheinstellung in der Config
  if (config.language || config.lang) {
    const lang = config.language || config.lang;
    console.log(`[i18n] Language set from config: ${lang}`);
    setLanguage(lang);
    return;
  }
  
  // 2. Versuche Sprache aus hass.language zu lesen
  if (hass?.language) {
    const lang = hass.language.toLowerCase();
    console.log(`[i18n] Found hass.language: ${hass.language} -> ${lang}`);
    if (translations[lang]) {
      setLanguage(lang);
      console.log(`[i18n] Language set to: ${lang}`);
      return;
    } else {
      console.warn(`[i18n] Language '${lang}' from hass.language not supported, using default`);
    }
  }
  
  // 3. Fallback auf Standard-Sprache
  console.log(`[i18n] Using default language: ${DEFAULT_LANGUAGE}`);
  setLanguage(DEFAULT_LANGUAGE);
}

/**
 * Gibt alle verfügbaren Sprachen zurück
 * @returns {Array<string>} Array von Sprachcodes
 */
export function getAvailableLanguages() {
  return Object.keys(translations);
}

