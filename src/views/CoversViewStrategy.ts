// ====================================================================
// VIEW STRATEGY — COVERS (reactive group cards)
// ====================================================================

import type { LovelaceViewConfig } from '../types/lovelace';
import { localize } from '../utils/localize';
import { densePlacement } from '../utils/view-builder';
import { defineViewStrategy } from './view-strategy-base';

export function buildCoversCards(config: any): any[] {
    const strategyConfig = config.config || {};
    const showPartiallyOpen = strategyConfig.show_partially_open_covers === true;
    const groupByState = strategyConfig.group_covers_by_state !== false;
    const groupByFloors = strategyConfig.group_covers_by_floors === true;
    const groupByAreas = strategyConfig.group_covers_by_areas === true;

    // Separate awnings and windows from other covers — they have different semantics
    const allDeviceClasses = config.device_classes || ['awning', 'blind', 'curtain', 'shade', 'shutter', 'window'];
    const coverClasses = allDeviceClasses.filter((dc: string) => dc !== 'awning' && dc !== 'window');
    const hasAwnings = allDeviceClasses.includes('awning');
    const hasWindows = allDeviceClasses.includes('window');

    const baseConfig = { entities: config.entities, config: config.config, group_by_areas: groupByAreas };

    const cards: any[] = [];
    const addCategoryGroups = (categoryConfig: Record<string, unknown>, groupFloorsInCombinedMode = false): void => {
      if (!groupByState) {
        cards.push({
          type: 'custom:simon42-covers-group-card',
          ...categoryConfig,
          ...(groupFloorsInCombinedMode && groupByFloors ? { group_by_floors: true } : {}),
          group_type: 'all',
        });
        return;
      }

      cards.push({
        type: 'custom:simon42-covers-group-card',
        ...categoryConfig,
        group_type: 'open',
        show_partially_open: showPartiallyOpen,
      });

      if (showPartiallyOpen) {
        cards.push({
          type: 'custom:simon42-covers-group-card',
          ...categoryConfig,
          group_type: 'partially_open',
          show_partially_open: true,
        });
      }

      cards.push({
        type: 'custom:simon42-covers-group-card',
        ...categoryConfig,
        group_type: 'closed',
        show_partially_open: showPartiallyOpen,
      });
    };

    // Rollos & Vorhänge
    addCategoryGroups({
      ...baseConfig,
      device_classes: coverClasses,
      group_by_floors: groupByFloors,
    });

    // Markisen (separate group with own headings/batch actions)
    if (hasAwnings) {
      const awningConfig = {
        ...baseConfig,
        device_classes: ['awning'],
        heading_open: localize('covers.awnings_open'),
        heading_closed: localize('covers.awnings_closed'),
        heading_partial: localize('covers.awnings_partial'),
        heading_all: localize('covers.awnings_all'),
        batch_open_text: localize('covers.awnings_open_all'),
        batch_close_text: localize('covers.awnings_close_all'),
        // Awnings are no window coverings — storefront icons instead of blinds (#144),
        // overridable via awning_icon_* config
        icon_open: strategyConfig.awning_icon_open || 'mdi:storefront-outline',
        icon_closed: strategyConfig.awning_icon_closed || 'mdi:storefront',
        icon_partial: strategyConfig.awning_icon_partial || 'mdi:storefront-outline',
        icon_all: strategyConfig.awning_icon_open || 'mdi:storefront-outline',
      };

      addCategoryGroups(awningConfig, true);
    }

    // Fenster (separate group — windows are not shading)
    if (hasWindows) {
      const windowConfig = {
        ...baseConfig,
        device_classes: ['window'],
        heading_open: localize('covers.windows_open'),
        heading_closed: localize('covers.windows_closed'),
        heading_partial: localize('covers.windows_partial'),
        heading_all: localize('covers.windows_all'),
        batch_open_text: localize('covers.windows_open_all'),
        batch_close_text: localize('covers.windows_close_all'),
      };

      addCategoryGroups(windowConfig, true);
    }

    return cards;
}

async function generateCoversView(config: any, _hass: any): Promise<LovelaceViewConfig> {
    return {
      type: 'sections',
      ...densePlacement(config.config),
      sections: [{ type: 'grid', cards: buildCoversCards(config) }],
    };
}

defineViewStrategy('ll-strategy-simon42-view-covers', generateCoversView);
