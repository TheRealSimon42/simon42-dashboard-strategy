// ============================================================================
// Tests — WeatherEnergySection
// ============================================================================
// These tests pin down the public contract of `createWeatherSection` and
// `createEnergySection`: when a section is returned, what its shape is, and
// when null is returned. They run as pure functions — no DOM, no Lit, no HA
// runtime. The goal is a fast smoke harness future contributors can extend.
// ============================================================================

import { describe, it, expect } from 'vitest';

import { createEnergySection, createWeatherSection, buildPollenCard } from '../../src/sections/WeatherEnergySection';
import { makeHass } from '../fixtures/hass';

describe('createWeatherSection', () => {
  it('returns null when no weather entity is available', () => {
    expect(createWeatherSection(null, true)).toBeNull();
  });

  it('returns null when show_weather is false', () => {
    expect(createWeatherSection('weather.home', false)).toBeNull();
  });

  it('returns a grid section with heading + forecast card for happy path', () => {
    const section = createWeatherSection('weather.home', true);
    expect(section).not.toBeNull();
    expect(section).toMatchObject({
      type: 'grid',
      cards: [
        expect.objectContaining({ type: 'heading' }),
        expect.objectContaining({ type: 'weather-forecast', entity: 'weather.home' }),
      ],
    });
  });

  it('uses the daily forecast variant', () => {
    const section = createWeatherSection('weather.home', true);
    const forecast = section?.cards?.find((c) => c.type === 'weather-forecast');
    expect(forecast).toMatchObject({ forecast_type: 'daily' });
  });

  it('renders weather sensors without hide_when exactly as before', () => {
    const section = createWeatherSection('weather.home', true, true, [
      { entity: 'sensor.outdoor_temperature', icon: 'mdi:thermometer', unit: '°C', round: 1 },
      { entity: 'sensor.outdoor_humidity' },
    ]);
    const sensorCard = section?.cards?.find((c) => c.type === 'markdown');
    // Whole card config pinned: no extra keys (e.g. show_empty) may appear here
    expect(sensorCard).toEqual({
      type: 'markdown',
      text_only: true,
      content:
        '<ha-icon icon="mdi:thermometer"></ha-icon> {{ states("sensor.outdoor_temperature") | float(0) | round(1) }} °C' +
        ' &nbsp;&nbsp;&nbsp; ' +
        '<ha-icon icon="mdi:gauge"></ha-icon> {{ states("sensor.outdoor_humidity") }}',
    });
  });

  it('wraps hide_when: zero_or_off sensors in a live condition without dangling separators', () => {
    const section = createWeatherSection('weather.home', true, true, [
      { entity: 'sensor.outdoor_temperature', icon: 'mdi:thermometer', unit: '°C', round: 1 },
      { entity: 'sensor.rain_rate', icon: 'mdi:weather-rainy', unit: 'mm/h', hide_when: 'zero_or_off' },
    ]);
    const sensorCard = section?.cards?.find((c) => c.type === 'markdown');
    // show_empty: false lets HA drop the card once every entry is hidden
    expect(sensorCard).toMatchObject({ type: 'markdown', text_only: true, show_empty: false });
    // Unconditional sensor: rendered as-is, only the separator becomes conditional.
    // Conditional sensor without round: raw state compared; the namespace flag
    // ensures no separator is emitted when the first visible entry is hidden.
    expect(sensorCard?.content).toBe(
      '{% set ns = namespace(first=true) %}' +
        '{% if not ns.first %} &nbsp;&nbsp;&nbsp; {% endif %}' +
        '<ha-icon icon="mdi:thermometer"></ha-icon> {{ states("sensor.outdoor_temperature") | float(0) | round(1) }} °C' +
        '{% set ns.first = false %}' +
        '{% set v = states("sensor.rain_rate") %}' +
        '{% if v | lower != "off" and not (is_number(v) and v | float(0) == 0) %}' +
        '{% if not ns.first %} &nbsp;&nbsp;&nbsp; {% endif %}' +
        '<ha-icon icon="mdi:weather-rainy"></ha-icon> {{ states("sensor.rain_rate") }} mm/h' +
        '{% set ns.first = false %}' +
        '{% endif %}'
    );
  });

  it('compares the rounded value when hide_when is combined with round', () => {
    const section = createWeatherSection('weather.home', true, true, [
      { entity: 'sensor.rain_rate', icon: 'mdi:weather-rainy', unit: 'mm/h', round: 1, hide_when: 'zero_or_off' },
    ]);
    const sensorCard = section?.cards?.find((c) => c.type === 'markdown');
    expect(sensorCard).toMatchObject({ show_empty: false });
    // 0.04 mm/h displays as "0.0" at round: 1 — the check must hide it too
    expect(sensorCard?.content).toBe(
      '{% set ns = namespace(first=true) %}' +
        '{% set v = states("sensor.rain_rate") %}' +
        '{% if v | lower != "off" and not (is_number(v) and v | float(0) | round(1) == 0) %}' +
        '{% if not ns.first %} &nbsp;&nbsp;&nbsp; {% endif %}' +
        '<ha-icon icon="mdi:weather-rainy"></ha-icon> {{ states("sensor.rain_rate") | float(0) | round(1) }} mm/h' +
        '{% set ns.first = false %}' +
        '{% endif %}'
    );
  });
});

describe('createEnergySection', () => {
  it('returns null when show_energy is false', () => {
    expect(createEnergySection(false)).toBeNull();
  });

  it('returns a grid section with heading + energy-distribution card', () => {
    const section = createEnergySection(true);
    expect(section).not.toBeNull();
    expect(section).toMatchObject({
      type: 'grid',
      cards: [
        expect.objectContaining({ type: 'heading' }),
        expect.objectContaining({ type: 'energy-distribution' }),
      ],
    });
  });

  it('respects link_dashboard parameter', () => {
    const linked = createEnergySection(true, true);
    const unlinked = createEnergySection(true, false);
    expect(linked?.cards?.find((c) => c.type === 'energy-distribution')).toMatchObject({
      link_dashboard: true,
    });
    expect(unlinked?.cards?.find((c) => c.type === 'energy-distribution')).toMatchObject({
      link_dashboard: false,
    });
  });
});

describe('buildPollenCard (DWD Pollenflug)', () => {
  function pollenEntity(id: string, name: string) {
    return {
      entity_id: id,
      platform: 'dwd_pollenflug',
      state: '1.5',
      attributes: {
        friendly_name: name,
        state_today_desc: 'mittlere Belastung',
        state_tomorrow_desc: 'geringe Belastung',
      },
    };
  }

  it('returns null without DWD Pollenflug entities', () => {
    const hass = makeHass({ entities: [{ entity_id: 'sensor.temperatur' }] });
    expect(buildPollenCard(hass)).toBeNull();
  });

  it('builds a markdown template from discovered danger-index sensors', () => {
    const hass = makeHass({
      entities: [
        pollenEntity('sensor.pollenflug_gefahrenindex_pollenflug_graeser_124', 'Pollenflug Gefahrenindex Pollenflug Gräser 124'),
        pollenEntity('sensor.pollenflug_gefahrenindex_pollenflug_birke_124', 'Pollenflug Gefahrenindex Pollenflug Birke 124'),
        // Not a danger-index sensor (no state_today_desc) — must be ignored
        { entity_id: 'sensor.pollenflug_region_124', platform: 'dwd_pollenflug', attributes: { friendly_name: 'Region' } },
      ],
    });
    const card = buildPollenCard(hass);
    expect(card?.type).toBe('markdown');
    expect(card?.content).toContain("('Gräser','sensor.pollenflug_gefahrenindex_pollenflug_graeser_124')");
    expect(card?.content).toContain("('Birke','sensor.pollenflug_gefahrenindex_pollenflug_birke_124')");
    expect(card?.content).not.toContain('sensor.pollenflug_region_124');
    expect(card?.content).toContain('state_today_desc');
  });

  it('dedupes allergens across multiple DWD regions (first wins)', () => {
    const hass = makeHass({
      entities: [
        pollenEntity('sensor.pollenflug_gefahrenindex_pollenflug_birke_124', 'Pollenflug Gefahrenindex Pollenflug Birke 124'),
        pollenEntity('sensor.pollenflug_gefahrenindex_pollenflug_birke_50', 'Pollenflug Gefahrenindex Pollenflug Birke 50'),
      ],
    });
    const card = buildPollenCard(hass);
    expect(card?.content).toContain('_124');
    expect(card?.content).not.toContain('_50');
  });

  it('appends the pollen card after the weather card', () => {
    const pollenCard = { type: 'markdown', content: 'pollen' };
    const section = createWeatherSection('weather.home', true, true, [], undefined, false, pollenCard);
    const types = section?.cards?.map((c) => c.type);
    expect(types).toEqual(['heading', 'weather-forecast', 'markdown']);
  });
});
