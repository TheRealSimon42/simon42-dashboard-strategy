// ====================================================================
// SIMON42 EDITOR TEMPLATE
// ====================================================================
// HTML-Template für den Dashboard Strategy Editor
// Main orchestrator that imports from focused modules

import { t } from '../../utils/i18n/simon42-i18n.js';
import { renderMDCSwitch } from './template/simon42-editor-form-renderers.js';
import { filterEntitiesByIntegration } from './template/simon42-editor-integration-filters.js';
import {
  buildDependencyMissingMessage,
  buildBetterThermostatMissingMessage,
  buildPublicTransportMissingMessage
} from '../../utils/system/simon42-dependency-checker.js';
import {
  renderEntityList,
  renderPublicTransportList,
  renderSearchCardDomainsList,
  renderEntityNamePatternsList,
  renderEntityNameTranslationsList,
  renderFavoritesList,
  renderRoomPinsList,
  getDomainSelectorOptions,
  getLanguageSelectorOptions
} from './template/simon42-editor-entity-lists.js';
import {
  renderNavigationBar,
  renderSectionGroup
} from './template/simon42-editor-section-groups.js';
import {
  renderAreaItems,
  renderAreaEntitiesHTML
} from './template/simon42-editor-area-renderers.js';

// Re-export functions used by other modules
export { 
  renderEntityList, 
  renderAreaEntitiesHTML, 
  renderRoomPinsList, 
  renderSearchCardDomainsList, 
  renderEntityNamePatternsList, 
  renderEntityNameTranslationsList,
  renderFavoritesList,
  renderPublicTransportList
};

// filterEntitiesByIntegration is now imported from template/simon42-editor-integration-filters.js

// Removed: filterEntitiesByIntegration function (moved to template/simon42-editor-integration-filters.js)

// Dependency URL functions consolidated in utils/system/simon42-dependency-checker.js

// Entity list rendering functions moved to template/simon42-editor-entity-lists.js

// Navigation bar and section group functions moved to template/simon42-editor-section-groups.js

export function renderEditorHTML({
  allAreas,
  hiddenAreas,
  areaOrder,
  showEnergy,
  showWeather,
  showPersonBadges = true,
  showRoomViews,
  showSearchCard,
  showClockCard = false,
  hasSearchCardDeps,
  searchCardIncludedDomains = [],
  searchCardExcludedDomains = [],
  summariesColumns,
  alarmEntity,
  alarmEntities,
  isSelectedAlarmEntityAlarmo = false,
  hasAlarmoCardDeps = false,
  useAlarmoCard = false,
  showSchedulerCard = false,
  hasSchedulerCardDeps = false,
  schedulerEntities = [],
  showCalendarCard = false,
  hasCalendarCardDeps = false,
  hasCalendarCardProDeps = false,
  useCalendarCardPro = false,
  calendarEntities = [],
  showTodoSwipeCard = false,
  hasTodoSwipeCardDeps = false,
  todoEntities = [],
  favoriteEntities,
  roomPinEntities,
  allEntities,
  groupByFloors,
  showSummaries = true,
  showCoversSummary,
  showSecuritySummary = true,
  showLightSummary = true,
  showBatterySummary = true,
  showBetterThermostat = false,
  hasBetterThermostatDeps = false,
  showHorizonCard = false,
  hasHorizonCardDeps = false,
  horizonCardExtended = false,
  useClockWeatherCard = false,
  hasClockWeatherCardDeps = false,
  showPublicTransport = false,
  publicTransportEntities = [],
  publicTransportIntegration = '',
  publicTransportCard = '',
  hasPublicTransportDeps = false,
  hvvMax = 10,
  hvvShowTime = false,
  hvvShowTitle = false,
  hvvTitle = 'HVV',
  haDeparturesMax = 3,
  haDeparturesShowCardHeader = true,
  haDeparturesShowAnimation = true,
  haDeparturesShowTransportIcon = false,
  haDeparturesHideEmptyDepartures = false,
  haDeparturesTimeStyle = 'dynamic',
  haDeparturesIcon = 'mdi:bus-multiple',
  entityNamePatterns = [],
  entityNameTranslations = [],
  logLevel = 'warn',
  version = '1.0.0',
  hass = null
}) {
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
        ${showWeather !== false ? `
        <div class="sub-option">
          <div class="form-row">
            ${renderMDCSwitch('use-clock-weather-card', useClockWeatherCard, t('useClockWeatherCard'), !hasClockWeatherCardDeps)}
            <label for="use-clock-weather-card" style="margin-left: 12px; cursor: pointer;" ${!hasClockWeatherCardDeps ? 'class="disabled-label"' : ''}>
              ${t('useClockWeatherCard')}
            </label>
          </div>
          <div class="description">
            ${hasClockWeatherCardDeps 
              ? t('clockWeatherCardDescription')
              : buildDependencyMissingMessage('clock-weather-card', 'clockWeatherCardMissingDeps', 'clockWeatherCardLink')}
          </div>
          <div class="form-row">
            ${renderMDCSwitch('show-horizon-card', showHorizonCard, t('showHorizonCard'), !hasHorizonCardDeps)}
            <label for="show-horizon-card" style="margin-left: 12px; cursor: pointer;" ${!hasHorizonCardDeps ? 'class="disabled-label"' : ''}>
              ${t('showHorizonCard')}
            </label>
          </div>
          <div class="description">
            ${hasHorizonCardDeps 
              ? t('horizonCardDescription')
              : buildDependencyMissingMessage('horizon-card', 'horizonCardMissingDeps', 'horizonCardLink')}
          </div>
          ${hasHorizonCardDeps && showHorizonCard ? `
          <div class="sub-option">
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
          ` : ''}
        </div>
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
            : buildDependencyMissingMessage('search-card', 'searchCardMissingDeps', 'searchCardLink')}
        </div>
        ${showSearchCard === true && hasSearchCardDeps ? `
        <div class="sub-option">
          <div class="section-title" style="font-size: 13px; margin-bottom: 8px;">${t('searchCardIncludedDomains')}</div>
          <div id="search-card-included-domains-list" style="margin-bottom: 12px;">
            ${renderSearchCardDomainsList(searchCardIncludedDomains || [])}
          </div>
          <div style="display: flex; gap: 8px; align-items: flex-start;">
            <select id="search-card-included-domain-select" style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
              <option value="">${t('selectDomain')}</option>
              ${getDomainSelectorOptions('', true)}
            </select>
            <button id="add-included-domain-btn" class="add-btn">
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
            <button id="add-excluded-domain-btn" class="add-btn">
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
            : buildBetterThermostatMissingMessage()}
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t('alarmControlPanel')}</div>
        <div class="description">
          ${t('alarmEntityDescription')}
        </div>
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
        ${isSelectedAlarmEntityAlarmo ? `
        <div class="sub-option">
          <div class="form-row">
            ${renderMDCSwitch('use-alarmo-card', useAlarmoCard, t('useAlarmoCard'), !hasAlarmoCardDeps)}
            <label for="use-alarmo-card" style="margin-left: 12px; cursor: pointer;" ${!hasAlarmoCardDeps ? 'class="disabled-label"' : ''}>${t('useAlarmoCard')}</label>
          </div>
          <div class="description">
            ${hasAlarmoCardDeps 
              ? t('useAlarmoCardDescription')
              : buildDependencyMissingMessage('alarmo-card')}
          </div>
        </div>
        ` : ''}
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
        <div class="sub-option">
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
            ${buildPublicTransportMissingMessage(publicTransportIntegration)}
          </div>
          ` : ''}
          ${publicTransportIntegration && hasPublicTransportDeps ? `
          <div class="description" style="margin-top: 12px; margin-bottom: 12px;">
            ${t('publicTransportEntitiesDescription')}
          </div>
          <div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 16px;">
            <select id="public-transport-entity-select" style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
              <option value="">${t('selectEntity')}</option>
              ${filterEntitiesByIntegration(allEntities || [], publicTransportIntegration, hass)
                .map(entity => `
                  <option value="${entity.entity_id}">${entity.name}</option>
                `).join('')}
            </select>
            <button id="add-public-transport-btn" class="add-btn">
              + ${t('add')}
            </button>
          </div>
          <ha-expansion-panel outlined>
            <ha-icon slot="leading-icon" icon="mdi:bus"></ha-icon>
            <span slot="header">${t('publicTransportEntitiesList')}</span>
            <div style="padding: 16px;">
              <div id="public-transport-list">
                ${renderPublicTransportList(publicTransportEntities || [], allEntities || [])}
              </div>
            </div>
          </ha-expansion-panel>
          ` : ''}
          ${publicTransportIntegration === 'hvv' && hasPublicTransportDeps ? `
          <div class="sub-option">
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
          </div>
          ` : ''}
          ${publicTransportIntegration === 'ha-departures' && hasPublicTransportDeps ? `
          <div class="sub-option">
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

      <div class="section">
        <div class="section-title">${t('scheduler')}</div>
        <div class="form-row">
          ${renderMDCSwitch('show-scheduler-card', showSchedulerCard, t('showSchedulerCard'), !hasSchedulerCardDeps)}
          <label for="show-scheduler-card" style="margin-left: 12px; cursor: pointer;" ${!hasSchedulerCardDeps ? 'class="disabled-label"' : ''}>${t('showSchedulerCard')}</label>
        </div>
        <div class="description">
          ${hasSchedulerCardDeps 
            ? t('schedulerCardDescription')
            : buildDependencyMissingMessage('scheduler-card')}
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t('calendar')}</div>
        <div class="form-row">
          ${renderMDCSwitch('show-calendar-card', showCalendarCard, t('showCalendarCard'))}
          <label for="show-calendar-card" style="margin-left: 12px; cursor: pointer;">${t('showCalendarCard')}</label>
        </div>
        <div class="description">
          ${t('calendarCardDescription')}
        </div>
        ${showCalendarCard ? `
        <div class="sub-option">
          <div class="form-row" style="margin-bottom: 12px;">
            ${renderMDCSwitch('use-calendar-card-pro', useCalendarCardPro, t('useCalendarCardPro'), !hasCalendarCardProDeps)}
            <label for="use-calendar-card-pro" style="margin-left: 12px; cursor: pointer;" ${!hasCalendarCardProDeps ? 'class="disabled-label"' : ''}>${t('useCalendarCardPro')}</label>
          </div>
          <div class="description" style="margin-bottom: 12px;">
            ${hasCalendarCardProDeps 
              ? t('useCalendarCardProDescription')
              : `${t('calendarCardProLink')}: <a href="https://github.com/alexpfau/calendar-card-pro" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">https://github.com/alexpfau/calendar-card-pro</a><br><br>${t('calendarCardProOptional')}`}
          </div>
          <div class="description" style="margin-top: 12px; margin-bottom: 12px;">
            ${t('calendarEntitiesDescription')}
          </div>
          <div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 16px;">
            <select id="calendar-entity-select" style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
              <option value="">${t('selectEntity')}</option>
              ${Object.keys(hass?.states || {})
                .filter(entityId => entityId.startsWith('calendar.'))
                .map(entityId => {
                  const state = hass.states[entityId];
                  const name = state?.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
                  return `<option value="${entityId}">${name}</option>`;
                }).join('')}
            </select>
            <button id="add-calendar-btn" class="add-btn">
              + ${t('add')}
            </button>
          </div>
          <ha-expansion-panel outlined>
            <ha-icon slot="leading-icon" icon="mdi:calendar"></ha-icon>
            <span slot="header">${t('calendarEntitiesList')}</span>
            <div style="padding: 16px;">
              <div id="calendar-list">
                ${renderEntityList(calendarEntities, allEntities, {
                  itemClass: 'calendar-item',
                  hass
                })}
              </div>
            </div>
          </ha-expansion-panel>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">${t('todo')}</div>
        <div class="form-row">
          ${renderMDCSwitch('show-todo-swipe-card', showTodoSwipeCard, t('showTodoSwipeCard'), !hasTodoSwipeCardDeps)}
          <label for="show-todo-swipe-card" style="margin-left: 12px; cursor: pointer;" ${!hasTodoSwipeCardDeps ? 'class="disabled-label"' : ''}>
            ${t('showTodoSwipeCard')}
          </label>
        </div>
        <div class="description">
          ${hasTodoSwipeCardDeps 
            ? t('todoSwipeCardDescription')
            : buildDependencyMissingMessage('todo-swipe-card', 'todoSwipeCardMissingDeps', 'todoSwipeCardLink')}
        </div>
        ${showTodoSwipeCard ? `
        <div class="sub-option">
          ${!hasTodoSwipeCardDeps ? `
          <div class="description" style="margin-top: 8px;">
            ⚠️ ${t('todoSwipeCardMissingDeps')}<br><br>
            ${t('todoSwipeCardLink')}: <a href="https://github.com/nutteloost/todo-swipe-card" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">https://github.com/nutteloost/todo-swipe-card</a>
          </div>
          ` : ''}
          ${hasTodoSwipeCardDeps ? `
          <div class="description" style="margin-top: 12px; margin-bottom: 12px;">
            ${t('todoEntitiesDescription')}
          </div>
          <div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 16px;">
            <select id="todo-entity-select" style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
              <option value="">${t('selectEntity')}</option>
              ${Object.keys(hass?.states || {})
                .filter(entityId => entityId.startsWith('todo.'))
                .map(entityId => {
                  const state = hass.states[entityId];
                  const name = state?.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
                  return `<option value="${entityId}">${name}</option>`;
                }).join('')}
            </select>
            <button id="add-todo-btn" class="add-btn">
              + ${t('add')}
            </button>
          </div>
          <ha-expansion-panel outlined>
            <ha-icon slot="leading-icon" icon="mdi:format-list-checks"></ha-icon>
            <span slot="header">${t('todoEntitiesList')}</span>
            <div style="padding: 16px;">
              <div id="todo-list">
                ${renderEntityList(todoEntities, allEntities, {
                  itemClass: 'todo-item',
                  hass
                })}
              </div>
            </div>
          </ha-expansion-panel>
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
        <ha-expansion-panel outlined>
          <ha-icon slot="leading-icon" icon="mdi:view-grid"></ha-icon>
          <span slot="header">${t('arrangeAreas')}</span>
          <ha-items-display-editor>
            <ha-sortable draggable-selector="ha-md-list-item.draggable" handle-selector=".handle">
              <ha-md-list>
                ${renderAreaItems(allAreas, hiddenAreas, areaOrder, hass)}
              </ha-md-list>
            </ha-sortable>
          </ha-items-display-editor>
        </ha-expansion-panel>
      </div>

      <div class="section">
        <div class="section-title">${t('views')}</div>
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
          ${renderMDCSwitch('show-summaries', showSummaries !== false, t('showSummaries'))}
          <label for="show-summaries" style="margin-left: 12px; cursor: pointer;">${t('showSummaries')}</label>
        </div>
        <div class="description">
          ${t('summariesDescription')}
        </div>
        ${showSummaries !== false ? `
        <div class="sub-option">
          <div class="form-row">
            ${renderMDCSwitch('show-covers-summary', showCoversSummary !== false, t('showCoversSummary'))}
            <label for="show-covers-summary" style="margin-left: 12px; cursor: pointer;">${t('showCoversSummary')}</label>
          </div>
          <div class="description">
            ${t('coversSummaryDescription')}
          </div>
          <div class="form-row">
            ${renderMDCSwitch('show-light-summary', showLightSummary !== false, t('showLightSummary'))}
            <label for="show-light-summary" style="margin-left: 12px; cursor: pointer;">${t('showLightSummary')}</label>
          </div>
          <div class="description">
            ${t('lightSummaryDescription')}
          </div>
          <div class="form-row">
            ${renderMDCSwitch('show-security-summary', showSecuritySummary !== false, t('showSecuritySummary'))}
            <label for="show-security-summary" style="margin-left: 12px; cursor: pointer;">${t('showSecuritySummary')}</label>
          </div>
          <div class="description">
            ${t('securitySummaryDescription')}
          </div>
          <div class="form-row">
            ${renderMDCSwitch('show-battery-summary', showBatterySummary !== false, t('showBatterySummary'))}
            <label for="show-battery-summary" style="margin-left: 12px; cursor: pointer;">${t('showBatterySummary')}</label>
          </div>
          <div class="description">
            ${t('batterySummaryDescription')}
          </div>
        </div>
        ` : ''}
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
        <div class="description" style="margin-left: 0; margin-bottom: 12px;">
          ${t('favoritesDescription')}
        </div>
        <div class="description" style="margin-left: 0; margin-bottom: 12px;">
          ${t('favoritesDomainFilterDescription')}
        </div>
        <div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 8px;">
          <select id="favorite-domain-filter" style="flex: 0 0 auto; min-width: 150px; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
            ${getDomainSelectorOptions('', false)}
          </select>
          <select id="favorite-entity-select" style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
            <option value="">${t('selectEntity')}</option>
            ${allEntities.map(entity => `
              <option value="${entity.entity_id}">${entity.name}</option>
            `).join('')}
          </select>
          <button id="add-favorite-btn" class="add-btn">
            + ${t('add')}
          </button>
        </div>
        <ha-expansion-panel outlined>
          <ha-icon slot="leading-icon" icon="mdi:star"></ha-icon>
          <span slot="header">${t('favoritesList')}</span>
          <div style="padding: 16px;">
            <div id="favorites-list">
              ${renderFavoritesList(favoriteEntities, allEntities)}
            </div>
          </div>
        </ha-expansion-panel>
      </div>

      <div class="section">
        <div class="section-title">${t('roomPins')}</div>
        <div class="description" style="margin-left: 0; margin-bottom: 12px;">
          ${t('roomPinsDescription')}
        </div>
        <div class="description" style="margin-left: 0; margin-bottom: 12px;">
          ${t('roomPinsAreaFilterDescription')}
        </div>
        <div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 8px;">
          <select id="room-pin-area-filter" style="flex: 0 0 auto; min-width: 150px; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
            <option value="">${t('selectRoom')}</option>
            ${allAreas.map(area => `
              <option value="${area.area_id}">${area.name}</option>
            `).join('')}
          </select>
          <select id="room-pin-entity-select" style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
            <option value="">${t('selectEntity')}</option>
            ${allEntities
              .filter(entity => entity.area_id || entity.device_area_id)
              .map(entity => `
                <option value="${entity.entity_id}">${entity.name}</option>
              `).join('')}
          </select>
          <button id="add-room-pin-btn" class="add-btn">
            + ${t('add')}
          </button>
        </div>
        <ha-expansion-panel outlined>
          <ha-icon slot="leading-icon" icon="mdi:map-marker"></ha-icon>
          <span slot="header">${t('roomPinsList')}</span>
          <div style="padding: 16px;">
            <div id="room-pins-list">
              ${renderRoomPinsList(roomPinEntities, allEntities, allAreas)}
            </div>
          </div>
        </ha-expansion-panel>
      </div>

      <div class="section">
        <div class="section-title">${t('entityNamePatterns')}</div>
        <div class="description" style="margin-left: 0; margin-bottom: 12px;">
          ${t('entityNamePatternsDescription')}
        </div>
        <div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 16px;">
          <input 
            type="text" 
            id="entity-name-pattern-input" 
            placeholder="${t('patternPlaceholder')}"
            style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font-family: monospace;"
          />
          <button id="add-pattern-btn" class="add-btn">
            + ${t('add')}
          </button>
        </div>
        <ha-expansion-panel outlined>
          <ha-icon slot="leading-icon" icon="mdi:code-tags"></ha-icon>
          <span slot="header">${t('patternList')}</span>
          <div style="padding: 16px;">
            <div id="entity-name-patterns-list">
              ${renderEntityNamePatternsList(entityNamePatterns || [])}
            </div>
          </div>
        </ha-expansion-panel>
      </div>

      <div class="section">
        <div class="section-title">${t('entityNameTranslations')}</div>
        <div class="description" style="margin-left: 0; margin-bottom: 12px;">
          ${t('entityNameTranslationsDescription')}
        </div>
        <div class="translation-add-form" style="margin-bottom: 16px;">
          <input 
            type="text" 
            id="entity-name-translation-from-input" 
            placeholder="${t('translationFromPlaceholder')}"
            class="native-input translation-input"
          />
          <select 
            id="entity-name-translation-from-lang-select"
            class="native-select translation-lang-select"
            title="${t('translationFromLang')}"
          >
            ${getLanguageSelectorOptions('', 'translationFromLang')}
          </select>
          <span class="translation-arrow">→</span>
          <input 
            type="text" 
            id="entity-name-translation-to-input" 
            placeholder="${t('translationToPlaceholder')}"
            class="native-input translation-input"
          />
          <select 
            id="entity-name-translation-to-lang-select"
            class="native-select translation-lang-select"
            title="${t('translationToLang')}"
          >
            ${getLanguageSelectorOptions('', 'translationToLang')}
          </select>
          <button id="add-translation-btn" class="add-btn">
            + ${t('add')}
          </button>
        </div>
        <ha-expansion-panel outlined>
          <ha-icon slot="leading-icon" icon="mdi:translate"></ha-icon>
          <span slot="header">${t('translationList')}</span>
          <div style="padding: 16px;">
            <div id="entity-name-translations-list">
              ${renderEntityNameTranslationsList(entityNameTranslations || [])}
            </div>
          </div>
        </ha-expansion-panel>
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
      <div class="section">
        <div class="section-title">${t('versionInfo')}</div>
        <div class="description">
          ${t('versionDescription')}
        </div>
        <div style="padding: 8px 0; color: var(--primary-text-color); font-family: monospace; font-size: 14px;">
          ${version}
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

// Area rendering functions moved to template/simon42-editor-area-renderers.js
// Entity list functions (renderFavoritesList, renderRoomPinsList) moved to template/simon42-editor-entity-lists.js