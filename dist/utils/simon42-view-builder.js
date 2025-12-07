// ====================================================================
// VIEW BUILDER - Erstellt View-Definitionen
// ====================================================================

import { t } from './simon42-i18n.js';
import { translateAreaName } from './simon42-helpers.js';

/**
 * Erstellt den Haupt-Übersichts-View
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
 * Erstellt die Utility-Views (Lichter, Covers, Security, Batterien)
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
        config // Übergebe config für areas_options Filterung
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
        config // Übergebe config für areas_options Filterung
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
        config // Übergebe config für areas_options Filterung
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
        config // Übergebe config für areas_options Filterung
      }
    }
  ];
}

/**
 * Erstellt Views für jeden sichtbaren Bereich
 */
export function createAreaViews(visibleAreas, devices, entities, showRoomViews = false, areasOptions = {}, dashboardConfig = {}) {
  return visibleAreas.map(area => {
    const areaOptions = areasOptions[area.area_id] || {};
    
    // Übersetze Area-Namen falls Übersetzungen konfiguriert sind
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