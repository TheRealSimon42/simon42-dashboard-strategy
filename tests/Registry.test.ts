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

describe('badges pseudo-group exclusion (#396)', () => {
  it('does not hide a badge-deselected entity dashboard-wide', () => {
    const hass = makeHass({
      areas: [{ area_id: 'kitchen', name: 'Kitchen' }],
      entities: [
        { entity_id: 'sensor.kitchen_power', area_id: 'kitchen', attributes: { device_class: 'power', unit_of_measurement: 'W' } },
      ],
    });
    const config = {
      areas_options: {
        kitchen: { groups_options: { badges: { hidden: ['sensor.kitchen_power'] } } },
      },
    };
    Registry.initialize(hass, config);

    // The entity stays visible in all other sections (e.g. the energy block)
    expect(Registry.isHiddenByConfig('sensor.kitchen_power')).toBe(false);
    expect(Registry.isEntityExcluded('sensor.kitchen_power')).toBe(false);
    expect(
      Registry.getVisibleEntitiesForArea('kitchen').map(function toId(e) { return e.entity_id; })
    ).toEqual(['sensor.kitchen_power']);
  });

  it('keeps hiding entities deselected in regular domain groups', () => {
    const hass = makeHass({
      areas: [{ area_id: 'kitchen', name: 'Kitchen' }],
      entities: [{ entity_id: 'light.kitchen', area_id: 'kitchen' }],
    });
    const config = {
      areas_options: {
        kitchen: { groups_options: { light: { hidden: ['light.kitchen'] } } },
      },
    };
    Registry.initialize(hass, config);

    expect(Registry.isHiddenByConfig('light.kitchen')).toBe(true);
    expect(Registry.getVisibleEntitiesForArea('kitchen')).toHaveLength(0);
  });
});

describe('Registry child devices (HA 2026.9+)', () => {
  // A child device (parent_device_id) without an area inherits its parent's
  // area — entities on it must land in the parent's room, not in "no area".
  const spec = {
    areas: [
      { area_id: 'kitchen', name: 'Kitchen' },
      { area_id: 'garage', name: 'Garage' },
    ],
    devices: [
      { id: 'cam', area_id: 'kitchen', name: 'Dual-lens camera' },
      { id: 'cam_lens2', area_id: null, parent_device_id: 'cam', name: 'Lens 2' },
      { id: 'cam_lens3', area_id: 'garage', parent_device_id: 'cam', name: 'Lens 3' },
    ],
    entities: [
      { entity_id: 'camera.lens1', device_id: 'cam' },
      { entity_id: 'camera.lens2', device_id: 'cam_lens2' },
      { entity_id: 'camera.lens3', device_id: 'cam_lens3' },
    ],
  };

  it('resolves the effective device area through the parent', () => {
    Registry.initialize(makeHass(spec), {});
    expect(Registry.getDeviceAreaId('cam')).toBe('kitchen');
    expect(Registry.getDeviceAreaId('cam_lens2')).toBe('kitchen');
    expect(Registry.getDeviceAreaId('cam_lens3')).toBe('garage');
    expect(Registry.getDeviceAreaId('unknown')).toBeNull();
  });

  it('groups entities on child devices into the inherited area', () => {
    Registry.initialize(makeHass(spec), {});
    const kitchen = Registry.getVisibleEntitiesForArea('kitchen').map((e) => e.entity_id);
    const garage = Registry.getVisibleEntitiesForArea('garage').map((e) => e.entity_id);
    expect(kitchen).toEqual(['camera.lens1', 'camera.lens2']);
    expect(garage).toEqual(['camera.lens3']);
  });
});

describe('area-scoped domain lookups (#428)', () => {
  // Hiding an area on the overview (areas_display.hidden) must not lose its
  // entities anywhere by default. Only callers that pass an area set get
  // them filtered — via the entity's own area, its device's area or, for
  // child devices (HA 2026.9+), the parent device's area. The Registry
  // deliberately does not read the hidden list from its own config.
  const spec = {
    areas: [
      { area_id: 'abstellkammer', name: 'Abstellkammer' },
      { area_id: 'wohnzimmer', name: 'Wohnzimmer' },
    ],
    devices: [
      { id: 'dev_kammer', area_id: 'abstellkammer', name: 'Kammer-Hub' },
      { id: 'dev_kammer_child', area_id: null, parent_device_id: 'dev_kammer', name: 'Kammer-Hub Kanal 2' },
      { id: 'dev_wohn', area_id: 'wohnzimmer', name: 'Wohnzimmer-Hub' },
    ],
    entities: [
      { entity_id: 'light.kammer_decke', area_id: 'abstellkammer' },
      { entity_id: 'light.kammer_regal', device_id: 'dev_kammer' },
      { entity_id: 'light.kammer_kanal2', device_id: 'dev_kammer_child' },
      { entity_id: 'light.wohnzimmer', area_id: 'wohnzimmer' },
      { entity_id: 'light.wohnzimmer_hub', device_id: 'dev_wohn' },
      { entity_id: 'light.ohne_bereich' },
      { entity_id: 'cover.kammer', area_id: 'abstellkammer', attributes: { device_class: 'shutter' } },
      { entity_id: 'cover.wohnzimmer', area_id: 'wohnzimmer', attributes: { device_class: 'shutter' } },
    ],
  };
  const HIDDEN = new Set(['abstellkammer']);

  beforeEach(() => {
    Registry.initialize(makeHass(spec), { areas_display: { hidden: ['abstellkammer'] } });
  });

  it('resolves the entity area through the entity, its device and the parent device', () => {
    expect(Registry.getAreaIdForEntity('light.kammer_decke')).toBe('abstellkammer');
    expect(Registry.getAreaIdForEntity('light.kammer_regal')).toBe('abstellkammer');
    expect(Registry.getAreaIdForEntity('light.kammer_kanal2')).toBe('abstellkammer');
    expect(Registry.getAreaIdForEntity('light.ohne_bereich')).toBeNull();
    expect(Registry.getAreaIdForEntity('light.unknown')).toBeNull();
  });

  it('keeps hidden-area entities in the plain domain lookup (default behaviour)', () => {
    const all = Registry.getVisibleEntityIdsForDomain('light');
    expect(all).toEqual([
      'light.kammer_decke',
      'light.kammer_regal',
      'light.kammer_kanal2',
      'light.wohnzimmer',
      'light.wohnzimmer_hub',
      'light.ohne_bereich',
    ]);
    // An empty set filters nothing — the pre-computed list is handed out as is
    expect(Registry.getVisibleEntityIdsForDomain('light', new Set())).toBe(all);
  });

  it('drops entities of the given areas, whichever way they resolve to it', () => {
    expect(Registry.getVisibleEntityIdsForDomain('light', HIDDEN)).toEqual([
      'light.wohnzimmer',
      'light.wohnzimmer_hub',
      'light.ohne_bereich',
    ]);
    expect(Registry.getVisibleEntityIdsForDomain('cover', HIDDEN)).toEqual(['cover.wohnzimmer']);
  });

  it('never matches area-less or unknown entities against an area set', () => {
    expect(Registry.isEntityInAreas('light.kammer_kanal2', HIDDEN)).toBe(true);
    expect(Registry.isEntityInAreas('light.wohnzimmer', HIDDEN)).toBe(false);
    expect(Registry.isEntityInAreas('light.ohne_bereich', HIDDEN)).toBe(false);
    expect(Registry.isEntityInAreas('light.unknown', HIDDEN)).toBe(false);
  });
});
