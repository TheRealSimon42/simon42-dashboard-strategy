// ============================================================================
// scene-groups — associate scenes with light groups, gated by colour temperature
// ============================================================================
// Room views currently render every scene of an area as a flat tile block.
// For households whose scenes are authored per light group (Hue rooms/zones,
// HA light groups) that block is noise: scenes of brightness-only groups can
// never change anything a user would recognise as "a scene", and with several
// groups per room nothing tells which scene drives which lights.
//
// This module answers two questions, both as pure functions so they can be
// unit-tested and reused by the card and the room view alike:
//
//   1. Does this light (or light group) support colour temperature?
//      Only then are scenes meaningful — a brightness-only bulb renders every
//      scene identically.
//   2. Which scenes belong to this light group?
//      Deliberately NOT by parsing entity ids or friendly names, and with no
//      config list of its own — the mapping comes from data the integrations
//      provide, so curating scenes where they are authored (the Hue app, the
//      scene editor) is the only place anyone has to curate them:
//        a) scene member list (`attributes.entity_id`) ⊆ group members —
//           HA-native scenes (UI/YAML) carry this
//        b) `attributes.group_name` equals the group's friendly name — the
//           Hue integration exposes the originating room/zone here
//
// Rule (b) is integration metadata, not a name heuristic: both sides are the
// same Hue group name, mirrored into HA by the same integration. Name text is
// used for the chip LABEL only (see sceneLabel), never to decide membership.
// ============================================================================

import type { HassEntity, HomeAssistant } from '../types/homeassistant';

/**
 * Colour modes that make scenes meaningful. Mirrors HA's own capability
 * check for the `light-color-temp` tile feature — deliberately narrow:
 * a false positive (scenes on a bulb that cannot render them) is worse
 * than a false negative, which still leaves the scenes section as fallback.
 */
const COLOR_TEMP_MODES = ['color_temp', 'rgbww'];

/** Reflect.get keeps dynamic state lookups off the object-injection radar. */
function stateFor(hass: HomeAssistant, entityId: string): HassEntity | undefined {
  return Reflect.get(hass.states as Record<string, unknown>, entityId) as HassEntity | undefined;
}

function stringListFor(source: Record<string, unknown> | undefined, key: string): string[] {
  if (!source) return [];
  const value = Reflect.get(source, key);
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function stringFor(source: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!source) return undefined;
  const value = Reflect.get(source, key);
  return typeof value === 'string' ? value : undefined;
}

/**
 * True when the entity can be driven to a colour temperature — either via a
 * supported colour mode or because it reports a Kelvin range (light groups
 * aggregate their members' capabilities into both).
 */
export function supportsColorTemperature(hass: HomeAssistant, lightId: string): boolean {
  const attributes = stateFor(hass, lightId)?.attributes as Record<string, unknown> | undefined;
  if (!attributes) return false;

  const modes = stringListFor(attributes, 'supported_color_modes');
  if (modes.some((mode) => COLOR_TEMP_MODES.includes(mode))) return true;

  // Fallback for integrations that omit the mode list but publish the range.
  const min = Reflect.get(attributes, 'min_color_temp_kelvin');
  const max = Reflect.get(attributes, 'max_color_temp_kelvin');
  return typeof min === 'number' && typeof max === 'number' && max > min;
}

/**
 * Members of a light group. A plain light is its own single member, so
 * callers can treat both uniformly.
 */
export function lightGroupMembers(hass: HomeAssistant, lightId: string): string[] {
  const attributes = stateFor(hass, lightId)?.attributes as Record<string, unknown> | undefined;
  const members = stringListFor(attributes, 'entity_id');
  return members.length > 0 ? members : [lightId];
}

function sceneBelongsToGroup(
  hass: HomeAssistant,
  sceneId: string,
  groupMembers: Set<string>,
  groupName: string | undefined
): boolean {
  const attributes = stateFor(hass, sceneId)?.attributes as Record<string, unknown> | undefined;
  if (!attributes) return false;

  // (a) HA-native scenes: every light the scene touches is part of the group.
  const sceneMembers = stringListFor(attributes, 'entity_id').filter((id) => id.startsWith('light.'));
  if (sceneMembers.length > 0) {
    return sceneMembers.every((id) => groupMembers.has(id));
  }

  // (b) Hue scenes: the integration names the room/zone the scene came from.
  const sceneGroup = stringFor(attributes, 'group_name');
  return sceneGroup !== undefined && groupName !== undefined && sceneGroup === groupName;
}

/**
 * Scenes that belong to `lightId`, sorted by their display label so the chip
 * row is stable across renders. Returns [] when the light cannot render
 * colour temperature — the gate lives here so callers cannot forget it.
 *
 * `sceneIds` is the caller's candidate pool; passing the dashboard's visible
 * scenes is what makes the no_dboard label (and any hidden scene group) apply
 * to chips as well, without this module knowing about either.
 */
export function scenesForLightGroup(hass: HomeAssistant, lightId: string, sceneIds: string[]): string[] {
  if (!supportsColorTemperature(hass, lightId)) return [];

  const members = new Set(lightGroupMembers(hass, lightId));
  const groupAttributes = stateFor(hass, lightId)?.attributes as Record<string, unknown> | undefined;
  const groupName = stringFor(groupAttributes, 'friendly_name');

  return sceneIds
    .filter((sceneId) => sceneBelongsToGroup(hass, sceneId, members, groupName))
    .sort((a, b) => sceneLabel(hass, a, lightId).localeCompare(sceneLabel(hass, b, lightId)));
}

/**
 * Chip label for a scene. Hue publishes the bare scene name ("Entspannen")
 * alongside the prefixed friendly name ("Wohnzimmer Entspannen"); where that
 * is missing we strip the group prefix, mirroring how stripAreaName shortens
 * entity names in room views. Cosmetic only — never used for membership.
 */
export function sceneLabel(hass: HomeAssistant, sceneId: string, lightId?: string): string {
  const attributes = stateFor(hass, sceneId)?.attributes as Record<string, unknown> | undefined;
  const bareName = stringFor(attributes, 'name');
  if (bareName) return bareName;

  const friendly = stringFor(attributes, 'friendly_name') ?? sceneId;
  const groupName = lightId
    ? stringFor(stateFor(hass, lightId)?.attributes as Record<string, unknown> | undefined, 'friendly_name')
    : stringFor(attributes, 'group_name');
  if (groupName && friendly.startsWith(`${groupName} `)) {
    return friendly.slice(groupName.length + 1);
  }
  return friendly;
}
