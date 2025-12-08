// ====================================================================
// DEPENDENCY CHECKER - Centralized Dependency Checking Utility
// ====================================================================
// Provides a unified way to check for custom cards, integrations, and other dependencies
// Makes it easy to add new dependency checks
// ====================================================================

import { logWarn } from './simon42-logger.js';

/**
 * Dependency check configuration
 * @typedef {Object} DependencyConfig
 * @property {string[]} [customElements] - Custom element names to check (e.g., ['search-card'])
 * @property {string[]} [cardTypes] - Card types to check in window.customCards (e.g., ['custom:search-card'])
 * @property {string[]} [domSelectors] - DOM selectors to check (e.g., ['search-card'])
 * @property {Function} [customCheck] - Custom check function (hass) => boolean
 * @property {string[]} [keywords] - Keywords to search for in window.customCards (e.g., ['search', 'card'])
 */

/**
 * Dependency definitions
 * Each key is a dependency identifier, value is the check configuration
 */
const DEPENDENCY_DEFINITIONS = {
  'search-card': {
    customElements: ['search-card'],
    cardTypes: ['custom:search-card'],
    domSelectors: ['search-card'],
    // Requires BOTH search-card AND card-tools
    requiresAll: true,
    customCheck: () => {
      // Check for card-tools (required for search-card)
      return typeof window.customCards !== 'undefined' || typeof window.cardTools !== 'undefined';
    }
  },
  
  'better-thermostat': {
    // Requires BOTH integration AND card
    requiresAll: true,
    // Check for better_thermostat integration via entity registry
    customCheck: (hass) => {
      const entities = Object.values(hass?.entities || {});
      return entities.some(entity => {
        if (entity.entity_id?.startsWith('climate.')) {
          return entity.platform === 'better_thermostat';
        }
        return false;
      });
    },
    // Check for better-thermostat-ui-card
    customElements: ['better-thermostat-ui-card'],
    cardTypes: ['custom:better-thermostat-ui-card'],
    keywords: ['better-thermostat']
  },
  
  'horizon-card': {
    customElements: ['horizon-card'],
    cardTypes: ['custom:horizon-card'],
    domSelectors: ['horizon-card'],
    keywords: ['horizon']
  },
  
  'hvv-card': {
    customElements: ['hvv-card'],
    cardTypes: ['custom:hvv-card'],
    domSelectors: ['hvv-card']
  },
  
  'ha-departures-card': {
    // ha-departures-card uses 'departures-card' as element name
    customElements: ['departures-card'],
    cardTypes: ['custom:departures-card'],
    domSelectors: ['departures-card'],
    keywords: ['departure']
  },
  
  'db-info-card': {
    // db_info uses flex-table-card
    customElements: ['flex-table-card'],
    cardTypes: ['custom:flex-table-card'],
    domSelectors: ['flex-table-card'],
    keywords: ['flex-table']
  },
  
  'kvv-departures-card': {
    customElements: ['kvv-departures-card'],
    cardTypes: ['custom:kvv-departures-card'],
    domSelectors: ['kvv-departures-card']
  },
  
  'clock-weather-card': {
    customElements: ['clock-weather-card'],
    cardTypes: ['custom:clock-weather-card'],
    domSelectors: ['clock-weather-card'],
    keywords: ['clock-weather', 'clock weather']
  },
  
  'scheduler-card': {
    // Requires BOTH scheduler-component integration AND scheduler-card
    requiresAll: true,
    // Check for scheduler-component integration via entity registry
    customCheck: (hass) => {
      const entities = Object.values(hass?.entities || {});
      return entities.some(entity => {
        return entity.platform === 'scheduler';
      });
    },
    // Check for scheduler-card
    customElements: ['scheduler-card'],
    cardTypes: ['custom:scheduler-card'],
    domSelectors: ['scheduler-card'],
    keywords: ['scheduler']
  },
  
  'alarmo-card': {
    customElements: ['alarmo-card'],
    cardTypes: ['custom:alarmo-card'],
    domSelectors: ['alarmo-card'],
    keywords: ['alarmo']
  },
  
  'calendar-card': {
    customElements: ['calendar-card'],
    cardTypes: ['custom:calendar-card'],
    domSelectors: ['calendar-card'],
    keywords: ['calendar']
  },
  
  'calendar-card-pro': {
    customElements: ['calendar-card-pro'],
    cardTypes: ['custom:calendar-card-pro'],
    domSelectors: ['calendar-card-pro'],
    keywords: ['calendar-card-pro', 'calendar card pro']
  }
};

/**
 * Checks if a custom element is registered
 * @param {string} elementName - The custom element name
 * @returns {boolean}
 */
function checkCustomElement(elementName) {
  return customElements.get(elementName) !== undefined;
}

/**
 * Checks if a card type exists in window.customCards
 * @param {string} cardType - The card type (e.g., 'custom:search-card')
 * @returns {boolean}
 */
function checkCardType(cardType) {
  if (!window.customCards || !Array.isArray(window.customCards)) {
    return false;
  }
  return window.customCards.some(card => card.type === cardType);
}

/**
 * Checks if a card exists in window.customCards by name
 * @param {string} cardName - The card name
 * @returns {boolean}
 */
function checkCardName(cardName) {
  if (!window.customCards || !Array.isArray(window.customCards)) {
    return false;
  }
  return window.customCards.some(card => card.name === cardName);
}

/**
 * Checks if a card exists in window.customCards by keywords
 * @param {string[]} keywords - Keywords to search for
 * @returns {boolean}
 */
function checkCardKeywords(keywords) {
  if (!window.customCards || !Array.isArray(window.customCards)) {
    return false;
  }
  return window.customCards.some(card => {
    const name = (card.name || '').toLowerCase();
    const type = (card.type || '').toLowerCase();
    return keywords.some(keyword => 
      name.includes(keyword.toLowerCase()) || 
      type.includes(keyword.toLowerCase())
    );
  });
}

/**
 * Checks if an element exists in the DOM
 * @param {string} selector - CSS selector
 * @returns {boolean}
 */
function checkDOMSelector(selector) {
  return document.querySelector(selector) !== null;
}

/**
 * Checks a dependency based on its configuration
 * @param {string} dependencyId - The dependency identifier
 * @param {Object} hass - Home Assistant object (optional, needed for custom checks)
 * @returns {boolean} True if dependency is available
 */
export function checkDependency(dependencyId, hass = null) {
  const config = DEPENDENCY_DEFINITIONS[dependencyId];
  
  if (!config) {
    logWarn('[DependencyChecker] Unknown dependency:', dependencyId);
    return false;
  }
  
  try {
    const requiresAll = config.requiresAll === true;
    let cardCheckPassed = false;
    let customCheckPassed = true; // Default to true if no custom check
    
    // Check card-related requirements (custom elements, card types, etc.)
    if (config.customElements || config.cardTypes || config.cardNames || config.keywords || config.domSelectors) {
      // 1. Check custom elements
      if (config.customElements) {
        cardCheckPassed = config.customElements.some(elementName => 
          checkCustomElement(elementName)
        );
        if (cardCheckPassed && !requiresAll) return true;
      }
      
      // 2. Check card types
      if (!cardCheckPassed && config.cardTypes) {
        cardCheckPassed = config.cardTypes.some(cardType => 
          checkCardType(cardType)
        );
        if (cardCheckPassed && !requiresAll) return true;
      }
      
      // 3. Check card names
      if (!cardCheckPassed && config.cardNames) {
        cardCheckPassed = config.cardNames.some(cardName => 
          checkCardName(cardName)
        );
        if (cardCheckPassed && !requiresAll) return true;
      }
      
      // 4. Check keywords (flexible matching)
      if (!cardCheckPassed && config.keywords) {
        cardCheckPassed = checkCardKeywords(config.keywords);
        if (cardCheckPassed && !requiresAll) return true;
      }
      
      // 5. Check DOM selectors
      if (!cardCheckPassed && config.domSelectors) {
        cardCheckPassed = config.domSelectors.some(selector => 
          checkDOMSelector(selector)
        );
        if (cardCheckPassed && !requiresAll) return true;
      }
    } else {
      // No card checks defined, so card check is not required
      cardCheckPassed = true;
    }
    
    // 6. Custom check (for complex dependencies like better-thermostat integration, card-tools)
    if (config.customCheck) {
      customCheckPassed = config.customCheck(hass);
    }
    
    // If requiresAll, both checks must pass; otherwise, at least one must pass
    if (requiresAll) {
      return cardCheckPassed && customCheckPassed;
    } else {
      return cardCheckPassed || customCheckPassed;
    }
  } catch (error) {
    logWarn('[DependencyChecker] Error checking dependency:', dependencyId, error);
    return false;
  }
}

/**
 * Checks multiple dependencies at once
 * @param {string[]} dependencyIds - Array of dependency identifiers
 * @param {Object} hass - Home Assistant object (optional)
 * @returns {Object} Object with dependency IDs as keys and boolean values
 */
export function checkDependencies(dependencyIds, hass = null) {
  const results = {};
  dependencyIds.forEach(id => {
    results[id] = checkDependency(id, hass);
  });
  return results;
}

/**
 * Gets the public transport card dependency ID based on integration and card
 * @param {string} integration - Integration name (e.g., 'hvv', 'ha-departures')
 * @param {string} card - Card identifier (e.g., 'hvv-card', 'ha-departures-card')
 * @returns {string|null} Dependency ID or null if not found
 */
export function getPublicTransportDependencyId(integration, card) {
  // Map integration/card combinations to dependency IDs
  const mapping = {
    'hvv': 'hvv-card',
    'ha-departures': 'ha-departures-card',
    'db_info': 'db-info-card',
    'kvv': 'kvv-departures-card'
  };
  
  // Try card first, then integration
  const dependencyId = card || mapping[integration];
  
  // Verify it's a valid dependency
  if (dependencyId && DEPENDENCY_DEFINITIONS[dependencyId]) {
    return dependencyId;
  }
  
  return null;
}

/**
 * Checks public transport dependencies
 * @param {string} integration - Integration name
 * @param {string} card - Card identifier
 * @param {Object} hass - Home Assistant object (optional)
 * @returns {boolean} True if dependencies are available
 */
export function checkPublicTransportDependencies(integration, card, hass = null) {
  const dependencyId = getPublicTransportDependencyId(integration, card);
  if (!dependencyId) {
    return false;
  }
  return checkDependency(dependencyId, hass);
}

/**
 * Gets all available dependency IDs
 * @returns {string[]} Array of dependency identifiers
 */
export function getAvailableDependencyIds() {
  return Object.keys(DEPENDENCY_DEFINITIONS);
}

