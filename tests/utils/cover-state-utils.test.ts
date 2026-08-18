// ============================================================================
// Tests — Cover grouping while moving (#435)
// ============================================================================

import { describe, expect, it } from 'vitest';

import { isCoverRelevantForGroup } from '../../src/utils/cover-state-utils';

describe('isCoverRelevantForGroup', () => {
  it('keeps an opening cover visible at the 0% endpoint in partial mode', () => {
    expect(isCoverRelevantForGroup('opening', 0, 'partially_open', true)).toBe(true);
    expect(isCoverRelevantForGroup('opening', 0, 'open', true)).toBe(false);
  });

  it('keeps a closing cover visible at the 100% endpoint in partial mode', () => {
    expect(isCoverRelevantForGroup('closing', 100, 'partially_open', true)).toBe(true);
    expect(isCoverRelevantForGroup('closing', 100, 'closed', true)).toBe(false);
  });

  it('keeps moving covers in the partial group between endpoints', () => {
    expect(isCoverRelevantForGroup('opening', 50, 'partially_open', true)).toBe(true);
    expect(isCoverRelevantForGroup('closing', 50, 'partially_open', true)).toBe(true);
    expect(isCoverRelevantForGroup('opening', 50, 'open', true)).toBe(false);
    expect(isCoverRelevantForGroup('closing', 50, 'closed', true)).toBe(false);
  });

  it('preserves normal open and closed grouping', () => {
    expect(isCoverRelevantForGroup('open', 100, 'open', true)).toBe(true);
    expect(isCoverRelevantForGroup('closed', 0, 'closed', true)).toBe(true);
    expect(isCoverRelevantForGroup('open', 100, 'partially_open', true)).toBe(false);
    expect(isCoverRelevantForGroup('closed', 0, 'partially_open', true)).toBe(false);
  });

  it('keeps the original moving behavior when partial mode is disabled', () => {
    expect(isCoverRelevantForGroup('opening', 0, 'open', false)).toBe(true);
    expect(isCoverRelevantForGroup('closing', 100, 'closed', false)).toBe(true);
    expect(isCoverRelevantForGroup('opening', 50, 'open', false)).toBe(true);
    expect(isCoverRelevantForGroup('closing', 50, 'closed', false)).toBe(true);
  });
});

