// ====================================================================
// STATE UTILS — injection-safe hass.states lookups
// ====================================================================
// `hass.states[someVariable]` trips Codacy's detect-object-injection rule
// on every touched line (see CLAUDE.md, Codacy pitfalls). These helpers
// are the one sanctioned way to read a state object by a dynamic id.
// ====================================================================

import type { HomeAssistant, HassEntity } from '../types/homeassistant';

/** State object for an entity id, undefined when HA has no such state. */
export function stateFor(hass: HomeAssistant, entityId: string): HassEntity | undefined {
  return Reflect.get(hass.states, entityId) as HassEntity | undefined;
}

/** True when HA currently has a state object for the entity id. */
export function hasState(hass: HomeAssistant, entityId: string): boolean {
  return stateFor(hass, entityId) !== undefined;
}
