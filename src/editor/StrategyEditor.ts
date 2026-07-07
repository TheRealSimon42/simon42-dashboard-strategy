// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR (LitElement)
// ====================================================================
// Single-file LitElement editor replacing the previous 4-file
// vanilla HTMLElement + innerHTML pattern.
// ====================================================================

import { LitElement, html, nothing, type TemplateResult } from 'lit';
import yaml from 'js-yaml';

import type { HomeAssistant } from '../types/homeassistant';
import type {
  Simon42StrategyConfig,
  AreaCustomSection,
  AreaOptions,
  RoomEntities,
  SectionKey,
  SectionOrderKey,
  StackKey,
} from '../types/strategy';
import { DEFAULT_SECTIONS_ORDER, DEFAULT_STACKS_ORDER } from '../types/strategy';
// Pure-data section registry (no builder imports — safe for the editor chunk)
import { SECTION_META_BY_KEY } from '../sections/section-registry';
import { validateCustomSections } from '../sections/CustomSections';
import type { AreaRegistryEntry, EntityRegistryEntry } from '../types/registries';
import { localize } from '../utils/localize';
import { EDITOR_STYLES } from './editor-styles';
import type { StrategyEditorHost, AreaEntitiesCacheEntry } from './editor-host';
import { renderViewsSection } from './panels/ViewsPanel';
import { renderOverviewSection } from './panels/OverviewPanel';
import { renderFavoritesSection, renderLightFavoritesSection } from './panels/FavoritesPanel';
import { renderRoomPinsSection } from './panels/RoomPinsPanel';
import { renderWeatherSensorsSection } from './panels/WeatherSensorsPanel';
import {
  renderCustomCardsSection,
  renderCustomBadgesSection,
  renderCustomViewsSection,
  renderCustomSectionsSection,
} from './panels/CustomConfigPanels';
import { renderSectionOrderPanel } from './panels/SectionOrderPanel';
import {
  getAllEntitiesForSelect,
  getFilteredEntities,
} from './entity-options';
import { Registry } from '../Registry';
import { collectCameraBlocks } from '../views/CctvViewStrategy';
import { findUpsEntityGroups } from '../views/RoomViewStrategy';
import { isBadgeCandidate, isDefaultShowName, resolveShowName } from '../utils/badge-utils';
import { mergeStacksOrder } from '../utils/name-utils';

// -- Supporting types for the editor ------------------------------------

interface DomainGroup {
  key: string;
  label: string;
  icon: string;
}

declare global {
  interface Window {
    customCards?: Array<{ type: string; name: string; description: string }>;
    cardTools?: unknown;
  }
}

// ====================================================================
// Editor Class
// ====================================================================

class Simon42DashboardStrategyEditor extends LitElement implements StrategyEditorHost {
  static properties = {
    _config: { state: true },
    _expandedAreas: { state: true },
    _expandedGroups: { state: true },
  };

  // hass is set externally by HA — use a setter, not a Lit property
  _hass: HomeAssistant | null = null;
  private _isUpdatingConfig = false;

  _config: Simon42StrategyConfig = {};
  _expandedAreas = new Set<string>();
  _expandedGroups = new Map<string, Set<string>>();

  // Entity search state (NOT @state — we call requestUpdate manually)
  _favoriteSearch = '';
  _roomPinSearch = '';
  _weatherSensorSearch = '';
  _securityExtraSearch = '';
  _lightFavSearch = '';

  // Cache for loaded area entities (avoid re-fetching on every render)
  _areaEntitiesCache = new Map<string, AreaEntitiesCacheEntry>();

  // Drag state (not reactive — no render needed)
  _draggedElement: HTMLElement | null = null;
  _sectionDraggedElement: HTMLElement | null = null;
  _stackDraggedElement: HTMLElement | null = null;

  // -- Lifecycle --------------------------------------------------------

  set hass(hass: HomeAssistant) {
    const oldHass = this._hass;
    this._hass = hass;
    if (!oldHass) this.requestUpdate();
  }

  setConfig(config: Simon42StrategyConfig): void {
    if (this._isUpdatingConfig) return;
    this._config = config;
  }

  // -- Dependency check -------------------------------------------------

  // -- Styles -----------------------------------------------------------

  static styles = EDITOR_STYLES;

  // -- Main render ------------------------------------------------------

  protected render() {
    if (!this._hass) return nothing;

    return html`
      <div class="card-config">
        ${renderOverviewSection(this)}
        ${this._renderSummariesSection()}
        ${renderFavoritesSection(this)}
        ${renderLightFavoritesSection(this)}

        <div class="section-divider">
          <div class="section-divider-title">
            ${localize('editor.section_areas_rooms')}
          </div>
        </div>

        ${this._renderAreasSection()}
        ${renderRoomPinsSection(this)}
        ${renderViewsSection(this)}

        <div class="section-divider">
          <div class="section-divider-title">
            ${localize('editor.section_advanced')}
          </div>
        </div>

        ${renderSectionOrderPanel(this)}
        ${renderWeatherSensorsSection(this)}
        ${renderCustomCardsSection(this)}
        ${renderCustomSectionsSection(this)}
        ${renderCustomBadgesSection(this)}
        ${renderCustomViewsSection(this)}
      </div>
    `;
  }

  // ====================================================================
  // SECTION RENDERERS
  // ====================================================================

  // -- Section order panel -----------------------------------------------

  /** Keys of valid user-declared custom sections (collisions/duplicates dropped). */
  _validCustomSectionKeys(): string[] {
    return validateCustomSections(this._config.custom_sections).map((cs) => cs.key);
  }

  _getSectionsOrder(): SectionOrderKey[] {
    // Mirrors the view's normalization: configured order (invalid keys
    // dropped), then missing built-ins, then unpositioned custom sections —
    // so new custom sections show up in the drag & drop panel immediately.
    const customKeys = this._validCustomSectionKeys();
    const validKeys = new Set<string>([...DEFAULT_SECTIONS_ORDER, ...customKeys]);
    const seen = new Set<string>();
    const result: SectionOrderKey[] = [];
    for (const key of this._config.sections_order || []) {
      if (validKeys.has(key) && !seen.has(key)) {
        result.push(key);
        seen.add(key);
      }
    }
    for (const key of DEFAULT_SECTIONS_ORDER) {
      if (!seen.has(key)) result.push(key);
    }
    for (const key of customKeys) {
      if (!seen.has(key)) result.push(key);
    }
    return result;
  }

  // Section metadata (icon, label, visibility toggle) derives from the
  // section registry — a new built-in section needs no editor changes at
  // all. Custom sections get synthesized display meta from their config.

  _sectionDisplayMeta(key: SectionOrderKey): { icon: string; label: string } | null {
    const builtin = SECTION_META_BY_KEY.get(key as SectionKey);
    if (builtin) return { icon: builtin.icon, label: localize(builtin.labelKey) };
    const custom = (this._config.custom_sections || []).find((cs) => cs.key === key);
    if (custom) {
      return { icon: custom.icon || 'mdi:view-grid-plus-outline', label: custom.heading || custom.key };
    }
    return null;
  }

  // -- Section order drag & drop -----------------------------------------

  _getStacksOrder(areaId: string): StackKey[] {
    return mergeStacksOrder(this._config.areas_options?.[areaId]?.stacks_order);
  }

  private _updateStacksOrder(areaId: string, newOrder: StackKey[]): void {
    const currentAreaOptions = this._config.areas_options?.[areaId] || {};
    const newAreaOptions: AreaOptions = { ...currentAreaOptions };

    if (newOrder.join('|') === DEFAULT_STACKS_ORDER.join('|')) {
      delete newAreaOptions.stacks_order;
    } else {
      newAreaOptions.stacks_order = newOrder;
    }

    const newAreasOptions: Record<string, AreaOptions> = {
      ...this._config.areas_options,
      [areaId]: newAreaOptions,
    };

    if (Object.keys(newAreasOptions[areaId]).length === 0) {
      delete newAreasOptions[areaId];
    }

    const newConfig: Simon42StrategyConfig = { ...this._config };
    if (Object.keys(newAreasOptions).length === 0) {
      delete newConfig.areas_options;
    } else {
      newConfig.areas_options = newAreasOptions;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private static _stackMeta = new Map<StackKey, { icon: string; labelKey: string }>([
    ['ups', { icon: 'mdi:power-plug-battery', labelKey: 'stacks.ups' }],
    ['energy', { icon: 'mdi:lightning-bolt', labelKey: 'stacks.energy' }],
    ['cameras', { icon: 'mdi:cctv', labelKey: 'stacks.cameras' }],
    ['lights', { icon: 'mdi:lightbulb', labelKey: 'stacks.lights' }],
    ['locks', { icon: 'mdi:lock', labelKey: 'stacks.locks' }],
    ['climate', { icon: 'mdi:thermostat', labelKey: 'stacks.climate' }],
    ['covers', { icon: 'mdi:window-shutter', labelKey: 'stacks.covers' }],
    ['covers_curtain', { icon: 'mdi:curtains', labelKey: 'stacks.covers_curtain' }],
    ['covers_window', { icon: 'mdi:window-open-variant', labelKey: 'stacks.covers_window' }],
    ['media', { icon: 'mdi:speaker', labelKey: 'stacks.media' }],
    ['scenes', { icon: 'mdi:palette', labelKey: 'stacks.scenes' }],
    ['vacuums', { icon: 'mdi:robot-vacuum', labelKey: 'stacks.vacuums' }],
    ['misc', { icon: 'mdi:dots-horizontal', labelKey: 'stacks.misc' }],
    ['automations', { icon: 'mdi:robot', labelKey: 'stacks.automations' }],
    ['scripts', { icon: 'mdi:script-text', labelKey: 'stacks.scripts' }],
    ['room_pins', { icon: 'mdi:pin', labelKey: 'stacks.room_pins' }],
  ]);

  private _presentStackKeys(
    data: NonNullable<ReturnType<typeof this._areaEntitiesCache.get>>
  ): Set<StackKey> {
    const g = data.groupedEntities;
    const present = new Set<StackKey>();
    const has = (key: string): boolean => (g[key]?.length ?? 0) > 0;

    if (has('ups')) present.add('ups');
    if (has('energy')) present.add('energy');
    if (has('lights')) present.add('lights');
    if (has('locks')) present.add('locks');
    if (has('climate') || has('fan')) present.add('climate');
    if (has('covers')) present.add('covers');
    if (has('covers_curtain')) present.add('covers_curtain');
    if (has('covers_window')) present.add('covers_window');
    if (has('media_player')) present.add('media');
    if (has('scenes')) present.add('scenes');
    if (has('vacuum') && this._config.show_vacuums_section_in_rooms === true) present.add('vacuums');
    if (has('vacuum') || has('switches') || has('humidifier') || has('valve') || has('water_heater')) present.add('misc');
    if (has('automations')) present.add('automations');
    if (has('scripts')) present.add('scripts');

    present.add('cameras');
    present.add('room_pins');

    return present;
  }

  private _renderStackOrderPanel(
    areaId: string,
    data: NonNullable<ReturnType<typeof this._areaEntitiesCache.get>>
  ): TemplateResult {
    const order = this._getStacksOrder(areaId);
    const present = this._presentStackKeys(data);
    const visibleOrder = order.filter((key) => present.has(key));
    const inactiveOrder = order.filter((key) => !present.has(key));

    return html`
      <div class="entity-group" data-group="stack_order">
        <div class="entity-group-header">
          <ha-icon icon="mdi:sort"></ha-icon>
          <span class="group-name">${localize('editor.stack_order')}</span>
        </div>
        <div class="entity-list">
          <div class="description" style="margin-left: 0; margin-bottom: 8px;">
            ${localize('editor.stack_order_desc')}
          </div>
          <div class="section-order-list" data-area-id=${areaId}>
            ${visibleOrder.map((key) => {
              const meta = Simon42DashboardStrategyEditor._stackMeta.get(key);
              if (!meta) return nothing;
              return html`
                <div class="section-order-item"
                  data-area-id=${areaId}
                  data-stack-key=${key}
                  draggable="true"
                  @dragstart=${this._handleStackDragStart}
                  @dragend=${this._handleStackDragEnd}
                  @dragover=${this._handleStackDragOver}
                  @dragleave=${this._handleStackDragLeave}
                  @drop=${this._handleStackDrop}>
                  <span class="drag-handle" draggable="true">&#x2630;</span>
                  <ha-icon class="section-icon" icon=${meta.icon}></ha-icon>
                  <span class="section-label">${localize(meta.labelKey)}</span>
                </div>
              `;
            })}
          </div>
          ${inactiveOrder.length > 0
            ? html`
              <div class="section-order-compact">
                <div class="compact-title">${localize('editor.stack_order_inactive')}</div>
                <div class="compact-chip-list">
                  ${inactiveOrder.map((key) => {
                    const meta = Simon42DashboardStrategyEditor._stackMeta.get(key);
                    if (!meta) return nothing;
                    return html`
                      <span class="compact-chip">
                        <ha-icon icon=${meta.icon}></ha-icon>
                        ${localize(meta.labelKey)}
                      </span>
                    `;
                  })}
                </div>
              </div>
            `
            : nothing}
        </div>
      </div>
    `;
  }

  private _handleStackDragStart = (ev: DragEvent): void => {
    const dragHandle = (ev.target as HTMLElement).closest('.drag-handle');
    if (!dragHandle) { ev.preventDefault(); return; }

    const item = (ev.target as HTMLElement).closest('.section-order-item') as HTMLElement | null;
    if (!item) { ev.preventDefault(); return; }

    item.classList.add('dragging');
    if (ev.dataTransfer) {
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('text/plain', item.dataset.stackKey || '');
    }
    this._stackDraggedElement = item;
  };

  private _handleStackDragEnd = (ev: DragEvent): void => {
    const item = (ev.target as HTMLElement).closest('.section-order-item') as HTMLElement | null;
    if (item) item.classList.remove('dragging');

    this.shadowRoot
      ?.querySelectorAll('.section-order-item.drag-over')
      .forEach((el) => el.classList.remove('drag-over'));
    this._stackDraggedElement = null;
  };

  private _handleStackDragOver = (ev: DragEvent): void => {
    ev.preventDefault();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';

    const item = ev.currentTarget as HTMLElement;
    if (item !== this._stackDraggedElement) {
      item.classList.add('drag-over');
    }
  };

  private _handleStackDragLeave = (ev: DragEvent): void => {
    (ev.currentTarget as HTMLElement).classList.remove('drag-over');
  };

  private _handleStackDrop = (ev: DragEvent): void => {
    ev.stopPropagation();
    ev.preventDefault();

    const dropTarget = ev.currentTarget as HTMLElement;
    dropTarget.classList.remove('drag-over');

    if (!this._stackDraggedElement || this._stackDraggedElement === dropTarget) return;

    const draggedKey = this._stackDraggedElement.dataset.stackKey as StackKey | undefined;
    const dropKey = dropTarget.dataset.stackKey as StackKey | undefined;
    const areaId = dropTarget.dataset.areaId;
    if (!draggedKey || !dropKey || !areaId) return;

    const currentOrder = this._getStacksOrder(areaId);
    const draggedIndex = currentOrder.indexOf(draggedKey);
    const dropIndex = currentOrder.indexOf(dropKey);
    if (draggedIndex === -1 || dropIndex === -1) return;

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedKey);

    this._updateStacksOrder(areaId, newOrder);
  };

  // -- Overview section --------------------------------------------------

  private _renderSummariesSection(): TemplateResult {
    const summariesColumns = this._config.summaries_columns || 2;
    const showLightSummary = this._config.show_light_summary !== false;
    const groupLightsByFloors = this._config.group_lights_by_floors === true;
    const nestedLightGroups = this._config.nested_light_groups === true;
    const showCoversSummary = this._config.show_covers_summary !== false;
    const showPartiallyOpenCovers = this._config.show_partially_open_covers === true;
    const groupCoversByFloors = this._config.group_covers_by_floors === true;
    const showSecuritySummary = this._config.show_security_summary !== false;
    const showClimateSummary = this._config.show_climate_summary === true;
    const showBatterySummary = this._config.show_battery_summary !== false;
    const hideMobileAppBatteries = this._config.hide_mobile_app_batteries === true;
    const hideBatteryNotesEntities = this._config.hide_battery_notes_entities === true;
    const batteryCriticalThreshold = this._config.battery_critical_threshold ?? 20;
    const batteryLowThreshold = this._config.battery_low_threshold ?? 50;
    const showAreaInBatteryView = this._config.show_area_in_battery_view === true;
    const unavailableBatteriesBucket = this._config.unavailable_batteries_bucket === 'critical' ? 'critical' : 'good';

    return html`
      <div class="section">
        <div class="section-title">${localize('editor.section_summaries')}</div>

        <div class="form-row">
          <input type="radio" id="summaries-2-columns" name="summaries-columns" value="2"
            ?checked=${summariesColumns === 2}
            @change=${() => this._summariesColumnsChanged(2)} />
          <label for="summaries-2-columns">${localize('editor.columns_2')}</label>
        </div>
        <div class="form-row">
          <input type="radio" id="summaries-4-columns" name="summaries-columns" value="4"
            ?checked=${summariesColumns === 4}
            @change=${() => this._summariesColumnsChanged(4)} />
          <label for="summaries-4-columns">${localize('editor.columns_4')}</label>
        </div>
        <div class="description">${localize('editor.columns_desc')}</div>

        ${this._renderCheckbox('show-light-summary', localize('editor.show_light_summary'), showLightSummary,
          (checked) => this._toggleChanged('show_light_summary', checked, true))}

        ${this._renderCheckbox('group-lights-by-floors', localize('editor.group_lights_by_floors'), groupLightsByFloors,
          (checked) => this._toggleChanged('group_lights_by_floors', checked, false))}
        <div class="description">${localize('editor.group_lights_by_floors_desc')}</div>

        ${this._renderCheckbox('lights-sort-by-name', localize('editor.lights_sort_by_name'), this._config.lights_sort_by === 'name',
          (checked) => this._lightsSortByChanged(checked))}
        <div class="description">${localize('editor.lights_sort_by_name_desc')}</div>

        ${this._renderCheckbox('nested-light-groups', localize('editor.nested_light_groups'), nestedLightGroups,
          (checked) => this._toggleChanged('nested_light_groups', checked, false))}
        <div class="description">${localize('editor.nested_light_groups_desc')}</div>

        ${this._renderCheckbox('show-covers-summary', localize('editor.show_covers_summary'), showCoversSummary,
          (checked) => this._toggleChanged('show_covers_summary', checked, true))}

        <div style="margin-left: 26px; margin-bottom: 8px;">
          ${this._renderCheckbox('show-partially-open-covers', localize('editor.show_partially_open_covers'), showPartiallyOpenCovers,
            (checked) => this._toggleChanged('show_partially_open_covers', checked, false))}
          <div class="description">${localize('editor.show_partially_open_covers_desc')}</div>

          ${this._renderCheckbox('group-covers-by-floors', localize('editor.group_covers_by_floors'), groupCoversByFloors,
            (checked) => this._toggleChanged('group_covers_by_floors', checked, false))}
          <div class="description">${localize('editor.group_covers_by_floors_desc')}</div>
        </div>

        ${this._renderCheckbox('show-security-summary', localize('editor.show_security_summary'), showSecuritySummary,
          (checked) => this._toggleChanged('show_security_summary', checked, true))}

        <div style="margin-left: 26px; margin-bottom: 8px;">
          ${this._renderCheckbox('show-cameras-in-security', localize('editor.show_cameras_in_security'), this._config.show_cameras_in_security === true,
            (checked) => this._toggleChanged('show_cameras_in_security', checked, false))}
          <div class="description">${localize('editor.show_cameras_in_security_desc')}</div>

          ${this._config.show_cameras_in_security === true ? this._renderHiddenCamerasPicker() : nothing}

          ${this._renderCheckbox('group-security-by-areas', localize('editor.group_security_by_areas'), this._config.group_security_by_areas === true,
            (checked) => this._toggleChanged('group_security_by_areas', checked, false))}
          <div class="description">${localize('editor.group_security_by_areas_desc')}</div>

          ${this._renderCheckbox('show-security-activity', localize('editor.show_security_activity'), this._config.show_security_activity !== false,
            (checked) => this._toggleChanged('show_security_activity', checked, true))}
          <div class="description">${localize('editor.show_security_activity_desc')}</div>

          ${this._config.show_security_activity !== false && this._config.group_security_by_areas !== true ? html`
            <div style="margin-left: 26px;">
              ${this._renderCheckbox('security-activity-at-end', localize('editor.security_activity_at_end'), this._config.security_activity_position === 'end',
                (checked) => this._securityActivityPositionChanged(checked))}
            </div>
          ` : nothing}

          ${this._renderSecurityExtraEntitiesPicker()}
        </div>

        ${this._renderCheckbox('show-climate-summary', localize('editor.show_climate_summary'), showClimateSummary,
          (checked) => this._toggleChanged('show_climate_summary', checked, false))}
        <div class="description">${localize('editor.show_climate_summary_desc')}</div>

        ${this._renderCheckbox('show-camera-view', localize('editor.show_camera_view'), this._config.show_camera_view === true,
          (checked) => this._toggleChanged('show_camera_view', checked, false))}
        <div class="description">${localize('editor.show_camera_view_desc')}</div>

        <div style="margin-left: 26px; margin-bottom: 8px;">
          ${this._renderCheckbox('show-camera-events', localize('editor.show_camera_events'), this._config.show_camera_events === true,
            (checked) => this._toggleChanged('show_camera_events', checked, false))}
          <div class="description">${localize('editor.show_camera_events_desc')}</div>

          ${this._config.show_camera_view === true && this._config.show_cameras_in_security !== true
            ? this._renderHiddenCamerasPicker()
            : nothing}
        </div>

        ${this._renderCheckbox('show-battery-summary', localize('editor.show_battery_summary'), showBatterySummary,
          (checked) => this._toggleChanged('show_battery_summary', checked, true))}

        <div style="margin-left: 26px; margin-bottom: 8px;">
          ${this._renderCheckbox('hide-mobile-app-batteries', localize('editor.hide_mobile_app_batteries'), hideMobileAppBatteries,
            (checked) => this._toggleChanged('hide_mobile_app_batteries', checked, false))}
          <div class="description">${localize('editor.hide_mobile_app_batteries_desc')}</div>

          ${this._renderCheckbox('show-battery-view', localize('editor.show_battery_view'), this._config.show_battery_view === true,
            (checked) => this._toggleChanged('show_battery_view', checked, false))}
          <div class="description">${localize('editor.show_battery_view_desc')}</div>

          ${this._renderCheckbox('show-area-in-battery-view', localize('editor.show_area_in_battery_view'), showAreaInBatteryView,
            (checked) => this._toggleChanged('show_area_in_battery_view', checked, false))}
          <div class="description">${localize('editor.show_area_in_battery_view_desc')}</div>
          ${this._renderCheckbox('hide-battery-notes-entities', localize('editor.hide_battery_notes_entities'), hideBatteryNotesEntities,
            (checked) => this._toggleChanged('hide_battery_notes_entities', checked, false))}
          <div class="description">${localize('editor.hide_battery_notes_entities_desc')}</div>

          <div style="font-size: 13px; font-weight: 500; color: var(--primary-text-color); margin-top: 12px; margin-bottom: 4px;">
            ${localize('editor.battery_thresholds')}
          </div>
          <div class="form-row">
            <label for="battery-critical-threshold" style="min-width: 140px;">${localize('editor.battery_critical_below')}</label>
            <input type="number" id="battery-critical-threshold" min="1" max="99"
              .value=${String(batteryCriticalThreshold)}
              style="width: 70px;"
              @change=${this._batteryCriticalChanged} /> %
          </div>
          <div class="form-row">
            <label for="battery-low-threshold" style="min-width: 140px;">${localize('editor.battery_low_below')}</label>
            <input type="number" id="battery-low-threshold" min="1" max="99"
              .value=${String(batteryLowThreshold)}
              style="width: 70px;"
              @change=${this._batteryLowChanged} /> %
          </div>
          <div class="description">${localize('editor.battery_thresholds_desc')}</div>

          <div style="font-size: 13px; font-weight: 500; color: var(--primary-text-color); margin-top: 12px; margin-bottom: 4px;">
            ${localize('editor.unavailable_batteries_bucket')}
          </div>
          <div class="form-row">
            <input type="radio" id="unavailable-batteries-critical" name="unavailable-batteries-bucket" value="critical"
              ?checked=${unavailableBatteriesBucket === 'critical'}
              @change=${() => this._unavailableBatteriesBucketChanged('critical')} />
            <label for="unavailable-batteries-critical">${localize('editor.unavailable_batteries_critical')}</label>
          </div>
          <div class="form-row">
            <input type="radio" id="unavailable-batteries-good" name="unavailable-batteries-bucket" value="good"
              ?checked=${unavailableBatteriesBucket === 'good'}
              @change=${() => this._unavailableBatteriesBucketChanged('good')} />
            <label for="unavailable-batteries-good">${localize('editor.unavailable_batteries_good')}</label>
          </div>
          <div class="description">${localize('editor.unavailable_batteries_bucket_desc')}</div>
        </div>

        ${this._renderCheckbox('show-maintenance-summary', localize('editor.show_maintenance_summary'), this._config.show_maintenance_summary === true,
          (checked) => this._toggleChanged('show_maintenance_summary', checked, false))}
        <div class="description">${localize('editor.show_maintenance_summary_desc')}</div>

        ${this._config.show_maintenance_summary === true ? html`
          <div style="margin-left: 26px; margin-bottom: 8px;">
            ${this._renderCheckbox('show-maintenance-activity', localize('editor.show_maintenance_activity'), this._config.show_maintenance_activity !== false,
              (checked) => this._toggleChanged('show_maintenance_activity', checked, true))}
            <div class="description">${localize('editor.show_maintenance_activity_desc')}</div>

            ${this._renderCheckbox('show-video-tips', localize('editor.show_video_tips'), this._config.show_video_tips !== false,
              (checked) => this._toggleChanged('show_video_tips', checked, true))}
            <div class="description">${localize('editor.show_video_tips_desc')}</div>

            ${this._renderMaintenanceUsersPicker()}
          </div>
        ` : nothing}
      </div>
    `;
  }

  /**
   * User restriction for the maintenance tile/view. Options come from
   * person entities carrying a user_id — no admin-only WS call needed.
   * Empty selection state (no key in config) = visible to everyone.
   */
  private _renderMaintenanceUsersPicker(): TemplateResult {
    if (!this._hass) return html``;
    const options: { userId: string; name: string }[] = [];
    for (const [entityId, state] of Object.entries(this._hass.states)) {
      if (!entityId.startsWith('person.')) continue;
      const userId = state.attributes?.user_id as string | undefined;
      if (!userId) continue;
      options.push({
        userId,
        name: (state.attributes?.friendly_name as string | undefined) || entityId,
      });
    }

    const selected = this._config.maintenance_visible_users || [];
    const allVisible = selected.length === 0;

    return html`
      <div style="font-size: 13px; font-weight: 500; color: var(--primary-text-color); margin-top: 4px; margin-bottom: 4px;">
        ${localize('editor.maintenance_visible_users')}
      </div>
      <div class="description" style="margin-left: 0;">
        ${localize('editor.maintenance_visible_users_desc')}
      </div>
      ${options.length === 0
        ? html`<div class="description" style="margin-left: 0;">${localize('editor.maintenance_visible_users_none')}</div>`
        : options.map((opt) => this._renderCheckbox(
            `maintenance-user-${opt.userId}`,
            opt.name,
            allVisible || selected.includes(opt.userId),
            (checked) => this._maintenanceUserChanged(opt.userId, options.map((o) => o.userId), checked)
          ))}
    `;
  }

  private _maintenanceUserChanged(userId: string, allUserIds: string[], checked: boolean): void {
    const current = this._config.maintenance_visible_users || [];
    // No restriction stored = everyone checked; start from the full set
    const effective = new Set(current.length > 0 ? current : allUserIds);
    if (checked) effective.add(userId);
    else effective.delete(userId);

    const updated: Simon42StrategyConfig = { ...this._config };
    const known = allUserIds.filter((id) => effective.has(id));
    // Ids configured via YAML for users without a person entity — keep them
    const unknown = [...effective].filter((id) => !allUserIds.includes(id));
    if (unknown.length === 0 && known.length === allUserIds.length) {
      delete updated.maintenance_visible_users; // everyone = no restriction
    } else {
      updated.maintenance_visible_users = [...known, ...unknown];
    }
    this._fireConfigChanged(updated);
  }

  private _unavailableBatteriesBucketChanged(bucket: 'critical' | 'good'): void {
    const updated: Simon42StrategyConfig = { ...this._config };
    // 'good' is now the default → omit the key when matching default
    if (bucket === 'good') {
      delete updated.unavailable_batteries_bucket;
    } else {
      updated.unavailable_batteries_bucket = bucket;
    }
    this._fireConfigChanged(updated);
  }

  private _securityActivityPositionChanged(atEnd: boolean): void {
    const updated: Simon42StrategyConfig = { ...this._config };
    // 'start' is the default → omit the key when matching default
    if (atEnd) {
      updated.security_activity_position = 'end';
    } else {
      delete updated.security_activity_position;
    }
    this._config = updated;
    this._fireConfigChanged(updated);
  }

  private _cameraHiddenChanged(entityId: string, visible: boolean): void {
    const hidden = new Set(this._config.hidden_cameras || []);
    if (visible) hidden.delete(entityId);
    else hidden.add(entityId);
    const updated: Simon42StrategyConfig = { ...this._config };
    if (hidden.size === 0) {
      delete updated.hidden_cameras;
    } else {
      updated.hidden_cameras = [...hidden].sort();
    }
    this._config = updated;
    this._fireConfigChanged(updated);
  }

  /** Per-camera visibility for the security view (security-only exclusion). */
  private _renderHiddenCamerasPicker(): TemplateResult {
    if (!this._hass) return html``;
    // Same dedup as the views (one camera per device, preferred stream);
    // Registry is initialized by the dashboard render, this is a no-op.
    Registry.initialize(this._hass, this._config);
    const blocks = collectCameraBlocks(this._hass, this._config);
    if (blocks.length === 0) return html``;

    const hidden = new Set(this._config.hidden_cameras || []);
    return html`
      <div style="margin-left: 26px; margin-bottom: 8px;">
        <div style="font-size: 13px; font-weight: 500; color: var(--primary-text-color); margin-top: 4px; margin-bottom: 4px;">
          ${localize('editor.security_cameras_visibility')}
        </div>
        <div class="description" style="margin-left: 0;">
          ${localize('editor.security_cameras_visibility_desc')}
        </div>
        ${blocks.map((block) => {
          const name =
            (this._hass?.states[block.cameraId]?.attributes?.friendly_name as string | undefined) ||
            block.cameraId;
          return this._renderCheckbox(
            `security-camera-${block.cameraId}`,
            name,
            !hidden.has(block.cameraId),
            (checked) => this._cameraHiddenChanged(block.cameraId, checked)
          );
        })}
      </div>
    `;
  }

  private _renderSecurityExtraEntitiesPicker(): TemplateResult {
    const extras = this._config.security_extra_entities || [];
    const allEntities = getAllEntitiesForSelect(this._hass);
    const entityMap = new Map(allEntities.map((e) => [e.entity_id, e.name]));
    const filtered = getFilteredEntities(this._hass, this._securityExtraSearch);
    return html`
      <div style="font-size: 13px; font-weight: 500; color: var(--primary-text-color); margin-top: 4px; margin-bottom: 4px;">
        ${localize('editor.security_extra_entities')}
      </div>
      <div class="description" style="margin-left: 0; margin-bottom: 8px;">
        ${localize('editor.security_extra_entities_desc')}
      </div>
      ${extras.length > 0 ? html`
        <div class="entity-list-container" style="margin-bottom: 8px;">
          ${extras.map((entityId) => {
            const name = entityMap.get(entityId) || entityId;
            return html`
              <div class="entity-list-item" data-entity-id=${entityId}>
                <span class="item-info">
                  <span class="item-name">${name}</span>
                  <span class="item-entity-id">${entityId}</span>
                </span>
                <button class="btn-remove" @click=${() => this._removeSecurityExtraEntity(entityId)}>&#x2715;</button>
              </div>
            `;
          })}
        </div>
      ` : nothing}
      <div class="entity-search-picker">
        <input type="text" class="entity-search-input"
          placeholder=${localize('editor.select_entity') + '...'}
          .value=${this._securityExtraSearch}
          @input=${(e: Event) => { this._securityExtraSearch = (e.target as HTMLInputElement).value; this.requestUpdate(); }}
          @blur=${() => { setTimeout(() => { this._securityExtraSearch = ''; this.requestUpdate(); }, 200); }}
        />
        ${this._securityExtraSearch.length >= 2 ? html`
          <div class="entity-search-results">
            ${filtered.length > 0
              ? filtered.map((entity) => html`
                <div class="entity-search-result" @mousedown=${(e: Event) => { e.preventDefault(); this._addSecurityExtraEntity(entity.entity_id); this._securityExtraSearch = ''; this.requestUpdate(); }}>
                  <span class="entity-search-name">${entity.name}</span>
                  <span class="entity-search-id">${entity.entity_id}</span>
                </div>
              `)
              : html`<div class="entity-search-no-results">${localize('editor.no_results')}</div>`
            }
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _addSecurityExtraEntity(entityId: string): void {
    const current = this._config.security_extra_entities || [];
    if (current.includes(entityId)) return;
    const updated: Simon42StrategyConfig = { ...this._config, security_extra_entities: [...current, entityId] };
    this._fireConfigChanged(updated);
  }

  private _removeSecurityExtraEntity(entityId: string): void {
    const current = this._config.security_extra_entities || [];
    const next = current.filter((e) => e !== entityId);
    const updated: Simon42StrategyConfig = { ...this._config };
    if (next.length === 0) {
      delete updated.security_extra_entities;
    } else {
      updated.security_extra_entities = next;
    }
    this._fireConfigChanged(updated);
  }

  // -- Weather sensors editor -------------------------------------------
  //
  // Per-row structured editor for the `weather_sensors` config array.
  // Each row binds to a WeatherSensorConfig and exposes inline inputs for
  // icon / unit / round. Adding a row uses the same entity-search picker
  // pattern as favorites; removal is a single-click button.
  //
  // The picker filters to numeric-ish sensors by default but does not hard-
  // restrict — any entity domain is accepted (the markdown row in the
  // section renderer just calls `states(...)` against the id).

  private _renderAreasSection(): TemplateResult {
    const groupByFloors = this._config.group_by_floors === true;
    const showSwitchesOnAreas = this._config.show_switches_on_areas === true;
    const showAlertsOnAreas = this._config.show_alerts_on_areas === true;
    const showWindowAlertsOnAreas = this._config.show_window_alerts_on_areas === true;
    const showLocksInRooms = this._config.show_locks_in_rooms === true;
    const showVacuumsSectionInRooms = this._config.show_vacuums_section_in_rooms === true;
    const showAutomationsInRooms = this._config.show_automations_in_rooms === true;
    const showScriptsInRooms = this._config.show_scripts_in_rooms === true;
    const showUpsInRooms = this._config.show_ups_in_rooms === true;
    const showEnergyInRooms = this._config.show_energy_in_rooms === true;
    // Window / door contact badges default to visible — read as opt-out (!== false).
    const showWindowContactsInRooms = this._config.show_window_contacts_in_rooms !== false;
    const showDoorContactsInRooms = this._config.show_door_contacts_in_rooms !== false;
    const showCamerasInRooms = this._config.show_cameras_in_rooms !== false;
    const useDefaultAreaSort = this._config.use_default_area_sort === true;

    const allAreas = Object.values(this._hass!.areas).sort((a, b) => a.name.localeCompare(b.name));
    const hiddenAreas = this._config.areas_display?.hidden || [];
    const areaOrder = this._config.areas_display?.order || [];
    const navItems = this._config.areas_display?.nav_items || [];

    return html`
      <div class="section">
        <div class="section-title">${localize('editor.section_areas')}</div>

        ${this._renderCheckbox('group-by-floors', localize('editor.group_by_floors'), groupByFloors,
          (checked) => this._toggleChanged('group_by_floors', checked, false))}
        <div class="description">${localize('editor.group_by_floors_desc')}</div>

        ${this._renderCheckbox('show-switches-on-areas', localize('editor.show_switches_on_areas'), showSwitchesOnAreas,
          (checked) => this._toggleChanged('show_switches_on_areas', checked, false))}
        <div class="description">${localize('editor.show_switches_on_areas_desc')}</div>

        ${this._renderCheckbox('show-alerts-on-areas', localize('editor.show_alerts_on_areas'), showAlertsOnAreas,
          (checked) => this._toggleChanged('show_alerts_on_areas', checked, false))}
        <div class="description">${localize('editor.show_alerts_on_areas_desc')}</div>

        ${this._renderCheckbox('show-window-alerts-on-areas', localize('editor.show_window_alerts_on_areas'), showWindowAlertsOnAreas,
          (checked) => this._toggleChanged('show_window_alerts_on_areas', checked, false))}
        <div class="description">${localize('editor.show_window_alerts_on_areas_desc')}</div>

        ${this._renderCheckbox('show-locks-in-rooms', localize('editor.show_locks_in_rooms'), showLocksInRooms,
          (checked) => this._toggleChanged('show_locks_in_rooms', checked, false))}
        <div class="description">${localize('editor.show_locks_in_rooms_desc')}</div>

        ${this._renderCheckbox('show-vacuums-section-in-rooms', localize('editor.show_vacuums_section_in_rooms'), showVacuumsSectionInRooms,
          (checked) => this._toggleChanged('show_vacuums_section_in_rooms', checked, false))}
        <div class="description">${localize('editor.show_vacuums_section_in_rooms_desc')}</div>

        ${this._renderCheckbox('show-automations-in-rooms', localize('editor.show_automations_in_rooms'), showAutomationsInRooms,
          (checked) => this._toggleChanged('show_automations_in_rooms', checked, false))}
        <div class="description">${localize('editor.show_automations_in_rooms_desc')}</div>

        ${this._renderCheckbox('show-scripts-in-rooms', localize('editor.show_scripts_in_rooms'), showScriptsInRooms,
          (checked) => this._toggleChanged('show_scripts_in_rooms', checked, false))}
        <div class="description">${localize('editor.show_scripts_in_rooms_desc')}</div>

        ${this._renderCheckbox('show-ups-in-rooms', localize('editor.show_ups_in_rooms'), showUpsInRooms,
          (checked) => this._toggleChanged('show_ups_in_rooms', checked, false))}
        <div class="description">${localize('editor.show_ups_in_rooms_desc')}</div>

        ${this._renderCheckbox('show-energy-in-rooms', localize('editor.show_energy_in_rooms'), showEnergyInRooms,
          (checked) => this._toggleChanged('show_energy_in_rooms', checked, false))}
        <div class="description">${localize('editor.show_energy_in_rooms_desc')}</div>

        ${this._renderCheckbox('show-window-contacts-in-rooms', localize('editor.show_window_contacts_in_rooms'), showWindowContactsInRooms,
          (checked) => {
            this._toggleChanged('show_window_contacts_in_rooms', checked, true);
            this._refreshAllAreaCaches();
          })}
        <div class="description">${localize('editor.show_window_contacts_in_rooms_desc')}</div>

        ${this._renderCheckbox('show-door-contacts-in-rooms', localize('editor.show_door_contacts_in_rooms'), showDoorContactsInRooms,
          (checked) => {
            this._toggleChanged('show_door_contacts_in_rooms', checked, true);
            this._refreshAllAreaCaches();
          })}
        <div class="description">${localize('editor.show_door_contacts_in_rooms_desc')}</div>

        ${this._renderCheckbox('show-cameras-in-rooms', localize('editor.show_cameras_in_rooms'), showCamerasInRooms,
          (checked) => this._toggleChanged('show_cameras_in_rooms', checked, true))}
        <div class="description">${localize('editor.show_cameras_in_rooms_desc')}</div>
        ${showCamerasInRooms ? html`
          <div style="margin-left: 26px;">
            ${this._renderCheckbox('camera-live-toggle', localize('editor.camera_live_toggle'),
              this._config.camera_live_toggle === true,
              (checked) => this._toggleChanged('camera_live_toggle', checked, false))}
            <div class="description">${localize('editor.camera_live_toggle_desc')}</div>
          </div>
        ` : nothing}
        ${this._renderCheckbox('hide-unavailable-in-rooms', localize('editor.hide_unavailable_in_rooms'),
          this._config.hide_unavailable_in_rooms !== false,
          (checked) => this._toggleChanged('hide_unavailable_in_rooms', checked, true))}
        <div class="description">${localize('editor.hide_unavailable_in_rooms_desc')}</div>

        ${this._renderCheckbox('use-default-area-sort', localize('editor.use_default_area_sort'), useDefaultAreaSort,
          (checked) => this._toggleChanged('use_default_area_sort', checked, false))}
        <div class="description">${localize('editor.use_default_area_sort_desc')}</div>

        <div class="description" style="margin-left: 0; margin-top: 16px; margin-bottom: 12px;">
          ${localize('editor.areas_manage_desc')}
        </div>

        <div class="area-list" id="area-list">
          ${this._renderAreaItems(allAreas, hiddenAreas, areaOrder, navItems)}
        </div>

        <details style="margin-top: 12px;">
          <summary style="cursor: pointer; font-size: 13px; font-weight: 500; color: var(--primary-text-color); padding: 4px 0;">
            ${localize('editor.room_visibility')}
          </summary>
          <div style="margin-left: 14px; margin-top: 6px;">
            <div class="description" style="margin-left: 0; margin-bottom: 8px;">
              ${localize('editor.room_visibility_desc')}
            </div>
            ${allAreas.filter((a) => !hiddenAreas.includes(a.area_id)).map((area) => {
              const rule = this._config.room_visibility?.[area.area_id];
              return html`
                <div style="border: 1px solid var(--divider-color); border-radius: 6px; padding: 8px; margin-bottom: 8px;">
                  <div style="font-weight: 500; margin-bottom: 6px;">${area.name}</div>
                  <div class="form-row">
                    <label for="room-vis-entity-${area.area_id}" style="min-width: 80px; font-size: 12px;">${localize('editor.section_visibility_entity')}</label>
                    <input type="text" id="room-vis-entity-${area.area_id}" style="flex: 1;"
                      placeholder="input_boolean.guest_mode"
                      .value=${rule?.entity || ''}
                      @change=${(e: Event) => this._roomVisibilityChanged(area.area_id, 'entity', (e.target as HTMLInputElement).value)} />
                  </div>
                  <div class="form-row">
                    <label for="room-vis-state-${area.area_id}" style="min-width: 80px; font-size: 12px;">${localize('editor.section_visibility_state')}</label>
                    <input type="text" id="room-vis-state-${area.area_id}" style="flex: 1;"
                      placeholder="on"
                      .value=${rule?.state || ''}
                      @change=${(e: Event) => this._roomVisibilityChanged(area.area_id, 'state', (e.target as HTMLInputElement).value)} />
                  </div>
                </div>
              `;
            })}
          </div>
        </details>
      </div>
    `;
  }

  private _roomVisibilityChanged(areaId: string, field: 'entity' | 'state', value: string): void {
    const updated: Simon42StrategyConfig = { ...this._config };
    const current = { ...(updated.room_visibility || {}) };
    const rule = { ...(current[areaId] || { entity: '', state: '' }) };
    rule[field] = value.trim();
    if (!rule.entity && !rule.state) {
      delete current[areaId];
    } else {
      current[areaId] = rule;
    }
    if (Object.keys(current).length === 0) {
      delete updated.room_visibility;
    } else {
      updated.room_visibility = current;
    }
    this._fireConfigChanged(updated);
  }


  // ====================================================================
  // ITEM RENDERERS
  // ====================================================================

  _renderCheckbox(
    id: string,
    label: string,
    checked: boolean,
    onChange: (checked: boolean) => void,
    disabled = false
  ): TemplateResult {
    return html`
      <div class="form-row">
        <input type="checkbox" id=${id}
          ?checked=${checked}
          ?disabled=${disabled}
          @change=${(e: Event) => onChange((e.target as HTMLInputElement).checked)} />
        <label for=${id} class=${disabled ? 'disabled-label' : ''}>${label}</label>
      </div>
    `;
  }

  // ====================================================================
  // AREA RENDERERS
  // ====================================================================

  private _renderAreaItems(
    allAreas: AreaRegistryEntry[],
    hiddenAreas: string[],
    areaOrder: string[],
    navItems: string[]
  ): TemplateResult | TemplateResult[] {
    if (allAreas.length === 0) {
      return html`<div class="empty-state">${localize('editor.no_areas')}</div>`;
    }

    // Sort areas by configured order
    const sortedAreas = [...allAreas].sort((a, b) => {
      const orderA = areaOrder.indexOf(a.area_id);
      const orderB = areaOrder.indexOf(b.area_id);
      const effectiveA = orderA !== -1 ? orderA : 9999 + allAreas.indexOf(a);
      const effectiveB = orderB !== -1 ? orderB : 9999 + allAreas.indexOf(b);
      return effectiveA - effectiveB;
    });

    return sortedAreas.map((area) => {
      const isHidden = hiddenAreas.includes(area.area_id);
      const isExpanded = this._expandedAreas.has(area.area_id);
      const cachedData = this._areaEntitiesCache.get(area.area_id);
      const isPinned = navItems.includes(area.area_id);

      return html`
        <div class="area-item"
          data-area-id=${area.area_id}
          draggable="true"
          @dragstart=${this._handleDragStart}
          @dragend=${this._handleDragEnd}
          @dragover=${this._handleDragOver}
          @dragleave=${this._handleDragLeave}
          @drop=${this._handleDrop}>
          <div class="area-header">
            <span class="drag-handle" draggable="true">&#x2630;</span>
            <input type="checkbox" class="area-checkbox"
              data-area-id=${area.area_id}
              ?checked=${!isHidden}
              @change=${(e: Event) => this._areaVisibilityChanged(area.area_id, (e.target as HTMLInputElement).checked)} />
            <span class="area-name">${area.name}</span>
            ${area.icon ? html`<ha-icon class="area-icon" icon=${area.icon}></ha-icon>` : nothing}
            <button class="nav-pin-button ${isPinned ? 'pinned' : ''}"
              title="${localize('editor.area_pin_nav')}"
              ?disabled=${isHidden}
              @click=${(e: Event) => { e.stopPropagation(); this._areaNavPinChanged(area.area_id, !isPinned); }}>
              <ha-icon icon="${isPinned ? 'mdi:pin' : 'mdi:pin-outline'}"></ha-icon>
            </button>
            <button class="expand-button ${isExpanded ? 'expanded' : ''}"
              data-area-id=${area.area_id}
              ?disabled=${isHidden}
              @click=${(e: Event) => this._toggleAreaExpand(e, area.area_id)}>
              <span class="expand-icon">&#x25B6;</span>
            </button>
          </div>
          ${isExpanded
            ? html`
              <div class="area-content" data-area-id=${area.area_id}>
                ${cachedData
                  ? html`
                    ${this._renderAreaEntities(area.area_id, cachedData)}
                    ${this._renderStackOrderPanel(area.area_id, cachedData)}
                  `
                  : html`<div class="loading-placeholder">${localize('editor.loading_entities')}</div>`}
                ${this._renderAreaCustomSections(area.area_id)}
              </div>
            `
            : nothing}
        </div>
      `;
    });
  }

  private _renderAreaEntities(
    areaId: string,
    data: NonNullable<ReturnType<typeof this._areaEntitiesCache.get>>
  ): TemplateResult {
    const {
      groupedEntities,
      hiddenEntities,
      badgeCandidates,
      additionalBadges,
      availableEntities,
      defaultShowNames,
      namesVisible,
      namesHidden,
    } = data;

    const hass = this._hass!;

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
      { key: 'cameras', label: localize('editor.domain_cameras'), icon: 'mdi:cctv' },
      { key: 'ups', label: localize('editor.domain_ups'), icon: 'mdi:power-plug-battery' },
      { key: 'energy', label: localize('editor.domain_energy'), icon: 'mdi:lightning-bolt' },
    ];

    // Cameras/UPS/energy can be toggled per room only while the global
    // toggle is on — when it's off, the group stays visible but greyed out
    // so users see WHY the block is missing instead of it silently vanishing.
    const groupDisabledByGlobalToggle = new Map<string, boolean>([
      ['cameras', this._config.show_cameras_in_rooms === false],
      ['ups', this._config.show_ups_in_rooms !== true],
      ['energy', this._config.show_energy_in_rooms !== true],
    ]);

    const hasEntities = domainGroups.some((g) => (groupedEntities[g.key]?.length ?? 0) > 0);
    const hasBadges = (badgeCandidates?.length ?? 0) > 0 || (additionalBadges?.length ?? 0) > 0;

    if (!hasEntities && !hasBadges) {
      return html`<div class="empty-state">${localize('editor.no_entities_in_area')}</div>`;
    }

    const expandedGroups = this._expandedGroups.get(areaId) || new Set<string>();

    return html`
      <div class="entity-groups">
        ${domainGroups.map((group) => {
          const entities = groupedEntities[group.key] as string[] | undefined;
          if (!entities || entities.length === 0) return nothing;

          const hiddenInGroup = (hiddenEntities[group.key] || []) as string[];
          const allHidden = entities.every((e) => hiddenInGroup.includes(e));
          const someHidden = entities.some((e) => hiddenInGroup.includes(e)) && !allHidden;
          const isGroupExpanded = expandedGroups.has(group.key);
          const isGroupDisabled = groupDisabledByGlobalToggle.get(group.key) === true;

          return html`
            <div class="entity-group ${isGroupDisabled ? 'disabled' : ''}" data-group=${group.key}
              title=${isGroupDisabled
                ? localize(group.key === 'cameras' ? 'editor.domain_cameras_disabled_hint' : 'editor.domain_group_disabled_hint')
                : ''}>
              <div class="entity-group-header"
                @click=${() => this._toggleGroupExpand(areaId, group.key)}>
                <input type="checkbox" class="group-checkbox"
                  data-area-id=${areaId}
                  data-group=${group.key}
                  ?disabled=${isGroupDisabled}
                  ?checked=${!allHidden && !isGroupDisabled}
                  .indeterminate=${someHidden && !isGroupDisabled}
                  @click=${(e: Event) => e.stopPropagation()}
                  @change=${(e: Event) => {
                    e.stopPropagation();
                    const checked = (e.target as HTMLInputElement).checked;
                    this._groupVisibilityChanged(areaId, group.key, checked, entities);
                  }} />
                <ha-icon icon=${group.icon}></ha-icon>
                <span class="group-name">${group.label}</span>
                <span class="entity-count">(${entities.length})</span>
                <button class="expand-button-small ${isGroupExpanded ? 'expanded' : ''}"
                  @click=${(e: Event) => { e.stopPropagation(); this._toggleGroupExpand(areaId, group.key); }}>
                  <span class="expand-icon-small">&#x25B6;</span>
                </button>
              </div>
              ${isGroupExpanded
                ? html`
                  <div class="entity-list" data-area-id=${areaId} data-group=${group.key}>
                    ${entities.map((entityId) => {
                      const stateObj = hass.states[entityId];
                      const name = stateObj?.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
                      const isEntityHidden = hiddenInGroup.includes(entityId);
                      return html`
                        <div class="entity-item">
                          <input type="checkbox" class="entity-checkbox"
                            ?disabled=${isGroupDisabled}
                            ?checked=${!isEntityHidden && !isGroupDisabled}
                            @change=${(e: Event) => this._entityVisibilityChanged(areaId, group.key, entityId, (e.target as HTMLInputElement).checked)} />
                          <span class="entity-name">${name}</span>
                          <span class="entity-id">${entityId}</span>
                        </div>
                      `;
                    })}
                  </div>
                `
                : nothing}
            </div>
          `;
        })}
        ${hasBadges
          ? this._renderBadgeGroup(areaId, badgeCandidates, additionalBadges, availableEntities, hiddenEntities, defaultShowNames, namesVisible, namesHidden, expandedGroups)
          : nothing}
      </div>
    `;
  }

  private _renderBadgeGroup(
    areaId: string,
    badgeCandidates: string[],
    additionalBadges: string[],
    availableEntities: Array<{ entity_id: string; name: string }>,
    hiddenEntities: Record<string, string[]>,
    defaultShowNames: Set<string>,
    namesVisible: string[],
    namesHidden: string[],
    expandedGroups: Set<string>
  ): TemplateResult {
    const hass = this._hass!;
    const totalCount = badgeCandidates.length + additionalBadges.length;
    if (totalCount === 0) return html``;

    const hiddenInBadges = hiddenEntities['badges'] || [];
    const allHidden = badgeCandidates.length > 0 && badgeCandidates.every((e) => hiddenInBadges.includes(e));
    const someHidden = badgeCandidates.some((e) => hiddenInBadges.includes(e)) && !allHidden;

    const namesVisibleSet = new Set(namesVisible || []);
    const namesHiddenSet = new Set(namesHidden || []);

    const isNameShown = (entityId: string): boolean =>
      resolveShowName(entityId, defaultShowNames.has(entityId), namesVisibleSet, namesHiddenSet);

    const isGroupExpanded = expandedGroups.has('badges');

    return html`
      <div class="entity-group" data-group="badges">
        <div class="entity-group-header"
          @click=${() => this._toggleGroupExpand(areaId, 'badges')}>
          <input type="checkbox" class="group-checkbox"
            data-area-id=${areaId}
            data-group="badges"
            ?checked=${!allHidden}
            .indeterminate=${someHidden}
            @click=${(e: Event) => e.stopPropagation()}
            @change=${(e: Event) => {
              e.stopPropagation();
              const checked = (e.target as HTMLInputElement).checked;
              this._groupVisibilityChanged(areaId, 'badges', checked, badgeCandidates);
            }} />
          <ha-icon icon="mdi:checkbox-multiple-blank-circle"></ha-icon>
          <span class="group-name">${localize('editor.domain_badges')}</span>
          <span class="entity-count">(${totalCount})</span>
          <button class="expand-button-small ${isGroupExpanded ? 'expanded' : ''}"
            @click=${(e: Event) => { e.stopPropagation(); this._toggleGroupExpand(areaId, 'badges'); }}>
            <span class="expand-icon-small">&#x25B6;</span>
          </button>
        </div>
        ${isGroupExpanded
          ? html`
            <div class="entity-list" data-area-id=${areaId} data-group="badges">
              ${badgeCandidates.map((entityId) => {
                const stateObj = hass.states[entityId];
                const name = stateObj?.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
                const isHidden = hiddenInBadges.includes(entityId);
                const showName = isNameShown(entityId);

                return html`
                  <div class="entity-item">
                    <input type="checkbox" class="entity-checkbox"
                      ?checked=${!isHidden}
                      @change=${(e: Event) => this._entityVisibilityChanged(areaId, 'badges', entityId, (e.target as HTMLInputElement).checked)} />
                    <span class="entity-name">${name}</span>
                    <input type="checkbox" class="badge-name-checkbox"
                      ?checked=${showName}
                      title=${localize('editor.badges_show_name')}
                      @change=${(e: Event) => this._badgeShowNameChanged(areaId, entityId, (e.target as HTMLInputElement).checked)} />
                    <span class="badge-name-label">${localize('editor.badges_name_short')}</span>
                    <span class="entity-id">${entityId}</span>
                  </div>
                `;
              })}

              ${additionalBadges.length > 0
                ? html`
                  <div class="badge-separator">${localize('editor.badges_additional')}</div>
                  ${additionalBadges.map((entityId) => {
                    const stateObj = hass.states[entityId];
                    const name = stateObj?.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
                    const showName = isNameShown(entityId);

                    return html`
                      <div class="entity-item badge-additional-item">
                        <span class="entity-name">${name}</span>
                        <input type="checkbox" class="badge-name-checkbox"
                          ?checked=${showName}
                          title=${localize('editor.badges_show_name')}
                          @change=${(e: Event) => this._badgeShowNameChanged(areaId, entityId, (e.target as HTMLInputElement).checked)} />
                        <span class="badge-name-label">${localize('editor.badges_name_short')}</span>
                        <span class="entity-id">${entityId}</span>
                        <button class="badge-remove-btn"
                          title=${localize('editor.badges_remove')}
                          @click=${() => this._badgeAdditionalChanged(areaId, entityId, false)}>&#x2715;</button>
                      </div>
                    `;
                  })}
                `
                : nothing}

              ${availableEntities.length > 0
                ? html`
                  <div class="badge-add-section">
                    <select class="badge-entity-picker" data-area-id=${areaId}>
                      <option value="">${localize('editor.badges_select_entity')}</option>
                      ${availableEntities.map((e) => html`
                        <option value=${e.entity_id}>${e.name} (${e.entity_id})</option>
                      `)}
                    </select>
                    <button class="badge-add-button"
                      @click=${(e: Event) => this._addBadgeFromPicker(e, areaId)}>
                      ${localize('editor.badges_add')}
                    </button>
                  </div>
                `
                : nothing}
            </div>
          `
          : nothing}
      </div>
    `;
  }

  // ====================================================================
  // AREA ENTITY LOADING
  // ====================================================================

  private async _loadAreaEntities(areaId: string): Promise<void> {
    if (!this._hass) return;

    const groupedEntities = await getAreaGroupedEntities(areaId, this._hass);
    const hiddenEntities = getHiddenEntitiesForArea(areaId, this._config);
    const entityOrders = getEntityOrdersForArea(areaId, this._config);
    const badgeCandidates = getAreaBadgeCandidates(areaId, this._hass, this._config);
    const additionalBadges = getAdditionalBadgesForArea(areaId, this._config);
    const availableEntities = getAvailableBadgeEntities(areaId, this._hass, badgeCandidates, additionalBadges);
    const defaultShowNames = getDefaultShowNameEntities(badgeCandidates, this._hass);
    const { namesVisible, namesHidden } = getBadgeNamesConfig(areaId, this._config);

    this._areaEntitiesCache.set(areaId, {
      groupedEntities,
      hiddenEntities,
      entityOrders,
      badgeCandidates,
      additionalBadges,
      availableEntities,
      defaultShowNames,
      namesVisible,
      namesHidden,
    });

    this.requestUpdate();
  }

  /** Re-derive cached per-area data for all loaded areas (e.g. after a global toggle changed) */
  _refreshAllAreaCaches(): void {
    for (const areaId of this._areaEntitiesCache.keys()) {
      this._refreshAreaCache(areaId);
    }
  }

  _refreshAreaCache(areaId: string): void {
    if (!this._hass || !this._areaEntitiesCache.has(areaId)) return;

    const groupedEntities = this._areaEntitiesCache.get(areaId)!.groupedEntities;
    const hiddenEntities = getHiddenEntitiesForArea(areaId, this._config);
    const entityOrders = getEntityOrdersForArea(areaId, this._config);
    const badgeCandidates = getAreaBadgeCandidates(areaId, this._hass, this._config);
    const additionalBadges = getAdditionalBadgesForArea(areaId, this._config);
    const availableEntities = getAvailableBadgeEntities(areaId, this._hass, badgeCandidates, additionalBadges);
    const defaultShowNames = getDefaultShowNameEntities(badgeCandidates, this._hass);
    const { namesVisible, namesHidden } = getBadgeNamesConfig(areaId, this._config);

    this._areaEntitiesCache.set(areaId, {
      groupedEntities,
      hiddenEntities,
      entityOrders,
      badgeCandidates,
      additionalBadges,
      availableEntities,
      defaultShowNames,
      namesVisible,
      namesHidden,
    });
  }

  // ====================================================================
  // EVENT HANDLERS — Toggle / Config changes
  // ====================================================================

  /** lights_sort_by is an enum with a boolean-shaped editor toggle:
   *  checked → 'name', unchecked → remove (default 'last_changed'). */
  private _lightsSortByChanged(checked: boolean): void {
    const newConfig: Simon42StrategyConfig = { ...this._config };
    if (checked) {
      newConfig.lights_sort_by = 'name';
    } else {
      delete newConfig.lights_sort_by;
    }
    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _toggleChanged(key: string, value: boolean, defaultValue: boolean): void {
    if (!this._hass) return;

    const newConfig: Simon42StrategyConfig = {
      ...this._config,
      [key]: value,
    };

    // Remove property when set to default
    if (value === defaultValue) {
      delete (newConfig as any)[key];
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _summariesColumnsChanged(columns: 2 | 4): void {
    if (!this._hass) return;

    const newConfig: Simon42StrategyConfig = {
      ...this._config,
      summaries_columns: columns,
    };

    if (columns === 2) {
      delete newConfig.summaries_columns;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _batteryCriticalChanged(e: Event): void {
    const value = parseInt((e.target as HTMLInputElement).value, 10);
    if (isNaN(value) || value < 1 || value > 99) return;
    const newConfig: Simon42StrategyConfig = { ...this._config, battery_critical_threshold: value };
    if (value === 20) delete newConfig.battery_critical_threshold;
    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _batteryLowChanged(e: Event): void {
    const value = parseInt((e.target as HTMLInputElement).value, 10);
    if (isNaN(value) || value < 1 || value > 99) return;
    const newConfig: Simon42StrategyConfig = { ...this._config, battery_low_threshold: value };
    if (value === 50) delete newConfig.battery_low_threshold;
    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  // -- Favorites --------------------------------------------------------

  // -- Room Pins --------------------------------------------------------

  // -- Custom Views -----------------------------------------------------

  // -- Custom Cards -----------------------------------------------------

  // -- Custom Sections ----------------------------------------------------

  // -- Area Custom Sections (per room view) -------------------------------

  private _getAreaCustomSections(areaId: string): AreaCustomSection[] {
    return this._config.areas_options?.[areaId]?.custom_sections || [];
  }

  /** Writes the custom_sections list for one area, pruning empty objects
   *  (same cleanup pattern as the groups_options writers). */
  private _setAreaCustomSections(areaId: string, sections: AreaCustomSection[]): void {
    const currentAreaOptions = this._config.areas_options?.[areaId] || {};

    const newAreaOptions: Record<string, any> = { ...currentAreaOptions };
    if (sections.length === 0) {
      delete newAreaOptions.custom_sections;
    } else {
      newAreaOptions.custom_sections = sections;
    }

    const newAreasOptions: Record<string, any> = {
      ...this._config.areas_options,
      [areaId]: newAreaOptions,
    };
    if (Object.keys(newAreasOptions[areaId]).length === 0) {
      delete newAreasOptions[areaId];
    }

    const newConfig: Simon42StrategyConfig = {
      ...this._config,
      areas_options: newAreasOptions,
    };
    if (newConfig.areas_options && Object.keys(newConfig.areas_options).length === 0) {
      delete newConfig.areas_options;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _addAreaCustomSection(areaId: string): void {
    const sections = [...this._getAreaCustomSections(areaId)];
    sections.push({ yaml: '', parsed_config: undefined } as AreaCustomSection);
    this._setAreaCustomSections(areaId, sections);
  }

  private _removeAreaCustomSection(areaId: string, index: number): void {
    const sections = [...this._getAreaCustomSections(areaId)];
    sections.splice(index, 1);
    this._setAreaCustomSections(areaId, sections);
  }

  private _updateAreaCustomSectionPosition(areaId: string, index: number, value: string): void {
    const sections = [...this._getAreaCustomSections(areaId)];
    if (!sections[index]) return;
    sections[index] = { ...sections[index], position: value === 'top' ? 'top' : 'bottom' };
    this._setAreaCustomSections(areaId, sections);
  }

  private _updateAreaCustomSectionYaml(areaId: string, index: number, yamlString: string): void {
    const sections = [...this._getAreaCustomSections(areaId)];
    if (!sections[index]) return;

    const updated: AreaCustomSection = { ...sections[index], yaml: yamlString };
    delete updated._yaml_error;

    if (yamlString.trim()) {
      try {
        const parsed = yaml.load(yamlString);
        if (parsed && typeof parsed === 'object') {
          // complete section, single card or card list — normalized at build time
          updated.parsed_config = parsed;
        } else {
          updated._yaml_error = localize('editor.custom_section_yaml_invalid');
          updated.parsed_config = undefined;
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message.split('\n')[0] : 'Ungültiges YAML';
        updated._yaml_error = message || 'Ungültiges YAML';
        updated.parsed_config = undefined;
      }
    } else {
      updated.parsed_config = undefined;
    }

    sections[index] = updated;
    this._setAreaCustomSections(areaId, sections);
  }

  private _renderAreaCustomSections(areaId: string): TemplateResult {
    const sections = this._getAreaCustomSections(areaId);

    return html`
      <div class="area-custom-sections" style="margin-top: 12px;">
        <div style="font-weight: 500; margin-bottom: 4px;">${localize('editor.area_custom_sections')}</div>
        <div class="description" style="margin-bottom: 8px;">${localize('editor.area_custom_sections_desc')}</div>
        ${sections.map((section, index) => this._renderAreaCustomSectionItem(areaId, section, index))}
        <button class="btn-primary" @click=${() => this._addAreaCustomSection(areaId)}>
          ${localize('editor.add_custom_section')}
        </button>
      </div>
    `;
  }

  private _renderAreaCustomSectionItem(
    areaId: string,
    section: AreaCustomSection,
    index: number
  ): TemplateResult {
    const yamlMsg = section._yaml_error
      ? html`<span style="color: var(--error-color);">&#x274C; ${section._yaml_error}</span>`
      : section.yaml
        ? html`<span style="color: var(--success-color, green);">&#x2705; ${localize('editor.yaml_valid')}</span>`
        : nothing;
    const position = section.position === 'top' ? 'top' : 'bottom';

    return html`
      <div class="custom-item" data-index=${index}>
        <div class="custom-item-header">
          <strong>${section.heading || localize('editor.new_section')}</strong>
          <button class="btn-remove" @click=${() => this._removeAreaCustomSection(areaId, index)}>&#x2715;</button>
        </div>
        <div class="custom-item-fields">
          <div class="custom-item-row">
            <select style="flex: 1;"
              @change=${(e: Event) => this._updateAreaCustomSectionPosition(areaId, index, (e.target as HTMLSelectElement).value)}>
              <option value="bottom" ?selected=${position === 'bottom'}>${localize('editor.custom_section_position_bottom')}</option>
              <option value="top" ?selected=${position === 'top'}>${localize('editor.custom_section_position_top')}</option>
            </select>
          </div>
          <textarea rows="8" placeholder=${localize('editor.custom_section_yaml_placeholder')}
            .value=${section.yaml || ''}
            style="width: 100%;"
            @change=${(e: Event) => this._updateAreaCustomSectionYaml(areaId, index, (e.target as HTMLTextAreaElement).value)}></textarea>
          <div class="custom-item-validation">
            ${yamlMsg}
          </div>
        </div>
      </div>
    `;
  }

  // -- Custom Badges ----------------------------------------------------

  // ====================================================================
  // AREA MANAGEMENT
  // ====================================================================

  private _areaVisibilityChanged(areaId: string, isVisible: boolean): void {
    if (!this._hass) return;

    let hiddenAreas = [...(this._config.areas_display?.hidden || [])];

    if (isVisible) {
      hiddenAreas = hiddenAreas.filter((id) => id !== areaId);
    } else {
      if (!hiddenAreas.includes(areaId)) {
        hiddenAreas.push(areaId);
      }
      // Collapse area when hidden
      this._expandedAreas.delete(areaId);
      this._expandedGroups.delete(areaId);
      this._areaEntitiesCache.delete(areaId);
    }

    const newConfig: Simon42StrategyConfig = {
      ...this._config,
      areas_display: {
        ...this._config.areas_display,
        hidden: hiddenAreas,
      },
    };

    if (newConfig.areas_display?.hidden?.length === 0) {
      delete newConfig.areas_display.hidden;
    }
    if (newConfig.areas_display && Object.keys(newConfig.areas_display).length === 0) {
      delete newConfig.areas_display;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _areaNavPinChanged(areaId: string, isPinned: boolean): void {
    let navItems = [...(this._config.areas_display?.nav_items || [])];

    if (isPinned) {
      if (!navItems.includes(areaId)) navItems.push(areaId);
    } else {
      navItems = navItems.filter((id) => id !== areaId);
    }

    const newConfig: Simon42StrategyConfig = {
      ...this._config,
      areas_display: { ...this._config.areas_display, nav_items: navItems },
    };

    if (newConfig.areas_display?.nav_items?.length === 0) delete newConfig.areas_display.nav_items;
    if (newConfig.areas_display && Object.keys(newConfig.areas_display).length === 0) delete newConfig.areas_display;

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _toggleAreaExpand(e: Event, areaId: string): void {
    e.stopPropagation();

    const newExpandedAreas = new Set(this._expandedAreas);

    if (newExpandedAreas.has(areaId)) {
      newExpandedAreas.delete(areaId);
      const newExpandedGroups = new Map(this._expandedGroups);
      newExpandedGroups.delete(areaId);
      this._expandedGroups = newExpandedGroups;
    } else {
      newExpandedAreas.add(areaId);
      // Load entities if not cached
      if (!this._areaEntitiesCache.has(areaId)) {
        void this._loadAreaEntities(areaId);
      }
    }

    this._expandedAreas = newExpandedAreas;
  }

  private _toggleGroupExpand(areaId: string, groupKey: string): void {
    const newExpandedGroups = new Map(this._expandedGroups);
    const areaGroups = new Set(newExpandedGroups.get(areaId) || []);

    if (areaGroups.has(groupKey)) {
      areaGroups.delete(groupKey);
    } else {
      areaGroups.add(groupKey);
    }

    if (areaGroups.size > 0) {
      newExpandedGroups.set(areaId, areaGroups);
    } else {
      newExpandedGroups.delete(areaId);
    }

    this._expandedGroups = newExpandedGroups;
  }

  private _groupVisibilityChanged(areaId: string, group: string, isVisible: boolean, entities: string[]): void {
    if (!this._hass) return;

    const currentAreaOptions = this._config.areas_options?.[areaId] || {};
    const currentGroupsOptions = currentAreaOptions.groups_options || {};
    const currentGroupOptions = currentGroupsOptions[group] as Record<string, any> | undefined;
    let hiddenEntities = [...(currentGroupOptions?.hidden || [])];

    if (isVisible) {
      hiddenEntities = hiddenEntities.filter((e) => !entities.includes(e));
    } else {
      hiddenEntities = [...new Set([...hiddenEntities, ...entities])];
    }

    this._updateEntityConfig(areaId, group, hiddenEntities);
  }

  private _entityVisibilityChanged(areaId: string, group: string, entityId: string, isVisible: boolean): void {
    if (!this._hass) return;

    // Handle badge additional entities
    if (group === 'badges_additional') {
      this._badgeAdditionalChanged(areaId, entityId, isVisible);
      return;
    }

    // Handle badge show_name toggle
    if (group === 'badges_show_name') {
      this._badgeShowNameChanged(areaId, entityId, isVisible);
      return;
    }

    const currentAreaOptions = this._config.areas_options?.[areaId] || {};
    const currentGroupsOptions = currentAreaOptions.groups_options || {};
    const currentGroupOptions = currentGroupsOptions[group] as Record<string, any> | undefined;
    let hiddenEntities = [...(currentGroupOptions?.hidden || [])];

    if (isVisible) {
      hiddenEntities = hiddenEntities.filter((e) => e !== entityId);
    } else {
      if (!hiddenEntities.includes(entityId)) {
        hiddenEntities.push(entityId);
      }
    }

    this._updateEntityConfig(areaId, group, hiddenEntities);
  }

  private _updateEntityConfig(areaId: string, group: string, hiddenEntities: string[]): void {
    const currentAreaOptions = this._config.areas_options?.[areaId] || {};
    const currentGroupsOptions = currentAreaOptions.groups_options || {};
    const currentGroupOptions = currentGroupsOptions[group] as Record<string, any> | undefined;

    const newGroupOptions: Record<string, any> = {
      ...currentGroupOptions,
      hidden: hiddenEntities,
    };

    if (newGroupOptions.hidden.length === 0) {
      delete newGroupOptions.hidden;
    }

    const newGroupsOptions: Record<string, any> = {
      ...currentGroupsOptions,
      [group]: newGroupOptions,
    };

    if (Object.keys(newGroupsOptions[group]).length === 0) {
      delete newGroupsOptions[group];
    }

    const newAreaOptions: Record<string, any> = {
      ...currentAreaOptions,
      groups_options: newGroupsOptions,
    };

    if (Object.keys(newAreaOptions.groups_options).length === 0) {
      delete newAreaOptions.groups_options;
    }

    const newAreasOptions: Record<string, any> = {
      ...this._config.areas_options,
      [areaId]: newAreaOptions,
    };

    if (Object.keys(newAreasOptions[areaId]).length === 0) {
      delete newAreasOptions[areaId];
    }

    const newConfig: Simon42StrategyConfig = {
      ...this._config,
      areas_options: newAreasOptions,
    };

    if (newConfig.areas_options && Object.keys(newConfig.areas_options).length === 0) {
      delete newConfig.areas_options;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);

    // Refresh cached data so re-render picks up the changes
    this._refreshAreaCache(areaId);
  }

  // -- Badge additional and show_name -----------------------------------

  private _badgeAdditionalChanged(areaId: string, entityId: string, isAdd: boolean): void {
    if (!this._config) return;

    const currentAreaOptions = this._config.areas_options?.[areaId] || {};
    const currentGroupsOptions = currentAreaOptions.groups_options || {};
    const currentBadgeOptions = currentGroupsOptions['badges'] || {};

    let additional = [...(currentBadgeOptions.additional || [])];

    if (isAdd) {
      if (!additional.includes(entityId)) additional.push(entityId);
    } else {
      additional = additional.filter((e) => e !== entityId);
    }

    const newBadgeOptions: Record<string, any> = { ...currentBadgeOptions };
    if (additional.length > 0) {
      newBadgeOptions.additional = additional;
    } else {
      delete newBadgeOptions.additional;
    }

    const newGroupsOptions: Record<string, any> = {
      ...currentGroupsOptions,
      badges: newBadgeOptions,
    };

    if (Object.keys(newGroupsOptions.badges).length === 0) {
      delete newGroupsOptions.badges;
    }

    const newAreaOptions: Record<string, any> = {
      ...currentAreaOptions,
      groups_options: newGroupsOptions,
    };

    if (Object.keys(newAreaOptions.groups_options).length === 0) {
      delete newAreaOptions.groups_options;
    }

    const newAreasOptions: Record<string, any> = {
      ...this._config.areas_options,
      [areaId]: newAreaOptions,
    };

    if (Object.keys(newAreasOptions[areaId]).length === 0) {
      delete newAreasOptions[areaId];
    }

    const newConfig: Simon42StrategyConfig = {
      ...this._config,
      areas_options: newAreasOptions,
    };

    if (newConfig.areas_options && Object.keys(newConfig.areas_options).length === 0) {
      delete newConfig.areas_options;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);

    // Refresh cached data
    this._refreshAreaCache(areaId);
  }

  private _badgeShowNameChanged(areaId: string, entityId: string, showName: boolean): void {
    if (!this._config || !this._hass) return;

    const currentAreaOptions = this._config.areas_options?.[areaId] || {};
    const currentGroupsOptions = currentAreaOptions.groups_options || {};
    const currentBadgeOptions = currentGroupsOptions['badges'] || {};

    let namesVisible = [...(currentBadgeOptions.names_visible || [])];
    let namesHidden = [...(currentBadgeOptions.names_hidden || [])];

    const stateObj = this._hass.states[entityId];
    const dc = stateObj?.attributes?.device_class as string | undefined;
    const defaultShowName = isDefaultShowName(dc);

    if (showName === defaultShowName) {
      namesVisible = namesVisible.filter((e) => e !== entityId);
      namesHidden = namesHidden.filter((e) => e !== entityId);
    } else if (showName) {
      if (!namesVisible.includes(entityId)) namesVisible.push(entityId);
      namesHidden = namesHidden.filter((e) => e !== entityId);
    } else {
      namesVisible = namesVisible.filter((e) => e !== entityId);
      if (!namesHidden.includes(entityId)) namesHidden.push(entityId);
    }

    const newBadgeOptions: Record<string, any> = { ...currentBadgeOptions };
    if (namesVisible.length > 0) newBadgeOptions.names_visible = namesVisible;
    else delete newBadgeOptions.names_visible;
    if (namesHidden.length > 0) newBadgeOptions.names_hidden = namesHidden;
    else delete newBadgeOptions.names_hidden;

    const newGroupsOptions: Record<string, any> = { ...currentGroupsOptions, badges: newBadgeOptions };
    if (Object.keys(newGroupsOptions.badges).length === 0) delete newGroupsOptions.badges;

    const newAreaOptions: Record<string, any> = { ...currentAreaOptions, groups_options: newGroupsOptions };
    if (Object.keys(newAreaOptions.groups_options).length === 0) delete newAreaOptions.groups_options;

    const newAreasOptions: Record<string, any> = { ...this._config.areas_options, [areaId]: newAreaOptions };
    if (Object.keys(newAreasOptions[areaId]).length === 0) delete newAreasOptions[areaId];

    const newConfig: Simon42StrategyConfig = { ...this._config, areas_options: newAreasOptions };
    if (newConfig.areas_options && Object.keys(newConfig.areas_options).length === 0) delete newConfig.areas_options;

    this._config = newConfig;
    this._fireConfigChanged(newConfig);

    // Refresh cached data
    this._refreshAreaCache(areaId);
  }

  private _addBadgeFromPicker(e: Event, areaId: string): void {
    e.stopPropagation();
    const picker = this.shadowRoot!.querySelector(
      `.badge-entity-picker[data-area-id="${areaId}"]`
    ) as HTMLSelectElement | null;
    if (!picker || !picker.value) return;

    const entityId = picker.value;
    this._badgeAdditionalChanged(areaId, entityId, true);
    picker.value = '';
  }

  // ====================================================================
  // DRAG AND DROP
  // ====================================================================

  private _handleDragStart = (ev: DragEvent): void => {
    const dragHandle = (ev.target as HTMLElement).closest('.drag-handle');
    if (!dragHandle) {
      ev.preventDefault();
      return;
    }

    const areaItem = (ev.target as HTMLElement).closest('.area-item') as HTMLElement | null;
    if (!areaItem) {
      ev.preventDefault();
      return;
    }

    areaItem.classList.add('dragging');
    if (ev.dataTransfer) {
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('text/plain', areaItem.dataset.areaId || '');
    }
    this._draggedElement = areaItem;
  };

  private _handleDragEnd = (ev: DragEvent): void => {
    const areaItem = (ev.target as HTMLElement).closest('.area-item') as HTMLElement | null;
    if (areaItem) {
      areaItem.classList.remove('dragging');
    }

    // Remove all drag-over classes
    const areaList = this.shadowRoot!.querySelector('#area-list');
    if (areaList) {
      areaList.querySelectorAll('.area-item').forEach((item) => {
        item.classList.remove('drag-over');
      });
    }
  };

  private _handleDragOver = (ev: DragEvent): void => {
    ev.preventDefault();
    ev.dataTransfer!.dropEffect = 'move';

    const item = (ev.currentTarget as HTMLElement);
    if (item !== this._draggedElement) {
      item.classList.add('drag-over');
    }
  };

  private _handleDragLeave = (ev: DragEvent): void => {
    (ev.currentTarget as HTMLElement).classList.remove('drag-over');
  };

  private _handleDrop = (ev: DragEvent): void => {
    ev.stopPropagation();
    ev.preventDefault();

    const dropTarget = ev.currentTarget as HTMLElement;
    dropTarget.classList.remove('drag-over');

    if (!this._draggedElement || this._draggedElement === dropTarget) return;

    const draggedAreaId = this._draggedElement.dataset.areaId;
    const dropAreaId = dropTarget.dataset.areaId;
    if (!draggedAreaId || !dropAreaId) return;

    // Compute new order from current config state (NOT from DOM)
    const currentOrder = this._getAreaOrder();
    const draggedIndex = currentOrder.indexOf(draggedAreaId);
    const dropIndex = currentOrder.indexOf(dropAreaId);
    if (draggedIndex === -1 || dropIndex === -1) return;

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedAreaId);

    this._updateAreaOrder(newOrder);
  };

  private _getAreaOrder(): string[] {
    if (!this._hass) return [];
    const configOrder = this._config.areas_display?.order;
    if (configOrder && configOrder.length > 0) return [...configOrder];
    return Object.keys(this._hass.areas || {});
  }

  private _updateAreaOrder(newOrder: string[]): void {

    const newConfig: Simon42StrategyConfig = {
      ...this._config,
      areas_display: {
        ...this._config.areas_display,
        order: newOrder,
      },
    };

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  // ====================================================================
  // ENTITY LIST DRAG & DROP (Favorites / Room Pins)
  // ====================================================================

  _entityDraggedId: string | null = null;

  // ====================================================================
  // CONFIG DISPATCH
  // ====================================================================

  _fireConfigChanged(config: Simon42StrategyConfig): void {
    this._isUpdatingConfig = true;

    // Strip internal fields before saving
    const cleanConfig: Simon42StrategyConfig = { ...config };
    if (cleanConfig.custom_views) {
      cleanConfig.custom_views = cleanConfig.custom_views.map((cv) => {
        const clean = { ...cv };
        delete clean._yaml_error;
        return clean;
      });
    }
    if (cleanConfig.custom_cards) {
      cleanConfig.custom_cards = cleanConfig.custom_cards.map((cc) => {
        const clean = { ...cc };
        delete clean._yaml_error;
        return clean;
      });
    }
    if (cleanConfig.custom_badges) {
      cleanConfig.custom_badges = cleanConfig.custom_badges.map((cb) => {
        const clean = { ...cb };
        delete clean._yaml_error;
        return clean;
      });
    }

    this._config = cleanConfig;

    const event = new CustomEvent('config-changed', {
      detail: { config: cleanConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);

    // Reset flag after one tick
    setTimeout(() => {
      this._isUpdatingConfig = false;
    }, 0);
  }
}

// ====================================================================
// HELPER FUNCTIONS (local to this module)
// ====================================================================

async function getAreaGroupedEntities(areaId: string, hass: HomeAssistant): Promise<RoomEntities> {
  const devices = Object.values(hass.devices || {});
  const entities = Object.values(hass.entities || {});

  const areaDevices = new Set<string>();
  for (const device of devices) {
    if (device.area_id === areaId) {
      areaDevices.add(device.id);
    }
  }

  const roomEntities: RoomEntities = {
    lights: [],
    covers: [],
    covers_curtain: [],
    covers_window: [],
    scenes: [],
    climate: [],
    media_player: [],
    vacuum: [],
    fan: [],
    humidifier: [],
    valve: [],
    water_heater: [],
    switches: [],
    locks: [],
    automations: [],
    scripts: [],
    cameras: [],
    ups: [],
    energy: [],
  };

  const excludeLabels = entities
    .filter((e: EntityRegistryEntry) => e.labels?.includes('no_dboard'))
    .map((e: EntityRegistryEntry) => e.entity_id);

  const areaEntries: EntityRegistryEntry[] = [];
  for (const entity of entities) {
    let belongsToArea = false;

    if (entity.area_id) {
      belongsToArea = entity.area_id === areaId;
    } else if (entity.device_id && areaDevices.has(entity.device_id)) {
      belongsToArea = true;
    }

    if (!belongsToArea) continue;
    if (excludeLabels.includes(entity.entity_id)) continue;
    if (!hass.states[entity.entity_id]) continue;
    if (entity.hidden) continue;

    const entityRegistry = hass.entities?.[entity.entity_id];
    if (entityRegistry?.hidden) continue;

    areaEntries.push(entity);
  }

  // Same UPS grouping as the room view: detected UPS devices get their own
  // group, their entities leave the normal domain groups.
  const upsGroups = findUpsEntityGroups(areaEntries, hass);
  const usedByUps = new Set(upsGroups.flatMap(({ entityIds }) => entityIds));
  roomEntities.ups.push(...usedByUps);

  for (const entity of areaEntries) {
    if (usedByUps.has(entity.entity_id)) continue;

    const domain = entity.entity_id.split('.')[0];
    const stateObj = hass.states[entity.entity_id];
    const deviceClass = stateObj.attributes?.device_class;

    if (domain === 'light') {
      roomEntities.lights.push(entity.entity_id);
    } else if (domain === 'cover') {
      if (deviceClass === 'curtain') {
        roomEntities.covers_curtain.push(entity.entity_id);
      } else if (deviceClass === 'window' || deviceClass === 'door' || deviceClass === 'gate' || deviceClass === 'garage') {
        roomEntities.covers_window.push(entity.entity_id);
      } else {
        roomEntities.covers.push(entity.entity_id);
      }
    } else if (domain === 'scene') {
      roomEntities.scenes.push(entity.entity_id);
    } else if (domain === 'climate') {
      roomEntities.climate.push(entity.entity_id);
    } else if (domain === 'media_player') {
      roomEntities.media_player.push(entity.entity_id);
    } else if (domain === 'vacuum' || domain === 'lawn_mower') {
      roomEntities.vacuum.push(entity.entity_id);
    } else if (domain === 'fan') {
      roomEntities.fan.push(entity.entity_id);
    } else if (domain === 'humidifier') {
      roomEntities.humidifier.push(entity.entity_id);
    } else if (domain === 'valve') {
      roomEntities.valve.push(entity.entity_id);
    } else if (domain === 'water_heater') {
      roomEntities.water_heater.push(entity.entity_id);
    } else if (domain === 'switch') {
      roomEntities.switches.push(entity.entity_id);
    } else if (domain === 'lock') {
      roomEntities.locks.push(entity.entity_id);
    } else if (domain === 'automation') {
      roomEntities.automations.push(entity.entity_id);
    } else if (domain === 'script') {
      roomEntities.scripts.push(entity.entity_id);
    } else if (domain === 'camera') {
      roomEntities.cameras.push(entity.entity_id);
    } else if (domain === 'sensor' && ['power', 'energy', 'water', 'gas'].includes(deviceClass || '')) {
      roomEntities.energy.push(entity.entity_id);
    }
  }

  return roomEntities;
}

function getAreaBadgeCandidates(areaId: string, hass: HomeAssistant, config: Simon42StrategyConfig): string[] {
  const devices = Object.values(hass.devices || {});
  const entities = Object.values(hass.entities || {});

  const areaDevices = new Set<string>();
  for (const device of devices) {
    if (device.area_id === areaId) areaDevices.add(device.id);
  }

  const candidates: string[] = [];

  for (const entity of entities) {
    let belongsToArea = false;
    if (entity.area_id) belongsToArea = entity.area_id === areaId;
    else if (entity.device_id && areaDevices.has(entity.device_id)) belongsToArea = true;
    if (!belongsToArea) continue;
    if (entity.hidden) continue;
    if (entity.labels?.includes('no_dboard')) continue;
    if (!hass.states[entity.entity_id]) continue;

    const domain = entity.entity_id.split('.')[0];
    const stateObj = hass.states[entity.entity_id];
    const dc = stateObj.attributes?.device_class as string | undefined;
    const unit = stateObj.attributes?.unit_of_measurement as string | undefined;

    if (!isBadgeCandidate(domain, dc, unit, entity.entity_id)) continue;

    // Globally disabled contact types don't render as badges — don't offer
    // them as candidates either (they stay pickable as additional badges,
    // which is the deliberate per-room override).
    if (domain === 'binary_sensor' && dc === 'window' && config.show_window_contacts_in_rooms === false) continue;
    if (domain === 'binary_sensor' && dc === 'door' && config.show_door_contacts_in_rooms === false) continue;

    if (domain === 'sensor' && (dc === 'battery' || entity.entity_id.includes('battery'))) {
      const val = parseFloat(stateObj.state);
      if (!isNaN(val) && val < 20) candidates.push(entity.entity_id);
      continue;
    }

    candidates.push(entity.entity_id);
  }

  return candidates;
}

function getAdditionalBadgesForArea(areaId: string, config: Simon42StrategyConfig): string[] {
  return config.areas_options?.[areaId]?.groups_options?.badges?.additional || [];
}

function getAvailableBadgeEntities(
  areaId: string,
  hass: HomeAssistant,
  existingCandidates: string[],
  existingAdditional: string[]
): Array<{ entity_id: string; name: string }> {
  const devices = Object.values(hass.devices || {});
  const entities = Object.values(hass.entities || {});
  const excludeSet = new Set([...existingCandidates, ...existingAdditional]);

  const areaDevices = new Set<string>();
  for (const device of devices) {
    if (device.area_id === areaId) areaDevices.add(device.id);
  }

  const available: Array<{ entity_id: string; name: string }> = [];

  for (const entity of entities) {
    let belongsToArea = false;
    if (entity.area_id) belongsToArea = entity.area_id === areaId;
    else if (entity.device_id && areaDevices.has(entity.device_id)) belongsToArea = true;
    if (!belongsToArea) continue;
    if (entity.hidden) continue;
    if (!hass.states[entity.entity_id]) continue;

    const domain = entity.entity_id.split('.')[0];
    if (domain !== 'sensor' && domain !== 'binary_sensor') continue;
    if (excludeSet.has(entity.entity_id)) continue;

    const stateObj = hass.states[entity.entity_id];
    const name = (stateObj.attributes?.friendly_name as string) || entity.entity_id.split('.')[1].replace(/_/g, ' ');
    available.push({ entity_id: entity.entity_id, name });
  }

  available.sort((a, b) => a.name.localeCompare(b.name));
  return available;
}

function getDefaultShowNameEntities(badgeCandidates: string[], hass: HomeAssistant): Set<string> {
  const result = new Set<string>();
  for (const entityId of badgeCandidates) {
    const stateObj = hass.states[entityId];
    if (!stateObj) continue;
    const dc = stateObj.attributes?.device_class as string | undefined;
    if (isDefaultShowName(dc)) result.add(entityId);
  }
  return result;
}

function getBadgeNamesConfig(
  areaId: string,
  config: Simon42StrategyConfig
): { namesVisible: string[]; namesHidden: string[] } {
  const opts = config.areas_options?.[areaId]?.groups_options?.badges;
  return {
    namesVisible: opts?.names_visible || [],
    namesHidden: opts?.names_hidden || [],
  };
}

function getHiddenEntitiesForArea(areaId: string, config: Simon42StrategyConfig): Record<string, string[]> {
  const areaOptions = config.areas_options?.[areaId];
  if (!areaOptions || !areaOptions.groups_options) {
    return {};
  }

  const hidden: Record<string, string[]> = {};
  for (const [group, options] of Object.entries(areaOptions.groups_options)) {
    if (options.hidden) {
      hidden[group] = options.hidden;
    }
  }

  return hidden;
}

function getEntityOrdersForArea(areaId: string, config: Simon42StrategyConfig): Record<string, string[]> {
  const areaOptions = config.areas_options?.[areaId];
  if (!areaOptions || !areaOptions.groups_options) {
    return {};
  }

  const orders: Record<string, string[]> = {};
  for (const [group, options] of Object.entries(areaOptions.groups_options)) {
    if (options.order) {
      orders[group] = options.order;
    }
  }

  return orders;
}

// Register custom element
customElements.define('simon42-dashboard-strategy-editor', Simon42DashboardStrategyEditor);
