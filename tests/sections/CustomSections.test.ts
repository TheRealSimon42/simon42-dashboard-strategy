// ============================================================================
// Tests — Custom Sections (user-declared overview sections)
// ============================================================================
// Locks down the extension-hook contract: key validation (built-in
// collision, duplicates), auto-hide, defensive card filtering and the
// heading-only case for sections that exist purely as a custom_cards
// target. Snapshot captures the assembled grid.
//
// Since beta.12 the YAML field takes a COMPLETE section config
// (type: grid + cards) with section-level passthrough; bare cards and
// card lists keep working via the legacy path (heading/icon synthesis).
// ============================================================================

import { describe, it, expect } from 'vitest';

import {
  validateCustomSections,
  buildCustomSection,
  buildAreaCustomSections,
  normalizeSectionYaml,
  customSectionHasCards,
} from '../../src/sections/CustomSections';
import type { CustomSection } from '../../src/types/strategy';

function section(overrides: Partial<CustomSection> = {}): CustomSection {
  return {
    key: 'my_test',
    heading: 'Test',
    parsed_config: [{ type: 'markdown', content: 'hi' }],
    ...overrides,
  };
}

describe('validateCustomSections', () => {
  it('returns empty array for undefined/empty input', () => {
    expect(validateCustomSections(undefined)).toEqual([]);
    expect(validateCustomSections([])).toEqual([]);
  });

  it('drops entries without a usable key', () => {
    expect(
      validateCustomSections([
        section({ key: '' }),
        section({ key: '   ' }),
        section({ key: undefined as unknown as string }),
      ])
    ).toEqual([]);
  });

  it('drops keys colliding with built-in sections (built-in wins)', () => {
    const result = validateCustomSections([
      section({ key: 'overview' }),
      section({ key: 'energy' }),
      section({ key: 'plants' }),
      section({ key: 'my_valid' }),
    ]);
    expect(result.map((s) => s.key)).toEqual(['my_valid']);
  });

  it('keeps the first entry on duplicate keys', () => {
    const result = validateCustomSections([
      section({ key: 'my_dup', heading: 'First' }),
      section({ key: 'my_dup', heading: 'Second' }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].heading).toBe('First');
  });
});

describe('buildCustomSection', () => {
  it('returns null when there are no cards (auto-hide)', () => {
    expect(buildCustomSection(section({ parsed_config: undefined }))).toBeNull();
    expect(buildCustomSection(section({ parsed_config: [] }))).toBeNull();
    expect(buildCustomSection(section({ parsed_config: null }))).toBeNull();
  });

  it('returns null when every card is malformed', () => {
    expect(
      buildCustomSection(
        section({ parsed_config: [{ content: 'no type' }, { type: 42 } as unknown as Record<string, unknown>] })
      )
    ).toBeNull();
  });

  it('drops malformed cards but keeps valid ones', () => {
    const result = buildCustomSection(
      section({ parsed_config: [{ content: 'no type' }, { type: 'markdown', content: 'ok' }] })
    );
    expect(result?.cards).toHaveLength(2); // heading + 1 valid card
    expect(result?.cards?.[1]).toEqual({ type: 'markdown', content: 'ok' });
  });

  it('renders a heading-only section when empty but targeted by custom cards', () => {
    const result = buildCustomSection(section({ parsed_config: [] }), true);
    expect(result).not.toBeNull();
    expect(result?.cards).toHaveLength(1);
    expect(result?.cards?.[0]).toMatchObject({ type: 'heading', heading: 'Test' });
  });

  it('omits the heading card when no heading is set', () => {
    const result = buildCustomSection(section({ heading: undefined }));
    expect(result?.cards?.[0]).toEqual({ type: 'markdown', content: 'hi' });
  });

  it('assembles heading with icon plus cards (snapshot)', () => {
    expect(
      buildCustomSection(
        section({
          key: 'my_morning',
          heading: 'Guten Morgen',
          icon: 'mdi:weather-sunrise',
          parsed_config: [
            { type: 'markdown', content: 'Kaffee ist fertig' },
            { type: 'tile', entity: 'light.kitchen' },
          ],
        })
      )
    ).toMatchSnapshot();
  });
});

describe('buildCustomSection — complete section YAML (since beta.12)', () => {
  it('passes section-level props through (visibility, column_span)', () => {
    const result = buildCustomSection(
      section({
        heading: undefined,
        parsed_config: {
          type: 'grid',
          column_span: 2,
          visibility: [{ condition: 'state', entity: 'binary_sensor.garage', state: 'on' }],
          cards: [{ type: 'markdown', content: 'ok' }],
        },
      })
    );
    expect(result).toMatchObject({
      type: 'grid',
      column_span: 2,
      visibility: [{ condition: 'state', entity: 'binary_sensor.garage', state: 'on' }],
    });
    expect(result?.cards).toEqual([{ type: 'markdown', content: 'ok' }]);
  });

  it('treats an object with cards but no type as a section (type defaults to grid)', () => {
    const result = buildCustomSection(
      section({ heading: undefined, parsed_config: { cards: [{ type: 'markdown', content: 'ok' }] } })
    );
    expect(result?.type).toBe('grid');
    expect(result?.cards).toHaveLength(1);
  });

  it('ignores the legacy heading/icon fields in complete-section form', () => {
    const result = buildCustomSection(
      section({
        heading: 'Legacy-Feld',
        icon: 'mdi:star',
        parsed_config: { type: 'grid', cards: [{ type: 'markdown', content: 'ok' }] },
      })
    );
    // no synthesized heading card — the user's YAML is the section
    expect(result?.cards).toEqual([{ type: 'markdown', content: 'ok' }]);
  });

  it('wraps a single non-grid card into a grid section', () => {
    const result = buildCustomSection(
      section({ heading: undefined, parsed_config: { type: 'custom:trash-card', entities: ['calendar.abfall'] } })
    );
    expect(result).toEqual({
      type: 'grid',
      cards: [{ type: 'custom:trash-card', entities: ['calendar.abfall'] }],
    });
  });

  it('keeps a grid card inside a list as a card (escape hatch)', () => {
    const result = buildCustomSection(
      section({ heading: undefined, parsed_config: [{ type: 'grid', columns: 3, cards: [{ type: 'button' }] }] })
    );
    expect(result?.cards).toEqual([{ type: 'grid', columns: 3, cards: [{ type: 'button' }] }]);
  });

  it('filters malformed cards inside a complete section', () => {
    const result = buildCustomSection(
      section({
        heading: undefined,
        parsed_config: { type: 'grid', cards: [{ content: 'no type' }, { type: 'markdown', content: 'ok' }, null] },
      })
    );
    expect(result?.cards).toEqual([{ type: 'markdown', content: 'ok' }]);
  });

  it('auto-hides a complete section without valid cards', () => {
    expect(
      buildCustomSection(section({ heading: undefined, parsed_config: { type: 'grid', cards: [] } }))
    ).toBeNull();
  });

  it('keeps section props when empty but targeted by custom cards', () => {
    const result = buildCustomSection(
      section({ heading: undefined, parsed_config: { type: 'grid', column_span: 2, cards: [] } }),
      true
    );
    expect(result).toMatchObject({ type: 'grid', column_span: 2 });
    expect(result?.cards).toEqual([]);
  });
});

describe('normalizeSectionYaml', () => {
  it('returns null for scalars and empty values', () => {
    expect(normalizeSectionYaml(undefined)).toBeNull();
    expect(normalizeSectionYaml(null)).toBeNull();
    expect(normalizeSectionYaml('text')).toBeNull();
    expect(normalizeSectionYaml(42)).toBeNull();
  });

  it('classifies arrays as card lists', () => {
    const result = normalizeSectionYaml([{ type: 'markdown' }]);
    expect(result?.sectionProps).toBeNull();
    expect(result?.cards).toHaveLength(1);
  });

  it('classifies grid objects with cards as sections', () => {
    const result = normalizeSectionYaml({ type: 'grid', cards: [] });
    expect(result?.sectionProps).not.toBeNull();
  });

  it('classifies other objects as single cards', () => {
    const result = normalizeSectionYaml({ type: 'vertical-stack', cards: [{ type: 'button' }] });
    expect(result?.sectionProps).toBeNull();
    expect(result?.cards).toEqual([{ type: 'vertical-stack', cards: [{ type: 'button' }] }]);
  });
});

describe('customSectionHasCards', () => {
  it('is false for missing/empty/malformed configs', () => {
    expect(customSectionHasCards(section({ parsed_config: undefined }))).toBe(false);
    expect(customSectionHasCards(section({ parsed_config: { type: 'grid', cards: [] } }))).toBe(false);
    expect(customSectionHasCards(section({ parsed_config: [{ content: 'no type' }] }))).toBe(false);
  });

  it('is true as soon as one valid card exists (both forms)', () => {
    expect(customSectionHasCards(section({ parsed_config: [{ type: 'markdown' }] }))).toBe(true);
    expect(customSectionHasCards(section({ parsed_config: { type: 'grid', cards: [{ type: 'markdown' }] } }))).toBe(true);
  });
});

describe('buildAreaCustomSections', () => {
  function areaSection(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      heading: 'Raum-Block',
      parsed_config: [{ type: 'markdown', content: 'hi' }],
      ...overrides,
    };
  }

  it('returns empty array for undefined input', () => {
    expect(buildAreaCustomSections(undefined, 'top')).toEqual([]);
    expect(buildAreaCustomSections([], 'bottom')).toEqual([]);
  });

  it('defaults entries without position to bottom', () => {
    const sections = [areaSection()];
    expect(buildAreaCustomSections(sections, 'top')).toHaveLength(0);
    expect(buildAreaCustomSections(sections, 'bottom')).toHaveLength(1);
  });

  it('partitions entries by position', () => {
    const sections = [
      areaSection({ heading: 'A', position: 'top' }),
      areaSection({ heading: 'B', position: 'bottom' }),
      areaSection({ heading: 'C', position: 'top' }),
    ];
    const top = buildAreaCustomSections(sections, 'top');
    expect(top).toHaveLength(2);
    expect(top[0].cards?.[0]).toMatchObject({ heading: 'A' });
    expect(top[1].cards?.[0]).toMatchObject({ heading: 'C' });
    expect(buildAreaCustomSections(sections, 'bottom')).toHaveLength(1);
  });

  it('drops empty and malformed entries (auto-hide)', () => {
    const sections = [
      areaSection({ parsed_config: [] }),
      null as unknown as Record<string, unknown>,
      areaSection({ parsed_config: [{ content: 'no type' }] }),
    ];
    expect(buildAreaCustomSections(sections, 'bottom')).toHaveLength(0);
  });

  it('supports complete section YAML with position (since beta.12)', () => {
    const sections = [
      areaSection({
        heading: undefined,
        position: 'top',
        parsed_config: {
          type: 'grid',
          visibility: [{ condition: 'state', entity: 'input_boolean.gaeste', state: 'on' }],
          cards: [{ type: 'markdown', content: 'Heizung' }],
        },
      }),
    ];
    const top = buildAreaCustomSections(sections, 'top');
    expect(top).toHaveLength(1);
    expect(top[0]).toMatchObject({
      type: 'grid',
      visibility: [{ condition: 'state', entity: 'input_boolean.gaeste', state: 'on' }],
    });
    expect(top[0].cards).toEqual([{ type: 'markdown', content: 'Heizung' }]);
  });
});
