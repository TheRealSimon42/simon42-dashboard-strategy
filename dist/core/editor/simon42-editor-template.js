// ====================================================================
// SIMON42 EDITOR TEMPLATE
// ====================================================================
// HTML-Template für den Dashboard Strategy Editor

import { t } from '../../utils/simon42-i18n.js';

/**
 * Renders an MDC switch component (Home Assistant official style)
 * @param {string} id - Element ID
 * @param {boolean} checked - Whether switch is checked
 * @param {string} ariaLabel - Aria label for accessibility
 * @param {boolean} disabled - Whether switch is disabled
 * @returns {string} HTML string for MDC switch
 */
function renderMDCSwitch(id, checked = false, ariaLabel = '', disabled = false) {
  return `
    <input 
      type="checkbox" 
      id="${id}" 
      class="mdc-switch__native-control" 
      role="switch" 
      aria-label="${ariaLabel}" 
      aria-checked="${checked ? 'true' : 'false'}"
      ${checked ? 'checked' : ''}
      ${disabled ? 'disabled' : ''}
    />
  `;
}

/**
 * Filtert Entities basierend auf der ausgewählten Integration
 * @param {Array} allEntities - Alle verfügbaren Entities
 * @param {string} integration - Die ausgewählte Integration ('hvv', 'ha-departures', 'db_info')
 * @param {Object} hass - Home Assistant Objekt (optional, für Attribute-Checks)
 * @returns {Array} Gefilterte Entities
 */
function filterEntitiesByIntegration(allEntities, integration, hass = null) {
  if (!integration || !allEntities) {
    return [];
  }

  return allEntities.filter(entity => {
    const entityId = entity.entity_id.toLowerCase();
    const name = (entity.name || '').toLowerCase();
    
    // Filter für relevante Domains
    if (!entityId.startsWith('sensor.') && !entityId.startsWith('button.')) {
      return false;
    }
    
    // Integration-spezifische Filter basierend auf Attribut-Struktur
    switch (integration) {
      case 'hvv':
        // HVV-Entities haben charakteristische Attribute:
        // - 'next' Array mit departure-Objekten
        // - 'attribution' mit "hvv.de"
        // - 'device_class: timestamp'
        // - Top-level: 'line', 'origin', 'direction', 'type', 'id'
        
        // Exclude KVV entities - check friendly_name for "KVV"
        if (hass && hass.states && hass.states[entity.entity_id]) {
          const state = hass.states[entity.entity_id];
          const attrs = state.attributes || {};
          const friendlyName = (attrs.friendly_name || name || '').toUpperCase();
          
          // Exclude if friendly_name contains "KVV"
          if (friendlyName.includes('KVV')) {
            return false;
          }
        } else {
          // Also check name/entityId for KVV exclusion
          if (name.toUpperCase().includes('KVV') || entityId.toUpperCase().includes('KVV')) {
            return false;
          }
        }
        
        if (hass && hass.states && hass.states[entity.entity_id]) {
          const state = hass.states[entity.entity_id];
          const attrs = state.attributes || {};
          
          // Prüfe auf HVV-spezifische Attribute-Struktur
          const hasNextArray = Array.isArray(attrs.next);
          const hasHvvAttribution = attrs.attribution && 
                                   (attrs.attribution.includes('hvv.de') || 
                                    attrs.attribution.includes('hvv'));
          const hasDeviceClassTimestamp = attrs.device_class === 'timestamp';
          const hasHvvTopLevelAttrs = attrs.line !== undefined && 
                                     attrs.origin !== undefined && 
                                     attrs.direction !== undefined &&
                                     attrs.type !== undefined &&
                                     attrs.id !== undefined;
          
          // HVV-Entity wenn: next-Array vorhanden ODER (attribution mit hvv.de UND device_class timestamp)
          if (hasNextArray || (hasHvvAttribution && hasDeviceClassTimestamp)) {
            return true;
          }
          
          // Auch wenn top-level HVV-Attribute vorhanden sind (aber kein next-Array)
          if (hasHvvTopLevelAttrs && !attrs.line_name) {
            // line_name würde auf ha-departures hinweisen
            return true;
          }
        }
        
        // Fallback: Keyword-basierte Erkennung (aber nicht KVV)
        if (name.toUpperCase().includes('KVV') || entityId.toUpperCase().includes('KVV')) {
          return false;
        }
        
        return entityId.includes('hvv') || 
               name.includes('hvv') ||
               entityId.includes('departure') || 
               entityId.includes('abfahrt') ||
               name.includes('departure') || 
               name.includes('abfahrt');
      
      case 'ha-departures':
        // ha-departures-Entities haben charakteristische Attribute:
        // - 'line_name' (nicht 'line')
        // - 'line_id' (nicht 'id')
        // - 'transport' (nicht 'type')
        // - 'data_provider'
        // - 'planned_departure_time' und 'estimated_departure_time' (nicht in 'next' Array)
        // - 'latitude', 'longitude'
        // KEIN 'next' Array, KEIN 'attribution' mit hvv.de
        
        // Exclude KVV entities - check friendly_name for "KVV"
        if (hass && hass.states && hass.states[entity.entity_id]) {
          const state = hass.states[entity.entity_id];
          const attrs = state.attributes || {};
          const friendlyName = (attrs.friendly_name || name || '').toUpperCase();
          
          // Exclude if friendly_name contains "KVV"
          if (friendlyName.includes('KVV')) {
            return false;
          }
        } else {
          // Also check name/entityId for KVV exclusion
          if (name.toUpperCase().includes('KVV') || entityId.toUpperCase().includes('KVV')) {
            return false;
          }
        }
        
        if (hass && hass.states && hass.states[entity.entity_id]) {
          const state = hass.states[entity.entity_id];
          const attrs = state.attributes || {};
          
          // Explizit HVV ausschließen: Hat 'next' Array oder hvv.de attribution
          const hasNextArray = Array.isArray(attrs.next);
          const hasHvvAttribution = attrs.attribution && 
                                   (attrs.attribution.includes('hvv.de') || 
                                    attrs.attribution.includes('hvv'));
          
          if (hasNextArray || hasHvvAttribution) {
            return false;
          }
          
          // Explizit db_info ausschließen: Hat Attribute mit Leerzeichen im Namen
          const hasDbInfoAttrs = attrs['Departure Time'] !== undefined || 
                                attrs['Arrival Time'] !== undefined ||
                                attrs['Departure Time Real'] !== undefined;
          
          if (hasDbInfoAttrs) {
            return false;
          }
          
          // Prüfe auf ha-departures-spezifische Attribute-Struktur
          const hasLineName = attrs.line_name !== undefined;
          const hasLineId = attrs.line_id !== undefined;
          const hasTransport = attrs.transport !== undefined;
          const hasDataProvider = attrs.data_provider !== undefined;
          const hasPlannedDepartureTime = attrs.planned_departure_time !== undefined;
          const hasLatitude = attrs.latitude !== undefined;
          const hasLongitude = attrs.longitude !== undefined;
          
          // ha-departures: Hat line_name UND (line_id ODER transport) UND planned_departure_time
          // ODER: Hat data_provider UND planned_departure_time
          if (hasLineName && hasPlannedDepartureTime && (hasLineId || hasTransport || hasDataProvider)) {
            return true;
          }
          
          // Auch wenn latitude/longitude vorhanden sind (typisch für ha-departures)
          if (hasLatitude && hasLongitude && hasPlannedDepartureTime && !hasNextArray) {
            return true;
          }
        }
        
        // Fallback: Keyword-basierte Erkennung, aber nur wenn nicht HVV oder KVV
        if (entityId.includes('hvv') || name.includes('hvv')) {
          return false;
        }
        
        if (name.toUpperCase().includes('KVV') || entityId.toUpperCase().includes('KVV')) {
          return false;
        }
        
        return (entityId.includes('departure') || 
                entityId.includes('abfahrt') ||
                name.includes('departure') || 
                name.includes('abfahrt'));
      
      case 'db_info':
        // db_info-Entities haben charakteristische Attribute:
        // - Attribute mit Leerzeichen im Namen: 'Departure Time', 'Arrival Time', etc.
        // - 'Departure', 'Arrival', 'Duration', 'Name', 'Transfers', 'Problems'
        // - Friendly name enthält "→" und "Verbindung"
        
        if (hass && hass.states && hass.states[entity.entity_id]) {
          const state = hass.states[entity.entity_id];
          const attrs = state.attributes || {};
          
          // Prüfe auf db_info-spezifische Attribute-Struktur (Attribute mit Leerzeichen)
          const hasDbInfoAttrs = attrs['Departure Time'] !== undefined || 
                                attrs['Arrival Time'] !== undefined ||
                                attrs['Departure Time Real'] !== undefined ||
                                attrs['Arrival Time Real'] !== undefined ||
                                attrs['Departure'] !== undefined ||
                                attrs['Arrival'] !== undefined ||
                                attrs['Duration'] !== undefined ||
                                attrs['Name'] !== undefined ||
                                attrs['Transfers'] !== undefined;
          
          if (hasDbInfoAttrs) {
            return true;
          }
          
          // Prüfe friendly_name für "→" und "Verbindung"
          const friendlyName = attrs.friendly_name || name || '';
          if (friendlyName.includes('→') && friendlyName.includes('Verbindung')) {
            return true;
          }
        }
        
        // Exclude network/router connections (Fritz!Box, etc.)
        const dbInfoNetworkKeywords = [
          'fritz', 'router', 'network', 'netzwerk',
          'wifi', 'wlan',
          'ethernet',
          'download', 'herunterladen',
          'upload', 'hochladen',
          'throughput', 'bandweite', 'datenrate',
          'wan', 'lan',
          'connection type', 'connectiontype', 'verbindungstyp', 'verbindungsart'
        ];
        const hasDbInfoNetworkKeyword = dbInfoNetworkKeywords.some(keyword => 
          entityId.includes(keyword) || name.includes(keyword)
        );
        
        if (hasDbInfoNetworkKeyword) {
          return false;
        }
        
        // db_info entities typically have 'db_info' in the entity_id or 'db info' in the name
        if (entityId.includes('db_info') || name.includes('db info')) {
          return true;
        }
        
        // db_info creates sensors with 'verbindung' in the entity_id (e.g., sensor.*_verbindung_*)
        // Check for verbindung/connection keywords but exclude network-related ones
        const hasDbInfoConnectionKeyword = entityId.includes('verbindung') ||
                                         name.includes('verbindung') ||
                                         entityId.includes('connection') ||
                                         name.includes('connection');
        
        // If it has verbindung/connection keyword and doesn't have network keywords, include it
        return hasDbInfoConnectionKeyword;
      
      case 'kvv':
        // KVV Departure Monitor entities have characteristic attributes:
        // - 'abfahrten' array with departure objects
        // - Each departure has: 'line', 'direction', 'countdown', 'realtime', 'dateTime'
        // - Entity ID typically contains 'kvv' and 'abfahrten'
        
        if (hass && hass.states && hass.states[entity.entity_id]) {
          const state = hass.states[entity.entity_id];
          const attrs = state.attributes || {};
          
          // Check for KVV-specific attribute structure
          const hasAbfahrtenArray = Array.isArray(attrs.abfahrten);
          
          if (hasAbfahrtenArray) {
            // Verify it's actually KVV format (check first departure object structure)
            if (attrs.abfahrten.length > 0) {
              const firstDeparture = attrs.abfahrten[0];
              const hasKvvStructure = firstDeparture.line !== undefined &&
                                     firstDeparture.direction !== undefined &&
                                     (firstDeparture.countdown !== undefined || firstDeparture.dateTime !== undefined);
              
              if (hasKvvStructure) {
                return true;
              }
            } else {
              // Empty array is still valid KVV entity
              return true;
            }
          }
        }
        
        // Fallback: Keyword-based detection
        return entityId.includes('kvv') || 
               name.includes('kvv') ||
               (entityId.includes('abfahrten') && !entityId.includes('hvv')) ||
               (name.includes('abfahrten') && !name.includes('hvv'));
      
      default:
        // Fallback: allgemeine Transport-Keywords
        const transportKeywords = [
          'departure', 'departures', 'abfahrt', 'abfahrten',
          'public_transport', 'public-transport', 'publictransport',
          'transport', 'verkehr', 'nahverkehr',
          'bus', 'bahn', 'train', 'u-bahn', 'ubahn', 's-bahn', 'sbahn',
          'haltestelle', 'stop'
        ];
        const wholeWordKeywords = ['station'];
        
        const hasTransportKeyword = transportKeywords.some(keyword => 
          entityId.includes(keyword) || name.includes(keyword)
        );
        const hasWholeWordKeyword = wholeWordKeywords.some(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'i');
          return regex.test(entityId) || regex.test(name);
        });
        
        return hasTransportKeyword || hasWholeWordKeyword;
    }
  });
}

/**
 * Gibt den Card-Namen für eine Integration zurück
 * @param {string} integration - Die Integration ('hvv', 'ha-departures', 'db_info')
 * @returns {string} Der Card-Name für die Anzeige
 */
function getCardNameForIntegration(integration) {
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
 * @param {string} integration - Die Integration ('hvv', 'ha-departures', 'db_info')
 * @returns {Object} Objekt mit integrationUrl und cardUrl
 */
function getPublicTransportUrls(integration) {
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

function renderPublicTransportList(publicTransportEntities, allEntities) {
  if (!publicTransportEntities || publicTransportEntities.length === 0) {
    return `<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">${t('noEntitiesAdded')}</div>`;
  }

  const entityMap = new Map(allEntities.map(e => [e.entity_id, e.name]));

  return `
    <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
      ${publicTransportEntities.map((entityId) => {
        const name = entityMap.get(entityId) || entityId;
        return `
          <div class="public-transport-item" data-entity-id="${entityId}" style="display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); background: var(--card-background-color);">
            <span class="drag-handle" style="margin-right: 12px; cursor: grab; color: var(--secondary-text-color);">☰</span>
            <span style="flex: 1; font-size: 14px;">
              <strong>${name}</strong>
              <span style="margin-left: 8px; font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">${entityId}</span>
            </span>
            <button class="remove-public-transport-btn" data-entity-id="${entityId}" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer;">
              ✕
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Escaped HTML-Sonderzeichen und ersetzt Leerzeichen durch sichtbare Zeichen
 * @param {string} text - Der Text mit Leerzeichen
 * @returns {string} HTML-escaped Text mit sichtbaren Leerzeichen-Markierungen
 */
function makeSpacesVisible(text) {
  // Escaped zuerst HTML-Sonderzeichen
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  // Ersetze dann normale Leerzeichen durch · (middle dot) für bessere Sichtbarkeit
  // Verwende HTML-Entity für zuverlässige Darstellung
  return escaped.replace(/ /g, '&middot;');
}

function getDomainSelectorOptions(selectedDomain = '', excludeEmpty = false) {
  const domains = [
    { value: '', label: t('patternDomainAll') },
    { value: 'light', label: t('domainLight') },
    { value: 'switch', label: t('domainSwitch') },
    { value: 'cover', label: t('domainCover') },
    { value: 'climate', label: t('domainClimate') },
    { value: 'sensor', label: t('domainSensor') },
    { value: 'binary_sensor', label: t('domainBinarySensor') },
    { value: 'media_player', label: t('domainMediaPlayer') },
    { value: 'scene', label: t('domainScene') },
    { value: 'vacuum', label: t('domainVacuum') },
    { value: 'fan', label: t('domainFan') },
    { value: 'camera', label: t('domainCamera') },
    { value: 'lock', label: t('domainLock') },
    { value: 'input_boolean', label: t('domainInputBoolean') },
    { value: 'input_number', label: t('domainInputNumber') },
    { value: 'input_select', label: t('domainInputSelect') },
    { value: 'input_text', label: t('domainInputText') }
  ];
  
  const filteredDomains = excludeEmpty ? domains.filter(d => d.value !== '') : domains;
  
  return filteredDomains.map(domain => 
    `<option value="${domain.value}" ${domain.value === selectedDomain ? 'selected' : ''}>${domain.label}</option>`
  ).join('');
}

function getDomainLabel(domain) {
  const domainMap = {
    'light': t('domainLight'),
    'switch': t('domainSwitch'),
    'cover': t('domainCover'),
    'climate': t('domainClimate'),
    'sensor': t('domainSensor'),
    'binary_sensor': t('domainBinarySensor'),
    'media_player': t('domainMediaPlayer'),
    'scene': t('domainScene'),
    'vacuum': t('domainVacuum'),
    'fan': t('domainFan'),
    'camera': t('domainCamera'),
    'lock': t('domainLock'),
    'input_boolean': t('domainInputBoolean'),
    'input_number': t('domainInputNumber'),
    'input_select': t('domainInputSelect'),
    'input_text': t('domainInputText')
  };
  return domainMap[domain] || domain;
}

export function renderSearchCardDomainsList(domains) {
  if (!domains || domains.length === 0) {
    return `<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">${t('noDomainsAdded')}</div>`;
  }

  return `
    <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
      ${domains.map((domain) => {
        const label = getDomainLabel(domain);
        return `
          <div class="search-card-domain-item" data-domain="${domain}" style="display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); background: var(--card-background-color);">
            <span style="flex: 1; font-size: 14px;">
              <strong>${label}</strong>
              <span style="margin-left: 8px; font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">${domain}</span>
            </span>
            <button class="remove-domain-btn" data-domain="${domain}" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer;">
              ✕
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export function renderEntityNamePatternsList(patterns) {
  if (!patterns || patterns.length === 0) {
    return `<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">${t('noPatternsAdded')}</div>`;
  }

  return `
    <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
      ${patterns.map((pattern, index) => {
        const patternText = typeof pattern === 'string' ? pattern : pattern.pattern || '';
        const displayText = makeSpacesVisible(patternText);
        const currentDomain = typeof pattern === 'object' ? pattern.domain : '';
        return `
          <div class="entity-name-pattern-item" data-pattern-index="${index}" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); background: var(--card-background-color);">
            <span style="flex: 1; font-size: 14px; font-family: monospace; word-break: break-all; white-space: pre-wrap;" title="${patternText.replace(/"/g, '&quot;')}">${displayText}</span>
            <select 
              class="pattern-domain-select" 
              data-pattern-index="${index}"
              style="min-width: 150px; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font-size: 12px;"
            >
              ${getDomainSelectorOptions(currentDomain)}
            </select>
            <button class="remove-pattern-btn" data-pattern-index="${index}" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer; flex-shrink: 0;">
              ✕
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function getLanguageSelectorOptions(selectedLang = '', placeholderKey = 'translationFromLang') {
  const languages = [
    { value: '', label: t(placeholderKey) },
    { value: 'en', label: t('langEnglish') },
    { value: 'de', label: t('langGerman') }
  ];
  
  return languages.map(lang => 
    `<option value="${lang.value}" ${lang.value === selectedLang ? 'selected' : ''}>${lang.label}</option>`
  ).join('');
}

export function renderEntityNameTranslationsList(translations) {
  if (!translations || translations.length === 0) {
    return `<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">${t('noTranslationsAdded')}</div>`;
  }

  return `
    <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
      ${translations.map((translation, index) => {
        const fromText = translation.from || '';
        const toText = translation.to || '';
        const fromLang = translation.from_lang || '';
        const toLang = translation.to_lang || '';
        return `
          <div class="entity-name-translation-item" data-translation-index="${index}" style="display: flex; flex-direction: column; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); background: var(--card-background-color);">
            <div style="font-size: 14px; word-break: break-word;">"${fromText.replace(/"/g, '&quot;')}" → "${toText.replace(/"/g, '&quot;')}"</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <select 
                class="translation-from-lang-select" 
                data-translation-index="${index}"
                style="min-width: 100px; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font-size: 12px;"
                title="${t('translationFromLang')}"
              >
                ${getLanguageSelectorOptions(fromLang, 'translationFromLang')}
              </select>
              <span style="color: var(--secondary-text-color);">→</span>
              <select 
                class="translation-to-lang-select" 
                data-translation-index="${index}"
                style="min-width: 100px; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font-size: 12px;"
                title="${t('translationToLang')}"
              >
                ${getLanguageSelectorOptions(toLang, 'translationToLang')}
              </select>
              <button class="remove-translation-btn" data-translation-index="${index}" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer; flex-shrink: 0; margin-left: auto;">
                ✕
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Renders the navigation bar for quick access to section groups
 * @returns {string} HTML for navigation bar
 */
export function renderNavigationBar() {
  return `
    <div class="editor-navigation-bar">
      <button class="nav-item" data-group="dashboard-cards" type="button" title="${t('navGroupDashboardCards')}">
        <ha-icon icon="mdi:view-dashboard"></ha-icon>
        <span class="nav-item-label">${t('navGroupDashboardCardsShort')}</span>
      </button>
      <button class="nav-item" data-group="views-summaries" type="button" title="${t('navGroupViewsSummaries')}">
        <ha-icon icon="mdi:view-list"></ha-icon>
        <span class="nav-item-label">${t('navGroupViewsSummariesShort')}</span>
      </button>
      <button class="nav-item" data-group="entity-management" type="button" title="${t('navGroupEntityManagement')}">
        <ha-icon icon="mdi:home"></ha-icon>
        <span class="nav-item-label">${t('navGroupEntityManagementShort')}</span>
      </button>
      <button class="nav-item" data-group="advanced" type="button" title="${t('navGroupAdvanced')}">
        <ha-icon icon="mdi:cog"></ha-icon>
        <span class="nav-item-label">${t('navGroupAdvancedShort')}</span>
      </button>
    </div>
  `;
}

/**
 * Renders a section group (non-collapsible, visibility controlled by navigation)
 * @param {string} groupId - Unique ID for the group
 * @param {string} title - Group title (unused, kept for API compatibility)
 * @param {string} content - HTML content for the group
 * @param {boolean} isExpanded - Whether the group is visible by default (unused, kept for API compatibility)
 * @returns {string} HTML for section group
 */
export function renderSectionGroup(groupId, title, content, isExpanded = false) {
  return `
    <div class="section-group" id="${groupId}" data-group-id="${groupId}">
      ${content}
    </div>
  `;
}

export function renderEditorHTML({ allAreas, hiddenAreas, areaOrder, showEnergy, showWeather, showPersonBadges = true, showPersonProfilePicture = false, showSummaryViews, showRoomViews, showSearchCard, showClockCard = false, hasSearchCardDeps, searchCardIncludedDomains = [], searchCardExcludedDomains = [], summariesColumns, alarmEntity, alarmEntities, favoriteEntities, roomPinEntities, allEntities, groupByFloors, showCoversSummary, showSecuritySummary = true, showLightSummary = true, showBatterySummary = true, showBetterThermostat = false, hasBetterThermostatDeps = false, showHorizonCard = false, hasHorizonCardDeps = false, horizonCardExtended = false, useClockWeatherCard = false, hasClockWeatherCardDeps = false, showPublicTransport = false, publicTransportEntities = [], publicTransportIntegration = '', publicTransportCard = '', hasPublicTransportDeps = false, hvvMax = 10, hvvShowTime = false, hvvShowTitle = false, hvvTitle = 'HVV', haDeparturesMax = 3, haDeparturesShowCardHeader = true, haDeparturesShowAnimation = true, haDeparturesShowTransportIcon = false, haDeparturesHideEmptyDepartures = false, haDeparturesTimeStyle = 'dynamic', haDeparturesIcon = 'mdi:bus-multiple', entityNamePatterns = [], entityNameTranslations = [], logLevel = 'warn', hass = null }) {
  // Build content for each group
  // Group 1: Dashboard Cards
  const dashboardCardsContent = `
      <div class="section">
        <div class="section-title">${t('infoCards')}</div>
        <div class="form-row">
          ${renderMDCSwitch('show-weather', showWeather !== false, t('showWeatherCard'))}
          <label for="show-weather" style="margin-left: 12px; cursor: pointer;">${t('showWeatherCard')}</label>
        </div>
        <div class="description">
          ${t('weatherCardDescription')}
        </div>
        ${hasHorizonCardDeps ? `
        <div style="margin-top: 12px;">
          <div class="form-row">
            ${renderMDCSwitch('show-horizon-card', showHorizonCard, t('showHorizonCard'), !hasHorizonCardDeps)}
            <label for="show-horizon-card" style="margin-left: 12px; cursor: pointer;" ${!hasHorizonCardDeps ? 'class="disabled-label"' : ''}>
              ${t('showHorizonCard')}
            </label>
          </div>
          <div class="description">
            ${hasHorizonCardDeps 
              ? t('horizonCardDescription')
              : `⚠️ ${t('horizonCardMissingDeps')}`}
          </div>
          ${hasHorizonCardDeps && showHorizonCard ? `
          <div style="margin-top: 12px;">
            <div class="form-row">
              ${renderMDCSwitch('horizon-card-extended', horizonCardExtended, t('showExtendedInfo'))}
              <label for="horizon-card-extended" style="margin-left: 12px; cursor: pointer;">
                ${t('showExtendedInfo')}
              </label>
            </div>
            <div class="description">
              ${t('horizonCardExtendedDescription')}
            </div>
          </div>
          ` : ''}
        </div>
        ` : ''}
        ${hasClockWeatherCardDeps ? `
        <div style="margin-top: 12px;">
          <div class="form-row">
            ${renderMDCSwitch('use-clock-weather-card', useClockWeatherCard, t('useClockWeatherCard'), !hasClockWeatherCardDeps)}
            <label for="use-clock-weather-card" style="margin-left: 12px; cursor: pointer;" ${!hasClockWeatherCardDeps ? 'class="disabled-label"' : ''}>
              ${t('useClockWeatherCard')}
            </label>
          </div>
          <div class="description">
            ${hasClockWeatherCardDeps 
              ? t('clockWeatherCardDescription')
              : `⚠️ ${t('clockWeatherCardMissingDeps')}`}
          </div>
        </div>
        ` : ''}
        <div class="form-row">
          ${renderMDCSwitch('show-energy', showEnergy, t('showEnergyDashboard'))}
          <label for="show-energy" style="margin-left: 12px; cursor: pointer;">${t('showEnergyDashboard')}</label>
        </div>
        <div class="description">
          ${t('energyCardDescription')}
        </div>
        <div class="form-row">
          ${renderMDCSwitch('show-person-badges', showPersonBadges !== false, t('showPersonBadges'))}
          <label for="show-person-badges" style="margin-left: 12px; cursor: pointer;">${t('showPersonBadges')}</label>
        </div>
        <div class="description">
          ${t('personBadgesDescription')}
        </div>
        ${showPersonBadges !== false ? `
        <div style="margin-top: 12px;">
          <div class="form-row">
            ${renderMDCSwitch('show-person-profile-picture', showPersonProfilePicture === true, t('showPersonProfilePicture'))}
            <label for="show-person-profile-picture" style="margin-left: 12px; cursor: pointer;">
              ${t('showPersonProfilePicture')}
            </label>
          </div>
          <div class="description">
            ${t('personProfilePictureDescription')}
          </div>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">${t('searchCard')}</div>
        <div class="form-row">
          ${renderMDCSwitch('show-search-card', showSearchCard, t('showSearchCard'), !hasSearchCardDeps)}
          <label for="show-search-card" style="margin-left: 12px; cursor: pointer;" ${!hasSearchCardDeps ? 'class="disabled-label"' : ''}>
            ${t('showSearchCard')}
          </label>
        </div>
        <div class="description">
          ${hasSearchCardDeps 
            ? t('searchCardDescription')
            : `⚠️ ${t('searchCardMissingDeps')}`}
        </div>
        ${showSearchCard && hasSearchCardDeps ? `
        <div style="margin-top: 12px;">
          <div class="section-title" style="font-size: 13px; margin-bottom: 8px;">${t('searchCardIncludedDomains')}</div>
          <div id="search-card-included-domains-list" style="margin-bottom: 12px;">
            ${renderSearchCardDomainsList(searchCardIncludedDomains || [])}
          </div>
          <div style="display: flex; gap: 8px; align-items: flex-start;">
            <select id="search-card-included-domain-select" style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
              <option value="">${t('selectDomain')}</option>
              ${getDomainSelectorOptions('', true)}
            </select>
            <button id="add-included-domain-btn" style="flex-shrink: 0; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer; white-space: nowrap;">
              + ${t('add')}
            </button>
          </div>
          <div class="description" style="margin-left: 0;">
            ${t('searchCardIncludedDomainsDescription')}
          </div>
          
          <div class="section-title" style="font-size: 13px; margin-top: 16px; margin-bottom: 8px;">${t('searchCardExcludedDomains')}</div>
          <div id="search-card-excluded-domains-list" style="margin-bottom: 12px;">
            ${renderSearchCardDomainsList(searchCardExcludedDomains || [])}
          </div>
          <div style="display: flex; gap: 8px; align-items: flex-start;">
            <select id="search-card-excluded-domain-select" style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
              <option value="">${t('selectDomain')}</option>
              ${getDomainSelectorOptions('', true)}
            </select>
            <button id="add-excluded-domain-btn" style="flex-shrink: 0; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer; white-space: nowrap;">
              + ${t('add')}
            </button>
          </div>
          <div class="description" style="margin-left: 0;">
            ${t('searchCardExcludedDomainsDescription')}
          </div>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">${t('clockCard')}</div>
        <div class="form-row">
          ${renderMDCSwitch('show-clock-card', showClockCard, t('showClockCard'))}
          <label for="show-clock-card" style="margin-left: 12px; cursor: pointer;">${t('showClockCard')}</label>
        </div>
        <div class="description">
          ${t('clockCardDescription')}
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t('betterThermostat')}</div>
        <div class="form-row">
          ${renderMDCSwitch('show-better-thermostat', showBetterThermostat, t('useBetterThermostatUI'), !hasBetterThermostatDeps)}
          <label for="show-better-thermostat" style="margin-left: 12px; cursor: pointer;" ${!hasBetterThermostatDeps ? 'class="disabled-label"' : ''}>
            ${t('useBetterThermostatUI')}
          </label>
        </div>
        <div class="description">
          ${hasBetterThermostatDeps 
            ? t('betterThermostatDescription')
            : `⚠️ ${t('betterThermostatMissingDeps')}`}
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t('alarmControlPanel')}</div>
        <div class="form-row">
          <label for="alarm-entity" style="margin-right: 8px; min-width: 120px;">${t('alarmEntity')}</label>
          <select id="alarm-entity" style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
            <option value="">${t('noneFullWidth')}</option>
            ${alarmEntities.map(entity => `
              <option value="${entity.entity_id}" ${entity.entity_id === alarmEntity ? 'selected' : ''}>
                ${entity.name}
              </option>
            `).join('')}
          </select>
        </div>
        <div class="description">
          ${t('alarmEntityDescription')}
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t('publicTransport')}</div>
        <div class="form-row">
          ${renderMDCSwitch('show-public-transport', showPublicTransport, t('showPublicTransport'))}
          <label for="show-public-transport" style="margin-left: 12px; cursor: pointer;">${t('showPublicTransport')}</label>
        </div>
        <div class="description">
          ${t('publicTransportDescription')}
        </div>
        ${showPublicTransport ? `
        <div style="margin-top: 16px;">
          <div class="form-row">
            <label for="public-transport-integration" style="margin-right: 8px; min-width: 120px;">${t('publicTransportIntegration')}</label>
            <select 
              id="public-transport-integration" 
              style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
            >
              <option value="">${t('selectIntegration')}</option>
              <option value="hvv" ${publicTransportIntegration === 'hvv' ? 'selected' : ''}>${t('publicTransportIntegrationHVV')}</option>
              <option value="ha-departures" ${publicTransportIntegration === 'ha-departures' ? 'selected' : ''}>${t('publicTransportIntegrationHADepartures')}</option>
              <option value="db_info" ${publicTransportIntegration === 'db_info' ? 'selected' : ''}>${t('publicTransportIntegrationDBInfo')}</option>
              <option value="kvv" ${publicTransportIntegration === 'kvv' ? 'selected' : ''}>${t('publicTransportIntegrationKVV')}</option>
            </select>
          </div>
          ${publicTransportIntegration && !hasPublicTransportDeps ? `
          <div class="description" style="margin-top: 8px;">
            ${(() => {
                const cardName = getCardNameForIntegration(publicTransportIntegration);
                const urls = getPublicTransportUrls(publicTransportIntegration);
                let message = `⚠️ ${t('publicTransportCardMissingDeps', { card: cardName })}`;
                
                if (urls.integrationUrl || urls.cardUrl) {
                  message += '<br><br>';
                  if (urls.integrationUrl) {
                    message += `${t('publicTransportIntegrationLink')}: <a href="${urls.integrationUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">${urls.integrationUrl}</a><br>`;
                  } else if (publicTransportIntegration === 'hvv') {
                    message += `${t('publicTransportIntegrationLink')}: ${t('publicTransportIntegrationAvailableInCore')}<br>`;
                  }
                  if (urls.cardUrl) {
                    message += `${t('publicTransportCardLink')}: <a href="${urls.cardUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">${urls.cardUrl}</a>`;
                  }
                }
                
                return message;
              })()}
          </div>
          ` : ''}
          ${publicTransportIntegration && hasPublicTransportDeps ? `
          <div id="public-transport-list" style="margin-top: 12px; margin-bottom: 12px;">
            ${renderPublicTransportList(publicTransportEntities || [], allEntities || [])}
          </div>
          <div style="display: flex; gap: 8px; align-items: flex-start;">
            <select id="public-transport-entity-select" style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
              <option value="">${t('selectEntity')}</option>
              ${filterEntitiesByIntegration(allEntities || [], publicTransportIntegration, hass)
                .map(entity => `
                  <option value="${entity.entity_id}">${entity.name}</option>
                `).join('')}
            </select>
            <button id="add-public-transport-btn" style="flex-shrink: 0; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer; white-space: nowrap;">
              + ${t('add')}
            </button>
          </div>
          <div class="description">
            ${t('publicTransportEntitiesDescription')}
          </div>
          ` : ''}
          ${publicTransportIntegration === 'hvv' && hasPublicTransportDeps ? `
          <div style="margin-top: 16px;">
            <div class="form-row">
              <label for="hvv-max" style="margin-right: 8px; min-width: 120px;">${t('maxDepartures')}</label>
              <input 
                type="number" 
                id="hvv-max" 
                value="${hvvMax !== undefined ? hvvMax : 10}" 
                min="1" 
                max="50"
                style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
              />
            </div>
            <div class="form-row">
              ${renderMDCSwitch('hvv-show-time', hvvShowTime === true, t('showTime'))}
              <label for="hvv-show-time" style="margin-left: 12px; cursor: pointer;">${t('showTime')}</label>
            </div>
            <div class="form-row">
              ${renderMDCSwitch('hvv-show-title', hvvShowTitle === true, t('showTitle'))}
              <label for="hvv-show-title" style="margin-left: 12px; cursor: pointer;">${t('showTitle')}</label>
            </div>
            <div class="form-row">
              <label for="hvv-title" style="margin-right: 8px; min-width: 120px;">${t('title')}</label>
              <input 
                type="text" 
                id="hvv-title" 
                value="${hvvTitle || 'HVV'}" 
                placeholder="HVV"
                style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
              />
            </div>
          </div>
          ` : ''}
          ${publicTransportIntegration === 'ha-departures' && hasPublicTransportDeps ? `
          <div style="margin-top: 16px;">
            <div class="form-row">
              <label for="ha-departures-max" style="margin-right: 8px; min-width: 120px;">${t('maxDepartures')}</label>
              <input 
                type="number" 
                id="ha-departures-max" 
                value="${haDeparturesMax !== undefined ? haDeparturesMax : 3}" 
                min="1" 
                max="5"
                style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
              />
            </div>
            <div class="description" style="margin-top: 4px; font-size: 12px; color: var(--secondary-text-color);">
              ${t('haDeparturesMaxNote')}
            </div>
            <div class="form-row">
              <label for="ha-departures-icon" style="margin-right: 8px; min-width: 120px;">${t('icon')}</label>
              <input 
                type="text" 
                id="ha-departures-icon" 
                value="${haDeparturesIcon || 'mdi:bus-multiple'}" 
                placeholder="mdi:bus-multiple"
                style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
              />
            </div>
            <div class="form-row">
              ${renderMDCSwitch('ha-departures-show-card-header', haDeparturesShowCardHeader !== false, t('showCardHeader'))}
              <label for="ha-departures-show-card-header" style="margin-left: 12px; cursor: pointer;">${t('showCardHeader')}</label>
            </div>
            <div class="form-row">
              ${renderMDCSwitch('ha-departures-show-animation', haDeparturesShowAnimation !== false, t('showAnimation'))}
              <label for="ha-departures-show-animation" style="margin-left: 12px; cursor: pointer;">${t('showAnimation')}</label>
            </div>
            <div class="form-row">
              ${renderMDCSwitch('ha-departures-show-transport-icon', haDeparturesShowTransportIcon === true, t('showTransportIcon'))}
              <label for="ha-departures-show-transport-icon" style="margin-left: 12px; cursor: pointer;">${t('showTransportIcon')}</label>
            </div>
            <div class="form-row">
              ${renderMDCSwitch('ha-departures-hide-empty-departures', haDeparturesHideEmptyDepartures === true, t('hideEmptyDepartures'))}
              <label for="ha-departures-hide-empty-departures" style="margin-left: 12px; cursor: pointer;">${t('hideEmptyDepartures')}</label>
            </div>
            <div class="form-row">
              <label for="ha-departures-time-style" style="margin-right: 8px; min-width: 120px;">${t('timeStyle')}</label>
              <select 
                id="ha-departures-time-style" 
                style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
              >
                <option value="dynamic" ${haDeparturesTimeStyle === 'dynamic' ? 'selected' : ''}>${t('timeStyleDynamic')}</option>
                <option value="timestamp" ${haDeparturesTimeStyle === 'timestamp' ? 'selected' : ''}>${t('timeStyleTimestamp')}</option>
              </select>
            </div>
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>
  `;

  // Group 2: Views & Summaries
  const viewsSummariesContent = `
      <div class="section">
        <div class="section-title">${t('areas')}</div>
        <div class="description" style="margin-left: 0; margin-bottom: 12px;">
          ${t('areasDescription')}
        </div>
        <div class="form-row" style="margin-bottom: 12px;">
          ${renderMDCSwitch('group-by-floors', groupByFloors, t('groupByFloors'))}
          <label for="group-by-floors" style="margin-left: 12px; cursor: pointer;">${t('groupByFloors')}</label>
        </div>
        <div class="description" style="margin-left: 0; margin-bottom: 12px;">
          ${t('groupByFloorsDescription')}
        </div>
        <ha-expansion-panel outlined expanded>
          <ha-svg-icon slot="leading-icon" path="M20 2H4C2.9 2 2 2.9 2 4V20C2 21.11 2.9 22 4 22H20C21.11 22 22 21.11 22 20V4C22 2.9 21.11 2 20 2M4 6L6 4H10.9L4 10.9V6M4 13.7L13.7 4H18.6L4 18.6V13.7M20 18L18 20H13.1L20 13.1V18M20 10.3L10.3 20H5.4L20 5.4V10.3Z"></ha-svg-icon>
          <span slot="header">${t('areas')}</span>
          <ha-items-display-editor>
            <ha-sortable draggable-selector="ha-md-list-item.draggable" handle-selector=".handle">
              <ha-md-list>
                ${renderAreaItems(allAreas, hiddenAreas, areaOrder)}
              </ha-md-list>
            </ha-sortable>
          </ha-items-display-editor>
        </ha-expansion-panel>
      </div>

      <div class="section">
        <div class="section-title">${t('views')}</div>
        <div class="form-row">
          ${renderMDCSwitch('show-summary-views', showSummaryViews, t('showSummaryViews'))}
          <label for="show-summary-views" style="margin-left: 12px; cursor: pointer;">${t('showSummaryViews')}</label>
        </div>
        <div class="description">
          ${t('summaryViewsDescription')}
        </div>
        <div class="form-row">
          ${renderMDCSwitch('show-room-views', showRoomViews, t('showRoomViews'))}
          <label for="show-room-views" style="margin-left: 12px; cursor: pointer;">${t('showRoomViews')}</label>
        </div>
        <div class="description">
          ${t('roomViewsDescription')}
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t('summaries')}</div>
        <div class="form-row">
          ${renderMDCSwitch('show-covers-summary', showCoversSummary !== false, t('showCoversSummary'))}
          <label for="show-covers-summary" style="margin-left: 12px; cursor: pointer;">${t('showCoversSummary')}</label>
        </div>
        <div class="description">
          ${t('coversSummaryDescription')}
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t('summariesLayout')}</div>
        <div class="form-row">
          <input 
            type="radio" 
            id="summaries-2-columns" 
            name="summaries-columns"
            value="2"
            ${summariesColumns === 2 ? 'checked' : ''}
          />
          <label for="summaries-2-columns">${t('twoColumns')}</label>
        </div>
        <div class="form-row">
          <input 
            type="radio" 
            id="summaries-4-columns" 
            name="summaries-columns"
            value="4"
            ${summariesColumns === 4 ? 'checked' : ''}
          />
          <label for="summaries-4-columns">${t('fourColumns')}</label>
        </div>
        <div class="description">
          ${t('summariesLayoutDescription')}
        </div>
      </div>
  `;

  // Group 3: Entity Management
  const entityManagementContent = `
      <div class="section">
        <div class="section-title">${t('favorites')}</div>
        <div id="favorites-list" style="margin-bottom: 12px;">
          ${renderFavoritesList(favoriteEntities, allEntities)}
        </div>
        <div style="display: flex; gap: 8px; align-items: flex-start;">
          <select id="favorite-entity-select" style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
            <option value="">${t('selectEntity')}</option>
            ${allEntities.map(entity => `
              <option value="${entity.entity_id}">${entity.name}</option>
            `).join('')}
          </select>
          <button id="add-favorite-btn" style="flex-shrink: 0; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer; white-space: nowrap;">
            + ${t('add')}
          </button>
        </div>
        <div class="description">
          ${t('favoritesDescription')}
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t('roomPins')}</div>
        <div id="room-pins-list" style="margin-bottom: 12px;">
          ${renderRoomPinsList(roomPinEntities, allEntities, allAreas)}
        </div>
        <div style="display: flex; gap: 8px; align-items: flex-start;">
          <select id="room-pin-entity-select" style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
            <option value="">${t('selectEntity')}</option>
            ${allEntities
              .filter(entity => entity.area_id || entity.device_area_id)
              .map(entity => `
                <option value="${entity.entity_id}">${entity.name}</option>
              `).join('')}
          </select>
          <button id="add-room-pin-btn" style="flex-shrink: 0; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer; white-space: nowrap;">
            + ${t('add')}
          </button>
        </div>
        <div class="description">
          ${t('roomPinsDescription')}
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t('entityNamePatterns')}</div>
        <div id="entity-name-patterns-list" style="margin-bottom: 12px;">
          ${renderEntityNamePatternsList(entityNamePatterns || [])}
        </div>
        <div style="display: flex; gap: 8px; align-items: flex-start;">
          <input 
            type="text" 
            id="entity-name-pattern-input" 
            placeholder="${t('patternPlaceholder')}"
            style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font-family: monospace;"
          />
          <button id="add-pattern-btn" style="flex-shrink: 0; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer; white-space: nowrap;">
            + ${t('addPattern')}
          </button>
        </div>
        <div class="description">
          ${t('entityNamePatternsDescription')}
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t('entityNameTranslations')}</div>
        <div id="entity-name-translations-list" style="margin-bottom: 12px;">
          ${renderEntityNameTranslationsList(entityNameTranslations || [])}
        </div>
        <div style="display: flex; gap: 8px; align-items: flex-start; flex-wrap: wrap;">
          <input 
            type="text" 
            id="entity-name-translation-from-input" 
            placeholder="${t('translationFromPlaceholder')}"
            style="flex: 1; min-width: 120px; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
          />
          <select 
            id="entity-name-translation-from-lang-select"
            style="min-width: 100px; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
            title="${t('translationFromLang')}"
          >
            ${getLanguageSelectorOptions('', 'translationFromLang')}
          </select>
          <span style="align-self: center; color: var(--secondary-text-color);">→</span>
          <input 
            type="text" 
            id="entity-name-translation-to-input" 
            placeholder="${t('translationToPlaceholder')}"
            style="flex: 1; min-width: 120px; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
          />
          <select 
            id="entity-name-translation-to-lang-select"
            style="min-width: 100px; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
            title="${t('translationToLang')}"
          >
            ${getLanguageSelectorOptions('', 'translationToLang')}
          </select>
          <button id="add-translation-btn" style="flex-shrink: 0; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer; white-space: nowrap;">
            + ${t('addTranslation')}
          </button>
        </div>
        <div class="description">
          ${t('entityNameTranslationsDescription')}
        </div>
      </div>
  `;

  // Group 4: Advanced Settings
  const advancedContent = `
      <div class="section">
        <div class="section-title">${t('debugSettings')}</div>
        <div class="form-row">
          <label for="log-level" style="display: block; margin-bottom: 8px;">${t('logLevel')}</label>
          <select 
            id="log-level" 
            style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
          >
            <option value="error" ${logLevel === 'error' ? 'selected' : ''}>${t('logLevelError')}</option>
            <option value="warn" ${logLevel === 'warn' ? 'selected' : ''}>${t('logLevelWarn')}</option>
            <option value="info" ${logLevel === 'info' ? 'selected' : ''}>${t('logLevelInfo')}</option>
            <option value="debug" ${logLevel === 'debug' ? 'selected' : ''}>${t('logLevelDebug')}</option>
          </select>
        </div>
        <div class="description">
          ${t('logLevelDescription')}
        </div>
      </div>
      <div class="section">
        <div class="section-title">${t('cacheReload')}</div>
        <div class="form-row">
          <button 
            id="cache-reload-btn"
            style="width: 100%; padding: 12px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color, var(--primary-text-color)); cursor: pointer; font-size: 14px; font-weight: 500; transition: background-color 0.2s, opacity 0.2s;"
          >
            ${t('cacheReload')}
          </button>
        </div>
        <div class="description">
          ${t('cacheReloadDescription')}
        </div>
      </div>
  `;

  return `
    <div class="card-config">
      ${renderNavigationBar()}
      ${renderSectionGroup('dashboard-cards', t('navGroupDashboardCards'), dashboardCardsContent, false)}
      ${renderSectionGroup('views-summaries', t('navGroupViewsSummaries'), viewsSummariesContent, false)}
      ${renderSectionGroup('entity-management', t('navGroupEntityManagement'), entityManagementContent, true)}
      ${renderSectionGroup('advanced', t('navGroupAdvanced'), advancedContent, false)}
    </div>
  `;
}

function renderFavoritesList(favoriteEntities, allEntities) {
  if (!favoriteEntities || favoriteEntities.length === 0) {
    return `<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">${t('noFavoritesAdded')}</div>`;
  }

  // Erstelle Map für schnellen Zugriff auf Entity-Namen
  const entityMap = new Map(allEntities.map(e => [e.entity_id, e.name]));

  return `
    <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
      ${favoriteEntities.map((entityId, index) => {
        const name = entityMap.get(entityId) || entityId;
        return `
          <div class="favorite-item" data-entity-id="${entityId}" style="display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); background: var(--card-background-color);">
            <span class="drag-handle" style="margin-right: 12px; cursor: grab; color: var(--secondary-text-color);">☰</span>
            <span style="flex: 1; font-size: 14px;">
              <strong>${name}</strong>
              <span style="margin-left: 8px; font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">${entityId}</span>
            </span>
            <button class="remove-favorite-btn" data-entity-id="${entityId}" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer;">
              ✕
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export function renderRoomPinsList(roomPinEntities, allEntities, allAreas) {
  if (!roomPinEntities || roomPinEntities.length === 0) {
    return `<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">${t('noRoomPinsAdded')}</div>`;
  }

  // Erstelle Maps für schnellen Zugriff
  const entityMap = new Map(allEntities.map(e => [e.entity_id, e]));
  const areaMap = new Map(allAreas.map(a => [a.area_id, a.name]));

  return `
    <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
      ${roomPinEntities.map((entityId, index) => {
        const entity = entityMap.get(entityId);
        const name = entity?.name || entityId;
        const areaId = entity?.area_id || entity?.device_area_id;
        const areaName = areaId ? areaMap.get(areaId) || areaId : t('noRoom');
        
        return `
          <div class="room-pin-item" data-entity-id="${entityId}" style="display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); background: var(--card-background-color);">
            <span class="drag-handle" style="margin-right: 12px; cursor: grab; color: var(--secondary-text-color);">☰</span>
            <span style="flex: 1; font-size: 14px;">
              <strong>${name}</strong>
              <span style="margin-left: 8px; font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">${entityId}</span>
              <br>
              <span style="font-size: 11px; color: var(--secondary-text-color);">📍 ${areaName}</span>
            </span>
            <button class="remove-room-pin-btn" data-entity-id="${entityId}" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer;">
              ✕
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderAreaItems(allAreas, hiddenAreas, areaOrder) {
  if (allAreas.length === 0) {
    return `<ha-md-list-item disabled><span slot="headline">${t('noAreasAvailable')}</span></ha-md-list-item>`;
  }

  return allAreas.map((area, index) => {
    const isHidden = hiddenAreas.includes(area.area_id);
    const orderIndex = areaOrder.indexOf(area.area_id);
    const displayOrder = orderIndex !== -1 ? orderIndex : 9999 + index;
    
    return `
      <ha-md-list-item type="button" class="draggable" data-area-id="${area.area_id}" data-order="${displayOrder}">
        <ha-icon class="icon" slot="start" icon="${area.icon || 'mdi:home'}"></ha-icon>
        <span slot="headline">${area.name}</span>
        <ha-icon-button slot="end" class="area-visibility-toggle" data-area-id="${area.area_id}" aria-label="${area.name} ${isHidden ? t('show') : t('hide')}">
          <ha-svg-icon path="${isHidden ? 'M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z' : 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z'}"></ha-svg-icon>
        </ha-icon-button>
        <ha-svg-icon class="handle" slot="end" path="M21 11H3V9H21V11M21 13H3V15H21V13Z"></ha-svg-icon>
      </ha-md-list-item>
      <div class="area-content" data-area-id="${area.area_id}" style="display: none;">
        <div class="loading-placeholder">${t('loadingEntities')}</div>
      </div>
    `;
  }).join('');
}

export function renderAreaEntitiesHTML(areaId, groupedEntities, hiddenEntities, entityOrders, hass) {
  const domainGroups = [
    { key: 'lights', label: t('lighting'), icon: 'mdi:lightbulb' },
    { key: 'climate', label: t('climate'), icon: 'mdi:thermostat' },
    { key: 'covers', label: t('blinds'), icon: 'mdi:window-shutter' },
    { key: 'covers_curtain', label: t('curtains'), icon: 'mdi:curtains' },
    { key: 'media_player', label: t('media'), icon: 'mdi:speaker' },
    { key: 'scenes', label: t('scenes'), icon: 'mdi:palette' },
    { key: 'vacuum', label: t('vacuum'), icon: 'mdi:robot-vacuum' },
    { key: 'fan', label: t('fans'), icon: 'mdi:fan' },
    { key: 'switches', label: t('switches'), icon: 'mdi:light-switch' }
  ];

  let html = '<div class="entity-groups">';

  domainGroups.forEach(group => {
    const entities = groupedEntities[group.key] || [];
    if (entities.length === 0) return;

    const hiddenInGroup = hiddenEntities[group.key] || [];
    const allHidden = entities.every(e => hiddenInGroup.includes(e));
    const someHidden = entities.some(e => hiddenInGroup.includes(e)) && !allHidden;

    html += `
      <div class="entity-group" data-group="${group.key}">
        <div class="entity-group-header">
          ${renderMDCSwitch(`group-checkbox-${areaId}-${group.key}`, !allHidden, group.label)}
          <input 
            type="checkbox" 
            class="group-checkbox mdc-switch__native-control" 
            id="group-checkbox-hidden-${areaId}-${group.key}"
            data-area-id="${areaId}"
            data-group="${group.key}"
            ${!allHidden ? 'checked' : ''}
            ${someHidden ? 'data-indeterminate="true"' : ''}
            style="display: none;"
          />
          <ha-icon icon="${group.icon}"></ha-icon>
          <span class="group-name">${group.label}</span>
          <span class="entity-count">(${entities.length})</span>
          <button class="expand-button-small" data-area-id="${areaId}" data-group="${group.key}">
            <span class="expand-icon-small">▶</span>
          </button>
        </div>
        <div class="entity-list" data-area-id="${areaId}" data-group="${group.key}">
          ${entities.map(entityId => {
            const state = hass.states[entityId];
            const name = state?.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
            const isHidden = hiddenInGroup.includes(entityId);
            
            return `
              <div class="entity-item">
                ${renderMDCSwitch(`entity-checkbox-${areaId}-${group.key}-${entityId}`, !isHidden, name)}
                <input 
                  type="checkbox" 
                  class="entity-checkbox mdc-switch__native-control" 
                  id="entity-checkbox-hidden-${areaId}-${group.key}-${entityId}"
                  data-area-id="${areaId}"
                  data-group="${group.key}"
                  data-entity-id="${entityId}"
                  ${!isHidden ? 'checked' : ''}
                  style="display: none;"
                />
                <span class="entity-name">${name}</span>
                <span class="entity-id">${entityId}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  });

  html += '</div>';

  if (html === '<div class="entity-groups"></div>') {
    return `<div class="empty-state">${t('noEntitiesInArea')}</div>`;
  }

  return html;
}