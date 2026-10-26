// ====================================================================
// VIEW STRATEGY — CLIMATE (Climate/Thermostat Overview)
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { LovelaceViewConfig, LovelaceSectionConfig, LovelaceCardConfig } from '../types/lovelace';
import type { AreaRegistryEntry } from '../types/registries';
import { Registry } from '../Registry';
import { localize } from '../utils/localize';
import { densePlacement } from '../utils/view-builder';
import { hasState } from '../utils/state-utils';
import { resolveAreaId, summaryHiddenAreas } from '../utils/area-utils';
import { getVisibleAreasFromHass } from '../utils/name-utils';

function buildClimateTile(entityId: string): LovelaceCardConfig {
  return {
    type: 'tile',
    entity: entityId,
    vertical: false,
    features: [{ type: 'climate-hvac-modes' }],
    features_position: 'inline',
    state_content: ['hvac_action', 'current_temperature'],
  };
}

/** Area-grouped tiles for one status section (#467): one subtitle heading per
 *  area in the given order, then a trailing "no area" bucket. Headings link to
 *  the room view unless the area is hidden on the overview (it has none). */
export function buildAreaGroupedClimateCards(
  entities: string[],
  orderedAreas: AreaRegistryEntry[],
  hiddenOnOverview: Set<string>
): LovelaceCardConfig[] {
  const byArea = new Map<string, string[]>();
  const noArea: string[] = [];
  for (const e of entities) {
    const areaId = resolveAreaId(e);
    if (!areaId) {
      noArea.push(e);
      continue;
    }
    const arr = byArea.get(areaId) || [];
    arr.push(e);
    byArea.set(areaId, arr);
  }

  const cards: LovelaceCardConfig[] = [];
  for (const area of orderedAreas) {
    const arr = byArea.get(area.area_id);
    if (!arr || arr.length === 0) continue;
    cards.push({
      type: 'heading',
      heading: area.name,
      heading_style: 'subtitle',
      ...(hiddenOnOverview.has(area.area_id)
        ? {}
        : { tap_action: { action: 'navigate', navigation_path: area.area_id } }),
    });
    cards.push(...arr.map(buildClimateTile));
  }
  if (noArea.length > 0) {
    cards.push({ type: 'heading', heading: localize('climate.no_area'), heading_style: 'subtitle' });
    cards.push(...noArea.map(buildClimateTile));
  }
  return cards;
}

class Simon42ViewClimateStrategy extends HTMLElement {
  static async generate(config: any, hass: HomeAssistant): Promise<LovelaceViewConfig> {
    // Ensure Registry is initialized (idempotent — no-op if already done)
    Registry.initialize(hass, config.config || {});
    const strategyConfig = config.config || {};
    const groupByAreas = strategyConfig.group_climate_by_areas === true;

    // Hidden overview areas stay in the view unless hide_hidden_areas_in_summaries
    // is set (#428) — same set the climate summary tile counts
    const hiddenAreas = summaryHiddenAreas(strategyConfig);
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

    // All areas in the user's order, hidden overview areas included — their
    // thermostats are only in climateIds when hide_hidden_areas_in_summaries
    // is off, and then they belong under their own heading (like #410)
    const orderedAreas = groupByAreas
      ? getVisibleAreasFromHass(
          hass,
          { ...strategyConfig.areas_display, hidden: [] },
          strategyConfig.use_default_area_sort
        )
      : [];
    const hiddenOnOverview = new Set<string>(strategyConfig.areas_display?.hidden || []);

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
          ...(groupByAreas
            ? buildAreaGroupedClimateCards(entities, orderedAreas, hiddenOnOverview)
            : entities.map(buildClimateTile)),
        ],
      });
    }

    buildSection(heating, localize('climate.heating'), 'mdi:fire');
    buildSection(cooling, localize('climate.cooling'), 'mdi:snowflake');
    buildSection(idle, localize('climate.idle'), 'mdi:thermostat');
    buildSection(off, localize('climate.off'), 'mdi:power-off');

    return { type: 'sections', ...densePlacement(strategyConfig), sections };
  }
}

customElements.define('ll-strategy-simon42-view-climate', Simon42ViewClimateStrategy);
