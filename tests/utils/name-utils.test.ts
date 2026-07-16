import { describe, expect, it } from 'vitest';

import { mergeStacksOrder } from '../../src/utils/name-utils';

describe('mergeStacksOrder', () => {
  it('returns the default order when nothing is configured', () => {
    expect(mergeStacksOrder()).toEqual([
      'ups',
      'energy',
      'cameras',
      'lights',
      'locks',
      'climate',
      'covers',
      'covers_curtain',
      'covers_window',
      'media',
      'scenes',
      'vacuums',
      'switches',
      'misc',
      'automations',
      'scripts',
      'room_pins',
    ]);
  });

  it('keeps configured keys first and appends missing defaults', () => {
    expect(mergeStacksOrder(['lights', 'energy', 'room_pins'])).toEqual([
      'lights',
      'energy',
      'room_pins',
      'ups',
      'cameras',
      'locks',
      'climate',
      'covers',
      'covers_curtain',
      'covers_window',
      'media',
      'scenes',
      'vacuums',
      'switches',
      'misc',
      'automations',
      'scripts',
    ]);
  });

  it('drops duplicates and unknown keys', () => {
    expect(mergeStacksOrder(['lights', 'lights', 'unknown' as never, 'misc'])).toEqual([
      'lights',
      'misc',
      'ups',
      'energy',
      'cameras',
      'locks',
      'climate',
      'covers',
      'covers_curtain',
      'covers_window',
      'media',
      'scenes',
      'vacuums',
      'switches',
      'automations',
      'scripts',
      'room_pins',
    ]);
  });
});
