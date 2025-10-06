// ====================================================================
// VIEW BUILDER - Erstellt View-Definitionen
// ====================================================================

/**
 * Erstellt den Haupt-Übersichts-View
 */
export function createOverviewView(sections, personBadges) {
  return {
    title: "Übersicht",
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
export function createUtilityViews(entities, showSubviews = false) {
  return [
    {
      title: "Lichter",
      path: "lights",
      icon: "mdi:lamps",
      subview: !showSubviews,
      strategy: {
        type: "custom:simon42-view-lights",
        entities
      }
    },
    {
      title: "Rollos & Vorhänge",
      path: "covers",
      icon: "mdi:blinds-horizontal",
      subview: !showSubviews,
      strategy: {
        type: "custom:simon42-view-covers",
        entities,
        device_classes: ["awning", "blind", "curtain", "shade", "shutter", "window"]
      }
    },
    {
      title: "Sicherheit",
      path: "security",
      icon: "mdi:security",
      subview: !showSubviews,
      strategy: {
        type: "custom:simon42-view-security",
        entities
      }
    },
    {
      title: "Batterien",
      path: "batteries",
      icon: "mdi:battery-alert",
      subview: !showSubviews,
      strategy: {
        type: "custom:simon42-view-batteries",
        entities
      }
    }
  ];
}

/**
 * Erstellt Views für jeden sichtbaren Bereich
 */
export function createAreaViews(visibleAreas, devices, entities, showSubviews = false, areasOptions = {}) {
  return visibleAreas.map(area => {
    const areaOptions = areasOptions[area.area_id] || {};
    
    return {
      title: area.name,
      path: area.area_id,
      icon: area.icon || "mdi:floor-plan",
      subview: !showSubviews,
      strategy: {
        type: "custom:simon42-view-room",
        area,
        devices,
        entities,
        groups_options: areaOptions.groups_options || {}
      }
    };
  });
}