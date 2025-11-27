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
    dashboardTitle: "Dynamisches Dashboard"
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
    dashboardTitle: "Dynamic Dashboard"
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
    setLanguage(config.language || config.lang);
    return;
  }
  
  // 2. Versuche Sprache aus hass.selectedLanguage zu lesen
  if (hass?.selectedLanguage) {
    const selectedLang = hass.selectedLanguage.toLowerCase();
    if (translations[selectedLang]) {
      setLanguage(selectedLang);
      return;
    }
  }
  
  // 3. Fallback auf Standard-Sprache
  setLanguage(DEFAULT_LANGUAGE);
}

/**
 * Gibt alle verfügbaren Sprachen zurück
 * @returns {Array<string>} Array von Sprachcodes
 */
export function getAvailableLanguages() {
  return Object.keys(translations);
}

