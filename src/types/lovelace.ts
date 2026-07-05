// ====================================================================
// Lovelace Configuration Types
// ====================================================================
// Types for the Lovelace dashboard config objects that the strategy
// generates (views, sections, cards, badges) and receives as input.
// ====================================================================

// -- Strategy Config --------------------------------------------------

export interface LovelaceStrategyConfig {
  type: string;
  [key: string]: any;
}

// -- Cards ------------------------------------------------------------

export interface LovelaceCardConfig {
  type: string;
  grid_options?: LovelaceGridOptions;
  visibility?: LovelaceCondition[];
  [key: string]: any;
}

// -- Badges -----------------------------------------------------------

export interface LovelaceBadgeConfig {
  type?: string;
  entity?: string;
  color?: string;
  tap_action?: Record<string, any>;
  visibility?: LovelaceCondition[];
  [key: string]: any;
}

// -- Sections ---------------------------------------------------------

export interface LovelaceSectionConfig {
  type?: string;
  title?: string;
  cards?: LovelaceCardConfig[];
  column_span?: number;
  row_span?: number;
  visibility?: LovelaceCondition[];
  [key: string]: any;
}

// -- Views ------------------------------------------------------------

/** Sidebar of a sections view (HA 2026.x) — e.g. the activity log pane */
export interface LovelaceViewSidebarConfig {
  sections?: LovelaceSectionConfig[];
  content_label?: string;
  sidebar_label?: string;
  visibility?: LovelaceCondition[];
}

export interface LovelaceViewConfig {
  title?: string;
  path?: string;
  icon?: string;
  type?: string;
  subview?: boolean;
  max_columns?: number;
  dense_section_placement?: boolean;
  badges?: (string | Partial<LovelaceBadgeConfig>)[];
  header?: LovelaceViewHeaderConfig;
  sections?: LovelaceSectionConfig[];
  cards?: LovelaceCardConfig[];
  strategy?: LovelaceStrategyConfig;
  sidebar?: LovelaceViewSidebarConfig;
  background?: string | LovelaceViewBackgroundConfig;
  visible?: boolean | ShowViewConfig[];
  back_path?: string;
}

// -- Dashboard --------------------------------------------------------

export interface LovelaceConfig {
  title?: string;
  views: LovelaceViewConfig[];
  background?: string;
}

// -- Supporting Types -------------------------------------------------

export interface LovelaceGridOptions {
  columns?: number | 'full';
  rows?: number | 'auto';
  max_columns?: number;
  min_columns?: number;
}

export interface LovelaceCondition {
  condition: string;
  [key: string]: any;
}

export interface LovelaceViewHeaderConfig {
  card?: LovelaceCardConfig;
  layout?: 'start' | 'center' | 'responsive';
  badges_position?: 'bottom' | 'top';
  badges_wrap?: 'wrap' | 'nowrap';
}

export interface LovelaceViewBackgroundConfig {
  image?: string;
  opacity?: number;
  size?: 'auto' | 'cover' | 'contain';
  alignment?: string;
  repeat?: 'repeat' | 'no-repeat';
  attachment?: 'scroll' | 'fixed';
}

export interface ShowViewConfig {
  user?: string;
}
