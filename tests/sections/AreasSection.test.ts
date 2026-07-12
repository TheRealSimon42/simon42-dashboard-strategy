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
import type { LovelaceSectionConfig } from '../../src/types/lovelace';

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
