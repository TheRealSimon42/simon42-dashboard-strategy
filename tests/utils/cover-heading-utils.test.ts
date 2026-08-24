// ============================================================================
// Tests — combined cover heading actions
// ============================================================================

import { describe, expect, it } from 'vitest';

import { buildCombinedCoverHeadingConfig } from '../../src/utils/cover-heading-utils';

describe('buildCombinedCoverHeadingConfig', () => {
  it('provides both open and close batch actions for one combined group', () => {
    const config = buildCombinedCoverHeadingConfig(['cover.one', 'cover.two'], 'All covers', 'mdi:blinds', 'Open all', 'Close all');
    const badges = config.badges as Array<Record<string, any>>;

    expect(config.heading).toBe('All covers (2)');
    expect(badges.map((badge) => badge.tap_action.perform_action)).toEqual(['cover.open_cover', 'cover.close_cover']);
    expect(badges.every((badge) => Boolean(badge.tap_action.target.entity_id))).toBe(true);
  });
});
