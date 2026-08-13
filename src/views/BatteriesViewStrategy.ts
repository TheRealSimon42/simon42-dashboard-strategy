// ====================================================================
// VIEW STRATEGY — BATTERIES (Battery Status Overview)
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { LovelaceViewConfig, LovelaceSectionConfig } from '../types/lovelace';
import type { AreaRegistryEntry } from '../types/registries';
import { Registry } from '../Registry';
import { localize } from '../utils/localize';
import { getBatteryEntities } from '../utils/entity-filter';
import { densePlacement } from '../utils/view-builder';
import { resolveAreaId, getAreaNameForEntity } from '../utils/area-utils';
import { getVisibleAreasFromHass } from '../utils/name-utils';

/** Build a single battery tile. When prefixArea is true, the area name is
 *  prepended to the tile name (show_area_in_battery_view). Suppressed when
 *  grouping by area — the area is then a heading, not a name prefix. */
function buildBatteryTile(
  entityId: string,
  hass: HomeAssistant,
  color: string,
  prefixArea: boolean,
): { type: string; [key: string]: unknown } {
  const tile: { type: string; [key: string]: unknown } = {
    type: 'tile',
    entity: entityId,
    vertical: false,
    state_content: ['state', 'last_changed'],
    color,
  };
  if (prefixArea) {
    const areaName = getAreaNameForEntity(entityId, hass);
    if (areaName) {
      const st = Reflect.get(hass.states as Record<string, unknown>, entityId) as
        | { attributes?: { friendly_name?: string } }
        | undefined;
      const friendly = st?.attributes?.friendly_name;
      tile.name = friendly ? `${areaName} • ${friendly}` : areaName;
    }
  }
  return tile;
}

export function createBatterySection(
  entities: string[],
  status: 'critical' | 'low' | 'good',
  rangeText: string,
  hass: HomeAssistant,
  showArea: boolean,
  groupByAreas: boolean,
  visibleAreas: AreaRegistryEntry[],
): LovelaceSectionConfig | null {
  if (entities.length === 0) return null;

  const emoji = status === 'critical' ? '🔴' : status === 'low' ? '🟡' : '🟢';
  const color = status === 'critical' ? 'red' : status === 'low' ? 'yellow' : 'green';
  // Grouping by area makes the per-tile name prefix redundant (area is a heading)
  const prefixArea = showArea && !groupByAreas;

  const cards: { type: string; [key: string]: unknown }[] = [
    {
      type: 'heading',
      heading: `${emoji} ${localize('batteries.' + status)} (${rangeText}) - ${entities.length} ${
        localize(entities.length === 1 ? 'batteries.battery_one' : 'batteries.battery_many')
      }`,
      heading_style: 'title',
    },
  ];

  if (groupByAreas) {
    // Bucket entities by area, preserving the per-area sort order (sortByLevel
    // already ran globally; re-bucketing keeps relative order within an area).
    const byArea = new Map<string, string[]>();
    const noArea: string[] = [];
    for (const e of entities) {
      const areaId = resolveAreaId(e);
      if (!areaId) {
        noArea.push(e);
        continue;
      }
      const arr = byArea.get(areaId) || [];
      arr.push(e);
      byArea.set(areaId, arr);
    }
    // Emit visible areas in the user's order, then a trailing "no area" bucket
    for (const area of visibleAreas) {
      const arr = byArea.get(area.area_id);
      if (!arr || arr.length === 0) continue;
      cards.push({ type: 'heading', heading: area.name, heading_style: 'subtitle' });
      for (const e of arr) cards.push(buildBatteryTile(e, hass, color, prefixArea));
    }
    if (noArea.length > 0) {
      cards.push({ type: 'heading', heading: localize('batteries.no_area'), heading_style: 'subtitle' });
      for (const e of noArea) cards.push(buildBatteryTile(e, hass, color, prefixArea));
    }
  } else {
    for (const e of entities) cards.push(buildBatteryTile(e, hass, color, prefixArea));
  }

  return { type: 'grid', cards };
}

export class Simon42ViewBatteriesStrategy extends HTMLElement {
  static async generate(config: any, hass: HomeAssistant): Promise<LovelaceViewConfig> {
    // Ensure Registry is initialized (idempotent — no-op if already done)
    Registry.initialize(hass, config.config || {});

    const batteryEntities = getBatteryEntities(hass, config.config);

    // Group by status
    const strategyConfig = config.config || {};
    const criticalThreshold = strategyConfig.battery_critical_threshold ?? 20;
    const lowThreshold = strategyConfig.battery_low_threshold ?? 50;
    const showArea = strategyConfig.show_area_in_battery_view === true;
    const groupByAreas = strategyConfig.group_batteries_by_areas === true;
    // Visible areas in the user's order/visibility (respects areas_display +
    // use_default_area_sort), same source the security view uses
    const visibleAreas = groupByAreas
      ? getVisibleAreasFromHass(hass, strategyConfig.areas_display, strategyConfig.use_default_area_sort)
      : [];
    // Where to bucket sensors whose state can't be evaluated (unavailable,
    // unknown, restarting, non-numeric). Default 'good': in a survey of
    // typical HA installs, the Critical bucket otherwise gets flooded with
    // offline / never-pressed entities that aren't actionable as low
    // batteries. Users who want to surface broken sensors as critical can
    // flip the radio in the editor. Both buckets are defensible defaults;
    // 'good' keeps the count meaningful for at-a-glance scanning.
    const unavailableBucket: 'critical' | 'good' =
      strategyConfig.unavailable_batteries_bucket === 'critical' ? 'critical' : 'good';
    const critical: string[] = [];
    const low: string[] = [];
    const good: string[] = [];

    const UNAVAILABLE_STATES = new Set(['unavailable', 'unknown', 'none', 'restarting']);

    for (const entityId of batteryEntities) {
      const state = hass.states[entityId];
      if (entityId.startsWith('binary_sensor.')) {
        // Unavailable binary battery sensors aren't reporting; mirror the
        // sensor.* path and respect the user's chosen bucket.
        if (UNAVAILABLE_STATES.has(state.state)) {
          (unavailableBucket === 'critical' ? critical : good).push(entityId);
          continue;
        }
        // For device_class === 'battery' binary sensors, state 'on' === low.
        (state.state === 'on' ? critical : good).push(entityId);
        continue;
      }
      const value = parseFloat(state.state);
      const unit = state.attributes?.unit_of_measurement;
      // Only apply percentage thresholds to %-based sensors.
      // Voltage sensors (V, mV) have device-specific ranges and cannot be
      // meaningfully compared against percentage thresholds (e.g. 3V would
      // be "critical" at < 20 which is wrong). Skip them entirely.
      if (unit && unit !== '%') continue;
      if (isNaN(value)) {
        (unavailableBucket === 'critical' ? critical : good).push(entityId);
        continue;
      }
      if (value < criticalThreshold) critical.push(entityId);
      else if (value <= lowThreshold) low.push(entityId);
      else good.push(entityId);
    }

    // Sort each group by battery level (lowest first)
    const sortByLevel = (a: string, b: string): number => {
      const valA = parseFloat(hass.states[a]?.state);
      const valB = parseFloat(hass.states[b]?.state);
      if (isNaN(valA)) return -1;
      if (isNaN(valB)) return 1;
      return valA - valB;
    };
    critical.sort(sortByLevel);
    low.sort(sortByLevel);
    good.sort(sortByLevel);

    const sections: LovelaceSectionConfig[] = [];

    const criticalSection = createBatterySection(critical, 'critical', `< ${criticalThreshold}%`, hass, showArea, groupByAreas, visibleAreas);
    if (criticalSection) sections.push(criticalSection);

    const lowSection = createBatterySection(low, 'low', `${criticalThreshold}% - ${lowThreshold}%`, hass, showArea, groupByAreas, visibleAreas);
    if (lowSection) sections.push(lowSection);

    const goodSection = createBatterySection(good, 'good', `> ${lowThreshold}%`, hass, showArea, groupByAreas, visibleAreas);
    if (goodSection) sections.push(goodSection);

    return { type: 'sections', ...densePlacement(strategyConfig), sections };
  }
}

customElements.define('ll-strategy-simon42-view-batteries', Simon42ViewBatteriesStrategy);
