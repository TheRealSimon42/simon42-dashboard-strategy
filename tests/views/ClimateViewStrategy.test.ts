// ============================================================================
// Tests — Climate View Strategy (hide_hidden_areas_in_summaries, #428)
// ============================================================================
// The climate view is built at generate time from the Registry. Thermostats
// in areas hidden on the overview stay in the view by default and leave it
// only with the opt-in — the same set the climate summary tile counts.
//
// The strategy class is not exported; DOM globals are stubbed and the class
// is captured from customElements.define() (see LightsViewStrategy.test.ts).
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Registry } from '../../src/Registry';
import { makeHass, type HassFixtureSpec } from '../fixtures/hass';
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
await import('../../src/views/ClimateViewStrategy');

function climateSpec(): HassFixtureSpec {
  return {
    areas: [
      { area_id: 'abstellkammer', name: 'Abstellkammer' },
      { area_id: 'wohnzimmer', name: 'Wohnzimmer' },
    ],
    devices: [{ id: 'dev_kammer', area_id: 'abstellkammer', name: 'Kammer-Heizung' }],
    entities: [
      { entity_id: 'climate.kammer', device_id: 'dev_kammer', state: 'heat', attributes: { hvac_action: 'heating' } },
      { entity_id: 'climate.wohnzimmer', area_id: 'wohnzimmer', state: 'heat', attributes: { hvac_action: 'heating' } },
      { entity_id: 'climate.ohne_bereich', state: 'off' },
    ],
  };
}

async function climateTiles(config: Simon42StrategyConfig): Promise<LovelaceCardConfig[]> {
  const strategy = defined.get('ll-strategy-simon42-view-climate');
  if (!strategy) throw new Error('climate view strategy not registered');
  const view = await strategy.generate({ config }, makeHass(climateSpec()));
  return (view.sections ?? [])
    .flatMap(function sectionCards(section) {
      return section.cards ?? [];
    })
    .filter((c) => c.type === 'tile');
}

beforeEach(() => {
  Registry.resetForTesting();
});

describe('climate view — hidden overview areas', () => {
  const HIDDEN_KAMMER: Simon42StrategyConfig = { areas_display: { hidden: ['abstellkammer'] } };

  it('keeps thermostats of hidden overview areas by default', async () => {
    const tiles = await climateTiles(HIDDEN_KAMMER);
    expect(tiles.map((t) => t.entity)).toEqual(['climate.kammer', 'climate.wohnzimmer', 'climate.ohne_bereich']);
  });

  it('leaves them out with hide_hidden_areas_in_summaries, area-less ones stay', async () => {
    const tiles = await climateTiles({ ...HIDDEN_KAMMER, hide_hidden_areas_in_summaries: true });
    expect(tiles.map((t) => t.entity)).toEqual(['climate.wohnzimmer', 'climate.ohne_bereich']);
  });
});
