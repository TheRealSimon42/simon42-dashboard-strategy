// ====================================================================
// VIEW STRATEGY — OVERVIEW (main dashboard view)
// ====================================================================
// Extracted from the dashboard entry point so HA can resolve this view
// concurrently with other view strategies via Promise.all, enabling
// progressive rendering instead of blocking on Registry init.
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { Simon42StrategyConfig, SectionKey } from '../types/strategy';
import { DEFAULT_SECTIONS_ORDER } from '../types/strategy';
import type { LovelaceViewConfig, LovelaceSectionConfig, LovelaceBadgeConfig } from '../types/lovelace';
import { Registry } from '../Registry';
import { collectPersons, findWeatherEntity, findDummySensor } from '../utils/entity-filter';
import { getVisibleAreas } from '../utils/name-utils';
import { createPersonBadges } from '../utils/badge-builder';
import { createOverviewSection, createCustomCardsSection } from '../sections/OverviewSection';
import { createAreasSection } from '../sections/AreasSection';
import { createWeatherSection, createEnergySection } from '../sections/WeatherEnergySection';
import { createOverviewView } from '../utils/view-builder';
import { timeStart, timeEnd, debugLog } from '../utils/debug';

/**
 * Normalizes a sections_order array: removes invalid/duplicate keys,
 * appends any missing keys at the end (forward compatibility).
 */
function normalizeSectionsOrder(order: SectionKey[]): SectionKey[] {
  const validKeys = new Set<SectionKey>(['overview', 'custom_cards', 'areas', 'weather', 'energy']);
  const seen = new Set<SectionKey>();
  const result: SectionKey[] = [];
  for (const key of order) {
    if (validKeys.has(key) && !seen.has(key)) {
      result.push(key);
      seen.add(key);
    }
  }
  for (const key of DEFAULT_SECTIONS_ORDER) {
    if (!seen.has(key)) result.push(key);
  }
  return result;
}

class Simon42ViewOverviewStrategy extends HTMLElement {
  static async generate(config: any, hass: HomeAssistant): Promise<LovelaceViewConfig> {
    timeStart('overview-generate');
    const dashboardConfig: Simon42StrategyConfig = config.dashboardConfig || {};

    // Initialize Registry (idempotent — skips if already done by another view)
    Registry.initialize(hass, dashboardConfig);

    // Visible areas (filtered + sorted by config)
    const visibleAreas = getVisibleAreas(Registry.areas, dashboardConfig.areas_display, dashboardConfig.use_default_area_sort);

    // Collect data for overview
    const persons = collectPersons(hass, dashboardConfig);
    const weatherEntity = findWeatherEntity(hass);
    const someSensorId = findDummySensor(hass);

    // Person badges
    const personBadges = createPersonBadges(persons, hass);

    // Config flags
    const showWeather = dashboardConfig.show_weather !== false;
    const showEnergy = dashboardConfig.show_energy !== false;
    const showSearchCard = dashboardConfig.show_search_card === true;
    const groupByFloors = dashboardConfig.group_by_floors === true;

    // Build sections
    const overviewSection = createOverviewSection({ someSensorId, showSearchCard, config: dashboardConfig, hass });
    const customCardsSection = createCustomCardsSection(
      dashboardConfig.custom_cards || [],
      dashboardConfig.custom_cards_heading,
      dashboardConfig.custom_cards_icon
    );
    const areasSections = createAreasSection(visibleAreas, groupByFloors, hass);

    // Section map: key → section(s) or null
    const sectionMap: Record<SectionKey, LovelaceSectionConfig | LovelaceSectionConfig[] | null> = {
      overview: overviewSection,
      custom_cards: customCardsSection,
      areas: areasSections,
      weather: createWeatherSection(weatherEntity ?? null, showWeather),
      energy: createEnergySection(showEnergy, dashboardConfig.energy_link_dashboard !== false),
    };

    // Assemble in configured order
    const sectionsOrder = normalizeSectionsOrder(dashboardConfig.sections_order ?? DEFAULT_SECTIONS_ORDER);
    const overviewSections: LovelaceSectionConfig[] = [];
    for (const key of sectionsOrder) {
      const result = sectionMap[key];
      if (!result) continue;
      if (Array.isArray(result)) {
        overviewSections.push(...result);
      } else {
        overviewSections.push(result);
      }
    }

    const totalCards = overviewSections.reduce((sum, s) => sum + (s.cards?.length || 0), 0);
    timeEnd('overview-generate');
    debugLog(`Overview: ${overviewSections.length} sections, ${totalCards} cards, ${personBadges.length} badges`);

    // Custom badges from YAML config
    const customBadges = (dashboardConfig.custom_badges || [])
      .filter((b) => b.parsed_config)
      .map((b) => b.parsed_config as LovelaceBadgeConfig);

    return createOverviewView(overviewSections, [...personBadges, ...customBadges]);
  }
}

customElements.define('ll-strategy-simon42-view-overview', Simon42ViewOverviewStrategy);
