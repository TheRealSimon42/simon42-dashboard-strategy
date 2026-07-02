// ============================================================================
// Tests — WeatherEnergySection
// ============================================================================
// These tests pin down the public contract of `createWeatherSection` and
// `createEnergySection`: when a section is returned, what its shape is, and
// when null is returned. They run as pure functions — no DOM, no Lit, no HA
// runtime. The goal is a fast smoke harness future contributors can extend.
// ============================================================================

import { describe, it, expect } from 'vitest';

import { createEnergySection, createWeatherSection } from '../../src/sections/WeatherEnergySection';

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
