// ====================================================================
// WEATHER CARD BUILDERS - Card-Specific Builders
// ====================================================================
// Separates card building logic for weather cards
// Makes it easier to add new weather cards and maintain existing ones
// ====================================================================

import { getUserLocale, getUserHour12, getUserLanguage } from './simon42-user-preferences.js';
import { t } from './simon42-i18n.js';
import { translateAreaName } from './simon42-helpers.js';

/**
 * Builds clock-weather-card configuration
 * @param {string} weatherEntity - Weather Entity ID
 * @param {Object} config - Configuration object
 * @param {Object} hass - Home Assistant object
 * @returns {Object} Card configuration
 */
export function buildClockWeatherCard(weatherEntity, config, hass) {
  // Get user preferences
  // Use language code (e.g., 'de', 'en') instead of full locale (e.g., 'de-DE', 'en-US')
  // as the clock-weather-card expects a simple language string
  const language = getUserLanguage(hass, config);
  const hour12 = getUserHour12(hass, config);
  
  // Build base configuration
  const cardConfig = {
    type: 'custom:clock-weather-card',
    entity: weatherEntity
  };
  
  // Optional: sun entity (for day/night icon)
  if (config.clock_weather_sun_entity) {
    cardConfig.sun_entity = config.clock_weather_sun_entity;
  }
  
  // Optional: temperature sensor
  if (config.clock_weather_temperature_sensor) {
    cardConfig.temperature_sensor = config.clock_weather_temperature_sensor;
  }
  
  // Optional: humidity sensor
  if (config.clock_weather_humidity_sensor) {
    cardConfig.humidity_sensor = config.clock_weather_humidity_sensor;
  }
  
  // Optional: weather icon type (line or fill)
  if (config.clock_weather_icon_type) {
    cardConfig.weather_icon_type = config.clock_weather_icon_type;
  }
  
  // Optional: animated icon (default: true)
  if (config.clock_weather_animated_icon === false) {
    cardConfig.animated_icon = false;
  }
  
  // Optional: forecast rows (default: 5)
  if (config.clock_weather_forecast_rows !== undefined) {
    cardConfig.forecast_rows = config.clock_weather_forecast_rows;
  }
  
  // Locale (always set from user preference for proper translation)
  // The card expects a simple language string (e.g., 'de', 'en'), not a full locale
  cardConfig.locale = language;
  
  // Time format (always set from user preference)
  // The card uses this to determine 12-hour vs 24-hour format
  cardConfig.time_format = hour12 ? 12 : 24;
  
  // Hide clock (always set to true as requested)
  cardConfig.hide_clock = true;
  
  // Optional: time pattern (luxon format)
  if (config.clock_weather_time_pattern) {
    cardConfig.time_pattern = config.clock_weather_time_pattern;
  }
  
  // Optional: date pattern (luxon format)
  if (config.clock_weather_date_pattern) {
    cardConfig.date_pattern = config.clock_weather_date_pattern;
  }
  
  // Optional: show humidity
  if (config.clock_weather_show_humidity === true) {
    cardConfig.show_humidity = true;
  }
  
  // Optional: hide today section
  if (config.clock_weather_hide_today_section === true) {
    cardConfig.hide_today_section = true;
  }
  
  // Optional: hide forecast section
  if (config.clock_weather_hide_forecast_section === true) {
    cardConfig.hide_forecast_section = true;
  }
  
  // Optional: hide date
  if (config.clock_weather_hide_date === true) {
    cardConfig.hide_date = true;
  }
  
  // Optional: hourly forecast
  if (config.clock_weather_hourly_forecast === true) {
    cardConfig.hourly_forecast = true;
  }
  
  // Optional: use browser time
  if (config.clock_weather_use_browser_time === true) {
    cardConfig.use_browser_time = true;
  }
  
  // Optional: time zone
  if (config.clock_weather_time_zone) {
    cardConfig.time_zone = config.clock_weather_time_zone;
  }
  
  // Optional: show decimal
  if (config.clock_weather_show_decimal === true) {
    cardConfig.show_decimal = true;
  }
  
  // Optional: apparent temperature sensor
  if (config.clock_weather_apparent_sensor) {
    cardConfig.apparent_sensor = config.clock_weather_apparent_sensor;
  }
  
  // Optional: AQI sensor
  if (config.clock_weather_aqi_sensor) {
    cardConfig.aqi_sensor = config.clock_weather_aqi_sensor;
  }
  
  // Optional: title
  if (config.clock_weather_title) {
    cardConfig.title = config.clock_weather_title;
  }
  
  // Set translated name property
  // Get entity friendly_name and translate it, or use default translation
  if (hass && hass.states && hass.states[weatherEntity]) {
    const entity = hass.states[weatherEntity];
    const friendlyName = entity.attributes?.friendly_name || '';
    
    // Translate the name if available, otherwise use default translation
    let translatedName = friendlyName;
    if (translatedName) {
      translatedName = translateAreaName(translatedName, config);
    } else {
      // Fallback to translated "Forecast Home" if no friendly_name
      translatedName = t('weatherCardName');
    }
    
    cardConfig.name = translatedName;
  } else {
    // Fallback to translated "Forecast Home" if entity not available
    cardConfig.name = t('weatherCardName');
  }
  
  return cardConfig;
}

/**
 * Card builder registry
 * Maps card types to their builder functions
 */
export const WEATHER_CARD_BUILDERS = {
  'clock-weather-card': buildClockWeatherCard
};

