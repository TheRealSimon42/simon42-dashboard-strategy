// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR (LitElement)
// ====================================================================
// Single-file LitElement editor replacing the previous 4-file
// vanilla HTMLElement + innerHTML pattern.
// ====================================================================

/* eslint-disable xss/no-mixed-html, @typescript-eslint/no-confusing-void-expression --
   False positive: lit-html's `html` tag escapes every interpolation by
   construction. Codacy's legacy ESLint 8 engine misreads lit render
   functions, DOM Element locals and input event payloads as raw HTML. The
   void-expression rule fights the codebase's established concise event-
   handler arrows (`(checked) => host._toggleChanged(...)`). */
import { LitElement, html, nothing, type TemplateResult } from 'lit';

import type { HomeAssistant } from '../types/homeassistant';
import type {
  Simon42StrategyConfig,
  SectionKey,
  SectionOrderKey,
  StackKey,
} from '../types/strategy';
import { DEFAULT_SECTIONS_ORDER } from '../types/strategy';
// Pure-data section registry (no builder imports — safe for the editor chunk)
import { SECTION_META_BY_KEY } from '../sections/section-registry';
import { validateCustomSections } from '../sections/CustomSections';
import { localize } from '../utils/localize';
import { EDITOR_STYLES } from './editor-styles';
import type { StrategyEditorHost, AreaEntitiesCacheEntry, RefDashboardOption } from './editor-host';
import { renderViewsSection } from './panels/ViewsPanel';
import { renderViewVisibilitySection } from './panels/ViewVisibilityPanel';
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
import { renderDesignSection } from './panels/DesignPanel';
import { renderSummariesSection } from './panels/SummariesPanel';
import { renderAreasSection, areaOptionsFor } from './panels/AreasPanel';
import {
  renderCollapsiblePanel,
  loadExpandedPanels,
  type PanelMeta,
} from './panels/panel-shell';
import { mergeStacksOrder } from '../utils/name-utils';

// -- Supporting types for the editor ------------------------------------

declare global {
  interface Window {
    customCards?: Array<{ type: string; name: string; description: string }>;
    cardTools?: unknown;
  }
}

const ASSETS = 'https://github.com/TheRealSimon42/simon42-dashboard-strategy/blob/main/assets';

/** Header meta for the collapsible panels. Keys are persisted — keep stable. */
const PANELS: Record<string, PanelMeta> = {
  overview: { key: 'overview', icon: 'mdi:view-dashboard-outline', labelKey: 'editor.section_overview' },
  summaries: { key: 'summaries', icon: 'mdi:counter', labelKey: 'editor.section_summaries' },
  favorites: { key: 'favorites', icon: 'mdi:star-outline', labelKey: 'editor.section_favorites' },
  light_favorites: { key: 'light_favorites', icon: 'mdi:lightbulb-on-outline', labelKey: 'editor.section_light_favorites' },
  areas: { key: 'areas', icon: 'mdi:floor-plan', labelKey: 'editor.section_areas' },
  room_pins: { key: 'room_pins', icon: 'mdi:pin-outline', labelKey: 'editor.section_room_pins' },
  views: { key: 'views', icon: 'mdi:tab', labelKey: 'editor.section_views' },
  view_visibility: { key: 'view_visibility', icon: 'mdi:account-eye-outline', labelKey: 'editor.section_view_visibility' },
  section_order: { key: 'section_order', icon: 'mdi:sort', labelKey: 'editor.section_order' },
  weather_sensors: { key: 'weather_sensors', icon: 'mdi:weather-partly-cloudy', labelKey: 'editor.section_weather_sensors' },
  custom_cards: { key: 'custom_cards', icon: 'mdi:card-plus-outline', labelKey: 'editor.section_custom_cards', tutorialUrl: `${ASSETS}/Eigene-Karten-hinzufugen.gif` },
  custom_sections: { key: 'custom_sections', icon: 'mdi:view-grid-plus-outline', labelKey: 'editor.section_custom_sections' },
  custom_badges: { key: 'custom_badges', icon: 'mdi:label-outline', labelKey: 'editor.section_custom_badges', tutorialUrl: `${ASSETS}/Custom-Badges-hinzufugen.gif` },
  custom_views: { key: 'custom_views', icon: 'mdi:tab-plus', labelKey: 'editor.section_custom_views', tutorialUrl: `${ASSETS}/Custom-View-hinzufugen.gif` },
  design: { key: 'design', icon: 'mdi:palette-swatch-outline', labelKey: 'editor.section_design' },
};

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
  _expandedPanels = loadExpandedPanels();
  _expandedGroups = new Map<string, Set<string>>();

  // Entity search state (NOT @state — we call requestUpdate manually)
  _favoriteSearch = '';
  _roomPinSearch = '';
  _weatherSensorSearch = '';
  _securityExtraSearch = '';
  _lightFavSearch = '';

  // Cache for loaded area entities (avoid re-fetching on every render)
  _areaEntitiesCache = new Map<string, AreaEntitiesCacheEntry>();

  // Referenceable dashboards for custom view references (#169);
  // loaded lazily on first use, session-lifetime cache
  _refDashboards: RefDashboardOption[] | null = null;
  _refDashboardsLoading = false;

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
        ${renderCollapsiblePanel(this, PANELS.overview, () => renderOverviewSection(this))}
        ${renderCollapsiblePanel(this, PANELS.summaries, () => renderSummariesSection(this))}
        ${renderCollapsiblePanel(this, PANELS.favorites, () => renderFavoritesSection(this))}
        ${renderCollapsiblePanel(this, PANELS.light_favorites, () => renderLightFavoritesSection(this))}

        <div class="section-divider">
          <div class="section-divider-title">
            ${localize('editor.section_areas_rooms')}
          </div>
        </div>

        ${renderCollapsiblePanel(this, PANELS.areas, () => renderAreasSection(this))}
        ${renderCollapsiblePanel(this, PANELS.room_pins, () => renderRoomPinsSection(this))}
        ${renderCollapsiblePanel(this, PANELS.views, () => renderViewsSection(this))}
        ${renderCollapsiblePanel(this, PANELS.view_visibility, () => renderViewVisibilitySection(this))}

        <div class="section-divider">
          <div class="section-divider-title">
            ${localize('editor.section_advanced')}
          </div>
        </div>

        ${renderCollapsiblePanel(this, PANELS.section_order, () => renderSectionOrderPanel(this))}
        ${renderCollapsiblePanel(this, PANELS.weather_sensors, () => renderWeatherSensorsSection(this))}
        ${renderCollapsiblePanel(this, PANELS.custom_cards, () => renderCustomCardsSection(this))}
        ${renderCollapsiblePanel(this, PANELS.custom_sections, () => renderCustomSectionsSection(this))}
        ${renderCollapsiblePanel(this, PANELS.custom_badges, () => renderCustomBadgesSection(this))}
        ${renderCollapsiblePanel(this, PANELS.custom_views, () => renderCustomViewsSection(this))}
        ${renderCollapsiblePanel(this, PANELS.design, () => renderDesignSection(this))}
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
    return mergeStacksOrder(areaOptionsFor(this._config, areaId)?.stacks_order);
  }

  // -- Overview section --------------------------------------------------


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

  // ====================================================================
  // AREA ENTITY LOADING
  // ====================================================================

  // ====================================================================
  // EVENT HANDLERS — Toggle / Config changes
  // ====================================================================

  _toggleChanged(key: string, value: boolean, defaultValue: boolean): void {
    if (!this._hass) return;

    const newConfig: Simon42StrategyConfig = {
      ...this._config,
      [key]: value,
    };

    // Remove property when set to default
    if (value === defaultValue) {
      Reflect.deleteProperty(newConfig, key);
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  // -- Favorites --------------------------------------------------------

  // -- Room Pins --------------------------------------------------------

  // -- Custom Views -----------------------------------------------------

  // -- Custom Cards -----------------------------------------------------

  // -- Custom Sections ----------------------------------------------------

  // -- Area Custom Sections (per room view) -------------------------------

  // -- Custom Badges ----------------------------------------------------

  // ====================================================================
  // AREA MANAGEMENT
  // ====================================================================

  // -- Badge additional and show_name -----------------------------------

  // ====================================================================
  // DRAG AND DROP
  // ====================================================================

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

// Register custom element
customElements.define('simon42-dashboard-strategy-editor', Simon42DashboardStrategyEditor);
