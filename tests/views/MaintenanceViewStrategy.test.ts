// ============================================================================
// Tests — Maintenance View Strategy + shared maintenance collectors
// ============================================================================
// Locks down the maintenance contracts: a device is only "unavailable"
// when ALL of its visible entities are unavailable (one tile per device),
// orphan entities are checked individually, categorized update entities
// (Shelly firmware = config etc.) still count, the built-in admin cards
// live in a sidebar gated to HA >= 2026.3 (with a tiles fallback for
// older frontends), unavailable devices render last, video tips are
// opt-in and match on components/platform, and the summary count matches
// the view contents.
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';

import {
  buildMaintenanceView,
  buildAdminCards,
  buildMaintenanceSidebar,
  buildUpdatesFallbackSection,
  buildUnavailableSection,
  buildCriticalBatteriesSection,
  buildVideoTipsSection,
} from '../../src/views/MaintenanceViewStrategy';
import {
  buildMaintenanceScan,
  countMaintenanceItems,
  haVersionAtLeast,
} from '../../src/utils/maintenance-utils';
import { matchVideoTips } from '../../src/utils/video-tips';
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
      // Pending + up-to-date updates. The pending one carries a config
      // entity_category (like Shelly firmware updates) — it must count.
      { entity_id: 'update.core', state: 'on', entity_category: 'config' },
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

function setHaVersion(hass: HomeAssistant, version: string): void {
  (hass.config as { version?: string }).version = version;
}

function cardsOf(section: LovelaceSectionConfig | null): LovelaceCardConfig[] {
  return section?.cards || [];
}

beforeEach(function resetRegistry() {
  Registry.resetForTesting();
});

describe('buildUpdatesFallbackSection', () => {
  it('lists pending updates even when they carry a config entity_category', () => {
    const hass = initHass();
    const cards = cardsOf(buildUpdatesFallbackSection(hass, {}));
    const tiles = cards.filter(function isTile(c) { return c.type === 'tile'; });
    expect(tiles.map(function toEntity(c) { return c.entity; })).toEqual(['update.core']);
  });

  it('returns null when nothing is pending', () => {
    const hass = initHass({
      entities: [{ entity_id: 'update.frontend', state: 'off' }],
    });
    expect(buildUpdatesFallbackSection(hass, {})).toBeNull();
  });
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

describe('admin cards + sidebar (HA version gate)', () => {
  it('returns no admin cards when hass has no version (older HA)', () => {
    const hass = initHass();
    expect(buildAdminCards(hass)).toEqual([]);
    expect(buildMaintenanceSidebar(hass)).toBeUndefined();
  });

  it('puts repairs + updates + discovered-devices full-width into the sidebar on HA >= 2026.3', () => {
    const hass = initHass();
    setHaVersion(hass, '2026.7.1');
    const sidebar = buildMaintenanceSidebar(hass);
    const cards = sidebar?.sections?.[0]?.cards || [];
    expect(cards.map(function toType(c) { return c.type; })).toEqual([
      'repairs',
      'updates',
      'discovered-devices',
    ]);
    expect(cards.every(function isFullWidth(c) {
      return c.hide_empty === true && c.grid_options?.columns === 'full';
    })).toBe(true);
  });

  it('appends the HACS quick link to the sidebar when hacs is loaded', () => {
    const hass = initHass({ ...maintenanceSpec(), components: ['hacs'] });
    setHaVersion(hass, '2026.7.1');
    const cards = buildMaintenanceSidebar(hass)?.sections?.[0]?.cards || [];
    expect(cards[cards.length - 1].type).toBe('markdown');
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

describe('buildVideoTipsSection (opt-in)', () => {
  it('returns null unless show_video_tips is enabled', () => {
    const hass = initHass({ ...maintenanceSpec(), components: ['hacs'] });
    expect(buildVideoTipsSection(hass, {})).toBeNull();
  });

  it('renders matching tips as full-width cards with the tip id', () => {
    const hass = initHass({ ...maintenanceSpec(), components: ['hacs'] });
    const cards = cardsOf(buildVideoTipsSection(hass, { show_video_tips: true }));
    const tipCards = cards.filter(function isTipCard(c) {
      return c.type === 'custom:simon42-video-tip-card';
    });
    expect(tipCards.length).toBeGreaterThan(0);
    expect(tipCards.every(function hasFields(c) {
      return typeof c.tip_id === 'string' && typeof c.url === 'string' && c.grid_options?.columns === 'full';
    })).toBe(true);
  });
});

describe('matchVideoTips', () => {
  it('matches on loaded components and skips dismissed tips', () => {
    const hass = initHass({ ...maintenanceSpec(), components: ['hacs'] });
    const tips = matchVideoTips(hass, new Set());
    const ids = tips.map(function toId(t) { return t.id; });
    expect(ids).toContain('haghs-check');

    const withoutDismissed = matchVideoTips(hass, new Set(['haghs-check']));
    expect(withoutDismissed.map(function toId(t) { return t.id; })).not.toContain('haghs-check');
  });

  it('matches platform-based tips only when an entity of that platform exists', () => {
    const withShelly = initHass({
      entities: [{ entity_id: 'sensor.shelly_power', state: '5', platform: 'shelly' }],
    });
    expect(matchVideoTips(withShelly, new Set()).map(function toId(t) { return t.id; })).toContain('shelly-3em');

    const withoutShelly = initHass({
      entities: [{ entity_id: 'light.ok', state: 'on' }],
    });
    expect(matchVideoTips(withoutShelly, new Set()).map(function toId(t) { return t.id; })).not.toContain('shelly-3em');
  });

  it('caps the result at three tips', () => {
    const hass = initHass({
      ...maintenanceSpec(),
      components: ['hacs', 'ollama', 'mcp', 'tailscale', 'bluetooth', 'duckdns'],
    });
    expect(matchVideoTips(hass, new Set()).length).toBeLessThanOrEqual(3);
  });
});

describe('buildMaintenanceView', () => {
  it('orders main content updates(fallback) → batteries → unavailable without a sidebar', () => {
    const hass = initHass();
    const view = buildMaintenanceView(hass, {});
    expect(view.type).toBe('sections');
    expect(view.sidebar).toBeUndefined();
    const headings = (view.sections || []).map(function firstCardType(s) {
      return s.cards?.[0]?.type === 'heading' ? s.cards?.[0]?.icon : s.cards?.[0]?.type;
    });
    expect(headings).toEqual(['mdi:update', 'mdi:battery-alert', 'mdi:lan-disconnect']);
  });

  it('moves updates into the sidebar on HA >= 2026.3 (no duplicate tiles section)', () => {
    const hass = initHass();
    setHaVersion(hass, '2026.7.1');
    const view = buildMaintenanceView(hass, {});
    expect(view.sidebar).toBeDefined();
    const icons = (view.sections || []).map(function headingIcon(s) { return s.cards?.[0]?.icon; });
    expect(icons).not.toContain('mdi:update');
    expect(icons[icons.length - 1]).toBe('mdi:lan-disconnect');
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
    // 1 pending update (config category!) + 1 dead device + 1 dead orphan
    // + 1 critical battery
    expect(countMaintenanceItems(hass, scan, 20)).toBe(4);
  });

  it('respects the configurable critical threshold', () => {
    const hass = initHass();
    const scan = buildMaintenanceScan(hass, {});
    // Threshold 5: the 7% battery is no longer critical
    expect(countMaintenanceItems(hass, scan, 5)).toBe(3);
  });
});
