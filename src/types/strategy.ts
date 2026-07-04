// ====================================================================
// Simon42 Dashboard Strategy Types
// ====================================================================
// All configuration and data types specific to the simon42 strategy.
// These types cover the YAML config schema and internal data structures
// used throughout the strategy codebase.
// ====================================================================

// -- Section Ordering -------------------------------------------------
// SectionKey and DEFAULT_SECTIONS_ORDER are derived from the section
// registry (single source of truth) and re-exported here so existing
// imports keep working. See src/sections/section-registry.ts.

import type { SectionKey } from '../sections/section-registry';

export type { SectionKey, SectionMeta } from '../sections/section-registry';
export { DEFAULT_SECTIONS_ORDER } from '../sections/section-registry';

/** Keys for section headings that can be hidden via hidden_section_headings */
export type HeadingKey =
  | 'overview'
  | 'summaries'
  | 'favorites'
  | 'custom_cards'
  | 'areas'
  | 'areas_other'
  | 'weather'
  | 'energy';

export const ALL_HEADING_KEYS: HeadingKey[] = [
  'overview',
  'summaries',
  'favorites',
  'custom_cards',
  'areas',
  'areas_other',
  'weather',
  'energy',
];

// -- Main Strategy Config ---------------------------------------------

export interface Simon42StrategyConfig {
  // Global toggles
  show_weather?: boolean; // default: true
  show_weather_forecast_card?: boolean; // (legacy) default: true — set false
  // to keep the `weather` section + heading but omit the built-in card.
  // Equivalent to `weather_presentation: 'none'`; superseded by it but still
  // honoured for backwards-compatibility when no explicit weather_presentation
  // is set.
  weather_presentation?: WeatherPresentation; // default: 'forecast_daily'.
  // Picks which built-in weather card the section renders. Use 'none' to omit
  // the built-in card and supply your own via custom_cards target=weather
  // (e.g. clock-weather-card, mini-weather, custom radar widget).
  weather_sensors?: WeatherSensorConfig[]; // optional inline icon+value row
  // rendered at the top of the weather section. Useful for displaying local
  // outdoor sensors (temperature, humidity, wind, pressure...) alongside or
  // in place of the built-in forecast card.
  show_energy?: boolean; // default: true
  show_energy_distribution_card?: boolean; // default: true — same behaviour for
  // the energy section: false keeps the section so custom_cards can render
  // here without the built-in energy-distribution card alongside
  show_search_card?: boolean; // default: false
  /**
   * Which kind of search affordance to render when show_search_card is true.
   * - 'custom' (default): the existing custom:search-card from HACS — true
   *   inline search input, but needs custom:search-card + card-tools installed.
   * - 'tip': a small HA-native markdown card hinting the global search shortcut
   *   (Cmd/Ctrl+E). No HACS dependency. Less powerful but works out of the box.
   */
  search_card_variant?: 'custom' | 'tip';
  show_summary_views?: boolean; // default: false
  show_room_views?: boolean; // default: false
  group_by_floors?: boolean; // default: false
  show_covers_summary?: boolean; // default: true
  show_partially_open_covers?: boolean; // default: false
  group_covers_by_floors?: boolean; // default: false
  show_clock_card?: boolean; // default: true
  show_light_summary?: boolean; // default: true
  group_lights_by_floors?: boolean; // default: false
  nested_light_groups?: boolean; // default: false
  show_security_summary?: boolean; // default: true
  show_battery_summary?: boolean; // default: true
  show_climate_summary?: boolean; // default: false
  hide_mobile_app_batteries?: boolean; // default: false
  hide_battery_notes_entities?: boolean; // default: false
  battery_critical_threshold?: number; // default: 20
  battery_low_threshold?: number; // default: 50
  show_area_in_battery_view?: boolean; // default: false
  unavailable_batteries_bucket?: 'critical' | 'good'; // default: 'good' (follow-up to #248)
  show_locks_in_rooms?: boolean; // default: false
  show_automations_in_rooms?: boolean; // default: false
  show_scripts_in_rooms?: boolean; // default: false
  show_cameras_in_rooms?: boolean; // default: true
  show_window_contacts_in_rooms?: boolean; // default: true (opt-out — set false to hide window contact badges)
  show_door_contacts_in_rooms?: boolean; // default: true (opt-out — set false to hide door contact badges)
  show_switches_on_areas?: boolean; // default: false
  show_alerts_on_areas?: boolean; // default: false
  show_window_alerts_on_areas?: boolean; // default: false
  energy_link_dashboard?: boolean; // default: true
  /**
   * Per-section conditional visibility. Keyed by SectionKey. When set, the
   * section is only rendered when hass.states[entity].state === state.
   * Example: { agenda: { entity: 'calendar.workday_sensor', state: 'on' } }
   * → agenda section only on workdays.
   */
  section_visibility?: Record<string, { entity: string; state: string }>;
  hide_unavailable_in_rooms?: boolean; // default: true (skip unavailable in room views)
  /**
   * Per-room conditional visibility. Keyed by area_id. When set, the room
   * view (and its corresponding nav tab) is only rendered when
   * hass.states[entity].state === state. Useful for guest-mode rooms,
   * seasonal rooms (garden in winter), etc.
   *
   * The overview's area cards section is NOT affected — only the per-area
   * room views and nav tabs.
   */
  room_visibility?: Record<string, { entity: string; state: string }>;
  show_person_badges?: boolean; // default: true — set false to suppress the
  // auto-generated person chip badges (useful when supplying replacement
  // badges via custom_badges)
  person_badge_layout?: 'minimal' | 'with_state' | 'with_state_and_time'; // default: 'with_state'
  power_badge_entity?: string; // default: unset (no badge). Pick a sensor (e.g. main grid power in W).
  show_unavailable_alert_badge?: boolean; // default: false (auto-hides at zero)
  show_now_playing_badge?: boolean; // default: false (auto-hides when nothing's playing)
  show_sun_badge?: boolean; // default: false (requires HA sun integration / sun.sun entity)
  show_updates_badge?: boolean; // default: false (auto-hides at zero pending)
  show_plants_section?: boolean; // default: false (auto-hides anyway if no plants)
  show_agenda_section?: boolean; // default: false (auto-hides when no calendars)
  agenda_calendar_entities?: string[]; // default: [] → all visible calendars
  show_todos_section?: boolean; // default: false (auto-hides when no todos)
  todos_entities?: string[]; // default: [] → all visible todo.* entities
  show_persons_section?: boolean; // default: false (auto-hides when no persons)
  show_vacuums_section?: boolean; // default: false (auto-hides without vacuum/mower)
  show_maintenance_section?: boolean; // default: false (auto-hides when nothing pending)

  // Layout
  sections_order?: SectionKey[]; // default: DEFAULT_SECTIONS_ORDER
  summaries_columns?: 2 | 4; // default: 2
  hidden_section_headings?: HeadingKey[]; // default: []

  // Favorites display
  favorites_show_state?: boolean; // default: false
  favorites_hide_last_changed?: boolean; // default: false
  room_pins_show_state?: boolean; // default: false
  room_pins_hide_last_changed?: boolean; // default: false
  room_pins_first?: boolean; // default: false (pins render as last section in the room)

  // Special entities
  alarm_entity?: string;
  weather_entity?: string; // explicit weather entity for the weather section;
  // defaults to the first visible weather.* entity when omitted. Falls back
  // to auto-discovery if the configured entity is unavailable at render time.
  favorite_entities?: string[];
  room_pin_entities?: string[];
  security_extra_entities?: string[];
  light_favorite_entities?: string[]; // light.* glance row on overview (#176)

  // Area management
  use_default_area_sort?: boolean; // default: false
  areas_display?: AreasDisplay;
  areas_options?: Record<string, AreaOptions>;

  // Custom views
  custom_views?: CustomView[];

  // Custom cards (shown as own section on overview)
  custom_cards?: CustomCard[];
  custom_cards_heading?: string;
  custom_cards_icon?: string;

  // Custom badges (shown in header next to person chips)
  custom_badges?: CustomBadge[];
}

// -- Area Management --------------------------------------------------

export interface AreasDisplay {
  hidden?: string[];
  order?: string[];
}

export interface AreaOptions {
  groups_options?: Record<string, GroupOptions>;
}

export interface GroupOptions {
  hidden?: string[];
  order?: string[];
  additional?: string[]; // Extra entities to include (used by badges group)
  names_visible?: string[]; // Override show_name to true (used by badges group)
  names_hidden?: string[]; // Override show_name to false (used by badges group)
  [key: string]: unknown;
}

// -- Weather Presentation ---------------------------------------------

/**
 * Selects the built-in weather card variant rendered in the weather
 * section. Setting 'none' suppresses the built-in card entirely so a
 * custom_cards entry with target_section='weather' can stand alone.
 *
 * - `forecast_daily`       — `weather-forecast` with `forecast_type: daily`
 * - `forecast_hourly`      — `weather-forecast` with `forecast_type: hourly`
 * - `forecast_twice_daily` — `weather-forecast` with `forecast_type: twice_daily`
 * - `tile`                 — HA core `tile` card bound to the weather entity
 * - `none`                 — omit built-in card; section keeps heading + slot
 */
export type WeatherPresentation =
  | 'forecast_daily'
  | 'forecast_hourly'
  | 'forecast_twice_daily'
  | 'tile'
  | 'none';

// -- Weather Sensors --------------------------------------------------

/**
 * Inline sensor display in the weather section header. Rendered as an
 * icon + value (+ optional unit) using a markdown card with text_only.
 * The value is read via a template, so the entity's live state is used.
 */
export interface WeatherSensorConfig {
  /** Entity id, e.g. `sensor.outdoor_temperature`. Required. */
  entity: string;
  /** MDI icon to show before the value. Default: `mdi:gauge`. */
  icon?: string;
  /** Unit string appended to the value, e.g. `"°C"` or `"km/h"`. */
  unit?: string;
  /** Round the numeric value to N decimals. Omit to show raw state. */
  round?: number;
}

// -- Custom Views -----------------------------------------------------

export interface CustomView {
  /** View title shown in the navigation */
  title?: string;
  /** URL path for the view */
  path?: string;
  /** MDI icon for the view tab */
  icon?: string;
  /** Raw YAML string entered by the user in the editor */
  yaml?: string;
  /** Parsed Lovelace view config (generated from yaml) */
  parsed_config?: Record<string, any> | null;
  /** YAML parse error message, if any */
  _yaml_error?: string;
}

// -- Custom Badges ----------------------------------------------------

export interface CustomBadge {
  /** Raw YAML string entered by the user in the editor */
  yaml?: string;
  /** Parsed Lovelace badge config (generated from yaml) */
  parsed_config?: Record<string, any> | null;
  /** YAML parse error message, if any */
  _yaml_error?: string;
}

// -- Custom Cards -----------------------------------------------------

export interface CustomCard {
  /** Optional title shown as heading above the card */
  title?: string;
  /** Target section where this card appears (default: 'custom_cards') */
  target_section?: SectionKey;
  /** Raw YAML string entered by the user in the editor */
  yaml?: string;
  /** Parsed Lovelace card config (generated from yaml) */
  parsed_config?: Record<string, any> | null;
  /** YAML parse error message, if any */
  _yaml_error?: string;
}

// -- Room Entities (entity collections per area) ----------------------

export interface RoomEntities {
  lights: string[];
  covers: string[];
  covers_curtain: string[];
  covers_window: string[];
  scenes: string[];
  climate: string[];
  media_player: string[];
  vacuum: string[];
  fan: string[];
  /** humidifier domain — covers both humidifier and dehumidifier devices */
  humidifier: string[];
  /** valve domain (HA 2024+) — irrigation, gas, water shutoff */
  valve: string[];
  /** water_heater domain — boilers, heat pumps */
  water_heater: string[];
  switches: string[];
  locks: string[];
  automations: string[];
  scripts: string[];
  cameras: string[];
  [key: string]: string[];
}

// -- Sensor Entities (sensor types discovered per area) ---------------

export interface SensorEntities {
  temperature: string[];
  humidity: string[];
  pm1: string[];
  pm25: string[];
  pm10: string[];
  co2: string[];
  voc: string[];
  motion: string[];
  occupancy: string[];
  illuminance: string[];
  absolute_humidity: string[];
  soil_moisture: string[];
  battery: string[];
  window: string[];
  door: string[];
  smoke: string[];
  gas: string[];
  heat: string[];
}

// -- Person Data (used in overview badges) ----------------------------

export interface PersonData {
  entity_id: string;
  name: string;
  state: string;
  isHome: boolean;
}

// -- Summary Types (used by summary cards) ----------------------------

export type SummaryType = 'lights' | 'covers' | 'security' | 'batteries' | 'climate';

// -- Resolved Area (internal, enriched area for rendering) ------------

export interface ResolvedArea {
  area_id: string;
  name: string;
  icon: string | null;
  floor_id: string | null;
  floor_name: string | null;
  floor_level: number | null;
  entities: RoomEntities;
  sensors: SensorEntities;
  temperature_entity_id: string | null;
  humidity_entity_id: string | null;
}

// -- Floor Group (areas grouped by floor) -----------------------------

export interface FloorGroup {
  floor_id: string | null;
  floor_name: string;
  floor_level: number | null;
  floor_icon: string | null;
  areas: ResolvedArea[];
}

// -- Strategy Generate Result -----------------------------------------

export interface StrategyDashboardConfig {
  title?: string;
  views: StrategyViewConfig[];
}

export interface StrategyViewConfig {
  title?: string;
  path?: string;
  icon?: string;
  type?: string;
  subview?: boolean;
  max_columns?: number;
  dense_section_placement?: boolean;
  badges?: Record<string, any>[];
  header?: Record<string, any>;
  sections?: Record<string, any>[];
  cards?: Record<string, any>[];
  strategy?: { type: string; [key: string]: any };
}
