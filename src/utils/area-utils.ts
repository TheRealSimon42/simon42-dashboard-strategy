// ====================================================================
// AREA UTILS — shared entity -> area resolution
// ====================================================================
// Single source of truth for resolving an entity's area (with the
// device-area fallback) and its area name. Supersedes the per-module
// copies that lived in the views/cards. The group cards keep their own
// memoized private resolver (_getAreaForEntity) for perf; this helper
// is for view-level code that doesn't need caching.
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { Simon42StrategyConfig } from '../types/strategy';
import { Registry } from '../Registry';

/**
 * Resolve the area_id for an entity, falling back through its device's
 * area when the entity itself has none (entities often inherit the
 * device area). Returns null when no area can be determined.
 */
export function resolveAreaId(entityId: string): string | null {
  return Registry.getAreaIdForEntity(entityId);
}

/**
 * Areas the lights/covers/climate views and their summary tiles must leave
 * out (#428): the overview-hidden areas (areas_display.hidden), but only
 * with the opt-in hide_hidden_areas_in_summaries. By default hiding an area
 * card keeps its entities in those views and counts. Returns undefined when
 * nothing is to be excluded, so callers can omit the card-config key and
 * existing configs generate byte-identical output.
 */
export function summaryHiddenAreas(config: Simon42StrategyConfig): string[] | undefined {
  if (config.hide_hidden_areas_in_summaries !== true) return undefined;
  const hidden = config.areas_display?.hidden;
  return hidden && hidden.length > 0 ? hidden : undefined;
}

/**
 * Resolve the human-readable area name for an entity (or null if it has
 * no area). Reads the name from hass.areas so it reflects the live
 * registry (renames, etc.).
 */
export function getAreaNameForEntity(entityId: string, hass: HomeAssistant): string | null {
  const areaId = resolveAreaId(entityId);
  if (!areaId) return null;
  const area = Reflect.get(hass.areas as Record<string, unknown>, areaId) as { name?: string } | undefined;
  return area?.name ?? null;
}
