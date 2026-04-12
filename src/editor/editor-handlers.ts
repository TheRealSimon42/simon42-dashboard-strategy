// ====================================================================
// SIMON42 EDITOR HANDLERS
// ====================================================================
// Event handlers for the Dashboard Strategy Editor.
// Ported from JavaScript to TypeScript with proper DOM casts.

import { renderAreaEntitiesHTML, renderBadgeGroupHTML } from './editor-template';
import { HomeAssistant } from '../types/homeassistant';
import { Simon42StrategyConfig, RoomEntities } from '../types/strategy';
import { EntityRegistryEntry } from '../types/registries';
import { isBadgeCandidate, isDefaultShowName } from '../utils/badge-utils';

// -- Extended element with expand tracking ----------------------------

interface EditorElement extends HTMLElement {
  _expandedAreas?: Set<string>;
  _expandedGroups?: Map<string, Set<string>>;
  _config?: Simon42StrategyConfig;
  _hass?: HomeAssistant | null;
}

// -- Checkbox Listener Functions --------------------------------------

export function attachWeatherCheckboxListener(element: HTMLElement, callback: (checked: boolean) => void): void {
  const weatherCheckbox = element.querySelector('#show-weather') as HTMLInputElement | null;
  if (weatherCheckbox) {
    weatherCheckbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachEnergyCheckboxListener(element: HTMLElement, callback: (checked: boolean) => void): void {
  const energyCheckbox = element.querySelector('#show-energy') as HTMLInputElement | null;
  if (energyCheckbox) {
    energyCheckbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachSearchCardCheckboxListener(element: HTMLElement, callback: (checked: boolean) => void): void {
  const searchCardCheckbox = element.querySelector('#show-search-card') as HTMLInputElement | null;
  if (searchCardCheckbox) {
    searchCardCheckbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachSummaryViewsCheckboxListener(element: HTMLElement, callback: (checked: boolean) => void): void {
  const summaryViewsCheckbox = element.querySelector('#show-summary-views') as HTMLInputElement | null;
  if (summaryViewsCheckbox) {
    summaryViewsCheckbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachRoomViewsCheckboxListener(element: HTMLElement, callback: (checked: boolean) => void): void {
  const roomViewsCheckbox = element.querySelector('#show-room-views') as HTMLInputElement | null;
  if (roomViewsCheckbox) {
    roomViewsCheckbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachGroupByFloorsCheckboxListener(element: HTMLElement, callback: (checked: boolean) => void): void {
  const groupByFloorsCheckbox = element.querySelector('#group-by-floors') as HTMLInputElement | null;
  if (groupByFloorsCheckbox) {
    groupByFloorsCheckbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachClockCardCheckboxListener(element: HTMLElement, callback: (checked: boolean) => void): void {
  const checkbox = element.querySelector('#show-clock-card') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachLightSummaryCheckboxListener(element: HTMLElement, callback: (checked: boolean) => void): void {
  const checkbox = element.querySelector('#show-light-summary') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachGroupLightsByFloorsCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#group-lights-by-floors') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachNestedLightGroupsCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#nested-light-groups') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachFavoritesShowStateCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#favorites-show-state') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachFavoritesHideLastChangedCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#favorites-hide-last-changed') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachCoversSummaryCheckboxListener(element: HTMLElement, callback: (checked: boolean) => void): void {
  const coversSummaryCheckbox = element.querySelector('#show-covers-summary') as HTMLInputElement | null;
  if (coversSummaryCheckbox) {
    coversSummaryCheckbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachPartiallyOpenCoversCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#show-partially-open-covers') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachSecuritySummaryCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#show-security-summary') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachBatterySummaryCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#show-battery-summary') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachClimateSummaryCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#show-climate-summary') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachHideMobileAppBatteriesCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#hide-mobile-app-batteries') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachRoomPinsShowStateCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#room-pins-show-state') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachRoomPinsHideLastChangedCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#room-pins-hide-last-changed') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachShowSwitchesOnAreasCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#show-switches-on-areas') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachShowAlertsOnAreasCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#show-alerts-on-areas') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachShowLocksInRoomsCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#show-locks-in-rooms') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachShowAutomationsInRoomsCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#show-automations-in-rooms') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachShowScriptsInRoomsCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#show-scripts-in-rooms') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

export function attachUseDefaultAreaSortCheckboxListener(
  element: HTMLElement,
  callback: (checked: boolean) => void
): void {
  const checkbox = element.querySelector('#use-default-area-sort') as HTMLInputElement | null;
  if (checkbox) {
    checkbox.addEventListener('change', (e: Event) => {
      callback((e.target as HTMLInputElement).checked);
    });
  }
}

// -- Area Management --------------------------------------------------

export function attachAreaCheckboxListeners(
  element: HTMLElement,
  callback: (areaId: string, isVisible: boolean) => void
): void {
  const areaCheckboxes = element.querySelectorAll('.area-checkbox') as NodeListOf<HTMLInputElement>;
  areaCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      const areaId = target.dataset.areaId!;
      const isVisible = target.checked;
      callback(areaId, isVisible);

      // Disable/Enable expand button
      const areaItem = target.closest('.area-item') as HTMLElement | null;
      const expandButton = areaItem?.querySelector('.expand-button') as HTMLButtonElement | null;
      if (expandButton) {
        expandButton.disabled = !isVisible;
      }
    });
  });
}

export function attachExpandButtonListeners(
  element: EditorElement,
  hass: HomeAssistant,
  config: Simon42StrategyConfig,
  onEntitiesLoad: (areaId: string, group: string, entityId: string | null, isVisible: boolean) => void
): void {
  const expandButtons = element.querySelectorAll('.expand-button') as NodeListOf<HTMLButtonElement>;

  expandButtons.forEach((button) => {
    button.addEventListener('click', async (e: Event) => {
      e.stopPropagation();
      const areaId = button.dataset.areaId!;
      const areaItem = button.closest('.area-item') as HTMLElement;
      const content = areaItem.querySelector(`.area-content[data-area-id="${areaId}"]`) as HTMLElement;

      if (content.style.display === 'none') {
        // Expand
        content.style.display = 'block';
        button.classList.add('expanded');

        // Track expanded state
        if (element._expandedAreas) {
          element._expandedAreas.add(areaId);
        }

        // Load entities if not yet loaded
        if (content.querySelector('.loading-placeholder')) {
          const groupedEntities = await getAreaGroupedEntities(areaId, hass);
          const hiddenEntities = getHiddenEntitiesForArea(areaId, config);
          const entityOrders = getEntityOrdersForArea(areaId, config);
          const badgeCandidates = getAreaBadgeCandidates(areaId, hass);
          const additionalBadges = getAdditionalBadgesForArea(areaId, config);
          const availableEntities = getAvailableBadgeEntities(areaId, hass, badgeCandidates, additionalBadges);
          const defaultShowNames = getDefaultShowNameEntities(badgeCandidates, hass);
          const { namesVisible, namesHidden } = getBadgeNamesConfig(areaId, config);

          const entitiesHTML = renderAreaEntitiesHTML(
            areaId,
            groupedEntities,
            hiddenEntities,
            entityOrders,
            hass,
            badgeCandidates,
            additionalBadges,
            availableEntities,
            defaultShowNames,
            namesVisible,
            namesHidden
          );
          content.innerHTML = entitiesHTML;

          // Attach listeners for new entity checkboxes
          attachEntityCheckboxListeners(content, onEntitiesLoad);
          attachGroupCheckboxListeners(content, onEntitiesLoad);
          attachEntityExpandButtonListeners(content, element);
          attachBadgeAddListeners(content, element, onEntitiesLoad);
          attachBadgeRemoveListeners(content, element, onEntitiesLoad);
          attachBadgeNameCheckboxListeners(content, onEntitiesLoad);
        }
      } else {
        // Collapse
        content.style.display = 'none';
        button.classList.remove('expanded');

        // Track collapsed state
        if (element._expandedAreas) {
          element._expandedAreas.delete(areaId);
          element._expandedGroups?.delete(areaId);
        }
      }
    });
  });
}

// -- Group Visibility -------------------------------------------------

export function attachGroupCheckboxListeners(
  element: HTMLElement,
  callback: (areaId: string, group: string, entityId: string | null, isVisible: boolean) => void
): void {
  const groupCheckboxes = element.querySelectorAll('.group-checkbox') as NodeListOf<HTMLInputElement>;

  groupCheckboxes.forEach((checkbox) => {
    // Set indeterminate state
    if (checkbox.dataset.indeterminate === 'true') {
      checkbox.indeterminate = true;
    }

    checkbox.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      const areaId = target.dataset.areaId!;
      const group = target.dataset.group!;
      const isVisible = target.checked;

      callback(areaId, group, null, isVisible); // null = all entities in group

      // Update all entity checkboxes in this group
      const entityList = element.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${group}"]`);
      if (entityList) {
        const entityCheckboxes = entityList.querySelectorAll('.entity-checkbox') as NodeListOf<HTMLInputElement>;
        entityCheckboxes.forEach((cb) => {
          cb.checked = isVisible;
        });
      }

      // Remove indeterminate state
      target.indeterminate = false;
      target.removeAttribute('data-indeterminate');
    });
  });
}

// -- Entity Visibility ------------------------------------------------

export function attachEntityCheckboxListeners(
  element: HTMLElement,
  callback: (areaId: string, group: string, entityId: string | null, isVisible: boolean) => void
): void {
  const entityCheckboxes = element.querySelectorAll('.entity-checkbox') as NodeListOf<HTMLInputElement>;

  entityCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      const areaId = target.dataset.areaId!;
      const group = target.dataset.group!;
      const entityId = target.dataset.entityId!;
      const isVisible = target.checked;

      callback(areaId, group, entityId, isVisible);

      // Update Group-Checkbox state (all/some/none checked)
      const entityList = element.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${group}"]`);
      const groupCheckbox = element.querySelector(
        `.group-checkbox[data-area-id="${areaId}"][data-group="${group}"]`
      ) as HTMLInputElement | null;

      if (entityList && groupCheckbox) {
        const allCheckboxes = Array.from(entityList.querySelectorAll('.entity-checkbox')) as HTMLInputElement[];
        const checkedCount = allCheckboxes.filter((cb) => cb.checked).length;

        if (checkedCount === 0) {
          groupCheckbox.checked = false;
          groupCheckbox.indeterminate = false;
          groupCheckbox.removeAttribute('data-indeterminate');
        } else if (checkedCount === allCheckboxes.length) {
          groupCheckbox.checked = true;
          groupCheckbox.indeterminate = false;
          groupCheckbox.removeAttribute('data-indeterminate');
        } else {
          groupCheckbox.checked = false;
          groupCheckbox.indeterminate = true;
          groupCheckbox.setAttribute('data-indeterminate', 'true');
        }
      }
    });
  });
}

// -- Entity Group Expand/Collapse -------------------------------------

export function attachEntityExpandButtonListeners(element: HTMLElement, editorElement: EditorElement): void {
  const expandButtons = element.querySelectorAll('.expand-button-small') as NodeListOf<HTMLButtonElement>;

  expandButtons.forEach((button) => {
    button.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const areaId = button.dataset.areaId!;
      const group = button.dataset.group!;
      const entityList = element.querySelector(
        `.entity-list[data-area-id="${areaId}"][data-group="${group}"]`
      ) as HTMLElement | null;

      if (entityList) {
        if (entityList.style.display === 'none') {
          entityList.style.display = 'block';
          button.classList.add('expanded');

          // Track expanded state
          if (editorElement._expandedGroups) {
            if (!editorElement._expandedGroups.has(areaId)) {
              editorElement._expandedGroups.set(areaId, new Set());
            }
            editorElement._expandedGroups.get(areaId)?.add(group);
          }
        } else {
          entityList.style.display = 'none';
          button.classList.remove('expanded');

          // Track collapsed state
          if (editorElement._expandedGroups) {
            const areaGroups = editorElement._expandedGroups.get(areaId);
            if (areaGroups) {
              areaGroups.delete(group);
            }
          }
        }
      }
    });
  });
}

// -- Sort Area Items --------------------------------------------------

export function sortAreaItems(element: HTMLElement): void {
  const areaList = element.querySelector('#area-list') as HTMLElement | null;
  if (!areaList) return;

  const items = Array.from(areaList.querySelectorAll('.area-item')) as HTMLElement[];
  items.sort((a, b) => {
    const orderA = parseInt(a.dataset.order || '0', 10);
    const orderB = parseInt(b.dataset.order || '0', 10);
    return orderA - orderB;
  });

  items.forEach((item) => { areaList.appendChild(item); });
}

// -- Drag-and-Drop Area Reordering ------------------------------------

export function attachDragAndDropListeners(element: HTMLElement, onOrderChange: () => void): void {
  const areaList = element.querySelector('#area-list') as HTMLElement | null;
  if (!areaList) return;

  const areaItems = areaList.querySelectorAll('.area-item') as NodeListOf<HTMLElement>;

  let draggedElement: HTMLElement | null = null;

  const handleDragStart = (ev: DragEvent): void => {
    // Only allow dragging from the drag handle
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
    ev.dataTransfer!.effectAllowed = 'move';
    ev.dataTransfer!.setData('text/html', areaItem.innerHTML);
    draggedElement = areaItem;
  };

  const handleDragEnd = (ev: DragEvent): void => {
    const areaItem = (ev.target as HTMLElement).closest('.area-item') as HTMLElement | null;
    if (areaItem) {
      areaItem.classList.remove('dragging');
    }

    // Remove all drag-over classes
    const items = areaList.querySelectorAll('.area-item');
    items.forEach((item) => { item.classList.remove('drag-over'); });
  };

  const handleDragOver = (ev: DragEvent): boolean => {
    ev.preventDefault();
    ev.dataTransfer!.dropEffect = 'move';

    const item = ev.currentTarget as HTMLElement;
    if (item !== draggedElement) {
      item.classList.add('drag-over');
    }

    return false;
  };

  const handleDragLeave = (ev: DragEvent): void => {
    (ev.currentTarget as HTMLElement).classList.remove('drag-over');
  };

  const handleDrop = (ev: DragEvent): boolean => {
    ev.stopPropagation();
    ev.preventDefault();

    const dropTarget = ev.currentTarget as HTMLElement;
    dropTarget.classList.remove('drag-over');

    if (draggedElement && draggedElement !== dropTarget) {
      const allItems = Array.from(areaList.querySelectorAll('.area-item')) as HTMLElement[];
      const draggedIndex = allItems.indexOf(draggedElement);
      const dropIndex = allItems.indexOf(dropTarget);

      if (draggedIndex < dropIndex) {
        dropTarget.parentNode!.insertBefore(draggedElement, dropTarget.nextSibling);
      } else {
        dropTarget.parentNode!.insertBefore(draggedElement, dropTarget);
      }

      // Update order in config
      onOrderChange();
    }

    return false;
  };

  areaItems.forEach((item) => {
    item.setAttribute('draggable', 'true');
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragleave', handleDragLeave);
  });
}

// -- Helper Functions -------------------------------------------------

export async function getAreaGroupedEntities(areaId: string, hass: HomeAssistant): Promise<RoomEntities> {
  // Use hass.devices and hass.entities (standard Home Assistant objects)
  // No WebSocket calls needed!

  // Convert objects to arrays
  const devices = Object.values(hass.devices || {});
  const entities = Object.values(hass.entities || {});

  // Find all devices in the area
  const areaDevices = new Set<string>();
  for (const device of devices) {
    if (device.area_id === areaId) {
      areaDevices.add(device.id);
    }
  }

  // Group entities
  const roomEntities: RoomEntities = {
    lights: [],
    covers: [],
    covers_curtain: [],
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

  // Labels for filtering
  const excludeLabels = entities
    .filter((e: EntityRegistryEntry) => e.labels?.includes('no_dboard'))
    .map((e: EntityRegistryEntry) => e.entity_id);

  for (const entity of entities) {
    // Check if entity belongs to the area
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
    const state = hass.states[entity.entity_id];
    const deviceClass = state.attributes?.device_class;

    // Categorize by domain
    if (domain === 'light') {
      roomEntities.lights.push(entity.entity_id);
    } else if (domain === 'cover') {
      if (deviceClass === 'curtain' || deviceClass === 'blind') {
        roomEntities.covers_curtain.push(entity.entity_id);
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

export function getAreaBadgeCandidates(areaId: string, hass: HomeAssistant): string[] {
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
    const state = hass.states[entity.entity_id];
    const dc = state.attributes?.device_class as string | undefined;
    const unit = state.attributes?.unit_of_measurement as string | undefined;

    if (!isBadgeCandidate(domain, dc, unit, entity.entity_id)) continue;

    // Battery: only include if low
    if (domain === 'sensor' && (dc === 'battery' || entity.entity_id.includes('battery'))) {
      const val = parseFloat(state.state);
      if (!isNaN(val) && val < 20) candidates.push(entity.entity_id);
      continue;
    }

    candidates.push(entity.entity_id);
  }

  return candidates;
}

export function getAdditionalBadgesForArea(areaId: string, config: Simon42StrategyConfig): string[] {
  return config.areas_options?.[areaId]?.groups_options?.badges?.additional || [];
}

export function getAvailableBadgeEntities(
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

    const state = hass.states[entity.entity_id];
    const name = (state.attributes?.friendly_name as string) || entity.entity_id.split('.')[1].replace(/_/g, ' ');
    available.push({ entity_id: entity.entity_id, name });
  }

  available.sort((a, b) => a.name.localeCompare(b.name));
  return available;
}

export function getDefaultShowNameEntities(badgeCandidates: string[], hass: HomeAssistant): Set<string> {
  const result = new Set<string>();
  for (const entityId of badgeCandidates) {
    const state = hass.states[entityId];
    if (!state) continue;
    const dc = state.attributes?.device_class as string | undefined;
    if (isDefaultShowName(dc)) result.add(entityId);
  }
  return result;
}

export function getBadgeNamesConfig(
  areaId: string,
  config: Simon42StrategyConfig
): { namesVisible: string[]; namesHidden: string[] } {
  const opts = config.areas_options?.[areaId]?.groups_options?.badges;
  return {
    namesVisible: opts?.names_visible || [],
    namesHidden: opts?.names_hidden || [],
  };
}

export function getHiddenEntitiesForArea(areaId: string, config: Simon42StrategyConfig): Record<string, string[]> {
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

export function getEntityOrdersForArea(areaId: string, config: Simon42StrategyConfig): Record<string, string[]> {
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

// -- Badge Add/Remove Handlers ------------------------------------------

function reloadBadgeSection(
  areaContent: HTMLElement,
  areaId: string,
  element: EditorElement,
  onEntitiesLoad: (areaId: string, group: string, entityId: string | null, isVisible: boolean) => void
): void {
  const badgeGroup = areaContent.querySelector(`.entity-group[data-group="badges"]`) as HTMLElement | null;
  if (!badgeGroup) return;

  // Read CURRENT config and hass from editor element (not stale closure values)
  const hass = element._hass!;
  const config = element._config!;

  const badgeCandidates = getAreaBadgeCandidates(areaId, hass);
  const additionalBadges = getAdditionalBadgesForArea(areaId, config);
  const available = getAvailableBadgeEntities(areaId, hass, badgeCandidates, additionalBadges);
  const hiddenEntities = getHiddenEntitiesForArea(areaId, config);
  const defaultShowNames = getDefaultShowNameEntities(badgeCandidates, hass);
  const { namesVisible, namesHidden: namesHid } = getBadgeNamesConfig(areaId, config);

  badgeGroup.outerHTML = renderBadgeGroupHTML(
    areaId, badgeCandidates, additionalBadges, available, hiddenEntities, hass,
    defaultShowNames, namesVisible, namesHid
  );

  // Re-query the new badge group element
  const newBadgeGroup = areaContent.querySelector(`.entity-group[data-group="badges"]`) as HTMLElement;
  if (newBadgeGroup) {
    // Keep the entity list expanded after reload
    const entityList = newBadgeGroup.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="badges"]`) as HTMLElement | null;
    if (entityList) entityList.style.display = 'block';
    const expandBtn = newBadgeGroup.querySelector(`.expand-button-small[data-group="badges"]`) as HTMLElement | null;
    if (expandBtn) expandBtn.classList.add('expanded');

    // Re-attach all listeners
    attachEntityCheckboxListeners(newBadgeGroup, onEntitiesLoad);
    attachGroupCheckboxListeners(newBadgeGroup, onEntitiesLoad);
    attachEntityExpandButtonListeners(newBadgeGroup, element);
    attachBadgeAddListeners(areaContent, element, onEntitiesLoad);
    attachBadgeRemoveListeners(areaContent, element, onEntitiesLoad);
    attachBadgeNameCheckboxListeners(newBadgeGroup, onEntitiesLoad);
  }
}

export function attachBadgeAddListeners(
  element: HTMLElement,
  editorElement: EditorElement,
  onEntitiesLoad: (areaId: string, group: string, entityId: string | null, isVisible: boolean) => void
): void {
  const addButtons = element.querySelectorAll('.badge-add-button') as NodeListOf<HTMLButtonElement>;

  addButtons.forEach((button) => {
    button.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const areaId = button.dataset.areaId!;
      const picker = element.querySelector(
        `.badge-entity-picker[data-area-id="${areaId}"]`
      ) as HTMLSelectElement | null;
      if (!picker || !picker.value) return;

      const entityId = picker.value;

      // Fire callback to update config (adds to badges.additional)
      onEntitiesLoad(areaId, 'badges_additional', entityId, true);

      // Reload badge section with current config from editor
      const areaContent = element.closest(`.area-content[data-area-id="${areaId}"]`) as HTMLElement ||
        element.querySelector(`.area-content[data-area-id="${areaId}"]`) as HTMLElement ||
        element;
      reloadBadgeSection(areaContent, areaId, editorElement, onEntitiesLoad);
    });
  });
}

export function attachBadgeRemoveListeners(
  element: HTMLElement,
  editorElement: EditorElement,
  onEntitiesLoad: (areaId: string, group: string, entityId: string | null, isVisible: boolean) => void
): void {
  const removeButtons = element.querySelectorAll('.badge-remove-btn') as NodeListOf<HTMLButtonElement>;

  removeButtons.forEach((button) => {
    button.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const areaId = button.dataset.areaId!;
      const entityId = button.dataset.entityId!;

      // Fire callback to update config (removes from badges.additional)
      onEntitiesLoad(areaId, 'badges_additional', entityId, false);

      // Reload badge section with current config from editor
      const areaContent = element.closest(`.area-content[data-area-id="${areaId}"]`) as HTMLElement ||
        element.querySelector(`.area-content[data-area-id="${areaId}"]`) as HTMLElement ||
        element;
      reloadBadgeSection(areaContent, areaId, editorElement, onEntitiesLoad);
    });
  });
}

export function attachBadgeNameCheckboxListeners(
  element: HTMLElement,
  callback: (areaId: string, group: string, entityId: string | null, isVisible: boolean) => void
): void {
  const checkboxes = element.querySelectorAll('.badge-name-checkbox') as NodeListOf<HTMLInputElement>;

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', (e: Event) => {
      e.stopPropagation();
      const target = e.target as HTMLInputElement;
      const areaId = target.dataset.areaId!;
      const entityId = target.dataset.entityId!;
      const showName = target.checked;

      // Use 'badges_show_name' as group key — StrategyEditor handles this specially
      callback(areaId, 'badges_show_name', entityId, showName);
    });
  });
}
