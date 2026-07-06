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

/**
 * A section key in user-facing config: either a built-in SectionKey or a
 * user-defined custom_sections[].key. The `string & {}` keeps the built-in
 * literals in IDE autocomplete while still accepting arbitrary keys.
 */
export type SectionOrderKey = SectionKey | (string & {});

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

// -- Stack Ordering (per-area room view) ------------------------------

export type StackKey =
  | 'ups'
  | 'energy'
  | 'cameras'
  | 'lights'
  | 'locks'
  | 'climate'
  | 'covers'
  | 'covers_curtain'
  | 'covers_window'
  | 'media'
  | 'scenes'
  | 'vacuums'
  | 'misc'
  | 'automations'
  | 'scripts'
  | 'room_pins';

export const DEFAULT_STACKS_ORDER: StackKey[] = [
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
  'misc',
  'automations',
  'scripts',
  'room_pins',
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
  show_pollen_card?: boolean; // default: false — DWD Pollenflug card below
  // the weather card (requires the HACS `dwd_pollenflug` integration;
  // sensors discovered by platform + state_today_desc attribute, editor
  // only offers the toggle when the integration is present)
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
  lights_sort_by?: 'last_changed' | 'name'; // default: 'last_changed' —
  // 'name' sorts lights alphabetically by friendly name (#168, from PR #250)
  show_security_summary?: boolean; // default: true
  show_battery_summary?: boolean; // default: true
  show_battery_view?: boolean; // default: false — keep the /batteries view
  // available even when show_battery_summary is off (#315: badge deep-links)
  show_climate_summary?: boolean; // default: false
  show_camera_view?: boolean; // default: false — opt-in CCTV view (/cameras):
  // one block per camera device with spotlight tile, Reolink PTZ pad,
  // recordings deep-link and optional LLM Vision event timelines
  show_camera_events?: boolean; // default: false — LLM Vision timelines on
  // the CCTV view. Deliberately opt-in even when LLM Vision is installed:
  // the llmvision-card re-fetches its events API on EVERY hass update
  // (no debounce) — three timelines can hammer HA on busy systems
  show_cameras_in_security?: boolean; // default: false — lean camera cards
  // in the security view (à la HA's security panel); the heading links to
  // the CCTV view when show_camera_view is enabled
  group_security_by_areas?: boolean; // default: false — HA-security-panel
  // style: one stacked section per floor with per-area subtitle headings
  // (tap → room view) and the activity log pinned as right-hand sidebar.
  // Off = classic category layout with the activity log as a section
  show_security_activity?: boolean; // default: true — activity log in the
  // security view (24h logbook over security entities + persons, like
  // HA's security panel); auto-hides when logbook is not loaded
  security_activity_position?: 'start' | 'end'; // default: 'start' —
  // where the activity section renders (category layout only; the
  // area-grouped layout always uses the sidebar). Entities labeled
  // `no_seclog` are excluded from the log while staying visible in the
  // security sections themselves
  hidden_cameras?: string[]; // default: [] — camera entity_ids excluded
  // from the security AND camera (CCTV) views; room views deliberately
  // unaffected. For hiding everywhere use the no_dboard label or the
  // per-area camera filter
  hide_mobile_app_batteries?: boolean; // default: false
  hide_battery_notes_entities?: boolean; // default: false
  battery_critical_threshold?: number; // default: 20
  battery_low_threshold?: number; // default: 50
  show_area_in_battery_view?: boolean; // default: false
  unavailable_batteries_bucket?: 'critical' | 'good'; // default: 'good' (follow-up to #248)
  show_locks_in_rooms?: boolean; // default: false
  show_vacuums_section_in_rooms?: boolean; // default: false (vacuums & mowers stay under Misc, like HA's areas strategy)
  show_automations_in_rooms?: boolean; // default: false
  show_scripts_in_rooms?: boolean; // default: false
  show_ups_in_rooms?: boolean; // default: false (opt-in, #310 section convention)
  show_energy_in_rooms?: boolean; // default: false (opt-in — power/energy/water/gas sensors as own room block)
  show_cameras_in_rooms?: boolean; // default: true
  camera_live_toggle?: boolean; // default: false — wrapper card with play/stop button instead of the classic picture cards
  show_window_contacts_in_rooms?: boolean; // default: true (opt-out — set false to hide window contact badges)
  show_door_contacts_in_rooms?: boolean; // default: true (opt-out — set false to hide door contact badges)
  show_switches_on_areas?: boolean; // default: false
  show_alerts_on_areas?: boolean; // default: false
  show_window_alerts_on_areas?: boolean; // default: false
  energy_link_dashboard?: boolean; // default: true
  hide_unavailable_entities?: boolean; // default: false
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
  sections_order?: SectionOrderKey[]; // default: DEFAULT_SECTIONS_ORDER + custom keys
  summaries_columns?: 2 | 4; // default: 2
  hidden_section_headings?: HeadingKey[]; // default: []
  dense_section_placement?: boolean; // default: false — fill grid gaps in all generated sections views

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

  // Custom sections — user-declared section blocks (heading + card list).
  // Each entry's `key` works in sections_order, as custom_cards
  // target_section and in section_visibility. See CustomSection below.
  custom_sections?: CustomSection[];

  // Custom badges (shown in header next to person chips)
  custom_badges?: CustomBadge[];
}

// -- Area Management --------------------------------------------------

export interface AreasDisplay {
  hidden?: string[];
  order?: string[];
  nav_items?: string[];
}

export interface AreaOptions {
  groups_options?: Record<string, GroupOptions>;
  /** User-declared sections for this area's room view (top/bottom) */
  custom_sections?: AreaCustomSection[];
  stacks_order?: StackKey[]; // default: DEFAULT_STACKS_ORDER
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
  /** Target section where this card appears (default: 'custom_cards').
   *  Accepts built-in SectionKeys AND user-defined custom_sections[].key. */
  target_section?: SectionOrderKey;
  /** Raw YAML string entered by the user in the editor */
  yaml?: string;
  /** Parsed Lovelace card config (generated from yaml) */
  parsed_config?: Record<string, any> | null;
  /** YAML parse error message, if any */
  _yaml_error?: string;
}

// -- Custom Sections ----------------------------------------------------
// User-declared overview sections — the lightweight extension hook between
// "inject a card into an existing section" (custom_cards) and "add a whole
// nav view" (custom_views). The section's `key` behaves like a built-in
// SectionKey: it works in sections_order, as custom_cards.target_section
// and in section_visibility rules.
//
// Stability contract (documented in the README):
// - keys colliding with built-in sections are dropped (built-in wins for
//   CURRENT built-ins). Should a FUTURE release introduce a built-in with
//   the same key, the user's custom section keeps winning — config
//   stability beats the new feature. Docs recommend a personal prefix.
// - duplicate keys: first entry wins
// - the section auto-hides when it has no cards (own or assigned)

export interface CustomSectionBase {
  /** Heading text shown at the top of the section */
  heading?: string;
  /** Optional MDI icon for the heading */
  icon?: string;
  /** Raw YAML string entered by the user in the editor — a single card or
   *  a YAML list of cards */
  yaml?: string;
  /** Parsed array of Lovelace card configs (derived from yaml) */
  parsed_config?: Record<string, any>[] | null;
  /** YAML parse error message, if any */
  _yaml_error?: string;
}

/** Overview-level custom section (positioned via its key). */
export interface CustomSection extends CustomSectionBase {
  /** Required unique key — must not collide with a built-in SectionKey */
  key: string;
}

/** Room-level custom section (areas_options.{areaId}.custom_sections).
 *  Positioned relative to the generated room sections — no key needed
 *  until the room stack order becomes configurable (Sortier-Konzept). */
export interface AreaCustomSection extends CustomSectionBase {
  /** Placement relative to the auto-generated room sections (default: 'bottom') */
  position?: 'top' | 'bottom';
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
  /** vacuum + lawn_mower domains — mowers share the group (editor toggles, order, room section) */
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
  ups: string[];
  energy: string[];
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
