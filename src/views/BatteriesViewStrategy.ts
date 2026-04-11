// ====================================================================
// VIEW STRATEGY — BATTERIES (Battery Status Overview)
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { LovelaceViewConfig, LovelaceSectionConfig } from '../types/lovelace';
import { Registry } from '../Registry';
import { localize } from '../utils/localize';

class Simon42ViewBatteriesStrategy extends HTMLElement {
  static async generate(config: any, hass: HomeAssistant): Promise<LovelaceViewConfig> {
    // Ensure Registry is initialized (idempotent — no-op if already done)
    Registry.initialize(hass, config.config || {});

    // Use raw (unfiltered) domain maps — battery sensors are often entity_category
    // "diagnostic" which getVisibleEntityIdsForDomain() would exclude.
    // We still filter out no_dboard and config-hidden below.
    const sensorIds = Registry.getEntityIdsForDomain('sensor');
    const binarySensorIds = Registry.getEntityIdsForDomain('binary_sensor');

    // Filter battery entities — exclude hidden/no_dboard but keep diagnostic
    const batteryEntities = [...sensorIds, ...binarySensorIds].filter((entityId) => {
      const state = hass.states[entityId];
      if (!state) return false;

      // Exclude hidden and no_dboard entities (but NOT diagnostic — batteries are often diagnostic)
      if (Registry.isExcludedByLabel(entityId)) return false;
      if (Registry.isHiddenByConfig(entityId)) return false;
      const entry = Registry.getEntity(entityId);
      if (entry?.hidden) return false;

      const isBattery = entityId.includes('battery') || state.attributes?.device_class === 'battery';
      if (!isBattery) return false;

      // Platform-specific filter: hide mobile_app batteries if configured
      if (config.config?.hide_mobile_app_batteries) {
        const registryEntry = Registry.getEntity(entityId);
        if (registryEntry?.platform === 'mobile_app') return false;
      }

      if (entityId.startsWith('binary_sensor.')) return true;
      const stateVal = state.state;
      if (stateVal === 'unavailable' || stateVal === 'unknown') return true;
      const value = parseFloat(stateVal);
      return !isNaN(value);
    });

    // Deduplication: remove binary_sensor if %-sensor exists on same device
    const sensorDeviceIds = new Set<string>();
    for (const id of batteryEntities) {
      if (id.startsWith('sensor.')) {
        const deviceId = Registry.getEntity(id)?.device_id;
        if (deviceId) sensorDeviceIds.add(deviceId);
      }
    }
    const dedupedEntities = batteryEntities.filter((id) => {
      if (!id.startsWith('binary_sensor.')) return true;
      const deviceId = Registry.getEntity(id)?.device_id;
      return !deviceId || !sensorDeviceIds.has(deviceId);
    });

    // Group by status
    const strategyConfig = config.config || {};
    const criticalThreshold = strategyConfig.battery_critical_threshold ?? 20;
    const lowThreshold = strategyConfig.battery_low_threshold ?? 50;
    const critical: string[] = [];
    const low: string[] = [];
    const good: string[] = [];

    for (const entityId of dedupedEntities) {
      const state = hass.states[entityId];
      if (entityId.startsWith('binary_sensor.')) {
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
      if (isNaN(value)) critical.push(entityId);
      else if (value < criticalThreshold) critical.push(entityId);
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

    if (critical.length > 0) {
      sections.push({
        type: 'grid',
        cards: [
          {
            type: 'heading',
            heading: `🔴 ${localize('batteries.critical')} (< ${criticalThreshold}%) - ${critical.length} ${critical.length === 1 ? localize('batteries.battery_one') : localize('batteries.battery_many')}`,
            heading_style: 'title',
          },
          ...critical.map((e) => ({
            type: 'tile',
            entity: e,
            vertical: false,
            state_content: ['state', 'last_changed'],
            color: 'red',
          })),
        ],
      });
    }

    if (low.length > 0) {
      sections.push({
        type: 'grid',
        cards: [
          {
            type: 'heading',
            heading: `🟡 ${localize('batteries.low')} (${criticalThreshold}-${lowThreshold}%) - ${low.length} ${low.length === 1 ? localize('batteries.battery_one') : localize('batteries.battery_many')}`,
            heading_style: 'title',
          },
          ...low.map((e) => ({
            type: 'tile',
            entity: e,
            vertical: false,
            state_content: ['state', 'last_changed'],
            color: 'yellow',
          })),
        ],
      });
    }

    if (good.length > 0) {
      sections.push({
        type: 'grid',
        cards: [
          {
            type: 'heading',
            heading: `🟢 ${localize('batteries.good')} (> ${lowThreshold}%) - ${good.length} ${good.length === 1 ? localize('batteries.battery_one') : localize('batteries.battery_many')}`,
            heading_style: 'title',
          },
          ...good.map((e) => ({
            type: 'tile',
            entity: e,
            vertical: false,
            state_content: ['state', 'last_changed'],
            color: 'green',
          })),
        ],
      });
    }

    return { type: 'sections', sections };
  }
}

customElements.define('ll-strategy-simon42-view-batteries', Simon42ViewBatteriesStrategy);
