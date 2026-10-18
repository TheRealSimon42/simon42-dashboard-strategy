import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Registry } from '../../src/Registry';
import { makeHass, type HassFixtureSpec } from '../fixtures/hass';
import type { HomeAssistant } from '../../src/types/homeassistant';

interface SummaryCardInternals {
  hass?: HomeAssistant;
  setConfig(config: Record<string, unknown>): void;
  _getRelevantEntities(): void;
  _relevantEntityIds?: Set<string>;
}

const defined = new Map<string, new () => SummaryCardInternals>();
vi.stubGlobal('HTMLElement', class {});
vi.stubGlobal('customElements', {
  define(name: string, cls: unknown) {
    defined.set(name, cls as new () => SummaryCardInternals);
  },
  get: vi.fn(),
});
await import('../../src/cards/SummaryCard');

function securitySpec(): HassFixtureSpec {
  return {
    areas: [{ area_id: 'flur', name: 'Flur' }],
    entities: [
      { entity_id: 'lock.haustuer', area_id: 'flur', state: 'unlocked' },
      { entity_id: 'binary_sensor.haustuer', area_id: 'flur', state: 'on', attributes: { device_class: 'door' } },
      {
        entity_id: 'binary_sensor.kinderzimmertuer',
        area_id: 'flur',
        state: 'on',
        labels: ['no_security'],
        attributes: { device_class: 'door' },
      },
      {
        entity_id: 'cover.garage',
        area_id: 'flur',
        state: 'open',
        labels: ['no_security'],
        attributes: { device_class: 'garage' },
      },
    ],
  };
}

function relevantSecurityIds(hass: HomeAssistant): string[] {
  const Card = defined.get('simon42-summary-card');
  if (!Card) throw new Error('summary card not registered');
  const card = new Card();
  card.setConfig({ summary_type: 'security' });
  card.hass = hass;
  card._getRelevantEntities();
  return [...(card._relevantEntityIds || [])].sort();
}

let hass: HomeAssistant;

beforeEach(() => {
  Registry.resetForTesting();
  hass = makeHass(securitySpec());
  Registry.initialize(hass, {});
});

describe('security summary', () => {
  it('does not count entities labeled no_security', () => {
    expect(relevantSecurityIds(hass)).toEqual(['binary_sensor.haustuer', 'lock.haustuer']);
  });
});
