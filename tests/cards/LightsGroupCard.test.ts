// ============================================================================
// Tests — Lights Group Card: hidden overview areas (#428)
// ============================================================================
// Two contracts of the lights view cards:
//  - `hidden_areas` (set by the view only with hide_hidden_areas_in_summaries)
//    removes those areas' lights from the card's source list — flat and
//    grouped alike. Without it every visible light is listed.
//  - The area-grouped layout buckets lights of areas hidden on the overview
//    under their own area heading (user order applies, no link to the
//    non-existent room view) instead of silently dropping them, matching the
//    security view (#410). Previously they vanished from the grouped view
//    while the flat view and the summary count still had them.
//
// The card is a LitElement defined at import time. Lit's element base
// accepts the bare HTMLElement stub; the instance is never connected, so no
// render cycle runs — only the pure list/bucketing methods are exercised.
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Registry } from '../../src/Registry';
import { makeHass, type HassFixtureSpec } from '../fixtures/hass';
import type { HomeAssistant } from '../../src/types/homeassistant';

interface AreaGroup {
  areaId: string | null;
  areaName: string;
  roomPath: string | null;
  lights: string[];
}

interface LightsCardInternals {
  hass?: HomeAssistant;
  setConfig(config: Record<string, unknown>): void;
  _getSourceLightEntities(): string[];
  _groupByAreas(lights: string[]): AreaGroup[];
  _buildHeadingConfig(lights: string[], opts: Record<string, unknown>): Record<string, unknown>;
}

const defined = new Map<string, new () => LightsCardInternals>();
vi.stubGlobal('HTMLElement', class {});
vi.stubGlobal('customElements', {
  define(name: string, cls: unknown) {
    defined.set(name, cls as new () => LightsCardInternals);
  },
  get: vi.fn(),
});
await import('../../src/cards/LightsGroupCard');

function lightsSpec(): HassFixtureSpec {
  return {
    areas: [
      { area_id: 'abstellkammer', name: 'Abstellkammer' },
      { area_id: 'wohnzimmer', name: 'Wohnzimmer' },
    ],
    devices: [{ id: 'dev_kammer', area_id: 'abstellkammer', name: 'Kammer-Hub' }],
    entities: [
      { entity_id: 'light.wohnzimmer', area_id: 'wohnzimmer', state: 'on' },
      // area via the device — the storeroom is hidden on the overview
      { entity_id: 'light.kammer', device_id: 'dev_kammer', state: 'on' },
      { entity_id: 'light.flur', state: 'on' },
    ],
  };
}

// Storeroom hidden on the overview, living room ordered first
const DASHBOARD_CONFIG = { areas_display: { hidden: ['abstellkammer'], order: ['wohnzimmer', 'abstellkammer'] } };

function makeCard(hass: HomeAssistant, cardConfig: Record<string, unknown> = {}): LightsCardInternals {
  const Card = defined.get('simon42-lights-group-card');
  if (!Card) throw new Error('lights group card not registered');
  const card = new Card();
  card.setConfig({ group_type: 'on', group_by_areas: true, config: DASHBOARD_CONFIG, ...cardConfig });
  card.hass = hass;
  return card;
}

let hass: HomeAssistant;

beforeEach(() => {
  Registry.resetForTesting();
  hass = makeHass(lightsSpec());
  Registry.initialize(hass, DASHBOARD_CONFIG);
});

describe('source light list', () => {
  it('lists lights of hidden overview areas by default', () => {
    expect(makeCard(hass)._getSourceLightEntities()).toEqual(['light.wohnzimmer', 'light.kammer', 'light.flur']);
  });

  it('leaves out lights of the areas in hidden_areas, area-less lights stay', () => {
    const card = makeCard(hass, { hidden_areas: ['abstellkammer'] });
    expect(card._getSourceLightEntities()).toEqual(['light.wohnzimmer', 'light.flur']);
  });

  it('applies hidden_areas to an explicit entity list as well', () => {
    const card = makeCard(hass, {
      entities: ['light.kammer', 'light.flur', 'light.wohnzimmer'],
      hidden_areas: ['abstellkammer'],
    });
    expect(card._getSourceLightEntities()).toEqual(['light.flur', 'light.wohnzimmer']);
  });

  it('ignores an empty hidden_areas list', () => {
    expect(makeCard(hass, { hidden_areas: [] })._getSourceLightEntities()).toHaveLength(3);
  });
});

describe('area-grouped layout', () => {
  it('buckets hidden-area lights under their own heading in user order, without a room link', () => {
    const card = makeCard(hass);
    const groups = card._groupByAreas(card._getSourceLightEntities());
    expect(groups.map((g) => g.areaName)).toEqual(['Wohnzimmer', 'Abstellkammer', 'No area']);
    expect(groups.map((g) => g.lights)).toEqual([['light.wohnzimmer'], ['light.kammer'], ['light.flur']]);
    // Visible area → room view; hidden area and the no-area bucket → no link
    expect(groups.map((g) => g.roomPath)).toEqual(['wohnzimmer', null, null]);
  });

  it('has no bucket for the hidden area once hidden_areas filters its lights', () => {
    const card = makeCard(hass, { hidden_areas: ['abstellkammer'] });
    const groups = card._groupByAreas(card._getSourceLightEntities());
    expect(groups.map((g) => g.areaName)).toEqual(['Wohnzimmer', 'No area']);
  });

  it('links area headings to the room view only when the area has one', () => {
    const card = makeCard(hass);
    const linked = card._buildHeadingConfig(['light.wohnzimmer'], {
      label: 'Wohnzimmer',
      level: 'area',
      roomPath: 'wohnzimmer',
    });
    expect(linked.tap_action).toEqual({ action: 'navigate', navigation_path: 'wohnzimmer' });

    const unlinked = card._buildHeadingConfig(['light.kammer'], {
      label: 'Abstellkammer',
      level: 'area',
      roomPath: null,
    });
    expect(unlinked).toMatchObject({ type: 'heading', heading: 'Abstellkammer', heading_style: 'subtitle' });
    expect(unlinked).not.toHaveProperty('tap_action');
  });
});
