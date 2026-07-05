// ============================================================================
// Tests — Registry initialization & staleness handling
// ============================================================================
// The Registry is a static singleton. Within one generate pass, repeated
// initialize() calls must be no-ops (idempotency). But when HA regenerates
// the strategy after a registry change, hass carries NEW collection objects
// (immutable updates) — initialize() must then rebuild, otherwise views keep
// serving the snapshot from the first page load.
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';

import { Registry } from '../src/Registry';
import { makeHass } from './fixtures/hass';

beforeEach(() => {
  Registry.resetForTesting();
});

describe('Registry.initialize', () => {
  it('is a no-op while the hass registry references are unchanged', () => {
    const hass = makeHass({
      areas: [{ area_id: 'kitchen', name: 'Kitchen' }],
      entities: [{ entity_id: 'light.kitchen', area_id: 'kitchen' }],
    });
    Registry.initialize(hass, {});
    const before = Registry.getVisibleEntitiesForArea('kitchen');

    // Same references (HA re-calls generate without registry changes)
    Registry.initialize(hass, {});
    expect(Registry.getVisibleEntitiesForArea('kitchen')).toBe(before);
  });

  it('rebuilds when hass.entities is a new reference (registry changed)', () => {
    const hass = makeHass({
      areas: [{ area_id: 'kitchen', name: 'Kitchen' }],
      entities: [{ entity_id: 'light.kitchen', area_id: 'kitchen' }],
    });
    Registry.initialize(hass, {});
    expect(Registry.getVisibleEntitiesForArea('kitchen')).toHaveLength(1);

    // Simulate an entity added in HA: new hass with a NEW entities object
    const updated = makeHass({
      areas: [{ area_id: 'kitchen', name: 'Kitchen' }],
      entities: [
        { entity_id: 'light.kitchen', area_id: 'kitchen' },
        { entity_id: 'light.kitchen_2', area_id: 'kitchen' },
      ],
    });
    Registry.initialize(updated, {});

    const ids = Registry.getVisibleEntitiesForArea('kitchen').map(
      function toId(e) { return e.entity_id; }
    );
    expect(ids).toEqual(['light.kitchen', 'light.kitchen_2']);
  });

  it('rebuilds when hass.areas is a new reference (area renamed/added)', () => {
    const hass = makeHass({
      areas: [{ area_id: 'kitchen', name: 'Kitchen' }],
      entities: [{ entity_id: 'light.kitchen', area_id: 'kitchen' }],
    });
    Registry.initialize(hass, {});
    expect(Registry.areas.map(function toName(a) { return a.name; })).toEqual(['Kitchen']);

    const updated = makeHass({
      areas: [{ area_id: 'kitchen', name: 'Küche' }],
      entities: [{ entity_id: 'light.kitchen', area_id: 'kitchen' }],
    });
    Registry.initialize(updated, {});
    expect(Registry.areas.map(function toName(a) { return a.name; })).toEqual(['Küche']);
  });

  it('picks up the current config on a registry-triggered rebuild', () => {
    const hass = makeHass({
      areas: [{ area_id: 'kitchen', name: 'Kitchen' }],
      entities: [{ entity_id: 'light.kitchen', area_id: 'kitchen' }],
    });
    Registry.initialize(hass, {});
    expect(Registry.getVisibleEntitiesForArea('kitchen')).toHaveLength(1);

    const updated = makeHass({
      areas: [{ area_id: 'kitchen', name: 'Kitchen' }],
      entities: [{ entity_id: 'light.kitchen', area_id: 'kitchen' }],
    });
    const config = {
      areas_options: {
        kitchen: { groups_options: { light: { hidden: ['light.kitchen'] } } },
      },
    };
    Registry.initialize(updated, config);
    expect(Registry.getVisibleEntitiesForArea('kitchen')).toHaveLength(0);
  });
});
