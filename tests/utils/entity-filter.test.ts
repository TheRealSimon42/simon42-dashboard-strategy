// ============================================================================
// Tests — entity-filter utilities
// ============================================================================
// Covers the person/weather/sensor finders that every view strategy relies
// on. These are pure(-ish) functions over the Registry singleton; we reset
// the singleton between tests with Registry.resetForTesting().
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';

import { Registry } from '../../src/Registry';
import {
  collectPersons,
  findWeatherEntity,
  findDummySensor,
} from '../../src/utils/entity-filter';
import { makeHass } from '../fixtures/hass';

beforeEach(() => {
  Registry.resetForTesting();
});

describe('collectPersons', () => {
  it('returns empty when no person entities exist', () => {
    const hass = makeHass({ entities: [{ entity_id: 'light.kitchen' }] });
    Registry.initialize(hass, {});
    expect(collectPersons(hass, {})).toEqual([]);
  });

  it('returns one entry per person with friendly_name + isHome flag', () => {
    const hass = makeHass({
      entities: [
        { entity_id: 'person.alice', state: 'home', attributes: { friendly_name: 'Alice' } },
        { entity_id: 'person.bob', state: 'work', attributes: { friendly_name: 'Bob' } },
      ],
    });
    Registry.initialize(hass, {});
    const result = collectPersons(hass, {});
    expect(result).toEqual([
      { entity_id: 'person.alice', name: 'Alice', state: 'home', isHome: true },
      { entity_id: 'person.bob', name: 'Bob', state: 'work', isHome: false },
    ]);
  });

  it('falls back to entity-id slug when friendly_name is missing', () => {
    const hass = makeHass({
      entities: [{ entity_id: 'person.carol', state: 'home' }],
    });
    Registry.initialize(hass, {});
    expect(collectPersons(hass, {})[0]).toMatchObject({ name: 'carol' });
  });
});

describe('findWeatherEntity', () => {
  it('returns undefined when no weather entity exists', () => {
    const hass = makeHass({ entities: [{ entity_id: 'sensor.temperature' }] });
    Registry.initialize(hass, {});
    expect(findWeatherEntity(hass)).toBeUndefined();
  });

  it('returns the first visible weather entity', () => {
    const hass = makeHass({
      entities: [
        { entity_id: 'weather.home' },
        { entity_id: 'weather.forecast' },
      ],
    });
    Registry.initialize(hass, {});
    expect(findWeatherEntity(hass)).toBe('weather.home');
  });
});

describe('findDummySensor', () => {
  it('returns a sensor when one is available', () => {
    const hass = makeHass({
      entities: [{ entity_id: 'sensor.temp', state: '21.5' }],
    });
    Registry.initialize(hass, {});
    expect(findDummySensor(hass)).toBe('sensor.temp');
  });

  it('skips unavailable/unknown sensors', () => {
    const hass = makeHass({
      entities: [
        { entity_id: 'sensor.broken', state: 'unavailable' },
        { entity_id: 'sensor.ok', state: '42' },
      ],
    });
    Registry.initialize(hass, {});
    expect(findDummySensor(hass)).toBe('sensor.ok');
  });

  it('falls back to a light when no usable sensor exists', () => {
    const hass = makeHass({
      entities: [
        { entity_id: 'sensor.broken', state: 'unavailable' },
        { entity_id: 'light.kitchen', state: 'off' },
      ],
    });
    Registry.initialize(hass, {});
    expect(findDummySensor(hass)).toBe('light.kitchen');
  });

  it('falls back to sun.sun when nothing else is available', () => {
    const hass = makeHass({ entities: [] });
    Registry.initialize(hass, {});
    expect(findDummySensor(hass)).toBe('sun.sun');
  });
});
