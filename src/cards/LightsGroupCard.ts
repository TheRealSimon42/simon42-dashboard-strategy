// ====================================================================
// LIGHTS GROUP CARD — Reactive card for on/off light groups (LitElement)
// ====================================================================

import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import type { HomeAssistant, HassEntity } from '../types/homeassistant';
import type { AreaRegistryEntry } from '../types/registries';
import { Registry } from '../Registry';
import { trackHassUpdate } from '../utils/debug';
import { localize } from '../utils/localize';
import { stripAreaName, getVisibleAreasFromHass } from '../utils/name-utils';
import type { AreasDisplay } from '../types/strategy';
import { isEntityCurrentlyAvailable } from '../utils/availability-utils';

declare global {
  interface Window {
    customCards?: Array<{ type: string; name: string; description: string }>;
    cardTools?: unknown;
  }
}

interface LightsGroupConfig {
  config?: any;
  entities?: string[];
  group_type: 'on' | 'off' | 'all';
  group_by_floors?: boolean;
  group_by_areas?: boolean;
  nested_groups?: boolean;
  heading_label?: string;
  heading_icon?: string;
  area?: AreaRegistryEntry;
  default_expanded?: boolean;
  sort_by?: 'last_changed' | 'name';
}

interface LightsAreaGroup {
  areaId: string | null; // null = "no area" bucket
  areaName: string;
  lights: string[];
}

interface FloorGroup {
  floorId: string | null;
  floorName: string;
  floorIcon: string;
  lights: string[];
  areas: LightsAreaGroup[]; // populated only when group_by_areas is on
}

interface LightHierarchyNode {
  entityId: string;
  childIds: string[];
}

interface LovelaceCardElement extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: Record<string, unknown>): void;
}

const LIGHT_BRIGHTNESS_MODES = ['brightness', 'color_temp', 'hs', 'xy', 'rgb', 'rgbw', 'rgbww', 'white'];

class Simon42LightsGroupCard extends LitElement {
  static properties = {
    hass: { attribute: false },
  };

  public hass?: HomeAssistant;
  private _config!: LightsGroupConfig;
  private _cachedSourceIds: Set<string> | null = null;
  private _cachedAreaForEntity: Map<string, string | null> | null = null;
  private _lastLightsList = '';

  // Reusable tile card pool (keyed by entity_id)
  private _tileCards: Map<string, LovelaceCardElement> = new Map();
  private _headingCard: LovelaceCardElement | null = null;
  private _floorHeadingCards: Map<string, LovelaceCardElement> = new Map();
  private _areaHeadingCards: Map<string, LovelaceCardElement> = new Map();
  private _groupContainers: Map<string, HTMLElement> = new Map();
  private _groupExpansion: Map<string, boolean> = new Map();

  static styles = css`
    :host {
      display: block;
    }
    :host([hidden]) {
      display: none;
    }
    .lights-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }
    .light-grid {
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
    .group-block {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      background: color-mix(in srgb, var(--card-background-color) 92%, var(--primary-color) 8%);
    }
    .group-header {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 8px;
      align-items: start;
    }
    .group-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      margin-top: 6px;
      border: none;
      border-radius: 999px;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    .group-toggle:hover {
      background: color-mix(in srgb, var(--secondary-background-color) 75%, var(--primary-color) 25%);
    }
    .group-toggle ha-icon {
      --mdc-icon-size: 18px;
      transition: transform 0.2s ease;
    }
    .group-toggle[aria-expanded='true'] ha-icon {
      transform: rotate(90deg);
    }
    .group-children {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 8px;
      padding-left: 44px;
    }
    .group-children[hidden] {
      display: none;
    }
  `;

  setConfig(config: LightsGroupConfig): void {
    if (!['on', 'off', 'all'].includes(config.group_type)) {
      throw new Error('You need to define group_type (on/off/all)');
    }
    this._config = config;
  }

  protected willUpdate(changedProps: PropertyValues): void {
    if (!changedProps.has('hass') || !this.hass) return;

    trackHassUpdate('lights-group');
    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;

    if (!oldHass || oldHass.entities !== this.hass.entities) {
      this._cachedSourceIds = null;
      this._cachedAreaForEntity = null;
    }

    // Build cache if needed
    if (!this._cachedSourceIds) {
      if (!Registry.initialized) return;
      this._cachedSourceIds = new Set(this._getSourceLightEntities());
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

  private _getState(entityId: string): HassEntity | undefined {
    if (!this.hass) return undefined;
    const state = Reflect.get(this.hass.states as Record<string, unknown>, entityId);
    return state as HassEntity | undefined;
  }

  private _getSourceLightEntities(): string[] {
    if (Array.isArray(this._config.entities) && this._config.entities.length > 0) {
      return this._config.entities.filter(
        (id) => id.startsWith('light.') && !Registry.isEntityInHiddenArea(id) && this._getState(id) !== undefined
      );
    }
    return Registry.getVisibleEntityIdsForDomain('light', true).filter((id) => this._getState(id) !== undefined);
  }

  private _getRelevantLights(lightIds?: Iterable<string>): string[] {
    if (!this.hass) return [];
    const sourceIds = lightIds ? Array.from(lightIds) : Array.from(this._cachedSourceIds || []);
    if (sourceIds.length === 0) return [];

    if (this._config.group_type === 'all') {
      return [...sourceIds].sort((a, b) => this._sortEntities(a, b));
    }

    const targetState = this._config.group_type === 'on' ? 'on' : 'off';

    const relevant: string[] = [];
    for (const id of sourceIds) {
      if (!isEntityCurrentlyAvailable(this.hass, id, this._config.config)) continue;
      const state = this._getState(id);
      if (state && state.state === targetState) relevant.push(id);
    }

    return relevant.sort((a, b) => this._sortEntities(a, b));
  }

  private _sortEntities(a: string, b: string): number {
    if (this._config.sort_by === 'name') {
      const nameA = this._getState(a)?.attributes?.friendly_name || a;
      const nameB = this._getState(b)?.attributes?.friendly_name || b;
      return String(nameA).localeCompare(String(nameB));
    }
    return this._sortByLastChanged(a, b);
  }

  private _sortByLastChanged(a: string, b: string): number {
    const stateA = this._getState(a);
    const stateB = this._getState(b);
    if (!stateA || !stateB) return 0;
    return new Date(stateB.last_changed).getTime() - new Date(stateA.last_changed).getTime();
  }

  private _getAreaForEntity(entityId: string): string | null {
    if (!this._cachedAreaForEntity) {
      this._cachedAreaForEntity = new Map();
    }
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

  private _getDisplayName(entityId: string): string | undefined {
    if (!this.hass) return undefined;
    if (this._config.area) {
      return stripAreaName(entityId, this._config.area, this.hass);
    }
    return undefined;
  }

  private _getGroupChildIds(entityId: string, candidateSet: Set<string>): string[] {
    const entityState = this._getState(entityId);
    const members = entityState?.attributes?.entity_id;
    if (!Array.isArray(members)) return [];

    const childIds = members.filter(
      (id): id is string => typeof id === 'string' && id.startsWith('light.') && id !== entityId && candidateSet.has(id)
    );

    return [...new Set(childIds)].sort((a, b) => this._sortEntities(a, b));
  }

  private _collectDescendants(
    entityId: string,
    rawChildren: Map<string, string[]>,
    descendantCache: Map<string, Set<string>>,
    visiting: Set<string>
  ): Set<string> {
    const cached = descendantCache.get(entityId);
    if (cached) return cached;
    if (visiting.has(entityId)) return new Set();

    visiting.add(entityId);
    const descendants = new Set<string>();
    for (const childId of rawChildren.get(entityId) || []) {
      descendants.add(childId);
      for (const nestedId of this._collectDescendants(childId, rawChildren, descendantCache, visiting)) {
        descendants.add(nestedId);
      }
    }
    visiting.delete(entityId);
    descendantCache.set(entityId, descendants);
    return descendants;
  }

  private _buildHierarchy(lightIds: string[]): { topLevelIds: string[]; nodes: Map<string, LightHierarchyNode> } {
    if (this._config.nested_groups !== true) {
      const nodes = new Map<string, LightHierarchyNode>();
      for (const entityId of lightIds) {
        nodes.set(entityId, { entityId, childIds: [] });
      }
      return { topLevelIds: [...lightIds], nodes };
    }

    const candidateSet = new Set(lightIds);
    const rawChildren = new Map<string, string[]>();
    for (const entityId of lightIds) {
      rawChildren.set(entityId, this._getGroupChildIds(entityId, candidateSet));
    }

    const descendantCache = new Map<string, Set<string>>();
    const nodes = new Map<string, LightHierarchyNode>();
    const allNestedChildIds = new Set<string>();
    for (const entityId of lightIds) {
      const directChildIds = rawChildren.get(entityId) || [];
      const prunedChildIds = directChildIds.filter((childId) => {
        return !directChildIds.some((siblingId) => {
          if (siblingId === childId) return false;
          return this._collectDescendants(siblingId, rawChildren, descendantCache, new Set<string>()).has(childId);
        });
      });
      nodes.set(entityId, { entityId, childIds: prunedChildIds });
      for (const childId of prunedChildIds) {
        allNestedChildIds.add(childId);
      }
    }

    const topLevelIds = lightIds
      .filter((entityId) => !allNestedChildIds.has(entityId))
      .sort((a, b) => this._sortEntities(a, b));

    return { topLevelIds, nodes };
  }

  private _groupByFloors(lights: string[]): FloorGroup[] {
    if (!this.hass) return [];

    const areas: AreaRegistryEntry[] = Object.values(this.hass.areas);
    const areaFloorMap = new Map<string, string | null>();
    for (const area of areas) {
      areaFloorMap.set(area.area_id, area.floor_id ?? null);
    }

    // Partition lights by floor
    const floorMap = new Map<string | null, string[]>();
    for (const id of lights) {
      const areaId = this._getAreaForEntity(id);
      const floorId = areaId ? (areaFloorMap.get(areaId) ?? null) : null;
      if (!floorMap.has(floorId)) floorMap.set(floorId, []);
      floorMap.get(floorId)?.push(id);
    }

    // Use HA's floor order from the registry. The hass.floors object preserves
    // the user-defined order from HA's "Reorder areas and floors" dialog via
    // Object.keys() insertion order — no separate sort_order field needed.
    const floors = this.hass.floors;
    const floorOrder = Object.keys(floors);
    const sortedKeys = [...floorOrder.filter((id) => floorMap.has(id)), ...(floorMap.has(null) ? [null] : [])];

    return sortedKeys.map((floorId) => {
      const floor = floorId ? floors[floorId] : null;
      return {
        floorId,
        floorName: floor?.name || localize('lights.floor_other'),
        floorIcon: floor?.icon || 'mdi:home-outline',
        lights: floorMap.get(floorId) ?? [],
        areas: [],
      };
    });
  }

  /**
   * Bucket a set of lights by area, following the user's area visibility/order
   * (areas_display + use_default_area_sort) — same source the security view and
   * batteries view use. Lights without an area land in a trailing "no area"
   * bucket (#406).
   */
  private _groupByAreas(lights: string[]): LightsAreaGroup[] {
    if (!this.hass) return [];
    const dashboardConfig = (this._config.config || {}) as {
      areas_display?: AreasDisplay;
      use_default_area_sort?: boolean;
    };
    const visibleAreas = getVisibleAreasFromHass(
      this.hass,
      dashboardConfig.areas_display,
      dashboardConfig.use_default_area_sort
    );

    const byArea = new Map<string, string[]>();
    const noArea: string[] = [];
    for (const id of lights) {
      const areaId = this._getAreaForEntity(id);
      if (!areaId) {
        noArea.push(id);
        continue;
      }
      const arr = byArea.get(areaId) || [];
      arr.push(id);
      byArea.set(areaId, arr);
    }

    const groups: LightsAreaGroup[] = [];
    for (const area of visibleAreas) {
      const arr = byArea.get(area.area_id);
      if (!arr || arr.length === 0) continue;
      groups.push({ areaId: area.area_id, areaName: area.name, lights: arr });
    }
    if (noArea.length > 0) {
      groups.push({ areaId: null, areaName: localize('lights.no_area'), lights: noArea });
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

  private _buildHeadingConfig(
    lights: string[],
    opts: { label?: string; icon?: string; level?: 'main' | 'floor' | 'area'; areaId?: string | null } = {}
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

    const isOn = this._config.group_type === 'on';
    const isAll = this._config.group_type === 'all';
    const label = opts.label;
    const heading = label
      ? `${label} (${lights.length})`
      : `${isAll ? this._config.heading_label || localize('room.lighting') : isOn ? localize('lights.on') : localize('lights.off')} (${lights.length})`;

    const badges =
      lights.length === 0
        ? []
        : [
            {
              type: 'button',
              icon: 'mdi:lightbulb-on',
              text: localize('lights.all_on'),
              tap_action: {
                action: 'perform-action',
                perform_action: 'light.turn_on',
                target: { entity_id: lights },
              },
              visibility: [
                { condition: 'or', conditions: lights.map((entity) => ({ condition: 'state', entity, state: 'off' })) },
              ],
            },
            {
              type: 'button',
              icon: 'mdi:lightbulb-off',
              text: localize('lights.all_off'),
              tap_action: {
                action: 'perform-action',
                perform_action: 'light.turn_off',
                target: { entity_id: lights },
              },
              visibility: [
                { condition: 'or', conditions: lights.map((entity) => ({ condition: 'state', entity, state: 'on' })) },
              ],
            },
          ];

    return {
      type: 'heading',
      heading,
      icon:
        opts.icon ||
        this._config.heading_icon ||
        (isAll ? 'mdi:lightbulb-group' : isOn ? 'mdi:lightbulb-group' : 'mdi:lightbulb-group-off'),
      badges,
    };
  }

  private _getOrCreateTileCard(entityId: string): LovelaceCardElement {
    const existingCard = this._tileCards.get(entityId);
    if (existingCard) return existingCard;

    const card = document.createElement('hui-tile-card') as LovelaceCardElement;
    card.hass = this.hass;
    const cardConfig: any = { type: 'tile', entity: entityId, vertical: false, state_content: 'last_changed' };
    const displayName = this._getDisplayName(entityId);
    if (displayName) {
      cardConfig.name = displayName;
    }
    const state = this._getState(entityId);
    const modes = state?.attributes?.supported_color_modes as string[] | undefined;
    const hasBrightness = modes?.some((m: string) => LIGHT_BRIGHTNESS_MODES.includes(m)) || false;
    if (this._config.group_type !== 'off' && hasBrightness) {
      // Keep the slider on supported lights in all interactive views.
      // HA handles disabled/irrelevant controls for unsupported runtime states.
      cardConfig.features = [{ type: 'light-brightness' }];
      cardConfig.features_position = 'inline';
    }
    card.setConfig(cardConfig);
    card.dataset.entityId = entityId;
    this._tileCards.set(entityId, card);
    return card;
  }

  private _isExpanded(entityId: string): boolean {
    return this._groupExpansion.get(entityId) ?? this._config.default_expanded === true;
  }

  private _getOrCreateGroupContainer(entityId: string): HTMLElement {
    let container = this._groupContainers.get(entityId);
    if (container) return container;

    container = document.createElement('div');
    container.className = 'group-block';
    container.dataset.entityId = entityId;
    const groupHeader = document.createElement('div');
    groupHeader.className = 'group-header';

    const toggleButton = document.createElement('button');
    toggleButton.className = 'group-toggle';
    toggleButton.type = 'button';
    toggleButton.setAttribute('aria-expanded', 'false');

    const toggleIcon = document.createElement('ha-icon');
    toggleIcon.setAttribute('icon', 'mdi:chevron-right');
    toggleButton.appendChild(toggleIcon);

    const groupCardHost = document.createElement('div');
    groupCardHost.className = 'group-card-slot';

    groupHeader.append(toggleButton, groupCardHost);

    const childContainer = document.createElement('div');
    childContainer.className = 'group-children';
    childContainer.hidden = true;

    container.append(groupHeader, childContainer);

    toggleButton.addEventListener('click', () => {
      const expanded = !this._isExpanded(entityId);
      this._groupExpansion.set(entityId, expanded);
      toggleButton.setAttribute('aria-expanded', String(expanded));
      childContainer.hidden = !expanded;
    });

    this._groupContainers.set(entityId, container);
    return container;
  }

  private _resolveHierarchyContainer(entityId: string, hasChildren: boolean): HTMLElement {
    if (hasChildren) {
      return this._getOrCreateGroupContainer(entityId);
    }
    return this._getOrCreateTileCard(entityId) as unknown as HTMLElement;
  }

  private _placeHierarchyNode(
    parentElement: HTMLElement,
    childElement: HTMLElement,
    referenceNode: ChildNode | null
  ): void {
    if (childElement !== referenceNode) {
      parentElement.insertBefore(childElement, referenceNode);
    }
  }

  private _syncGroupContainer(
    groupContainerElement: HTMLElement,
    entityId: string,
    childIds: string[],
    nodes: Map<string, LightHierarchyNode>
  ): void {
    const groupCardHostElement = groupContainerElement.querySelector('.group-card-slot') as HTMLElement;
    const groupCard = this._getOrCreateTileCard(entityId);
    if (groupCard.parentNode !== groupCardHostElement) {
      groupCardHostElement.replaceChildren(groupCard);
    }

    const childContainerElement = groupContainerElement.querySelector('.group-children') as HTMLElement;
    const expanded = this._isExpanded(entityId);
    const toggleButtonElement = groupContainerElement.querySelector('.group-toggle') as HTMLButtonElement;
    toggleButtonElement.setAttribute('aria-expanded', String(expanded));
    childContainerElement.hidden = !expanded;
    this._reconcileHierarchy(childContainerElement, childIds, nodes);
  }

  private _reconcileHierarchy(container: HTMLElement, nodeIds: string[], nodes: Map<string, LightHierarchyNode>): void {
    let previousNode: ChildNode | null = null;

    for (const entityId of nodeIds) {
      const node = nodes.get(entityId);
      const childIds = node?.childIds || [];
      const hierarchyContainerElement = this._resolveHierarchyContainer(entityId, childIds.length > 0);
      const nextSibling: ChildNode | null = previousNode ? previousNode.nextSibling : container.firstChild;
      this._placeHierarchyNode(container, hierarchyContainerElement, nextSibling);
      previousNode = hierarchyContainerElement;

      if (childIds.length > 0) {
        this._syncGroupContainer(hierarchyContainerElement, entityId, childIds, nodes);
      }
    }

    while (previousNode && previousNode.nextSibling) {
      container.removeChild(previousNode.nextSibling);
    }
  }

  protected render() {
    if (!this.hass || !this._cachedSourceIds) return nothing;

    const lights = this._getRelevantLights();
    if (lights.length === 0) {
      this.hidden = true;
      return nothing;
    }
    this.hidden = false;

    if (this._config.group_by_floors === true) {
      const floorGroups = this._groupByFloors(lights);
      const groupByAreas = this._config.group_by_areas === true;
      return html`
        <div class="lights-section">
          <div id="heading"></div>
          ${floorGroups.map((group) => {
            const floorKey = this._getFloorDomKey(group.floorId);
            const areas = groupByAreas ? this._groupByAreas(group.lights) : [];
            return html`
              <div class="floor-section">
                <div id=${`floor-heading-${floorKey}`}></div>
                ${groupByAreas
                  ? areas.map((area) => {
                      const areaKey = this._getAreaDomKey(area.areaId);
                      return html`
                        <div class="area-section">
                          <div id=${this._getAreaSlotId('area-heading', floorKey, areaKey)}></div>
                          <div class="light-grid" id=${this._getAreaSlotId('area-grid', floorKey, areaKey)}></div>
                        </div>
                      `;
                    })
                  : html`<div class="light-grid" id=${`floor-grid-${floorKey}`}></div>`}
              </div>
            `;
          })}
        </div>
      `;
    }

    if (this._config.group_by_areas === true) {
      const areas = this._groupByAreas(lights);
      return html`
        <div class="lights-section">
          <div id="heading"></div>
          ${areas.map((area) => {
            const areaKey = this._getAreaDomKey(area.areaId);
            return html`
              <div class="area-section">
                <div id=${this._getAreaSlotId('area-heading', null, areaKey)}></div>
                <div class="light-grid" id=${this._getAreaSlotId('area-grid', null, areaKey)}></div>
              </div>
            `;
          })}
        </div>
      `;
    }

    return html`
      <div class="lights-section">
        <div id="heading"></div>
        <div class="light-grid" id="grid"></div>
      </div>
    `;
  }

  // --- reconciliation helpers (shared across flat / floor / area modes) ---

  /** Build the nested-group hierarchy for a light set and reconcile it into a
   *  grid slot. */
  private _reconcileLightsGrid(gridId: string, lightIds: string[]): void {
    const grid = this.shadowRoot?.getElementById(gridId);
    if (!grid) return;
    const hierarchy = this._buildHierarchy(lightIds);
    this._reconcileHierarchy(grid, hierarchy.topLevelIds, hierarchy.nodes);
  }

  /** Create-or-update a pooled heading card in a slot. */
  private _reconcileHeadingCard(
    slotId: string,
    cardMap: Map<string, LovelaceCardElement>,
    key: string,
    headingConfig: Record<string, unknown>
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

  /** Main heading (total count + batch over all lights) — present in every mode. */
  private _reconcileMainHeading(lights: string[]): void {
    const hass = this.hass;
    if (!hass) return;
    const slot = this.shadowRoot?.getElementById('heading');
    if (!slot) return;
    if (!this._headingCard) {
      this._headingCard = document.createElement('hui-heading-card') as LovelaceCardElement;
    }
    const mainHeadingCard = this._headingCard;
    slot.appendChild(mainHeadingCard);
    mainHeadingCard.hass = hass;
    mainHeadingCard.setConfig(this._buildHeadingConfig(lights));
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

  /** Drop pooled tile cards + group containers whose entity is no longer active. */
  private _cleanupLightsPools(activeIds: Set<string>): void {
    for (const [id, card] of this._tileCards) {
      if (!activeIds.has(id)) {
        if (card.parentNode) card.parentNode.removeChild(card);
        this._tileCards.delete(id);
      }
    }
    for (const [id, container] of this._groupContainers) {
      if (!activeIds.has(id)) {
        if (container.parentNode) container.parentNode.removeChild(container);
        this._groupContainers.delete(id);
      }
    }
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this.hass || !this._cachedSourceIds) return;

    const lights = this._getRelevantLights();
    const lightsKey = lights.join(',');
    if (this._lastLightsList === lightsKey) return;
    this._lastLightsList = lightsKey;

    if (lights.length === 0) return;

    const groupByFloors = this._config.group_by_floors === true;
    const groupByAreas = this._config.group_by_areas === true;
    const activeIds = new Set(lights);

    // Main heading — every mode
    this._reconcileMainHeading(lights);

    if (groupByFloors) {
      const floorGroups = this._groupByFloors(lights);
      const activeFloorKeys = new Set<string>();
      const activeAreaKeys = new Set<string>();

      for (const group of floorGroups) {
        const floorKey = this._getFloorDomKey(group.floorId);
        activeFloorKeys.add(floorKey);
        this._reconcileHeadingCard(
          `floor-heading-${floorKey}`,
          this._floorHeadingCards,
          floorKey,
          this._buildHeadingConfig(group.lights, { label: group.floorName, icon: group.floorIcon, level: 'floor' })
        );

        if (groupByAreas) {
          // Area blocks nested under this floor
          const areas = this._groupByAreas(group.lights);
          for (const area of areas) {
            const areaKey = this._getAreaDomKey(area.areaId);
            const compositeKey = `${floorKey}__${areaKey}`;
            activeAreaKeys.add(compositeKey);
            this._reconcileHeadingCard(
              this._getAreaSlotId('area-heading', floorKey, areaKey),
              this._areaHeadingCards,
              compositeKey,
              this._buildHeadingConfig(area.lights, { label: area.areaName, level: 'area', areaId: area.areaId })
            );
            this._reconcileLightsGrid(this._getAreaSlotId('area-grid', floorKey, areaKey), area.lights);
          }
        } else {
          this._reconcileLightsGrid(`floor-grid-${floorKey}`, group.lights);
        }
      }

      this._cleanupHeadingCards(this._floorHeadingCards, activeFloorKeys);
      if (groupByAreas) this._cleanupHeadingCards(this._areaHeadingCards, activeAreaKeys);
      this._cleanupLightsPools(activeIds);
      return;
    }

    if (groupByAreas) {
      // Area-only mode (no floor super-grouping)
      const areas = this._groupByAreas(lights);
      const activeAreaKeys = new Set<string>();
      for (const area of areas) {
        const areaKey = this._getAreaDomKey(area.areaId);
        activeAreaKeys.add(areaKey);
        this._reconcileHeadingCard(
          this._getAreaSlotId('area-heading', null, areaKey),
          this._areaHeadingCards,
          areaKey,
          this._buildHeadingConfig(area.lights, { label: area.areaName, level: 'area', areaId: area.areaId })
        );
        this._reconcileLightsGrid(this._getAreaSlotId('area-grid', null, areaKey), area.lights);
      }
      this._cleanupHeadingCards(this._areaHeadingCards, activeAreaKeys);
      this._cleanupLightsPools(activeIds);
      return;
    }

    // Flat mode (no grouping)
    this._reconcileLightsGrid('grid', lights);
    this._cleanupLightsPools(activeIds);
  }

  getCardSize(): number {
    const lights = this._getRelevantLights();
    return Math.ceil(lights.length / 3) + 1;
  }
}

customElements.define('simon42-lights-group-card', Simon42LightsGroupCard);

