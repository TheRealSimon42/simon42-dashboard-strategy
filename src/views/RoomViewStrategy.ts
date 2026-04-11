// ====================================================================
// VIEW STRATEGY — ROOM (Room detail with sensor badges + cameras)
// ====================================================================

import type { HomeAssistant, HassEntity } from '../types/homeassistant';
import type {
  LovelaceViewConfig,
  LovelaceCardConfig,
  LovelaceSectionConfig,
  LovelaceBadgeConfig,
} from '../types/lovelace';
import type { AreaRegistryEntry } from '../types/registries';
import type { RoomEntities, SensorEntities } from '../types/strategy';
import { stripAreaName, sortByLastChanged } from '../utils/name-utils';
import { Registry } from '../Registry';
import { timeStart, timeEnd, debugLog } from '../utils/debug';
import { localize } from '../utils/localize';

// HA supported_features bitmask values
const FAN_SET_SPEED = 1;
const MEDIA_PAUSE = 1;
const MEDIA_PLAY = 16384;
const MEDIA_STOP = 4096;

/** Check if a fan supports speed control */
function fanSupportsSpeed(state: HassEntity): boolean {
  return ((state.attributes?.supported_features as number) & FAN_SET_SPEED) !== 0;
}

/** Check if a media player supports playback controls */
function mediaPlayerSupportsPlayback(state: HassEntity): boolean {
  const f = (state.attributes?.supported_features as number) || 0;
  return (f & (MEDIA_PAUSE | MEDIA_PLAY | MEDIA_STOP)) !== 0;
}

class Simon42ViewRoomStrategy extends HTMLElement {
  static async generate(config: any, hass: HomeAssistant): Promise<LovelaceViewConfig> {
    const area: AreaRegistryEntry = config.area;
    debugLog(`room-generate-${area.area_id}: called at ${performance.now().toFixed(1)}ms after page load`);
    timeStart(`room-generate-${area.area_id}`);
    const dashboardConfig = config.dashboardConfig || {};

    // Ensure Registry is initialized (idempotent — no-op if already done)
    Registry.initialize(hass, dashboardConfig);
    const groupsOptions: Record<string, any> = config.groups_options || {};

    const roomEntities: RoomEntities = {
      lights: [],
      covers: [],
      covers_curtain: [],
      scenes: [],
      climate: [],
      media_player: [],
      vacuum: [],
      fan: [],
      switches: [],
      locks: [],
      automations: [],
      scripts: [],
      cameras: [],
    };

    const sensorEntities: SensorEntities = {
      temperature: [],
      humidity: [],
      pm25: [],
      pm10: [],
      co2: [],
      voc: [],
      motion: [],
      occupancy: [],
      illuminance: [],
      absolute_humidity: [],
      battery: [],
      window: [],
      door: [],
      smoke: [],
      gas: [],
    };

    // Main categorization loop — use pre-filtered visible entities from Registry
    // (no hidden, no_dboard, config/diagnostic, config-hidden)
    const visibleEntities = Registry.getVisibleEntitiesForArea(area.area_id);

    for (const entity of visibleEntities) {
      const entityId = entity.entity_id;

      // State check
      const state = hass.states[entityId];
      if (!state) continue;

      // Domain categorization
      const domain = entityId.split('.')[0];
      const deviceClass = state.attributes?.device_class as string | undefined;
      const unit = state.attributes?.unit_of_measurement as string | undefined;

      if (domain === 'light') {
        roomEntities.lights.push(entityId);
        continue;
      }
      if (domain === 'cover') {
        if (deviceClass === 'curtain' || deviceClass === 'blind') roomEntities.covers_curtain.push(entityId);
        else roomEntities.covers.push(entityId);
        continue;
      }
      if (domain === 'scene') {
        roomEntities.scenes.push(entityId);
        continue;
      }
      if (domain === 'climate') {
        roomEntities.climate.push(entityId);
        continue;
      }
      if (domain === 'media_player') {
        roomEntities.media_player.push(entityId);
        continue;
      }
      if (domain === 'vacuum') {
        roomEntities.vacuum.push(entityId);
        continue;
      }
      if (domain === 'fan') {
        roomEntities.fan.push(entityId);
        continue;
      }
      if (domain === 'switch') {
        roomEntities.switches.push(entityId);
        continue;
      }
      if (domain === 'lock' && dashboardConfig.show_locks_in_rooms) {
        roomEntities.locks.push(entityId);
        continue;
      }
      if (domain === 'automation' && dashboardConfig.show_automations_in_rooms) {
        roomEntities.automations.push(entityId);
        continue;
      }
      if (domain === 'script' && dashboardConfig.show_scripts_in_rooms) {
        roomEntities.scripts.push(entityId);
        continue;
      }
      if (domain === 'camera') {
        roomEntities.cameras.push(entityId);
        continue;
      }

      // Sensors for badges
      if (domain === 'sensor') {
        if (entityId.includes('battery') || deviceClass === 'battery') {
          const val = parseFloat(state.state);
          if (!isNaN(val) && val < 20) sensorEntities.battery.push(entityId);
          continue;
        }
        // Temperature and humidity badges are only shown when explicitly
        // assigned in HA area settings (area.temperature_entity_id / humidity_entity_id).
        // No auto-detection — avoids wrong sensors (e.g. heater temperature).
        if (deviceClass === 'temperature' || unit === '°C' || unit === '°F') continue;
        if (deviceClass === 'humidity' || unit === '%') continue;
        if (unit === 'g/m³') {
          sensorEntities.absolute_humidity.push(entityId);
          continue;
        }
        if (deviceClass === 'pm25' || entityId.includes('pm_2_5') || entityId.includes('pm25')) {
          sensorEntities.pm25.push(entityId);
          continue;
        }
        if (deviceClass === 'pm10' || entityId.includes('pm_10') || entityId.includes('pm10')) {
          sensorEntities.pm10.push(entityId);
          continue;
        }
        if (deviceClass === 'carbon_dioxide' || entityId.includes('co2')) {
          sensorEntities.co2.push(entityId);
          continue;
        }
        if (deviceClass === 'volatile_organic_compounds' || entityId.includes('voc')) {
          sensorEntities.voc.push(entityId);
          continue;
        }
        if (deviceClass === 'illuminance' || unit === 'lx') {
          sensorEntities.illuminance.push(entityId);
          continue;
        }
      }
      if (domain === 'binary_sensor') {
        if (deviceClass === 'motion') {
          sensorEntities.motion.push(entityId);
          continue;
        }
        if (deviceClass === 'occupancy' || deviceClass === 'presence') {
          sensorEntities.occupancy.push(entityId);
          continue;
        }
        if (deviceClass === 'window' && dashboardConfig.show_window_contacts_in_rooms) {
          sensorEntities.window.push(entityId);
          continue;
        }
        if (deviceClass === 'door' && dashboardConfig.show_door_contacts_in_rooms) {
          sensorEntities.door.push(entityId);
          continue;
        }
        if (deviceClass === 'smoke') {
          sensorEntities.smoke.push(entityId);
          continue;
        }
        if (deviceClass === 'gas') {
          sensorEntities.gas.push(entityId);
          continue;
        }
      }
    }

    // Apply groups_options filters
    const applyGroupFilter = (groupKey: keyof RoomEntities): string[] => {
      const groupOpts = groupsOptions[groupKey];
      if (!groupOpts) return roomEntities[groupKey];
      let filtered = roomEntities[groupKey];
      if (groupOpts.hidden?.length > 0) {
        const hiddenSet = new Set<string>(groupOpts.hidden);
        filtered = filtered.filter((e: string) => !hiddenSet.has(e));
      }
      if (groupOpts.order?.length > 0) {
        const orderMap = new Map<string, number>(groupOpts.order.map((id: string, i: number) => [id, i]));
        filtered.sort((a: string, b: string) => (orderMap.get(a) ?? 9999) - (orderMap.get(b) ?? 9999));
      }
      return filtered;
    };

    for (const key of Object.keys(roomEntities) as (keyof RoomEntities)[]) {
      roomEntities[key] = applyGroupFilter(key);
    }

    // === BADGES ===
    const badges: LovelaceBadgeConfig[] = [];

    // Primary temp/humidity from area config
    let primaryTemp: string | null = null;
    let primaryHumidity: string | null = null;

    if (
      area.temperature_entity_id &&
      hass.states[area.temperature_entity_id] &&
      !Registry.isEntityExcluded(area.temperature_entity_id)
    ) {
      primaryTemp = area.temperature_entity_id;
    }
    if (
      area.humidity_entity_id &&
      hass.states[area.humidity_entity_id] &&
      !Registry.isEntityExcluded(area.humidity_entity_id)
    ) {
      primaryHumidity = area.humidity_entity_id;
    }

    const badgeConfig = (entity: string, color: string): LovelaceBadgeConfig => ({
      type: 'entity',
      entity,
      color,
      tap_action: { action: 'more-info' },
    });

    if (primaryTemp) badges.push(badgeConfig(primaryTemp, 'red'));
    if (primaryHumidity) badges.push(badgeConfig(primaryHumidity, 'indigo'));
    if (sensorEntities.pm25[0]) badges.push(badgeConfig(sensorEntities.pm25[0], 'orange'));
    if (sensorEntities.pm10[0]) badges.push(badgeConfig(sensorEntities.pm10[0], 'orange'));
    if (sensorEntities.co2[0]) badges.push(badgeConfig(sensorEntities.co2[0], 'green'));
    if (sensorEntities.voc[0]) badges.push(badgeConfig(sensorEntities.voc[0], 'purple'));
    if (sensorEntities.illuminance[0]) badges.push(badgeConfig(sensorEntities.illuminance[0], 'amber'));
    if (sensorEntities.battery[0]) badges.push(badgeConfig(sensorEntities.battery[0], 'red'));
    if (sensorEntities.motion[0]) badges.push(badgeConfig(sensorEntities.motion[0], 'yellow'));
    if (sensorEntities.occupancy[0]) badges.push(badgeConfig(sensorEntities.occupancy[0], 'cyan'));
    if (sensorEntities.absolute_humidity[0]) badges.push(badgeConfig(sensorEntities.absolute_humidity[0], 'blue'));
    for (const id of sensorEntities.window) badges.push(badgeConfig(id, 'teal'));
    for (const id of sensorEntities.door) badges.push(badgeConfig(id, 'teal'));
    if (sensorEntities.smoke[0]) badges.push(badgeConfig(sensorEntities.smoke[0], 'red'));
    if (sensorEntities.gas[0]) badges.push(badgeConfig(sensorEntities.gas[0], 'red'));

    // === SECTIONS ===
    const sections: LovelaceSectionConfig[] = [];

    // Cameras
    if (roomEntities.cameras.length > 0) {
      const cameraCards: LovelaceCardConfig[] = [];
      for (const cameraId of roomEntities.cameras) {
        if (!hass.states[cameraId]) continue;
        const camEntity = Registry.getEntity(cameraId);
        const deviceId = camEntity?.device_id;

        let isReolink = false;
        let isAqara = false;
        if (deviceId) {
          const device = Registry.getDevice(deviceId);
          if (device) {
            const mfr = (device.manufacturer || '').toLowerCase();
            const model = (device.model || '').toLowerCase();
            isReolink = mfr.includes('reolink') || model.includes('reolink');
            isAqara = mfr.includes('aqara') || model.includes('aqara');
          }
        }

        if ((isReolink || isAqara) && deviceId) {
          const devEntities = Registry.getEntityIdsForDevice(deviceId);

          // Reolink-specific entities
          const spotlight = devEntities.find(
            (id) => id.startsWith('light.') && hass.states[id] && !Registry.isEntityExcluded(id)
          );
          const motion = devEntities.find(
            (id) =>
              id.startsWith('binary_sensor.') &&
              hass.states[id]?.attributes?.device_class === 'motion' &&
              !Registry.isEntityExcluded(id)
          );
          const siren = devEntities.find(
            (id) => id.startsWith('siren.') && hass.states[id] && !Registry.isEntityExcluded(id)
          );

          // Aqara-specific entities
          const battery = devEntities.find(
            (id) =>
              id.startsWith('sensor.') &&
              hass.states[id]?.attributes?.device_class === 'battery' &&
              !Registry.isEntityExcluded(id)
          );
          const doorbell = devEntities.find(
            (id) =>
              id.startsWith('event.') &&
              hass.states[id]?.attributes?.device_class === 'doorbell' &&
              !Registry.isEntityExcluded(id)
          );

          const glanceEntities: any[] = [];
          if (isReolink) {
            if (spotlight) glanceEntities.push({ entity: spotlight });
            if (motion) glanceEntities.push({ entity: motion });
            if (siren) glanceEntities.push({ entity: siren });
          }
          if (isAqara) {
            if (battery) glanceEntities.push({ entity: battery });
            if (doorbell) glanceEntities.push({ entity: doorbell });
          }

          cameraCards.push({
            type: 'picture-glance',
            camera_image: cameraId,
            camera_view: isAqara ? 'live' : 'auto',
            fit_mode: 'cover',
            title: stripAreaName(cameraId, area, hass),
            entities: glanceEntities,
          });
        } else {
          cameraCards.push({
            type: 'picture-entity',
            entity: cameraId,
            camera_image: cameraId,
            camera_view: 'auto',
            name: stripAreaName(cameraId, area, hass),
            show_name: true,
            show_state: false,
          });
        }
      }
      if (cameraCards.length > 0) {
        sections.push({
          type: 'grid',
          cards: [{ type: 'heading', heading: localize('room.cameras'), heading_style: 'title', icon: 'mdi:cctv' }, ...cameraCards],
        });
      }
    }

    // Sort lights by last_changed (unless custom order)
    if (!groupsOptions.lights?.order) {
      roomEntities.lights.sort((a, b) => sortByLastChanged(a, b, hass));
    }

    // Helper: create a domain section
    const domainSection = (
      entities: string[],
      heading: string,
      icon: string,
      tileConfig: (e: string) => LovelaceCardConfig
    ): void => {
      if (entities.length === 0) return;
      sections.push({
        type: 'grid',
        cards: [{ type: 'heading', heading, heading_style: 'title', icon }, ...entities.map(tileConfig)],
      });
    };

    if (roomEntities.lights.length > 0) {
      sections.push({
        type: 'grid',
        cards: [
          {
            type: 'custom:simon42-lights-group-card',
            entities: roomEntities.lights,
            group_type: 'all',
            heading_label: localize('room.lighting'),
            heading_icon: 'mdi:lightbulb',
            area,
            default_expanded: true,
            nested_groups: dashboardConfig.nested_light_groups === true,
          },
        ],
      });
    }

    domainSection(roomEntities.locks, localize('room.locks'), 'mdi:lock', (e) => ({
      type: 'tile',
      entity: e,
      name: stripAreaName(e, area, hass),
      features: [{ type: 'lock-commands' }],
      features_position: 'inline',
      vertical: false,
      state_content: 'last_changed',
    }));

    domainSection(roomEntities.climate, localize('room.climate'), 'mdi:thermostat', (e) => ({
      type: 'tile',
      entity: e,
      name: stripAreaName(e, area, hass),
      features: [{ type: 'climate-hvac-modes' }],
      features_position: 'inline',
      vertical: false,
      state_content: ['hvac_action', 'current_temperature'],
    }));

    domainSection(roomEntities.covers, localize('room.covers'), 'mdi:window-shutter', (e) => ({
      type: 'tile',
      entity: e,
      name: stripAreaName(e, area, hass),
      features: [{ type: 'cover-open-close' }],
      vertical: false,
      features_position: 'inline',
      state_content: ['current_position', 'last_changed'],
    }));

    domainSection(roomEntities.covers_curtain, localize('room.curtains'), 'mdi:curtains', (e) => ({
      type: 'tile',
      entity: e,
      name: stripAreaName(e, area, hass),
      features: [{ type: 'cover-open-close' }],
      vertical: false,
      features_position: 'inline',
      state_content: ['current_position', 'last_changed'],
    }));

    domainSection(roomEntities.media_player, localize('room.media'), 'mdi:speaker', (e) => {
      const state = hass.states[e];
      const hasPlayback = state && mediaPlayerSupportsPlayback(state);
      return {
        type: 'tile',
        entity: e,
        name: stripAreaName(e, area, hass),
        vertical: false,
        ...(hasPlayback ? { features: [{ type: 'media-player-playback' }], features_position: 'inline' } : {}),
        state_content: ['media_title', 'media_artist'],
      };
    });

    domainSection(roomEntities.scenes, localize('room.scenes'), 'mdi:palette', (e) => ({
      type: 'tile',
      entity: e,
      name: stripAreaName(e, area, hass),
      vertical: false,
      state_content: 'last_changed',
    }));

    // Misc (vacuum, fan, switches)
    const miscCards: LovelaceCardConfig[] = [];
    for (const e of roomEntities.vacuum)
      miscCards.push({
        type: 'tile',
        entity: e,
        name: stripAreaName(e, area, hass),
        features: [{ type: 'vacuum-commands' }],
        features_position: 'inline',
        vertical: false,
        state_content: 'last_changed',
      });
    for (const e of roomEntities.fan) {
      const state = hass.states[e];
      const hasSpeed = state && fanSupportsSpeed(state);
      miscCards.push({
        type: 'tile',
        entity: e,
        name: stripAreaName(e, area, hass),
        ...(hasSpeed ? { features: [{ type: 'fan-speed' }], features_position: 'inline' } : {}),
        vertical: false,
        state_content: 'last_changed',
      });
    }
    for (const e of roomEntities.switches)
      miscCards.push({
        type: 'tile',
        entity: e,
        name: stripAreaName(e, area, hass),
        vertical: false,
        state_content: 'last_changed',
      });

    miscCards.sort((a, b) => {
      const sA = hass.states[a.entity];
      const sB = hass.states[b.entity];
      if (!sA || !sB) return 0;
      return new Date(sB.last_changed).getTime() - new Date(sA.last_changed).getTime();
    });

    if (miscCards.length > 0) {
      sections.push({
        type: 'grid',
        cards: [
          { type: 'heading', heading: localize('room.misc'), heading_style: 'title', icon: 'mdi:dots-horizontal' },
          ...miscCards,
        ],
      });
    }

    domainSection(roomEntities.automations, localize('room.automations'), 'mdi:robot', (e) => ({
      type: 'tile',
      entity: e,
      name: stripAreaName(e, area, hass),
      vertical: false,
      state_content: 'last_changed',
    }));

    domainSection(roomEntities.scripts, localize('room.scripts'), 'mdi:script-text', (e) => ({
      type: 'tile',
      entity: e,
      name: stripAreaName(e, area, hass),
      vertical: false,
    }));

    // Room Pins
    const roomPinEntities: string[] = dashboardConfig.room_pin_entities || [];
    const pinsForArea = roomPinEntities.filter((entityId) => {
      const entity = Registry.getEntity(entityId);
      if (!entity) return false;
      if (entity.area_id === area.area_id) return true;
      if (entity.device_id) {
        const device = Registry.getDevice(entity.device_id);
        if (device?.area_id === area.area_id) return true;
      }
      return false;
    });

    if (pinsForArea.length > 0) {
      sections.push({
        type: 'grid',
        cards: [
          { type: 'heading', heading: localize('room.room_pins'), heading_style: 'title', icon: 'mdi:pin' },
          ...pinsForArea.map((e) => {
            const pinStateContent: string[] = [];
            if (dashboardConfig.room_pins_show_state === true) pinStateContent.push('state');
            if (dashboardConfig.room_pins_hide_last_changed !== true) pinStateContent.push('last_changed');
            return {
              type: 'tile',
              entity: e,
              name: stripAreaName(e, area, hass),
              vertical: false,
              ...(pinStateContent.length > 0 ? { state_content: pinStateContent } : {}),
            };
          }),
        ],
      });
    }

    debugLog(
      `Room ${area.area_id}: ${visibleEntities.length} visible entities, ${sections.length} sections, ${badges.length} badges`
    );
    timeEnd(`room-generate-${area.area_id}`);
    return { type: 'sections', header: { badges_position: 'bottom' }, sections, badges };
  }
}

customElements.define('ll-strategy-simon42-view-room', Simon42ViewRoomStrategy);
