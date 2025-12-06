// ====================================================================
// I18N UTILITY - Internationalization System
// ====================================================================
// Supports multiple languages with separate language files
// To add a new language:
// 1. Create a new file: i18n/simon42-i18n-{lang}.js
// 2. Export a const with the language code (e.g., export const fr = {...})
// 3. Import it below and add it to the translations object
// ====================================================================

// Import language files
import { de } from './i18n/simon42-i18n-de.js';
import { en } from './i18n/simon42-i18n-en.js';

// Combine all translations
// To add a new language, import it above and add it here
const translations = {
  de,
  en
  // Add more languages here as needed:
  // fr,
  // es,
  // etc.
};

// Standard-Sprache (de)
const DEFAULT_LANGUAGE = 'de';

// Aktuelle Sprache
let currentLanguage = DEFAULT_LANGUAGE;

/**
 * Setzt die aktuelle Sprache
 * @param {string} lang - Sprachcode (z.B. 'de', 'en')
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
    // Silent fallback to key - no console spam
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
    setLanguage(lang);
    return;
  }
  
  // 2. Versuche Sprache aus hass.language zu lesen
  if (hass?.language) {
    const lang = hass.language.toLowerCase();
    if (translations[lang]) {
      setLanguage(lang);
      return;
    } else {
      console.warn(`[i18n] Language '${lang}' from hass.language not supported, using default`);
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
