// ====================================================================
// VIEW STRATEGY — CLIMATE (Climate/Thermostat Overview)
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { LovelaceViewConfig, LovelaceSectionConfig } from '../types/lovelace';
import { Registry } from '../Registry';
import { localize } from '../utils/localize';
import { densePlacement } from '../utils/view-builder';
import { hasState } from '../utils/state-utils';
import { summaryHiddenAreas } from '../utils/area-utils';

class Simon42ViewClimateStrategy extends HTMLElement {
  static async generate(config: any, hass: HomeAssistant): Promise<LovelaceViewConfig> {
    // Ensure Registry is initialized (idempotent — no-op if already done)
    Registry.initialize(hass, config.config || {});

    // Hidden overview areas stay in the view unless hide_hidden_areas_in_summaries
    // is set (#428) — same set the climate summary tile counts
    const hiddenAreas = summaryHiddenAreas(config.config || {});
    const climateIds = Registry.getVisibleEntityIdsForDomain(
      'climate',
      hiddenAreas ? new Set(hiddenAreas) : undefined
    ).filter((id) => hasState(hass, id));

    // Group by hvac_action or state
    const heating: string[] = [];
    const cooling: string[] = [];
    const idle: string[] = [];
    const off: string[] = [];

    for (const id of climateIds) {
      const state = hass.states[id];
      const hvacAction = state.attributes?.hvac_action as string | undefined;
      const hvacState = state.state;

      if (hvacState === 'off' || hvacState === 'unavailable' || hvacState === 'unknown') {
        off.push(id);
      } else if (hvacAction === 'heating' || (!hvacAction && hvacState === 'heat')) {
        heating.push(id);
      } else if (hvacAction === 'cooling' || (!hvacAction && hvacState === 'cool')) {
        cooling.push(id);
      } else {
        // idle, drying, fan, auto without action, etc.
        idle.push(id);
      }
    }

    const sections: LovelaceSectionConfig[] = [];

    function buildSection(entities: string[], heading: string, icon: string): void {
      if (entities.length === 0) return;
      sections.push({
        type: 'grid',
        cards: [
          {
            type: 'heading',
            heading: `${heading} (${entities.length})`,
            heading_style: 'title',
            icon,
          },
          ...entities.map((e) => ({
            type: 'tile',
            entity: e,
            vertical: false,
            features: [{ type: 'climate-hvac-modes' }],
            features_position: 'inline',
            state_content: ['hvac_action', 'current_temperature'],
          })),
        ],
      });
    }

    buildSection(heating, localize('climate.heating'), 'mdi:fire');
    buildSection(cooling, localize('climate.cooling'), 'mdi:snowflake');
    buildSection(idle, localize('climate.idle'), 'mdi:thermostat');
    buildSection(off, localize('climate.off'), 'mdi:power-off');

    return { type: 'sections', ...densePlacement(config.config || {}), sections };
  }
}

customElements.define('ll-strategy-simon42-view-climate', Simon42ViewClimateStrategy);
