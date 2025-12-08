// ====================================================================
// EDITOR ENTITY LISTS
// ====================================================================
// Renders various entity lists (favorites, room pins, patterns, translations, etc.)
// ====================================================================

import { t } from '../../../utils/i18n/simon42-i18n.js';

/**
 * Centralized function to render entity lists with consistent styling
 * @param {Array<string>} entityIds - Array of entity IDs to display
 * @param {Array} allEntities - All available entities (for name lookup)
 * @param {Object} options - Configuration options
 * @param {string} options.emptyStateText - Text to show when list is empty (default: t('noEntitiesAdded'))
 * @param {string} options.itemClass - Additional CSS class for list items (e.g., 'calendar-item', 'favorite-item')
 * @param {boolean} options.showDragHandle - Whether to show drag handle (default: true)
 * @param {Function} options.getMetadata - Optional function to get metadata for each entity (entityId, entity, hass) => string
 * @param {Object} options.hass - Home Assistant object (for state/attribute access)
 * @param {Object} options.allAreas - All areas (for room pins metadata)
 * @returns {string} HTML string for the entity list
 */
export function renderEntityList(entityIds, allEntities, options = {}) {
  const {
    emptyStateText = t('noEntitiesAdded'),
    itemClass = '',
    showDragHandle = true,
    getMetadata = null,
    hass = null,
    allAreas = null
  } = options;

  if (!entityIds || entityIds.length === 0) {
    return `<div class="empty-state">${emptyStateText}</div>`;
  }

  // Create entity map for name lookup
  const entityMap = new Map(allEntities.map(e => [e.entity_id, e]));

  return `
    <div class="entity-list-container">
      ${entityIds.map((entityId) => {
        const entity = entityMap.get(entityId);
        const name = entity?.name || entityId;
        
        // Get metadata if provided
        let metadataHtml = '';
        if (getMetadata) {
          const metadata = getMetadata(entityId, entity, hass, allAreas);
          if (metadata) {
            metadataHtml = `<span class="entity-list-meta">${metadata}</span>`;
          }
        }
        
        // Build drag handle HTML
        const dragHandleHtml = showDragHandle 
          ? '<span class="entity-list-drag-handle">☰</span>'
          : '';
        
        // Build item class string
        const itemClassStr = itemClass ? ` ${itemClass}` : '';
        
        return `
          <div class="entity-list-item${itemClassStr}" data-entity-id="${entityId}">
            ${dragHandleHtml}
            <span class="entity-list-content">
              <span class="entity-list-name">${name}</span>
              <span class="entity-list-id">${entityId}</span>
              ${metadataHtml}
            </span>
            <button class="entity-list-remove-btn" data-entity-id="${entityId}">
              ✕
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export function renderPublicTransportList(publicTransportEntities, allEntities) {
  return renderEntityList(publicTransportEntities, allEntities, {
    itemClass: 'public-transport-item'
  });
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

export function getDomainSelectorOptions(selectedDomain = '', excludeEmpty = false) {
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
    return `<div class="empty-state">${t('noDomainsAdded')}</div>`;
  }

  return `
    <div class="entity-list-container">
      ${domains.map((domain) => {
        const label = getDomainLabel(domain);
        return `
          <div class="entity-list-item search-card-domain-item" data-domain="${domain}">
            <span class="entity-list-content">
              <span class="entity-list-name">${label}</span>
              <span class="entity-list-id">${domain}</span>
            </span>
            <button class="entity-list-remove-btn remove-domain-btn" data-domain="${domain}">
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
    return `<div class="empty-state">${t('noPatternsAdded')}</div>`;
  }

  return `
    <div class="entity-list-container">
      ${patterns.map((pattern, index) => {
        const patternText = typeof pattern === 'string' ? pattern : pattern.pattern || '';
        const displayText = makeSpacesVisible(patternText);
        const currentDomain = typeof pattern === 'object' ? pattern.domain : '';
        return `
          <div class="entity-list-item entity-name-pattern-item" data-pattern-index="${index}">
            <span class="entity-list-pattern-text" title="${patternText.replace(/"/g, '&quot;')}">${displayText}</span>
            <select 
              class="entity-list-select pattern-domain-select" 
              data-pattern-index="${index}"
            >
              ${getDomainSelectorOptions(currentDomain)}
            </select>
            <button class="entity-list-remove-btn remove-pattern-btn" data-pattern-index="${index}">
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
    return `<ha-md-list-item disabled><span slot="headline">${t('noTranslationsAdded')}</span></ha-md-list-item>`;
  }

  return `
    <ha-md-list>
      ${translations.map((translation, index) => {
        const fromText = translation.from || '';
        const toText = translation.to || '';
        const fromLang = translation.from_lang || '';
        const toLang = translation.to_lang || '';
        return `
          <ha-md-list-item data-translation-index="${index}" class="entity-name-translation-item">
            <ha-icon slot="start" icon="mdi:translate"></ha-icon>
            <span slot="headline">"${fromText.replace(/"/g, '&quot;')}" → "${toText.replace(/"/g, '&quot;')}"</span>
            <div slot="supporting-text" class="translation-lang-selectors">
              <select 
                class="translation-from-lang-select native-select" 
                data-translation-index="${index}"
                title="${t('translationFromLang')}"
              >
                ${getLanguageSelectorOptions(fromLang, 'translationFromLang')}
              </select>
              <span class="translation-arrow">→</span>
              <select 
                class="translation-to-lang-select native-select" 
                data-translation-index="${index}"
                title="${t('translationToLang')}"
              >
                ${getLanguageSelectorOptions(toLang, 'translationToLang')}
              </select>
            </div>
            <ha-icon-button slot="end" class="remove-translation-btn" data-translation-index="${index}" aria-label="${t('remove')}">
              <ha-icon icon="mdi:close"></ha-icon>
            </ha-icon-button>
          </ha-md-list-item>
        `;
      }).join('')}
    </ha-md-list>
  `;
}

export function renderFavoritesList(favoriteEntities, allEntities) {
  return renderEntityList(favoriteEntities, allEntities, {
    emptyStateText: t('noFavoritesAdded'),
    itemClass: 'favorite-item'
  });
}

export function renderRoomPinsList(roomPinEntities, allEntities, allAreas) {
  const areaMap = new Map(allAreas.map(a => [a.area_id, a.name]));
  
  return renderEntityList(roomPinEntities, allEntities, {
    emptyStateText: t('noRoomPinsAdded'),
    itemClass: 'room-pin-item',
    getMetadata: (entityId, entity, hass, allAreas) => {
      const areaId = entity?.area_id || entity?.device_area_id;
      const areaName = areaId ? areaMap.get(areaId) || areaId : t('noRoom');
      return `📍 ${areaName}`;
    },
    allAreas
  });
}

