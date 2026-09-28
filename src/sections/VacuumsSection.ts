// ====================================================================
// Vacuums Section Builder
// ====================================================================
// Renders vacuum.* and lawn_mower.* entities as tiles. Auto-hides when
// none exist.
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { LovelaceCardConfig, LovelaceSectionConfig } from '../types/lovelace';
import { Registry } from '../Registry';
import { localize } from '../utils/localize';
import { hasState } from '../utils/state-utils';

export function createVacuumsSection(
  hass: HomeAssistant,
  enabled: boolean,
  hideHeading: boolean = false
): LovelaceSectionConfig | null {
  if (!enabled) return null;

  const vacuumIds = Registry.getVisibleEntityIdsForDomain('vacuum').filter((id) => hasState(hass, id));
  const mowerIds = Registry.getVisibleEntityIdsForDomain('lawn_mower').filter((id) => hasState(hass, id));
  const entities = [...vacuumIds, ...mowerIds];
  if (entities.length === 0) return null;

  const cards: LovelaceCardConfig[] = [];
  if (!hideHeading) {
    cards.push({
      type: 'heading',
      heading_style: 'title',
      heading: localize('sections.vacuums'),
      icon: 'mdi:robot-vacuum',
    });
  }

  for (const entityId of entities) {
    cards.push({
      type: 'tile',
      entity: entityId,
      vertical: false,
      state_content: ['state', 'last_changed'],
    });
  }

  return { type: 'grid', cards };
}
