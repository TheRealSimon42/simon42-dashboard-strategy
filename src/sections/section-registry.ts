// ====================================================================
// Section Registry — Single Source of Truth for Overview Sections
// ====================================================================
// PURE DATA — no builder imports! The lazy-loaded editor chunk imports
// this file too; importing builders here would pull them into a chunk
// shared with the editor and break the deliberate main/lit/core/views/
// editor code split (see "Code-Split Chunk Architecture" in CLAUDE.md).
// Builders are wired up in views/OverviewViewStrategy.ts (core chunk).
//
// Adding a new overview section:
//   1. Create the builder in src/sections/<Name>Section.ts
//      (signature convention: returns LovelaceSectionConfig | null,
//       null = auto-hide when empty or disabled)
//   2. Add ONE entry to SECTION_REGISTRY below — its position defines
//      the default section order
//   3. Wire the builder into SECTION_BUILDERS in OverviewViewStrategy.ts
//   4. Add i18n keys (sections.<key> + editor texts) in de/en/ru
//
// Everything else derives from the entry: the SectionKey type, the
// default order, the editor's drag & drop panel, the visibility toggle,
// the per-section visibility rules and the target_section dropdown.
// ====================================================================

import type { Simon42StrategyConfig } from '../types/strategy';

/** Config keys usable as section visibility toggles (boolean flags only). */
type BooleanConfigKey = {
  [K in keyof Simon42StrategyConfig]-?: NonNullable<Simon42StrategyConfig[K]> extends boolean ? K : never;
}[keyof Simon42StrategyConfig];

/**
 * Registry entry for one overview section.
 *
 * `toggle` drives the visibility checkbox in the editor's section order
 * panel: `flag` is the config property, `defaultOn` its default value.
 * Sections without `toggle` are always present (overview, areas) or
 * derive their visibility from content (custom_cards — handled in the
 * editor as an explicit special case).
 */
export interface SectionMeta {
  readonly key: SectionKey;
  /** Icon shown in the editor (drag & drop panel) */
  readonly icon: string;
  /** i18n key for the section label (sections.*) */
  readonly labelKey: string;
  readonly toggle?: {
    readonly flag: BooleanConfigKey;
    readonly defaultOn: boolean;
  };
}

// Internal literal array — `as const` preserves the key literals so
// SectionKey can be derived from the data (single source, no drift).
const REGISTRY = [
  { key: 'overview', icon: 'mdi:home-outline', labelKey: 'sections.overview' },
  { key: 'custom_cards', icon: 'mdi:cards', labelKey: 'sections.custom_cards' },
  { key: 'areas', icon: 'mdi:floor-plan', labelKey: 'sections.areas' },
  {
    key: 'weather',
    icon: 'mdi:weather-partly-cloudy',
    labelKey: 'sections.weather',
    toggle: { flag: 'show_weather', defaultOn: true },
  },
  {
    key: 'energy',
    icon: 'mdi:lightning-bolt',
    labelKey: 'sections.energy',
    toggle: { flag: 'show_energy', defaultOn: true },
  },
  {
    key: 'plants',
    icon: 'mdi:flower-tulip',
    labelKey: 'sections.plants',
    toggle: { flag: 'show_plants_section', defaultOn: false },
  },
  {
    key: 'agenda',
    icon: 'mdi:calendar',
    labelKey: 'sections.agenda',
    toggle: { flag: 'show_agenda_section', defaultOn: false },
  },
  {
    key: 'todos',
    icon: 'mdi:format-list-checks',
    labelKey: 'sections.todos',
    toggle: { flag: 'show_todos_section', defaultOn: false },
  },
  {
    key: 'persons',
    icon: 'mdi:account-group',
    labelKey: 'sections.persons',
    toggle: { flag: 'show_persons_section', defaultOn: false },
  },
  {
    key: 'vacuums',
    icon: 'mdi:robot-vacuum',
    labelKey: 'sections.vacuums',
    toggle: { flag: 'show_vacuums_section', defaultOn: false },
  },
  {
    key: 'maintenance',
    icon: 'mdi:update',
    labelKey: 'sections.maintenance',
    toggle: { flag: 'show_maintenance_section', defaultOn: false },
  },
] as const;

/** Union of all built-in section keys — derived from the registry. */
export type SectionKey = (typeof REGISTRY)[number]['key'];

/** All section metadata in default order. */
export const SECTION_REGISTRY: readonly SectionMeta[] = REGISTRY;

/** Default section order = registry order. */
export const DEFAULT_SECTIONS_ORDER: SectionKey[] = SECTION_REGISTRY.map((m) => m.key);

/** O(1) meta lookup by key (editor: panel, toggles, dropdown). */
export const SECTION_META_BY_KEY: ReadonlyMap<SectionKey, SectionMeta> = new Map(
  SECTION_REGISTRY.map((m) => [m.key, m])
);

/**
 * Whether a section is currently hidden by its registry toggle.
 * Sections without a toggle are never hidden by config.
 */
export function isSectionHiddenByConfig(key: SectionKey, config: Simon42StrategyConfig): boolean {
  const toggle = SECTION_META_BY_KEY.get(key)?.toggle;
  if (!toggle) return false;
  const value = Reflect.get(config, toggle.flag) as boolean | undefined;
  return toggle.defaultOn ? value === false : value !== true;
}
