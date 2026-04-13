// ====================================================================
// Areas Section Builder
// ====================================================================
// Ported from dist/utils/simon42-section-builder.js (createAreasSection)
// with full TypeScript types.
// Creates area cards grouped by floor or as a single flat section.
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { LovelaceCardConfig, LovelaceSectionConfig } from '../types/lovelace';
import type { AreaRegistryEntry } from '../types/registries';
import { Registry } from '../Registry';
import { localize } from '../utils/localize';

// Area control domains to check (same as HA, with optional 'switch')
const CONTROL_DOMAINS = [
  'light',
  'fan',
  'switch',
  'cover-shutter',
  'cover-blind',
  'cover-curtain',
  'cover-shade',
  'cover-awning',
  'cover-garage',
  'cover-gate',
  'cover-door',
  'cover-window',
  'cover-damper',
] as const;

type ControlDomain = (typeof CONTROL_DOMAINS)[number];

/**
 * Pre-computes which area-controls actually have entities in this area.
 * This avoids the area card having to scan all entities at render time.
 * Same approach as HA's areas-overview-view-strategy.
 */
function getAreaControls(areaId: string, hass: HomeAssistant): ControlDomain[] {
  const areaEntities = Registry.getVisibleEntitiesForArea(areaId);
  if (areaEntities.length === 0) return [];

  const found = new Set<ControlDomain>();

  for (const entity of areaEntities) {
    const state = hass.states[entity.entity_id];
    if (!state) continue;

    const domain = entity.entity_id.split('.')[0];
    const deviceClass = state.attributes?.device_class as string | undefined;

    if (domain === 'light') found.add('light');
    else if (domain === 'fan') found.add('fan');
    else if (domain === 'switch' && Registry.config.show_switches_on_areas) found.add('switch');
    else if (domain === 'cover' && deviceClass) {
      const key = `cover-${deviceClass}` as ControlDomain;
      if (CONTROL_DOMAINS.includes(key)) found.add(key);
    }
  }

  return [...found];
}

// Alert-relevant binary sensor device classes.
// Excludes noisy classes like light, connectivity, battery, plug, power, running, problem.
const ALERT_DEVICE_CLASSES = new Set([
  'motion', 'occupancy', 'sound',
  'moisture',
  'smoke', 'gas', 'heat', 'cold', 'safety', 'tamper', 'vibration',
]);

/**
 * Pre-computes which binary sensor alert classes exist in this area.
 * Only returns device classes from the allowlist that have at least one
 * binary_sensor entity, so the area card doesn't scan all entities at render time.
 */
function getAreaAlertClasses(areaId: string, hass: HomeAssistant): string[] {
  const areaEntities = Registry.getVisibleEntitiesForArea(areaId);
  if (areaEntities.length === 0) return [];

  const found = new Set<string>();

  for (const entity of areaEntities) {
    const domain = entity.entity_id.split('.')[0];
    if (domain !== 'binary_sensor') continue;

    const state = hass.states[entity.entity_id];
    const deviceClass = state?.attributes?.device_class as string | undefined;
    if (deviceClass && ALERT_DEVICE_CLASSES.has(deviceClass)) found.add(deviceClass);
  }

  return [...found];
}

/**
 * Builds a single area card config for use in area sections.
 * Pre-filters controls and sensor_classes like HA does — the card
 * only gets what actually exists, avoiding expensive entity scanning at render.
 */
function buildAreaCard(area: AreaRegistryEntry, hass: HomeAssistant): LovelaceCardConfig {
  const controls = getAreaControls(area.area_id, hass);

  // Only include sensor_classes that are configured on the area (like HA does)
  const sensorClasses: string[] = [];
  if (area.temperature_entity_id && hass.states[area.temperature_entity_id]) {
    sensorClasses.push('temperature');
  }
  if (area.humidity_entity_id && hass.states[area.humidity_entity_id]) {
    sensorClasses.push('humidity');
  }

  // Pre-filter alert classes if enabled
  const alertClasses = Registry.config.show_alerts_on_areas
    ? getAreaAlertClasses(area.area_id, hass)
    : undefined;

  return {
    type: 'area',
    area: area.area_id,
    display_type: 'compact',
    sensor_classes: sensorClasses.length > 0 ? sensorClasses : undefined,
    alert_classes: alertClasses && alertClasses.length > 0 ? alertClasses : undefined,
    features: controls.length > 0 ? [{ type: 'area-controls', controls }] : [],
    features_position: 'inline',
    navigation_path: area.area_id,
    vertical: false,
    grid_options: { columns: 'full' },
  };
}

/**
 * Creates the areas section(s).
 *
 * - Without floor grouping: returns a single section with all areas.
 * - With floor grouping: returns an array of sections, one per floor,
 *   plus an optional "Weitere Bereiche" section for areas without a floor.
 */
export function createAreasSection(
  visibleAreas: AreaRegistryEntry[],
  groupByFloors: boolean = false,
  hass: HomeAssistant | null = null
): LovelaceSectionConfig | LovelaceSectionConfig[] {
  // No floor grouping: flat list
  if (!groupByFloors || !hass) {
    return {
      type: 'grid',
      cards: [
        {
          type: 'heading',
          heading_style: 'title',
          heading: localize('sections.areas'),
        },
        ...visibleAreas.map((area) => buildAreaCard(area, hass as HomeAssistant)),
      ],
    };
  }

  // Group areas by floor
  const areasByFloor = new Map<string, AreaRegistryEntry[]>();
  const areasWithoutFloor: AreaRegistryEntry[] = [];

  for (const area of visibleAreas) {
    if (area.floor_id) {
      if (!areasByFloor.has(area.floor_id)) {
        areasByFloor.set(area.floor_id, []);
      }
      areasByFloor.get(area.floor_id)?.push(area);
    } else {
      areasWithoutFloor.push(area);
    }
  }

  // Build sections per floor
  const sections: LovelaceSectionConfig[] = [];

  // Use HA's floor order from the registry. The hass.floors object preserves
  // the user-defined order from HA's "Reorder areas and floors" dialog via
  // Object.keys() insertion order — no separate sort_order field needed.
  const floorOrder = Object.keys(hass.floors);
  const sortedFloors = floorOrder.filter((id) => areasByFloor.has(id));

  for (const floorId of sortedFloors) {
    const areas = areasByFloor.get(floorId) ?? [];
    const floor = hass.floors[floorId];
    const floorName = floor.name || floorId;
    const floorIcon = floor.icon || 'mdi:floor-plan';

    sections.push({
      type: 'grid',
      cards: [
        {
          type: 'heading',
          heading_style: 'title',
          heading: floorName,
          icon: floorIcon,
        },
        ...areas.map((area) => buildAreaCard(area, hass)),
      ],
    });
  }

  // Areas without a floor
  if (areasWithoutFloor.length > 0) {
    sections.push({
      type: 'grid',
      cards: [
        {
          type: 'heading',
          heading_style: 'title',
          heading: localize('sections.areas_other'),
          icon: 'mdi:home-outline',
        },
        ...areasWithoutFloor.map((area) => buildAreaCard(area, hass)),
      ],
    });
  }

  return sections;
}
