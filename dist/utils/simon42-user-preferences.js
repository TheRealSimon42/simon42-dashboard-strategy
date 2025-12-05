// ====================================================================
// USER PREFERENCES UTILITY - Centralized User Preference Access
// ====================================================================
// Provides a unified way to access user preferences from Home Assistant
// Makes it easy to tailor the dashboard to each user's preferences
// ====================================================================

/**
 * User preferences extracted from hass object
 * @typedef {Object} UserPreferences
 * @property {string} language - User's language preference (e.g., 'de', 'en')
 * @property {string} locale - Full locale string (e.g., 'de-DE', 'en-US')
 * @property {boolean} hour12 - True for 12-hour time format, false for 24-hour
 * @property {boolean} isDarkMode - True if dark mode is active
 * @property {string} selectedTheme - Name of selected theme
 * @property {string} timeFormat - Time format preference ('12', '24', or 'language')
 */

/**
 * Extracts and normalizes user preferences from hass object
 * @param {Object} hass - Home Assistant object
 * @param {Object} config - Dashboard configuration (optional, can override preferences)
 * @returns {UserPreferences} User preferences object
 */
export function getUserPreferences(hass, config = {}) {
  if (!hass) {
    return getDefaultPreferences();
  }

  // Language: config override > hass.language > default
  const language = (config.language || config.lang || hass.language || 'de').toLowerCase();
  
  // Locale: derive from language
  const locale = getLocaleFromLanguage(language);
  
  // Time format: config override > hass.locale.time_format > default
  const timeFormat = config.time_format || hass?.locale?.time_format || 'language';
  const hour12 = getHour12Preference(timeFormat, locale);
  
  // Theme: check multiple sources for dark mode
  const isDarkMode = getDarkModePreference(hass);
  const selectedTheme = hass?.themes?.selectedTheme || null;
  
  return {
    language,
    locale,
    hour12,
    isDarkMode,
    selectedTheme,
    timeFormat
  };
}

/**
 * Gets default preferences when hass is not available
 * @returns {UserPreferences} Default preferences
 */
function getDefaultPreferences() {
  return {
    language: 'de',
    locale: 'de-DE',
    hour12: false,
    isDarkMode: false,
    selectedTheme: null,
    timeFormat: 'language'
  };
}

/**
 * Converts language code to locale string
 * @param {string} language - Language code (e.g., 'de', 'en')
 * @returns {string} Locale string (e.g., 'de-DE', 'en-US')
 */
function getLocaleFromLanguage(language) {
  const localeMap = {
    'de': 'de-DE',
    'en': 'en-US',
    'fr': 'fr-FR',
    'es': 'es-ES',
    'it': 'it-IT',
    'nl': 'nl-NL',
    'pl': 'pl-PL',
    'pt': 'pt-PT',
    'ru': 'ru-RU',
    'zh': 'zh-CN',
    'ja': 'ja-JP',
    'ko': 'ko-KR'
  };
  
  return localeMap[language] || `${language}-${language.toUpperCase()}`;
}

/**
 * Determines 12-hour vs 24-hour format preference
 * @param {string} timeFormat - Time format preference ('12', '24', or 'language')
 * @param {string} locale - Locale string (e.g., 'de-DE', 'en-US')
 * @returns {boolean} True for 12-hour format, false for 24-hour format
 */
function getHour12Preference(timeFormat, locale) {
  if (timeFormat === '12') {
    return true;
  }
  if (timeFormat === '24') {
    return false;
  }
  // If 'language', check if locale typically uses 12-hour format
  // Most European locales use 24-hour, US uses 12-hour
  return locale === 'en-US';
}

/**
 * Determines if dark mode is active
 * @param {Object} hass - Home Assistant object
 * @returns {boolean} True if dark mode is active
 */
function getDarkModePreference(hass) {
  if (!hass?.themes) {
    return false;
  }
  
  // Check direct darkMode property
  if (hass.themes.darkMode === true) {
    return true;
  }
  
  // Check selected theme's darkMode property
  const selectedTheme = hass.themes.selectedTheme;
  if (selectedTheme && hass.themes.themes?.[selectedTheme]?.darkMode === true) {
    return true;
  }
  
  // Check if theme name contains 'dark'
  if (selectedTheme && selectedTheme.toLowerCase().includes('dark')) {
    return true;
  }
  
  return false;
}

/**
 * Gets user's language preference
 * @param {Object} hass - Home Assistant object
 * @param {Object} config - Dashboard configuration (optional)
 * @returns {string} Language code (e.g., 'de', 'en')
 */
export function getUserLanguage(hass, config = {}) {
  return getUserPreferences(hass, config).language;
}

/**
 * Gets user's locale preference
 * @param {Object} hass - Home Assistant object
 * @param {Object} config - Dashboard configuration (optional)
 * @returns {string} Locale string (e.g., 'de-DE', 'en-US')
 */
export function getUserLocale(hass, config = {}) {
  return getUserPreferences(hass, config).locale;
}

/**
 * Gets user's time format preference (12-hour vs 24-hour)
 * @param {Object} hass - Home Assistant object
 * @param {Object} config - Dashboard configuration (optional)
 * @returns {boolean} True for 12-hour format, false for 24-hour format
 */
export function getUserHour12(hass, config = {}) {
  return getUserPreferences(hass, config).hour12;
}

/**
 * Gets user's dark mode preference
 * @param {Object} hass - Home Assistant object
 * @returns {boolean} True if dark mode is active
 */
export function getUserDarkMode(hass) {
  return getUserPreferences(hass).isDarkMode;
}

/**
 * Gets user's selected theme name
 * @param {Object} hass - Home Assistant object
 * @returns {string|null} Theme name or null if not available
 */
export function getUserTheme(hass) {
  return getUserPreferences(hass).selectedTheme;
}

/**
 * Gets a theme-aware color based on dark mode preference
 * @param {Object} hass - Home Assistant object
 * @param {string} lightColor - Color to use in light mode
 * @param {string} darkColor - Color to use in dark mode
 * @returns {string} Appropriate color for current theme
 */
export function getThemeAwareColor(hass, lightColor, darkColor) {
  const isDarkMode = getUserDarkMode(hass);
  return isDarkMode ? darkColor : lightColor;
}

/**
 * Formats a time according to user's preferences
 * @param {Date} date - Date object to format
 * @param {Object} hass - Home Assistant object
 * @param {Object} config - Dashboard configuration (optional)
 * @param {Object} options - Additional Intl.DateTimeFormat options (optional)
 * @returns {string} Formatted time string
 */
export function formatUserTime(date, hass, config = {}, options = {}) {
  const prefs = getUserPreferences(hass, config);
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: prefs.hour12
  };
  
  return date.toLocaleTimeString(prefs.locale, { ...defaultOptions, ...options });
}

/**
 * Formats a date according to user's preferences
 * @param {Date} date - Date object to format
 * @param {Object} hass - Home Assistant object
 * @param {Object} config - Dashboard configuration (optional)
 * @param {Object} options - Additional Intl.DateTimeFormat options (optional)
 * @returns {string} Formatted date string
 */
export function formatUserDate(date, hass, config = {}, options = {}) {
  const prefs = getUserPreferences(hass, config);
  return date.toLocaleDateString(prefs.locale, options);
}

/**
 * Formats a date and time according to user's preferences
 * @param {Date} date - Date object to format
 * @param {Object} hass - Home Assistant object
 * @param {Object} config - Dashboard configuration (optional)
 * @param {Object} options - Additional Intl.DateTimeFormat options (optional)
 * @returns {string} Formatted date-time string
 */
export function formatUserDateTime(date, hass, config = {}, options = {}) {
  const prefs = getUserPreferences(hass, config);
  return date.toLocaleString(prefs.locale, options);
}

