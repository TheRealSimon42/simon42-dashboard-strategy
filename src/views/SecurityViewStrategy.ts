// ====================================================================
// VIEW STRATEGY — SECURITY (Locks, Doors, Garages, Windows, Smoke/Gas)
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { LovelaceViewConfig, LovelaceCardConfig, LovelaceSectionConfig } from '../types/lovelace';
import { Registry } from '../Registry';
import { localize } from '../utils/localize';
import { SECURITY_EXCLUDED_PLATFORMS } from '../utils/entity-filter';

class Simon42ViewSecurityStrategy extends HTMLElement {
  static async generate(config: any, hass: HomeAssistant): Promise<LovelaceViewConfig> {
    // Ensure Registry is initialized (idempotent — no-op if already done)
    Registry.initialize(hass, config.config || {});

    // Use pre-filtered visible entities from Registry
    // Covers lock, cover, binary_sensor domains across all areas
    const allVisibleByDomain = (domain: string) => Registry.getVisibleEntityIdsForDomain(domain);

    // Categorize entities
    const locks: string[] = [];
    const doors: string[] = [];
    const garages: string[] = [];
    const windows: string[] = [];
    const smokeGas: string[] = [];

    for (const id of [
      ...allVisibleByDomain('lock'),
      ...allVisibleByDomain('cover'),
      ...allVisibleByDomain('binary_sensor'),
    ]) {
      if (!hass.states[id]) continue;

      const state = hass.states[id];
      const deviceClass = state.attributes?.device_class;

      if (id.startsWith('lock.')) {
        locks.push(id);
      } else if (id.startsWith('cover.')) {
        if (deviceClass === 'garage') garages.push(id);
        else if (deviceClass === 'door' || deviceClass === 'gate' || deviceClass === 'window') doors.push(id);
      } else if (id.startsWith('binary_sensor.')) {
        const entry = Registry.getEntity(id);
        if (entry?.platform && SECURITY_EXCLUDED_PLATFORMS.has(entry.platform)) continue;
        if (deviceClass && ['door', 'window', 'garage_door', 'opening'].includes(deviceClass)) windows.push(id);
        else if (deviceClass && ['smoke', 'gas'].includes(deviceClass)) smokeGas.push(id);
      }
    }

    const sections: LovelaceSectionConfig[] = [];

    // Locks
    if (locks.length > 0) {
      const unlocked = locks.filter((e) => hass.states[e]?.state === 'unlocked');
      const locked = locks.filter((e) => hass.states[e]?.state === 'locked');
      const cards: LovelaceCardConfig[] = [];

      if (unlocked.length > 0) {
        cards.push({
          type: 'heading',
          heading: localize('security.locks_unlocked'),
          heading_style: 'subtitle',
          icon: 'mdi:lock-open',
          badges: [
            {
              type: 'entity',
              entity: unlocked[0],
              show_name: false,
              show_state: false,
              tap_action: { action: 'perform-action', perform_action: 'lock.lock', target: { entity_id: unlocked } },
              icon: 'mdi:lock',
            },
          ],
        });
        cards.push(
          ...unlocked.map((e) => ({
            type: 'tile',
            entity: e,
            features: [{ type: 'lock-commands' }],
            state_content: 'last_changed',
          }))
        );
      }
      if (locked.length > 0) {
        cards.push({ type: 'heading', heading: localize('security.locks_locked'), heading_style: 'subtitle', icon: 'mdi:lock' });
        cards.push(
          ...locked.map((e) => ({
            type: 'tile',
            entity: e,
            features: [{ type: 'lock-commands' }],
            state_content: 'last_changed',
          }))
        );
      }
      if (cards.length > 0) sections.push({ type: 'grid', cards });
    }

    // Doors/Gates
    if (doors.length > 0) {
      const open = doors.filter((e) => hass.states[e]?.state === 'open');
      const closed = doors.filter((e) => hass.states[e]?.state === 'closed');
      const cards: LovelaceCardConfig[] = [];

      if (open.length > 0) {
        cards.push({
          type: 'heading',
          heading: localize('security.doors_open'),
          heading_style: 'subtitle',
          icon: 'mdi:door-open',
          badges: [
            {
              type: 'entity',
              entity: open[0],
              show_name: false,
              show_state: false,
              tap_action: {
                action: 'perform-action',
                perform_action: 'cover.close_cover',
                target: { entity_id: open },
              },
              icon: 'mdi:arrow-down',
            },
          ],
        });
        cards.push(
          ...open.map((e) => ({
            type: 'tile',
            entity: e,
            features: [{ type: 'cover-open-close' }],
            features_position: 'inline',
            state_content: 'last_changed',
          }))
        );
      }
      if (closed.length > 0) {
        cards.push({ type: 'heading', heading: localize('security.doors_closed'), heading_style: 'subtitle', icon: 'mdi:door-closed' });
        cards.push(
          ...closed.map((e) => ({
            type: 'tile',
            entity: e,
            features: [{ type: 'cover-open-close' }],
            features_position: 'inline',
            state_content: 'last_changed',
          }))
        );
      }
      if (cards.length > 0) sections.push({ type: 'grid', cards });
    }

    // Garages
    if (garages.length > 0) {
      const open = garages.filter((e) => hass.states[e]?.state === 'open');
      const closed = garages.filter((e) => hass.states[e]?.state === 'closed');
      const cards: LovelaceCardConfig[] = [];

      if (open.length > 0) {
        cards.push({
          type: 'heading',
          heading: localize('security.garages_open'),
          heading_style: 'subtitle',
          icon: 'mdi:garage-open',
          badges: [
            {
              type: 'entity',
              entity: open[0],
              show_name: false,
              show_state: false,
              tap_action: {
                action: 'perform-action',
                perform_action: 'cover.close_cover',
                target: { entity_id: open },
              },
              icon: 'mdi:arrow-down',
            },
          ],
        });
        cards.push(
          ...open.map((e) => ({
            type: 'tile',
            entity: e,
            features: [{ type: 'cover-open-close' }],
            features_position: 'inline',
            state_content: 'last_changed',
          }))
        );
      }
      if (closed.length > 0) {
        cards.push({ type: 'heading', heading: localize('security.garages_closed'), heading_style: 'subtitle', icon: 'mdi:garage' });
        cards.push(
          ...closed.map((e) => ({
            type: 'tile',
            entity: e,
            features: [{ type: 'cover-open-close' }],
            features_position: 'inline',
            state_content: 'last_changed',
          }))
        );
      }
      if (cards.length > 0) sections.push({ type: 'grid', cards });
    }

    // Windows/Openings
    if (windows.length > 0) {
      const open = windows.filter((e) => hass.states[e]?.state === 'on');
      const closed = windows.filter((e) => hass.states[e]?.state === 'off');
      const cards: LovelaceCardConfig[] = [];

      if (open.length > 0) {
        cards.push({ type: 'heading', heading: localize('security.windows_open'), heading_style: 'subtitle', icon: 'mdi:window-open' });
        cards.push(...open.map((e) => ({ type: 'tile', entity: e, state_content: 'last_changed' })));
      }
      if (closed.length > 0) {
        cards.push({ type: 'heading', heading: localize('security.windows_closed'), heading_style: 'subtitle', icon: 'mdi:window-closed' });
        cards.push(...closed.map((e) => ({ type: 'tile', entity: e, state_content: 'last_changed' })));
      }
      if (cards.length > 0) sections.push({ type: 'grid', cards });
    }

    // Smoke/Gas detectors
    if (smokeGas.length > 0) {
      const active = smokeGas.filter((e) => hass.states[e]?.state === 'on');
      const inactive = smokeGas.filter((e) => hass.states[e]?.state === 'off');
      const cards: LovelaceCardConfig[] = [];

      if (active.length > 0) {
        cards.push({ type: 'heading', heading: localize('security.smoke_gas_active'), heading_style: 'subtitle', icon: 'mdi:smoke-detector-alert' });
        cards.push(...active.map((e) => ({ type: 'tile', entity: e, state_content: 'last_changed' })));
      }
      if (inactive.length > 0) {
        cards.push({ type: 'heading', heading: localize('security.smoke_gas_inactive'), heading_style: 'subtitle', icon: 'mdi:smoke-detector' });
        cards.push(...inactive.map((e) => ({ type: 'tile', entity: e, state_content: 'last_changed' })));
      }
      if (cards.length > 0) sections.push({ type: 'grid', cards });
    }

    return { type: 'sections', sections };
  }
}

customElements.define('ll-strategy-simon42-view-security', Simon42ViewSecurityStrategy);
