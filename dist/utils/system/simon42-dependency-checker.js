// ====================================================================
// DEPENDENCY CHECKER - Centralized Dependency Checking Utility
// ====================================================================
// Provides a unified way to check for custom cards, integrations, and other dependencies
// Makes it easy to add new dependency checks
// Consolidates all dependency logic including URLs and hint messages
// ====================================================================

import { logWarn } from './simon42-logger.js';
import { t } from '../i18n/simon42-i18n.js';

/**
 * Dependency check configuration
 * @typedef {Object} DependencyConfig
 * @property {string[]} [customElements] - Custom element names to check (e.g., ['search-card'])
 * @property {string[]} [cardTypes] - Card types to check in window.customCards (e.g., ['custom:search-card'])
 * @property {string[]} [domSelectors] - DOM selectors to check (e.g., ['search-card'])
 * @property {Function} [customCheck] - Custom check function (hass) => boolean
 * @property {string[]} [keywords] - Keywords to search for in window.customCards (e.g., ['search', 'card'])
 * @property {boolean} [requiresAll] - If true, all checks must pass (default: false)
 * @property {string} [integrationUrl] - URL to integration repository
 * @property {string} [cardUrl] - URL to card repository
 * @property {string} [missingDepsKey] - Translation key for missing dependency message
 * @property {string} [linkKey] - Translation key for link label (card only)
 * @property {string} [integrationLinkKey] - Translation key for integration link label
 * @property {string} [cardLinkKey] - Translation key for card link label
 * @property {Function} [buildHintMessage] - Custom function to build hint message (dependencyId, hass) => string
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
    },
    cardUrl: 'https://github.com/postlund/search-card',
    missingDepsKey: 'searchCardMissingDeps',
    linkKey: 'searchCardLink'
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
    keywords: ['better-thermostat'],
    integrationUrl: 'https://github.com/KartoffelToby/better_thermostat',
    cardUrl: 'https://github.com/KartoffelToby/better-thermostat-ui-card',
    missingDepsKey: 'betterThermostatMissingDeps',
    integrationLinkKey: 'betterThermostatIntegrationLink',
    cardLinkKey: 'betterThermostatCardLink',
    buildHintMessage: (dependencyId, hass) => {
      const config = DEPENDENCY_DEFINITIONS[dependencyId];
      const urls = getDependencyUrls(dependencyId);
      let message = `⚠️ ${t(config.missingDepsKey)}`;
      
      if (urls.integrationUrl || urls.cardUrl) {
        message += '<br><br>';
        if (urls.integrationUrl) {
          message += `${t(config.integrationLinkKey)}: <a href="${urls.integrationUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">${urls.integrationUrl}</a><br>`;
        }
        if (urls.cardUrl) {
          message += `${t(config.cardLinkKey)}: <a href="${urls.cardUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">${urls.cardUrl}</a>`;
        }
      }
      
      return message;
    }
  },
  
  'horizon-card': {
    customElements: ['horizon-card'],
    cardTypes: ['custom:horizon-card'],
    domSelectors: ['horizon-card'],
    keywords: ['horizon'],
    cardUrl: 'https://github.com/rejuvenate/lovelace-horizon-card',
    missingDepsKey: 'horizonCardMissingDeps',
    linkKey: 'horizonCardLink'
  },
  
  'hvv-card': {
    customElements: ['hvv-card'],
    cardTypes: ['custom:hvv-card'],
    domSelectors: ['hvv-card'],
    cardUrl: 'https://github.com/nilstgmd/hvv-card',
    // Integration is available in Home Assistant Core
    integrationUrl: null
  },
  
  'ha-departures-card': {
    // ha-departures-card uses 'departures-card' as element name
    customElements: ['departures-card'],
    cardTypes: ['custom:departures-card'],
    domSelectors: ['departures-card'],
    keywords: ['departure'],
    integrationUrl: 'https://github.com/alex-jung/ha-departures',
    cardUrl: 'https://github.com/alex-jung/ha-departures-card'
  },
  
  'db-info-card': {
    // db_info uses flex-table-card
    customElements: ['flex-table-card'],
    cardTypes: ['custom:flex-table-card'],
    domSelectors: ['flex-table-card'],
    keywords: ['flex-table'],
    integrationUrl: 'https://github.com/EiS94/db_info',
    cardUrl: 'https://github.com/custom-cards/flex-table-card'
  },
  
  'kvv-departures-card': {
    customElements: ['kvv-departures-card'],
    cardTypes: ['custom:kvv-departures-card'],
    domSelectors: ['kvv-departures-card'],
    integrationUrl: 'https://github.com/drlaplace/KVV_Departure_Monitor',
    cardUrl: 'https://github.com/drlaplace/kvv-departures-card'
  },
  
  'clock-weather-card': {
    customElements: ['clock-weather-card'],
    cardTypes: ['custom:clock-weather-card'],
    domSelectors: ['clock-weather-card'],
    keywords: ['clock-weather', 'clock weather'],
    cardUrl: 'https://github.com/pkissling/clock-weather-card',
    missingDepsKey: 'clockWeatherCardMissingDeps',
    linkKey: 'clockWeatherCardLink'
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
    keywords: ['scheduler'],
    integrationUrl: 'https://github.com/nielsfaber/scheduler-component',
    cardUrl: 'https://github.com/nielsfaber/scheduler-card',
    missingDepsKey: 'schedulerCardMissingDeps',
    integrationLinkKey: 'schedulerIntegrationLink',
    cardLinkKey: 'schedulerCardLink',
    buildHintMessage: (dependencyId, hass) => {
      const config = DEPENDENCY_DEFINITIONS[dependencyId];
      const urls = getDependencyUrls(dependencyId);
      let message = `⚠️ ${t(config.missingDepsKey)}`;
      
      if (urls.integrationUrl || urls.cardUrl) {
        message += '<br><br>';
        if (urls.integrationUrl) {
          message += `${t(config.integrationLinkKey)}: <a href="${urls.integrationUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">${urls.integrationUrl}</a><br>`;
        }
        if (urls.cardUrl) {
          message += `${t(config.cardLinkKey)}: <a href="${urls.cardUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">${urls.cardUrl}</a>`;
        }
      }
      
      return message;
    }
  },
  
  'alarmo-card': {
    customElements: ['alarmo-card'],
    cardTypes: ['custom:alarmo-card'],
    domSelectors: ['alarmo-card'],
    keywords: ['alarmo'],
    cardUrl: 'https://github.com/nielsfaber/alarmo-card',
    missingDepsKey: 'alarmoCardMissingDeps',
    linkKey: 'alarmoCardLink'
  },
  
  'calendar-card-pro': {
    customElements: ['calendar-card-pro'],
    cardTypes: ['custom:calendar-card-pro'],
    domSelectors: ['calendar-card-pro'],
    keywords: ['calendar-card-pro', 'calendar card pro'],
    cardUrl: 'https://github.com/alexpfau/calendar-card-pro',
    linkKey: 'calendarCardProLink'
  },
  
  'todo-swipe-card': {
    customElements: ['todo-swipe-card'],
    cardTypes: ['custom:todo-swipe-card'],
    domSelectors: ['todo-swipe-card'],
    keywords: ['todo-swipe-card', 'todo swipe card'],
    cardUrl: 'https://github.com/nutteloost/todo-swipe-card',
    missingDepsKey: 'todoSwipeCardMissingDeps',
    linkKey: 'todoSwipeCardLink'
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
    // Prioritize window.customCards checks as they're more reliable
    if (config.customElements || config.cardTypes || config.cardNames || config.keywords || config.domSelectors) {
      // 1. Check card types first (most reliable - uses window.customCards)
      if (config.cardTypes) {
        cardCheckPassed = config.cardTypes.some(cardType => 
          checkCardType(cardType)
        );
        if (cardCheckPassed && !requiresAll) return true;
      }
      
      // 2. Check card names
      if (!cardCheckPassed && config.cardNames) {
        cardCheckPassed = config.cardNames.some(cardName => 
          checkCardName(cardName)
        );
        if (cardCheckPassed && !requiresAll) return true;
      }
      
      // 3. Check keywords (flexible matching)
      if (!cardCheckPassed && config.keywords) {
        cardCheckPassed = checkCardKeywords(config.keywords);
        if (cardCheckPassed && !requiresAll) return true;
      }
      
      // 4. Check custom elements (less reliable - element might not be registered yet)
      if (!cardCheckPassed && config.customElements) {
        cardCheckPassed = config.customElements.some(elementName => {
          try {
            return checkCustomElement(elementName);
          } catch (e) {
            return false;
          }
        });
        if (cardCheckPassed && !requiresAll) return true;
      }
      
      // 5. Check DOM selectors (least reliable - element might not be in DOM)
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

/**
 * Gets dependency URLs (integration and card)
 * @param {string} dependencyId - The dependency identifier
 * @returns {Object} Object with integrationUrl and cardUrl properties
 */
export function getDependencyUrls(dependencyId) {
  const config = DEPENDENCY_DEFINITIONS[dependencyId];
  
  if (!config) {
    return { integrationUrl: null, cardUrl: null };
  }
  
  return {
    integrationUrl: config.integrationUrl || null,
    cardUrl: config.cardUrl || null
  };
}

/**
 * Gets public transport dependency URLs
 * @param {string} integration - Integration name (e.g., 'hvv', 'ha-departures')
 * @returns {Object} Object with integrationUrl and cardUrl properties
 */
export function getPublicTransportUrls(integration) {
  const dependencyId = getPublicTransportDependencyId(integration);
  if (!dependencyId) {
    return { integrationUrl: null, cardUrl: null };
  }
  
  return getDependencyUrls(dependencyId);
}

/**
 * Gets the card name for a public transport integration
 * @param {string} integration - Integration name (e.g., 'hvv', 'ha-departures')
 * @returns {string} Card name for display
 */
export function getCardNameForIntegration(integration) {
  const cardNames = {
    'hvv': 'hvv-card',
    'ha-departures': 'departures-card', // ha-departures-card uses 'departures-card' as element name
    'db_info': 'flex-table-card',
    'kvv': 'kvv-departures-card'
  };
  return cardNames[integration] || integration;
}

/**
 * Builds a dependency missing message with links
 * @param {string} dependencyId - The dependency ID (e.g., 'search-card', 'clock-weather-card')
 * @param {string} [missingDepsKey] - Translation key for missing deps message (optional, uses config if not provided)
 * @param {string} [linkKey] - Translation key for link label (optional, uses config if not provided)
 * @returns {string} HTML message
 */
export function buildDependencyMissingMessage(dependencyId, missingDepsKey = null, linkKey = null) {
  const config = DEPENDENCY_DEFINITIONS[dependencyId];
  
  if (!config) {
    return '';
  }
  
  // Use custom build function if available
  if (config.buildHintMessage) {
    return config.buildHintMessage(dependencyId, null);
  }
  
  // Use provided keys or fall back to config
  const depsKey = missingDepsKey || config.missingDepsKey;
  const linkLabelKey = linkKey || config.linkKey;
  
  if (!depsKey) {
    return '';
  }
  
  const urls = getDependencyUrls(dependencyId);
  let message = `⚠️ ${t(depsKey)}`;
  
  if (urls.cardUrl && linkLabelKey) {
    message += '<br><br>';
    message += `${t(linkLabelKey)}: <a href="${urls.cardUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">${urls.cardUrl}</a>`;
  }
  
  return message;
}

/**
 * Builds a better thermostat dependency missing message
 * @returns {string} HTML message
 */
export function buildBetterThermostatMissingMessage() {
  return buildDependencyMissingMessage('better-thermostat');
}

/**
 * Builds a public transport dependency missing message
 * @param {string} integration - The integration ID
 * @returns {string} HTML message
 */
export function buildPublicTransportMissingMessage(integration) {
  const cardName = getCardNameForIntegration(integration);
  const urls = getPublicTransportUrls(integration);
  
  // Build the main message with card name replacement
  const mainMessage = t('publicTransportCardMissingDeps');
  const messageWithCard = mainMessage.replace('{card}', cardName);
  let message = `⚠️ ${messageWithCard}`;
  
  if (urls.integrationUrl || urls.cardUrl) {
    message += '<br><br>';
    if (urls.integrationUrl) {
      message += `${t('publicTransportIntegrationLink')}: <a href="${urls.integrationUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">${urls.integrationUrl}</a><br>`;
    } else if (integration === 'hvv') {
      message += `${t('publicTransportIntegrationLink')}: ${t('publicTransportIntegrationAvailableInCore')}<br>`;
    }
    if (urls.cardUrl) {
      message += `${t('publicTransportCardLink')}: <a href="${urls.cardUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">${urls.cardUrl}</a>`;
    }
  }
  
  return message;
}

/**
 * Gets comprehensive dependency information including status, disabled state, and hint message
 * @param {string} dependencyId - The dependency identifier
 * @param {Object} hass - Home Assistant object (optional, needed for custom checks)
 * @returns {Object} Dependency information object with:
 *   - met: boolean - Whether dependency is met
 *   - disabled: boolean - Whether toggle should be disabled (inverse of met)
 *   - hint: string - HTML hint message if dependency is not met
 */
export function getDependencyInfo(dependencyId, hass = null) {
  const met = checkDependency(dependencyId, hass);
  const config = DEPENDENCY_DEFINITIONS[dependencyId];
  
  let hint = '';
  if (!met && config) {
    // Use custom build function if available
    if (config.buildHintMessage) {
      hint = config.buildHintMessage(dependencyId, hass);
    } else if (config.missingDepsKey) {
      hint = buildDependencyMissingMessage(
        dependencyId,
        config.missingDepsKey,
        config.linkKey
      );
    }
  }
  
  return {
    met,
    disabled: !met,
    hint
  };
}

/**
 * Gets public transport dependency information
 * @param {string} integration - Integration name
 * @param {string} card - Card identifier
 * @param {Object} hass - Home Assistant object (optional)
 * @returns {Object} Dependency information object (same as getDependencyInfo)
 */
export function getPublicTransportDependencyInfo(integration, card, hass = null) {
  const dependencyId = getPublicTransportDependencyId(integration, card);
  if (!dependencyId) {
    return {
      met: false,
      disabled: true,
      hint: ''
    };
  }
  
  const met = checkDependency(dependencyId, hass);
  const urls = getPublicTransportUrls(integration);
  const cardName = getCardNameForIntegration(integration);
  
  let hint = '';
  if (!met) {
    // Build the main message with card name replacement
    const mainMessage = t('publicTransportCardMissingDeps');
    const messageWithCard = mainMessage.replace('{card}', cardName);
    hint = `⚠️ ${messageWithCard}`;
    
    if (urls.integrationUrl || urls.cardUrl) {
      hint += '<br><br>';
      if (urls.integrationUrl) {
        hint += `${t('publicTransportIntegrationLink')}: <a href="${urls.integrationUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">${urls.integrationUrl}</a><br>`;
      } else if (integration === 'hvv') {
        hint += `${t('publicTransportIntegrationLink')}: ${t('publicTransportIntegrationAvailableInCore')}<br>`;
      }
      if (urls.cardUrl) {
        hint += `${t('publicTransportCardLink')}: <a href="${urls.cardUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">${urls.cardUrl}</a>`;
      }
    }
  }
  
  return {
    met,
    disabled: !met,
    hint
  };
}

