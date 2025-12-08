// ====================================================================
// EDITOR DEPENDENCY URLS
// ====================================================================
// Manages dependency URLs and builds dependency missing messages
// ====================================================================

import { t } from '../../../utils/simon42-i18n.js';

/**
 * Gibt den Card-Namen für eine Integration zurück
 * @param {string} integration - Die Integration ('hvv', 'ha-departures', 'db_info', 'kvv')
 * @returns {string} Der Card-Name für die Anzeige
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
 * Gibt die Repository-URLs für Integration und Card zurück
 * @param {string} integration - Die Integration ('hvv', 'ha-departures', 'db_info', 'kvv')
 * @returns {Object} Objekt mit integrationUrl und cardUrl
 */
export function getPublicTransportUrls(integration) {
  const urls = {
    'ha-departures': {
      integrationUrl: 'https://github.com/alex-jung/ha-departures',
      cardUrl: 'https://github.com/alex-jung/ha-departures-card'
    },
    'hvv': {
      integrationUrl: null, // Available in Home Assistant Core by default
      cardUrl: 'https://github.com/nilstgmd/hvv-card'
    },
    'db_info': {
      integrationUrl: 'https://github.com/EiS94/db_info',
      cardUrl: 'https://github.com/custom-cards/flex-table-card'
    },
    'kvv': {
      integrationUrl: 'https://github.com/drlaplace/KVV_Departure_Monitor',
      cardUrl: 'https://github.com/drlaplace/kvv-departures-card'
    }
  };
  return urls[integration] || { integrationUrl: null, cardUrl: null };
}

/**
 * Gibt die Repository-URLs für eine Card oder Integration zurück
 * @param {string} dependencyId - Die Dependency-ID (z.B. 'search-card', 'better-thermostat')
 * @returns {Object} Objekt mit integrationUrl und cardUrl
 */
export function getDependencyUrls(dependencyId) {
  const urls = {
    'search-card': {
      integrationUrl: null,
      cardUrl: 'https://github.com/postlund/search-card'
    },
    'better-thermostat': {
      integrationUrl: 'https://github.com/KartoffelToby/better_thermostat',
      cardUrl: 'https://github.com/KartoffelToby/better-thermostat-ui-card'
    },
    'horizon-card': {
      integrationUrl: null,
      cardUrl: 'https://github.com/rejuvenate/lovelace-horizon-card'
    },
    'clock-weather-card': {
      integrationUrl: null,
      cardUrl: 'https://github.com/pkissling/clock-weather-card'
    }
  };
  return urls[dependencyId] || { integrationUrl: null, cardUrl: null };
}

/**
 * Builds a dependency missing message with links
 * @param {string} dependencyId - The dependency ID (e.g., 'search-card', 'clock-weather-card')
 * @param {string} missingDepsKey - Translation key for missing deps message
 * @param {string} linkKey - Translation key for link label
 * @returns {string} HTML message
 */
export function buildDependencyMissingMessage(dependencyId, missingDepsKey, linkKey) {
  const urls = getDependencyUrls(dependencyId);
  let message = `⚠️ ${t(missingDepsKey)}`;
  
  if (urls.cardUrl) {
    message += '<br><br>';
    message += `${t(linkKey)}: <a href="${urls.cardUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">${urls.cardUrl}</a>`;
  }
  
  return message;
}

/**
 * Builds a better thermostat dependency missing message
 * @returns {string} HTML message
 */
export function buildBetterThermostatMissingMessage() {
  const urls = getDependencyUrls('better-thermostat');
  let message = `⚠️ ${t('betterThermostatMissingDeps')}`;
  
  if (urls.integrationUrl || urls.cardUrl) {
    message += '<br><br>';
    if (urls.integrationUrl) {
      message += `${t('betterThermostatIntegrationLink')}: <a href="${urls.integrationUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">${urls.integrationUrl}</a><br>`;
    }
    if (urls.cardUrl) {
      message += `${t('betterThermostatCardLink')}: <a href="${urls.cardUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">${urls.cardUrl}</a>`;
    }
  }
  
  return message;
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

