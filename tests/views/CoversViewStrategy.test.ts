// ============================================================================
// Tests — covers view grouping configuration
// ============================================================================

import { describe, expect, it } from 'vitest';

import { buildCoversCards } from '../../src/views/CoversViewStrategy';

function groupTypes(config: Record<string, unknown> = {}): string[] {
  return buildCoversCards({
    device_classes: ['blind', 'awning', 'window'],
    entities: ['cover.example'],
    config,
  }).map((card) => card.group_type);
}

describe('buildCoversCards', () => {
  it('keeps the existing state grouping as the default', () => {
    expect(groupTypes()).toEqual(['open', 'closed', 'open', 'closed', 'open', 'closed']);
  });

  it('creates one reactive group per cover category when state grouping is disabled', () => {
    const cards = buildCoversCards({
      device_classes: ['blind', 'awning', 'window'],
      entities: ['cover.example'],
      config: {
        group_covers_by_state: false,
        show_partially_open_covers: true,
        group_covers_by_floors: true,
        group_covers_by_areas: true,
      },
    });

    expect(cards.map((card) => card.group_type)).toEqual(['all', 'all', 'all']);
    expect(cards.every((card) => card.show_partially_open === undefined)).toBe(true);
    expect(cards.every((card) => card.group_by_floors === true)).toBe(true);
    expect(cards.every((card) => card.group_by_areas === true)).toBe(true);
    expect(cards.map((card) => card.device_classes)).toEqual([['blind'], ['awning'], ['window']]);
  });

  it('keeps the partial-state card only in the existing state-grouped mode', () => {
    expect(groupTypes({ show_partially_open_covers: true })).toEqual([
      'open',
      'partially_open',
      'closed',
      'open',
      'partially_open',
      'closed',
      'open',
      'partially_open',
      'closed',
    ]);
  });
});
