// ====================================================================
// View Builder - Creates View Definitions
// ====================================================================

import type { LovelaceViewConfig, LovelaceBadgeConfig, LovelaceSectionConfig } from '../types/lovelace';
import { localize } from './localize';

/**
 * Creates a full-width banner section shown at the top of every view.
 * The section is hidden via visibility template when the entity state is empty.
 */
export function createBannerSection(
  bannerEntity: string,
  alertType: 'info' | 'warning' | 'error' | 'success' = 'info'
): LovelaceSectionConfig {
  return {
    type: 'grid',
    column_span: 4,
    visibility: [
      {
        condition: 'template',
        value_template: `{{ states('${bannerEntity}') | trim != '' }}`,
      },
    ],
    cards: [
      {
        type: 'markdown',
        content: `<ha-alert alert-type="${alertType}">{{ states('${bannerEntity}') }}</ha-alert>`,
        grid_options: { columns: 'full', rows: 'auto' },
      },
    ],
  };
}

/**
 * Opt-in dense placement for sections views: HA fills gaps in the grid
 * (masonry-like) instead of strictly following the section order.
 * Applied uniformly to all generated sections views.
 */
export function densePlacement(
  config?: { dense_section_placement?: boolean }
): Partial<LovelaceViewConfig> {
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
