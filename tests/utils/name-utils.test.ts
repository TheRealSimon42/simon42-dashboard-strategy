import { describe, expect, it } from 'vitest';

import { Registry } from '../../src/Registry';
import { makeHass } from '../fixtures/hass';
import {
  mergeStacksOrder,
  resolveAreaSortMode,
  sortAreasByOccupancy,
} from '../../src/utils/name-utils';

describe('mergeStacksOrder', () => {
  it('returns the default order when nothing is configured', () => {
    expect(mergeStacksOrder()).toEqual([
      'ups',
      'energy',
      'cameras',
      'lights',
      'locks',
      'climate',
      'covers',
      'covers_curtain',
      'covers_window',
      'media',
      'scenes',
      'vacuums',
      'switches',
      'misc',
      'automations',
      'scripts',
      'room_pins',
    ]);
  });

  it('keeps configured keys first and appends missing defaults', () => {
    expect(mergeStacksOrder(['lights', 'energy', 'room_pins'])).toEqual([
      'lights',
      'energy',
      'room_pins',
      'ups',
      'cameras',
      'locks',
      'climate',
      'covers',
      'covers_curtain',
      'covers_window',
      'media',
      'scenes',
      'vacuums',
      'switches',
      'misc',
      'automations',
      'scripts',
    ]);
  });

  it('drops duplicates and unknown keys', () => {
    expect(mergeStacksOrder(['lights', 'lights', 'unknown' as never, 'misc'])).toEqual([
      'lights',
      'misc',
      'ups',
      'energy',
      'cameras',
      'locks',
      'climate',
      'covers',
      'covers_curtain',
      'covers_window',
      'media',
      'scenes',
      'vacuums',
      'switches',
      'automations',
      'scripts',
      'room_pins',
    ]);
  });
});

describe('area sorting', () => {
  it('uses the explicit mode before the legacy boolean', () => {
    expect(resolveAreaSortMode({ use_default_area_sort: true })).toBe('ha_default');
    expect(resolveAreaSortMode({ use_default_area_sort: true, areas_sort_mode: 'manual' })).toBe('manual');
    expect(resolveAreaSortMode({ areas_sort_mode: 'occupancy_first' })).toBe('occupancy_first');
    expect(resolveAreaSortMode({ areas_sort_mode: 'invalid' as never })).toBe('manual');
  });

  it('moves occupied areas first and keeps each group stable', () => {
    const areas = [
      { area_id: 'quiet', name: 'Quiet' },
      { area_id: 'motion', name: 'Motion' },
      { area_id: 'presence', name: 'Presence' },
      { area_id: 'off', name: 'Off' },
    ];
    const hass = makeHass({
      areas,
      devices: [{ id: 'presence-device', area_id: 'presence' }],
      entities: [
        { entity_id: 'binary_sensor.motion', area_id: 'motion', state: 'on', attributes: { device_class: 'motion' } },
        { entity_id: 'binary_sensor.presence', device_id: 'presence-device', state: 'on', attributes: { device_class: 'presence' } },
        { entity_id: 'binary_sensor.off', area_id: 'off', state: 'off', attributes: { device_class: 'occupancy' } },
      ],
    });
    Registry.resetForTesting();
    Registry.initialize(hass, {});

    expect(sortAreasByOccupancy(areas, hass).map((area) => area.area_id)).toEqual([
      'motion',
      'presence',
      'quiet',
      'off',
    ]);
  });

  it('ignores non-occupancy classes and excluded entities', () => {
    const areas = [
      { area_id: 'noise', name: 'Noise' },
      { area_id: 'hidden', name: 'Hidden' },
      { area_id: 'diagnostic', name: 'Diagnostic' },
    ];
    const hass = makeHass({
      areas,
      entities: [
        { entity_id: 'binary_sensor.sound', area_id: 'noise', state: 'on', attributes: { device_class: 'sound' } },
        { entity_id: 'binary_sensor.hidden', area_id: 'hidden', state: 'on', attributes: { device_class: 'motion' }, labels: ['no_dboard'] },
        { entity_id: 'binary_sensor.diagnostic', area_id: 'diagnostic', state: 'on', attributes: { device_class: 'presence' }, entity_category: 'diagnostic' },
      ],
    });
    Registry.resetForTesting();
    Registry.initialize(hass, {});

    expect(sortAreasByOccupancy(areas, hass).map((area) => area.area_id)).toEqual([
      'noise',
      'hidden',
      'diagnostic',
    ]);
  });
});
