// ====================================================================
// DASHBOARD STRATEGY - Generates the main dashboard structure
// ====================================================================
// Uses registry data directly from hass object (no WebSocket calls needed)
// ====================================================================

import { getVisibleAreas, getExcludedLabels } from '../utils/helpers/simon42-helpers.js';
import { 
  collectPersons, 
  collectLights, 
  collectCovers, 
  collectSecurityUnsafe, 
  collectBatteriesCritical, 
  findWeatherEntity, 
  findDummySensor 
} from '../utils/data/simon42-data-collectors.js';
import { createPersonBadges } from '../utils/builders/cards/simon42-badge-builder.js';
import { 
  createOverviewSection, 
  createAreasSection, 
  createWeatherSection,
  createPublicTransportSection,
  createEnergySection,
  createSchedulerCardSection,
  createCalendarCardSection,
  createTodoSwipeCardSection
} from '../utils/builders/sections/simon42-section-builder.js';
import { 
  createOverviewView, 
  createUtilityViews, 
  createAreaViews 
} from '../utils/builders/views/simon42-view-builder.js';
import { initLanguage, t, getLanguage } from '../utils/i18n/simon42-i18n.js';
import { initLogger, logDebug, logInfo, logWarn } from '../utils/system/simon42-logger.js';
import { runMigrations } from './migrations/migration-runner.js';

// Cache for last generation state to avoid unnecessary logs
let lastGenerationState = null;

/**
 * Creates a hash key for the current generation based on important metrics
 * @param {Array} entities - All entities
 * @param {Array} areas - All areas
 * @param {Array} persons - All persons
 * @param {Array} lightsOn - Lights that are on
 * @param {Array} coversOpen - Covers that are open
 * @param {Array} securityUnsafe - Unsafe security entities
 * @param {Array} batteriesCritical - Critical batteries
 * @param {string|null} weatherEntity - Weather entity ID or null
 * @returns {string} JSON stringified hash key
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
  /**
   * Generates the dashboard structure
   * @param {Object} config - Dashboard configuration
   * @param {Object} hass - Home Assistant object
   * @returns {Object} Dashboard structure with title and views
   */
  static async generate(config, hass) {
    initLogger(config);
    
    // Run all pending migrations once on config load
    // Migrations are tracked in config._migrations to ensure they only run once
    const logLevel = config?.log_level || 'warn';
    const logMigration = logLevel === 'debug' || logLevel === 'info';
    const migratedConfig = runMigrations(config || {}, { logMigration });
    
    // Initialize language - must happen BEFORE all t() calls
    initLanguage(migratedConfig, hass);
    
    // Convert registry objects to arrays for processing
    const areas = Object.values(hass.areas || {});
    const devices = Object.values(hass.devices || {});
    const entities = Object.values(hass.entities || {});
    const floors = Object.values(hass.floors || {});

    // Get entities with "no_dboard" label for exclusion
    const excludeLabels = getExcludedLabels(entities);

    const visibleAreas = getVisibleAreas(areas, migratedConfig.areas_display);

    // Collect all required data (config passed for areas_options filtering)
    // Use migratedConfig to ensure we're working with the latest format
    const persons = collectPersons(hass, excludeLabels, migratedConfig);
    const lightsOn = collectLights(hass, excludeLabels, migratedConfig);
    const coversOpen = collectCovers(hass, excludeLabels, migratedConfig);
    const securityUnsafe = collectSecurityUnsafe(hass, excludeLabels, migratedConfig);
    const batteriesCritical = collectBatteriesCritical(hass, excludeLabels, migratedConfig);
    const weatherEntity = findWeatherEntity(hass, excludeLabels, migratedConfig);
    const someSensorId = findDummySensor(hass, excludeLabels, migratedConfig);
    
    // Check if anything changed to avoid unnecessary logging
    const currentKey = getGenerationKey(entities, areas, persons, lightsOn, coversOpen, securityUnsafe, batteriesCritical, weatherEntity);
    const hasChanged = lastGenerationState !== currentKey;
    
    // Only log if something changed or it's the first generation
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
      
      lastGenerationState = currentKey;
    }

    // Read config flags (defaults shown in comments)
    // Use migratedConfig to ensure we're working with migrated areas_display
    const showPersonBadges = migratedConfig.show_person_badges !== false;
    const showWeather = migratedConfig.show_weather !== false;
    const showEnergy = migratedConfig.show_energy !== false;
    const showSearchCard = migratedConfig.show_search_card === true;
    const showClockCard = migratedConfig.show_clock_card === true;
    const showSummaryViews = migratedConfig.show_summary_views === true;
    const showRoomViews = migratedConfig.show_room_views === true;
    const groupByFloors = migratedConfig.group_by_floors === true;

    const personBadges = createPersonBadges(persons, hass, showPersonBadges);

    if (hasChanged || lastGenerationState === null) {
      logDebug('[Strategy] Creating areas section...');
    }
    const areasSections = createAreasSection(visibleAreas, groupByFloors, hass, migratedConfig);

    if (hasChanged || lastGenerationState === null) {
      logDebug('[Strategy] Creating additional sections...');
    }
    const weatherSection = createWeatherSection(weatherEntity, showWeather, migratedConfig, hass);
    const publicTransportSection = createPublicTransportSection(migratedConfig, hass);
    const energySection = createEnergySection(showEnergy);
    const schedulerCardSection = createSchedulerCardSection(migratedConfig, hass);
    const calendarCardSection = createCalendarCardSection(migratedConfig, hass);
    const todoSwipeCardSection = createTodoSwipeCardSection(migratedConfig, hass);
    
    if (hasChanged || lastGenerationState === null) {
      logDebug('[Strategy] Creating overview section...');
    }
    // Build overview sections array
    // Note: areasSections is an array when groupByFloors is active
    const overviewSections = [
      createOverviewSection({
        lightsOn,
        coversOpen,
        securityUnsafe,
        batteriesCritical,
        someSensorId,
        showSearchCard,
        showClockCard,
        config: migratedConfig,
        hass
      }),
      ...(Array.isArray(areasSections) ? areasSections : [areasSections]),
      // Add sections in order: Weather, Public Transport, Energy, Scheduler, Calendar, Todo Swipe Card
      ...(weatherSection ? [weatherSection] : []),
      ...(publicTransportSection ? [publicTransportSection] : []),
      ...(energySection ? [energySection] : []),
      ...(schedulerCardSection ? [schedulerCardSection] : []),
      ...(calendarCardSection ? [calendarCardSection] : []),
      ...(todoSwipeCardSection ? [todoSwipeCardSection] : [])
    ];
    if (hasChanged || lastGenerationState === null) {
      logDebug('[Strategy] Created', overviewSections.length, 'overview sections');
    }

    // Create all views (config passed for areas_options filtering)
    if (hasChanged || lastGenerationState === null) {
      logDebug('[Strategy] Creating views...');
    }
    const utilityViews = createUtilityViews(entities, showSummaryViews, migratedConfig);
    const areaViews = createAreaViews(visibleAreas, devices, entities, showRoomViews, migratedConfig.areas_options || {}, migratedConfig);
    const views = [
      createOverviewView(overviewSections, personBadges, migratedConfig, hass),
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

  /**
   * Returns the config editor element
   * @returns {Promise<HTMLElement>} Config editor element
   */
  static async getConfigElement() {
    await import('./simon42-dashboard-strategy-editor.js');
    await customElements.whenDefined('simon42-dashboard-strategy-editor');
    return document.createElement('simon42-dashboard-strategy-editor');
  }
}

customElements.define("ll-strategy-simon42-dashboard", Simon42DashboardStrategy);
