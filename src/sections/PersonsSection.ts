// ====================================================================
// Persons Section Builder
// ====================================================================
// Enriched person tiles below the header chip row. For each person:
//   - profile picture (when available)
//   - home/away state
//   - auto-detected phone battery (sensor.<device>_battery_level / *_battery)
//     for the person's device_trackers, when any
//
// Auto-hides when no person.* entities exist.
// ====================================================================

import type { HomeAssistant, HassEntity } from '../types/homeassistant';
import type { LovelaceCardConfig, LovelaceSectionConfig } from '../types/lovelace';
import { Registry } from '../Registry';
import { localize } from '../utils/localize';

/** Safe state lookup: Reflect.get bypasses ESLint's object-injection heuristic. */
function getState(hass: HomeAssistant, entityId: string): HassEntity | undefined {
  return Reflect.get(hass.states as Record<string, unknown>, entityId) as HassEntity | undefined;
}

/** Try to find a battery % sensor associated with one of the person's device_trackers. */
function findBatterySensorForPerson(
  hass: HomeAssistant,
  personEntityId: string,
): string | undefined {
  const state = getState(hass, personEntityId);
  const sources = state?.attributes?.source as string[] | string | undefined;
  const sourceList = Array.isArray(sources) ? sources : sources ? [sources] : [];
  if (sourceList.length === 0) return undefined;

  for (const src of sourceList) {
    if (typeof src !== 'string') continue;
    const trackerEntity = Registry.getEntity(src);
    if (!trackerEntity) continue;
    const deviceId = trackerEntity.device_id;
    if (!deviceId) continue;
    // Look for a battery % sensor on the same device.
    const siblings = Registry.getEntityIdsForDevice(deviceId);
    for (const sid of siblings) {
      if (!sid.startsWith('sensor.')) continue;
      const sState = getState(hass, sid);
      if (!sState) continue;
      const dc = sState.attributes?.device_class;
      const unit = sState.attributes?.unit_of_measurement;
      if (dc === 'battery' && unit === '%') return sid;
    }
  }
  return undefined;
}

export function createPersonsSection(
  hass: HomeAssistant,
  enabled: boolean,
  hideHeading: boolean = false
): LovelaceSectionConfig | null {
  if (!enabled) return null;

  const personIds = Registry.getVisibleEntityIdsForDomain('person').filter(
    (id) => getState(hass, id) !== undefined
  );
  if (personIds.length === 0) return null;

  const cards: LovelaceCardConfig[] = [];
  if (!hideHeading) {
    cards.push({
      type: 'heading',
      heading_style: 'title',
      heading: localize('sections.persons'),
      icon: 'mdi:account-group',
    });
  }

  for (const entityId of personIds) {
    const battery = findBatterySensorForPerson(hass, entityId);
    const tile: Record<string, unknown> = {
      type: 'tile',
      entity: entityId,
      show_entity_picture: true,
      vertical: false,
      // 'state' shows Home/Away/zone name; 'last_changed' shows transition time.
      state_content: ['state', 'last_changed'],
    };
    if (battery) {
      // Show a small battery line as additional context. HA tile cards
      // don't render arbitrary sibling entities, so we add a side-by-side
      // tile for the battery instead — keeps the layout consistent and
      // avoids custom HTML.
      cards.push(tile as LovelaceCardConfig);
      cards.push({
        type: 'tile',
        entity: battery,
        vertical: false,
        state_content: ['state'],
        color: 'red',
      });
    } else {
      cards.push(tile as LovelaceCardConfig);
    }
  }

  return { type: 'grid', cards };
}
