// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR (LitElement)
// ====================================================================
// Single-file LitElement editor replacing the previous 4-file
// vanilla HTMLElement + innerHTML pattern.
// ====================================================================

import { LitElement, html, css, nothing, type TemplateResult, type PropertyValues } from 'lit';
import yaml from 'js-yaml';

import type { HomeAssistant } from '../types/homeassistant';
import type {
  Simon42StrategyConfig,
  CustomView,
  CustomCard,
  CustomBadge,
  RoomEntities,
} from '../types/strategy';
import type { AreaRegistryEntry, EntityRegistryEntry } from '../types/registries';
import { localize } from '../utils/localize';
import { isBadgeCandidate, isDefaultShowName, resolveShowName } from '../utils/badge-utils';

// -- Supporting types for the editor ------------------------------------

interface AlarmEntityOption {
  entity_id: string;
  name: string;
}

interface EntitySelectOption {
  entity_id: string;
  name: string;
  area_id?: string | null;
  device_area_id?: string | null;
}

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

class Simon42DashboardStrategyEditor extends LitElement {
  static properties = {
    _config: { state: true },
    _expandedAreas: { state: true },
    _expandedGroups: { state: true },
  };

  // hass is set externally by HA — use a setter, not a Lit property
  private _hass: HomeAssistant | null = null;
  private _isUpdatingConfig = false;

  _config: Simon42StrategyConfig = {};
  _expandedAreas = new Set<string>();
  _expandedGroups = new Map<string, Set<string>>();

  // Entity search state (NOT @state — we call requestUpdate manually)
  private _favoriteSearch = '';
  private _roomPinSearch = '';

  // Cache for loaded area entities (avoid re-fetching on every render)
  private _areaEntitiesCache = new Map<string, {
    groupedEntities: Record<string, string[]>;
    hiddenEntities: Record<string, string[]>;
    entityOrders: Record<string, string[]>;
    badgeCandidates: string[];
    additionalBadges: string[];
    availableEntities: Array<{ entity_id: string; name: string }>;
    defaultShowNames: Set<string>;
    namesVisible: string[];
    namesHidden: string[];
  }>();

  // Drag state (not reactive — no render needed)
  private _draggedElement: HTMLElement | null = null;

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

  private _checkSearchCardDependencies(): boolean {
    const hasSearchCard = customElements.get('search-card') !== undefined;
    const hasCardTools = customElements.get('card-tools') !== undefined;
    return hasSearchCard && hasCardTools;
  }

  // -- Entity helpers ---------------------------------------------------

  private _getAllEntitiesForSelect(): EntitySelectOption[] {
    if (!this._hass) return [];

    const entities = Object.values(this._hass.entities);
    const devices = Object.values(this._hass.devices);

    // Build device-to-area lookup
    const deviceAreaMap = new Map<string, string>();
    devices.forEach((device) => {
      if (device.area_id) {
        deviceAreaMap.set(device.id, device.area_id);
      }
    });

    const hass = this._hass;
    return Object.keys(hass.states)
      .map((entityId) => {
        const stateObj = hass.states[entityId];
        const entity = entities.find((e) => e.entity_id === entityId);

        let areaId = entity?.area_id;
        if (!areaId && entity?.device_id) {
          areaId = deviceAreaMap.get(entity.device_id) ?? null;
        }

        return {
          entity_id: entityId,
          name: stateObj.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' '),
          area_id: areaId,
          device_area_id: areaId,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private _getAlarmEntities(): AlarmEntityOption[] {
    if (!this._hass) return [];
    return Object.keys(this._hass.states)
      .filter((entityId) => entityId.startsWith('alarm_control_panel.'))
      .map((entityId) => {
        const stateObj = this._hass!.states[entityId];
        return {
          entity_id: entityId,
          name: stateObj.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' '),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private _getFilteredEntities(query: string, filterWithArea = false): EntitySelectOption[] {
    if (!this._hass || query.length < 2) return [];
    const q = query.toLowerCase();
    const all = this._getAllEntitiesForSelect();
    const filtered = all.filter((entity) => {
      if (filterWithArea && !entity.area_id && !entity.device_area_id) return false;
      return entity.name.toLowerCase().includes(q) || entity.entity_id.toLowerCase().includes(q);
    });
    // Prioritize: exact match > starts-with > contains
    filtered.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aId = a.entity_id.toLowerCase();
      const bId = b.entity_id.toLowerCase();
      const aExact = aName === q || aId === q;
      const bExact = bName === q || bId === q;
      if (aExact !== bExact) return aExact ? -1 : 1;
      const aStarts = aName.startsWith(q) || aId.startsWith(q) || aId.split('.')[1]?.startsWith(q);
      const bStarts = bName.startsWith(q) || bId.startsWith(q) || bId.split('.')[1]?.startsWith(q);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      return aName.localeCompare(bName);
    });
    return filtered.slice(0, 21);
  }

  // -- Styles -----------------------------------------------------------

  static styles = css`
    /* -- Base layout --------------------------------------------------- */
    .card-config {
      padding: 16px;
      font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
      font-size: var(--mdc-typography-body1-font-size, 14px);
      color: var(--primary-text-color);
    }
    .section {
      margin-bottom: 16px;
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e8e8e8);
      border-radius: var(--ha-card-border-radius, 12px);
      padding: 16px;
      transition: box-shadow 0.2s ease;
    }
    .section-title {
      font-size: 15px;
      font-weight: 500;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--divider-color, #e8e8e8);
      color: var(--primary-text-color);
      letter-spacing: 0.01em;
    }

    /* -- Form rows ----------------------------------------------------- */
    .form-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    .form-row input[type="checkbox"],
    .form-row input[type="radio"] {
      margin-right: 8px;
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--primary-color);
    }
    .form-row input[type="checkbox"]:disabled,
    .form-row input[type="radio"]:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    .form-row label {
      cursor: pointer;
      user-select: none;
      font-size: 14px;
      color: var(--primary-text-color);
    }
    .form-row label.disabled-label {
      cursor: not-allowed;
      opacity: 0.5;
    }
    .form-row .alarm-select {
      flex: 1;
      max-width: 300px;
    }
    .description {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin: 2px 0 12px 26px;
      line-height: 1.4;
    }
    .description strong {
      font-weight: 600;
      color: var(--primary-text-color);
    }

    /* -- Native <select> — HA-like ------------------------------------- */
    select,
    .form-row select {
      cursor: pointer;
      font-family: inherit;
      font-size: 14px;
      padding: 10px 32px 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      background-color: var(--card-background-color);
      color: var(--primary-text-color);
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%236e6e6e' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      background-size: 16px;
      transition: border-color 0.2s ease;
    }
    select:focus,
    .form-row select:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 1px var(--primary-color);
    }
    select:hover,
    .form-row select:hover {
      border-color: var(--primary-color);
    }

    /* -- Native <input type="text/number"> — HA-like ------------------- */
    input[type="text"],
    input[type="number"] {
      font-family: inherit;
      font-size: 14px;
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      transition: border-color 0.2s ease;
      box-sizing: border-box;
    }
    input[type="text"]:focus,
    input[type="number"]:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 1px var(--primary-color);
    }
    input[type="text"]:hover,
    input[type="number"]:hover {
      border-color: var(--primary-color);
    }
    input[type="text"]::placeholder {
      color: var(--secondary-text-color);
      opacity: 0.7;
    }

    /* -- Native <textarea> — YAML editors ------------------------------ */
    textarea {
      font-family: "Roboto Mono", "SFMono-Regular", "Consolas", "Liberation Mono", monospace;
      font-size: 12px;
      line-height: 1.5;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      resize: vertical;
      min-height: 80px;
      box-sizing: border-box;
      transition: border-color 0.2s ease;
      tab-size: 2;
    }
    textarea:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 1px var(--primary-color);
    }
    textarea:hover {
      border-color: var(--primary-color);
    }
    textarea::placeholder {
      color: var(--secondary-text-color);
      opacity: 0.7;
      font-family: inherit;
    }

    /* -- Buttons — HA-like --------------------------------------------- */
    button {
      font-family: inherit;
      font-size: 14px;
    }
    .btn-primary {
      padding: 10px 20px;
      border-radius: var(--ha-card-border-radius, 12px);
      border: none;
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      cursor: pointer;
      font-weight: 500;
      transition: opacity 0.2s ease, box-shadow 0.2s ease;
      white-space: nowrap;
    }
    .btn-primary:hover {
      opacity: 0.85;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }
    .btn-primary:active {
      opacity: 0.75;
    }
    .btn-remove {
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--secondary-text-color);
      cursor: pointer;
      font-size: 14px;
      transition: color 0.2s ease, border-color 0.2s ease;
      line-height: 1;
    }
    .btn-remove:hover {
      color: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
    }

    /* -- Area list ----------------------------------------------------- */
    .area-list {
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      overflow: hidden;
    }
    .area-item {
      border-bottom: 1px solid var(--divider-color);
      background: var(--card-background-color);
    }
    .area-item:last-child {
      border-bottom: none;
    }
    .area-item.dragging {
      opacity: 0.5;
    }
    .area-item.drag-over {
      border-top: 2px solid var(--primary-color);
    }
    .area-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
    }
    .drag-handle {
      margin-right: 12px;
      color: var(--secondary-text-color);
      cursor: grab;
      user-select: none;
      padding: 4px;
    }
    .drag-handle:active {
      cursor: grabbing;
    }
    .area-checkbox {
      margin-right: 12px;
      accent-color: var(--primary-color);
    }
    .area-name {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }
    .area-icon {
      margin-left: 8px;
      margin-right: 12px;
      color: var(--secondary-text-color);
    }
    .expand-button {
      background: none;
      border: none;
      padding: 4px 8px;
      cursor: pointer;
      color: var(--secondary-text-color);
      transition: transform 0.2s;
    }
    .expand-button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .expand-button.expanded .expand-icon {
      transform: rotate(90deg);
    }
    .expand-icon {
      display: inline-block;
      transition: transform 0.2s;
    }
    .area-content {
      padding: 0 12px 12px 48px;
      background: var(--secondary-background-color);
    }
    .loading-placeholder {
      padding: 12px;
      text-align: center;
      color: var(--secondary-text-color);
      font-style: italic;
    }

    /* -- Entity groups ------------------------------------------------- */
    .entity-groups {
      padding-top: 8px;
    }
    .entity-group {
      margin-bottom: 8px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      overflow: hidden;
    }
    .entity-group-header {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.15s ease;
    }
    .entity-group-header:hover {
      background: var(--secondary-background-color);
    }
    .group-checkbox {
      margin-right: 8px;
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: var(--primary-color);
    }
    .group-checkbox[data-indeterminate="true"] {
      opacity: 0.6;
    }
    .entity-group-header ha-icon {
      margin-right: 8px;
      --mdc-icon-size: 18px;
      color: var(--secondary-text-color);
    }
    .group-name {
      flex: 1;
      font-weight: 500;
      font-size: 14px;
    }
    .entity-count {
      color: var(--secondary-text-color);
      font-size: 12px;
      margin-right: 8px;
    }
    .expand-button-small {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: var(--secondary-text-color);
    }
    .expand-button-small.expanded .expand-icon-small {
      transform: rotate(90deg);
    }
    .expand-icon-small {
      display: inline-block;
      font-size: 12px;
      transition: transform 0.2s;
    }

    /* -- Entity list --------------------------------------------------- */
    .entity-list {
      padding: 8px 12px 8px 36px;
      border-top: 1px solid var(--divider-color);
    }
    .entity-item {
      display: flex;
      align-items: center;
      padding: 6px 0;
    }
    .entity-checkbox {
      margin-right: 8px;
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: var(--primary-color);
    }
    .entity-name {
      flex: 1;
      font-size: 14px;
    }
    .entity-id {
      font-size: 11px;
      color: var(--secondary-text-color);
      font-family: "Roboto Mono", monospace;
      margin-left: 8px;
    }
    .empty-state {
      padding: 24px;
      text-align: center;
      color: var(--secondary-text-color);
      font-style: italic;
    }

    /* -- Badge entity management --------------------------------------- */
    .badge-separator {
      padding: 8px 0 4px;
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text-color);
      border-top: 1px dashed var(--divider-color);
      margin-top: 4px;
    }
    .badge-additional-item {
      padding-left: 0;
    }
    .badge-remove-btn {
      background: none;
      border: none;
      padding: 2px 6px;
      cursor: pointer;
      color: var(--error-color, #db4437);
      font-size: 14px;
      margin-left: 8px;
      border-radius: 4px;
      transition: background-color 0.15s ease;
    }
    .badge-remove-btn:hover {
      background: var(--secondary-background-color);
    }
    .badge-add-section {
      display: flex;
      gap: 8px;
      padding: 8px 0 4px;
      align-items: center;
    }
    .badge-entity-picker {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 13px;
    }
    .badge-add-button {
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      transition: opacity 0.2s ease;
    }
    .badge-add-button:hover {
      opacity: 0.85;
    }
    .badge-name-checkbox {
      margin-left: auto;
      margin-right: 2px;
      width: 14px;
      height: 14px;
      cursor: pointer;
      accent-color: var(--primary-color);
    }
    .badge-name-label {
      font-size: 11px;
      color: var(--secondary-text-color);
      margin-right: 8px;
      white-space: nowrap;
    }

    /* -- Entity search picker ------------------------------------------ */
    .entity-search-picker {
      position: relative;
      flex: 1;
      min-width: 0;
    }
    .entity-search-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-family: inherit;
      font-size: 14px;
      box-sizing: border-box;
      transition: border-color 0.2s ease;
    }
    .entity-search-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 1px var(--primary-color);
    }
    .entity-search-input::placeholder {
      color: var(--secondary-text-color);
      opacity: 0.7;
    }
    .entity-search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 10;
      margin-top: 4px;
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      background: var(--card-background-color);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      overflow: hidden;
      max-height: 320px;
      overflow-y: auto;
    }
    .entity-search-result {
      display: flex;
      flex-direction: column;
      padding: 10px 14px;
      cursor: pointer;
      transition: background-color 0.1s ease;
      border-bottom: 1px solid var(--divider-color);
    }
    .entity-search-result:last-child {
      border-bottom: none;
    }
    .entity-search-result:hover {
      background: var(--secondary-background-color);
    }
    .entity-search-result .entity-search-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .entity-search-result .entity-search-id {
      font-size: 11px;
      color: var(--secondary-text-color);
      font-family: "Roboto Mono", monospace;
      margin-top: 2px;
    }
    .entity-search-no-results {
      padding: 12px 14px;
      color: var(--secondary-text-color);
      font-style: italic;
      font-size: 13px;
    }

    /* -- Favorites / Room Pins list items ------------------------------ */
    .entity-list-container {
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      overflow: hidden;
    }
    .entity-list-item {
      display: flex;
      align-items: center;
      padding: 10px 14px;
      border-bottom: 1px solid var(--divider-color);
      background: var(--card-background-color);
      transition: background-color 0.1s ease;
    }
    .entity-list-item:last-child {
      border-bottom: none;
    }
    .entity-list-item:hover {
      background: var(--secondary-background-color);
    }
    .entity-list-item .drag-icon {
      margin-right: 12px;
      color: var(--secondary-text-color);
      font-size: 16px;
      cursor: grab;
      user-select: none;
      padding: 4px;
    }
    .entity-list-item .drag-icon:active {
      cursor: grabbing;
    }
    .entity-list-item.dragging {
      opacity: 0.5;
    }
    .entity-list-item.drag-over {
      border-top: 2px solid var(--primary-color);
    }
    .entity-list-item .item-info {
      flex: 1;
      min-width: 0;
      font-size: 14px;
    }
    .entity-list-item .item-name {
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .entity-list-item .item-entity-id {
      margin-left: 8px;
      font-size: 12px;
      color: var(--secondary-text-color);
      font-family: "Roboto Mono", monospace;
    }
    .entity-list-item .item-area {
      display: block;
      font-size: 11px;
      color: var(--secondary-text-color);
      margin-top: 2px;
    }

    /* -- Custom view/card/badge items ---------------------------------- */
    .custom-item {
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      padding: 16px;
      margin-bottom: 12px;
      background: var(--card-background-color);
    }
    .custom-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .custom-item-header strong {
      font-size: 14px;
      font-weight: 500;
    }
    .custom-item-fields {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .custom-item-row {
      display: flex;
      gap: 8px;
    }
    .custom-item-validation {
      font-size: 12px;
      min-height: 16px;
    }

    /* -- Section dividers ---------------------------------------------- */
    .section-divider {
      margin: 28px 0 12px;
      padding: 0;
    }
    .section-divider-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--secondary-text-color);
    }

    /* -- Mobile responsive --------------------------------------------- */
    @media (max-width: 600px) {
      .card-config {
        padding: 12px 8px;
      }
      .section {
        margin-bottom: 16px;
      }
      .section-title {
        font-size: 15px;
        margin-bottom: 8px;
      }
      .form-row {
        flex-wrap: wrap;
        gap: 4px;
      }
      .form-row label {
        font-size: 13px;
      }
      .description {
        margin-left: 26px;
        margin-bottom: 12px;
        font-size: 11px;
      }

      select,
      .form-row select {
        width: 100%;
        min-width: 0;
        font-size: 13px;
        padding: 8px 28px 8px 10px;
      }
      input[type="text"],
      input[type="number"] {
        width: 100%;
        font-size: 13px;
        padding: 8px 10px;
      }
      textarea {
        font-size: 11px;
        padding: 10px;
        min-height: 60px;
      }

      .entity-search-picker {
        width: 100%;
      }
      .entity-search-results {
        max-height: 240px;
      }
      .entity-search-result {
        padding: 8px 10px;
      }

      .area-header {
        padding: 10px 12px;
      }
      .area-content {
        padding: 0 8px 8px 24px;
      }
      .entity-list {
        padding: 6px 8px 6px 16px;
      }

      .custom-item {
        padding: 12px;
      }
      .custom-item-row {
        flex-direction: column;
      }

      .entity-list-item {
        padding: 8px 10px;
      }
      .entity-list-item .item-entity-id {
        display: block;
        margin-left: 0;
        margin-top: 2px;
      }

      .badge-add-section {
        flex-wrap: wrap;
      }

      .btn-primary {
        padding: 8px 16px;
        font-size: 13px;
      }
    }
  `;

  // -- Main render ------------------------------------------------------

  protected render() {
    if (!this._hass) return nothing;

    return html`
      <div class="card-config">
        ${this._renderOverviewSection()}
        ${this._renderSummariesSection()}
        ${this._renderInfoCardsSection()}
        ${this._renderFavoritesSection()}

        <div class="section-divider">
          <div class="section-divider-title">
            ${localize('editor.section_areas_rooms')}
          </div>
        </div>

        ${this._renderAreasSection()}
        ${this._renderRoomPinsSection()}
        ${this._renderViewsSection()}

        <div class="section-divider">
          <div class="section-divider-title">
            ${localize('editor.section_advanced')}
          </div>
        </div>

        ${this._renderCustomCardsSection()}
        ${this._renderCustomBadgesSection()}
        ${this._renderCustomViewsSection()}
      </div>
    `;
  }

  // ====================================================================
  // SECTION RENDERERS
  // ====================================================================

  private _renderOverviewSection(): TemplateResult {
    const showClockCard = this._config.show_clock_card !== false;
    const showSearchCard = this._config.show_search_card === true;
    const hasSearchCardDeps = this._checkSearchCardDependencies();
    const alarmEntity = this._config.alarm_entity || '';
    const alarmEntities = this._getAlarmEntities();

    return html`
      <div class="section">
        <div class="section-title">${localize('editor.section_overview')}</div>

        ${this._renderCheckbox('show-clock-card', localize('editor.show_clock_card'), showClockCard,
          (checked) => this._toggleChanged('show_clock_card', checked, true))}
        <div class="description">${localize('editor.show_clock_card_desc')}</div>

        <div class="form-row">
          <label for="alarm-entity" style="margin-right: 8px; min-width: 120px;">${localize('editor.alarm_entity')}</label>
          <select id="alarm-entity"
            style="flex: 1;"
            @change=${this._alarmEntityChanged}>
            <option value="" ?selected=${!alarmEntity}>${localize('editor.alarm_none')}</option>
            ${alarmEntities.map((entity) => html`
              <option value=${entity.entity_id} ?selected=${entity.entity_id === alarmEntity}>
                ${entity.name}
              </option>
            `)}
          </select>
        </div>
        <div class="description">${localize('editor.alarm_desc')}</div>

        ${this._renderCheckbox('show-search-card', localize('editor.show_search_card'), showSearchCard,
          (checked) => this._toggleChanged('show_search_card', checked, false),
          !hasSearchCardDeps)}
        <div class="description">
          ${hasSearchCardDeps
            ? localize('editor.show_search_card_desc')
            : html`<span>&#x26A0;&#xFE0F; ${localize('editor.show_search_card_missing')}</span>`}
        </div>
      </div>
    `;
  }

  private _renderSummariesSection(): TemplateResult {
    const summariesColumns = this._config.summaries_columns || 2;
    const showLightSummary = this._config.show_light_summary !== false;
    const groupLightsByFloors = this._config.group_lights_by_floors === true;
    const nestedLightGroups = this._config.nested_light_groups === true;
    const showCoversSummary = this._config.show_covers_summary !== false;
    const showPartiallyOpenCovers = this._config.show_partially_open_covers === true;
    const showSecuritySummary = this._config.show_security_summary !== false;
    const showClimateSummary = this._config.show_climate_summary === true;
    const showBatterySummary = this._config.show_battery_summary !== false;
    const hideMobileAppBatteries = this._config.hide_mobile_app_batteries === true;
    const batteryCriticalThreshold = this._config.battery_critical_threshold ?? 20;
    const batteryLowThreshold = this._config.battery_low_threshold ?? 50;

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

        ${this._renderCheckbox('nested-light-groups', localize('editor.nested_light_groups'), nestedLightGroups,
          (checked) => this._toggleChanged('nested_light_groups', checked, false))}
        <div class="description">${localize('editor.nested_light_groups_desc')}</div>

        ${this._renderCheckbox('show-covers-summary', localize('editor.show_covers_summary'), showCoversSummary,
          (checked) => this._toggleChanged('show_covers_summary', checked, true))}

        <div style="margin-left: 26px; margin-bottom: 8px;">
          ${this._renderCheckbox('show-partially-open-covers', localize('editor.show_partially_open_covers'), showPartiallyOpenCovers,
            (checked) => this._toggleChanged('show_partially_open_covers', checked, false))}
          <div class="description">${localize('editor.show_partially_open_covers_desc')}</div>
        </div>

        ${this._renderCheckbox('show-security-summary', localize('editor.show_security_summary'), showSecuritySummary,
          (checked) => this._toggleChanged('show_security_summary', checked, true))}

        ${this._renderCheckbox('show-climate-summary', localize('editor.show_climate_summary'), showClimateSummary,
          (checked) => this._toggleChanged('show_climate_summary', checked, false))}
        <div class="description">${localize('editor.show_climate_summary_desc')}</div>

        ${this._renderCheckbox('show-battery-summary', localize('editor.show_battery_summary'), showBatterySummary,
          (checked) => this._toggleChanged('show_battery_summary', checked, true))}

        <div style="margin-left: 26px; margin-bottom: 8px;">
          ${this._renderCheckbox('hide-mobile-app-batteries', localize('editor.hide_mobile_app_batteries'), hideMobileAppBatteries,
            (checked) => this._toggleChanged('hide_mobile_app_batteries', checked, false))}
          <div class="description">${localize('editor.hide_mobile_app_batteries_desc')}</div>

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
        </div>
      </div>
    `;
  }

  private _renderInfoCardsSection(): TemplateResult {
    const showWeather = this._config.show_weather !== false;
    const showEnergy = this._config.show_energy !== false;

    return html`
      <div class="section">
        <div class="section-title">${localize('editor.section_info_cards')}</div>

        ${this._renderCheckbox('show-weather', localize('editor.show_weather'), showWeather,
          (checked) => this._toggleChanged('show_weather', checked, true))}
        <div class="description">${localize('editor.show_weather_desc')}</div>

        ${this._renderCheckbox('show-energy', localize('editor.show_energy'), showEnergy,
          (checked) => this._toggleChanged('show_energy', checked, true))}
        <div class="description">${localize('editor.show_energy_desc')}</div>
      </div>
    `;
  }

  private _renderFavoritesSection(): TemplateResult {
    const favoriteEntities = this._config.favorite_entities || [];
    const allEntities = this._getAllEntitiesForSelect();
    const favoritesShowState = this._config.favorites_show_state === true;
    const favoritesHideLastChanged = this._config.favorites_hide_last_changed === true;

    const entityMap = new Map(allEntities.map((e) => [e.entity_id, e.name]));
    const filteredEntities = this._getFilteredEntities(this._favoriteSearch);

    return html`
      <div class="section">
        <div class="section-title">${localize('editor.section_favorites')}</div>

        <div id="favorites-list" style="margin-bottom: 12px;">
          ${favoriteEntities.length === 0
            ? html`<div class="empty-state">${localize('editor.no_favorites')}</div>`
            : html`
              <div class="entity-list-container">
                ${favoriteEntities.map((entityId) => {
                  const name = entityMap.get(entityId) || entityId;
                  return html`
                    <div class="entity-list-item" data-entity-id=${entityId}
                      draggable="true"
                      @dragstart=${(ev: DragEvent) => this._handleEntityDragStart(ev, 'favorites')}
                      @dragend=${this._handleEntityDragEnd}
                      @dragover=${this._handleEntityDragOver}
                      @dragleave=${this._handleEntityDragLeave}
                      @drop=${(ev: DragEvent) => this._handleEntityDrop(ev, 'favorites')}>
                      <span class="drag-icon">&#x2630;</span>
                      <span class="item-info">
                        <span class="item-name">${name}</span>
                        <span class="item-entity-id">${entityId}</span>
                      </span>
                      <button class="btn-remove" @click=${() => this._removeFavoriteEntity(entityId)}>&#x2715;</button>
                    </div>
                  `;
                })}
              </div>
            `}
        </div>

        <div class="entity-search-picker">
          <input type="text" class="entity-search-input"
            placeholder=${localize('editor.select_entity') + '...'}
            .value=${this._favoriteSearch}
            @input=${(e: Event) => { this._favoriteSearch = (e.target as HTMLInputElement).value; this.requestUpdate(); }}
            @blur=${() => { setTimeout(() => { this._favoriteSearch = ''; this.requestUpdate(); }, 200); }}
          />
          ${this._favoriteSearch.length >= 2 ? html`
            <div class="entity-search-results">
              ${filteredEntities.length > 0
                ? filteredEntities.map((entity) => html`
                  <div class="entity-search-result" @mousedown=${(e: Event) => { e.preventDefault(); this._addFavoriteEntity(entity.entity_id); this._favoriteSearch = ''; this.requestUpdate(); }}>
                    <span class="entity-search-name">${entity.name}</span>
                    <span class="entity-search-id">${entity.entity_id}</span>
                  </div>
                `)
                : html`<div class="entity-search-no-results">${localize('editor.no_results')}</div>`
              }
            </div>
          ` : nothing}
        </div>
        <div class="description">${localize('editor.favorites_desc')}</div>

        ${this._renderCheckbox('favorites-show-state', localize('editor.show_state'), favoritesShowState,
          (checked) => this._toggleChanged('favorites_show_state', checked, false))}

        ${this._renderCheckbox('favorites-hide-last-changed', localize('editor.hide_last_changed'), favoritesHideLastChanged,
          (checked) => this._toggleChanged('favorites_hide_last_changed', checked, false))}
      </div>
    `;
  }

  private _renderAreasSection(): TemplateResult {
    const groupByFloors = this._config.group_by_floors === true;
    const showSwitchesOnAreas = this._config.show_switches_on_areas === true;
    const showAlertsOnAreas = this._config.show_alerts_on_areas === true;
    const showLocksInRooms = this._config.show_locks_in_rooms === true;
    const showAutomationsInRooms = this._config.show_automations_in_rooms === true;
    const showScriptsInRooms = this._config.show_scripts_in_rooms === true;
    const useDefaultAreaSort = this._config.use_default_area_sort === true;

    const allAreas = Object.values(this._hass!.areas).sort((a, b) => a.name.localeCompare(b.name));
    const hiddenAreas = this._config.areas_display?.hidden || [];
    const areaOrder = this._config.areas_display?.order || [];

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

        ${this._renderCheckbox('show-locks-in-rooms', localize('editor.show_locks_in_rooms'), showLocksInRooms,
          (checked) => this._toggleChanged('show_locks_in_rooms', checked, false))}
        <div class="description">${localize('editor.show_locks_in_rooms_desc')}</div>

        ${this._renderCheckbox('show-automations-in-rooms', localize('editor.show_automations_in_rooms'), showAutomationsInRooms,
          (checked) => this._toggleChanged('show_automations_in_rooms', checked, false))}
        <div class="description">${localize('editor.show_automations_in_rooms_desc')}</div>

        ${this._renderCheckbox('show-scripts-in-rooms', localize('editor.show_scripts_in_rooms'), showScriptsInRooms,
          (checked) => this._toggleChanged('show_scripts_in_rooms', checked, false))}
        <div class="description">${localize('editor.show_scripts_in_rooms_desc')}</div>

        ${this._renderCheckbox('use-default-area-sort', localize('editor.use_default_area_sort'), useDefaultAreaSort,
          (checked) => this._toggleChanged('use_default_area_sort', checked, false))}
        <div class="description">${localize('editor.use_default_area_sort_desc')}</div>

        <div class="description" style="margin-left: 0; margin-top: 16px; margin-bottom: 12px;">
          ${localize('editor.areas_manage_desc')}
        </div>

        <div class="area-list" id="area-list">
          ${this._renderAreaItems(allAreas, hiddenAreas, areaOrder)}
        </div>
      </div>
    `;
  }

  private _renderRoomPinsSection(): TemplateResult {
    const roomPinEntities = this._config.room_pin_entities || [];
    const allEntities = this._getAllEntitiesForSelect();
    const allAreas = Object.values(this._hass!.areas).sort((a, b) => a.name.localeCompare(b.name));
    const roomPinsShowState = this._config.room_pins_show_state === true;
    const roomPinsHideLastChanged = this._config.room_pins_hide_last_changed === true;

    const entityMap = new Map(allEntities.map((e) => [e.entity_id, e]));
    const areaMap = new Map(allAreas.map((a) => [a.area_id, a.name]));
    const filteredEntities = this._getFilteredEntities(this._roomPinSearch, true);

    return html`
      <div class="section">
        <div class="section-title">${localize('editor.section_room_pins')}</div>

        <div id="room-pins-list" style="margin-bottom: 12px;">
          ${roomPinEntities.length === 0
            ? html`<div class="empty-state">${localize('editor.no_room_pins')}</div>`
            : html`
              <div class="entity-list-container">
                ${roomPinEntities.map((entityId) => {
                  const entity = entityMap.get(entityId);
                  const name = entity?.name || entityId;
                  const areaId = entity?.area_id || entity?.device_area_id;
                  const areaName = areaId ? areaMap.get(areaId) || areaId : localize('editor.no_room');

                  return html`
                    <div class="entity-list-item" data-entity-id=${entityId}
                      draggable="true"
                      @dragstart=${(ev: DragEvent) => this._handleEntityDragStart(ev, 'room_pins')}
                      @dragend=${this._handleEntityDragEnd}
                      @dragover=${this._handleEntityDragOver}
                      @dragleave=${this._handleEntityDragLeave}
                      @drop=${(ev: DragEvent) => this._handleEntityDrop(ev, 'room_pins')}>
                      <span class="drag-icon">&#x2630;</span>
                      <span class="item-info">
                        <span class="item-name">${name}</span>
                        <span class="item-entity-id">${entityId}</span>
                        <span class="item-area">&#x1F4CD; ${areaName}</span>
                      </span>
                      <button class="btn-remove" @click=${() => this._removeRoomPinEntity(entityId)}>&#x2715;</button>
                    </div>
                  `;
                })}
              </div>
            `}
        </div>

        <div class="entity-search-picker">
          <input type="text" class="entity-search-input"
            placeholder=${localize('editor.select_entity') + '...'}
            .value=${this._roomPinSearch}
            @input=${(e: Event) => { this._roomPinSearch = (e.target as HTMLInputElement).value; this.requestUpdate(); }}
            @blur=${() => { setTimeout(() => { this._roomPinSearch = ''; this.requestUpdate(); }, 200); }}
          />
          ${this._roomPinSearch.length >= 2 ? html`
            <div class="entity-search-results">
              ${filteredEntities.length > 0
                ? filteredEntities.map((entity) => html`
                  <div class="entity-search-result" @mousedown=${(e: Event) => { e.preventDefault(); this._addRoomPinEntity(entity.entity_id); this._roomPinSearch = ''; this.requestUpdate(); }}>
                    <span class="entity-search-name">${entity.name}</span>
                    <span class="entity-search-id">${entity.entity_id}</span>
                  </div>
                `)
                : html`<div class="entity-search-no-results">${localize('editor.no_results')}</div>`
              }
            </div>
          ` : nothing}
        </div>
        <div class="description">${localize('editor.room_pins_desc')}</div>

        ${this._renderCheckbox('room-pins-show-state', localize('editor.show_state'), roomPinsShowState,
          (checked) => this._toggleChanged('room_pins_show_state', checked, false))}

        ${this._renderCheckbox('room-pins-hide-last-changed', localize('editor.hide_last_changed'), roomPinsHideLastChanged,
          (checked) => this._toggleChanged('room_pins_hide_last_changed', checked, false))}
      </div>
    `;
  }

  private _renderViewsSection(): TemplateResult {
    const showSummaryViews = this._config.show_summary_views === true;
    const showRoomViews = this._config.show_room_views === true;

    return html`
      <div class="section">
        <div class="section-title">${localize('editor.section_views')}</div>

        ${this._renderCheckbox('show-summary-views', localize('editor.show_summary_views'), showSummaryViews,
          (checked) => this._toggleChanged('show_summary_views', checked, false))}
        <div class="description">${localize('editor.show_summary_views_desc')}</div>

        ${this._renderCheckbox('show-room-views', localize('editor.show_room_views'), showRoomViews,
          (checked) => this._toggleChanged('show_room_views', checked, false))}
        <div class="description">${localize('editor.show_room_views_desc')}</div>
      </div>
    `;
  }

  private _renderCustomCardsSection(): TemplateResult {
    const customCards = this._config.custom_cards || [];
    const customCardsHeading = this._config.custom_cards_heading || '';
    const customCardsIcon = this._config.custom_cards_icon || '';

    return html`
      <div class="section">
        <div class="section-title" style="display: flex; align-items: center; gap: 8px;">
          ${localize('editor.section_custom_cards')}
          <a href="https://github.com/TheRealSimon42/simon42-dashboard-strategy/blob/main/assets/Eigene-Karten-hinzufugen.gif"
            target="_blank" rel="noopener"
            style="color: var(--primary-color); text-decoration: none; font-size: 18px;"
            title=${localize('editor.video_tutorial')}>&#x1F3AC;</a>
        </div>
        <div class="custom-item-row" style="margin-bottom: 12px;">
          <input type="text" id="custom-cards-heading"
            .value=${customCardsHeading}
            placeholder=${localize('editor.custom_cards_heading_placeholder')}
            style="flex: 2;"
            @change=${this._customCardsHeadingChanged} />
          <input type="text" id="custom-cards-icon"
            .value=${customCardsIcon}
            placeholder="mdi:cards"
            style="flex: 1;"
            @change=${this._customCardsIconChanged} />
        </div>
        <div class="description" style="margin-bottom: 8px;">${localize('editor.custom_cards_desc')}</div>

        <div id="custom-cards-list">
          ${customCards.length === 0
            ? html`<div class="empty-state">${localize('editor.no_custom_cards')}</div>`
            : customCards.map((card, index) => this._renderCustomCardItem(card, index))}
        </div>

        <button class="btn-primary" style="margin-top: 8px;" @click=${this._addCustomCard}>
          ${localize('editor.add_custom_card')}
        </button>
        <div class="description">${localize('editor.custom_cards_help')}</div>
      </div>
    `;
  }

  private _renderCustomBadgesSection(): TemplateResult {
    const customBadges = this._config.custom_badges || [];

    return html`
      <div class="section">
        <div class="section-title" style="display: flex; align-items: center; gap: 8px;">
          ${localize('editor.section_custom_badges')}
          <a href="https://github.com/TheRealSimon42/simon42-dashboard-strategy/blob/main/assets/Custom-Badges-hinzufugen.gif"
            target="_blank" rel="noopener"
            style="color: var(--primary-color); text-decoration: none; font-size: 18px;"
            title=${localize('editor.video_tutorial')}>&#x1F3AC;</a>
        </div>

        <div id="custom-badges-list">
          ${customBadges.length === 0
            ? html`<div class="empty-state">${localize('editor.no_custom_badges')}</div>`
            : customBadges.map((badge, index) => this._renderCustomBadgeItem(badge, index))}
        </div>

        <button class="btn-primary" style="margin-top: 8px;" @click=${this._addCustomBadge}>
          ${localize('editor.add_custom_badge')}
        </button>
        <div class="description">${localize('editor.custom_badges_help')}</div>
      </div>
    `;
  }

  private _renderCustomViewsSection(): TemplateResult {
    const customViews = this._config.custom_views || [];

    return html`
      <div class="section">
        <div class="section-title" style="display: flex; align-items: center; gap: 8px;">
          ${localize('editor.section_custom_views')}
          <a href="https://github.com/TheRealSimon42/simon42-dashboard-strategy/blob/main/assets/Custom-View-hinzufugen.gif"
            target="_blank" rel="noopener"
            style="color: var(--primary-color); text-decoration: none; font-size: 18px;"
            title=${localize('editor.video_tutorial')}>&#x1F3AC;</a>
        </div>

        <div id="custom-views-list">
          ${customViews.length === 0
            ? html`<div class="empty-state">${localize('editor.no_custom_views')}</div>`
            : customViews.map((view, index) => this._renderCustomViewItem(view, index))}
        </div>

        <button class="btn-primary" style="margin-top: 8px;" @click=${this._addCustomView}>
          ${localize('editor.add_custom_view')}
        </button>
        <div class="description">${localize('editor.custom_views_help')}</div>
      </div>
    `;
  }

  // ====================================================================
  // ITEM RENDERERS
  // ====================================================================

  private _renderCheckbox(
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

  private _renderCustomViewItem(view: CustomView, index: number): TemplateResult {
    const validationMsg = view._yaml_error
      ? html`<span style="color: var(--error-color);">&#x274C; ${view._yaml_error}</span>`
      : view.yaml
        ? html`<span style="color: var(--success-color, green);">&#x2705; ${localize('editor.yaml_valid')}</span>`
        : nothing;

    return html`
      <div class="custom-item" data-index=${index}>
        <div class="custom-item-header">
          <strong>${view.title || localize('editor.new_view')}</strong>
          <button class="btn-remove" @click=${() => this._removeCustomView(index)}>&#x2715;</button>
        </div>
        <div class="custom-item-fields">
          <div class="custom-item-row">
            <input type="text" .value=${view.title || ''} placeholder=${localize('editor.title_placeholder')}
              style="flex: 2;"
              @change=${(e: Event) => this._updateCustomViewField(index, 'title', (e.target as HTMLInputElement).value)} />
            <input type="text" .value=${view.path || ''} placeholder=${localize('editor.path_placeholder')}
              style="flex: 2;"
              @change=${(e: Event) => this._updateCustomViewField(index, 'path', (e.target as HTMLInputElement).value)} />
            <input type="text" .value=${view.icon || ''} placeholder="mdi:star"
              style="flex: 1;"
              @change=${(e: Event) => this._updateCustomViewField(index, 'icon', (e.target as HTMLInputElement).value)} />
          </div>
          <textarea rows="8" placeholder=${localize('editor.yaml_placeholder')}
            .value=${view.yaml || ''}
            style="width: 100%;"
            @change=${(e: Event) => this._updateCustomViewYaml(index, (e.target as HTMLTextAreaElement).value)}></textarea>
          <div class="custom-item-validation">
            ${validationMsg}
          </div>
        </div>
      </div>
    `;
  }

  private _renderCustomCardItem(card: CustomCard, index: number): TemplateResult {
    const validationMsg = card._yaml_error
      ? html`<span style="color: var(--error-color);">&#x274C; ${card._yaml_error}</span>`
      : card.yaml
        ? html`<span style="color: var(--success-color, green);">&#x2705; ${localize('editor.yaml_valid')}</span>`
        : nothing;

    return html`
      <div class="custom-item" data-index=${index}>
        <div class="custom-item-header">
          <strong>${card.title || localize('editor.new_card')}</strong>
          <button class="btn-remove" @click=${() => this._removeCustomCard(index)}>&#x2715;</button>
        </div>
        <div class="custom-item-fields">
          <input type="text" .value=${card.title || ''} placeholder=${localize('editor.card_title_placeholder')}
            @change=${(e: Event) => this._updateCustomCardField(index, 'title', (e.target as HTMLInputElement).value)} />
          <textarea rows="6" placeholder=${localize('editor.yaml_placeholder')}
            .value=${card.yaml || ''}
            style="width: 100%;"
            @change=${(e: Event) => this._updateCustomCardYaml(index, (e.target as HTMLTextAreaElement).value)}></textarea>
          <div class="custom-item-validation">
            ${validationMsg}
          </div>
        </div>
      </div>
    `;
  }

  private _renderCustomBadgeItem(badge: CustomBadge, index: number): TemplateResult {
    const validationMsg = badge._yaml_error
      ? html`<span style="color: var(--error-color);">&#x274C; ${badge._yaml_error}</span>`
      : badge.yaml
        ? html`<span style="color: var(--success-color, green);">&#x2705; ${localize('editor.yaml_valid')}</span>`
        : nothing;

    return html`
      <div class="custom-item" data-index=${index}>
        <div class="custom-item-header">
          <strong>Badge ${index + 1}</strong>
          <button class="btn-remove" @click=${() => this._removeCustomBadge(index)}>&#x2715;</button>
        </div>
        <textarea rows="4" placeholder="type: entity&#10;entity: sun.sun"
          .value=${badge.yaml || ''}
          style="width: 100%;"
          @change=${(e: Event) => this._updateCustomBadgeYaml(index, (e.target as HTMLTextAreaElement).value)}></textarea>
        <div class="custom-item-validation">
          ${validationMsg}
        </div>
      </div>
    `;
  }

  // ====================================================================
  // AREA RENDERERS
  // ====================================================================

  private _renderAreaItems(
    allAreas: AreaRegistryEntry[],
    hiddenAreas: string[],
    areaOrder: string[]
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
                  ? this._renderAreaEntities(area.area_id, cachedData)
                  : html`<div class="loading-placeholder">${localize('editor.loading_entities')}</div>`}
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
    ];

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

          return html`
            <div class="entity-group" data-group=${group.key}>
              <div class="entity-group-header"
                @click=${() => this._toggleGroupExpand(areaId, group.key)}>
                <input type="checkbox" class="group-checkbox"
                  data-area-id=${areaId}
                  data-group=${group.key}
                  ?checked=${!allHidden}
                  .indeterminate=${someHidden}
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
                            ?checked=${!isEntityHidden}
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
    const badgeCandidates = getAreaBadgeCandidates(areaId, this._hass);
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

  private _refreshAreaCache(areaId: string): void {
    if (!this._hass || !this._areaEntitiesCache.has(areaId)) return;

    const groupedEntities = this._areaEntitiesCache.get(areaId)!.groupedEntities;
    const hiddenEntities = getHiddenEntitiesForArea(areaId, this._config);
    const entityOrders = getEntityOrdersForArea(areaId, this._config);
    const badgeCandidates = getAreaBadgeCandidates(areaId, this._hass);
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

  private _toggleChanged(key: string, value: boolean, defaultValue: boolean): void {
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

  private _alarmEntityChanged(e: Event): void {
    if (!this._hass) return;

    const entityId = (e.target as HTMLSelectElement).value;
    const newConfig: Simon42StrategyConfig = {
      ...this._config,
      alarm_entity: entityId,
    };

    if (!entityId || entityId === '') {
      delete newConfig.alarm_entity;
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

  private _addFavoriteFromSelect(): void {
    const select = this.shadowRoot!.querySelector('#favorite-entity-select') as HTMLSelectElement | null;
    if (!select || !select.value) return;
    this._addFavoriteEntity(select.value);
    select.value = '';
  }

  private _addFavoriteEntity(entityId: string): void {
    if (!this._hass) return;
    const currentFavorites = this._config.favorite_entities || [];
    if (currentFavorites.includes(entityId)) return;

    const newConfig: Simon42StrategyConfig = {
      ...this._config,
      favorite_entities: [...currentFavorites, entityId],
    };

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _removeFavoriteEntity(entityId: string): void {
    if (!this._hass) return;
    const currentFavorites = this._config.favorite_entities || [];
    const newFavorites = currentFavorites.filter((id) => id !== entityId);

    const newConfig: Simon42StrategyConfig = {
      ...this._config,
      favorite_entities: newFavorites.length > 0 ? newFavorites : undefined,
    };

    if (newFavorites.length === 0) {
      delete newConfig.favorite_entities;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  // -- Room Pins --------------------------------------------------------

  private _addRoomPinFromSelect(): void {
    const select = this.shadowRoot!.querySelector('#room-pin-entity-select') as HTMLSelectElement | null;
    if (!select || !select.value) return;
    this._addRoomPinEntity(select.value);
    select.value = '';
  }

  private _addRoomPinEntity(entityId: string): void {
    if (!this._hass) return;
    const currentPins = this._config.room_pin_entities || [];
    if (currentPins.includes(entityId)) return;

    const newConfig: Simon42StrategyConfig = {
      ...this._config,
      room_pin_entities: [...currentPins, entityId],
    };

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _removeRoomPinEntity(entityId: string): void {
    if (!this._hass) return;
    const currentPins = this._config.room_pin_entities || [];
    const newPins = currentPins.filter((id) => id !== entityId);

    const newConfig: Simon42StrategyConfig = {
      ...this._config,
      room_pin_entities: newPins.length > 0 ? newPins : undefined,
    };

    if (newPins.length === 0) {
      delete newConfig.room_pin_entities;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  // -- Custom Views -----------------------------------------------------

  private _addCustomView(): void {
    const customViews: CustomView[] = [...(this._config.custom_views || [])];
    customViews.push({
      title: 'Neue View',
      path: `custom-view-${customViews.length + 1}`,
      icon: 'mdi:card-text-outline',
      yaml: '',
      parsed_config: undefined,
    } as CustomView);

    const newConfig: Simon42StrategyConfig = { ...this._config, custom_views: customViews };
    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _removeCustomView(index: number): void {
    const customViews: CustomView[] = [...(this._config.custom_views || [])];
    customViews.splice(index, 1);

    const newConfig: Simon42StrategyConfig = { ...this._config };
    if (customViews.length === 0) {
      delete newConfig.custom_views;
    } else {
      newConfig.custom_views = customViews;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _updateCustomViewField(index: number, field: string, value: string): void {
    const customViews: CustomView[] = [...(this._config.custom_views || [])];
    if (!customViews[index]) return;

    customViews[index] = { ...customViews[index], [field]: value };

    const newConfig: Simon42StrategyConfig = { ...this._config, custom_views: customViews };
    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _updateCustomViewYaml(index: number, yamlString: string): void {
    const customViews: CustomView[] = [...(this._config.custom_views || [])];
    if (!customViews[index]) return;

    const updated: CustomView = { ...customViews[index], yaml: yamlString };
    delete updated._yaml_error;

    if (yamlString.trim()) {
      try {
        const parsed = yaml.load(yamlString);
        if (parsed && typeof parsed === 'object') {
          updated.parsed_config = parsed as Record<string, any>;
        } else {
          updated._yaml_error = 'YAML muss ein Objekt ergeben';
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

    customViews[index] = updated;

    const newConfig: Simon42StrategyConfig = { ...this._config, custom_views: customViews };
    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  // -- Custom Cards -----------------------------------------------------

  private _customCardsHeadingChanged(e: Event): void {
    const value = (e.target as HTMLInputElement).value.trim();
    const newConfig: Simon42StrategyConfig = { ...this._config };
    if (value) {
      newConfig.custom_cards_heading = value;
    } else {
      delete newConfig.custom_cards_heading;
    }
    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _customCardsIconChanged(e: Event): void {
    const value = (e.target as HTMLInputElement).value.trim();
    const newConfig: Simon42StrategyConfig = { ...this._config };
    if (value) {
      newConfig.custom_cards_icon = value;
    } else {
      delete newConfig.custom_cards_icon;
    }
    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _addCustomCard(): void {
    const customCards: CustomCard[] = [...(this._config.custom_cards || [])];
    customCards.push({ title: '', yaml: '', parsed_config: undefined } as CustomCard);

    const newConfig: Simon42StrategyConfig = { ...this._config, custom_cards: customCards };
    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _removeCustomCard(index: number): void {
    const customCards: CustomCard[] = [...(this._config.custom_cards || [])];
    customCards.splice(index, 1);

    const newConfig: Simon42StrategyConfig = { ...this._config };
    if (customCards.length === 0) {
      delete newConfig.custom_cards;
    } else {
      newConfig.custom_cards = customCards;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _updateCustomCardField(index: number, field: string, value: string): void {
    const customCards: CustomCard[] = [...(this._config.custom_cards || [])];
    if (!customCards[index]) return;

    customCards[index] = { ...customCards[index], [field]: value };

    const newConfig: Simon42StrategyConfig = { ...this._config, custom_cards: customCards };
    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _updateCustomCardYaml(index: number, yamlString: string): void {
    const customCards: CustomCard[] = [...(this._config.custom_cards || [])];
    if (!customCards[index]) return;

    const updated: CustomCard = { ...customCards[index], yaml: yamlString };
    delete updated._yaml_error;

    if (yamlString.trim()) {
      try {
        const parsed = yaml.load(yamlString);
        if (parsed && typeof parsed === 'object') {
          updated.parsed_config = parsed as Record<string, any>;
        } else {
          updated._yaml_error = 'YAML muss ein Objekt oder Array ergeben';
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

    customCards[index] = updated;

    const newConfig: Simon42StrategyConfig = { ...this._config, custom_cards: customCards };
    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  // -- Custom Badges ----------------------------------------------------

  private _addCustomBadge(): void {
    const customBadges: CustomBadge[] = [...(this._config.custom_badges || [])];
    customBadges.push({ yaml: '', parsed_config: undefined } as CustomBadge);

    const newConfig: Simon42StrategyConfig = { ...this._config, custom_badges: customBadges };
    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _removeCustomBadge(index: number): void {
    const customBadges: CustomBadge[] = [...(this._config.custom_badges || [])];
    customBadges.splice(index, 1);

    const newConfig: Simon42StrategyConfig = { ...this._config };
    if (customBadges.length === 0) {
      delete newConfig.custom_badges;
    } else {
      newConfig.custom_badges = customBadges;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  private _updateCustomBadgeYaml(index: number, yamlString: string): void {
    const customBadges: CustomBadge[] = [...(this._config.custom_badges || [])];
    if (!customBadges[index]) return;

    const updated: CustomBadge = { ...customBadges[index], yaml: yamlString };
    delete updated._yaml_error;

    if (yamlString.trim()) {
      try {
        const parsed = yaml.load(yamlString);
        if (parsed && typeof parsed === 'object') {
          updated.parsed_config = parsed as Record<string, any>;
        } else {
          updated._yaml_error = 'YAML muss ein Objekt ergeben';
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

    customBadges[index] = updated;

    const newConfig: Simon42StrategyConfig = { ...this._config, custom_badges: customBadges };
    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

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

  private _entityDraggedId: string | null = null;

  private _handleEntityDragStart = (ev: DragEvent, _listType: 'favorites' | 'room_pins'): void => {
    const item = (ev.target as HTMLElement).closest('.entity-list-item') as HTMLElement | null;
    if (!item) { ev.preventDefault(); return; }

    item.classList.add('dragging');
    this._entityDraggedId = item.dataset.entityId || null;
    if (ev.dataTransfer) {
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('text/plain', this._entityDraggedId || '');
    }
  };

  private _handleEntityDragEnd = (ev: DragEvent): void => {
    const item = (ev.target as HTMLElement).closest('.entity-list-item') as HTMLElement | null;
    if (item) item.classList.remove('dragging');
    this._entityDraggedId = null;
  };

  private _handleEntityDragOver = (ev: DragEvent): void => {
    ev.preventDefault();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
    const item = (ev.currentTarget as HTMLElement);
    if (item.dataset.entityId !== this._entityDraggedId) {
      item.classList.add('drag-over');
    }
  };

  private _handleEntityDragLeave = (ev: DragEvent): void => {
    (ev.currentTarget as HTMLElement).classList.remove('drag-over');
  };

  private _handleEntityDrop = (ev: DragEvent, listType: 'favorites' | 'room_pins'): void => {
    ev.stopPropagation();
    ev.preventDefault();

    const dropTarget = ev.currentTarget as HTMLElement;
    dropTarget.classList.remove('drag-over');

    const draggedId = this._entityDraggedId;
    const dropId = dropTarget.dataset.entityId;
    if (!draggedId || !dropId || draggedId === dropId) return;

    const currentList = listType === 'favorites'
      ? [...(this._config.favorite_entities || [])]
      : [...(this._config.room_pin_entities || [])];

    const draggedIndex = currentList.indexOf(draggedId);
    const dropIndex = currentList.indexOf(dropId);
    if (draggedIndex === -1 || dropIndex === -1) return;

    currentList.splice(draggedIndex, 1);
    currentList.splice(dropIndex, 0, draggedId);

    const key = listType === 'favorites' ? 'favorite_entities' : 'room_pin_entities';
    const newConfig: Simon42StrategyConfig = { ...this._config, [key]: currentList };
    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  };

  // ====================================================================
  // CONFIG DISPATCH
  // ====================================================================

  private _fireConfigChanged(config: Simon42StrategyConfig): void {
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
    switches: [],
    locks: [],
    automations: [],
    scripts: [],
    cameras: [],
  };

  const excludeLabels = entities
    .filter((e: EntityRegistryEntry) => e.labels?.includes('no_dboard'))
    .map((e: EntityRegistryEntry) => e.entity_id);

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
    } else if (domain === 'vacuum') {
      roomEntities.vacuum.push(entity.entity_id);
    } else if (domain === 'fan') {
      roomEntities.fan.push(entity.entity_id);
    } else if (domain === 'switch') {
      roomEntities.switches.push(entity.entity_id);
    } else if (domain === 'lock') {
      roomEntities.locks.push(entity.entity_id);
    }
  }

  return roomEntities;
}

function getAreaBadgeCandidates(areaId: string, hass: HomeAssistant): string[] {
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
