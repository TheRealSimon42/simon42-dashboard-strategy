// ====================================================================
// Tests: summary view enabled logic (#391)
// ====================================================================
// The show_*_view flags keep a utility view available even when its
// summary tile is hidden (pattern established by show_battery_view).
// Defaults must match the summary tiles so existing configs behave
// exactly as before.
// ====================================================================

import { describe, expect, it } from 'vitest';

import { isUtilityViewEnabled, countActiveClimateEntities } from '../../src/utils/summary-view-utils';
import { makeHass } from '../fixtures/hass';
import type { Simon42StrategyConfig } from '../../src/types/strategy';

describe('isUtilityViewEnabled', () => {
  it('matches the summary defaults on an empty config', () => {
    const config: Simon42StrategyConfig = {};
    expect(isUtilityViewEnabled(config, 'lights')).toBe(true);
    expect(isUtilityViewEnabled(config, 'covers')).toBe(true);
    expect(isUtilityViewEnabled(config, 'security')).toBe(true);
    expect(isUtilityViewEnabled(config, 'batteries')).toBe(true);
    expect(isUtilityViewEnabled(config, 'climate')).toBe(false);
  });

  it('disables the view when the summary is turned off', () => {
    expect(isUtilityViewEnabled({ show_light_summary: false }, 'lights')).toBe(false);
    expect(isUtilityViewEnabled({ show_covers_summary: false }, 'covers')).toBe(false);
    expect(isUtilityViewEnabled({ show_security_summary: false }, 'security')).toBe(false);
    expect(isUtilityViewEnabled({ show_battery_summary: false }, 'batteries')).toBe(false);
  });

  it('keeps the view when the summary is off but the view flag is set', () => {
    expect(isUtilityViewEnabled({ show_light_summary: false, show_light_view: true }, 'lights')).toBe(true);
    expect(isUtilityViewEnabled({ show_covers_summary: false, show_covers_view: true }, 'covers')).toBe(true);
    expect(isUtilityViewEnabled({ show_security_summary: false, show_security_view: true }, 'security')).toBe(true);
    expect(isUtilityViewEnabled({ show_battery_summary: false, show_battery_view: true }, 'batteries')).toBe(true);
    expect(isUtilityViewEnabled({ show_climate_view: true }, 'climate')).toBe(true);
  });

  it('enables the climate view via its summary (opt-in default)', () => {
    expect(isUtilityViewEnabled({ show_climate_summary: true }, 'climate')).toBe(true);
  });

  it('treats an explicit false view flag as absent (summary still wins)', () => {
    expect(isUtilityViewEnabled({ show_light_view: false }, 'lights')).toBe(true);
    expect(isUtilityViewEnabled({ show_light_summary: false, show_light_view: false }, 'lights')).toBe(false);
    expect(isUtilityViewEnabled({ show_climate_summary: true, show_climate_view: false }, 'climate')).toBe(true);
  });
});


describe('countActiveClimateEntities', () => {
  // Regression test for issue #468: a thermostat in hvac_mode 'heat' or 'auto but
  // not currently calling for heat (hvac_action: 'idle') must not count as active.

  it('does not count a auto-mode thermostat that is currently idle', () => {
    const hass = makeHass({
      entities: [{ entity_id: 'climate.living_room', state: 'auto', attributes: { hvac_action: 'idle' } }],
    });
    const count = countActiveClimateEntities(hass, new Set(['climate.living_room']), {});
    expect(count).toBe(0);
  });

  it('counts a auto-mode thermostat that is actively heating', () => {
    const hass = makeHass({
      entities: [{ entity_id: 'climate.living_room', state: 'auto', attributes: { hvac_action: 'heating' } }],
    });
    const count = countActiveClimateEntities(hass, new Set(['climate.living_room']), {});
    expect(count).toBe(1);
  });

  it('counts a auto-mode thermostat that is actively cooling', () => {
    const hass = makeHass({
      entities: [{ entity_id: 'climate.living_room', state: 'auto', attributes: { hvac_action: 'cooling' } }],
    });
    const count = countActiveClimateEntities(hass, new Set(['climate.living_room']), {});
    expect(count).toBe(1);
  });

  it('falls back to hvac_mode when hvac_action is absent', () => {
    const hass = makeHass({
      entities: [{ entity_id: 'climate.living_room', state: 'auto' }],
    });
    const count = countActiveClimateEntities(hass, new Set(['climate.living_room']), {});
    expect(count).toBe(1);
  });

  it('does not count an off thermostat', () => {
    const hass = makeHass({
      entities: [{ entity_id: 'climate.living_room', state: 'off', attributes: { hvac_action: 'off' } }],
    });
    const count = countActiveClimateEntities(hass, new Set(['climate.living_room']), {});
    expect(count).toBe(0);
  });

  it('does not count an unavailable thermostat', () => {
    const hass = makeHass({
      entities: [{ entity_id: 'climate.living_room', state: 'unavailable' }],
    });
    const count = countActiveClimateEntities(hass, new Set(['climate.living_room']), {});
    expect(count).toBe(0);
  });

  it('returns 0 for a null entity set', () => {
    const hass = makeHass({});
    expect(countActiveClimateEntities(hass, null, {})).toBe(0);
  });

  it('counts multiple thermostats, mixing idle and active ones', () => {
    const hass = makeHass({
      entities: [
        { entity_id: 'climate.living_room', state: 'auto', attributes: { hvac_action: 'idle' } },
        { entity_id: 'climate.bathroom', state: 'auto', attributes: { hvac_action: 'heating' } },
        { entity_id: 'climate.bedroom', state: 'heat', attributes: { hvac_action: 'heating' } },
        { entity_id: 'climate.office', state: 'cool', attributes: { hvac_action: 'cooling' } },
        { entity_id: 'climate.kitchen', state: 'off' },
      ],
    });
    const count = countActiveClimateEntities(
      hass,
      new Set(['climate.living_room', 'climate.bathroom', 'climate.bedroom', 'climate.office', 'climate.kitchen']),
      {}
    );
    expect(count).toBe(3);
  });
});
