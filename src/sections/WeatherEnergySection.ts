// ====================================================================
// Weather & Energy Section Builders
// ====================================================================
// Independent section builders for weather forecast and energy
// distribution. Each returns a single section or null.
// ====================================================================

import type { LovelaceCardConfig, LovelaceSectionConfig } from '../types/lovelace';
import type { WeatherPresentation, WeatherSensorConfig } from '../types/strategy';
import { localize } from '../utils/localize';

// Entity ids follow `domain.object_id` where each part is lowercase
// letters/digits/underscores. Anything else is a malformed config value
// that we silently drop to avoid breaking markdown templates downstream.
const ENTITY_ID_RE = /^[a-z_]+\.[a-z0-9_]+$/;

// MDI / similar icon ids: `set:slug` with lowercase letters/digits/hyphens.
// Anything outside this set could break out of the HTML attribute below.
const ICON_RE = /^[a-z]+:[a-z0-9-]+$/;

/**
 * HTML-escape a string so it can be safely embedded in markdown content.
 * Markdown card with `text_only: true` strips card chrome but the renderer
 * still interprets inline HTML, so user-controlled values must be escaped.
 */
function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return c;
    }
  });
}

/**
 * Build an inline markdown row of icon+value pairs from a weather_sensors
 * config array. Returns null if no sensors are configured or if every
 * entry is invalid.
 *
 * Each entry renders as `<ha-icon icon="..."></ha-icon> <value> <unit>`,
 * separated by non-breaking spaces. Uses text_only so the markdown blends
 * into the section without extra card chrome.
 *
 * Defensive normalization on every field:
 *   - `entity`: required and must match ENTITY_ID_RE; entries with bad
 *     ids are dropped (they would otherwise let a poisoned config inject
 *     into the Jinja template).
 *   - `icon`: must match ICON_RE; falls back to `mdi:gauge` otherwise.
 *     Prevents attribute break-out inside `<ha-icon icon="...">`.
 *   - `unit`: free text, HTML-escaped before concatenation.
 *   - `round`: must be a finite non-negative integer; ignored otherwise.
 *
 * The strategy generates Lovelace YAML — the config is trusted in the
 * single-user case, but we still validate so that copy-pasted community
 * templates can't smuggle in HTML or template injection.
 */
function buildWeatherSensorRow(sensors: WeatherSensorConfig[]): LovelaceCardConfig | null {
  if (sensors.length === 0) return null;

  const parts: string[] = [];
  for (const s of sensors) {
    if (typeof s.entity !== 'string' || !ENTITY_ID_RE.test(s.entity)) continue;

    const icon = typeof s.icon === 'string' && ICON_RE.test(s.icon) ? s.icon : 'mdi:gauge';
    const round =
      typeof s.round === 'number' && Number.isInteger(s.round) && s.round >= 0
        ? s.round
        : undefined;

    const valueExpr =
      round !== undefined
        ? `{{ states("${s.entity}") | float(0) | round(${round}) }}`
        : `{{ states("${s.entity}") }}`;

    const unit = typeof s.unit === 'string' && s.unit.length > 0 ? ` ${escapeHtml(s.unit)}` : '';

    parts.push(`<ha-icon icon="${icon}"></ha-icon> ${valueExpr}${unit}`);
  }

  if (parts.length === 0) return null;

  return {
    type: 'markdown',
    text_only: true,
    content: parts.join(' &nbsp;&nbsp;&nbsp; '),
  };
}

/**
 * Map a WeatherPresentation enum value to the corresponding built-in card.
 * Returns null for `none` — caller emits no built-in card and the section
 * relies entirely on appended custom_cards.
 */
function buildPresentationCard(
  weatherEntity: string,
  presentation: WeatherPresentation
): LovelaceCardConfig | null {
  switch (presentation) {
    case 'forecast_daily':
      return { type: 'weather-forecast', entity: weatherEntity, forecast_type: 'daily' };
    case 'forecast_hourly':
      return { type: 'weather-forecast', entity: weatherEntity, forecast_type: 'hourly' };
    case 'forecast_twice_daily':
      return { type: 'weather-forecast', entity: weatherEntity, forecast_type: 'twice_daily' };
    case 'tile':
      return { type: 'tile', entity: weatherEntity };
    case 'none':
    default:
      return null;
  }
}

/**
 * Creates the weather section.
 * Returns null if weather is disabled or no entity available.
 *
 * Card rendered in the section is chosen via `presentation`:
 *   - `forecast_daily` (default) — built-in weather-forecast (daily)
 *   - `forecast_hourly`          — built-in weather-forecast (hourly)
 *   - `forecast_twice_daily`     — built-in weather-forecast (twice-daily)
 *   - `tile`                     — HA core tile card
 *   - `none`                     — no built-in card; section keeps heading
 *                                  and any custom_cards targeted at `weather`
 *                                  appended by the caller.
 *
 * Legacy `showForecastCard=false` is honoured when `presentation` is left
 * undefined — it maps to `none`. Any explicit presentation overrides.
 */
export function createWeatherSection(
  weatherEntity: string | null,
  showWeather: boolean,
  showForecastCard: boolean = true,
  weatherSensors: WeatherSensorConfig[] = [],
  presentation?: WeatherPresentation
): LovelaceSectionConfig | null {
  if (!weatherEntity || !showWeather) return null;

  const resolvedPresentation: WeatherPresentation =
    presentation ?? (showForecastCard ? 'forecast_daily' : 'none');

  const cards: LovelaceCardConfig[] = [
    {
      type: 'heading',
      heading: localize('sections.weather'),
      heading_style: 'title',
      icon: 'mdi:weather-partly-cloudy',
    },
  ];

  const sensorRow = buildWeatherSensorRow(weatherSensors);
  if (sensorRow) cards.push(sensorRow);

  const card = buildPresentationCard(weatherEntity, resolvedPresentation);
  if (card) cards.push(card);

  return { type: 'grid', cards };
}

/**
 * Creates the energy distribution section.
 * Returns null if energy is disabled.
 *
 * When `showDistributionCard` is false, the built-in energy-distribution card
 * is omitted but the section (with heading) is still returned so custom_cards
 * targeted at `energy` can still be appended.
 */
export function createEnergySection(
  showEnergy: boolean,
  linkDashboard: boolean = true,
  showDistributionCard: boolean = true
): LovelaceSectionConfig | null {
  if (!showEnergy) return null;

  const cards: LovelaceCardConfig[] = [
    {
      type: 'heading',
      heading: localize('sections.energy'),
      heading_style: 'title',
      icon: 'mdi:lightning-bolt',
    },
  ];

  if (showDistributionCard) {
    cards.push({
      type: 'energy-distribution',
      link_dashboard: linkDashboard,
    });
  }

  return { type: 'grid', cards };
}
