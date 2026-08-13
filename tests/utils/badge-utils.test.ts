// ============================================================================
// Tests — Badge utilities (badges group options, #396)
// ============================================================================
// badges.hidden must keep working as the badge-only deselection now that the
// Registry no longer folds the 'badges' pseudo-group into its global
// exclusion set: applyBadgeGroupOptions is the single place where
// badges.hidden and badges.additional take effect.
// ============================================================================

import { describe, it, expect } from 'vitest';

import {
  applyBadgeGroupOptions,
  isBadgeCandidate,
  isEnergyBlockSensor,
  selectBadgeEntitiesOfType,
  type BadgeCandidate,
} from '../../src/utils/badge-utils';
import { makeHass } from '../fixtures/hass';

function candidatesFixture(): BadgeCandidate[] {
  return [
    { entity: 'sensor.kitchen_power', color: 'orange' },
    { entity: 'binary_sensor.kitchen_window', color: 'teal', showName: true },
  ];
}

describe('applyBadgeGroupOptions', () => {
  it('returns candidates unchanged without badge options', () => {
    const hass = makeHass({});
    const candidates = candidatesFixture();
    expect(applyBadgeGroupOptions(candidates, undefined, hass)).toEqual(candidates);
  });

  it('removes deselected badges (badges.hidden still hides the badge)', () => {
    const hass = makeHass({});
    const result = applyBadgeGroupOptions(
      candidatesFixture(),
      { hidden: ['sensor.kitchen_power'] },
      hass
    );
    expect(result.map(function toId(c) { return c.entity; })).toEqual([
      'binary_sensor.kitchen_window',
    ]);
  });

  it('appends additional badges only when they have a state, without duplicates', () => {
    const hass = makeHass({
      entities: [
        { entity_id: 'sensor.kitchen_co2', attributes: { device_class: 'carbon_dioxide' } },
      ],
    });
    const result = applyBadgeGroupOptions(
      candidatesFixture(),
      { additional: ['sensor.kitchen_co2', 'sensor.does_not_exist', 'sensor.kitchen_power'] },
      hass
    );
    expect(result.map(function toId(c) { return c.entity; })).toEqual([
      'sensor.kitchen_power',
      'binary_sensor.kitchen_window',
      'sensor.kitchen_co2',
    ]);
    // Color derives from the entity's device_class
    expect(result.at(2)?.color).toBe('green');
  });

  it('does not mutate the input candidate list', () => {
    const hass = makeHass({
      entities: [{ entity_id: 'sensor.kitchen_co2', attributes: { device_class: 'carbon_dioxide' } }],
    });
    const candidates = candidatesFixture();
    applyBadgeGroupOptions(candidates, { hidden: ['sensor.kitchen_power'], additional: ['sensor.kitchen_co2'] }, hass);
    expect(candidates).toEqual(candidatesFixture());
  });
});

// ============================================================================
// Energy block routing — the editor's candidate list must mirror the runtime:
// power/energy/water/gas sensors are routed into the room energy block and
// never render as auto-detected badges, so they must not be candidates (#396).
// ============================================================================

describe('isEnergyBlockSensor', () => {
  it('matches sensor entities with an energy-block device_class', () => {
    for (const dc of ['power', 'energy', 'water', 'gas']) {
      expect(isEnergyBlockSensor('sensor', dc)).toBe(true);
    }
  });

  it('ignores other domains and device classes', () => {
    expect(isEnergyBlockSensor('binary_sensor', 'gas')).toBe(false); // gas detector, not a meter
    expect(isEnergyBlockSensor('sensor', 'illuminance')).toBe(false);
    expect(isEnergyBlockSensor('sensor', undefined)).toBe(false);
  });
});

describe('isBadgeCandidate — energy-block sensors excluded (#396)', () => {
  it('rejects power sensors (device_class and W/kW unit heuristics)', () => {
    expect(isBadgeCandidate('sensor', 'power', 'W', 'sensor.kitchen_plug_load')).toBe(false);
    expect(isBadgeCandidate('sensor', undefined, 'W', 'sensor.kitchen_plug_load')).toBe(false);
    expect(isBadgeCandidate('sensor', undefined, 'kW', 'sensor.kitchen_plug_load')).toBe(false);
  });

  it('rejects energy/water/gas meter sensors', () => {
    expect(isBadgeCandidate('sensor', 'energy', 'kWh', 'sensor.kitchen_consumption')).toBe(false);
    expect(isBadgeCandidate('sensor', 'water', 'L', 'sensor.kitchen_water_meter')).toBe(false);
    expect(isBadgeCandidate('sensor', 'gas', 'm³', 'sensor.kitchen_gas_meter')).toBe(false);
  });

  it('still accepts non-energy sensor badges', () => {
    expect(isBadgeCandidate('sensor', 'illuminance', 'lx', 'sensor.kitchen_light_level')).toBe(true);
    expect(isBadgeCandidate('sensor', 'carbon_dioxide', 'ppm', 'sensor.kitchen_air')).toBe(true);
    expect(isBadgeCandidate('binary_sensor', 'gas', undefined, 'binary_sensor.kitchen_gas_alarm')).toBe(true);
  });
});

// ============================================================================
// Single-type badge selection — default stays one badge per type, but an
// explicit editor selection renders every still-selected sensor (#396).
// ============================================================================

describe('selectBadgeEntitiesOfType', () => {
  const lux = ['sensor.lux_1', 'sensor.lux_2', 'sensor.lux_3'];

  it('renders exactly the first sensor by default (no badge spam)', () => {
    expect(selectBadgeEntitiesOfType(lux, new Set())).toEqual(['sensor.lux_1']);
  });

  it('renders all still-selected sensors once the type was curated', () => {
    expect(selectBadgeEntitiesOfType(lux, new Set(['sensor.lux_3']))).toEqual([
      'sensor.lux_1',
      'sensor.lux_2',
    ]);
  });

  it('keeps a later sensor alive when the first-detected one is deselected', () => {
    expect(selectBadgeEntitiesOfType(lux, new Set(['sensor.lux_1']))).toEqual([
      'sensor.lux_2',
      'sensor.lux_3',
    ]);
  });

  it('renders nothing when every sensor of the type is deselected', () => {
    expect(selectBadgeEntitiesOfType(lux, new Set(lux))).toEqual([]);
  });

  it('ignores hidden entries of other types', () => {
    expect(selectBadgeEntitiesOfType(lux, new Set(['sensor.other_motion']))).toEqual(['sensor.lux_1']);
  });

  it('returns empty for an empty type', () => {
    expect(selectBadgeEntitiesOfType([], new Set(['sensor.lux_1']))).toEqual([]);
  });
});
