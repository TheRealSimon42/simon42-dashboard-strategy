// ============================================================================
// Tests — Covers Group Card: hidden overview areas (#428)
// ============================================================================
// Mirror of LightsGroupCard.test.ts for the covers card: `hidden_areas`
// removes those areas' covers from the filtered source list, and the
// area-grouped layout keeps covers of areas hidden on the overview under
// their own (unlinked) area heading instead of dropping them silently.
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Registry } from '../../src/Registry';
import { makeHass, type HassFixtureSpec } from '../fixtures/hass';
import type { HomeAssistant } from '../../src/types/homeassistant';

interface AreaGroup {
  areaId: string | null;
  areaName: string;
  roomPath: string | null;
  covers: string[];
}

interface CoversCardInternals {
  hass?: HomeAssistant;
  setConfig(config: Record<string, unknown>): void;
  _getFilteredCoverEntities(hass: HomeAssistant): string[];
  _groupByAreas(covers: string[]): AreaGroup[];
  _buildHeadingConfig(covers: string[], opts: Record<string, unknown>): Record<string, unknown>;
}

const defined = new Map<string, new () => CoversCardInternals>();
vi.stubGlobal('HTMLElement', class {});
vi.stubGlobal('customElements', {
  define(name: string, cls: unknown) {
    defined.set(name, cls as new () => CoversCardInternals);
  },
  get: vi.fn(),
});
await import('../../src/cards/CoversGroupCard');

function coversSpec(): HassFixtureSpec {
  return {
    areas: [
      { area_id: 'abstellkammer', name: 'Abstellkammer' },
      { area_id: 'wohnzimmer', name: 'Wohnzimmer' },
    ],
    devices: [{ id: 'dev_kammer', area_id: 'abstellkammer', name: 'Kammer-Hub' }],
    entities: [
      { entity_id: 'cover.wohnzimmer', area_id: 'wohnzimmer', state: 'open', attributes: { device_class: 'shutter' } },
      { entity_id: 'cover.kammer', device_id: 'dev_kammer', state: 'open', attributes: { device_class: 'shutter' } },
      { entity_id: 'cover.flur', state: 'open', attributes: { device_class: 'shutter' } },
    ],
  };
}

const DASHBOARD_CONFIG = { areas_display: { hidden: ['abstellkammer'], order: ['wohnzimmer', 'abstellkammer'] } };

function makeCard(hass: HomeAssistant, cardConfig: Record<string, unknown> = {}): CoversCardInternals {
  const Card = defined.get('simon42-covers-group-card');
  if (!Card) throw new Error('covers group card not registered');
  const card = new Card();
  card.setConfig({ group_type: 'open', group_by_areas: true, config: DASHBOARD_CONFIG, ...cardConfig });
  card.hass = hass;
  return card;
}

let hass: HomeAssistant;

beforeEach(() => {
  Registry.resetForTesting();
  hass = makeHass(coversSpec());
  Registry.initialize(hass, DASHBOARD_CONFIG);
});

describe('filtered cover list', () => {
  it('lists covers of hidden overview areas by default', () => {
    expect(makeCard(hass)._getFilteredCoverEntities(hass)).toEqual(['cover.wohnzimmer', 'cover.kammer', 'cover.flur']);
  });

  it('leaves out covers of the areas in hidden_areas, area-less covers stay', () => {
    const card = makeCard(hass, { hidden_areas: ['abstellkammer'] });
    expect(card._getFilteredCoverEntities(hass)).toEqual(['cover.wohnzimmer', 'cover.flur']);
  });
});

describe('area-grouped layout', () => {
  it('buckets hidden-area covers under their own heading in user order, without a room link', () => {
    const card = makeCard(hass);
    const groups = card._groupByAreas(card._getFilteredCoverEntities(hass));
    expect(groups.map((g) => g.areaName)).toEqual(['Wohnzimmer', 'Abstellkammer', 'No area']);
    expect(groups.map((g) => g.covers)).toEqual([['cover.wohnzimmer'], ['cover.kammer'], ['cover.flur']]);
    expect(groups.map((g) => g.roomPath)).toEqual(['wohnzimmer', null, null]);
  });

  it('has no bucket for the hidden area once hidden_areas filters its covers', () => {
    const card = makeCard(hass, { hidden_areas: ['abstellkammer'] });
    const groups = card._groupByAreas(card._getFilteredCoverEntities(hass));
    expect(groups.map((g) => g.areaName)).toEqual(['Wohnzimmer', 'No area']);
  });

  it('links area headings to the room view only when the area has one', () => {
    const card = makeCard(hass);
    const linked = card._buildHeadingConfig(['cover.wohnzimmer'], {
      label: 'Wohnzimmer',
      level: 'area',
      roomPath: 'wohnzimmer',
    });
    expect(linked.tap_action).toEqual({ action: 'navigate', navigation_path: 'wohnzimmer' });

    const unlinked = card._buildHeadingConfig(['cover.kammer'], {
      label: 'Abstellkammer',
      level: 'area',
      roomPath: null,
    });
    expect(unlinked).not.toHaveProperty('tap_action');
  });
});
