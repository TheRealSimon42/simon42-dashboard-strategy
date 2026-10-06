// ============================================================================
// Tests — Room View Strategy (scene chips on light groups)
// ============================================================================
// Two options decide where a room's scenes show up:
//   - show_scene_chips (opt-in) hands the room's lights group card the
//     `scene_chips` flag, so a group's scenes render as chips under it
//   - show_scenes_section_in_rooms (opt-out) drops the flat "Scenes" block
// Without either key the room view must look exactly like before: a scenes
// section and no chips.
//
// The strategy class is not exported (it only registers itself); the node
// test environment has no DOM, so the two globals are stubbed and the class
// is captured from customElements.define().
// ============================================================================

import { describe, it, expect, vi } from 'vitest';

import { makeHass } from '../fixtures/hass';
import { Registry } from '../../src/Registry';
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
await import('../../src/views/RoomViewStrategy');

const AREA = { area_id: 'wohnzimmer', name: 'Wohnzimmer' };

const hass = makeHass({
  areas: [AREA],
  entities: [
    {
      entity_id: 'light.wohnzimmer',
      area_id: 'wohnzimmer',
      attributes: { friendly_name: 'Wohnzimmer', supported_color_modes: ['color_temp'] },
    },
    {
      entity_id: 'scene.wohnzimmer_entspannen',
      area_id: 'wohnzimmer',
      attributes: { friendly_name: 'Wohnzimmer Entspannen', entity_id: ['light.wohnzimmer'] },
    },
  ],
});

async function roomCards(config: Simon42StrategyConfig): Promise<LovelaceCardConfig[]> {
  const strategy = defined.get('ll-strategy-simon42-view-room');
  if (!strategy) throw new Error('room view strategy not registered');
  Registry.resetForTesting();
  const view = await strategy.generate({ area: AREA, dashboardConfig: config }, hass);
  return (view.sections ?? []).flatMap(function sectionCards(section) {
    return section.cards ?? [];
  });
}

function lightsCard(cards: LovelaceCardConfig[]): LovelaceCardConfig | undefined {
  return cards.find((card) => card.type === 'custom:simon42-lights-group-card');
}

function sceneTiles(cards: LovelaceCardConfig[]): LovelaceCardConfig[] {
  return cards.filter((card) => card.type === 'tile' && String(card.entity).startsWith('scene.'));
}

describe('room view — scenes', () => {
  it('keeps the scenes section and renders no chips without any config', async () => {
    const cards = await roomCards({});
    expect(sceneTiles(cards).map((card) => card.entity)).toEqual(['scene.wohnzimmer_entspannen']);
    expect(lightsCard(cards)?.scene_chips).toBe(false);
  });

  it('turns the chips on with show_scene_chips and keeps the section', async () => {
    const cards = await roomCards({ show_scene_chips: true });
    expect(lightsCard(cards)?.scene_chips).toBe(true);
    expect(sceneTiles(cards)).toHaveLength(1);
  });

  it('drops the scenes section with show_scenes_section_in_rooms: false', async () => {
    const cards = await roomCards({ show_scene_chips: true, show_scenes_section_in_rooms: false });
    expect(sceneTiles(cards)).toHaveLength(0);
    expect(lightsCard(cards)?.scene_chips).toBe(true);
  });
});
