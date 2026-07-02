// ====================================================================
// Badge Builder - Person Badges
// ====================================================================
// Ported from dist/utils/simon42-badge-builder.js with full TypeScript types.
// Creates entity badges for person presence (home / away).
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { LovelaceBadgeConfig } from '../types/lovelace';
import type { PersonData } from '../types/strategy';

export type PersonBadgeLayout = 'minimal' | 'with_state' | 'with_state_and_time';

/**
 * Creates Lovelace entity badges for a list of persons.
 *
 * - Home → green badge (default entity color)
 * - Away → accent/orange badge
 * - Zone-aware: HA's person.state is the zone name when in a non-home
 *   zone (e.g. "Work"), so `state_content: 'state'` surfaces it
 *   automatically — no extra wiring needed
 * - Hidden entities (registry hidden === true) are excluded
 * - Name is trimmed to first name only
 *
 * @param layout 'minimal' = name/picture only; 'with_state' = adds state
 *               (zone or home/away, default); 'with_state_and_time' adds
 *               last_changed too
 */
export function createPersonBadges(
  persons: PersonData[],
  hass: HomeAssistant,
  layout: PersonBadgeLayout = 'with_state',
): LovelaceBadgeConfig[] {
  const badges: LovelaceBadgeConfig[] = [];

  const stateContent: string[] = [];
  if (layout === 'with_state' || layout === 'with_state_and_time') stateContent.push('state');
  if (layout === 'with_state_and_time') stateContent.push('last_changed');

  for (const person of persons) {
    const state = hass.states[person.entity_id];
    if (!state) continue;

    // Registry check: skip if entity is hidden
    const registryEntry = hass.entities[person.entity_id];
    if (registryEntry?.hidden === true) continue;

    const firstName = person.name.split(' ')[0];

    badges.push({
      type: 'entity',
      entity: person.entity_id,
      name: firstName,
      show_entity_picture: true,
      show_state: stateContent.length > 0,
      ...(stateContent.length > 0 ? { state_content: stateContent.length === 1 ? stateContent[0] : stateContent } : {}),
      show_name: true,
      show_icon: true,
      tap_action: { action: 'more-info' },
    } as LovelaceBadgeConfig);
  }

  return badges;
}
