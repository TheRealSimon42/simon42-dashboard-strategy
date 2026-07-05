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

  it('keeps the category sections intact and renders cameras after them', () => {
    const sections = build(makeHass(securitySpec()), { show_cameras_in_security: true });
    const lockTiles = allCards(sections).filter(
      (c) => c.type === 'tile' && c.entity === 'lock.haustuer'
    );
    expect(lockTiles).toHaveLength(1);
    expect(lockTiles[0].features).toEqual([{ type: 'lock-commands' }]);

    // Cameras come last in category mode (Simon's call — HA-like glance
    // stays, but the actionable device categories lead)
    const cameraSectionIndex = sections.findIndex((s) =>
      (s.cards || []).some((c) => c.type === 'picture-entity')
    );
    const lockSectionIndex = sections.findIndex((s) =>
      (s.cards || []).some((c) => c.entity === 'lock.haustuer')
    );
    expect(cameraSectionIndex).toBeGreaterThan(lockSectionIndex);
  });
});

describe('group_security_by_areas (HA-style layout)', () => {
  it('stacks all areas in one section with subtitle headings linking to room views', () => {
    const sections = build(makeHass(securitySpec()), {
      group_security_by_areas: true,
      show_cameras_in_security: true,
    });

    // Single floor group (no floors defined) → one stacked section
    // labeled "Areas" with column_span 2 (stays under each other on the
    // max_columns-3 view, like HA's security panel)
    const areaSection = sections[0];
    expect(areaSection.column_span).toBe(2);
    expect(areaSection.cards?.[0]).toMatchObject({ type: 'heading', heading_style: 'title' });

    const subtitles = (areaSection.cards || []).filter((c) => c.heading_style === 'subtitle');
    const byName = new Map(subtitles.map((h) => [h.heading, h]));
    expect(byName.get('Garten')?.tap_action).toEqual({ action: 'navigate', navigation_path: 'garten' });
    expect(byName.get('Flur')?.tap_action).toEqual({ action: 'navigate', navigation_path: 'flur' });

    // Within an area: camera card first, then the tiles
    const cards = areaSection.cards || [];
    const gartenIndex = cards.findIndex((c) => c.heading === 'Garten');
    expect(cards[gartenIndex + 1]?.type).toBe('picture-entity');

    const lockTile = cards.find((c) => c.entity === 'lock.haustuer');
    expect(lockTile?.features).toEqual([{ type: 'lock-commands' }]);
  });

  it('groups areas into one section per floor', () => {
    const spec = securitySpec();
    spec.floors = [
      { floor_id: 'eg', name: 'Erdgeschoss' },
      { floor_id: 'og', name: 'Obergeschoss' },
    ];
    spec.areas = [
      { area_id: 'garten', name: 'Garten', floor_id: 'eg' },
      { area_id: 'flur', name: 'Flur', floor_id: 'og' },
    ];
    const sections = build(makeHass(spec), { group_security_by_areas: true });

    const floorHeadings = headings(sections)
      .filter((h) => h.heading_style === 'title')
      .map((h) => h.heading);
    expect(floorHeadings).toContain('Erdgeschoss');
    expect(floorHeadings).toContain('Obergeschoss');
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
      group_security_by_areas: true,
    });

    expect(sidebar).toBeDefined();
    const logbook = sidebar?.sections?.[0].cards?.find((c) => c.type === 'logbook');
    expect(logbook?.hours_to_show).toBe(24);
    // Taller than the default so the pane fills the sidebar column
    expect(logbook?.grid_options?.rows).toBe(8);
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
    const sidebar = buildSidebar(spec, { group_security_by_areas: true });
    const logbook = sidebar?.sections?.[0].cards?.find((c) => c.type === 'logbook');
    expect(logbook?.target?.entity_id).not.toContain('camera.garten_sub');
  });

  it('returns undefined without the logbook integration', () => {
    expect(buildSidebar(securitySpec(), { group_security_by_areas: true })).toBeUndefined();
  });

  it('returns undefined when disabled via show_security_activity', () => {
    const spec = securitySpec();
    spec.components = ['logbook'];
    expect(
      buildSidebar(spec, { group_security_by_areas: true, show_security_activity: false })
    ).toBeUndefined();
  });

  it('category mode: leading section by default, end on request, sidebar only when grouped', () => {
    const spec = securitySpec();
    spec.components = ['logbook'];

    // Category mode: no sidebar, logbook as FIRST section
    expect(buildSidebar(spec)).toBeUndefined();
    const sections = build(makeHass(spec), {});
    expect((sections[0].cards || []).some((c) => c.type === 'logbook')).toBe(true);

    // Optional: at the very end
    const endSections = build(makeHass(spec), { security_activity_position: 'end' });
    const lastSection = endSections[endSections.length - 1];
    expect((lastSection.cards || []).some((c) => c.type === 'logbook')).toBe(true);
    expect((endSections[0].cards || []).some((c) => c.type === 'logbook')).toBe(false);

    // HA-style grouped mode: log lives in the sidebar, never as a section
    const groupedSections = build(makeHass(spec), { group_security_by_areas: true });
    expect(allCards(groupedSections).some((c) => c.type === 'logbook')).toBe(false);
    expect(buildSidebar(spec, { group_security_by_areas: true })).toBeDefined();
  });

  it('excludes no_seclog-labeled entities from the log but not the view', () => {
    const spec = securitySpec();
    spec.components = ['logbook'];
    const lock = spec.entities?.find((e) => e.entity_id === 'lock.haustuer');
    lock!.labels = ['no_seclog'];

    const sections = build(makeHass(spec), {});
    const logbook = allCards(sections).find((c) => c.type === 'logbook');
    expect(logbook?.target?.entity_id).not.toContain('lock.haustuer');
    expect(logbook?.target?.entity_id).toContain('binary_sensor.garten_fenster');
    // The lock itself stays in the security sections
    expect(allCards(sections).some((c) => c.entity === 'lock.haustuer')).toBe(true);
  });
});

describe('hidden_cameras', () => {
  it('hides excluded cameras from the security view and its logbook only', () => {
    const spec = securitySpec();
    spec.components = ['logbook'];
    const config: Simon42StrategyConfig = {
      show_cameras_in_security: true,
      hidden_cameras: ['camera.garten_sub'],
      group_security_by_areas: true,
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

describe('safety status sensors', () => {
  it('categorizes safety/tamper/CO sensors like HA does', () => {
    const spec = securitySpec();
    spec.entities?.push(
      // e.g. Versatile Thermostat per-room safety status
      { entity_id: 'binary_sensor.kinderzimmer_sicherheitsstatus', area_id: 'flur', state: 'off', attributes: { device_class: 'safety' } },
      { entity_id: 'binary_sensor.keller_co', state: 'off', attributes: { device_class: 'carbon_monoxide' } }
    );
    const sections = build(makeHass(spec), {});
    const cards = allCards(sections);

    // safety bucket with its own headings
    expect(cards.some((c) => c.entity === 'binary_sensor.kinderzimmer_sicherheitsstatus')).toBe(true);
    // CO detector joins the smoke/gas bucket
    const coTile = cards.find((c) => c.entity === 'binary_sensor.keller_co');
    expect(coTile?.type).toBe('tile');
  });
});
