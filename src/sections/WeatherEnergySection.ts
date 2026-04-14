// ====================================================================
// Weather & Energy Section Builders
// ====================================================================
// Independent section builders for weather forecast and energy
// distribution. Each returns a single section or null.
// ====================================================================

import type { LovelaceSectionConfig } from '../types/lovelace';
import { localize } from '../utils/localize';

/**
 * Creates the weather forecast section.
 * Returns null if weather is disabled or no entity available.
 */
export function createWeatherSection(
  weatherEntity: string | null,
  showWeather: boolean
): LovelaceSectionConfig | null {
  if (!weatherEntity || !showWeather) return null;

  return {
    type: 'grid',
    cards: [
      {
        type: 'heading',
        heading: localize('sections.weather'),
        heading_style: 'title',
        icon: 'mdi:weather-partly-cloudy',
      },
      {
        type: 'weather-forecast',
        entity: weatherEntity,
        forecast_type: 'daily',
      },
    ],
  };
}

/**
 * Creates the energy distribution section.
 * Returns null if energy is disabled.
 */
export function createEnergySection(
  showEnergy: boolean,
  linkDashboard: boolean = true
): LovelaceSectionConfig | null {
  if (!showEnergy) return null;

  return {
    type: 'grid',
    cards: [
      {
        type: 'heading',
        heading: localize('sections.energy'),
        heading_style: 'title',
        icon: 'mdi:lightning-bolt',
      },
      {
        type: 'energy-distribution',
        link_dashboard: linkDashboard,
      },
    ],
  };
}
