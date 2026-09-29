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
  isRelayOpeningSensor,
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

// ============================================================================
// Relay-style opening sensors — a relay device (SONOFF ZBMINIR2/L2, Shelly
// with input contact) exposes an `opening` binary_sensor that mirrors the
// relay input. The shared heuristic (switch sibling on the same device) keeps
// it out of the security view, the summary count and the room badges.
// ============================================================================

describe('isRelayOpeningSensor', () => {
  function relayHass() {
    return makeHass({
      devices: [{ id: 'dev_relay' }, { id: 'dev_contact' }],
      entities: [
        // Relay: switch + opening input on one device
        { entity_id: 'switch.relay', device_id: 'dev_relay', state: 'on' },
        {
          entity_id: 'binary_sensor.relay_input',
          device_id: 'dev_relay',
          state: 'off',
          attributes: { device_class: 'opening' },
        },
        // Plain contact sensor: only sensor siblings
        {
          entity_id: 'binary_sensor.terrace_contact',
          device_id: 'dev_contact',
          state: 'off',
          attributes: { device_class: 'opening' },
        },
        {
          entity_id: 'sensor.terrace_contact_battery',
          device_id: 'dev_contact',
          state: '80',
          attributes: { device_class: 'battery' },
        },
      ],
    });
  }

  it('flags an opening sensor whose device also exposes a switch (Registry lookup)', () => {
    Registry.initialize(relayHass(), {});
    expect(isRelayOpeningSensor('opening', 'dev_relay')).toBe(true);
  });

  it('keeps opening sensors on devices without a switch sibling', () => {
    Registry.initialize(relayHass(), {});
    expect(isRelayOpeningSensor('opening', 'dev_contact')).toBe(false);
  });

  it('only applies to the generic opening class, never to explicit door/window contacts', () => {
    Registry.initialize(relayHass(), {});
    expect(isRelayOpeningSensor('window', 'dev_relay')).toBe(false);
    expect(isRelayOpeningSensor('door', 'dev_relay')).toBe(false);
    expect(isRelayOpeningSensor(undefined, 'dev_relay')).toBe(false);
  });

  it('returns false without a device', () => {
    Registry.initialize(relayHass(), {});
    expect(isRelayOpeningSensor('opening', null)).toBe(false);
    expect(isRelayOpeningSensor('opening', undefined)).toBe(false);
  });

  it('accepts a custom sibling lookup (editor path, no Registry involved)', () => {
    // Registry deliberately NOT initialized — the lookup must be the only source.
    function lookup(deviceId: string): string[] {
      return deviceId === 'dev_relay' ? ['switch.relay', 'binary_sensor.relay_input'] : [];
    }
    expect(isRelayOpeningSensor('opening', 'dev_relay', lookup)).toBe(true);
    expect(isRelayOpeningSensor('opening', 'dev_contact', lookup)).toBe(false);
  });
});
