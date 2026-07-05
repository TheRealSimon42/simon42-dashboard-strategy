// ============================================================================
// Tests — Security View Strategy (cameras opt-in + area grouping)
// ============================================================================
// Locks down the new contracts: cameras render as lean HA-style cards
// only with show_cameras_in_security, the cameras heading deep-links to
// the CCTV view only when that view is enabled, and
// group_security_by_areas switches to area sections whose headings
// navigate to the room views (unassigned entities in a trailing bucket).
// ============================================================================

import { describe, it, expect } from 'vitest';

import { buildSecuritySections, buildSecurityActivitySidebar } from '../../src/views/SecurityViewStrategy';
import { Registry } from '../../src/Registry';
import { makeHass, type HassFixtureSpec } from '../fixtures/hass';
import type { HomeAssistant } from '../../src/types/homeassistant';
import type { Simon42StrategyConfig } from '../../src/types/strategy';
import type { LovelaceCardConfig, LovelaceSectionConfig } from '../../src/types/lovelace';

function securitySpec(): HassFixtureSpec {
  return {
    areas: [
      { area_id: 'garten', name: 'Garten' },
      { area_id: 'flur', name: 'Flur' },
    ],
    devices: [
      { id: 'dev_cam', area_id: 'garten', manufacturer: 'Reolink', name: 'Garten Kamera', primary_config_entry: 'entry_a', config_entries: ['entry_a'] },
    ],
    entities: [
      // Reolink device with two streams — must dedup to ONE lean card
      { entity_id: 'camera.garten_sub', device_id: 'dev_cam', platform: 'reolink', translation_key: 'sub', attributes: { friendly_name: 'Garten Kamera' } },
      { entity_id: 'camera.garten_main', device_id: 'dev_cam', platform: 'reolink', translation_key: 'main', attributes: { friendly_name: 'Garten Kamera Klar' } },
      { entity_id: 'lock.haustuer', area_id: 'flur', state: 'locked' },
      { entity_id: 'binary_sensor.garten_fenster', area_id: 'garten', state: 'off', attributes: { device_class: 'window' } },
      // No area — must land in the trailing bucket in area mode
      { entity_id: 'binary_sensor.keller_rauch', state: 'off', attributes: { device_class: 'smoke' } },
    ],
  };
}

function build(hass: HomeAssistant, config: Simon42StrategyConfig = {}): LovelaceSectionConfig[] {
  Registry.resetForTesting();
  Registry.initialize(hass, config);
  return buildSecuritySections(hass, config);
}

function allCards(sections: LovelaceSectionConfig[]): LovelaceCardConfig[] {
  return sections.flatMap(function sectionCards(section) {
    return section.cards || [];
  });
}

function headings(sections: LovelaceSectionConfig[]): LovelaceCardConfig[] {
  return allCards(sections).filter(function isHeading(card) {
    return card.type === 'heading';
  });
}

describe('cameras in security view', () => {
  it('renders no cameras by default', () => {
    const sections = build(makeHass(securitySpec()));
    expect(allCards(sections).some((c) => c.type === 'picture-entity')).toBe(false);
  });

  it('renders one lean camera card per device when enabled', () => {
    const sections = build(makeHass(securitySpec()), { show_cameras_in_security: true });

    const cameraCards = allCards(sections).filter((c) => c.type === 'picture-entity');
    expect(cameraCards).toHaveLength(1);
    expect(cameraCards[0].entity).toBe('camera.garten_sub');
    expect(cameraCards[0].show_name).toBe(false);
    expect(cameraCards[0].show_state).toBe(false);
    expect(cameraCards[0].grid_options).toEqual({ columns: 6, rows: 2 });

    // Heading exists but does NOT link anywhere while the CCTV view is off
    const cameraHeading = headings(sections).find((h) => h.icon === 'mdi:cctv');
    expect(cameraHeading).toBeDefined();
    expect(cameraHeading?.tap_action).toBeUndefined();
  });

  it('links the cameras heading to the CCTV view when that view is enabled', () => {
    const sections = build(makeHass(securitySpec()), {
      show_cameras_in_security: true,
      show_camera_view: true,
    });
    const cameraHeading = headings(sections).find((h) => h.icon === 'mdi:cctv');
    expect(cameraHeading?.tap_action).toEqual({ action: 'navigate', navigation_path: 'cameras' });
  });

  it('keeps the category sections intact alongside cameras', () => {
    const sections = build(makeHass(securitySpec()), { show_cameras_in_security: true });
    const lockTiles = allCards(sections).filter(
      (c) => c.type === 'tile' && c.entity === 'lock.haustuer'
    );
    expect(lockTiles).toHaveLength(1);
    expect(lockTiles[0].features).toEqual([{ type: 'lock-commands' }]);
  });
});

describe('group_security_by_areas', () => {
  it('builds one section per area with a room-view link in the heading', () => {
    const sections = build(makeHass(securitySpec()), {
      group_security_by_areas: true,
      show_cameras_in_security: true,
    });

    const areaHeadings = headings(sections).filter((h) => h.heading_style === 'title');
    const byName = new Map(areaHeadings.map((h) => [h.heading, h]));

    expect(byName.get('Garten')?.tap_action).toEqual({ action: 'navigate', navigation_path: 'garten' });
    expect(byName.get('Flur')?.tap_action).toEqual({ action: 'navigate', navigation_path: 'flur' });

    // Garten section: camera card first, then the window contact
    const gartenSection = sections.find((s) => s.cards?.[0]?.heading === 'Garten');
    const gartenTypes = (gartenSection?.cards || []).map((c) => c.type);
    expect(gartenTypes).toEqual(['heading', 'picture-entity', 'tile']);

    // Flur section: the lock keeps its lock-commands feature
    const flurSection = sections.find((s) => s.cards?.[0]?.heading === 'Flur');
    const lockTile = (flurSection?.cards || []).find((c) => c.entity === 'lock.haustuer');
    expect(lockTile?.features).toEqual([{ type: 'lock-commands' }]);
  });

  it('collects entities without an area in a trailing bucket', () => {
    const sections = build(makeHass(securitySpec()), { group_security_by_areas: true });
    const lastSection = sections[sections.length - 1];
    const cardEntities = (lastSection.cards || []).map((c) => c.entity);
    expect(cardEntities).toContain('binary_sensor.keller_rauch');
  });

  it('appends the extra-entities section after the area sections', () => {
    const spec = securitySpec();
    spec.entities?.push({ entity_id: 'sensor.usv_status', state: 'online' });
    const sections = build(makeHass(spec), {
      group_security_by_areas: true,
      security_extra_entities: ['sensor.usv_status'],
    });
    const lastSection = sections[sections.length - 1];
    expect((lastSection.cards || []).some((c) => c.entity === 'sensor.usv_status')).toBe(true);
  });

  it('omits area sections without security entities', () => {
    const spec = securitySpec();
    spec.areas?.push({ area_id: 'bad', name: 'Bad' });
    const sections = build(makeHass(spec), { group_security_by_areas: true });
    expect(headings(sections).some((h) => h.heading === 'Bad')).toBe(false);
  });
});

describe('activity sidebar', () => {
  function buildSidebar(spec: HassFixtureSpec, config: Simon42StrategyConfig = {}) {
    const hass = makeHass(spec);
    Registry.resetForTesting();
    Registry.initialize(hass, config);
    return buildSecurityActivitySidebar(hass, config);
  }

  it('builds a 24h logbook over security entities and persons', () => {
    const spec = securitySpec();
    spec.components = ['logbook'];
    spec.entities?.push({ entity_id: 'person.simon', state: 'home' });
    const sidebar = buildSidebar(spec, {
      show_cameras_in_security: true,
      security_activity_layout: 'sidebar',
    });

    expect(sidebar).toBeDefined();
    const logbook = sidebar?.sections?.[0].cards?.find((c) => c.type === 'logbook');
    expect(logbook?.hours_to_show).toBe(24);
    const ids = logbook?.target?.entity_id as string[];
    expect(ids).toContain('lock.haustuer');
    expect(ids).toContain('binary_sensor.garten_fenster');
    expect(ids).toContain('person.simon');
    expect(ids).toContain('camera.garten_sub');
    expect(ids).not.toContain('camera.garten_main');
  });

  it('excludes cameras from the logbook when they are not shown', () => {
    const spec = securitySpec();
    spec.components = ['logbook'];
    const sidebar = buildSidebar(spec, { security_activity_layout: 'sidebar' });
    const logbook = sidebar?.sections?.[0].cards?.find((c) => c.type === 'logbook');
    expect(logbook?.target?.entity_id).not.toContain('camera.garten_sub');
  });

  it('returns undefined without the logbook integration', () => {
    expect(buildSidebar(securitySpec(), { security_activity_layout: 'sidebar' })).toBeUndefined();
  });

  it('returns undefined when disabled via show_security_activity', () => {
    const spec = securitySpec();
    spec.components = ['logbook'];
    expect(
      buildSidebar(spec, { security_activity_layout: 'sidebar', show_security_activity: false })
    ).toBeUndefined();
  });

  it('renders as trailing section by default — sidebar only on request', () => {
    const spec = securitySpec();
    spec.components = ['logbook'];

    // Default: no sidebar, logbook as last section
    expect(buildSidebar(spec)).toBeUndefined();
    const sections = build(makeHass(spec), {});
    const lastSection = sections[sections.length - 1];
    expect((lastSection.cards || []).some((c) => c.type === 'logbook')).toBe(true);

    // Opt-in sidebar: no trailing logbook section
    const sidebarSections = build(makeHass(spec), { security_activity_layout: 'sidebar' });
    expect(allCards(sidebarSections).some((c) => c.type === 'logbook')).toBe(false);
  });
});

describe('security_hidden_cameras', () => {
  it('hides excluded cameras from the security view and its logbook only', () => {
    const spec = securitySpec();
    spec.components = ['logbook'];
    const config: Simon42StrategyConfig = {
      show_cameras_in_security: true,
      security_hidden_cameras: ['camera.garten_sub'],
      security_activity_layout: 'sidebar',
    };

    const sections = build(makeHass(spec), config);
    expect(allCards(sections).some((c) => c.type === 'picture-entity')).toBe(false);

    const hass = makeHass(spec);
    Registry.resetForTesting();
    Registry.initialize(hass, config);
    const sidebar = buildSecurityActivitySidebar(hass, config);
    const logbook = sidebar?.sections?.[0].cards?.find((c) => c.type === 'logbook');
    expect(logbook?.target?.entity_id).not.toContain('camera.garten_sub');
  });
});
