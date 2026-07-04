// ============================================================================
// Tests — Custom Sections (user-declared overview sections)
// ============================================================================
// Locks down the extension-hook contract: key validation (built-in
// collision, duplicates), auto-hide, defensive card filtering and the
// heading-only case for sections that exist purely as a custom_cards
// target. Snapshot captures the assembled grid.
// ============================================================================

import { describe, it, expect } from 'vitest';

import { validateCustomSections, buildCustomSection } from '../../src/sections/CustomSections';
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
