// ====================================================================
// SIMON42 EDITOR TEMPLATE
// ====================================================================
// HTML-Template für den Dashboard Strategy Editor

import { t } from '../../utils/simon42-i18n.js';

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

export function renderEntityNamePatternsList(patterns) {
  if (!patterns || patterns.length === 0) {
    return `<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">${t('noPatternsAdded')}</div>`;
  }

  return `
    <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
      ${patterns.map((pattern, index) => {
        const patternText = typeof pattern === 'string' ? pattern : pattern.pattern || '';
        const displayText = makeSpacesVisible(patternText);
        return `
          <div class="entity-name-pattern-item" data-pattern-index="${index}" style="display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); background: var(--card-background-color);">
            <span style="flex: 1; font-size: 14px; font-family: monospace; word-break: break-all; white-space: pre-wrap;" title="${patternText.replace(/"/g, '&quot;')}">
              ${displayText}
            </span>
            <button class="remove-pattern-btn" data-pattern-index="${index}" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer; margin-left: 8px; flex-shrink: 0;">
              ✕
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export function renderEditorHTML({ allAreas, hiddenAreas, areaOrder, showEnergy, showWeather, showSummaryViews, showRoomViews, showSearchCard, hasSearchCardDeps, summariesColumns, alarmEntity, alarmEntities, favoriteEntities, roomPinEntities, allEntities, groupByFloors, showCoversSummary, showBetterThermostat = false, hasBetterThermostatDeps = false, showHorizonCard = false, hasHorizonCardDeps = false, horizonCardExtended = false, showPublicTransport = false, publicTransportEntities = [], publicTransportIntegration = 'db_info', publicTransportCard = 'db-info-card', hvvMax = 10, hvvShowTime = true, hvvShowTitle = true, hvvTitle = 'HVV', entityNamePatterns = [] }) {
  return `
    <div class="card-config">
      <div class="section">
        <div class="section-title">${t('infoCards')}</div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-weather" 
            ${showWeather !== false ? 'checked' : ''}
          />
          <label for="show-weather">${t('showWeatherCard')}</label>
        </div>
        <div class="description">
          ${t('weatherCardDescription')}
        </div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-energy" 
            ${showEnergy ? 'checked' : ''}
          />
          <label for="show-energy">${t('showEnergyDashboard')}</label>
        </div>
        <div class="description">
          ${t('energyCardDescription')}
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
        <div class="section-title">${t('searchCard')}</div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-search-card" 
            ${showSearchCard ? 'checked' : ''}
            ${!hasSearchCardDeps ? 'disabled' : ''}
          />
          <label for="show-search-card" ${!hasSearchCardDeps ? 'class="disabled-label"' : ''}>
            ${t('showSearchCard')}
          </label>
        </div>
        <div class="description">
          ${hasSearchCardDeps 
            ? t('searchCardDescription')
            : `⚠️ ${t('searchCardMissingDeps')}`}
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t('betterThermostat')}</div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-better-thermostat" 
            ${showBetterThermostat ? 'checked' : ''}
            ${!hasBetterThermostatDeps ? 'disabled' : ''}
          />
          <label for="show-better-thermostat" ${!hasBetterThermostatDeps ? 'class="disabled-label"' : ''}>
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
        <div class="section-title">${t('horizonCard')}</div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-horizon-card" 
            ${showHorizonCard ? 'checked' : ''}
            ${!hasHorizonCardDeps ? 'disabled' : ''}
          />
          <label for="show-horizon-card" ${!hasHorizonCardDeps ? 'class="disabled-label"' : ''}>
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
            <input 
              type="checkbox" 
              id="horizon-card-extended" 
              ${horizonCardExtended ? 'checked' : ''}
            />
            <label for="horizon-card-extended">
              ${t('showExtendedInfo')}
            </label>
          </div>
          <div class="description">
            ${t('horizonCardExtendedDescription')}
          </div>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">${t('publicTransport')}</div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-public-transport" 
            ${showPublicTransport ? 'checked' : ''}
          />
          <label for="show-public-transport">${t('showPublicTransport')}</label>
        </div>
        <div class="description">
          ${t('publicTransportDescription')}
        </div>
        <div style="margin-top: 16px;">
          <div class="form-row">
            <label for="public-transport-integration" style="margin-right: 8px; min-width: 120px;">${t('publicTransportIntegration')}</label>
            <select 
              id="public-transport-integration" 
              style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
            >
              <option value="hvv" ${publicTransportIntegration === 'hvv' ? 'selected' : ''}>${t('publicTransportIntegrationHVV')}</option>
              <option value="ha-departures" ${publicTransportIntegration === 'ha-departures' ? 'selected' : ''}>${t('publicTransportIntegrationHADepartures')}</option>
              <option value="db_info" ${publicTransportIntegration === 'db_info' ? 'selected' : ''}>${t('publicTransportIntegrationDBInfo')}</option>
            </select>
          </div>
          <div class="form-row" style="margin-top: 12px;">
            <label for="public-transport-card" style="margin-right: 8px; min-width: 120px;">${t('publicTransportCard')}</label>
            <select 
              id="public-transport-card" 
              style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
            >
              <option value="hvv-card" ${publicTransportCard === 'hvv-card' ? 'selected' : ''}>${t('publicTransportCardHVV')}</option>
              <option value="ha-departures-card" ${publicTransportCard === 'ha-departures-card' ? 'selected' : ''}>${t('publicTransportCardHADepartures')}</option>
              <option value="db-info-card" ${publicTransportCard === 'db-info-card' ? 'selected' : ''}>${t('publicTransportCardDBInfo')}</option>
            </select>
          </div>
        </div>
        <div id="public-transport-list" style="margin-top: 12px; margin-bottom: 12px;">
          ${renderPublicTransportList(publicTransportEntities || [], allEntities || [])}
        </div>
        <div style="display: flex; gap: 8px; align-items: flex-start;">
          <select id="public-transport-entity-select" style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
            <option value="">${t('selectEntity')}</option>
            ${allEntities
              .filter(entity => {
                const entityId = entity.entity_id.toLowerCase();
                const name = (entity.name || '').toLowerCase();
                
                // Filter für relevante Domains
                if (!entityId.startsWith('sensor.') && !entityId.startsWith('button.')) {
                  return false;
                }
                
                // Filter für relevante Keywords in Entity-ID oder Name
                // Verwende Wortgrenzen für bessere Genauigkeit
                const transportKeywords = [
                  'departure', 'departures', 'abfahrt', 'abfahrten',
                  'hvv', 'public_transport', 'public-transport', 'publictransport',
                  'transport', 'verkehr', 'nahverkehr',
                  'bus', 'bahn', 'train', 'u-bahn', 'ubahn', 's-bahn', 'sbahn',
                  'haltestelle', 'stop'
                ];
                
                // Spezielle Keywords die als ganze Wörter geprüft werden müssen
                const wholeWordKeywords = ['station'];
                
                // Prüfe normale Keywords (können Teil eines Wortes sein)
                const hasTransportKeyword = transportKeywords.some(keyword => 
                  entityId.includes(keyword) || name.includes(keyword)
                );
                
                // Prüfe ganze-Wort Keywords (müssen als separates Wort vorkommen)
                const hasWholeWordKeyword = wholeWordKeywords.some(keyword => {
                  // Erstelle Regex für Wortgrenzen
                  const regex = new RegExp(`\\b${keyword}\\b`, 'i');
                  return regex.test(entityId) || regex.test(name);
                });
                
                return hasTransportKeyword || hasWholeWordKeyword;
              })
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
            <input 
              type="checkbox" 
              id="hvv-show-time" 
              ${hvvShowTime !== false ? 'checked' : ''}
            />
            <label for="hvv-show-time">${t('showTime')}</label>
          </div>
          <div class="form-row">
            <input 
              type="checkbox" 
              id="hvv-show-title" 
              ${hvvShowTitle !== false ? 'checked' : ''}
            />
            <label for="hvv-show-title">${t('showTitle')}</label>
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
      </div>

      <div class="section">
        <div class="section-title">${t('summaries')}</div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-covers-summary" 
            ${showCoversSummary !== false ? 'checked' : ''}
          />
          <label for="show-covers-summary">${t('showCoversSummary')}</label>
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

      <div class="section">
        <div class="section-title">${t('views')}</div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-summary-views" 
            ${showSummaryViews ? 'checked' : ''}
          />
          <label for="show-summary-views">${t('showSummaryViews')}</label>
        </div>
        <div class="description">
          ${t('summaryViewsDescription')}
        </div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="show-room-views" 
            ${showRoomViews ? 'checked' : ''}
          />
          <label for="show-room-views">${t('showRoomViews')}</label>
        </div>
        <div class="description">
          ${t('roomViewsDescription')}
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
        <div class="section-title">${t('areasView')}</div>
        <div class="form-row">
          <input 
            type="checkbox" 
            id="group-by-floors" 
            ${groupByFloors ? 'checked' : ''}
          />
          <label for="group-by-floors">${t('groupByFloors')}</label>
        </div>
        <div class="description">
          ${t('groupByFloorsDescription')}
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t('areas')}</div>
        <div class="description" style="margin-left: 0; margin-bottom: 12px;">
          ${t('areasDescription')}
        </div>
        <div class="area-list" id="area-list">
          ${renderAreaItems(allAreas, hiddenAreas, areaOrder)}
        </div>
      </div>
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
    return `<div class="empty-state">${t('noAreasAvailable')}</div>`;
  }

  return allAreas.map((area, index) => {
    const isHidden = hiddenAreas.includes(area.area_id);
    const orderIndex = areaOrder.indexOf(area.area_id);
    const displayOrder = orderIndex !== -1 ? orderIndex : 9999 + index;
    
    return `
      <div class="area-item" 
           data-area-id="${area.area_id}"
           data-order="${displayOrder}">
        <div class="area-header">
          <span class="drag-handle" draggable="true">☰</span>
          <input 
            type="checkbox" 
            class="area-checkbox" 
            data-area-id="${area.area_id}"
            ${!isHidden ? 'checked' : ''}
          />
          <span class="area-name">${area.name}</span>
          ${area.icon ? `<ha-icon class="area-icon" icon="${area.icon}"></ha-icon>` : ''}
          <button class="expand-button" data-area-id="${area.area_id}" ${isHidden ? 'disabled' : ''}>
            <span class="expand-icon">▶</span>
          </button>
        </div>
        <div class="area-content" data-area-id="${area.area_id}" style="display: none;">
          <div class="loading-placeholder">${t('loadingEntities')}</div>
        </div>
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
          <input 
            type="checkbox" 
            class="group-checkbox" 
            data-area-id="${areaId}"
            data-group="${group.key}"
            ${!allHidden ? 'checked' : ''}
            ${someHidden ? 'data-indeterminate="true"' : ''}
          />
          <ha-icon icon="${group.icon}"></ha-icon>
          <span class="group-name">${group.label}</span>
          <span class="entity-count">(${entities.length})</span>
          <button class="expand-button-small" data-area-id="${areaId}" data-group="${group.key}">
            <span class="expand-icon-small">▶</span>
          </button>
        </div>
        <div class="entity-list" data-area-id="${areaId}" data-group="${group.key}" style="display: none;">
          ${entities.map(entityId => {
            const state = hass.states[entityId];
            const name = state?.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
            const isHidden = hiddenInGroup.includes(entityId);
            
            return `
              <div class="entity-item">
                <input 
                  type="checkbox" 
                  class="entity-checkbox" 
                  data-area-id="${areaId}"
                  data-group="${group.key}"
                  data-entity-id="${entityId}"
                  ${!isHidden ? 'checked' : ''}
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