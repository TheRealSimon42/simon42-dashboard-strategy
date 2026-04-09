// ====================================================================
// VIEW STRATEGY — BATTERIES (Battery Status Overview)
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { LovelaceViewConfig, LovelaceSectionConfig } from '../types/lovelace';
import { Registry } from '../Registry';

class Simon42ViewBatteriesStrategy extends HTMLElement {
  static async generate(config: any, hass: HomeAssistant): Promise<LovelaceViewConfig> {
    // Ensure Registry is initialized (idempotent — no-op if already done)
    Registry.initialize(hass, config.config || {});

    const strategyConfig = config.config || {};
    const criticalThreshold = strategyConfig.battery_critical_threshold ?? 20;
    const lowThreshold = strategyConfig.battery_low_threshold ?? 50;

    const isBatteryCheckLabel = (value: any) =>
      /batterie[-_\s]?che?ck|battery[-_\s]?che?ck/i.test(String(value || ''));

    // 🔧 NEU: Batterie-Check aus config.entities (alte Logik)
    const batteryCheckSet = new Set(
      (config.entities || [])
        .filter((e: any) =>
          Array.isArray(e.labels) &&
          e.labels.some((l: any) => isBatteryCheckLabel(l))
        )
        .map((e: any) => e.entity_id)
    );

    // Use raw (unfiltered) domain maps
    const sensorIds = Registry.getEntityIdsForDomain('sensor');
    const binarySensorIds = Registry.getEntityIdsForDomain('binary_sensor');

    const batteryEntities = [...sensorIds, ...binarySensorIds].filter((entityId) => {
      const state = hass.states[entityId];
      if (!state) return false;

      if (Registry.isExcludedByLabel(entityId)) return false;
      if (Registry.isHiddenByConfig(entityId)) return false;
      const entry = Registry.getEntity(entityId);
      if (entry?.hidden) return false;

      const isBattery = entityId.includes('battery') || state.attributes?.device_class === 'battery';
      if (!isBattery) return false;

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

    // Deduplication
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
    const critical: string[] = [];
    const low: string[] = [];
    const good: string[] = [];

    for (const entityId of dedupedEntities) {
      const state = hass.states[entityId];

      const raw = String(state.state || '').toLowerCase();
      const registryLabel = Registry.getRegistryLabel(entityId)?.toLowerCase?.() || '';

      const isBatteryCheck =
        isBatteryCheckLabel(registryLabel) ||
        batteryCheckSet.has(entityId);

      const value = parseFloat(state.state);
      const unit = state.attributes?.unit_of_measurement;

      // 🔴 KRITISCH

      if (raw === 'unavailable' || raw === 'unknown') {
        critical.push(entityId);
        continue;
      }

      if (isBatteryCheck && raw === 'low') {
        critical.push(entityId);
        continue;
      }

      if (entityId.startsWith('binary_sensor.') && raw === 'on') {
        critical.push(entityId);
        continue;
      }

      if (unit === '%' && !isNaN(value) && value < criticalThreshold) {
        critical.push(entityId);
        continue;
      }

      // 🟡 LOW

      if (isBatteryCheck && (raw === 'middle' || raw === 'medium')) {
        low.push(entityId);
        continue;
      }

      if (unit === '%' && !isNaN(value) && value <= lowThreshold) {
        low.push(entityId);
        continue;
      }

      // 🟢 GOOD

      good.push(entityId);
    }

    const sections: LovelaceSectionConfig[] = [];

    if (critical.length > 0) {
      sections.push({
        type: 'grid',
        cards: [
          {
            type: 'heading',
            heading: `🔴 Kritisch (< ${criticalThreshold}%) - ${critical.length} ${critical.length === 1 ? 'Batterie' : 'Batterien'}`,
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
            heading: `🟡 Niedrig (${criticalThreshold}-${lowThreshold}%) - ${low.length} ${low.length === 1 ? 'Batterie' : 'Batterien'}`,
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
            heading: `🟢 Gut (> ${lowThreshold}%) - ${good.length} ${good.length === 1 ? 'Batterie' : 'Batterien'}`,
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
