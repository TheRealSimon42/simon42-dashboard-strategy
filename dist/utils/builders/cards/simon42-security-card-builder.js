// ====================================================================
// SECURITY CARD BUILDER - Creates Security Entity Card Sections
// ====================================================================
// Eliminates duplication in security view card building
// ====================================================================

import { t } from '../../system/simon42-i18n.js';

/**
 * Configuration for security card sections
 * @typedef {Object} SecurityCardConfig
 * @property {string} translationKeyActive - Translation key for active heading (e.g., 'locksUnlocked')
 * @property {string} translationKeyInactive - Translation key for inactive heading (e.g., 'locksLocked')
 * @property {string} icon - Icon emoji (e.g., '🔓')
 * @property {string} featureType - Feature type for tiles (e.g., 'lock-commands')
 * @property {Object} [badge] - Optional badge configuration
 * @property {string} [badgeAction] - Action for badge (e.g., 'lock.lock')
 * @property {string} [badgeIcon] - Icon for badge (e.g., 'mdi:lock')
 */

/**
 * Creates cards for a security entity group (e.g., locks, doors)
 * @param {string[]} entities - Entity IDs
 * @param {Object} hass - Home Assistant object
 * @param {SecurityCardConfig} config - Configuration object
 * @param {Function} stateFilter - Function that returns true if state is "active" (e.g., (state) => state === 'unlocked')
 * @returns {Array} Array of card configurations
 */
export function createSecurityEntityCards(entities, hass, config, stateFilter) {
  const { 
    translationKeyActive, 
    translationKeyInactive, 
    icon, 
    featureType, 
    badge, 
    badgeAction, 
    badgeIcon 
  } = config;
  
  // Filter entities by state
  const activeEntities = entities.filter(entityId => {
    const state = hass.states[entityId]?.state;
    return stateFilter(state);
  });
  
  const inactiveEntities = entities.filter(entityId => {
    const state = hass.states[entityId]?.state;
    return !stateFilter(state);
  });
  
  const cards = [];
  
  // Active entities section
  if (activeEntities.length > 0) {
    const heading = {
      type: "heading",
      heading: `${icon} ${t(translationKeyActive)}`,
      heading_style: "subtitle"
    };
    
    // Add badge if configured
    if (badge && badgeAction && activeEntities.length > 0) {
      heading.badges = [{
        type: "entity",
        entity: activeEntities[0],
        show_name: false,
        show_state: false,
        tap_action: {
          action: "perform-action",
          perform_action: badgeAction,
          target: { entity_id: activeEntities }
        },
        icon: badgeIcon || "mdi:lock"
      }];
    }
    
    cards.push(heading);
    
    // Create tile cards for active entities
    cards.push(...activeEntities.map(entityId => {
      const tileCard = {
        type: "tile",
        entity: entityId,
        state_content: "last_changed"
      };
      
      // Add features if specified
      if (featureType && featureType !== 'tile') {
        tileCard.features = [{ type: featureType }];
        
        // Add features_position for cover features
        if (featureType.includes('cover')) {
          tileCard.features_position = "inline";
        }
      }
      
      return tileCard;
    }));
  }
  
  // Inactive entities section
  if (inactiveEntities.length > 0) {
    cards.push({
      type: "heading",
      heading: `${icon} ${t(translationKeyInactive)}`,
      heading_style: "subtitle"
    });
    
    // Create tile cards for inactive entities
    cards.push(...inactiveEntities.map(entityId => {
      const tileCard = {
        type: "tile",
        entity: entityId,
        state_content: "last_changed"
      };
      
      // Add features if specified
      if (featureType && featureType !== 'tile') {
        tileCard.features = [{ type: featureType }];
        
        // Add features_position for cover features
        if (featureType.includes('cover')) {
          tileCard.features_position = "inline";
        }
      }
      
      return tileCard;
    }));
  }
  
  return cards;
}

/**
 * Creates a complete security section
 * @param {string[]} entities - Entity IDs
 * @param {Object} hass - Home Assistant object
 * @param {SecurityCardConfig} config - Configuration object
 * @param {Function} stateFilter - Function that returns true if state is "active"
 * @returns {Object|null} Section object or null if no entities
 */
export function createSecuritySection(entities, hass, config, stateFilter) {
  if (entities.length === 0) {
    return null;
  }
  
  const cards = createSecurityEntityCards(entities, hass, config, stateFilter);
  
  if (cards.length === 0) {
    return null;
  }
  
  return {
    type: "grid",
    cards
  };
}

