// ====================================================================
// Plants Section Builder
// ====================================================================
// Renders a "Plants" section on the overview when the user has plant.*
// entities. Auto-hides when none exist, regardless of the toggle.
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { LovelaceCardConfig, LovelaceSectionConfig } from '../types/lovelace';
import { Registry } from '../Registry';
import { localize } from '../utils/localize';

/**
 * Creates the plants section.
 * Returns null when there are no plant.* entities in HA, even if the
 * toggle is enabled — modular auto-hide.
 */
export function createPlantsSection(
  hass: HomeAssistant,
  enabled: boolean,
  hideHeading: boolean = false
): LovelaceSectionConfig | null {
  if (!enabled) return null;

  const plantIds = Registry.getVisibleEntityIdsForDomain('plant').filter(
    (id) => hass.states[id] !== undefined
  );
  if (plantIds.length === 0) return null;

  const cards: LovelaceCardConfig[] = [];
  if (!hideHeading) {
    cards.push({
      type: 'heading',
      heading_style: 'title',
      heading: localize('sections.plants'),
      icon: 'mdi:flower-tulip',
    });
  }

  for (const entityId of plantIds) {
    cards.push({
      type: 'tile',
      entity: entityId,
      vertical: false,
      state_content: ['state'],
    });
  }

  return { type: 'grid', cards };
}
