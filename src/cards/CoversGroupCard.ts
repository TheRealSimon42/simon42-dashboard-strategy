// ====================================================================
// COVERS GROUP CARD — Reactive card for open/closed cover groups (LitElement)
// ====================================================================

import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import type { HomeAssistant } from '../types/homeassistant';
import type { AreaRegistryEntry } from '../types/registries';
import { Registry } from '../Registry';
import { trackHassUpdate } from '../utils/debug';
import { localize } from '../utils/localize';
import { isEntityCurrentlyAvailable } from '../utils/availability-utils';
import { getVisibleAreasFromHass } from '../utils/name-utils';
import { getRelevantCoverIds, type CoverGroupType } from '../utils/cover-state-utils';
import { buildCombinedCoverHeadingConfig } from '../utils/cover-heading-utils';
import type { AreasDisplay } from '../types/strategy';

interface LovelaceCardElement extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: Record<string, unknown>): void;
}

declare global {
  interface Window {
    customCards?: Array<{ type: string; name: string; description: string }>;
  }
}

interface CoversGroupConfig {
  config?: any;
  group_type: CoverGroupType;
  show_partially_open?: boolean;
  device_classes?: string[];
  heading_open?: string;
  heading_closed?: string;
  heading_partial?: string;
  heading_all?: string;
  batch_open_text?: string;
  batch_close_text?: string;
  icon_open?: string;
  icon_closed?: string;
  icon_partial?: string;
  icon_all?: string;
  group_by_floors?: boolean;
  group_by_areas?: boolean;
}

interface CoversAreaGroup {
  areaId: string | null; // null = "no area" bucket
  areaName: string;
  covers: string[];
}

interface CoversFloorGroup {
  floorId: string | null;
  floorName: string;
  floorIcon: string;
  covers: string[];
  areas: CoversAreaGroup[]; // populated only when group_by_areas is on
}

// Pre-compiled RegExps for cover type name stripping
const COVER_TERMS = [
  'Rollo',
  'Rollladen',
  'Jalousie',
  'Vorhang',
  'Gardine',
  'Rolladen',
  'Beschattung',
  'Raffstore',
  'Fenster',
  'Cover',
  'Blind',
  'Curtain',
  'Shade',
  'Shutter',
  'Window',
  'Markise',
  'Awning',
];
const COVER_TERM_REGEXPS = COVER_TERMS.map((term) => new RegExp(`^${term}\\s+|\\s+${term}$`, 'gi'));

const DEFAULT_DEVICE_CLASSES = ['awning', 'blind', 'curtain', 'shade', 'shutter', 'window'];

class Simon42CoversGroupCard extends LitElement {
  static properties = {
    hass: { attribute: false },
  };

  public hass?: HomeAssistant;
  private _config!: CoversGroupConfig;
  private _deviceClasses!: string[];
  private _cachedFilteredIds: Set<string> | null = null;
  private _cachedAreaForEntity: Map<string, string | null> | null = null;
  private _lastCoversList = '';

  // Reusable card pool
  private _tileCards: Map<string, any> = new Map();
  private _headingCard: any = null;
  private _floorHeadingCards: Map<string, LovelaceCardElement> = new Map();
  private _areaHeadingCards: Map<string, LovelaceCardElement> = new Map();

  static styles = css`
    :host {
      display: block;
    }
    :host([hidden]) {
      display: none;
    }
    .covers-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }
    .cover-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 8px;
    }
    .floor-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .area-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  `;

  setConfig(config: CoversGroupConfig): void {
    this._config = config;
    this._deviceClasses = config.device_classes || DEFAULT_DEVICE_CLASSES;
  }

  protected willUpdate(changedProps: PropertyValues): void {
    if (!changedProps.has('hass') || !this.hass) return;

    trackHassUpdate('covers-group');
    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;

    if (!oldHass || oldHass.entities !== this.hass.entities) {
      this._cachedFilteredIds = null;
      this._cachedAreaForEntity = null;
    }

    // Build cache if needed
    if (!this._cachedFilteredIds) {
      if (!Registry.initialized) return;
      this._cachedFilteredIds = new Set(this._getFilteredCoverEntities(this.hass));
    }

    // Always propagate hass to child cards
    this._propagateHass(this.hass);
  }

  private _propagateHass(hass: HomeAssistant): void {
    if (this._headingCard) this._headingCard.hass = hass;
    for (const card of this._tileCards.values()) {
      card.hass = hass;
    }
  }

  private _getFilteredCoverEntities(hass: HomeAssistant): string[] {
    return Registry.getVisibleEntityIdsForDomain('cover').filter((id) => {
      const state = hass.states[id];
      if (!state) return false;
      const deviceClass = (state.attributes as any)?.device_class as string | undefined;
      // Covers without device_class only match the main group (multiple classes), not specialized groups like awnings/windows
      if (!deviceClass) return this._deviceClasses.length > 1;
      return this._deviceClasses.includes(deviceClass);
    });
  }

  private _getRelevantCovers(): string[] {
    if (!this.hass || !this._cachedFilteredIds) return [];
    const groupType = this._config.group_type;
    const showPartiallyOpen = this._config.show_partially_open === true;

    return getRelevantCoverIds(
      this._cachedFilteredIds,
      this.hass.states,
      groupType,
      showPartiallyOpen,
      (entityId) => isEntityCurrentlyAvailable(this.hass!, entityId, this._config.config),
    );
  }

  private _getAreaForEntity(entityId: string): string | null {
    if (!this._cachedAreaForEntity) this._cachedAreaForEntity = new Map();
    if (this._cachedAreaForEntity.has(entityId)) {
      return this._cachedAreaForEntity.get(entityId) ?? null;
    }
    const entity = Registry.getEntity(entityId);
    let areaId: string | null = entity?.area_id ?? null;
    if (!areaId && entity?.device_id) {
      const device = Registry.getDevice(entity.device_id);
      areaId = device?.area_id ?? null;
    }
    this._cachedAreaForEntity.set(entityId, areaId);
    return areaId;
  }

  private _groupByFloors(covers: string[]): CoversFloorGroup[] {
    if (!this.hass) return [];

    const areas: AreaRegistryEntry[] = Object.values(this.hass.areas);
    const areaFloorMap = new Map<string, string | null>();
    for (const area of areas) {
      areaFloorMap.set(area.area_id, area.floor_id ?? null);
    }

    const floorMap = new Map<string | null, string[]>();
    for (const id of covers) {
      const areaId = this._getAreaForEntity(id);
      const floorId = areaId ? (areaFloorMap.get(areaId) ?? null) : null;
      if (!floorMap.has(floorId)) floorMap.set(floorId, []);
      floorMap.get(floorId)?.push(id);
    }

    // HA's floor registry order preserves the user-defined "Reorder areas and floors" sequence
    const floors = this.hass.floors;
    const floorOrder = Object.keys(floors);
    const sortedKeys: (string | null)[] = [
      ...floorOrder.filter((id) => floorMap.has(id)),
      ...(floorMap.has(null) ? [null] : []),
    ];

    return sortedKeys.map((floorId) => {
      const floor = floorId ? floors[floorId] : null;
      return {
        floorId,
        floorName: floor?.name || localize('lights.floor_other'),
        floorIcon: floor?.icon || 'mdi:home-outline',
        covers: floorMap.get(floorId) ?? [],
        areas: [],
      };
    });
  }

  /**
   * Bucket a set of covers by area, following the user's area visibility/order
   * (areas_display + use_default_area_sort) — same source the security view and
   * the batteries view use. Entities without an area land in a trailing
   * "no area" bucket (#406).
   */
  private _groupByAreas(covers: string[]): CoversAreaGroup[] {
    if (!this.hass) return [];
    const dashboardConfig = (this._config.config || {}) as { areas_display?: AreasDisplay; use_default_area_sort?: boolean };
    const visibleAreas = getVisibleAreasFromHass(this.hass, dashboardConfig.areas_display, dashboardConfig.use_default_area_sort);

    const byArea = new Map<string, string[]>();
    const noArea: string[] = [];
    for (const id of covers) {
      const areaId = this._getAreaForEntity(id);
      if (!areaId) {
        noArea.push(id);
        continue;
      }
      const arr = byArea.get(areaId) || [];
      arr.push(id);
      byArea.set(areaId, arr);
    }

    const groups: CoversAreaGroup[] = [];
    for (const area of visibleAreas) {
      const arr = byArea.get(area.area_id);
      if (!arr || arr.length === 0) continue;
      groups.push({ areaId: area.area_id, areaName: area.name, covers: arr });
    }
    if (noArea.length > 0) {
      groups.push({ areaId: null, areaName: localize('covers.no_area'), covers: noArea });
    }
    return groups;
  }

  private _getFloorDomKey(floorId: string | null): string {
    return floorId ?? '_none';
  }

  private _getAreaDomKey(areaId: string | null): string {
    return areaId ?? '_none';
  }

  /** Stable DOM id for an area heading/grid, optionally scoped under a floor. */
  private _getAreaSlotId(prefix: 'area-heading' | 'area-grid', floorKey: string | null, areaKey: string): string {
    return floorKey !== null ? `${prefix}-${floorKey}__${areaKey}` : `${prefix}-${areaKey}`;
  }

  private _stripCoverType(entityId: string): string {
    const state = this.hass?.states[entityId];
    if (!state) return entityId;

    let name = state.attributes.friendly_name || entityId;

    for (const regex of COVER_TERM_REGEXPS) {
      regex.lastIndex = 0;
      name = name.replace(regex, '');
    }

    return name.trim() || state.attributes.friendly_name || entityId;
  }

  private _buildHeadingConfig(
    covers: string[],
    opts: { label?: string; icon?: string; level?: 'main' | 'floor' | 'area'; areaId?: string | null } = {},
  ): Record<string, unknown> {
    const level = opts.level ?? 'main';

    // Security-style sub-headings when grouping by area: bare area/floor name,
    // no count, no batch badges. Floor = title (with icon), area = subtitle and
    // tappable → room view — matches the security view's area-grouped layout.
    // The single main heading keeps its count + global batch button.
    if (this._config.group_by_areas === true && level !== 'main') {
      const cfg: Record<string, unknown> = {
        type: 'heading',
        heading: opts.label,
        heading_style: level === 'floor' ? 'title' : 'subtitle',
      };
      if (opts.icon) cfg.icon = opts.icon;
      if (level === 'area' && opts.areaId) {
        cfg.tap_action = { action: 'navigate', navigation_path: opts.areaId };
      }
      return cfg;
    }

    const groupType = this._config.group_type;
    const floorLabel = opts.label;
    const floorIcon = opts.icon;
    const openText = this._config.batch_open_text || localize('covers.open_all');
    const closeText = this._config.batch_close_text || localize('covers.close_all');

    if (groupType === 'partially_open') {
      const headingLabel = floorLabel || this._config.heading_partial || localize('covers.partially_open');
      return {
        type: 'heading',
        heading: `${headingLabel} (${covers.length})`,
        icon: floorIcon || this._config.icon_partial || 'mdi:blinds-horizontal',
        badges: [
          {
            type: 'button',
            icon: 'mdi:arrow-up',
            text: openText,
            tap_action: {
              action: 'perform-action',
              perform_action: 'cover.open_cover',
              target: { entity_id: covers },
            },
          },
          {
            type: 'button',
            icon: 'mdi:arrow-down',
            text: closeText,
            tap_action: {
              action: 'perform-action',
              perform_action: 'cover.close_cover',
              target: { entity_id: covers },
            },
          },
        ],
      };
    }

    if (groupType === 'all') {
      const headingLabel = floorLabel || this._config.heading_all || localize('covers.all');
      return buildCombinedCoverHeadingConfig(
        covers,
        headingLabel,
        floorIcon || this._config.icon_all || 'mdi:blinds-horizontal',
        openText,
        closeText,
      );
    }

    const isOpen = groupType === 'open';
    const headingLabel = floorLabel || (isOpen
      ? (this._config.heading_open || localize('covers.open'))
      : (this._config.heading_closed || localize('covers.closed')));
    const defaultIcon = isOpen ? 'mdi:blinds-horizontal' : 'mdi:blinds';
    const headingIcon = floorIcon
      || (isOpen ? (this._config.icon_open || defaultIcon) : (this._config.icon_closed || defaultIcon));
    return {
      type: 'heading',
      heading: `${headingLabel} (${covers.length})`,
      icon: headingIcon,
      badges: [
        {
          type: 'button',
          icon: isOpen ? 'mdi:arrow-down' : 'mdi:arrow-up',
          text: isOpen ? closeText : openText,
          tap_action: {
            action: 'perform-action',
            perform_action: isOpen ? 'cover.close_cover' : 'cover.open_cover',
            target: { entity_id: covers },
          },
        },
      ],
    };
  }

  private _getOrCreateTileCard(entityId: string): any {
    let card = this._tileCards.get(entityId);
    if (card) return card;

    card = document.createElement('hui-tile-card');
    card.hass = this.hass;
    card.setConfig({
      type: 'tile',
      entity: entityId,
      name: this._stripCoverType(entityId),
      features: [{ type: 'cover-open-close' }],
      vertical: false,
      features_position: 'inline',
      state_content: ['current_position', 'last_changed'],
    });
    this._tileCards.set(entityId, card);
    return card;
  }

  private _calculateRenderKey(covers: string[]): string {
    return covers
      .map((id) => {
        const state = this.hass?.states[id];
        if (!state) return id;
        const position = (state.attributes as any)?.current_position;
        if (typeof position === 'number') {
          return `${id}:${state.state}:${position}`;
        }
        return `${id}:${state.state}`;
      })
      .join(',');
  }

  protected render() {
    if (!this.hass || !this._cachedFilteredIds) return nothing;

    const covers = this._getRelevantCovers();
    this.hidden = covers.length === 0;

    const groupByFloors = this._config.group_by_floors === true;
    const groupByAreas = this._config.group_by_areas === true;

    // Floor mode — optionally with nested area blocks per floor
    if (groupByFloors && covers.length > 0) {
      const floorGroups = this._groupByFloors(covers);
      return html`
        <div class="covers-section">
          <div id="heading"></div>
          ${floorGroups.map((group) => {
            const floorKey = this._getFloorDomKey(group.floorId);
            const areas = groupByAreas ? this._groupByAreas(group.covers) : [];
            return html`
              <div class="floor-section">
                <div id=${`floor-heading-${floorKey}`}></div>
                ${groupByAreas
                  ? areas.map((area) => {
                      const areaKey = this._getAreaDomKey(area.areaId);
                      return html`
                        <div class="area-section">
                          <div id=${this._getAreaSlotId('area-heading', floorKey, areaKey)}></div>
                          <div class="cover-grid" id=${this._getAreaSlotId('area-grid', floorKey, areaKey)}></div>
                        </div>
                      `;
                    })
                  : html`<div class="cover-grid" id=${`floor-grid-${floorKey}`}></div>`}
              </div>
            `;
          })}
        </div>
      `;
    }

    // Area-only mode — no floor super-grouping
    if (groupByAreas && covers.length > 0) {
      const areas = this._groupByAreas(covers);
      return html`
        <div class="covers-section">
          <div id="heading"></div>
          ${areas.map((area) => {
            const areaKey = this._getAreaDomKey(area.areaId);
            return html`
              <div class="area-section">
                <div id=${this._getAreaSlotId('area-heading', null, areaKey)}></div>
                <div class="cover-grid" id=${this._getAreaSlotId('area-grid', null, areaKey)}></div>
              </div>
            `;
          })}
        </div>
      `;
    }

    // Flat mode — no grouping
    return html`
      <div class="covers-section">
        <div id="heading"></div>
        <div class="cover-grid" id="grid"></div>
      </div>
    `;
  }

  // --- reconciliation helpers (shared across flat / floor / area modes) ---

  /** Order pooled tile cards inside a grid slot to match `covers`, removing
   *  any tiles no longer belonging to this grid. */
  private _reconcileGrid(gridId: string, covers: string[]): void {
    const grid = this.shadowRoot?.getElementById(gridId);
    if (!grid) return;
    let prevNode: Node | null = null;
    for (const entityId of covers) {
      const card = this._getOrCreateTileCard(entityId);
      const nextSibling = prevNode ? prevNode.nextSibling : grid.firstChild;
      if (card !== nextSibling) grid.insertBefore(card, nextSibling);
      prevNode = card;
    }
    while (prevNode && prevNode.nextSibling) {
      grid.removeChild(prevNode.nextSibling);
    }
  }

  /** Create-or-update a pooled heading card in a slot. */
  private _reconcileHeadingCard(
    slotId: string,
    cardMap: Map<string, LovelaceCardElement>,
    key: string,
    headingConfig: Record<string, unknown>,
  ): void {
    const hass = this.hass;
    if (!hass) return;
    const slot = this.shadowRoot?.getElementById(slotId);
    if (!slot) return;
    let card = cardMap.get(key);
    if (!card) {
      card = document.createElement('hui-heading-card') as LovelaceCardElement;
      cardMap.set(key, card);
    }
    if (card.parentNode !== slot) slot.appendChild(card);
    card.hass = hass;
    card.setConfig(headingConfig);
  }

  /** Main heading (total count + batch over all covers) — present in every mode. */
  private _reconcileMainHeading(covers: string[]): void {
    const hass = this.hass;
    if (!hass) return;
    const slot = this.shadowRoot?.getElementById('heading');
    if (!slot) return;
    if (!this._headingCard) {
      this._headingCard = document.createElement('hui-heading-card');
      slot.appendChild(this._headingCard);
    }
    this._headingCard.hass = hass;
    this._headingCard.setConfig(this._buildHeadingConfig(covers));
  }

  /** Drop pooled heading cards whose key is no longer active. */
  private _cleanupHeadingCards(cardMap: Map<string, LovelaceCardElement>, activeKeys: Set<string>): void {
    for (const [key, card] of cardMap) {
      if (!activeKeys.has(key)) {
        if (card.parentNode) card.parentNode.removeChild(card);
        cardMap.delete(key);
      }
    }
  }

  /** Drop pooled tile cards whose entity is no longer active. */
  private _cleanupTileCards(activeIds: Set<string>): void {
    for (const [id, card] of this._tileCards) {
      if (!activeIds.has(id)) {
        if (card.parentNode) card.parentNode.removeChild(card);
        this._tileCards.delete(id);
      }
    }
  }

  private _clearSlots(): void {
    const headingSlot = this.shadowRoot?.getElementById('heading');
    if (headingSlot) headingSlot.innerHTML = '';
    const grid = this.shadowRoot?.getElementById('grid');
    if (grid) grid.innerHTML = '';
    this._headingCard = null;
    this._floorHeadingCards.clear();
    this._areaHeadingCards.clear();
    this._tileCards.clear();
    this._lastCoversList = '';
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this.hass || !this._cachedFilteredIds) return;

    const covers = this._getRelevantCovers();
    const coversKey = this._calculateRenderKey(covers);
    if (this._lastCoversList === coversKey) return;
    this._lastCoversList = coversKey;

    if (covers.length === 0) {
      this._clearSlots();
      return;
    }

    const groupByFloors = this._config.group_by_floors === true;
    const groupByAreas = this._config.group_by_areas === true;
    const activeIds = new Set(covers);

    // Main heading — every mode
    this._reconcileMainHeading(covers);

    if (groupByFloors) {
      const floorGroups = this._groupByFloors(covers);
      const activeFloorKeys = new Set<string>();
      const activeAreaKeys = new Set<string>();

      for (const group of floorGroups) {
        const floorKey = this._getFloorDomKey(group.floorId);
        activeFloorKeys.add(floorKey);
        this._reconcileHeadingCard(
          `floor-heading-${floorKey}`,
          this._floorHeadingCards,
          floorKey,
          this._buildHeadingConfig(group.covers, { label: group.floorName, icon: group.floorIcon, level: 'floor' }),
        );

        if (groupByAreas) {
          // Area blocks nested under this floor
          const areas = this._groupByAreas(group.covers);
          for (const area of areas) {
            const areaKey = this._getAreaDomKey(area.areaId);
            const compositeKey = `${floorKey}__${areaKey}`;
            activeAreaKeys.add(compositeKey);
            this._reconcileHeadingCard(
              this._getAreaSlotId('area-heading', floorKey, areaKey),
              this._areaHeadingCards,
              compositeKey,
              this._buildHeadingConfig(area.covers, { label: area.areaName, level: 'area', areaId: area.areaId }),
            );
            this._reconcileGrid(this._getAreaSlotId('area-grid', floorKey, areaKey), area.covers);
          }
        } else {
          this._reconcileGrid(`floor-grid-${floorKey}`, group.covers);
        }
      }

      this._cleanupHeadingCards(this._floorHeadingCards, activeFloorKeys);
      if (groupByAreas) this._cleanupHeadingCards(this._areaHeadingCards, activeAreaKeys);
      this._cleanupTileCards(activeIds);
      return;
    }

    if (groupByAreas) {
      // Area-only mode (no floor super-grouping)
      const areas = this._groupByAreas(covers);
      const activeAreaKeys = new Set<string>();
      for (const area of areas) {
        const areaKey = this._getAreaDomKey(area.areaId);
        activeAreaKeys.add(areaKey);
        this._reconcileHeadingCard(
          this._getAreaSlotId('area-heading', null, areaKey),
          this._areaHeadingCards,
          areaKey,
          this._buildHeadingConfig(area.covers, { label: area.areaName, level: 'area', areaId: area.areaId }),
        );
        this._reconcileGrid(this._getAreaSlotId('area-grid', null, areaKey), area.covers);
      }
      this._cleanupHeadingCards(this._areaHeadingCards, activeAreaKeys);
      this._cleanupTileCards(activeIds);
      return;
    }

    // Flat mode (no grouping)
    this._reconcileGrid('grid', covers);
    this._cleanupTileCards(activeIds);
  }

  getCardSize(): number {
    const covers = this._getRelevantCovers();
    return Math.ceil(covers.length / 3) + 1;
  }
}

customElements.define('simon42-covers-group-card', Simon42CoversGroupCard);
