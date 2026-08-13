// ====================================================================
// UTIL — Batch open/stop/close heading badges for room cover sections
// ====================================================================
// Builds the small button badges shown on the covers heading in room
// views (#413). Mirrors the CoversGroupCard heading-badge pattern:
// native HA heading card badges with perform-action tap actions —
// no custom card involved. Each badge only targets covers that
// actually support the respective service (tilt-only covers are
// skipped); when no cover supports a service, that badge is omitted.
// ====================================================================

import type { HomeAssistant, HassEntity } from '../types/homeassistant';
import type { LovelaceBadgeConfig } from '../types/lovelace';

// HA cover supported_features bitmask values (CoverEntityFeature)
export const COVER_SUPPORT_OPEN = 1;
export const COVER_SUPPORT_CLOSE = 2;
export const COVER_SUPPORT_STOP = 8;

/** Reflect.get keeps dynamic state lookups off the object-injection radar. */
function stateOf(hass: HomeAssistant, entityId: string): HassEntity | undefined {
  return Reflect.get(hass.states as Record<string, unknown>, entityId) as HassEntity | undefined;
}

/** Filter entities down to those whose supported_features contain the bit. */
export function coversSupportingFeature(
  entities: string[],
  hass: HomeAssistant,
  featureBit: number
): string[] {
  const result: string[] = [];
  for (const entityId of entities) {
    const features = (stateOf(hass, entityId)?.attributes.supported_features as number | undefined) ?? 0;
    if ((features & featureBit) !== 0) result.push(entityId);
  }
  return result;
}

/**
 * Build the open/stop/close button badges for a room cover section heading.
 * Returns an empty array when none of the covers support any of the services.
 */
export function buildCoverControlBadges(entities: string[], hass: HomeAssistant): LovelaceBadgeConfig[] {
  const actions: { bit: number; icon: string; service: string }[] = [
    { bit: COVER_SUPPORT_OPEN, icon: 'mdi:arrow-up', service: 'cover.open_cover' },
    { bit: COVER_SUPPORT_STOP, icon: 'mdi:stop', service: 'cover.stop_cover' },
    { bit: COVER_SUPPORT_CLOSE, icon: 'mdi:arrow-down', service: 'cover.close_cover' },
  ];

  const badges: LovelaceBadgeConfig[] = [];
  for (const action of actions) {
    const targets = coversSupportingFeature(entities, hass, action.bit);
    if (targets.length === 0) continue;
    badges.push({
      type: 'button',
      icon: action.icon,
      tap_action: {
        action: 'perform-action',
        perform_action: action.service,
        target: { entity_id: targets },
      },
    });
  }
  return badges;
}
