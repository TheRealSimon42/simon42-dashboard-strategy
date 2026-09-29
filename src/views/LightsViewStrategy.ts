// ====================================================================
// VIEW STRATEGY — LIGHTS (reactive group cards)
// ====================================================================

import type { LovelaceViewConfig } from '../types/lovelace';
import { densePlacement } from '../utils/view-builder';
import { summaryHiddenAreas } from '../utils/area-utils';

class Simon42ViewLightsStrategy extends HTMLElement {
  static async generate(config: any, _hass: any): Promise<LovelaceViewConfig> {
    const dashboardConfig = config.dashboardConfig || config.config || {};
    const groupByFloors = dashboardConfig.group_lights_by_floors === true;
    const groupByAreas = dashboardConfig.group_lights_by_areas === true;
    const nestedGroups = dashboardConfig.nested_light_groups === true;
    // Only with hide_hidden_areas_in_summaries (#428) — by default the cards
    // list every visible light, hidden overview areas included
    const hiddenAreas = summaryHiddenAreas(dashboardConfig);
    const hiddenAreasConfig = hiddenAreas ? { hidden_areas: hiddenAreas } : {};

    return {
      type: 'sections',
      ...densePlacement(dashboardConfig),
      sections: [
        {
          type: 'grid',
          cards: [
            {
              type: 'custom:simon42-lights-group-card',
              entities: config.entities,
              config: config.config,
              group_type: 'on',
              group_by_floors: groupByFloors,
              group_by_areas: groupByAreas,
              nested_groups: nestedGroups,
              sort_by: dashboardConfig.lights_sort_by,
              ...hiddenAreasConfig,
            },
            {
              type: 'custom:simon42-lights-group-card',
              entities: config.entities,
              config: config.config,
              group_type: 'off',
              group_by_floors: groupByFloors,
              group_by_areas: groupByAreas,
              nested_groups: nestedGroups,
              sort_by: dashboardConfig.lights_sort_by,
              ...hiddenAreasConfig,
            },
          ],
        },
      ],
    };
  }
}

customElements.define('ll-strategy-simon42-view-lights', Simon42ViewLightsStrategy);
