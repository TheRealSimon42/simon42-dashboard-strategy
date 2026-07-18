// ============================================================================
// Tests — AreasSection user visibility (view_visible_users entry points)
// ============================================================================
// The area cards are the overview entry points of the room views, so they
// follow the room view's view_visible_users rule; headings above a group
// of areas hide via the union of the group's rules.
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';

import { Registry } from '../../src/Registry';
import { createAreasSection } from '../../src/sections/AreasSection';
import { makeHass } from '../fixtures/hass';
import type { LovelaceCardConfig, LovelaceSectionConfig } from '../../src/types/lovelace';
import type { Simon42StrategyConfig } from '../../src/types/strategy';

const AREAS = [
  { area_id: 'kitchen', name: 'Küche', floor_id: 'eg' },
  { area_id: 'bath', name: 'Bad', floor_id: 'eg' },
  { area_id: 'attic', name: 'Dachboden', floor_id: null },
];

function build(config: Record<string, unknown>, groupByFloors = false) {
  const hass = makeHass({
    areas: AREAS,
    floors: [{ floor_id: 'eg', name: 'Erdgeschoss', level: 0 }],
  });
  Registry.initialize(hass, config);
  const visibleAreas = AREAS.map((a) => ({ ...a }));
  return createAreasSection(visibleAreas, groupByFloors, hass);
}

beforeEach(() => {
  Registry.resetForTesting();
});

describe('area card user visibility', () => {
  it('adds the room view rule to the matching area card only', () => {
    const section = build({ view_visible_users: { kitchen: ['u1'] } }) as LovelaceSectionConfig;
    const kitchen = section.cards?.find((c) => c.area === 'kitchen');
    const bath = section.cards?.find((c) => c.area === 'bath');
    expect(kitchen?.visibility).toEqual([{ condition: 'user', users: ['u1'] }]);
    expect(bath?.visibility).toBeUndefined();
  });

  it('keeps the flat heading unconditional while any area is unrestricted', () => {
    const section = build({ view_visible_users: { kitchen: ['u1'] } }) as LovelaceSectionConfig;
    const heading = section.cards?.find((c) => c.type === 'heading');
    expect(heading?.visibility).toBeUndefined();
  });

  it('applies the union rule to the flat heading when every area is restricted', () => {
    const section = build({
      view_visible_users: { kitchen: ['u1'], bath: ['u2'], attic: [] },
    }) as LovelaceSectionConfig;
    const heading = section.cards?.find((c) => c.type === 'heading');
    expect(heading?.visibility).toEqual([{ condition: 'user', users: ['u1', 'u2'] }]);
  });

  it('applies per-floor union rules to floor headings', () => {
    const sections = build(
      { view_visible_users: { kitchen: ['u1'], bath: ['u1', 'u2'] } },
      true
    ) as LovelaceSectionConfig[];
    expect(Array.isArray(sections)).toBe(true);
    const floorSection = sections.find((s) => s.cards?.some((c) => c.heading === 'Erdgeschoss'));
    const otherSection = sections.find((s) => s.cards?.some((c) => c.area === 'attic'));
    const floorHeading = floorSection?.cards?.find((c) => c.type === 'heading');
    const otherHeading = otherSection?.cards?.find((c) => c.type === 'heading');
    expect(floorHeading?.visibility).toEqual([{ condition: 'user', users: ['u1', 'u2'] }]);
    // attic has no rule → "Weitere Bereiche" heading stays unconditional
    expect(otherHeading?.visibility).toBeUndefined();
  });
});

function areaCards(sections: LovelaceSectionConfig | LovelaceSectionConfig[] | null): LovelaceCardConfig[] {
  if (!sections) return [];
  const list = Array.isArray(sections) ? sections : [sections];
  return list.flatMap((section) => section.cards ?? []).filter((card) => card.type === 'area');
}

function buildDisplay(
  config: Simon42StrategyConfig,
  areas: Array<{ area_id: string; name: string; floor_id?: string | null; picture?: string | null }>,
  groupByFloors = false
): LovelaceCardConfig[] {
  const hass = makeHass({
    areas,
    floors: groupByFloors ? [{ floor_id: 'ground', name: 'Ground floor' }] : [],
  });
  Registry.initialize(hass, config);
  return areaCards(createAreasSection(Object.values(hass.areas), groupByFloors, hass));
}

describe('area card display type', () => {
  it('keeps compact as the default for existing configurations', () => {
    const cards = buildDisplay({}, [
      { area_id: 'living_room', name: 'Living room', picture: '/local/living.jpg' },
    ]);
    expect(cards[0]?.display_type).toBe('compact');
  });

  it('uses the global picture mode when the area has a picture', () => {
    const cards = buildDisplay(
      { area_display_type: 'picture' },
      [{ area_id: 'living_room', name: 'Living room', picture: '/local/living.jpg' }]
    );
    expect(cards[0]?.display_type).toBe('picture');
  });

  it('falls back to compact when picture mode is requested without an area picture', () => {
    const cards = buildDisplay(
      { area_display_type: 'picture' },
      [{ area_id: 'living_room', name: 'Living room' }]
    );
    expect(cards[0]?.display_type).toBe('compact');
  });

  it('lets a per-area picture mode override the global compact mode', () => {
    const cards = buildDisplay(
      { areas_options: { living_room: { display_type: 'picture' } } },
      [{ area_id: 'living_room', name: 'Living room', picture: '/local/living.jpg' }]
    );
    expect(cards[0]?.display_type).toBe('picture');
  });

  it('lets a per-area compact mode override the global picture mode', () => {
    const cards = buildDisplay(
      {
        area_display_type: 'picture',
        areas_options: { living_room: { display_type: 'compact' } },
      },
      [{ area_id: 'living_room', name: 'Living room', picture: '/local/living.jpg' }]
    );
    expect(cards[0]?.display_type).toBe('compact');
  });

  it('preserves display type resolution when areas are grouped by floor', () => {
    const cards = buildDisplay(
      { area_display_type: 'picture' },
      [
        {
          area_id: 'living_room',
          name: 'Living room',
          floor_id: 'ground',
          picture: '/local/living.jpg',
        },
      ],
      true
    );
    expect(cards).toHaveLength(1);
    expect(cards[0]?.display_type).toBe('picture');
  });
});
