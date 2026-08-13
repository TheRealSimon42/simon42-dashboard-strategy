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
import { Registry } from '../Registry';

/**
 * Resolve the area_id for an entity, falling back through its device's
 * area when the entity itself has none (entities often inherit the
 * device area). Returns null when no area can be determined.
 */
export function resolveAreaId(entityId: string): string | null {
  const entry = Registry.getEntity(entityId);
  if (!entry) return null;
  if (entry.area_id) return entry.area_id;
  if (entry.device_id) {
    return Registry.getDevice(entry.device_id)?.area_id ?? null;
  }
  return null;
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
