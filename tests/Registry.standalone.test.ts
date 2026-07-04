// ============================================================================
// Tests — Registry standalone init (#147: cards on manual dashboards)
// ============================================================================
// Locks down the precedence contract:
//   1. initializeStandalone works without strategy config (cards render)
//   2. a LATER strategy initialize() with real config re-initializes —
//      a standalone init must never lock out the strategy's config filters
//   3. standalone after a full init is a no-op (config filters survive)
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';

import { Registry } from '../src/Registry';
import { makeHass } from './fixtures/hass';

const HASS = () =>
  makeHass({
    areas: [{ area_id: 'living', name: 'Wohnzimmer' }],
    entities: [
      { entity_id: 'light.sofa', state: 'on', area_id: 'living' },
      { entity_id: 'light.decke', state: 'off', area_id: 'living' },
    ],
  });

// Strategy config that hides light.sofa in the living room
const HIDING_CONFIG = {
  areas_options: {
    living: { groups_options: { lights: { hidden: ['light.sofa'] } } },
  },
};

beforeEach(() => {
  Registry.resetForTesting();
});

describe('Registry.initializeStandalone', () => {
  it('initializes without strategy config (registry rules only)', () => {
    Registry.initializeStandalone(HASS());
    expect(Registry.initialized).toBe(true);
    expect(Registry.getVisibleEntityIdsForDomain('light').sort()).toEqual([
      'light.decke',
      'light.sofa',
    ]);
  });

  it('is a no-op when a full init already ran (config filters survive)', () => {
    const hass = HASS();
    Registry.initialize(hass, HIDING_CONFIG);
    Registry.initializeStandalone(hass);
    expect(Registry.getVisibleEntityIdsForDomain('light')).toEqual(['light.decke']);
  });

  it('does not lock out a later strategy init — real config re-initializes', () => {
    const hass = HASS();
    // Card on a manual dashboard initializes first (no config)...
    Registry.initializeStandalone(hass);
    expect(Registry.getVisibleEntityIdsForDomain('light')).toHaveLength(2);
    // ...then the strategy dashboard generates with its real config.
    Registry.initialize(hass, HIDING_CONFIG);
    expect(Registry.getVisibleEntityIdsForDomain('light')).toEqual(['light.decke']);
  });

  it('strategy initialize stays idempotent after taking over', () => {
    const hass = HASS();
    Registry.initializeStandalone(hass);
    Registry.initialize(hass, HIDING_CONFIG);
    // Second strategy call (other view strategies) must not re-init again
    Registry.initialize(hass, {});
    expect(Registry.getVisibleEntityIdsForDomain('light')).toEqual(['light.decke']);
  });
});
