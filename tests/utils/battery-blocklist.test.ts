// ============================================================================
// Tests — battery blocklist (battery_ignored_entities / _devices)
// ============================================================================
// One shared collector feeds the batteries tile/view AND the maintenance
// scan, so a single blocklist must silence both.
// ============================================================================

import { describe, it, expect } from 'vitest';

import { getBatteryEntities } from '../../src/utils/entity-filter';
import { buildMaintenanceScan, criticalBatteryIds } from '../../src/utils/maintenance-utils';
import { Registry } from '../../src/Registry';
import { makeHass } from '../fixtures/hass';
import type { Simon42StrategyConfig } from '../../src/types/strategy';

const battery = { device_class: 'battery', unit_of_measurement: '%' };

function setup(config: Simon42StrategyConfig) {
  const hass = makeHass({
    devices: [{ id: 'dev_old', name: 'Altes Gerät' }],
    entities: [
      { entity_id: 'sensor.a_battery', state: '5', attributes: battery },
      { entity_id: 'sensor.b_battery', state: '6', attributes: battery },
      { entity_id: 'sensor.old_battery', device_id: 'dev_old', state: '3', attributes: battery },
    ],
  });
  Registry.resetForTesting();
  Registry.initialize(hass, config);
  return hass;
}

describe('battery blocklist', () => {
  it('lists everything by default', () => {
    const hass = setup({});
    expect(getBatteryEntities(hass, {}).sort()).toEqual(['sensor.a_battery', 'sensor.b_battery', 'sensor.old_battery']);
  });

  it('drops ignored entities and ignored devices', () => {
    const config: Simon42StrategyConfig = {
      battery_ignored_entities: ['sensor.a_battery'],
      battery_ignored_devices: ['dev_old'],
    };
    const hass = setup(config);
    expect(getBatteryEntities(hass, config)).toEqual(['sensor.b_battery']);
  });

  it('also removes ignored batteries from the maintenance critical list', () => {
    const config: Simon42StrategyConfig = { battery_ignored_entities: ['sensor.a_battery'] };
    const hass = setup(config);
    const scan = buildMaintenanceScan(hass, config);
    expect(criticalBatteryIds(hass, scan, 20).sort()).toEqual(['sensor.b_battery', 'sensor.old_battery']);
  });
});