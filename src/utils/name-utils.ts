// ====================================================================
// Name & Entity Utility Functions
// ====================================================================
// Ported from dist/utils/simon42-helpers.js with full TypeScript types,
// module-level RegExp caches, and regex-escaping for area names.
// ====================================================================

import { Registry } from '../Registry';
import type { HomeAssistant } from '../types/homeassistant';
import type { AreaRegistryEntry, EntityRegistryEntry } from '../types/registries';
import type { AreasDisplay } from '../types/strategy';

// -- Module-level RegExp caches (shared across all calls) -------------

interface AreaRegExps {
  start: RegExp;
  end: RegExp;
  middle: RegExp;
}

const _areaRegExpCache = new Map<string, AreaRegExps>();

const _coverTypeRegExps: RegExp[] = [
  'Rollo',
  'Rollos',
  'Rolladen',
  'Rolläden',
  'Vorhang',
  'Vorhänge',
  'Jalousie',
  'Jalousien',
  'Shutter',
  'Shutters',
  'Blind',
  'Blinds',
].map((type) => new RegExp(`\\b${type}\\b`, 'gi'));

// -- Helper: escape special regex characters --------------------------

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// -- Helper: extract friendly name or fallback from entity ID ---------

function getFriendlyName(entityId: string, hass: HomeAssistant): string | null {
  const state = hass.states[entityId];
  if (!state) return null;
  return (state.attributes?.friendly_name as string | undefined) ?? entityId.split('.')[1].replace(/_/g, ' ');
}

// -- Exported functions -----------------------------------------------

/**
 * Strips the area name from an entity's friendly name.
 * Uses cached, regex-escaped patterns per area name to avoid recompilation
 * and prevent bugs with special characters in area names.
 */
export function stripAreaName(entityId: string, area: AreaRegistryEntry, hass: HomeAssistant): string {
  const state = hass.states[entityId];
  if (!state) return entityId;

  const name = getFriendlyName(entityId, hass);
  if (!name) return entityId;

  const areaName = area.name;
  if (!areaName) return name;

  // Build and cache RegExps for this area name (compiled once, reused)
  if (!_areaRegExpCache.has(areaName)) {
    const escaped = escapeRegExp(areaName);
    _areaRegExpCache.set(areaName, {
      start: new RegExp(`^${escaped}\\s+`, 'i'),
      end: new RegExp(`\\s+${escaped}$`, 'i'),
      middle: new RegExp(`\\s+${escaped}\\s+`, 'i'),
    });
  }

  const re = _areaRegExpCache.get(areaName);
  if (!re) return name;
  const cleanName = name.replace(re.start, '').replace(re.end, '').replace(re.middle, ' ').trim();

  // Only use cleaned name if something meaningful remains
  if (cleanName.length > 0 && cleanName.toLowerCase() !== areaName.toLowerCase()) {
    return cleanName;
  }

  return name;
}

/**
 * Strips cover type terms (Rollo, Jalousie, Shutter, etc.) from an entity's
 * friendly name. Uses pre-compiled RegExps for performance.
 */
export function stripCoverType(entityId: string, hass: HomeAssistant): string {
  const state = hass.states[entityId];
  if (!state) return entityId;

  let name = getFriendlyName(entityId, hass);
  if (!name) return entityId;

  // Remove cover type terms using pre-compiled patterns
  for (const regex of _coverTypeRegExps) {
    regex.lastIndex = 0;
    name = name.replace(regex, '').trim();
  }

  // Collapse multiple whitespace
  name = name.replace(/\s+/g, ' ').trim();

  // Only use cleaned name if something meaningful remains
  if (name.length > 0) {
    return name;
  }

  // Fallback to original friendly name
  return (state.attributes?.friendly_name as string | undefined) ?? entityId.split('.')[1].replace(/_/g, ' ');
}

/**
 * Filters areas based on display configuration (hidden list) and sorts them
 * by the configured order or alphabetically as fallback.
 */
export function getVisibleAreas(
  areas: AreaRegistryEntry[],
  displayConfig?: AreasDisplay,
  useDefaultSort?: boolean
): AreaRegistryEntry[] {
  const hiddenAreas = displayConfig?.hidden ?? [];

  // Filter out hidden areas
  const visibleAreas = areas.filter((area) => !hiddenAreas.includes(area.area_id));

  // If useDefaultSort is true, use HA's native area order (as-is from registry)
  if (useDefaultSort) {
    return visibleAreas;
  }

  const orderConfig = displayConfig?.order ?? [];

  // Sort by configured order, then alphabetically for unordered
  if (orderConfig.length > 0) {
    visibleAreas.sort((a, b) => {
      const indexA = orderConfig.indexOf(a.area_id);
      const indexB = orderConfig.indexOf(b.area_id);

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  } else {
    visibleAreas.sort((a, b) => a.name.localeCompare(b.name));
  }

  return visibleAreas;
}

/**
 * Like getVisibleAreas but reads from hass.areas (synchronous Record)
 * instead of Registry.areas (requires WebSocket init).
 * Used by the dashboard entry point to avoid blocking on Registry.
 */
export function getVisibleAreasFromHass(
  hass: HomeAssistant,
  displayConfig?: AreasDisplay,
  useDefaultSort?: boolean
): AreaRegistryEntry[] {
  return getVisibleAreas(Object.values(hass.areas), displayConfig, useDefaultSort);
}

/**
 * Checks whether an entity should be excluded from the dashboard based on
 * its registry flags: hidden, entity_category, labels, and config.
 *
 * Delegates to Registry.isEntityExcludedWithStateCategory() which covers
 * all exclusion criteria including state attribute fallback.
 */
export function isEntityHiddenOrDisabled(entity: EntityRegistryEntry, _hass: HomeAssistant): boolean {
  return Registry.isEntityExcludedWithStateCategory(entity.entity_id);
}

/**
 * Comparator that sorts entity IDs by last_changed timestamp,
 * most recently changed first.
 */
export function sortByLastChanged(a: string, b: string, hass: HomeAssistant): number {
  const stateA = hass.states[a];
  const stateB = hass.states[b];
  if (!stateA || !stateB) return 0;

  const dateA = new Date(stateA.last_changed).getTime();
  const dateB = new Date(stateB.last_changed).getTime();
  return dateB - dateA; // Newest first
}
