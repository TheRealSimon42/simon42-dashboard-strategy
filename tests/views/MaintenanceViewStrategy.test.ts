// ============================================================================
// Tests — Maintenance View Strategy + shared maintenance collectors
// ============================================================================
// Locks down the maintenance contracts: a device is only "unavailable"
// when ALL of its visible entities are unavailable (one tile per device),
// orphan entities are checked individually, the built-in repairs card is
// gated to HA >= 2026.3, the batteries heading only deep-links when the
// batteries view exists, and the summary count matches the view contents.
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';

import {
  buildMaintenanceView,
  buildAdminCardsSection,
  buildUnavailableSection,
  buildCriticalBatteriesSection,
  buildHacsHintSection,
} from '../../src/views/MaintenanceViewStrategy';
import {
  buildMaintenanceScan,
  countMaintenanceItems,
  haVersionAtLeast,
} from '../../src/utils/maintenance-utils';
import { Registry } from '../../src/Registry';
import { makeHass, type HassFixtureSpec } from '../fixtures/hass';
import type { HomeAssistant } from '../../src/types/homeassistant';
import type { LovelaceCardConfig, LovelaceSectionConfig } from '../../src/types/lovelace';

function maintenanceSpec(): HassFixtureSpec {
  return {
    areas: [{ area_id: 'wohnzimmer', name: 'Wohnzimmer' }],
    devices: [
      { id: 'dev_dead', area_id: 'wohnzimmer', name: 'Toter Sensor' },
      { id: 'dev_half', area_id: 'wohnzimmer', name: 'Halbtotes Gerät' },
    ],
    entities: [
      // Fully unavailable device → exactly ONE tile
      { entity_id: 'sensor.dead_temp', device_id: 'dev_dead', state: 'unavailable' },
      { entity_id: 'sensor.dead_humidity', device_id: 'dev_dead', state: 'unavailable' },
      // Partially unavailable device → NOT flagged
      { entity_id: 'sensor.half_temp', device_id: 'dev_half', state: 'unavailable' },
      { entity_id: 'sensor.half_humidity', device_id: 'dev_half', state: '55' },
      // Orphan (no device) → flagged individually
      { entity_id: 'sensor.template_kaputt', state: 'unavailable', attributes: { friendly_name: 'Template kaputt' } },
      // Healthy entity
      { entity_id: 'light.wohnzimmer', area_id: 'wohnzimmer', state: 'on' },
      // Pending + up-to-date updates
      { entity_id: 'update.core', state: 'on' },
      { entity_id: 'update.frontend', state: 'off' },
      // Critical + healthy battery
      { entity_id: 'sensor.tuer_batterie', state: '7', attributes: { device_class: 'battery', unit_of_measurement: '%' } },
      { entity_id: 'sensor.fenster_batterie', state: '90', attributes: { device_class: 'battery', unit_of_measurement: '%' } },
    ],
  };
}

function initHass(spec: HassFixtureSpec = maintenanceSpec()): HomeAssistant {
  const hass = makeHass(spec);
  Registry.resetForTesting();
  Registry.initialize(hass, {});
  return hass;
}

function cardsOf(section: LovelaceSectionConfig | null): LovelaceCardConfig[] {
  return section?.cards || [];
}

beforeEach(function resetRegistry() {
  Registry.resetForTesting();
});

describe('buildUnavailableSection', () => {
  it('lists a fully unavailable device exactly once, with area-prefixed device name', () => {
    const hass = initHass();
    const cards = cardsOf(buildUnavailableSection(hass, {}));
    const tiles = cards.filter(function isTile(c) { return c.type === 'tile'; });

    const deadTiles = tiles.filter(function fromDeadDevice(c) {
      return c.entity === 'sensor.dead_temp' || c.entity === 'sensor.dead_humidity';
    });
    expect(deadTiles).toHaveLength(1);
    expect(deadTiles[0].name).toBe('Wohnzimmer • Toter Sensor');
  });

  it('skips devices that still have available entities', () => {
    const hass = initHass();
    const cards = cardsOf(buildUnavailableSection(hass, {}));
    const halfTiles = cards.filter(function fromHalfDevice(c) {
      return c.entity === 'sensor.half_temp' || c.entity === 'sensor.half_humidity';
    });
    expect(halfTiles).toHaveLength(0);
  });

  it('lists unavailable orphan entities individually', () => {
    const hass = initHass();
    const cards = cardsOf(buildUnavailableSection(hass, {}));
    const orphan = cards.find(function isOrphan(c) { return c.entity === 'sensor.template_kaputt'; });
    expect(orphan).toBeDefined();
    expect(orphan?.name).toBe('Template kaputt');
  });

  it('returns null when everything is available', () => {
    const hass = initHass({
      entities: [{ entity_id: 'light.ok', state: 'on' }],
    });
    expect(buildUnavailableSection(hass, {})).toBeNull();
  });
});

describe('buildCriticalBatteriesSection', () => {
  it('lists only batteries below the critical threshold', () => {
    const hass = initHass();
    const cards = cardsOf(buildCriticalBatteriesSection(hass, {}));
    const tiles = cards.filter(function isTile(c) { return c.type === 'tile'; });
    expect(tiles.map(function toEntity(c) { return c.entity; })).toEqual(['sensor.tuer_batterie']);
  });

  it('deep-links the heading to the batteries view only when that view exists', () => {
    const hass = initHass();
    const withView = cardsOf(buildCriticalBatteriesSection(hass, {}))[0];
    expect(withView.tap_action?.navigation_path).toBe('batteries');

    const withoutView = cardsOf(
      buildCriticalBatteriesSection(hass, { show_battery_summary: false })
    )[0];
    expect(withoutView.tap_action).toBeUndefined();
  });
});

describe('buildAdminCardsSection (HA version gate)', () => {
  it('returns null when hass has no version (older HA)', () => {
    const hass = initHass();
    expect(buildAdminCardsSection(hass)).toBeNull();
  });

  it('returns repairs + discovered-devices cards on HA >= 2026.3', () => {
    const hass = initHass();
    (hass.config as { version?: string }).version = '2026.7.1';
    const cards = cardsOf(buildAdminCardsSection(hass));
    expect(cards.map(function toType(c) { return c.type; })).toEqual(['repairs', 'discovered-devices']);
    expect(cards.every(function hidesEmpty(c) { return c.hide_empty === true; })).toBe(true);
  });
});

describe('haVersionAtLeast', () => {
  it('compares major.minor correctly', () => {
    const hass = initHass();
    const cfg = hass.config as { version?: string };
    cfg.version = '2026.3.0';
    expect(haVersionAtLeast(hass, 2026, 3)).toBe(true);
    cfg.version = '2026.2.5';
    expect(haVersionAtLeast(hass, 2026, 3)).toBe(false);
    cfg.version = '2027.1.0';
    expect(haVersionAtLeast(hass, 2026, 3)).toBe(true);
    cfg.version = undefined;
    expect(haVersionAtLeast(hass, 2026, 3)).toBe(false);
  });
});

describe('buildHacsHintSection', () => {
  it('renders only when the hacs integration is loaded', () => {
    const withHacs = initHass({ ...maintenanceSpec(), components: ['hacs'] });
    expect(buildHacsHintSection(withHacs)).not.toBeNull();

    const withoutHacs = initHass();
    expect(buildHacsHintSection(withoutHacs)).toBeNull();
  });
});

describe('buildMaintenanceView', () => {
  it('assembles updates, unavailable and battery sections', () => {
    const hass = initHass();
    const view = buildMaintenanceView(hass, {});
    expect(view.type).toBe('sections');
    // updates + unavailable + batteries (no admin section without version,
    // no HACS section without the integration)
    expect(view.sections).toHaveLength(3);
  });

  it('shows a friendly all-clear card when nothing is pending', () => {
    const hass = initHass({
      entities: [{ entity_id: 'light.ok', state: 'on' }],
    });
    const view = buildMaintenanceView(hass, {});
    expect(view.sections).toHaveLength(1);
    const card = view.sections?.[0]?.cards?.[0];
    expect(card?.type).toBe('markdown');
  });
});

describe('summary count parity (countMaintenanceItems)', () => {
  it('counts pending updates + unavailable device/orphan + critical batteries', () => {
    const hass = initHass();
    const scan = buildMaintenanceScan(hass, {});
    // 1 pending update + 1 dead device + 1 dead orphan + 1 critical battery
    expect(countMaintenanceItems(hass, scan, 20)).toBe(4);
  });

  it('respects the configurable critical threshold', () => {
    const hass = initHass();
    const scan = buildMaintenanceScan(hass, {});
    // Threshold 5: the 7% battery is no longer critical
    expect(countMaintenanceItems(hass, scan, 5)).toBe(3);
  });
});
