// ====================================================================
// Badge Builder - Person Badges
// ====================================================================
// Ported from dist/utils/simon42-badge-builder.js with full TypeScript types.
// Creates entity badges for person presence (home / away).
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { LovelaceBadgeConfig } from '../types/lovelace';
import type { PersonData } from '../types/strategy';

/**
 * Creates Lovelace entity badges for a list of persons.
 *
 * - Home → green badge (default entity color)
 * - Away → accent/orange badge
 * - Hidden entities (registry hidden === true) are excluded
 * - Name is trimmed to first name only
 */
export function createPersonBadges(persons: PersonData[], hass: HomeAssistant): LovelaceBadgeConfig[] {
  const badges: LovelaceBadgeConfig[] = [];

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
      show_state: true,
      state_content: 'state',
      show_name: true,
      show_icon: true,
      tap_action: { action: 'more-info' },
    } as LovelaceBadgeConfig);
  }

  return badges;
}
