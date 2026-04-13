// ====================================================================
// VIEW STRATEGY — COVERS (reactive group cards)
// ====================================================================

import type { LovelaceViewConfig } from '../types/lovelace';
import { localize } from '../utils/localize';

class Simon42ViewCoversStrategy extends HTMLElement {
  static async generate(config: any, _hass: any): Promise<LovelaceViewConfig> {
    const strategyConfig = config.config || {};
    const showPartiallyOpen = strategyConfig.show_partially_open_covers === true;

    // Separate awnings and windows from other covers — they have different semantics
    const allDeviceClasses = config.device_classes || ['awning', 'blind', 'curtain', 'shade', 'shutter', 'window'];
    const coverClasses = allDeviceClasses.filter((dc: string) => dc !== 'awning' && dc !== 'window');
    const hasAwnings = allDeviceClasses.includes('awning');
    const hasWindows = allDeviceClasses.includes('window');

    const baseConfig = { entities: config.entities, config: config.config };

    // Rollos & Vorhänge
    const cards: any[] = [
      {
        type: 'custom:simon42-covers-group-card',
        ...baseConfig,
        device_classes: coverClasses,
        group_type: 'open',
        show_partially_open: showPartiallyOpen,
      },
    ];

    if (showPartiallyOpen) {
      cards.push({
        type: 'custom:simon42-covers-group-card',
        ...baseConfig,
        device_classes: coverClasses,
        group_type: 'partially_open',
        show_partially_open: true,
      });
    }

    cards.push({
      type: 'custom:simon42-covers-group-card',
      ...baseConfig,
      device_classes: coverClasses,
      group_type: 'closed',
      show_partially_open: showPartiallyOpen,
    });

    // Markisen (separate group with own headings/batch actions)
    if (hasAwnings) {
      const awningConfig = {
        ...baseConfig,
        device_classes: ['awning'],
        heading_open: localize('covers.awnings_open'),
        heading_closed: localize('covers.awnings_closed'),
        heading_partial: localize('covers.awnings_partial'),
        batch_open_text: localize('covers.awnings_open_all'),
        batch_close_text: localize('covers.awnings_close_all'),
      };

      cards.push({
        type: 'custom:simon42-covers-group-card',
        ...awningConfig,
        group_type: 'open',
        show_partially_open: showPartiallyOpen,
      });

      if (showPartiallyOpen) {
        cards.push({
          type: 'custom:simon42-covers-group-card',
          ...awningConfig,
          group_type: 'partially_open',
          show_partially_open: true,
        });
      }

      cards.push({
        type: 'custom:simon42-covers-group-card',
        ...awningConfig,
        group_type: 'closed',
        show_partially_open: showPartiallyOpen,
      });
    }

    // Fenster (separate group — windows are not shading)
    if (hasWindows) {
      const windowConfig = {
        ...baseConfig,
        device_classes: ['window'],
        heading_open: localize('covers.windows_open'),
        heading_closed: localize('covers.windows_closed'),
        heading_partial: localize('covers.windows_partial'),
        batch_open_text: localize('covers.windows_open_all'),
        batch_close_text: localize('covers.windows_close_all'),
      };

      cards.push({
        type: 'custom:simon42-covers-group-card',
        ...windowConfig,
        group_type: 'open',
        show_partially_open: showPartiallyOpen,
      });

      if (showPartiallyOpen) {
        cards.push({
          type: 'custom:simon42-covers-group-card',
          ...windowConfig,
          group_type: 'partially_open',
          show_partially_open: true,
        });
      }

      cards.push({
        type: 'custom:simon42-covers-group-card',
        ...windowConfig,
        group_type: 'closed',
        show_partially_open: showPartiallyOpen,
      });
    }

    return {
      type: 'sections',
      sections: [{ type: 'grid', cards }],
    };
  }
}

customElements.define('ll-strategy-simon42-view-covers', Simon42ViewCoversStrategy);
