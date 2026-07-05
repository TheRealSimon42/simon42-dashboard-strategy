import type { LovelaceViewConfig, LovelaceBadgeConfig, LovelaceSectionConfig } from '../types/lovelace';
import { localize } from './localize';

/**
 * Creates the main overview view.
 *
 * - Badges and header are only included when personBadges has entries.
 * - Type "sections" with max 3 columns.
 */
export function createOverviewView(
  sections: LovelaceSectionConfig[],
  personBadges: LovelaceBadgeConfig[]
): LovelaceViewConfig {
  return {
    title: localize('views.overview'),
    path: 'home',
    icon: 'mdi:home',
    type: 'sections',
    max_columns: 3,
    dense_section_placement: true,
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
