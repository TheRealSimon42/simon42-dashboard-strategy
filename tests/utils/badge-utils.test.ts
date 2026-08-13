// ============================================================================
// Tests — Badge utilities (badges group options, #396)
// ============================================================================
// badges.hidden must keep working as the badge-only deselection now that the
// Registry no longer folds the 'badges' pseudo-group into its global
// exclusion set: applyBadgeGroupOptions is the single place where
// badges.hidden and badges.additional take effect.
// ============================================================================

import { describe, it, expect } from 'vitest';

import { applyBadgeGroupOptions, type BadgeCandidate } from '../../src/utils/badge-utils';
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
