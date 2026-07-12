// ====================================================================
// Overview Section Builder
// ====================================================================
// Ported from dist/utils/simon42-section-builder.js (createOverviewSection)
// with full TypeScript types.
// Creates the "Übersicht" section with clock, alarm, search, summaries,
// and favorites.
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { Simon42StrategyConfig, CustomCard } from '../types/strategy';
import type { LovelaceCardConfig, LovelaceSectionConfig } from '../types/lovelace';
import { localize } from '../utils/localize';
import { getViewVisibleUsers, userVisibilityConditions, unionVisibleUsers } from '../utils/view-visibility';

/**
 * Spreadable user-visibility for a summary tile: the tile is the overview
 * entry point of its target view, so it follows the view's
 * view_visible_users rule (native runtime condition — display logic, not
 * a security boundary). No rule → no visibility key at all.
 */
function tileUserVisibility(config: Simon42StrategyConfig, viewPath: string): Partial<LovelaceCardConfig> {
  const conditions = userVisibilityConditions(getViewVisibleUsers(config, viewPath));
  return conditions ? { visibility: conditions } : {};
}

export interface OverviewSectionParams {
  someSensorId: string | null;
  showSearchCard: boolean;
  config: Simon42StrategyConfig;
  hass: HomeAssistant;
}

/**
 * Creates the overview section with summaries, clock, optional alarm,
 * optional search card, and favorites.
 */
export function createOverviewSection(data: OverviewSectionParams): LovelaceSectionConfig | null {
  const { showSearchCard, config, hass } = data;
  const showClockCard = config.show_clock_card !== false;
  const hidden = new Set(config.hidden_section_headings || []);

  // Check if alarm entity is configured
  const alarmEntity = config.alarm_entity;

  const cards: LovelaceCardConfig[] = [];

  // Only show "Übersicht" heading if clock or alarm is visible
  if ((showClockCard || alarmEntity) && !hidden.has('overview')) {
    cards.push({
      type: 'heading',
      heading: localize('sections.overview'),
      heading_style: 'title',
      icon: 'mdi:overscan',
    });
  }

  if (showClockCard) {
    if (alarmEntity) {
      // Clock and alarm panel side-by-side
      cards.push({
        type: 'clock',
        clock_size: 'small',
        show_seconds: false,
      });
      cards.push({
        type: 'tile',
        entity: alarmEntity,
        vertical: false,
      });
    } else {
      // Clock only, full width
      cards.push({
        type: 'clock',
        clock_size: 'small',
        show_seconds: false,
        grid_options: {
          columns: 'full',
        },
      });
    }
  } else if (alarmEntity) {
    // No clock, but alarm panel full width
    cards.push({
      type: 'tile',
      entity: alarmEntity,
      vertical: false,
      grid_options: {
        columns: 'full',
      },
    });
  }

  // Add search card if enabled. Two variants: the HACS-installed
  // custom:search-card (default, inline input) or a native markdown hint
  // pointing at HA's built-in global search (no external dependency).
  if (showSearchCard) {
    const variant = config.search_card_variant === 'tip' ? 'tip' : 'custom';
    if (variant === 'tip') {
      cards.push({
        type: 'markdown',
        content:
          '### 🔍 ' + localize('editor.search_card_tip_title') + '\n\n' +
          localize('editor.search_card_tip_body'),
        grid_options: { columns: 'full' },
      });
    } else {
      cards.push({
        type: 'custom:search-card',
        grid_options: { columns: 'full' },
      });
    }
  }

  // Summaries columns (default: 2)
  const summariesColumns = config.summaries_columns || 2;
  const showCoversSummary = config.show_covers_summary !== false;
  const showLightSummary = config.show_light_summary !== false;
  const showSecuritySummary = config.show_security_summary !== false;
  const showBatterySummary = config.show_battery_summary !== false;
  const showClimateSummary = config.show_climate_summary === true;
  const showMaintenanceSummary = config.show_maintenance_summary === true;

  // Build summary cards based on config. Each tile carries the
  // view_visible_users rule of the view it deep-links to (entry-point
  // parity with the nav tab); ruleFor mirrors the tiles for the
  // union conditions on the heading and the stack rows below.
  const summaryCards: LovelaceCardConfig[] = [];
  const summaryRules: (string[] | undefined)[] = [];
  function pushSummary(viewPath: string, card: LovelaceCardConfig): void {
    summaryCards.push({ ...card, ...tileUserVisibility(config, viewPath) });
    summaryRules.push(getViewVisibleUsers(config, viewPath));
  }

  if (showLightSummary) {
    pushSummary('lights', {
      type: 'custom:simon42-summary-card',
      summary_type: 'lights',
      areas_options: config.areas_options || {},
      ...(config.hide_unavailable_entities === true
        ? { hide_unavailable_entities: true }
        : {}),
    });
  }

  if (showCoversSummary) {
    pushSummary('covers', {
      type: 'custom:simon42-summary-card',
      summary_type: 'covers',
      areas_options: config.areas_options || {},
      ...(config.hide_unavailable_entities === true
        ? { hide_unavailable_entities: true }
        : {}),
    });
  }

  if (showSecuritySummary) {
    pushSummary('security', {
      type: 'custom:simon42-summary-card',
      summary_type: 'security',
      areas_options: config.areas_options || {},
      ...(config.hide_unavailable_entities === true
        ? { hide_unavailable_entities: true }
        : {}),
    });
  }

  if (showBatterySummary) {
    pushSummary('batteries', {
      type: 'custom:simon42-summary-card',
      summary_type: 'batteries',
      areas_options: config.areas_options || {},
      hide_mobile_app_batteries: config.hide_mobile_app_batteries,
      hide_battery_notes_entities: config.hide_battery_notes_entities,
      battery_critical_threshold: config.battery_critical_threshold,
      ...(config.hide_unavailable_entities === true
        ? { hide_unavailable_entities: true }
        : {}),
    });
  }

  if (showClimateSummary) {
    pushSummary('climate', {
      type: 'custom:simon42-summary-card',
      summary_type: 'climate',
      areas_options: config.areas_options || {},
      ...(config.hide_unavailable_entities === true
        ? { hide_unavailable_entities: true }
        : {}),
    });
  }

  if (showMaintenanceSummary) {
    pushSummary('maintenance', {
      type: 'custom:simon42-summary-card',
      summary_type: 'maintenance',
      areas_options: config.areas_options || {},
      // battery params mirror the batteries tile so both count the same set
      hide_mobile_app_batteries: config.hide_mobile_app_batteries,
      hide_battery_notes_entities: config.hide_battery_notes_entities,
      battery_critical_threshold: config.battery_critical_threshold,
    });
  }

  // Wraps one row of tiles; the stack hides when every tile in it is
  // hidden for the current user (union rule), avoiding empty gaps.
  function pushRow(rowCards: LovelaceCardConfig[], rowRules: (string[] | undefined)[]): void {
    const rowConditions = userVisibilityConditions(unionVisibleUsers(rowRules));
    cards.push({
      type: 'horizontal-stack',
      cards: rowCards,
      ...(rowConditions ? { visibility: rowConditions } : {}),
    });
  }

  // Only show summaries heading and cards if at least one is enabled
  if (summaryCards.length > 0) {
    if (!hidden.has('summaries')) {
      // Heading hides for users who can't see ANY summary tile (union of
      // the tile rules; one unrestricted tile keeps it unconditional).
      const headingConditions = userVisibilityConditions(unionVisibleUsers(summaryRules));
      cards.push({
        type: 'heading',
        heading: localize('sections.summaries'),
        ...(headingConditions ? { visibility: headingConditions } : {}),
      });
    }

    // Layout logic: adapt to number of cards
    if (summariesColumns === 4) {
      // 4 columns: all cards in a single row
      pushRow(summaryCards, summaryRules);
    } else {
      // 2 columns: split into rows of 2
      for (let i = 0; i < summaryCards.length; i += 2) {
        pushRow(summaryCards.slice(i, i + 2), summaryRules.slice(i, i + 2));
      }
    }
  }

  // Light favorites — quick toggle row using HA's native glance card
  const lightFavs = (config.light_favorite_entities || []).filter(
    (id) => id.startsWith('light.') && Reflect.get(hass.states as Record<string, unknown>, id) !== undefined
  );
  if (lightFavs.length > 0) {
    cards.push({
      type: 'heading',
      heading: localize('sections.light_favorites'),
      icon: 'mdi:lightbulb-group',
    });
    cards.push({
      type: 'glance',
      show_name: true,
      show_icon: true,
      show_state: false,
      columns: Math.min(lightFavs.length, 5),
      entities: lightFavs.map((entityId) => ({
        entity: entityId,
        tap_action: { action: 'toggle' },
        hold_action: { action: 'more-info' },
      })),
      grid_options: { columns: 'full' },
    });
  }

  // Favorites section
  const favoriteEntities = (config.favorite_entities || []).filter((entityId) => hass.states[entityId] !== undefined);

  if (favoriteEntities.length > 0) {
    if (!hidden.has('favorites')) {
      cards.push({
        type: 'heading',
        heading: localize('sections.favorites'),
      });
    }

    const showState = config.favorites_show_state === true;
    const hideLastChanged = config.favorites_hide_last_changed === true;
    const stateContent: string[] = [];
    if (showState) stateContent.push('state');
    if (!hideLastChanged) stateContent.push('last_changed');

    for (const entityId of favoriteEntities) {
      cards.push({
        type: 'tile',
        entity: entityId,
        show_entity_picture: true,
        vertical: false,
        ...(stateContent.length > 0 ? { state_content: stateContent } : {}),
      });
    }
  }

  // If nothing is visible, skip the entire section
  if (cards.length === 0) {
    return null;
  }

  return {
    type: 'grid',
    cards,
  };
}

/**
 * Creates a section for user-defined custom cards (from YAML config).
 * Returns null if no valid custom cards are configured.
 */
export function createCustomCardsSection(
  customCards: CustomCard[],
  heading?: string,
  icon?: string,
  hideHeading?: boolean
): LovelaceSectionConfig | null {
  const validCards = customCards.filter((c) => c.parsed_config);
  if (validCards.length === 0) return null;

  const cards: LovelaceCardConfig[] = hideHeading
    ? []
    : [{ type: 'heading', heading: heading || localize('sections.custom_cards'), icon: icon || 'mdi:cards' }];

  for (const card of validCards) {
    if (Array.isArray(card.parsed_config)) {
      cards.push(...card.parsed_config);
    } else {
      if (card.title) {
        cards.push({ type: 'heading', heading: card.title });
      }
      cards.push(card.parsed_config as LovelaceCardConfig);
    }
  }

  return { type: 'grid', cards };
}
