// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR PANEL: WEATHER SENSORS
// ====================================================================
// Per-row structured editor for the `weather_sensors` config array.
// Each row binds to a WeatherSensorConfig and exposes inline inputs for
// icon / unit / round. Adding a row uses the same entity-search picker
// pattern as favorites; removal is a single-click button.
//
// The picker filters to numeric-ish sensors by default but does not hard-
// restrict — any entity domain is accepted (the markdown row in the
// section renderer just calls `states(...)` against the id).
//
// Extracted verbatim from StrategyEditor.ts (module split); dynamic
// object lookups converted to Reflect.get / explicit field branches per
// the CLAUDE.md Codacy pitfalls.
// ====================================================================

/* eslint-disable xss/no-mixed-html, @typescript-eslint/no-confusing-void-expression --
   False positive: lit-html's `html` tag escapes every interpolation by
   construction. Codacy's legacy ESLint 8 engine misreads lit render
   functions, DOM Element locals and input event payloads as raw HTML. The
   void-expression rule fights the codebase's established concise event-
   handler arrows (`(checked) => host._toggleChanged(...)`). */
import { html, nothing, type TemplateResult } from 'lit';
import type { Simon42StrategyConfig, WeatherSensorConfig } from '../../types/strategy';
import { localize } from '../../utils/localize';
import { getAllEntitiesForSelect, getFilteredEntities, stateFor } from '../entity-options';
import type { StrategyEditorHost } from '../editor-host';

export function renderWeatherSensorsSection(host: StrategyEditorHost): TemplateResult {
  const sensors = host._config.weather_sensors || [];
  const allEntities = getAllEntitiesForSelect(host._hass);
  const entityMap = new Map(allEntities.map((e) => [e.entity_id, e.name]));
  const filteredEntities = getFilteredEntities(host._hass, host._weatherSensorSearch);

  return html`
    <div class="section">
      <div class="section-title">${localize('editor.section_weather_sensors')}</div>
      <div class="description" style="margin-left: 0; margin-bottom: 12px;">
        ${localize('editor.weather_sensors_desc')}
      </div>

      <div id="weather-sensors-list" style="margin-bottom: 12px;">
        ${sensors.length === 0
          ? html`<div class="empty-state">${localize('editor.no_weather_sensors')}</div>`
          : sensors.map((sensor, index) => {
              const name = entityMap.get(sensor.entity) || sensor.entity;
              return html`
                <div class="custom-item" data-sensor-index=${index}>
                  <div class="custom-item-header">
                    <strong>
                      ${name}
                      <span class="item-entity-id" style="font-weight: normal; margin-left: 8px;">
                        ${sensor.entity}
                      </span>
                    </strong>
                    <button class="btn-remove" @click=${() => removeWeatherSensor(host, index)}>&#x2715;</button>
                  </div>
                  <div class="custom-item-fields">
                    <div class="custom-item-row">
                      <input type="text" style="flex: 2;"
                        placeholder=${localize('editor.weather_sensors_icon')}
                        .value=${sensor.icon || ''}
                        @change=${(e: Event) => updateWeatherSensor(host, index, 'icon', (e.target as HTMLInputElement).value)} />
                      <input type="text" style="flex: 1;"
                        placeholder=${localize('editor.weather_sensors_unit')}
                        .value=${sensor.unit || ''}
                        @change=${(e: Event) => updateWeatherSensor(host, index, 'unit', (e.target as HTMLInputElement).value)} />
                      <input type="number" style="flex: 1;" min="0" max="6" step="1"
                        placeholder=${localize('editor.weather_sensors_round')}
                        .value=${sensor.round !== undefined ? String(sensor.round) : ''}
                        @change=${(e: Event) => updateWeatherSensor(host, index, 'round', (e.target as HTMLInputElement).value)} />
                    </div>
                  </div>
                </div>
              `;
            })}
      </div>

      <div class="entity-search-picker">
        <input type="text" class="entity-search-input"
          placeholder=${localize('editor.weather_sensors_add')}
          .value=${host._weatherSensorSearch}
          @input=${(e: Event) => { host._weatherSensorSearch = (e.target as HTMLInputElement).value; host.requestUpdate(); }}
          @blur=${() => { setTimeout(() => { host._weatherSensorSearch = ''; host.requestUpdate(); }, 200); }}
        />
        ${host._weatherSensorSearch.length >= 2 ? html`
          <div class="entity-search-results">
            ${filteredEntities.length > 0
              ? filteredEntities.map((entity) => html`
                <div class="entity-search-result" @mousedown=${(e: Event) => { e.preventDefault(); addWeatherSensor(host, entity.entity_id); host._weatherSensorSearch = ''; host.requestUpdate(); }}>
                  <span class="entity-search-name">${entity.name}</span>
                  <span class="entity-search-id">${entity.entity_id}</span>
                </div>
              `)
              : html`<div class="entity-search-no-results">${localize('editor.no_results')}</div>`
            }
          </div>
        ` : nothing}
      </div>
    </div>
  `;
}

// Per device-class defaults used when adding a sensor via the picker.
// Each entry covers:
//   icon    — MDI fallback when the entity has no explicit attributes.icon
//   round   — display precision matching how that quantity is normally read
//             (humidity in whole percent, temperature in 0.1 °C steps, etc.)
// Users can still override any field afterwards in the editor row.
const DEVICE_CLASS_DEFAULTS: Record<string, { icon: string; round?: number }> = {
  temperature: { icon: 'mdi:thermometer', round: 1 },
  apparent_temperature: { icon: 'mdi:thermometer-lines', round: 1 },
  humidity: { icon: 'mdi:water-percent', round: 0 },
  moisture: { icon: 'mdi:water-percent', round: 0 },
  pressure: { icon: 'mdi:gauge', round: 0 },
  atmospheric_pressure: { icon: 'mdi:gauge', round: 0 },
  wind_speed: { icon: 'mdi:weather-windy', round: 1 },
  wind_direction: { icon: 'mdi:compass', round: 0 },
  illuminance: { icon: 'mdi:brightness-5', round: 0 },
  irradiance: { icon: 'mdi:weather-sunny', round: 0 },
  precipitation: { icon: 'mdi:weather-rainy', round: 1 },
  precipitation_intensity: { icon: 'mdi:weather-pouring', round: 1 },
  voc: { icon: 'mdi:cloud-outline', round: 0 },
  pm25: { icon: 'mdi:weather-fog', round: 0 },
  pm10: { icon: 'mdi:weather-fog', round: 0 },
  co2: { icon: 'mdi:molecule-co2', round: 0 },
  co: { icon: 'mdi:molecule-co', round: 1 },
  aqi: { icon: 'mdi:air-filter', round: 0 },
  ozone: { icon: 'mdi:cloud-outline', round: 0 },
  sulphur_dioxide: { icon: 'mdi:cloud-outline', round: 0 },
  nitrogen_dioxide: { icon: 'mdi:cloud-outline', round: 0 },
  nitrogen_monoxide: { icon: 'mdi:cloud-outline', round: 0 },
  ammonia: { icon: 'mdi:cloud-outline', round: 0 },
  distance: { icon: 'mdi:ruler', round: 1 },
  speed: { icon: 'mdi:speedometer', round: 1 },
  uv_index: { icon: 'mdi:weather-sunny-alert', round: 1 },
};

// Validation regex mirrors the runtime guard in WeatherEnergySection.
// Only icons that pass this go into the saved config — keeps malformed
// pre-fills from being silently accepted.
const ICON_RE = /^[a-z]+:[a-z0-9-]+$/;

/**
 * Derive sensible defaults for icon, unit, round from the entity's HA
 * registry / state attributes. Used as pre-fill when a sensor is added
 * via the picker; the user can still edit any field afterwards.
 *
 * Resolution order:
 *   icon  — entity.attributes.icon → device_class lookup → omitted
 *   unit  — entity.attributes.unit_of_measurement → omitted
 *   round — device_class lookup → omitted (no inference from state)
 *
 * Inferring round from the current state value is unreliable (`37` and
 * `37.0` both happen for the same humidity sensor), so the table above
 * is the single source of truth.
 */
function inferWeatherSensorDefaults(
  host: StrategyEditorHost,
  entityId: string,
): { icon?: string; unit?: string; round?: number } {
  const state = host._hass ? stateFor(host._hass, entityId) : undefined;
  const attrs = (state?.attributes || {}) as Record<string, unknown>;
  const out: { icon?: string; unit?: string; round?: number } = {};

  const deviceClass = typeof attrs.device_class === 'string' ? attrs.device_class : undefined;
  const classDefaults = deviceClass
    ? (Reflect.get(DEVICE_CLASS_DEFAULTS, deviceClass) as { icon: string; round?: number } | undefined)
    : undefined;

  // Icon: prefer explicit entity icon → device_class map → omit
  const explicitIcon = typeof attrs.icon === 'string' ? attrs.icon : undefined;
  const icon = explicitIcon || classDefaults?.icon;
  if (icon && ICON_RE.test(icon)) {
    out.icon = icon;
  }

  // Unit: straight passthrough of unit_of_measurement if present
  const unit = typeof attrs.unit_of_measurement === 'string' ? attrs.unit_of_measurement : undefined;
  if (unit && unit.length > 0) out.unit = unit;

  // Decimals: device_class table only — no state-precision inference
  if (classDefaults && classDefaults.round !== undefined) {
    out.round = classDefaults.round;
  }

  return out;
}

function addWeatherSensor(host: StrategyEditorHost, entityId: string): void {
  if (!host._hass) return;
  const current = host._config.weather_sensors || [];
  if (current.some((s) => s.entity === entityId)) return;

  const defaults = inferWeatherSensorDefaults(host, entityId);
  const newEntry: WeatherSensorConfig = { entity: entityId, ...defaults };

  const newConfig: Simon42StrategyConfig = {
    ...host._config,
    weather_sensors: [...current, newEntry],
  };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function removeWeatherSensor(host: StrategyEditorHost, index: number): void {
  const current = host._config.weather_sensors || [];
  if (index < 0 || index >= current.length) return;

  const next = [...current.slice(0, index), ...current.slice(index + 1)];
  const newConfig: Simon42StrategyConfig = { ...host._config };
  if (next.length > 0) {
    newConfig.weather_sensors = next;
  } else {
    delete newConfig.weather_sensors;
  }
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function updateWeatherSensor(
  host: StrategyEditorHost,
  index: number,
  field: keyof WeatherSensorConfig,
  rawValue: string,
): void {
  const current = host._config.weather_sensors || [];
  if (index < 0 || index >= current.length) return;

  const target = { ...current.at(index) } as WeatherSensorConfig;
  const trimmed = rawValue.trim();

  if (field === 'round') {
    if (trimmed === '') {
      delete target.round;
    } else {
      const n = Number.parseInt(trimmed, 10);
      if (Number.isFinite(n) && n >= 0) target.round = n;
    }
  } else if (field === 'icon') {
    if (trimmed === '') delete target.icon;
    else target.icon = trimmed;
  } else if (field === 'unit') {
    if (trimmed === '') delete target.unit;
    else target.unit = trimmed;
  } else {
    // remaining field is 'entity' — read-only via this method; ignore
    return;
  }

  const next = [...current];
  next.splice(index, 1, target);
  const newConfig: Simon42StrategyConfig = { ...host._config, weather_sensors: next };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}
