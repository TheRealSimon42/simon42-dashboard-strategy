// ============================================================================
// Tests — Lights View Strategy (hide_hidden_areas_in_summaries, #428)
// ============================================================================
// The lights view hands the group cards a `hidden_areas` list only when the
// opt-in hide_hidden_areas_in_summaries is set AND areas are hidden on the
// overview. By default the key is absent, so the cards keep listing every
// visible light — hidden overview areas included (AmyKincaid's storeroom).
//
// The strategy class is not exported (it only registers itself); the node
// test environment has no DOM, so the two globals are stubbed and the class
// is captured from customElements.define().
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
await import('../../src/views/LightsViewStrategy');

async function lightsCards(config: Simon42StrategyConfig): Promise<LovelaceCardConfig[]> {
  const strategy = defined.get('ll-strategy-simon42-view-lights');
  if (!strategy) throw new Error('lights view strategy not registered');
  const view = await strategy.generate({ config }, makeHass({}));
  return (view.sections ?? []).flatMap(function sectionCards(section) {
    return section.cards ?? [];
  });
}

describe('lights view — hidden overview areas', () => {
  const HIDDEN_KAMMER: Simon42StrategyConfig = { areas_display: { hidden: ['abstellkammer'] } };

  it('renders the on/off group cards without hidden_areas by default', async () => {
    const cards = await lightsCards(HIDDEN_KAMMER);
    expect(cards.map((c) => c.group_type)).toEqual(['on', 'off']);
    for (const card of cards) {
      expect(card.type).toBe('custom:simon42-lights-group-card');
      expect(card).not.toHaveProperty('hidden_areas');
    }
  });

  it('passes the hidden overview areas to both group cards with hide_hidden_areas_in_summaries', async () => {
    const cards = await lightsCards({ ...HIDDEN_KAMMER, hide_hidden_areas_in_summaries: true });
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(card.hidden_areas).toEqual(['abstellkammer']);
    }
  });

  it('omits the key when the option is on but no area is hidden', async () => {
    const cards = await lightsCards({ hide_hidden_areas_in_summaries: true });
    for (const card of cards) {
      expect(card).not.toHaveProperty('hidden_areas');
    }
  });
});
