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
import type { AreaRegistryEntry, EntityRegistryEntry } from '../types/registries';
import type { AreaCustomSection, RoomEntities, SensorEntities, StackKey } from '../types/strategy';
import { mergeStacksOrder, sortByFriendlyName, sortByLastChanged, stripAreaName } from '../utils/name-utils';
import { buildAreaCustomSections } from '../sections/CustomSections';
import { Registry } from '../Registry';
import { timeStart, timeEnd, debugLog } from '../utils/debug';
import { localize } from '../utils/localize';
import { BADGE_COLOR_MAP, getColorForEntity, isDefaultShowName, resolveShowName } from '../utils/badge-utils';
import { densePlacement } from '../utils/view-builder';

// HA supported_features bitmask values
const FAN_SET_SPEED = 1;
const MEDIA_PAUSE = 1;
const MEDIA_PLAY = 16384;
const MEDIA_STOP = 4096;
// UPS detection is deliberately conservative (categorization-cluster lesson,
// see #183/#223/#289): dedicated UPS platforms, or an explicit UPS/USV device
// name. No entity-id regex heuristics — a vacuum with battery% + status
// sensor must never be pulled out of its normal category.
const UPS_PLATFORMS = new Set(['nut', 'apcupsd']);
const UPS_DEVICE_NAME_PATTERN = /\b(ups|usv)\b/i;
const ROOM_ENERGY_SENSOR_CLASSES = ['power', 'energy', 'water', 'gas'] as const;
const ROOM_ENERGY_SENSOR_CLASS_SET = new Set<string>(ROOM_ENERGY_SENSOR_CLASSES);

/** Check if a fan supports speed control */
function fanSupportsSpeed(state: HassEntity): boolean {
  return ((state.attributes?.supported_features as number) & FAN_SET_SPEED) !== 0;
}

/** Check if a media player supports playback controls */
function mediaPlayerSupportsPlayback(state: HassEntity): boolean {
  const f = (state.attributes?.supported_features as number) || 0;
  return (f & (MEDIA_PAUSE | MEDIA_PLAY | MEDIA_STOP)) !== 0;
}

interface UpsEntityGroup {
  deviceId: string;
  batteryId: string;
  sensorIds: string[];
  entityIds: string[];
}

interface UpsDeviceRender {
  name: string;
  batteryId: string;
  sensorIds: string[];
}

/** Reflect.get keeps dynamic state lookups off the object-injection radar. */
function getEntityState(
  hass: HomeAssistant,
  entityId: string
): HassEntity | undefined {
  return Reflect.get(hass.states as Record<string, unknown>, entityId) as HassEntity | undefined;
}

function getEntityDeviceClass(
  hass: HomeAssistant,
  entityId: string
): string | undefined {
  return getEntityState(hass, entityId)?.attributes?.device_class as string | undefined;
}

/** Exported for the editor's per-area group panel (same import pattern as collectCameraBlocks). */
export function findUpsEntityGroups(entities: EntityRegistryEntry[], hass: HomeAssistant): UpsEntityGroup[] {
  const entitiesByDevice = new Map<string, EntityRegistryEntry[]>();
  for (const entity of entities) {
    if (!entity.device_id) continue;
    const bucket = entitiesByDevice.get(entity.device_id);
    if (bucket) bucket.push(entity);
    else entitiesByDevice.set(entity.device_id, [entity]);
  }

  const groups: UpsEntityGroup[] = [];
  for (const [deviceId, deviceEntities] of entitiesByDevice) {
    let batteryId: string | undefined;
    let isUpsPlatform = false;

    for (const entity of deviceEntities) {
      if (entity.platform && UPS_PLATFORMS.has(entity.platform)) isUpsPlatform = true;

      const state = getEntityState(hass, entity.entity_id);
      if (!state) continue;
      const deviceClass = state.attributes?.device_class as string | undefined;
      const unit = state.attributes?.unit_of_measurement as string | undefined;

      if (!batteryId && entity.entity_id.startsWith('sensor.') && deviceClass === 'battery' && unit === '%') {
        batteryId = entity.entity_id;
      }
    }

    let isUpsByName = false;
    if (!isUpsPlatform) {
      const device = Registry.getDevice(deviceId);
      const deviceName = device?.name_by_user ?? device?.name ?? '';
      isUpsByName = UPS_DEVICE_NAME_PATTERN.test(deviceName) || UPS_DEVICE_NAME_PATTERN.test(device?.model ?? '');
    }

    if (!batteryId || (!isUpsPlatform && !isUpsByName)) continue;
    groups.push({
      deviceId,
      batteryId,
      entityIds: deviceEntities.map((entity) => entity.entity_id),
      sensorIds: deviceEntities
        .map((entity) => entity.entity_id)
        .filter((entityId) => entityId !== batteryId && !!getEntityState(hass, entityId)),
    });
  }

  return groups;
}

function upsSensorRole(entityId: string, hass: HomeAssistant): number {
  const deviceClass = getEntityDeviceClass(hass, entityId);
  if (deviceClass === 'duration' || /runtime|time_left|load_runtime/.test(entityId)) return 1;
  if (deviceClass === 'power' || deviceClass === 'apparent_power' || /(^|[._])load([._]|$)/.test(entityId)) return 2;
  if (deviceClass === 'voltage' || /voltage|input/.test(entityId)) return 3;
  if (/status|state/.test(entityId)) return 4;
  return 5;
}

/** Config fields consumed by the room-pins section */
interface RoomPinsConfig {
  room_pin_entities?: string[];
  room_pins_show_state?: boolean;
  room_pins_hide_last_changed?: boolean;
  room_pins_first?: boolean;
}

/** Filter all configured room pins for the ones in the given area */
function getAreasRoomPins(config: RoomPinsConfig, area: AreaRegistryEntry): string[] {
  const roomPinEntities: string[] = config.room_pin_entities || [];
  return roomPinEntities.filter((entityId) => {
    const entity = Registry.getEntity(entityId);
    if (!entity) return false;
    if (entity.area_id === area.area_id) return true;
    if (entity.device_id) {
      const device = Registry.getDevice(entity.device_id);
      if (device?.area_id === area.area_id) return true;
    }
    return false;
  });
}

/** Build the tile-card factory for room-pin entities */
function buildRoomPinTile(
  config: RoomPinsConfig,
  area: AreaRegistryEntry,
  hass: HomeAssistant
): (e: string) => LovelaceCardConfig {
  return (e: string): LovelaceCardConfig => {
    const pinStateContent: string[] = [];
    if (config.room_pins_show_state === true) pinStateContent.push('state');
    if (config.room_pins_hide_last_changed !== true) pinStateContent.push('last_changed');
    return {
      type: 'tile',
      entity: e,
      name: stripAreaName(e, area, hass),
      vertical: false,
      ...(pinStateContent.length > 0 ? { state_content: pinStateContent } : {}),
    };
  };
}

/**
 * Room camera card. Default: the classic direct picture-glance /
 * picture-entity cards (camera_view auto, Aqara live). Opt-in via
 * `camera_live_toggle`: the simon42-camera-card wrapper with a
 * play/stop button — streams only run on demand.
 */
function buildRoomCameraCard(
  entity: string,
  name: string,
  liveToggle: boolean,
  entities?: Array<{ entity: string }>,
  isAqara?: boolean
): LovelaceCardConfig {
  if (liveToggle) {
    return {
      type: 'custom:simon42-camera-card',
      entity,
      name,
      ...(entities && entities.length > 0 ? { entities } : {}),
      // Aqara cameras provide no snapshot — they must start in live mode
      ...(isAqara === true ? { live_default: true } : {}),
      fit_mode: 'cover',
    };
  }

  // Legacy cards (pre-#338 behavior): Reolink/Aqara always render as
  // picture-glance (entities may be empty), everything else as picture-entity.
  if (entities) {
    return {
      type: 'picture-glance',
      camera_image: entity,
      camera_view: isAqara === true ? 'live' : 'auto',
      fit_mode: 'cover',
      title: name,
      entities,
    };
  }

  return {
    type: 'picture-entity',
    entity,
    camera_image: entity,
    camera_view: 'auto',
    name,
    show_name: true,
    show_state: false,
  };
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
    const areaCustomSections: AreaCustomSection[] = config.custom_sections || [];

    const roomEntities: RoomEntities = {
      lights: [],
      covers: [],
      covers_curtain: [],
      covers_window: [],
      scenes: [],
      climate: [],
      media_player: [],
      vacuum: [],
      fan: [],
      humidifier: [],
      valve: [],
      water_heater: [],
      switches: [],
      locks: [],
      automations: [],
      scripts: [],
      cameras: [],
      ups: [],
      energy: [],
    };

    const sensorEntities: SensorEntities = {
      temperature: [],
      humidity: [],
      pm1: [],
      pm25: [],
      pm10: [],
      co2: [],
      voc: [],
      motion: [],
      occupancy: [],
      illuminance: [],
      absolute_humidity: [],
      soil_moisture: [],
      battery: [],
      window: [],
      door: [],
      smoke: [],
      gas: [],
      heat: [],
    };

    // Main categorization loop — use pre-filtered visible entities from Registry
    // (no hidden, no_dboard, config/diagnostic, config-hidden)
    const visibleEntities = Registry.getVisibleEntitiesForArea(area.area_id);

    // UPS/USV block (opt-in): detected devices are rendered as their own
    // per-device section; their entities leave the normal categorization.
    const showUps = dashboardConfig.show_ups_in_rooms === true;
    const upsGroups = showUps ? findUpsEntityGroups(visibleEntities, hass) : [];
    const usedByUps = new Set(upsGroups.flatMap(({ entityIds }) => entityIds));
    roomEntities.ups.push(...usedByUps);

    // Energy block (opt-in): power/energy/water/gas sensors as own section
    const showEnergy = dashboardConfig.show_energy_in_rooms === true;

    // Filter unavailable entities from per-room domain lists / sensor badges.
    // Default true: unavailable items are noise in a room view (offline devices,
    // dead batteries surface elsewhere via the batteries view + alert badge).
    const hideUnavailable = dashboardConfig.hide_unavailable_in_rooms !== false;

    for (const entity of visibleEntities) {
      const entityId = entity.entity_id;
      const state = hass.states[entityId];
      if (!state) continue;
      if (hideUnavailable && state.state === 'unavailable') continue;
      if (usedByUps.has(entityId)) continue;

      const domain = entityId.split('.')[0];
      const deviceClass = state.attributes?.device_class as string | undefined;
      const unit = state.attributes?.unit_of_measurement as string | undefined;

      if (domain === 'light') {
        roomEntities.lights.push(entityId);
        continue;
      }
      if (domain === 'cover') {
        if (deviceClass === 'curtain') roomEntities.covers_curtain.push(entityId);
        else if (deviceClass === 'window' || deviceClass === 'door' || deviceClass === 'gate' || deviceClass === 'garage') roomEntities.covers_window.push(entityId);
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
      if (domain === 'vacuum' || domain === 'lawn_mower') {
        roomEntities.vacuum.push(entityId);
        continue;
      }
      if (domain === 'fan') {
        roomEntities.fan.push(entityId);
        continue;
      }
      if (domain === 'humidifier') {
        roomEntities.humidifier.push(entityId);
        continue;
      }
      if (domain === 'valve') {
        roomEntities.valve.push(entityId);
        continue;
      }
      if (domain === 'water_heater') {
        roomEntities.water_heater.push(entityId);
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
      if (domain === 'camera' && dashboardConfig.show_cameras_in_rooms !== false) {
        roomEntities.cameras.push(entityId);
        continue;
      }
      if (showEnergy && domain === 'sensor' && deviceClass && ROOM_ENERGY_SENSOR_CLASS_SET.has(deviceClass)) {
        roomEntities.energy.push(entityId);
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
        // Soil/plant moisture sensors are auto-detected (device_class === 'moisture'
        // on sensor.* — distinct from binary_sensor.moisture which means a leak).
        // Check before the '%' fallthrough so we don't lose them.
        if (deviceClass === 'moisture') {
          sensorEntities.soil_moisture.push(entityId);
          continue;
        }
        if (deviceClass === 'humidity' || unit === '%') continue;
        if (unit === 'g/m³') {
          sensorEntities.absolute_humidity.push(entityId);
          continue;
        }
        if (deviceClass === 'pm1' || entityId.includes('pm_1') || /(^|_)pm1($|_)/.test(entityId)) {
          sensorEntities.pm1.push(entityId);
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
        if (deviceClass === 'window') {
          sensorEntities.window.push(entityId);
          continue;
        }
        if (deviceClass === 'door') {
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
        if (deviceClass === 'heat') {
          sensorEntities.heat.push(entityId);
          continue;
        }
      }
    }

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

    const upsDevices: UpsDeviceRender[] = [];
    for (const { deviceId, batteryId, sensorIds } of upsGroups) {
      const device = Registry.getDevice(deviceId);
      const name = device?.name_by_user ?? device?.name ?? 'UPS';
      upsDevices.push({ name, batteryId, sensorIds });
    }

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

    const badgeOpts = groupsOptions.badges;
    const hasBadgeConfig = !!badgeOpts;

    interface BadgeCandidate {
      entity: string;
      color: string;
      showName?: boolean;
    }

    const candidates: BadgeCandidate[] = [];
    const addCandidate = (entityId: string, colorKey: string, dcOverride?: string) => {
      const dc = dcOverride || (hass.states[entityId]?.attributes?.device_class as string | undefined);
      candidates.push({
        entity: entityId,
        color: BADGE_COLOR_MAP[colorKey] || 'grey',
        ...(isDefaultShowName(dc) ? { showName: true } : {}),
      });
    };

    const singleTypes: Array<[string[], string]> = [
      [sensorEntities.pm1, 'pm1'],
      [sensorEntities.pm25, 'pm25'],
      [sensorEntities.pm10, 'pm10'],
      [sensorEntities.co2, 'carbon_dioxide'],
      [sensorEntities.voc, 'volatile_organic_compounds'],
      [sensorEntities.illuminance, 'illuminance'],
      [sensorEntities.battery, 'battery'],
      [sensorEntities.motion, 'motion'],
      [sensorEntities.occupancy, 'occupancy'],
      [sensorEntities.absolute_humidity, 'moisture'],
      [sensorEntities.soil_moisture, 'moisture'],
      [sensorEntities.smoke, 'smoke'],
      [sensorEntities.gas, 'gas'],
      [sensorEntities.heat, 'heat'],
    ];
    for (const [entities, colorKey] of singleTypes) {
      if (entities[0]) addCandidate(entities[0], colorKey);
    }

    if (dashboardConfig.show_window_contacts_in_rooms !== false) {
      for (const id of sensorEntities.window) addCandidate(id, 'window', 'window');
    }
    if (dashboardConfig.show_door_contacts_in_rooms !== false) {
      for (const id of sensorEntities.door) addCandidate(id, 'door', 'door');
    }

    let filteredCandidates = candidates;
    if (hasBadgeConfig) {
      if (badgeOpts.hidden?.length) {
        const hiddenSet = new Set<string>(badgeOpts.hidden);
        filteredCandidates = filteredCandidates.filter((b) => !hiddenSet.has(b.entity));
      }
      if (badgeOpts.additional?.length) {
        for (const entityId of badgeOpts.additional) {
          if (hass.states[entityId] && !filteredCandidates.some((b) => b.entity === entityId)) {
            filteredCandidates.push({ entity: entityId, color: getColorForEntity(entityId, hass) });
          }
        }
      }
    }

    const namesVisible = hasBadgeConfig ? new Set<string>(badgeOpts.names_visible || []) : null;
    const namesHidden = hasBadgeConfig ? new Set<string>(badgeOpts.names_hidden || []) : null;

    const badges: LovelaceBadgeConfig[] = [];
    if (primaryTemp) badges.push({ type: 'entity', entity: primaryTemp, color: 'red', tap_action: { action: 'more-info' } });
    if (primaryHumidity) badges.push({ type: 'entity', entity: primaryHumidity, color: 'indigo', tap_action: { action: 'more-info' } });
    for (const b of filteredCandidates) {
      const showName = resolveShowName(b.entity, !!b.showName, namesVisible, namesHidden);
      badges.push({
        type: 'entity',
        entity: b.entity,
        color: b.color,
        tap_action: { action: 'more-info' },
        ...(showName ? { show_name: true } : {}),
      });
    }

    // === SECTIONS ===
    // Custom sections with position 'top' render before all generated
    // sections; 'bottom' ones are appended at the very end. Generated
    // sections are collected as named stacks and assembled according to
    // the per-area stacks_order (default: DEFAULT_STACKS_ORDER).
    const sections: LovelaceSectionConfig[] = buildAreaCustomSections(areaCustomSections, 'top');
    const areaOptions = Reflect.get(dashboardConfig.areas_options ?? {}, area.area_id) as
      | { stacks_order?: StackKey[] }
      | undefined;
    const configuredStacksOrder = areaOptions?.stacks_order;
    let stacksOrder = mergeStacksOrder(configuredStacksOrder);
    if (!configuredStacksOrder && dashboardConfig.room_pins_first === true) {
      stacksOrder = ['room_pins', ...stacksOrder.filter((key) => key !== 'room_pins')];
    }
    const stacks = new Map<StackKey, LovelaceSectionConfig[]>();

    function pushStack(key: StackKey, section: LovelaceSectionConfig): void {
      const current = stacks.get(key) ?? [];
      current.push(section);
      stacks.set(key, current);
    }

    if (upsDevices.length > 0) {
      const critThreshold = dashboardConfig.battery_critical_threshold ?? 20;
      const lowThreshold = dashboardConfig.battery_low_threshold ?? 50;
      const hiddenUpsEntities = new Set<string>(groupsOptions.ups?.hidden || []);

      for (const upsDevice of upsDevices) {
        if (hiddenUpsEntities.has(upsDevice.batteryId)) continue;

        const sortedSensors = [...upsDevice.sensorIds]
          .sort((a, b) => upsSensorRole(a, hass) - upsSensorRole(b, hass) || a.localeCompare(b))
          .filter((entityId) => !hiddenUpsEntities.has(entityId));

        pushStack('ups', {
          type: 'grid',
          cards: [
            {
              type: 'heading',
              heading_style: 'title',
              icon: 'mdi:power-plug-battery',
              heading: upsDevice.name,
            },
            {
              type: 'gauge',
              entity: upsDevice.batteryId,
              name: localize('ups.battery'),
              min: 0,
              max: 100,
              needle: false,
              severity: { red: 0, yellow: critThreshold, green: lowThreshold },
            },
            ...sortedSensors.map((entityId) => ({
              type: 'tile',
              entity: entityId,
              name: stripAreaName(entityId, area, hass),
              vertical: false,
              state_content: 'state',
            })),
          ],
        });
      }
    }

    if (roomEntities.energy.length > 0) {
      const energyEntities = roomEntities.energy
        .map((entityId) => {
          const deviceClass = getEntityDeviceClass(hass, entityId);
          return {
            entityId,
            order: ROOM_ENERGY_SENSOR_CLASSES.indexOf(deviceClass as (typeof ROOM_ENERGY_SENSOR_CLASSES)[number]),
          };
        })
        .sort((a, b) => a.order - b.order || a.entityId.localeCompare(b.entityId))
        .map((entry) => entry.entityId);

      pushStack('energy', {
        type: 'grid',
        cards: [
          { type: 'heading', heading: localize('sections.energy'), heading_style: 'title', icon: 'mdi:lightning-bolt' },
          ...energyEntities.map((entityId) => ({
            type: 'tile',
            entity: entityId,
            name: stripAreaName(entityId, area, hass),
            vertical: false,
            state_content: 'state',
          })),
        ],
      });
    }

    if (roomEntities.cameras.length > 0) {
      const cameraLiveToggle = dashboardConfig.camera_live_toggle === true;
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

          const glanceEntities: Array<{ entity: string }> = [];
          if (isReolink) {
            if (spotlight) glanceEntities.push({ entity: spotlight });
            if (motion) glanceEntities.push({ entity: motion });
            if (siren) glanceEntities.push({ entity: siren });
          }
          if (isAqara) {
            if (battery) glanceEntities.push({ entity: battery });
            if (doorbell) glanceEntities.push({ entity: doorbell });
          }

          cameraCards.push(buildRoomCameraCard(cameraId, stripAreaName(cameraId, area, hass), cameraLiveToggle, glanceEntities, isAqara));
        } else {
          cameraCards.push(buildRoomCameraCard(cameraId, stripAreaName(cameraId, area, hass), cameraLiveToggle));
        }
      }
      if (cameraCards.length > 0) {
        pushStack('cameras', {
          type: 'grid',
          cards: [
            {
              type: 'heading',
              heading: localize('room.cameras'),
              heading_style: 'title',
              icon: 'mdi:cctv',
              // Deep-link into the CCTV view when it is enabled — same
              // affordance as the cameras heading in the security view
              ...(dashboardConfig.show_camera_view === true
                ? { tap_action: { action: 'navigate', navigation_path: 'cameras' } }
                : {}),
            },
            ...cameraCards,
          ],
        });
      }
    }

    if (!groupsOptions.lights?.order) {
      if (dashboardConfig.lights_sort_by === 'name') {
        roomEntities.lights.sort((a, b) => sortByFriendlyName(a, b, hass));
      } else {
        roomEntities.lights.sort((a, b) => sortByLastChanged(a, b, hass));
      }
    }

    const domainSection = (
      key: StackKey,
      entities: string[],
      heading: string,
      icon: string,
      tileConfig: (e: string) => LovelaceCardConfig
    ): void => {
      if (entities.length === 0) return;
      pushStack(key, {
        type: 'grid',
        cards: [{ type: 'heading', heading, heading_style: 'title', icon }, ...entities.map(tileConfig)],
      });
    };

    if (roomEntities.lights.length > 0) {
      pushStack('lights', {
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
            sort_by: dashboardConfig.lights_sort_by,
          },
        ],
      });
    }

    domainSection('locks', roomEntities.locks, localize('room.locks'), 'mdi:lock', (e) => ({
      type: 'tile',
      entity: e,
      name: stripAreaName(e, area, hass),
      features: [{ type: 'lock-commands' }],
      features_position: 'inline',
      vertical: false,
      state_content: 'last_changed',
    }));

    if (roomEntities.climate.length > 0 || roomEntities.fan.length > 0) {
      const climateCards: LovelaceCardConfig[] = [
        { type: 'heading', heading: localize('room.climate'), heading_style: 'title', icon: 'mdi:thermostat' },
      ];
      for (const e of roomEntities.climate) {
        climateCards.push({
          type: 'tile',
          entity: e,
          name: stripAreaName(e, area, hass),
          features: [{ type: 'climate-hvac-modes' }],
          features_position: 'inline',
          vertical: false,
          state_content: ['hvac_action', 'current_temperature'],
        });
      }
      for (const e of roomEntities.fan) {
        const state = hass.states[e];
        const hasSpeed = state && fanSupportsSpeed(state);
        climateCards.push({
          type: 'tile',
          entity: e,
          name: stripAreaName(e, area, hass),
          ...(hasSpeed ? { features: [{ type: 'fan-speed' }], features_position: 'inline' } : {}),
          vertical: false,
          state_content: 'last_changed',
        });
      }
      pushStack('climate', { type: 'grid', cards: climateCards });
    }

    domainSection('covers', roomEntities.covers, localize('room.covers'), 'mdi:window-shutter', (e) => ({
      type: 'tile',
      entity: e,
      name: stripAreaName(e, area, hass),
      features: [{ type: 'cover-open-close' }],
      vertical: false,
      features_position: 'inline',
      state_content: ['current_position', 'last_changed'],
    }));

    domainSection('covers_curtain', roomEntities.covers_curtain, localize('room.curtains'), 'mdi:curtains', (e) => ({
      type: 'tile',
      entity: e,
      name: stripAreaName(e, area, hass),
      features: [{ type: 'cover-open-close' }],
      vertical: false,
      features_position: 'inline',
      state_content: ['current_position', 'last_changed'],
    }));

    domainSection('covers_window', roomEntities.covers_window, localize('room.windows'), 'mdi:window-open-variant', (e) => ({
      type: 'tile',
      entity: e,
      name: stripAreaName(e, area, hass),
      features: [{ type: 'cover-open-close' }],
      vertical: false,
      features_position: 'inline',
      state_content: ['current_position', 'last_changed'],
    }));

    domainSection('media', roomEntities.media_player, localize('room.media'), 'mdi:speaker', (e) => {
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

    domainSection('scenes', roomEntities.scenes, localize('room.scenes'), 'mdi:palette', (e) => ({
      type: 'tile',
      entity: e,
      name: stripAreaName(e, area, hass),
      vertical: false,
      state_content: 'last_changed',
    }));

    // Vacuums & lawn mowers — by default part of the Misc section below
    // (matches HA's areas strategy, which groups both under "others");
    // opt-in own section via show_vacuums_section_in_rooms.
    const vacuumCards: LovelaceCardConfig[] = [];
    for (const e of roomEntities.vacuum)
      vacuumCards.push({
        type: 'tile',
        entity: e,
        name: stripAreaName(e, area, hass),
        features: [{ type: e.startsWith('lawn_mower.') ? 'lawn-mower-commands' : 'vacuum-commands' }],
        features_position: 'inline',
        vertical: false,
        state_content: 'last_changed',
      });

    const ownVacuumSection = dashboardConfig.show_vacuums_section_in_rooms === true;
    if (ownVacuumSection && vacuumCards.length > 0) {
      pushStack('vacuums', {
        type: 'grid',
        cards: [
          { type: 'heading', heading: localize('room.vacuums'), heading_style: 'title', icon: 'mdi:robot-vacuum' },
          ...vacuumCards,
        ],
      });
    }

    // Misc (vacuum/mower unless in own section, fan, switches, …)
    const miscCards: LovelaceCardConfig[] = [];
    if (!ownVacuumSection) miscCards.push(...vacuumCards);
    for (const e of roomEntities.switches)
      miscCards.push({
        type: 'tile',
        entity: e,
        name: stripAreaName(e, area, hass),
        vertical: false,
        state_content: 'last_changed',
      });
    for (const e of roomEntities.humidifier)
      miscCards.push({
        type: 'tile',
        entity: e,
        name: stripAreaName(e, area, hass),
        features: [{ type: 'humidifier-toggle' }],
        features_position: 'inline',
        vertical: false,
        state_content: ['action', 'current_humidity'],
      });
    for (const e of roomEntities.valve)
      miscCards.push({
        type: 'tile',
        entity: e,
        name: stripAreaName(e, area, hass),
        features: [{ type: 'valve-open-close' }],
        features_position: 'inline',
        vertical: false,
        state_content: 'last_changed',
      });
    for (const e of roomEntities.water_heater)
      miscCards.push({
        type: 'tile',
        entity: e,
        name: stripAreaName(e, area, hass),
        features: [{ type: 'water-heater-operation-modes' }],
        features_position: 'inline',
        vertical: false,
        state_content: ['operation_mode', 'current_temperature'],
      });

    miscCards.sort((a, b) => {
      const sA = hass.states[a.entity];
      const sB = hass.states[b.entity];
      if (!sA || !sB) return 0;
      return new Date(sB.last_changed).getTime() - new Date(sA.last_changed).getTime();
    });

    if (miscCards.length > 0) {
      pushStack('misc', {
        type: 'grid',
        cards: [
          { type: 'heading', heading: localize('room.misc'), heading_style: 'title', icon: 'mdi:dots-horizontal' },
          ...miscCards,
        ],
      });
    }

    domainSection('automations', roomEntities.automations, localize('room.automations'), 'mdi:robot', (e) => ({
      type: 'tile',
      entity: e,
      name: stripAreaName(e, area, hass),
      vertical: false,
      state_content: 'last_changed',
    }));

    domainSection('scripts', roomEntities.scripts, localize('room.scripts'), 'mdi:script-text', (e) => ({
      type: 'tile',
      entity: e,
      name: stripAreaName(e, area, hass),
      vertical: false,
    }));

    const roomPins = getAreasRoomPins(dashboardConfig, area);
    if (roomPins.length > 0) {
      domainSection('room_pins', roomPins, localize('room.room_pins'), 'mdi:pin', buildRoomPinTile(dashboardConfig, area, hass));
    }

    for (const key of stacksOrder) {
      const stackSections = stacks.get(key);
      if (stackSections) sections.push(...stackSections);
    }

    sections.push(...buildAreaCustomSections(areaCustomSections, 'bottom'));

    debugLog(
      `Room ${area.area_id}: ${visibleEntities.length} visible entities, ${sections.length} sections, ${badges.length} badges`
    );
    timeEnd(`room-generate-${area.area_id}`);
    return { type: 'sections', ...densePlacement(dashboardConfig), header: { badges_position: 'bottom' }, sections, badges };
  }
}

customElements.define('ll-strategy-simon42-view-room', Simon42ViewRoomStrategy);
