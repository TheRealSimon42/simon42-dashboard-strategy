import { describe, expect, it } from 'vitest';

import { tileStateContentOptions } from '../../src/utils/tile-state-content';

describe('tileStateContentOptions', () => {
  it.each([
    [false, false, 'light', { state_content: ['last_changed'] }],
    [true, false, 'light', { state_content: ['state', 'last_changed'] }],
    [false, true, 'light', { hide_state: true }],
    [true, true, 'light', { state_content: ['state'] }],
    [true, false, 'scene', { state_content: ['state'] }],
    [true, true, 'scene', { hide_state: true }],
    [false, false, 'scene', { state_content: ['state'] }],
    [false, true, 'scene', { hide_state: true }],
  ])('maps showState=%s, hideLastChanged=%s, domain=%s', (showState, hideLastChanged, domain, expected) => {
    expect(tileStateContentOptions(showState, hideLastChanged, domain)).toEqual(expected);
  });
});