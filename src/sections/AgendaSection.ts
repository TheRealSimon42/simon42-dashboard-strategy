// ====================================================================
// Agenda Section Builder
// ====================================================================
// Renders an "Agenda" section on the overview using HA's built-in
// `calendar` card. Auto-hides when no calendar.* entities exist.
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { LovelaceCardConfig, LovelaceSectionConfig } from '../types/lovelace';
import { Registry } from '../Registry';
import { localize } from '../utils/localize';

/**
 * Creates the agenda section.
 * Returns null when there are no calendar entities (or none selected),
 * even if the toggle is enabled — modular auto-hide.
 *
 * @param hass HA state
 * @param enabled toggle from config
 * @param calendarEntities optional explicit list (config). When empty/undefined,
 *                        all calendar.* entities are included.
 * @param hideHeading whether the section heading should be suppressed
 */
export function createAgendaSection(
  hass: HomeAssistant,
  enabled: boolean,
  calendarEntities: string[] | undefined,
  hideHeading: boolean = false
): LovelaceSectionConfig | null {
  if (!enabled) return null;

  // All calendar.* entities visible in this hass instance (no_dboard / hidden filtered)
  const visible = Registry.getVisibleEntityIdsForDomain('calendar').filter(
    (id) => hass.states[id] !== undefined
  );

  // Pick configured list (filtered to existing) OR fall back to all visible
  let selected: string[];
  if (Array.isArray(calendarEntities) && calendarEntities.length > 0) {
    selected = calendarEntities.filter((id) => visible.includes(id));
  } else {
    selected = visible;
  }

  if (selected.length === 0) return null;

  const cards: LovelaceCardConfig[] = [];
  if (!hideHeading) {
    cards.push({
      type: 'heading',
      heading_style: 'title',
      heading: localize('sections.agenda'),
      icon: 'mdi:calendar',
    });
  }

  // HA's built-in calendar card. initial_view 'listWeek' gives a compact upcoming-list
  // appearance; for a single calendar, the card naturally shows just that one.
  cards.push({
    type: 'calendar',
    entities: selected,
    initial_view: 'listWeek',
  });

  return { type: 'grid', cards };
}
