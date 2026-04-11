// ====================================================================
// Simon42 Dashboard Strategy Types
// ====================================================================
// All configuration and data types specific to the simon42 strategy.
// These types cover the YAML config schema and internal data structures
// used throughout the strategy codebase.
// ====================================================================

// -- Main Strategy Config ---------------------------------------------

export interface Simon42StrategyConfig {
  // Global toggles
  show_weather?: boolean; // default: true
  show_energy?: boolean; // default: true
  show_search_card?: boolean; // default: false
  show_summary_views?: boolean; // default: false
  show_room_views?: boolean; // default: false
  group_by_floors?: boolean; // default: false
  show_covers_summary?: boolean; // default: true
  show_partially_open_covers?: boolean; // default: false
  show_clock_card?: boolean; // default: true
  show_light_summary?: boolean; // default: true
  group_lights_by_floors?: boolean; // default: false
  nested_light_groups?: boolean; // default: false
  show_security_summary?: boolean; // default: true
  show_battery_summary?: boolean; // default: true
  show_climate_summary?: boolean; // default: false
  hide_mobile_app_batteries?: boolean; // default: false
  battery_critical_threshold?: number; // default: 20
  battery_low_threshold?: number; // default: 50
  show_locks_in_rooms?: boolean; // default: false
  show_automations_in_rooms?: boolean; // default: false
  show_scripts_in_rooms?: boolean; // default: false
  show_window_contacts_in_rooms?: boolean; // default: false
  show_door_contacts_in_rooms?: boolean; // default: false
  show_switches_on_areas?: boolean; // default: false
  show_alerts_on_areas?: boolean; // default: false

  // Layout
  summaries_columns?: 2 | 4; // default: 2

  // Favorites display
  favorites_show_state?: boolean; // default: false
  favorites_hide_last_changed?: boolean; // default: false
  room_pins_show_state?: boolean; // default: false
  room_pins_hide_last_changed?: boolean; // default: false

  // Special entities
  alarm_entity?: string;
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
  [key: string]: unknown;
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
