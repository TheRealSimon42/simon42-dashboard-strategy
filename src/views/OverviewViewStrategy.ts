// ====================================================================
// VIEW STRATEGY — OVERVIEW (main dashboard view)
// ====================================================================
// Extracted from the dashboard entry point so HA can resolve this view
// concurrently with other view strategies via Promise.all, enabling
// progressive rendering instead of blocking on Registry init.
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { Simon42StrategyConfig, SectionKey, CustomCard } from '../types/strategy';
import { DEFAULT_SECTIONS_ORDER } from '../types/strategy';
import type { LovelaceViewConfig, LovelaceSectionConfig, LovelaceBadgeConfig, LovelaceCardConfig } from '../types/lovelace';
import { Registry } from '../Registry';
import { collectPersons, findWeatherEntity, findDummySensor } from '../utils/entity-filter';
import { getVisibleAreas } from '../utils/name-utils';
import { createPersonBadges } from '../utils/badge-builder';
import { createOverviewSection, createCustomCardsSection } from '../sections/OverviewSection';
import { createAreasSection } from '../sections/AreasSection';
import { createWeatherSection, createEnergySection } from '../sections/WeatherEnergySection';
import { createPlantsSection } from '../sections/PlantsSection';
import { createAgendaSection } from '../sections/AgendaSection';
import { createTodosSection } from '../sections/TodosSection';
import { createPersonsSection } from '../sections/PersonsSection';
import { createVacuumsSection } from '../sections/VacuumsSection';
import { createMaintenanceSection } from '../sections/MaintenanceSection';
import { createOverviewView } from '../utils/view-builder';
import { timeStart, timeEnd, debugLog } from '../utils/debug';

/**
 * Normalizes a sections_order array: removes invalid/duplicate keys,
 * appends any missing keys at the end (forward compatibility).
 */
function normalizeSectionsOrder(order: SectionKey[]): SectionKey[] {
  const validKeys = new Set<SectionKey>([
    'overview', 'custom_cards', 'areas', 'weather', 'energy',
    'plants', 'agenda', 'todos', 'persons', 'vacuums', 'maintenance',
  ]);
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

/**
 * Renders custom cards into an array of LovelaceCardConfigs (without section wrapper).
 * Used to append assigned custom cards to existing sections.
 */
function renderCustomCards(cards: CustomCard[]): LovelaceCardConfig[] {
  const result: LovelaceCardConfig[] = [];
  for (const card of cards) {
    if (!card.parsed_config) continue;
    if (Array.isArray(card.parsed_config)) {
      result.push(...card.parsed_config);
    } else {
      if (card.title) {
        result.push({ type: 'heading', heading: card.title, heading_style: 'subtitle' });
      }
      result.push(card.parsed_config as LovelaceCardConfig);
    }
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
    // Resolve the weather entity: explicit config wins when the entity
    // exists in this hass instance, otherwise fall back to auto-discovery.
    const configuredWeather = dashboardConfig.weather_entity;
    const weatherEntity =
      configuredWeather && hass.states[configuredWeather]
        ? configuredWeather
        : findWeatherEntity(hass);
    const someSensorId = findDummySensor(hass);

    // Person badges (default-on; suppress via show_person_badges=false to swap in
    // your own person badges through custom_badges instead).
    // Zone-aware: HA's person.state returns the zone name when the person is in
    // a non-home zone, so 'with_state' layout surfaces "Work" / "Office" / etc.
    const showPersonBadges = dashboardConfig.show_person_badges !== false;
    const personBadgeLayout = dashboardConfig.person_badge_layout || 'with_state';
    const personBadges = showPersonBadges ? createPersonBadges(persons, hass, personBadgeLayout) : [];

    // Config flags
    const showWeather = dashboardConfig.show_weather !== false;
    const showEnergy = dashboardConfig.show_energy !== false;
    const showSearchCard = dashboardConfig.show_search_card === true;
    const groupByFloors = dashboardConfig.group_by_floors === true;

    // Group custom cards by target section
    const allCustomCards = dashboardConfig.custom_cards || [];
    const customCardsBySection = new Map<SectionKey, CustomCard[]>();
    for (const card of allCustomCards) {
      const target = card.target_section || 'custom_cards';
      const list = customCardsBySection.get(target) || [];
      list.push(card);
      customCardsBySection.set(target, list);
    }

    // Hidden section headings (per-section opt-in)
    const hiddenHeadings = new Set(dashboardConfig.hidden_section_headings || []);

    // Build sections
    const overviewSection = createOverviewSection({ someSensorId, showSearchCard, config: dashboardConfig, hass });
    const customCardsSection = createCustomCardsSection(
      customCardsBySection.get('custom_cards') || [],
      dashboardConfig.custom_cards_heading,
      dashboardConfig.custom_cards_icon,
      hiddenHeadings.has('custom_cards')
    );
    const areasSections = createAreasSection(
      visibleAreas,
      groupByFloors,
      hass,
      hiddenHeadings.has('areas'),
      hiddenHeadings.has('areas_other'),
    );

    // Section map: key → section(s) or null
    const sectionMap = new Map<SectionKey, LovelaceSectionConfig | LovelaceSectionConfig[] | null>([
      ['overview', overviewSection],
      ['custom_cards', customCardsSection],
      ['areas', areasSections],
      [
        'weather',
        createWeatherSection(
          weatherEntity ?? null,
          showWeather,
          dashboardConfig.show_weather_forecast_card !== false,
          dashboardConfig.weather_sensors || [],
          dashboardConfig.weather_presentation,
          hiddenHeadings.has('weather')
        ),
      ],
      [
        'energy',
        createEnergySection(
          showEnergy,
          dashboardConfig.energy_link_dashboard !== false,
          dashboardConfig.show_energy_distribution_card !== false,
          hiddenHeadings.has('energy')
        ),
      ],
      ['plants', createPlantsSection(hass, dashboardConfig.show_plants_section === true)],
      ['agenda', createAgendaSection(
        hass,
        dashboardConfig.show_agenda_section === true,
        dashboardConfig.agenda_calendar_entities,
      )],
      ['todos', createTodosSection(hass, dashboardConfig.show_todos_section === true, dashboardConfig.todos_entities)],
      ['persons', createPersonsSection(hass, dashboardConfig.show_persons_section === true)],
      ['vacuums', createVacuumsSection(hass, dashboardConfig.show_vacuums_section === true)],
      ['maintenance', createMaintenanceSection(hass, dashboardConfig.show_maintenance_section === true)],
    ]);

    // Per-section conditional visibility (e.g. show agenda only on workdays).
    const sectionVisibility = dashboardConfig.section_visibility || {};

    // Assemble in configured order, appending assigned custom cards to each section
    const sectionsOrder = normalizeSectionsOrder(dashboardConfig.sections_order ?? DEFAULT_SECTIONS_ORDER);
    const overviewSections: LovelaceSectionConfig[] = [];
    for (const key of sectionsOrder) {
      const rule = Reflect.get(sectionVisibility, key) as { entity?: string; state?: string } | undefined;
      if (rule?.entity) {
        const entState = Reflect.get(hass.states as Record<string, unknown>, rule.entity) as { state?: string } | undefined;
        if (!entState || entState.state !== rule.state) continue;
      }
      const result = sectionMap.get(key);
      if (!result) continue;
      if (Array.isArray(result)) {
        overviewSections.push(...result);
      } else {
        overviewSections.push(result);
      }
      // Append custom cards assigned to this section (skip 'custom_cards' — handled by createCustomCardsSection)
      if (key !== 'custom_cards') {
        const assigned = customCardsBySection.get(key);
        if (assigned && assigned.length > 0) {
          const extraCards = renderCustomCards(assigned);
          if (extraCards.length > 0) {
            // Append to the last section added (handles array sections like areas)
            const lastSection = overviewSections[overviewSections.length - 1];
            if (lastSection.cards) {
              lastSection.cards.push(...extraCards);
            }
          }
        }
      }
    }

    const totalCards = overviewSections.reduce((sum, s) => sum + (s.cards?.length || 0), 0);
    timeEnd('overview-generate');
    debugLog(`Overview: ${overviewSections.length} sections, ${totalCards} cards, ${personBadges.length} badges`);

    // Custom badges from YAML config
    const customBadges = (dashboardConfig.custom_badges || [])
      .filter((b) => b.parsed_config)
      .map((b) => b.parsed_config as LovelaceBadgeConfig);

    // Optional live power badge — auto-hide when entity missing
    const powerBadges: LovelaceBadgeConfig[] = [];
    const powerEntity = dashboardConfig.power_badge_entity;
    if (powerEntity && hass.states[powerEntity]) {
      powerBadges.push({
        type: 'entity',
        entity: powerEntity,
        show_name: false,
        color: 'orange',
      });
    }

    // Optional "unavailable entities" alert badge — count entities whose
    // state is "unavailable", skipping ones the user hid. Auto-hide at zero.
    const alertBadges: LovelaceBadgeConfig[] = [];
    if (dashboardConfig.show_unavailable_alert_badge === true) {
      let count = 0;
      for (const [entityId, state] of Object.entries(hass.states)) {
        if (state.state !== 'unavailable') continue;
        if (Registry.isExcludedByLabel(entityId)) continue;
        if (Registry.isHiddenByConfig(entityId)) continue;
        const entry = Registry.getEntity(entityId);
        if (entry?.hidden) continue;
        count++;
      }
      if (count > 0 && someSensorId) {
        alertBadges.push({
          type: 'entity',
          entity: someSensorId,
          name: String(count),
          icon: 'mdi:alert-circle-outline',
          color: 'red',
          show_state: false,
        });
      }
    }

    // Optional "now playing" badge — first media_player in 'playing' state.
    const nowPlayingBadges: LovelaceBadgeConfig[] = [];
    if (dashboardConfig.show_now_playing_badge === true) {
      const playing = Registry.getVisibleEntityIdsForDomain('media_player').find((id) => {
        const st = Reflect.get(hass.states as Record<string, unknown>, id) as { state?: string } | undefined;
        return st?.state === 'playing';
      });
      if (playing) {
        nowPlayingBadges.push({
          type: 'entity',
          entity: playing,
          icon: 'mdi:play-circle',
          color: 'green',
          show_state: false,
          tap_action: { action: 'more-info' },
        });
      }
    }

    // Optional sun badge — sun.sun + auto next-sunrise/sunset state content.
    // Auto-hide when no sun.sun entity present.
    const sunBadges: LovelaceBadgeConfig[] = [];
    const sunState = Reflect.get(hass.states as Record<string, unknown>, 'sun.sun') as { state?: string } | undefined;
    if (dashboardConfig.show_sun_badge === true && sunState) {
      const isAbove = sunState.state === 'above_horizon';
      sunBadges.push({
        type: 'entity',
        entity: 'sun.sun',
        name: '',
        icon: isAbove ? 'mdi:weather-sunset-down' : 'mdi:weather-sunset-up',
        color: isAbove ? 'amber' : 'indigo',
        tap_action: { action: 'more-info' },
      });
    }

    // Optional "pending updates count" badge — Registry-filtered update.* in state 'on'.
    const updatesBadges: LovelaceBadgeConfig[] = [];
    if (dashboardConfig.show_updates_badge === true) {
      let count = 0;
      let firstId: string | undefined;
      for (const id of Registry.getVisibleEntityIdsForDomain('update')) {
        const st = Reflect.get(hass.states as Record<string, unknown>, id) as { state?: string } | undefined;
        if (st?.state === 'on') {
          count++;
          if (!firstId) firstId = id;
        }
      }
      if (count > 0 && firstId) {
        updatesBadges.push({
          type: 'entity',
          entity: firstId,
          name: String(count),
          icon: 'mdi:update',
          color: 'orange',
          show_state: false,
          tap_action: { action: 'navigate', navigation_path: '/config/updates' },
        });
      }
    }

    return createOverviewView(overviewSections, [
      ...personBadges,
      ...powerBadges,
      ...alertBadges,
      ...nowPlayingBadges,
      ...sunBadges,
      ...updatesBadges,
      ...customBadges,
    ]);
  }
}

customElements.define('ll-strategy-simon42-view-overview', Simon42ViewOverviewStrategy);
