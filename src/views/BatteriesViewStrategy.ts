// ====================================================================
// VIEW STRATEGY — BATTERIES (Battery Status Overview)
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { LovelaceViewConfig, LovelaceSectionConfig } from '../types/lovelace';
import { Registry } from '../Registry';
import { localize } from '../utils/localize';
import { getBatteryEntities } from '../utils/entity-filter';
import { densePlacement } from '../utils/view-builder';

function getAreaNameForEntity(entityId: string, hass: HomeAssistant): string | null {
  const entity = Registry.getEntity(entityId);
  let areaId: string | null = entity?.area_id ?? null;
  if (!areaId && entity?.device_id) {
    const device = Registry.getDevice(entity.device_id);
    areaId = device?.area_id ?? null;
  }
  if (!areaId) return null;
  const area = Reflect.get(hass.areas as Record<string, unknown>, areaId) as { name?: string } | undefined;
  return area?.name ?? null;
}

function createBatterySection(
  entities: string[],
  status: 'critical' | 'low' | 'good',
  rangeText: string,
  hass: HomeAssistant,
  showArea: boolean,
): LovelaceSectionConfig | null {
  if (entities.length === 0) return null;

  const emoji = status === 'critical' ? '🔴' : status === 'low' ? '🟡' : '🟢';
  const color = status === 'critical' ? 'red' : status === 'low' ? 'yellow' : 'green';

  return {
    type: 'grid',
    cards: [
      {
        type: 'heading',
        heading: `${emoji} ${localize('batteries.' + status)} (${rangeText}) - ${entities.length} ${
          localize(entities.length === 1 ? 'batteries.battery_one' : 'batteries.battery_many')
        }`,
        heading_style: 'title',
      },
      ...entities.map((e) => {
        const tile: { type: string; [key: string]: unknown } = {
          type: 'tile',
          entity: e,
          vertical: false,
          state_content: ['state', 'last_changed'],
          color,
        };
        if (showArea) {
          const areaName = getAreaNameForEntity(e, hass);
          if (areaName) {
            const st = Reflect.get(hass.states as Record<string, unknown>, e) as { attributes?: { friendly_name?: string } } | undefined;
            const friendly = st?.attributes?.friendly_name;
            tile.name = friendly ? `${areaName} • ${friendly}` : areaName;
          }
        }
        return tile;
      }),
    ],
  };
}

class Simon42ViewBatteriesStrategy extends HTMLElement {
  static async generate(config: any, hass: HomeAssistant): Promise<LovelaceViewConfig> {
    // Ensure Registry is initialized (idempotent — no-op if already done)
    Registry.initialize(hass, config.config || {});

    const batteryEntities = getBatteryEntities(hass, config.config);

    // Group by status
    const strategyConfig = config.config || {};
    const criticalThreshold = strategyConfig.battery_critical_threshold ?? 20;
    const lowThreshold = strategyConfig.battery_low_threshold ?? 50;
    const showArea = strategyConfig.show_area_in_battery_view === true;
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

    const criticalSection = createBatterySection(critical, 'critical', `< ${criticalThreshold}%`, hass, showArea);
    if (criticalSection) sections.push(criticalSection);

    const lowSection = createBatterySection(low, 'low', `${criticalThreshold}% - ${lowThreshold}%`, hass, showArea);
    if (lowSection) sections.push(lowSection);

    const goodSection = createBatterySection(good, 'good', `> ${lowThreshold}%`, hass, showArea);
    if (goodSection) sections.push(goodSection);

    return { type: 'sections', ...densePlacement(strategyConfig), sections };
  }
}

customElements.define('ll-strategy-simon42-view-batteries', Simon42ViewBatteriesStrategy);
