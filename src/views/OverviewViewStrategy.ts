// ====================================================================
// VIEW STRATEGY — OVERVIEW (main dashboard view)
// ====================================================================
// Extracted from the dashboard entry point so HA can resolve this view
// concurrently with other view strategies via Promise.all, enabling
// progressive rendering instead of blocking on Registry init.
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { Simon42StrategyConfig, SectionKey, SectionOrderKey, CustomCard, HeadingKey } from '../types/strategy';
import { DEFAULT_SECTIONS_ORDER } from '../types/strategy';
import { validateCustomSections, buildCustomSection } from '../sections/CustomSections';
import type { LovelaceViewConfig, LovelaceSectionConfig, LovelaceBadgeConfig, LovelaceCardConfig } from '../types/lovelace';
import type { AreaRegistryEntry } from '../types/registries';
import { Registry } from '../Registry';
import { collectPersons, findWeatherEntity, findDummySensor } from '../utils/entity-filter';
import { getVisibleAreas } from '../utils/name-utils';
import { createPersonBadges } from '../utils/badge-builder';
import { createOverviewSection, createCustomCardsSection } from '../sections/OverviewSection';
import { createAreasSection } from '../sections/AreasSection';
import { createWeatherSection, createEnergySection, buildPollenCard } from '../sections/WeatherEnergySection';
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
 * Valid keys = section registry (single source of truth) + validated
 * custom_sections keys. Custom sections the user didn't position
 * explicitly are appended after the built-ins.
 */
function normalizeSectionsOrder(order: SectionOrderKey[], customKeys: string[]): string[] {
  const validKeys = new Set<string>([...DEFAULT_SECTIONS_ORDER, ...customKeys]);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const key of order) {
    if (validKeys.has(key) && !seen.has(key)) {
      result.push(key);
      seen.add(key);
    }
  }
  for (const key of DEFAULT_SECTIONS_ORDER) {
    if (!seen.has(key)) result.push(key);
  }
  for (const key of customKeys) {
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

/**
 * Precomputed inputs shared by all section builders — assembled once per
 * generate() run, then handed to each SECTION_BUILDERS entry.
 */
interface SectionBuildContext {
  hass: HomeAssistant;
  config: Simon42StrategyConfig;
  /** Headings hidden via hidden_section_headings */
  hiddenHeadings: Set<HeadingKey>;
  /** Areas filtered + sorted by config */
  visibleAreas: AreaRegistryEntry[];
  /** Resolved weather entity (config override or auto-discovery) */
  weatherEntity: string | null;
  /** Dummy sensor for entity-less cards */
  someSensorId: string;
  /** custom_cards grouped by target_section (built-in or custom key) */
  customCardsBySection: Map<string, CustomCard[]>;
}

type SectionBuilder = (ctx: SectionBuildContext) => LovelaceSectionConfig | LovelaceSectionConfig[] | null;

// Builder wiring: one entry per SECTION_REGISTRY key. Lives here (core
// chunk) and deliberately NOT in section-registry.ts, so the lazy editor
// chunk never pulls the builders in. When adding a section, add its
// registry entry AND a builder entry here (see section-registry.ts).
//
// Typed as Record<SectionKey, ...>: TypeScript rejects a missing or
// unknown key, so a registry entry without a builder (or vice versa)
// is a compile error, not a silently empty section.
const SECTION_BUILDER_IMPL: Record<SectionKey, SectionBuilder> = {
  overview: ({ hass, config, someSensorId }) =>
    createOverviewSection({ someSensorId, showSearchCard: config.show_search_card === true, config, hass }),
  custom_cards: ({ config, customCardsBySection, hiddenHeadings }) =>
    createCustomCardsSection(
      customCardsBySection.get('custom_cards') || [],
      config.custom_cards_heading,
      config.custom_cards_icon,
      hiddenHeadings.has('custom_cards')
    ),
  areas: ({ hass, config, visibleAreas, hiddenHeadings }) =>
    createAreasSection(
      visibleAreas,
      config.group_by_floors === true,
      hass,
      hiddenHeadings.has('areas'),
      hiddenHeadings.has('areas_other')
    ),
  weather: ({ hass, config, weatherEntity, hiddenHeadings }) =>
    createWeatherSection(
      weatherEntity,
      config.show_weather !== false,
      config.show_weather_forecast_card !== false,
      config.weather_sensors || [],
      config.weather_presentation,
      hiddenHeadings.has('weather'),
      config.show_pollen_card === true ? buildPollenCard(hass) : null
    ),
  energy: ({ config, hiddenHeadings }) =>
    createEnergySection(
      config.show_energy !== false,
      config.energy_link_dashboard !== false,
      config.show_energy_distribution_card !== false,
      hiddenHeadings.has('energy')
    ),
  plants: ({ hass, config }) => createPlantsSection(hass, config.show_plants_section === true),
  agenda: ({ hass, config }) =>
    createAgendaSection(hass, config.show_agenda_section === true, config.agenda_calendar_entities),
  todos: ({ hass, config }) =>
    createTodosSection(hass, config.show_todos_section === true, config.todos_entities),
  persons: ({ hass, config }) => createPersonsSection(hass, config.show_persons_section === true),
  vacuums: ({ hass, config }) => createVacuumsSection(hass, config.show_vacuums_section === true),
  maintenance: ({ hass, config }) => createMaintenanceSection(hass, config.show_maintenance_section === true),
};

// Map wrapper for dynamic key lookup (avoids obj[variable] access)
const SECTION_BUILDERS = new Map<SectionKey, SectionBuilder>(
  Object.entries(SECTION_BUILDER_IMPL) as [SectionKey, SectionBuilder][]
);

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

    // Group custom cards by target section (built-in OR custom_sections key)
    const allCustomCards = dashboardConfig.custom_cards || [];
    const customCardsBySection = new Map<string, CustomCard[]>();
    for (const card of allCustomCards) {
      const target = card.target_section || 'custom_cards';
      const list = customCardsBySection.get(target) || [];
      list.push(card);
      customCardsBySection.set(target, list);
    }

    // User-declared custom sections (validated: no built-in collisions,
    // duplicates first-wins). Built lazily in the assembly loop below.
    const customSections = validateCustomSections(dashboardConfig.custom_sections);
    const customSectionByKey = new Map(customSections.map((cs) => [cs.key, cs]));

    // Everything the section builders need, precomputed once
    const ctx: SectionBuildContext = {
      hass,
      config: dashboardConfig,
      hiddenHeadings: new Set(dashboardConfig.hidden_section_headings || []),
      visibleAreas,
      weatherEntity: weatherEntity ?? null,
      someSensorId,
      customCardsBySection,
    };

    // Per-section conditional visibility (e.g. show agenda only on workdays).
    const sectionVisibility = dashboardConfig.section_visibility || {};

    // Assemble in configured order, appending assigned custom cards to each section
    const sectionsOrder = normalizeSectionsOrder(
      dashboardConfig.sections_order ?? DEFAULT_SECTIONS_ORDER,
      customSections.map((cs) => cs.key)
    );
    const overviewSections: LovelaceSectionConfig[] = [];
    for (const key of sectionsOrder) {
      const rule = Reflect.get(sectionVisibility, key) as { entity?: string; state?: string } | undefined;
      if (rule?.entity) {
        const entState = Reflect.get(hass.states as Record<string, unknown>, rule.entity) as { state?: string } | undefined;
        if (!entState || entState.state !== rule.state) continue;
      }
      // Built-in sections come from the builder map; unknown keys are
      // user-declared custom sections (normalize guarantees one of the two).
      const builder = SECTION_BUILDERS.get(key as SectionKey);
      const customSection = customSectionByKey.get(key);
      const result = builder
        ? builder(ctx)
        : customSection
          ? buildCustomSection(customSection, (customCardsBySection.get(key)?.length ?? 0) > 0)
          : null;
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
