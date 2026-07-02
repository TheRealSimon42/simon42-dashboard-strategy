// ====================================================================
// Todos Section Builder
// ====================================================================
// Renders one HA-native `todo-list` card per selected todo.* entity.
// Auto-hides when no todo entities exist or none are selected.
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { LovelaceCardConfig, LovelaceSectionConfig } from '../types/lovelace';
import { Registry } from '../Registry';
import { localize } from '../utils/localize';

/**
 * Creates the todos section.
 * Returns null when no todo.* entities exist or all configured ones are
 * missing — modular auto-hide.
 *
 * @param hass HA state
 * @param enabled toggle from config
 * @param todoEntities optional explicit list (config). When empty/undefined,
 *                     all visible todo.* entities are included.
 * @param hideHeading suppress the section heading
 */
export function createTodosSection(
  hass: HomeAssistant,
  enabled: boolean,
  todoEntities: string[] | undefined,
  hideHeading: boolean = false
): LovelaceSectionConfig | null {
  if (!enabled) return null;

  const visible = Registry.getVisibleEntityIdsForDomain('todo').filter(
    (id) => hass.states[id] !== undefined
  );

  let selected: string[];
  if (Array.isArray(todoEntities) && todoEntities.length > 0) {
    selected = todoEntities.filter((id) => visible.includes(id));
  } else {
    selected = visible;
  }

  if (selected.length === 0) return null;

  const cards: LovelaceCardConfig[] = [];
  if (!hideHeading) {
    cards.push({
      type: 'heading',
      heading_style: 'title',
      heading: localize('sections.todos'),
      icon: 'mdi:format-list-checks',
    });
  }

  // One todo-list card per selected entity. HA's built-in todo-list card
  // shows pending items inline with checkboxes and an add-item field.
  for (const entityId of selected) {
    cards.push({
      type: 'todo-list',
      entity: entityId,
    });
  }

  return { type: 'grid', cards };
}
