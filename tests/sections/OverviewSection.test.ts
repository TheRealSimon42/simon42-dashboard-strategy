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

  it('passes hide_unavailable_entities through to summary cards', () => {
    const hass = makeHass({});
    Registry.initialize(hass, {});
    const section = createOverviewSection({
      someSensorId: 'sensor.dummy',
      showSearchCard: false,
      config: { hide_unavailable_entities: true },
      hass,
    });

    const summaryRow = section?.cards?.find((card) => card.type === 'horizontal-stack') as
      | { cards?: Array<Record<string, unknown>> }
      | undefined;

    expect(summaryRow?.cards?.[0]).toMatchObject({
      type: 'custom:simon42-summary-card',
      hide_unavailable_entities: true,
    });
  });
});

describe('summary tile user visibility (view_visible_users entry points)', () => {
  function tilesOf(config: Record<string, unknown>) {
    const hass = makeHass({ entities: [{ entity_id: 'sensor.dummy', state: '1' }] });
    Registry.initialize(hass, config);
    const section = createOverviewSection({
      someSensorId: 'sensor.dummy',
      showSearchCard: false,
      config,
      hass,
    });
    const stacks = (section?.cards ?? []).filter((c) => c.type === 'horizontal-stack');
    return {
      section,
      stacks,
      tiles: stacks.flatMap((s) => (s.cards ?? []) as Record<string, unknown>[]),
    };
  }

  it('adds the view rule as a user condition on the matching tile only', () => {
    const { tiles } = tilesOf({ view_visible_users: { climate: ['u1'] }, show_climate_summary: true });
    const climate = tiles.find((t) => t.summary_type === 'climate');
    const lights = tiles.find((t) => t.summary_type === 'lights');
    expect(climate?.visibility).toEqual([{ condition: 'user', users: ['u1'] }]);
    expect(lights).toBeDefined();
    expect(lights?.visibility).toBeUndefined();
  });

  it('keeps the maintenance tile on the shared rule (legacy fallback)', () => {
    const { tiles } = tilesOf({ show_maintenance_summary: true, maintenance_visible_users: ['legacy'] });
    const maintenance = tiles.find((t) => t.summary_type === 'maintenance');
    expect(maintenance?.visibility).toEqual([{ condition: 'user', users: ['legacy'] }]);
  });

  it('hides a stack row only when every tile in it is restricted', () => {
    // default tiles: lights, covers, security, batteries → rows [lights,covers], [security,batteries]
    const { stacks } = tilesOf({ view_visible_users: { lights: ['u1'], covers: ['u2'] } });
    expect(stacks[0]?.visibility).toEqual([{ condition: 'user', users: ['u1', 'u2'] }]);
    expect(stacks[1]?.visibility).toBeUndefined();
  });

  it('applies the union rule to the summaries heading only when all tiles are restricted', () => {
    const partial = tilesOf({ view_visible_users: { lights: ['u1'] } });
    const partialHeading = (partial.section?.cards ?? []).find(
      (c) => c.type === 'heading' && c.heading !== undefined && !('heading_style' in c)
    );
    expect(partialHeading?.visibility).toBeUndefined();

    const full = tilesOf({
      view_visible_users: { lights: ['u1'], covers: ['u1'], security: ['u2'], batteries: [] },
    });
    const fullHeading = (full.section?.cards ?? []).find(
      (c) => c.type === 'heading' && c.heading !== undefined && !('heading_style' in c)
    );
    expect(fullHeading?.visibility).toEqual([{ condition: 'user', users: ['u1', 'u2'] }]);
  });
});
