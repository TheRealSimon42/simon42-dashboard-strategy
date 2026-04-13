// ====================================================================
// SIMON42 EDITOR TEMPLATE
// ====================================================================
// HTML-Template für den Dashboard Strategy Editor

import type { CustomView, CustomCard, CustomBadge, RoomEntities } from '../types/strategy';
import type { AreaRegistryEntry } from '../types/registries';
import { localize } from '../utils/localize';
import { resolveShowName } from '../utils/badge-utils';

// -- Editor-specific entity shape (enriched for editor UI) ------------

interface EditorEntity {
  entity_id: string;
  name: string;
  area_id?: string | null;
  device_area_id?: string | null;
}

interface AlarmEntity {
  entity_id: string;
  name: string;
}

// -- Main render params -----------------------------------------------

export interface EditorHTMLParams {
  allAreas: AreaRegistryEntry[];
  hiddenAreas: string[];
  areaOrder: string[];
  showEnergy: boolean;
  showWeather: boolean;
  showSummaryViews: boolean;
  showRoomViews: boolean;
  showSearchCard: boolean;
  hasSearchCardDeps: boolean;
  summariesColumns: 2 | 4;
  alarmEntity: string;
  alarmEntities: AlarmEntity[];
  favoriteEntities: string[];
  roomPinEntities: string[];
  allEntities: EditorEntity[];
  groupByFloors: boolean;
  showClockCard: boolean;
  showLightSummary: boolean;
  groupLightsByFloors: boolean;
  nestedLightGroups: boolean;
  favoritesShowState: boolean;
  favoritesHideLastChanged: boolean;
  showCoversSummary: boolean;
  showPartiallyOpenCovers: boolean;
  showSecuritySummary: boolean;
  showBatterySummary: boolean;
  showClimateSummary: boolean;
  hideMobileAppBatteries: boolean;
  batteryCriticalThreshold: number;
  batteryLowThreshold: number;
  roomPinsShowState: boolean;
  roomPinsHideLastChanged: boolean;
  showSwitchesOnAreas: boolean;
  showAlertsOnAreas: boolean;
  showLocksInRooms: boolean;
  showAutomationsInRooms: boolean;
  showScriptsInRooms: boolean;
  useDefaultAreaSort: boolean;
  customViews: CustomView[];
  customCards: CustomCard[];
  customCardsHeading: string;
  customCardsIcon: string;
  customBadges: CustomBadge[];
}

// -- Hass-like subset needed by renderAreaEntitiesHTML -----------------

interface HassStatesSubset {
  states: Record<string, { attributes: { friendly_name?: string; [key: string]: any } } | undefined>;
}

// ====================================================================
// PUBLIC API
// ====================================================================

export function renderEditorHTML({
  allAreas,
  hiddenAreas,
  areaOrder,
  showEnergy,
  showWeather,
  showSummaryViews,
  showRoomViews,
  showSearchCard,
  hasSearchCardDeps,
  summariesColumns,
  alarmEntity,
  alarmEntities,
  favoriteEntities,
  roomPinEntities,
  allEntities,
  groupByFloors,
  showClockCard,
  showLightSummary,
  groupLightsByFloors,
  nestedLightGroups,
  favoritesShowState,
  favoritesHideLastChanged,
  showCoversSummary,
  showPartiallyOpenCovers,
  showSecuritySummary,
  showBatterySummary,
  showClimateSummary,
  hideMobileAppBatteries,
  batteryCriticalThreshold,
  batteryLowThreshold,
  roomPinsShowState,
  roomPinsHideLastChanged,
  showSwitchesOnAreas,
  showAlertsOnAreas,
  showLocksInRooms,
  showAutomationsInRooms,
  showScriptsInRooms,
  useDefaultAreaSort,
  customViews,
  customCards,
  customCardsHeading,
  customCardsIcon,
  customBadges,
}: EditorHTMLParams): string {
  return `
    <div class="card-config">

      <div class="section">
        <div class="section-title">${localize('editor.section_overview')}</div>
        <div class="form-row">
          <input
            type="checkbox"
            id="show-clock-card"
            ${showClockCard !== false ? 'checked' : ''}
          />
          <label for="show-clock-card">${localize('editor.show_clock_card')}</label>
        </div>
        <div class="description">
          ${localize('editor.show_clock_card_desc')}
        </div>
        <div class="form-row">
          <label for="alarm-entity" style="margin-right: 8px; min-width: 120px;">${localize('editor.alarm_entity')}</label>
          <select id="alarm-entity" style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
            <option value="">${localize('editor.alarm_none')}</option>
            ${alarmEntities
              .map(
                (entity) => `
              <option value="${entity.entity_id}" ${entity.entity_id === alarmEntity ? 'selected' : ''}>
                ${entity.name}
              </option>
            `
              )
              .join('')}
          </select>
        </div>
        <div class="description">
          ${localize('editor.alarm_desc')}
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="show-search-card"
            ${showSearchCard ? 'checked' : ''}
            ${!hasSearchCardDeps ? 'disabled' : ''}
          />
          <label for="show-search-card" ${!hasSearchCardDeps ? 'class="disabled-label"' : ''}>
            ${localize('editor.show_search_card')}
          </label>
        </div>
        <div class="description">
          ${
            hasSearchCardDeps
              ? localize('editor.show_search_card_desc')
              : '⚠️ ' + localize('editor.show_search_card_missing')
          }
        </div>
      </div>

      <div class="section">
        <div class="section-title">${localize('editor.section_summaries')}</div>
        <div class="form-row">
          <input
            type="radio"
            id="summaries-2-columns"
            name="summaries-columns"
            value="2"
            ${summariesColumns === 2 ? 'checked' : ''}
          />
          <label for="summaries-2-columns">${localize('editor.columns_2')}</label>
        </div>
        <div class="form-row">
          <input
            type="radio"
            id="summaries-4-columns"
            name="summaries-columns"
            value="4"
            ${summariesColumns === 4 ? 'checked' : ''}
          />
          <label for="summaries-4-columns">${localize('editor.columns_4')}</label>
        </div>
        <div class="description">
          ${localize('editor.columns_desc')}
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="show-light-summary"
            ${showLightSummary !== false ? 'checked' : ''}
          />
          <label for="show-light-summary">${localize('editor.show_light_summary')}</label>
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="group-lights-by-floors"
            ${groupLightsByFloors ? 'checked' : ''}
          />
          <label for="group-lights-by-floors">${localize('editor.group_lights_by_floors')}</label>
        </div>
        <div class="description">
          ${localize('editor.group_lights_by_floors_desc')}
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="nested-light-groups"
            ${nestedLightGroups ? 'checked' : ''}
          />
          <label for="nested-light-groups">${localize('editor.nested_light_groups')}</label>
        </div>
        <div class="description">
          ${localize('editor.nested_light_groups_desc')}
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="show-covers-summary"
            ${showCoversSummary !== false ? 'checked' : ''}
          />
          <label for="show-covers-summary">${localize('editor.show_covers_summary')}</label>
        </div>
        <div style="margin-left: 26px; margin-bottom: 8px;">
          <div class="form-row">
            <input
              type="checkbox"
              id="show-partially-open-covers"
              ${showPartiallyOpenCovers ? 'checked' : ''}
            />
            <label for="show-partially-open-covers">${localize('editor.show_partially_open_covers')}</label>
          </div>
          <div class="description">
            ${localize('editor.show_partially_open_covers_desc')}
          </div>
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="show-security-summary"
            ${showSecuritySummary !== false ? 'checked' : ''}
          />
          <label for="show-security-summary">${localize('editor.show_security_summary')}</label>
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="show-climate-summary"
            ${showClimateSummary ? 'checked' : ''}
          />
          <label for="show-climate-summary">${localize('editor.show_climate_summary')}</label>
        </div>
        <div class="description">
          ${localize('editor.show_climate_summary_desc')}
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="show-battery-summary"
            ${showBatterySummary !== false ? 'checked' : ''}
          />
          <label for="show-battery-summary">${localize('editor.show_battery_summary')}</label>
        </div>
        <div style="margin-left: 26px; margin-bottom: 8px;">
          <div class="form-row">
            <input
              type="checkbox"
              id="hide-mobile-app-batteries"
              ${hideMobileAppBatteries ? 'checked' : ''}
            />
            <label for="hide-mobile-app-batteries">${localize('editor.hide_mobile_app_batteries')}</label>
          </div>
          <div class="description">
            ${localize('editor.hide_mobile_app_batteries_desc')}
          </div>
          <div style="font-size: 13px; font-weight: 500; color: var(--primary-text-color); margin-top: 12px; margin-bottom: 4px;">${localize('editor.battery_thresholds')}</div>
          <div class="form-row">
            <label for="battery-critical-threshold" style="min-width: 140px;">${localize('editor.battery_critical_below')}</label>
            <input
              type="number"
              id="battery-critical-threshold"
              min="1" max="99"
              value="${batteryCriticalThreshold}"
              style="width: 60px; padding: 6px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
            /> %
          </div>
          <div class="form-row">
            <label for="battery-low-threshold" style="min-width: 140px;">${localize('editor.battery_low_below')}</label>
            <input
              type="number"
              id="battery-low-threshold"
              min="1" max="99"
              value="${batteryLowThreshold}"
              style="width: 60px; padding: 6px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
            /> %
          </div>
          <div class="description">
            ${localize('editor.battery_thresholds_desc')}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">${localize('editor.section_info_cards')}</div>
        <div class="form-row">
          <input
            type="checkbox"
            id="show-weather"
            ${showWeather !== false ? 'checked' : ''}
          />
          <label for="show-weather">${localize('editor.show_weather')}</label>
        </div>
        <div class="description">
          ${localize('editor.show_weather_desc')}
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="show-energy"
            ${showEnergy ? 'checked' : ''}
          />
          <label for="show-energy">${localize('editor.show_energy')}</label>
        </div>
        <div class="description">
          ${localize('editor.show_energy_desc')}
        </div>
      </div>

      <div class="section">
        <div class="section-title">${localize('editor.section_favorites')}</div>
        <div id="favorites-list" style="margin-bottom: 12px;">
          ${renderFavoritesList(favoriteEntities, allEntities)}
        </div>
        <div style="display: flex; gap: 8px; align-items: flex-start;">
          <select id="favorite-entity-select" style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
            <option value="">${localize('editor.select_entity')}</option>
            ${allEntities
              .map(
                (entity) => `
              <option value="${entity.entity_id}">${entity.name}</option>
            `
              )
              .join('')}
          </select>
          <button id="add-favorite-btn" style="flex-shrink: 0; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer; white-space: nowrap;">
            ${localize('editor.add')}
          </button>
        </div>
        <div class="description">
          ${localize('editor.favorites_desc')}
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="favorites-show-state"
            ${favoritesShowState ? 'checked' : ''}
          />
          <label for="favorites-show-state">${localize('editor.show_state')}</label>
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="favorites-hide-last-changed"
            ${favoritesHideLastChanged ? 'checked' : ''}
          />
          <label for="favorites-hide-last-changed">${localize('editor.hide_last_changed')}</label>
        </div>
      </div>

      <div style="border-top: 2px solid var(--divider-color); margin: 24px 0 16px; padding-top: 16px;">
        <div style="font-size: 16px; font-weight: 600; color: var(--primary-text-color); margin-bottom: 4px;">${localize('editor.section_areas_rooms')}</div>
      </div>

      <div class="section">
        <div class="section-title">${localize('editor.section_areas')}</div>
        <div class="form-row">
          <input
            type="checkbox"
            id="group-by-floors"
            ${groupByFloors ? 'checked' : ''}
          />
          <label for="group-by-floors">${localize('editor.group_by_floors')}</label>
        </div>
        <div class="description">
          ${localize('editor.group_by_floors_desc')}
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="show-switches-on-areas"
            ${showSwitchesOnAreas ? 'checked' : ''}
          />
          <label for="show-switches-on-areas">${localize('editor.show_switches_on_areas')}</label>
        </div>
        <div class="description">
          ${localize('editor.show_switches_on_areas_desc')}
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="show-alerts-on-areas"
            ${showAlertsOnAreas ? 'checked' : ''}
          />
          <label for="show-alerts-on-areas">${localize('editor.show_alerts_on_areas')}</label>
        </div>
        <div class="description">
          ${localize('editor.show_alerts_on_areas_desc')}
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="show-locks-in-rooms"
            ${showLocksInRooms ? 'checked' : ''}
          />
          <label for="show-locks-in-rooms">${localize('editor.show_locks_in_rooms')}</label>
        </div>
        <div class="description">
          ${localize('editor.show_locks_in_rooms_desc')}
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="show-automations-in-rooms"
            ${showAutomationsInRooms ? 'checked' : ''}
          />
          <label for="show-automations-in-rooms">${localize('editor.show_automations_in_rooms')}</label>
        </div>
        <div class="description">
          ${localize('editor.show_automations_in_rooms_desc')}
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="show-scripts-in-rooms"
            ${showScriptsInRooms ? 'checked' : ''}
          />
          <label for="show-scripts-in-rooms">${localize('editor.show_scripts_in_rooms')}</label>
        </div>
        <div class="description">
          ${localize('editor.show_scripts_in_rooms_desc')}
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="use-default-area-sort"
            ${useDefaultAreaSort ? 'checked' : ''}
          />
          <label for="use-default-area-sort">${localize('editor.use_default_area_sort')}</label>
        </div>
        <div class="description">
          ${localize('editor.use_default_area_sort_desc')}
        </div>
        <div class="description" style="margin-left: 0; margin-top: 16px; margin-bottom: 12px;">
          ${localize('editor.areas_manage_desc')}
        </div>
        <div class="area-list" id="area-list">
          ${renderAreaItems(allAreas, hiddenAreas, areaOrder)}
        </div>
      </div>

      <div class="section">
        <div class="section-title">${localize('editor.section_room_pins')}</div>
        <div id="room-pins-list" style="margin-bottom: 12px;">
          ${renderRoomPinsList(roomPinEntities, allEntities, allAreas)}
        </div>
        <div style="display: flex; gap: 8px; align-items: flex-start;">
          <select id="room-pin-entity-select" style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
            <option value="">${localize('editor.select_entity')}</option>
            ${allEntities
              .filter((entity) => entity.area_id || entity.device_area_id)
              .map(
                (entity) => `
                <option value="${entity.entity_id}">${entity.name}</option>
              `
              )
              .join('')}
          </select>
          <button id="add-room-pin-btn" style="flex-shrink: 0; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer; white-space: nowrap;">
            ${localize('editor.add')}
          </button>
        </div>
        <div class="description">
          ${localize('editor.room_pins_desc')}
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="room-pins-show-state"
            ${roomPinsShowState ? 'checked' : ''}
          />
          <label for="room-pins-show-state">${localize('editor.show_state')}</label>
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="room-pins-hide-last-changed"
            ${roomPinsHideLastChanged ? 'checked' : ''}
          />
          <label for="room-pins-hide-last-changed">${localize('editor.hide_last_changed')}</label>
        </div>
      </div>

      <div class="section">
        <div class="section-title">${localize('editor.section_views')}</div>
        <div class="form-row">
          <input
            type="checkbox"
            id="show-summary-views"
            ${showSummaryViews ? 'checked' : ''}
          />
          <label for="show-summary-views">${localize('editor.show_summary_views')}</label>
        </div>
        <div class="description">
          ${localize('editor.show_summary_views_desc')}
        </div>
        <div class="form-row">
          <input
            type="checkbox"
            id="show-room-views"
            ${showRoomViews ? 'checked' : ''}
          />
          <label for="show-room-views">${localize('editor.show_room_views')}</label>
        </div>
        <div class="description">
          ${localize('editor.show_room_views_desc')}
        </div>
      </div>

      <div style="border-top: 2px solid var(--divider-color); margin: 24px 0 16px; padding-top: 16px;">
        <div style="font-size: 16px; font-weight: 600; color: var(--primary-text-color); margin-bottom: 4px;">${localize('editor.section_advanced')}</div>
      </div>

      <div class="section">
        <div class="section-title" style="display: flex; align-items: center; gap: 8px;">
          ${localize('editor.section_custom_cards')}
          <a href="https://github.com/TheRealSimon42/simon42-dashboard-strategy/blob/main/assets/Eigene-Karten-hinzufugen.gif" target="_blank" rel="noopener" style="color: var(--primary-color); text-decoration: none; font-size: 18px;" title="${localize('editor.video_tutorial')}">🎬</a>
        </div>
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <input type="text" id="custom-cards-heading" value="${customCardsHeading}" placeholder="${localize('editor.custom_cards_heading_placeholder')}" style="flex: 2; padding: 6px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);" />
          <input type="text" id="custom-cards-icon" value="${customCardsIcon}" placeholder="mdi:cards" style="flex: 1; padding: 6px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);" />
        </div>
        <div class="description" style="margin-bottom: 8px;">
          ${localize('editor.custom_cards_desc')}
        </div>
        <div id="custom-cards-list">
          ${renderCustomCardsList(customCards)}
        </div>
        <button id="add-custom-card-btn" style="margin-top: 8px; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer;">
          ${localize('editor.add_custom_card')}
        </button>
        <div class="description">
          ${localize('editor.custom_cards_help')}
        </div>
      </div>

      <div class="section">
        <div class="section-title" style="display: flex; align-items: center; gap: 8px;">
          ${localize('editor.section_custom_badges')}
          <a href="https://github.com/TheRealSimon42/simon42-dashboard-strategy/blob/main/assets/Custom-Badges-hinzufugen.gif" target="_blank" rel="noopener" style="color: var(--primary-color); text-decoration: none; font-size: 18px;" title="${localize('editor.video_tutorial')}">🎬</a>
        </div>
        <div id="custom-badges-list">
          ${renderCustomBadgesList(customBadges)}
        </div>
        <button id="add-custom-badge-btn" style="margin-top: 8px; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer;">
          ${localize('editor.add_custom_badge')}
        </button>
        <div class="description">
          ${localize('editor.custom_badges_help')}
        </div>
      </div>

      <div class="section">
        <div class="section-title" style="display: flex; align-items: center; gap: 8px;">
          ${localize('editor.section_custom_views')}
          <a href="https://github.com/TheRealSimon42/simon42-dashboard-strategy/blob/main/assets/Custom-View-hinzufugen.gif" target="_blank" rel="noopener" style="color: var(--primary-color); text-decoration: none; font-size: 18px;" title="${localize('editor.video_tutorial')}">🎬</a>
        </div>
        <div id="custom-views-list">
          ${renderCustomViewsList(customViews)}
        </div>
        <button id="add-custom-view-btn" style="margin-top: 8px; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer;">
          ${localize('editor.add_custom_view')}
        </button>
        <div class="description">
          ${localize('editor.custom_views_help')}
        </div>
      </div>

    </div>
  `;
}

// ====================================================================
// PRIVATE HELPERS
// ====================================================================

function renderFavoritesList(favoriteEntities: string[], allEntities: EditorEntity[]): string {
  if (favoriteEntities.length === 0) {
    return '<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">' + localize('editor.no_favorites') + '</div>';
  }

  // Erstelle Map für schnellen Zugriff auf Entity-Namen
  const entityMap = new Map<string, string>(allEntities.map((e) => [e.entity_id, e.name]));

  return `
    <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
      ${favoriteEntities
        .map((entityId: string, _index: number) => {
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
        })
        .join('')}
    </div>
  `;
}

export function renderRoomPinsList(
  roomPinEntities: string[],
  allEntities: EditorEntity[],
  allAreas: AreaRegistryEntry[]
): string {
  if (roomPinEntities.length === 0) {
    return '<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">' + localize('editor.no_room_pins') + '</div>';
  }

  // Erstelle Maps für schnellen Zugriff
  const entityMap = new Map<string, EditorEntity>(allEntities.map((e) => [e.entity_id, e]));
  const areaMap = new Map<string, string>(allAreas.map((a) => [a.area_id, a.name]));

  return `
    <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
      ${roomPinEntities
        .map((entityId: string, _index: number) => {
          const entity = entityMap.get(entityId);
          const name = entity?.name || entityId;
          const areaId = entity?.area_id || entity?.device_area_id;
          const areaName = areaId ? areaMap.get(areaId) || areaId : localize('editor.no_room');

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
        })
        .join('')}
    </div>
  `;
}

export function renderCustomViewsList(customViews: CustomView[]): string {
  if (customViews.length === 0) {
    return '<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">' + localize('editor.no_custom_views') + '</div>';
  }

  return customViews
    .map((view: CustomView, index: number) => {
      const validationMsg = view._yaml_error
        ? `<span style="color: var(--error-color);">❌ ${view._yaml_error}</span>`
        : view.yaml
          ? '<span style="color: var(--success-color, green);">\u2705 ' + localize('editor.yaml_valid') + '</span>'
          : '';

      return `
      <div class="custom-view-item" data-index="${index}" style="border: 1px solid var(--divider-color); border-radius: 8px; padding: 12px; margin-bottom: 12px; background: var(--card-background-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 14px;">${view.title || localize('editor.new_view')}</strong>
          <button class="remove-custom-view-btn" data-index="${index}" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer;">✕</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 8px;">
            <input type="text" class="custom-view-title" data-index="${index}" value="${view.title || ''}" placeholder="${localize('editor.title_placeholder')}" style="flex: 2; padding: 6px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);" />
            <input type="text" class="custom-view-path" data-index="${index}" value="${view.path || ''}" placeholder="${localize('editor.path_placeholder')}" style="flex: 2; padding: 6px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);" />
            <input type="text" class="custom-view-icon" data-index="${index}" value="${view.icon || ''}" placeholder="mdi:star" style="flex: 1; padding: 6px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);" />
          </div>
          <textarea class="custom-view-yaml" data-index="${index}" rows="8" placeholder="${localize('editor.yaml_placeholder')}" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font-family: monospace; font-size: 12px; resize: vertical; box-sizing: border-box;">${view.yaml || ''}</textarea>
          <div class="custom-view-validation" data-index="${index}" style="font-size: 12px; min-height: 16px;">
            ${validationMsg}
          </div>
        </div>
      </div>
    `;
    })
    .join('');
}

export function renderCustomCardsList(customCards: CustomCard[]): string {
  if (customCards.length === 0) {
    return '<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">' + localize('editor.no_custom_cards') + '</div>';
  }

  return customCards
    .map((card: CustomCard, index: number) => {
      const validationMsg = card._yaml_error
        ? `<span style="color: var(--error-color);">❌ ${card._yaml_error}</span>`
        : card.yaml
          ? '<span style="color: var(--success-color, green);">\u2705 ' + localize('editor.yaml_valid') + '</span>'
          : '';

      return `
      <div class="custom-card-item" data-index="${index}" style="border: 1px solid var(--divider-color); border-radius: 8px; padding: 12px; margin-bottom: 12px; background: var(--card-background-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 14px;">${card.title || localize('editor.new_card')}</strong>
          <button class="remove-custom-card-btn" data-index="${index}" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer;">✕</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <input type="text" class="custom-card-title" data-index="${index}" value="${card.title || ''}" placeholder="${localize('editor.card_title_placeholder')}" style="padding: 6px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);" />
          <textarea class="custom-card-yaml" data-index="${index}" rows="6" placeholder="${localize('editor.yaml_placeholder')}" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font-family: monospace; font-size: 12px; resize: vertical; box-sizing: border-box;">${card.yaml || ''}</textarea>
          <div class="custom-card-validation" data-index="${index}" style="font-size: 12px; min-height: 16px;">
            ${validationMsg}
          </div>
        </div>
      </div>
    `;
    })
    .join('');
}

export function renderCustomBadgesList(customBadges: CustomBadge[]): string {
  if (customBadges.length === 0) {
    return '<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">' + localize('editor.no_custom_badges') + '</div>';
  }

  return customBadges
    .map((badge: CustomBadge, index: number) => {
      const validationMsg = badge._yaml_error
        ? `<span style="color: var(--error-color);">❌ ${badge._yaml_error}</span>`
        : badge.yaml
          ? '<span style="color: var(--success-color, green);">\u2705 ' + localize('editor.yaml_valid') + '</span>'
          : '';

      return `
      <div class="custom-badge-item" data-index="${index}" style="border: 1px solid var(--divider-color); border-radius: 8px; padding: 12px; margin-bottom: 12px; background: var(--card-background-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 14px;">Badge ${index + 1}</strong>
          <button class="remove-custom-badge-btn" data-index="${index}" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer;">✕</button>
        </div>
        <textarea class="custom-badge-yaml" data-index="${index}" rows="4" placeholder="type: entity&#10;entity: sun.sun" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font-family: monospace; font-size: 12px; resize: vertical; box-sizing: border-box;">${badge.yaml || ''}</textarea>
        <div class="custom-badge-validation" data-index="${index}" style="font-size: 12px; min-height: 16px;">
          ${validationMsg}
        </div>
      </div>
    `;
    })
    .join('');
}

function renderAreaItems(allAreas: AreaRegistryEntry[], hiddenAreas: string[], areaOrder: string[]): string {
  if (allAreas.length === 0) {
    return '<div class="empty-state">' + localize('editor.no_areas') + '</div>';
  }

  return allAreas
    .map((area: AreaRegistryEntry, index: number) => {
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
          <div class="loading-placeholder">${localize('editor.loading_entities')}</div>
        </div>
      </div>
    `;
    })
    .join('');
}

// -- Domain group definition for entity rendering ---------------------

interface DomainGroup {
  key: keyof RoomEntities;
  label: string;
  icon: string;
}

export function renderAreaEntitiesHTML(
  areaId: string,
  groupedEntities: Record<string, string[]>,
  hiddenEntities: Record<string, string[]>,
  entityOrders: Record<string, string[]>,
  hass: HassStatesSubset,
  badgeCandidates?: string[],
  additionalBadges?: string[],
  availableEntities?: Array<{ entity_id: string; name: string }>,
  defaultShowNameEntities?: Set<string>,
  namesVisible?: string[],
  namesHidden?: string[]
): string {
  const domainGroups: DomainGroup[] = [
    { key: 'lights', label: localize('editor.domain_lights'), icon: 'mdi:lightbulb' },
    { key: 'climate', label: localize('editor.domain_climate'), icon: 'mdi:thermostat' },
    { key: 'covers', label: localize('editor.domain_covers'), icon: 'mdi:window-shutter' },
    { key: 'covers_curtain', label: localize('editor.domain_covers_curtain'), icon: 'mdi:curtains' },
    { key: 'covers_window', label: localize('editor.domain_covers_window'), icon: 'mdi:window-open-variant' },
    { key: 'media_player', label: localize('editor.domain_media_player'), icon: 'mdi:speaker' },
    { key: 'scenes', label: localize('editor.domain_scenes'), icon: 'mdi:palette' },
    { key: 'vacuum', label: localize('editor.domain_vacuum'), icon: 'mdi:robot-vacuum' },
    { key: 'fan', label: localize('editor.domain_fan'), icon: 'mdi:fan' },
    { key: 'switches', label: localize('editor.domain_switches'), icon: 'mdi:light-switch' },
    { key: 'locks', label: localize('editor.domain_locks'), icon: 'mdi:lock' },
  ];

  let html = '<div class="entity-groups">';

  domainGroups.forEach((group: DomainGroup) => {
    const entities = groupedEntities[group.key] || [];
    if (entities.length === 0) return;

    const hiddenInGroup = hiddenEntities[group.key] || [];
    const allHidden = entities.every((e) => hiddenInGroup.includes(e));
    const someHidden = entities.some((e) => hiddenInGroup.includes(e)) && !allHidden;

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
          ${entities
            .map((entityId: string) => {
              const state = hass.states[entityId];
              const name = state?.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
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
            })
            .join('')}
        </div>
      </div>
    `;
  });

  // Badge group (after domain groups)
  if (badgeCandidates && badgeCandidates.length > 0 || additionalBadges && additionalBadges.length > 0) {
    html += renderBadgeGroupHTML(
      areaId,
      badgeCandidates || [],
      additionalBadges || [],
      availableEntities || [],
      hiddenEntities,
      hass,
      defaultShowNameEntities,
      namesVisible,
      namesHidden
    );
  }

  html += '</div>';

  if (html === '<div class="entity-groups"></div>') {
    return '<div class="empty-state">' + localize('editor.no_entities_in_area') + '</div>';
  }

  return html;
}

export function renderBadgeGroupHTML(
  areaId: string,
  badgeCandidates: string[],
  additionalBadges: string[],
  availableEntities: Array<{ entity_id: string; name: string }>,
  hiddenEntities: Record<string, string[]>,
  hass: HassStatesSubset,
  defaultShowNameEntities?: Set<string>,
  namesVisible?: string[],
  namesHidden?: string[]
): string {
  const totalCount = badgeCandidates.length + additionalBadges.length;
  if (totalCount === 0) return '';

  const hiddenInBadges = hiddenEntities['badges'] || [];
  const allHidden = badgeCandidates.length > 0 && badgeCandidates.every((e) => hiddenInBadges.includes(e));
  const someHidden = badgeCandidates.some((e) => hiddenInBadges.includes(e)) && !allHidden;

  const namesVisibleSet = new Set(namesVisible || []);
  const namesHiddenSet = new Set(namesHidden || []);
  const defaultNames = defaultShowNameEntities || new Set<string>();

  const isNameShown = (entityId: string): boolean =>
    resolveShowName(entityId, defaultNames.has(entityId), namesVisibleSet, namesHiddenSet);

  let html = `
    <div class="entity-group" data-group="badges">
      <div class="entity-group-header">
        <input
          type="checkbox"
          class="group-checkbox"
          data-area-id="${areaId}"
          data-group="badges"
          ${!allHidden ? 'checked' : ''}
          ${someHidden ? 'data-indeterminate="true"' : ''}
        />
        <ha-icon icon="mdi:checkbox-multiple-blank-circle"></ha-icon>
        <span class="group-name">${localize('editor.domain_badges')}</span>
        <span class="entity-count">(${totalCount})</span>
        <button class="expand-button-small" data-area-id="${areaId}" data-group="badges">
          <span class="expand-icon-small">▶</span>
        </button>
      </div>
      <div class="entity-list" data-area-id="${areaId}" data-group="badges" style="display: none;">`;

  // Auto-detected badge candidates
  for (const entityId of badgeCandidates) {
    const state = hass.states[entityId];
    const name = state?.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
    const isHidden = hiddenInBadges.includes(entityId);
    const showName = isNameShown(entityId);

    html += `
        <div class="entity-item">
          <input
            type="checkbox"
            class="entity-checkbox"
            data-area-id="${areaId}"
            data-group="badges"
            data-entity-id="${entityId}"
            ${!isHidden ? 'checked' : ''}
          />
          <span class="entity-name">${name}</span>
          <input
            type="checkbox"
            class="badge-name-checkbox"
            data-area-id="${areaId}"
            data-entity-id="${entityId}"
            ${showName ? 'checked' : ''}
            title="${localize('editor.badges_show_name')}"
          />
          <span class="badge-name-label">${localize('editor.badges_name_short')}</span>
          <span class="entity-id">${entityId}</span>
        </div>`;
  }

  // Additional (custom) badges
  if (additionalBadges.length > 0) {
    html += `<div class="badge-separator">${localize('editor.badges_additional')}</div>`;
    for (const entityId of additionalBadges) {
      const state = hass.states[entityId];
      const name = state?.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
      const showName = isNameShown(entityId);

      html += `
        <div class="entity-item badge-additional-item">
          <span class="entity-name">${name}</span>
          <input
            type="checkbox"
            class="badge-name-checkbox"
            data-area-id="${areaId}"
            data-entity-id="${entityId}"
            ${showName ? 'checked' : ''}
            title="${localize('editor.badges_show_name')}"
          />
          <span class="badge-name-label">${localize('editor.badges_name_short')}</span>
          <span class="entity-id">${entityId}</span>
          <button class="badge-remove-btn" data-area-id="${areaId}" data-entity-id="${entityId}" title="${localize('editor.badges_remove')}">✕</button>
        </div>`;
    }
  }

  // Entity picker for adding new badges
  if (availableEntities.length > 0) {
    html += `
        <div class="badge-add-section">
          <select class="badge-entity-picker" data-area-id="${areaId}">
            <option value="">${localize('editor.badges_select_entity')}</option>
            ${availableEntities.map((e) => `<option value="${e.entity_id}">${e.name} (${e.entity_id})</option>`).join('')}
          </select>
          <button class="badge-add-button" data-area-id="${areaId}">${localize('editor.badges_add')}</button>
        </div>`;
  }

  html += `
      </div>
    </div>`;

  return html;
}
