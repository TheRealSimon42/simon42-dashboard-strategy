// ============================================================================
// Tests — OverviewSection builders
// ============================================================================
// Focus: lock down the auto-hide contract and the shape of the
// custom-cards section. Snapshots capture the assembled grid so a future
// refactor can't change the rendered output without a deliberate
// snapshot update.
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';

import { Registry } from '../../src/Registry';
import { createCustomCardsSection, createOverviewSection } from '../../src/sections/OverviewSection';
import { makeHass } from '../fixtures/hass';

beforeEach(() => {
  Registry.resetForTesting();
});

describe('createCustomCardsSection', () => {
  it('returns null when no parsed cards are provided', () => {
    expect(createCustomCardsSection([])).toBeNull();
  });

  it('returns null when every entry lacks parsed_config', () => {
    expect(
      createCustomCardsSection([
        { yaml: 'not parsed' as unknown as string },
        { yaml: 'also not parsed' as unknown as string },
      ])
    ).toBeNull();
  });

  it('renders parsed cards under the default heading', () => {
    const section = createCustomCardsSection([
      { parsed_config: { type: 'markdown', content: 'hello' } as Record<string, unknown> },
    ]);
    expect(section).not.toBeNull();
    expect(section?.type).toBe('grid');
    // Heading first, then the parsed card
    expect(section?.cards?.[0]).toMatchObject({ type: 'heading' });
    expect(section?.cards?.[1]).toMatchObject({ type: 'markdown', content: 'hello' });
  });

  it('honors a custom heading + icon', () => {
    const section = createCustomCardsSection(
      [{ parsed_config: { type: 'markdown' } as Record<string, unknown> }],
      'My Stuff',
      'mdi:star'
    );
    expect(section?.cards?.[0]).toMatchObject({
      type: 'heading',
      heading: 'My Stuff',
      icon: 'mdi:star',
    });
  });

  it('emits a per-card heading when a custom card has a title', () => {
    const section = createCustomCardsSection([
      {
        title: 'Sub-heading',
        parsed_config: { type: 'markdown' } as Record<string, unknown>,
      },
    ]);
    expect(section?.cards).toEqual([
      expect.objectContaining({ type: 'heading' }),       // section heading
      expect.objectContaining({ type: 'heading', heading: 'Sub-heading' }),
      expect.objectContaining({ type: 'markdown' }),
    ]);
  });
});

describe('createOverviewSection', () => {
  it('returns a grid section with the configured pieces', () => {
    const hass = makeHass({});
    Registry.initialize(hass, {});
    const section = createOverviewSection({
      someSensorId: 'sensor.dummy',
      showSearchCard: false,
      config: {},
      hass,
    });
    expect(section?.type).toBe('grid');
    // Existence-of-cards is the contract here; the snapshot pins the rest.
    expect(Array.isArray(section?.cards)).toBe(true);
    expect(section?.cards.length).toBeGreaterThan(0);
  });

  it('matches the snapshot for a default config', () => {
    const hass = makeHass({});
    Registry.initialize(hass, {});
    const section = createOverviewSection({
      someSensorId: 'sensor.dummy',
      showSearchCard: false,
      config: {},
      hass,
    });
    expect(section).toMatchSnapshot();
  });

  it('matches the snapshot when show_clock_card is disabled', () => {
    const hass = makeHass({});
    Registry.initialize(hass, {});
    const section = createOverviewSection({
      someSensorId: 'sensor.dummy',
      showSearchCard: false,
      config: { show_clock_card: false },
      hass,
    });
    expect(section).toMatchSnapshot();
  });
});
