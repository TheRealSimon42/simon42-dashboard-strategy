// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR HOST CONTRACT
// ====================================================================
// The editor is split into panel modules (src/editor/panels/*) that
// render into the host LitElement's shadow root. Panels receive the
// host instance and access exactly the members declared here — the
// interface documents which state and plumbing the panels rely on.
//
// Rules of thumb:
//   - Panel-local logic lives in the panel module (module-level
//     `function` declarations — no const arrows, see CLAUDE.md Codacy
//     pitfalls).
//   - Shared state (config, caches, search strings, drag handles)
//     lives on the host; panels mutate it through this contract and
//     call `requestUpdate()` / `fireConfigChanged()` as appropriate.
// ====================================================================

import type { TemplateResult } from 'lit';
import type { HomeAssistant } from '../types/homeassistant';
import type { Simon42StrategyConfig, SectionOrderKey, StackKey } from '../types/strategy';

/** Cached per-area entity grouping for the areas panel. */
export interface AreaEntitiesCacheEntry {
  groupedEntities: Record<string, string[]>;
  hiddenEntities: Record<string, string[]>;
  entityOrders: Record<string, string[]>;
  badgeCandidates: string[];
  additionalBadges: string[];
  availableEntities: Array<{ entity_id: string; name: string }>;
  defaultShowNames: Set<string>;
  namesVisible: string[];
  namesHidden: string[];
}

export interface StrategyEditorHost {
  // -- Core state -------------------------------------------------------
  _hass: HomeAssistant | null;
  _config: Simon42StrategyConfig;

  // -- Reactive UI state --------------------------------------------------
  /** Expanded editor panels (persisted via panels/panel-shell.ts). */
  _expandedPanels: Set<string>;
  _expandedAreas: Set<string>;
  _expandedGroups: Map<string, Set<string>>;

  // -- Entity search state (not reactive — panels call requestUpdate) ----
  _favoriteSearch: string;
  _roomPinSearch: string;
  _weatherSensorSearch: string;
  _securityExtraSearch: string;
  _lightFavSearch: string;

  // -- Caches / drag handles ---------------------------------------------
  _areaEntitiesCache: Map<string, AreaEntitiesCacheEntry>;
  _draggedElement: HTMLElement | null;
  _sectionDraggedElement: HTMLElement | null;
  _stackDraggedElement: HTMLElement | null;
  _entityDraggedId: string | null;

  /** Shadow root of the host element (LitElement render root). */
  readonly shadowRoot: ShadowRoot | null;

  // -- Plumbing (implemented by the host element) -------------------------
  requestUpdate(): void;
  _fireConfigChanged(config: Simon42StrategyConfig): void;
  /** Generic boolean-toggle writer: deletes the key when back at default. */
  _toggleChanged(key: string, value: boolean, defaultValue: boolean): void;
  /** Shared checkbox row used across panels. */
  _renderCheckbox(
    id: string,
    label: string,
    checked: boolean,
    onChange: (checked: boolean) => void,
    disabled?: boolean,
  ): TemplateResult;

  // -- Cross-panel config helpers ------------------------------------------
  _getSectionsOrder(): SectionOrderKey[];
  _getStacksOrder(areaId: string): StackKey[];
  _validCustomSectionKeys(): string[];
  /** Display meta (icon/label) for a section key incl. custom sections. */
  _sectionDisplayMeta(key: SectionOrderKey): { icon: string; label: string } | null;
}
