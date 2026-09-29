// ============================================================================
// Tests — Covers View Strategy (hide_hidden_areas_in_summaries, #428)
// ============================================================================
// Every covers group card — the main open/closed pair, awnings and windows —
// gets the same `hidden_areas` list when the opt-in is set and areas are
// hidden on the overview; by default the key is absent everywhere.
//
// The strategy class is not exported; DOM globals are stubbed and the class
// is captured from customElements.define() (see LightsViewStrategy.test.ts).
// ============================================================================

import { describe, it, expect, vi } from 'vitest';

import { makeHass } from '../fixtures/hass';
import type { Simon42StrategyConfig } from '../../src/types/strategy';
import type { LovelaceCardConfig, LovelaceViewConfig } from '../../src/types/lovelace';

interface ViewStrategyClass {
  generate(config: Record<string, unknown>, hass: unknown): Promise<LovelaceViewConfig>;
}

const defined = new Map<string, ViewStrategyClass>();
vi.stubGlobal('HTMLElement', class {});
vi.stubGlobal('customElements', {
  define(name: string, cls: unknown) {
    defined.set(name, cls as ViewStrategyClass);
  },
  get: vi.fn(),
});
await import('../../src/views/CoversViewStrategy');

const ALL_CLASSES = ['awning', 'blind', 'curtain', 'shade', 'shutter', 'window'];

async function coverCards(config: Simon42StrategyConfig): Promise<LovelaceCardConfig[]> {
  const strategy = defined.get('ll-strategy-simon42-view-covers');
  if (!strategy) throw new Error('covers view strategy not registered');
  const view = await strategy.generate({ device_classes: ALL_CLASSES, config }, makeHass({}));
  return (view.sections ?? []).flatMap(function sectionCards(section) {
    return section.cards ?? [];
  });
}

describe('covers view — hidden overview areas', () => {
  const HIDDEN_KAMMER: Simon42StrategyConfig = { areas_display: { hidden: ['abstellkammer'] } };

  it('renders covers, awnings and windows group cards without hidden_areas by default', async () => {
    const cards = await coverCards(HIDDEN_KAMMER);
    // open + closed for covers, awnings and windows
    expect(cards).toHaveLength(6);
    for (const card of cards) {
      expect(card.type).toBe('custom:simon42-covers-group-card');
      expect(card).not.toHaveProperty('hidden_areas');
    }
  });

  it('passes the hidden overview areas to every group card with hide_hidden_areas_in_summaries', async () => {
    const cards = await coverCards({ ...HIDDEN_KAMMER, hide_hidden_areas_in_summaries: true });
    expect(cards).toHaveLength(6);
    for (const card of cards) {
      expect(card.hidden_areas).toEqual(['abstellkammer']);
    }
    // The specialised groups are still split by device class
    expect(cards.filter((c) => c.device_classes?.join() === 'awning')).toHaveLength(2);
    expect(cards.filter((c) => c.device_classes?.join() === 'window')).toHaveLength(2);
  });

  it('omits the key when the option is on but no area is hidden', async () => {
    const cards = await coverCards({ hide_hidden_areas_in_summaries: true });
    for (const card of cards) {
      expect(card).not.toHaveProperty('hidden_areas');
    }
  });
});
