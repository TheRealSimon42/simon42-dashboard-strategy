// ====================================================================
// Custom Sections Builder
// ====================================================================
// Renders user-declared overview sections from config.custom_sections —
// the lightweight extension hook (see CustomSection in types/strategy.ts
// for the stability contract). Pure functions, covered by unit tests.
// ====================================================================

import type { CustomSection, CustomSectionBase, AreaCustomSection } from '../types/strategy';
import type { LovelaceCardConfig, LovelaceSectionConfig } from '../types/lovelace';
import { DEFAULT_SECTIONS_ORDER } from './section-registry';

const BUILTIN_KEYS = new Set<string>(DEFAULT_SECTIONS_ORDER);

/**
 * Filters config.custom_sections down to usable entries:
 * - key must be a non-empty string
 * - keys colliding with built-in sections are dropped (built-in wins)
 * - duplicate keys: first entry wins
 *
 * Input is treated as unknown-shaped: the array comes straight from user
 * YAML, so entries may be null or malformed despite the declared type.
 */
export function validateCustomSections(raw: CustomSection[] | undefined): CustomSection[] {
  const entries: readonly unknown[] = Array.isArray(raw) ? raw : [];
  const seen = new Set<string>();
  const result: CustomSection[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const section = entry as CustomSection;
    if (typeof section.key !== 'string' || section.key.trim() === '') continue;
    if (BUILTIN_KEYS.has(section.key)) continue;
    if (seen.has(section.key)) continue;
    seen.add(section.key);
    result.push(section);
  }
  return result;
}

/**
 * Builds the LovelaceSectionConfig for one custom section.
 *
 * Returns null (auto-hide) when the section has no valid own cards —
 * unless `hasAssignedCards` is true (custom_cards targeting this section
 * via target_section), in which case a heading-only section is returned
 * so the assembly loop can append the assigned cards.
 *
 * Defensive: parsed_config comes from the editor's YAML parse; entries
 * without a string `type` (the one thing every Lovelace card config
 * requires) are dropped.
 */
export function buildCustomSection(
  section: CustomSectionBase,
  hasAssignedCards: boolean = false
): LovelaceSectionConfig | null {
  // unknown-shaped: parsed_config comes from user YAML, entries may be null
  const parsed: readonly unknown[] = Array.isArray(section.parsed_config) ? section.parsed_config : [];
  const validCards = parsed.filter(
    (c): c is LovelaceCardConfig =>
      !!c && typeof c === 'object' && typeof (c as { type?: unknown }).type === 'string'
  );
  if (validCards.length === 0 && !hasAssignedCards) return null;

  const cards: LovelaceCardConfig[] = [];
  if (section.heading) {
    cards.push({
      type: 'heading',
      heading: section.heading,
      heading_style: 'title',
      ...(section.icon ? { icon: section.icon } : {}),
    });
  }
  cards.push(...validCards);
  return { type: 'grid', cards };
}

/**
 * Builds the room-view custom sections for one placement slot.
 * Entries default to 'bottom'; malformed/empty entries are dropped
 * (same defensive rules as buildCustomSection).
 */
export function buildAreaCustomSections(
  raw: AreaCustomSection[] | undefined,
  position: 'top' | 'bottom'
): LovelaceSectionConfig[] {
  const entries: readonly unknown[] = Array.isArray(raw) ? raw : [];
  const result: LovelaceSectionConfig[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const section = entry as AreaCustomSection;
    if ((section.position ?? 'bottom') !== position) continue;
    const built = buildCustomSection(section);
    if (built) result.push(built);
  }
  return result;
}
