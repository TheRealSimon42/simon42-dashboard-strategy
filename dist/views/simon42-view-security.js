// ====================================================================
// VIEW STRATEGY - SECURITY (Schlösser + Türen/Garagen + Fenster) - REFACTORED
// ====================================================================
import { getExcludedLabels } from '../utils/simon42-helpers.js';
import { t, initLanguage } from '../utils/simon42-i18n.js';
import { createSecuritySection } from '../utils/simon42-security-card-builder.js';
import { filterEntities } from '../utils/simon42-entity-filter.js';

class Simon42ViewSecurityStrategy {
  static async generate(config, hass) {
    // Initialisiere Sprache (falls noch nicht geschehen)
    if (config.config) {
      initLanguage(config.config, hass);
    }
    
    const { entities } = config;
    
    const excludeLabels = getExcludedLabels(entities);
    const excludeSet = new Set(excludeLabels);
    
    // Hole hidden entities aus areas_options (wenn config übergeben wurde)
    const hiddenFromConfig = new Set();
    if (config.config?.areas_options) {
      for (const areaOptions of Object.values(config.config.areas_options)) {
        // Alle relevanten Gruppen durchsuchen
        const relevantGroups = ['covers', 'covers_curtain', 'switches'];
        relevantGroups.forEach(group => {
          if (areaOptions.groups_options?.[group]?.hidden) {
            areaOptions.groups_options[group].hidden.forEach(id => hiddenFromConfig.add(id));
          }
        });
      }
    }

    // Gruppiere nach Typ - REFACTORED: Nutzt zentrale Entity-Filter-Logik
    const filteredEntities = filterEntities(entities, {
      domain: ['lock', 'cover', 'binary_sensor'],
      excludeLabels: excludeSet,
      hiddenFromConfig,
      hass,
      checkRegistry: true,
      checkState: true
    });

    // Kategorisiere gefilterte Entities nach Domain und Device-Class
    const locks = [];
    const doors = []; // Cover mit door/gate device_class
    const garages = []; // Cover mit garage device_class
    const windows = []; // Binary Sensors mit door/window device_class

    filteredEntities.forEach(entityId => {
      const state = hass.states[entityId];
      if (!state) return;
      
      // Domain-Checks mit frühem Return
      if (entityId.startsWith('lock.')) {
        locks.push(entityId);
        return;
      }
      
      if (entityId.startsWith('cover.')) {
        const deviceClass = state.attributes?.device_class;
        if (deviceClass === 'garage') {
          garages.push(entityId);
        } else if (['door', 'gate'].includes(deviceClass)) {
          doors.push(entityId);
        }
        return;
      }
      
      if (entityId.startsWith('binary_sensor.')) {
        const deviceClass = state.attributes?.device_class;
        if (['door', 'window', 'garage_door', 'opening'].includes(deviceClass)) {
          windows.push(entityId);
        }
      }
    });

    const sections = [];

    // Schlösser Section
    const locksSection = createSecuritySection(
      locks,
      hass,
      {
        translationKeyActive: 'locksUnlocked',
        translationKeyInactive: 'locksLocked',
        icon: '🔓',
        featureType: 'lock-commands',
        badge: true,
        badgeAction: 'lock.lock',
        badgeIcon: 'mdi:lock'
      },
      (state) => state === 'unlocked'
    );
    if (locksSection) sections.push(locksSection);

    // Türen/Tore Section
    const doorsSection = createSecuritySection(
      doors,
      hass,
      {
        translationKeyActive: 'doorsOpen',
        translationKeyInactive: 'doorsClosed',
        icon: '🚪',
        featureType: 'cover-open-close',
        badge: true,
        badgeAction: 'cover.close_cover',
        badgeIcon: 'mdi:arrow-down'
      },
      (state) => state === 'open'
    );
    if (doorsSection) sections.push(doorsSection);

    // Garagen Section
    const garagesSection = createSecuritySection(
      garages,
      hass,
      {
        translationKeyActive: 'garagesOpen',
        translationKeyInactive: 'garagesClosed',
        icon: '🏠',
        featureType: 'cover-open-close',
        badge: true,
        badgeAction: 'cover.close_cover',
        badgeIcon: 'mdi:arrow-down'
      },
      (state) => state === 'open'
    );
    if (garagesSection) sections.push(garagesSection);

    // Fenster & Sensoren Section (no badge, no special features)
    const windowsSection = createSecuritySection(
      windows,
      hass,
      {
        translationKeyActive: 'windowsOpen',
        translationKeyInactive: 'windowsClosed',
        icon: '🪟',
        featureType: 'tile' // No special features
      },
      (state) => state === 'on'
    );
    if (windowsSection) sections.push(windowsSection);

    return {
      type: "sections",
      sections: sections
    };
  }
}

// Registriere Custom Element
customElements.define("ll-strategy-simon42-view-security", Simon42ViewSecurityStrategy);