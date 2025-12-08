// ====================================================================
// I18N UTILITY - Internationalization System
// ====================================================================
// Supports multiple languages with separate language files
// To add a new language:
// 1. Create a new file: i18n/simon42-i18n-{lang}.js
// 2. Export a const with the language code (e.g., export const fr = {...})
// 3. Import it below and add it to the translations object
// ====================================================================

import { logWarn } from './simon42-logger.js';

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

const DEFAULT_LANGUAGE = 'de';
let currentLanguage = DEFAULT_LANGUAGE;

/**
 * Sets the current language
 * @param {string} lang - Language code (e.g., 'de', 'en')
 */
export function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
  } else {
    logWarn('[i18n] Language not found:', lang, '- using default:', DEFAULT_LANGUAGE);
    currentLanguage = DEFAULT_LANGUAGE;
  }
}

/**
 * Gets the current language
 * @returns {string} Language code
 */
export function getLanguage() {
  return currentLanguage;
}

/**
 * Translates a key to the current language
 * @param {string} key - Translation key
 * @param {Object} params - Optional parameters for placeholders
 * @returns {string} Translated text
 */
export function t(key, params = {}) {
  const translation = translations[currentLanguage]?.[key];
  
  if (!translation) {
    return key;
  }
  
  // Replace placeholders if present
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
 * Initializes language based on config and/or hass settings
 * Priority: 1) config.language/config.lang, 2) hass.language, 3) default
 * @param {Object} config - Dashboard configuration
 * @param {Object} hass - Home Assistant object (optional)
 */
export function initLanguage(config, hass = null) {
  if (config.language || config.lang) {
    const lang = config.language || config.lang;
    setLanguage(lang);
    return;
  }
  
  if (hass?.language) {
    const lang = hass.language.toLowerCase();
    if (translations[lang]) {
      setLanguage(lang);
      return;
    } else {
      logWarn('[i18n] Language from hass.language not supported:', lang, '- using default');
    }
  }
  
  setLanguage(DEFAULT_LANGUAGE);
}

/**
 * Gets all available languages
 * @returns {Array<string>} Array of language codes
 */
export function getAvailableLanguages() {
  return Object.keys(translations);
}
