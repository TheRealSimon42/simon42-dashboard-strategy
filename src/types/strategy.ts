// ====================================================================
// Simon42 Dashboard Strategy Types
// ====================================================================
// All configuration and data types specific to the simon42 strategy.
// These types cover the YAML config schema and internal data structures
// used throughout the strategy codebase.
// ====================================================================

// -- Section Ordering -------------------------------------------------

export type SectionKey = 'overview' | 'custom_cards' | 'areas' | 'weather' | 'energy';

export const DEFAULT_SECTIONS_ORDER: SectionKey[] = [
  'overview',
  'custom_cards',
  'areas',
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
  show_window_contacts_in_rooms?: boolean; // default: true (opt-out — set false to hide window contact badges)
  show_door_contacts_in_rooms?: boolean; // default: true (opt-out — set false to hide door contact badges)
  show_switches_on_areas?: boolean; // default: false
  show_alerts_on_areas?: boolean; // default: false
  energy_link_dashboard?: boolean; // default: true

  // Layout
  sections_order?: SectionKey[]; // default: DEFAULT_SECTIONS_ORDER
  summaries_columns?: 2 | 4; // default: 2

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
  pm25: string[];
  pm10: string[];
  co2: string[];
  voc: string[];
  motion: string[];
  occupancy: string[];
  illuminance: string[];
  absolute_humidity: string[];
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
