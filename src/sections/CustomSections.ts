// ====================================================================
// Custom Sections Builder
// ====================================================================
// Renders user-declared sections from config.custom_sections (overview)
// and areas_options.*.custom_sections (rooms) — the lightweight
// extension hook (see CustomSection in types/strategy.ts for the
// stability contract). Pure functions, covered by unit tests.
//
// Contract since v1.4.0-beta.12: the YAML field takes a COMPLETE
// section config (`type: grid` + `cards:` — exactly what the HA raw
// editor shows for a section). Section-level options like `visibility`
// (evaluated by HA at runtime, unlike our generate-time
// section_visibility) or `column_span` pass straight through.
// Lenient fallbacks so no paste fails:
// - a bare list of cards → wrapped into a grid section
// - a single card (any non-grid `type`) → wrapped into a grid section
// Cards-only pastes and pre-beta.12 configs use the legacy heading/icon
// fields to synthesize a heading card; complete-section pastes ignore
// those fields — the user's YAML is the section.
// ====================================================================

import type { CustomSection, CustomSectionBase, AreaCustomSection } from '../types/strategy';
import type { LovelaceCardConfig, LovelaceSectionConfig } from '../types/lovelace';
import { DEFAULT_SECTIONS_ORDER } from './section-registry';

const BUILTIN_KEYS = new Set<string>(DEFAULT_SECTIONS_ORDER);

function isCardConfig(c: unknown): c is LovelaceCardConfig {
  return !!c && typeof c === 'object' && typeof (c as { type?: unknown }).type === 'string';
}

interface NormalizedSectionYaml {
  /** Raw card list (still unvalidated — entries may be malformed) */
  cards: readonly unknown[];
  /** The full section object for passthrough of section-level props
   *  (visibility, column_span, …) — null in the cards-only/legacy form */
  sectionProps: Record<string, unknown> | null;
}

/**
 * Classifies the parsed YAML of a custom section.
 *
 * - Array → list of cards (legacy/cards-only form)
 * - Object with `cards:` array and `type: grid` (or no type) → complete
 *   section, section-level props pass through
 * - Any other object → single card, wrapped
 * - Everything else → null (unusable)
 *
 * Edge case: a grid CARD at top level is indistinguishable from a grid
 * section and is treated as a section — put it in a list (`- type: grid`)
 * to force the card interpretation.
 */
export function normalizeSectionYaml(parsed: unknown): NormalizedSectionYaml | null {
  if (Array.isArray(parsed)) return { cards: parsed, sectionProps: null };
  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;
  const looksLikeSection =
    (obj.type === 'grid' || typeof obj.type !== 'string') && Array.isArray(obj.cards);
  if (looksLikeSection) {
    return { cards: obj.cards as readonly unknown[], sectionProps: obj };
  }
  return { cards: [obj], sectionProps: null };
}

/**
 * Whether the section's YAML yields at least one valid card — the shared
 * definition of "empty" for auto-hide (builder) and the greyed-out state
 * in the editor's section-order panel.
 */
export function customSectionHasCards(section: CustomSectionBase): boolean {
  const normalized = normalizeSectionYaml(section.parsed_config);
  return !!normalized && normalized.cards.some(isCardConfig);
}

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
 * via target_section), in which case the section shell is returned so
 * the assembly loop can append the assigned cards.
 *
 * Defensive: parsed_config comes from user YAML; card entries without a
 * string `type` (the one thing every Lovelace card config requires) are
 * dropped. Section-level props are passthrough — their contract is
 * Lovelace's section schema, not ours.
 */
export function buildCustomSection(
  section: CustomSectionBase,
  hasAssignedCards: boolean = false
): LovelaceSectionConfig | null {
  const normalized = normalizeSectionYaml(section.parsed_config);
  const rawCards: readonly unknown[] = normalized ? normalized.cards : [];
  const validCards = rawCards.filter(isCardConfig);
  if (validCards.length === 0 && !hasAssignedCards) return null;

  if (normalized?.sectionProps) {
    // Complete-section form: heading card, visibility, column_span etc.
    // all come from the user's YAML; legacy heading/icon fields are ignored.
    return { type: 'grid', ...normalized.sectionProps, cards: validCards } as LovelaceSectionConfig;
  }

  // Cards-only form: synthesize the heading card from the legacy fields.
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
 * (same rules as buildCustomSection).
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
