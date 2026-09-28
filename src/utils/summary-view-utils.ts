// ====================================================================
// SUMMARY VIEW UTILS
// ====================================================================
// Single source of truth for "does the utility view exist?" (#391).
// A summary view is generated when its summary tile is enabled OR when
// the user opted into the standalone view flag (show_*_view) — the
// pattern established by show_battery_view (#315/#320). Used by the
// dashboard strategy (view generation), the editor's view-visibility
// panel (offered rules mirror generate()) and the maintenance view
// (deep-link only when the target view exists).
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { Simon42StrategyConfig } from '../types/strategy';
import { isEntityCurrentlyAvailable } from './availability-utils';

export type UtilityViewKey = 'lights' | 'covers' | 'security' | 'batteries' | 'climate';

/**
 * True when the given utility view is part of the generated dashboard.
 * Defaults match the summary tiles: lights/covers/security/batteries
 * are opt-out, climate is opt-in. The show_*_view flags (all default
 * false) keep the view available even when its summary tile is hidden.
 */
export function isUtilityViewEnabled(config: Simon42StrategyConfig, view: UtilityViewKey): boolean {
  switch (view) {
    case 'lights':
      return config.show_light_summary !== false || config.show_light_view === true;
    case 'covers':
      return config.show_covers_summary !== false || config.show_covers_view === true;
    case 'security':
      return config.show_security_summary !== false || config.show_security_view === true;
    case 'batteries':
      return config.show_battery_summary !== false || config.show_battery_view === true;
    case 'climate':
      return config.show_climate_summary === true || config.show_climate_view === true;
  }
}

export function countActiveClimateEntities(
  hass: HomeAssistant,
  entityIds: Set<string> | null,
  config: Simon42StrategyConfig
): number {
  let count = 0;
  if (!entityIds) return count;
  for (const id of entityIds) {
    if (!isEntityCurrentlyAvailable(hass, id, config)) continue;
    const state = Reflect.get(hass.states as Record<string, unknown>, id) as
      | { state?: string; attributes?: Record<string, unknown> }
      | undefined;
    if (!state) continue;
    const hvacState = state.state;
    if (!hvacState || hvacState === 'off' || hvacState === 'unavailable' || hvacState === 'unknown') continue;
    const hvacAction = state.attributes?.hvac_action as string | undefined;
    if (hvacAction === 'idle' || hvacAction === 'off') continue;
    count++;
  }
  return count;
}
