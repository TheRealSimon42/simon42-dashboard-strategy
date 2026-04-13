// ====================================================================
// LIGHTS GROUP CARD — Reactive card for on/off light groups (LitElement)
// ====================================================================

import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import type { HomeAssistant, HassEntity } from '../types/homeassistant';
import type { AreaRegistryEntry } from '../types/registries';
import { Registry } from '../Registry';
import { trackHassUpdate } from '../utils/debug';
import { localize } from '../utils/localize';
import { stripAreaName } from '../utils/name-utils';

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
  nested_groups?: boolean;
  heading_label?: string;
  heading_icon?: string;
  area?: AreaRegistryEntry;
  default_expanded?: boolean;
}

interface FloorGroup {
  floorId: string | null;
  floorName: string;
  floorIcon: string;
  lights: string[];
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
      return this._config.entities.filter((id) => id.startsWith('light.') && this._getState(id) !== undefined);
    }
    return Registry.getVisibleEntityIdsForDomain('light').filter((id) => this._getState(id) !== undefined);
  }

  private _getRelevantLights(lightIds?: Iterable<string>): string[] {
    if (!this.hass) return [];
    const sourceIds = lightIds ? Array.from(lightIds) : Array.from(this._cachedSourceIds || []);
    if (sourceIds.length === 0) return [];

    if (this._config.group_type === 'all') {
      return [...sourceIds].sort((a, b) => this._sortByLastChanged(a, b));
    }

    const targetState = this._config.group_type === 'on' ? 'on' : 'off';

    const relevant: string[] = [];
    for (const id of sourceIds) {
      const state = this._getState(id);
      if (state && state.state === targetState) relevant.push(id);
    }

    return relevant.sort((a, b) => this._sortByLastChanged(a, b));
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
      return this._cachedAreaForEntity.get(entityId)!;
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

    return [...new Set(childIds)].sort((a, b) => this._sortByLastChanged(a, b));
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
      .sort((a, b) => this._sortByLastChanged(a, b));

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
      floorMap.get(floorId)!.push(id);
    }

    // Use HA's floor order from the registry. The hass.floors object preserves
    // the user-defined order from HA's "Reorder areas and floors" dialog via
    // Object.keys() insertion order — no separate sort_order field needed.
    const floors = this.hass.floors;
    const floorOrder = Object.keys(floors);
    const sortedKeys = [
      ...floorOrder.filter((id) => floorMap.has(id)),
      ...(floorMap.has(null) ? [null] : []),
    ];

    return sortedKeys.map((floorId) => {
      const floor = floorId ? floors[floorId] : null;
      return {
        floorId,
        floorName: floor?.name || localize('lights.floor_other'),
        floorIcon: floor?.icon || 'mdi:home-outline',
        lights: floorMap.get(floorId)!,
      };
    });
  }

  private _getFloorDomKey(floorId: string | null): string {
    return floorId ?? '_none';
  }

  private _buildHeadingConfig(lights: string[], label?: string, icon?: string): any {
    const isOn = this._config.group_type === 'on';
    const isAll = this._config.group_type === 'all';
    const heading = label
      ? `${label} (${lights.length})`
      : `${isAll ? (this._config.heading_label || localize('room.lighting')) : (isOn ? localize('lights.on') : localize('lights.off'))} (${lights.length})`;

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
              visibility: [{ condition: 'or', conditions: lights.map((entity) => ({ condition: 'state', entity, state: 'off' })) }],
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
              visibility: [{ condition: 'or', conditions: lights.map((entity) => ({ condition: 'state', entity, state: 'on' })) }],
            },
          ];

    return {
      type: 'heading',
      heading,
      icon:
        icon ||
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
    return this._groupExpansion.get(entityId) ?? (this._config.default_expanded === true);
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

  private _placeHierarchyNode(parentElement: HTMLElement, childElement: HTMLElement, referenceNode: ChildNode | null): void {
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

    if (this._config.group_by_floors) {
      const floorGroups = this._groupByFloors(lights);
      return html`
        <div class="lights-section">
          <div id="heading"></div>
          ${floorGroups.map(
            (group) => {
              const floorKey = this._getFloorDomKey(group.floorId);
              return html`
              <div class="floor-section">
                <div id=${`floor-heading-${floorKey}`}></div>
                <div class="light-grid" id=${`floor-grid-${floorKey}`}></div>
              </div>
            `;
            }
          )}
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

  private _getOrCreateFloorHeadingCard(key: string): LovelaceCardElement {
    let card = this._floorHeadingCards.get(key);
    if (card) return card;
    card = document.createElement('hui-heading-card') as LovelaceCardElement;
    this._floorHeadingCards.set(key, card);
    return card;
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this.hass || !this._cachedSourceIds) return;

    const lights = this._getRelevantLights();
    const lightsKey = lights.join(',');
    if (this._lastLightsList === lightsKey) return;
    this._lastLightsList = lightsKey;

    if (lights.length === 0) return;

    if (this._config.group_by_floors) {
      const floorGroups = this._groupByFloors(lights);

      // Reconcile main heading (total count)
      const headingSlot = this.shadowRoot!.getElementById('heading');
      if (headingSlot) {
        if (!this._headingCard) {
          this._headingCard = document.createElement('hui-heading-card') as LovelaceCardElement;
        }
        const mainHeadingCard = this._headingCard;
        headingSlot.appendChild(mainHeadingCard);
        mainHeadingCard.hass = this.hass;
        mainHeadingCard.setConfig(this._buildHeadingConfig(lights));
      }

      // Reconcile per-floor sections
      const allActiveIds = new Set(lights);
      for (const group of floorGroups) {
        const key = group.floorId || '_none';
        const floorHeadingSlot = this.shadowRoot!.getElementById(`floor-heading-${key}`);
        if (floorHeadingSlot) {
          const headingCard = this._getOrCreateFloorHeadingCard(key);
          if (!headingCard.parentNode) floorHeadingSlot.appendChild(headingCard);
          headingCard.hass = this.hass;
          headingCard.setConfig(this._buildHeadingConfig(group.lights, group.floorName, group.floorIcon));
        }

        const grid = this.shadowRoot?.getElementById(`floor-grid-${key}`);
        if (grid) {
          const hierarchy = this._buildHierarchy(group.lights);
          this._reconcileHierarchy(grid, hierarchy.topLevelIds, hierarchy.nodes);
        }
      }

      // Clean up stale pool entries
      for (const [id, card] of this._tileCards) {
        if (!allActiveIds.has(id)) {
          if (card.parentNode) card.parentNode.removeChild(card);
          this._tileCards.delete(id);
        }
      }
      for (const [id, container] of this._groupContainers) {
        if (!allActiveIds.has(id)) {
          if (container.parentNode) container.parentNode.removeChild(container);
          this._groupContainers.delete(id);
        }
      }
      return;
    }

    // Flat mode (no floor grouping)
    const headingSlot = this.shadowRoot!.getElementById('heading');
    if (headingSlot) {
      if (!this._headingCard) {
        this._headingCard = document.createElement('hui-heading-card') as LovelaceCardElement;
      }
      const mainHeadingCard = this._headingCard;
      headingSlot.appendChild(mainHeadingCard);
      mainHeadingCard.hass = this.hass;
      mainHeadingCard.setConfig(this._buildHeadingConfig(lights));
    }

    const grid = this.shadowRoot!.getElementById('grid');
    if (!grid) return;

    const hierarchy = this._buildHierarchy(lights);

    // Clean up stale pool entries
    const activeIds = new Set(lights);
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

    this._reconcileHierarchy(grid, hierarchy.topLevelIds, hierarchy.nodes);
  }

  getCardSize(): number {
    const lights = this._getRelevantLights();
    return Math.ceil(lights.length / 3) + 1;
  }
}

customElements.define('simon42-lights-group-card', Simon42LightsGroupCard);
