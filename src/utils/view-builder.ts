// ====================================================================
// View Builder - Creates View Definitions
// ====================================================================

import type { LovelaceViewConfig, LovelaceBadgeConfig, LovelaceSectionConfig, LovelaceCardConfig } from '../types/lovelace';
import { localize } from './localize';

/**
 * Creates a single markdown card combining all banner configs.
 * Each banner uses a Jinja2 {% if %} guard so it renders nothing when
 * the entity state is empty — no "Konfigurationsfehler", no phantom space.
 * Inject this card into view.header.card so it appears above the badges row.
 */
export function createBannerCard(
  bannerConfigs: Array<{ entity: string; alertType: 'info' | 'warning' | 'error' | 'success' }>
): LovelaceCardConfig {
  const content = bannerConfigs
    .map(
      ({ entity, alertType }) =>
        `{% if states('${entity}') | trim != '' %}<ha-alert alert-type="${alertType}">{{ states('${entity}') }}</ha-alert>{% endif %}`
    )
    .join('');
  return {
    type: 'markdown',
    content,
    card_mod: {
      style: `
        ha-card {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
        }
        ha-card ha-markdown {
          padding: 0 !important;
        }
      `,
    },
  };
}

/**
 * Opt-in dense placement for sections views: HA fills gaps in the grid
 * (masonry-like) instead of strictly following the section order.
 * Applied uniformly to all generated sections views.
 */
export function densePlacement(config?: { dense_section_placement?: boolean }): Partial<LovelaceViewConfig> {
  return config?.dense_section_placement === true ? { dense_section_placement: true } : {};
}

/**
 * Creates the main overview view.
 *
 * - Badges and header are only included when personBadges has entries.
 * - Type "sections" with max 3 columns.
 */
export function createOverviewView(
  sections: LovelaceSectionConfig[],
  personBadges: LovelaceBadgeConfig[],
  strategyConfig?: { dense_section_placement?: boolean }
): LovelaceViewConfig {
  return {
    title: localize('views.overview'),
    path: 'home',
    icon: 'mdi:home',
    type: 'sections',
    max_columns: 3,
    ...densePlacement(strategyConfig),
    badges: personBadges.length > 0 ? personBadges : undefined,
    header:
      personBadges.length > 0
        ? {
            layout: 'center',
            badges_position: 'bottom',
            badges_wrap: 'wrap',
          }
        : undefined,
    sections,
  };
}
