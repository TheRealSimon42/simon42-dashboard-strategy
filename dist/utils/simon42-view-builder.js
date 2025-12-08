// ====================================================================
// VIEW BUILDER - Creates view definitions
// ====================================================================

import { t } from './simon42-i18n.js';
import { translateAreaName } from './simon42-helpers.js';

/**
 * Creates the main overview view
 * @param {Array} sections - Array of sections for the overview
 * @param {Array} personBadges - Array of person badges
 * @param {Object} config - Dashboard configuration
 * @param {Object} hass - Home Assistant object
 * @returns {Object} Overview view definition
 */
export function createOverviewView(sections, personBadges, config = {}, hass = null) {
  return {
    title: t('overview'),
    path: "home",
    icon: "mdi:home",
    type: "sections",
    max_columns: 3,
    badges: personBadges.length > 0 ? personBadges : undefined,
    header: personBadges.length > 0 ? {
      layout: "center",
      badges_position: "bottom",
      badges_wrap: "wrap"
    } : undefined,
    sections: sections
  };
}

/**
 * Creates utility views (lights, covers, security, batteries)
 * @param {Array} entities - All entities
 * @param {boolean} showSummaryViews - Whether to show summary views
 * @param {Object} config - Dashboard configuration (passed for areas_options filtering)
 * @returns {Array<Object>} Array of utility view definitions
 */
export function createUtilityViews(entities, showSummaryViews = false, config = {}) {
  return [
    {
      title: t('lights'),
      path: "lights",
      icon: "mdi:lamps",
      subview: !showSummaryViews,
      strategy: {
        type: "custom:simon42-view-lights",
        entities,
        config
      }
    },
    {
      title: t('covers'),
      path: "covers",
      icon: "mdi:blinds-horizontal",
      subview: !showSummaryViews,
      strategy: {
        type: "custom:simon42-view-covers",
        entities,
        device_classes: ["awning", "blind", "curtain", "shade", "shutter", "window"],
        config
      }
    },
    {
      title: t('security'),
      path: "security",
      icon: "mdi:security",
      subview: !showSummaryViews,
      strategy: {
        type: "custom:simon42-view-security",
        entities,
        config
      }
    },
    {
      title: t('batteries'),
      path: "batteries",
      icon: "mdi:battery-alert",
      subview: !showSummaryViews,
      strategy: {
        type: "custom:simon42-view-batteries",
        entities,
        config
      }
    }
  ];
}

/**
 * Creates views for each visible area
 * @param {Array} visibleAreas - Array of visible area objects
 * @param {Array} devices - All devices
 * @param {Array} entities - All entities
 * @param {boolean} showRoomViews - Whether to show room views
 * @param {Object} areasOptions - Area-specific options
 * @param {Object} dashboardConfig - Dashboard configuration (for area name translation)
 * @returns {Array<Object>} Array of area view definitions
 */
export function createAreaViews(visibleAreas, devices, entities, showRoomViews = false, areasOptions = {}, dashboardConfig = {}) {
  return visibleAreas.map(area => {
    const areaOptions = areasOptions[area.area_id] || {};
    
    const translatedAreaName = translateAreaName(area.name, dashboardConfig);
    
    return {
      title: translatedAreaName,
      path: area.area_id,
      icon: area.icon || "mdi:floor-plan",
      subview: !showRoomViews,
      strategy: {
        type: "custom:simon42-view-room",
        area,
        devices,
        entities,
        groups_options: areaOptions.groups_options || {},
        dashboardConfig // Übergebe vollständige Dashboard-Config für Raum-Pins
      }
    };
  });
}