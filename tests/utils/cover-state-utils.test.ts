// ============================================================================
// Tests — cover state grouping and filtering
// ============================================================================

import { describe, expect, it } from 'vitest';

import { getRelevantCoverIds, isCoverInGroup, type CoverStateSnapshot } from '../../src/utils/cover-state-utils';

function snapshot(state: string, position?: number, lastChanged = '2026-05-19T00:00:00+00:00'): CoverStateSnapshot {
  return {
    state,
    attributes: position === undefined ? {} : { current_position: position },
    last_changed: lastChanged,
  };
}

describe('cover state grouping', () => {
  it('includes open, opening, closed and closing in the combined group', () => {
    const states = {
      'cover.open': snapshot('open', 100),
      'cover.opening': snapshot('opening', 50),
      'cover.closed': snapshot('closed', 0),
      'cover.closing': snapshot('closing', 50),
      'cover.unknown': snapshot('unknown'),
    };

    expect(getRelevantCoverIds(Object.keys(states), states, 'all', true)).toEqual([
      'cover.open',
      'cover.opening',
      'cover.closed',
      'cover.closing',
    ]);
  });

  it('keeps the existing open, partially-open and closed rules', () => {
    expect(isCoverInGroup('open', snapshot('open', 50), true)).toBe(false);
    expect(isCoverInGroup('open', snapshot('opening', 100), true)).toBe(true);
    expect(isCoverInGroup('open', snapshot('open', 50), false)).toBe(true);

    expect(isCoverInGroup('partially_open', snapshot('open', 50), true)).toBe(true);
    expect(isCoverInGroup('partially_open', snapshot('closing', 50), true)).toBe(true);
    expect(isCoverInGroup('partially_open', snapshot('closed', 0), true)).toBe(false);

    expect(isCoverInGroup('closed', snapshot('closed', 0), true)).toBe(true);
    expect(isCoverInGroup('closed', snapshot('closing', 50), true)).toBe(false);
    expect(isCoverInGroup('closed', snapshot('closing', 50), false)).toBe(true);
  });

  it('filters unavailable and missing entities without changing the group rules', () => {
    const states = {
      'cover.available': snapshot('closed'),
      'cover.unavailable': snapshot('open'),
    };

    expect(getRelevantCoverIds(
      ['cover.available', 'cover.unavailable', 'cover.missing'],
      states,
      'all',
      false,
      (entityId) => entityId !== 'cover.unavailable',
    )).toEqual(['cover.available']);
  });
});
