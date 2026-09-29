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
import { createCustomCardsSection, createHouseModeCards, createOverviewSection } from '../../src/sections/OverviewSection';
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

describe('createHouseModeCards (#414)', () => {
  it('returns no cards when house_mode_entity is not configured (feature off)', () => {
    expect(createHouseModeCards({})).toEqual([]);
  });

  it('builds a full-width inline select-options tile without an own heading', () => {
    const cards = createHouseModeCards({ house_mode_entity: 'input_select.hausmodus' });
    expect(cards).toEqual([
      {
        type: 'tile',
        entity: 'input_select.hausmodus',
        hide_state: true,
        vertical: false,
        features: [{ type: 'select-options' }],
        features_position: 'inline',
        grid_options: { columns: 'full' },
      },
    ]);
  });

  it('renders directly below the clock/alarm block in the overview section', () => {
    const hass = makeHass({});
    Registry.initialize(hass, {});
    const section = createOverviewSection({
      someSensorId: 'sensor.dummy',
      showSearchCard: false,
      config: { house_mode_entity: 'input_select.hausmodus', alarm_entity: 'alarm_control_panel.home' },
      hass,
    });
    const cards = section?.cards ?? [];
    // overview heading first, then clock + alarm, then the house mode tile
    expect(cards[0]).toMatchObject({ type: 'heading', icon: 'mdi:overscan' });
    const alarmIndex = cards.findIndex((c) => c.entity === 'alarm_control_panel.home');
    const houseModeIndex = cards.findIndex((c) => c.entity === 'input_select.hausmodus');
    expect(alarmIndex).toBeGreaterThan(0);
    expect(houseModeIndex).toBe(alarmIndex + 1);
  });

  it('still renders (with overview heading) when clock and alarm are off', () => {
    const hass = makeHass({});
    Registry.initialize(hass, {});
    const section = createOverviewSection({
      someSensorId: 'sensor.dummy',
      showSearchCard: false,
      config: { house_mode_entity: 'input_select.hausmodus', show_clock_card: false },
      hass,
    });
    const cards = section?.cards ?? [];
    expect(cards[0]).toMatchObject({ type: 'heading', icon: 'mdi:overscan' });
    expect(cards[1]).toMatchObject({
      type: 'tile',
      entity: 'input_select.hausmodus',
      hide_state: true,
      features: [{ type: 'select-options' }],
      features_position: 'inline',
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

describe('maintenance tile hide-when-ok (#426, opt-in)', () => {
  function overviewOf(config: Record<string, unknown>) {
    const hass = makeHass({ entities: [{ entity_id: 'sensor.dummy', state: '1' }] });
    Registry.initialize(hass, config);
    const section = createOverviewSection({
      someSensorId: 'sensor.dummy',
      showSearchCard: false,
      config,
      hass,
    });
    const cards = section?.cards ?? [];
    const stacks = cards.filter((c) => c.type === 'horizontal-stack');
    return {
      cards,
      stacks,
      stackTiles: stacks.flatMap((s) => (s.cards ?? []) as Record<string, unknown>[]),
      // tiles emitted directly into the section grid (outside any stack row)
      standalone: cards.filter((c) => c.type === 'custom:simon42-summary-card') as Record<string, unknown>[],
    };
  }

  it('leaves the tile untouched by default: no flag, regular stack row', () => {
    const { stacks, stackTiles, standalone } = overviewOf({ show_maintenance_summary: true });
    // lights, covers, security, batteries, maintenance → rows [l,c], [s,b], [m]
    expect(stacks).toHaveLength(3);
    const maintenance = stackTiles.find((t) => t.summary_type === 'maintenance');
    expect(maintenance).toBeDefined();
    expect(maintenance).not.toHaveProperty('hide_when_ok');
    expect(standalone).toHaveLength(0);
  });

  it('has no effect without the maintenance tile', () => {
    const { stackTiles, standalone } = overviewOf({ hide_maintenance_summary_when_ok: true });
    expect(stackTiles.some((t) => t.summary_type === 'maintenance')).toBe(false);
    expect(stackTiles.some((t) => 'hide_when_ok' in t)).toBe(false);
    expect(standalone).toHaveLength(0);
  });

  it('flags only the maintenance tile and lifts it out of a row it would occupy alone (2 columns)', () => {
    const { cards, stacks, stackTiles, standalone } = overviewOf({
      show_maintenance_summary: true,
      hide_maintenance_summary_when_ok: true,
    });
    expect(stacks).toHaveLength(2);
    expect(stackTiles.map((t) => t.summary_type)).toEqual(['lights', 'covers', 'security', 'batteries']);
    expect(stackTiles.some((t) => 'hide_when_ok' in t)).toBe(false);
    expect(standalone).toEqual([
      expect.objectContaining({
        type: 'custom:simon42-summary-card',
        summary_type: 'maintenance',
        hide_when_ok: true,
        grid_options: { columns: 'full' },
      }),
    ]);
    // placed directly after the last stack row, like the row it replaces
    const lastStack = stacks.at(-1);
    const lastStackIndex = lastStack ? cards.indexOf(lastStack) : -1;
    expect(lastStackIndex).toBeGreaterThan(-1);
    expect(cards.at(lastStackIndex + 1)).toMatchObject({ summary_type: 'maintenance' });
  });

  it('keeps the tile in a shared row when it has a neighbour (2 columns, climate on)', () => {
    const { stacks, standalone } = overviewOf({
      show_maintenance_summary: true,
      show_climate_summary: true,
      hide_maintenance_summary_when_ok: true,
    });
    expect(stacks).toHaveLength(3);
    const lastRow = (stacks.at(-1)?.cards ?? []) as Record<string, unknown>[];
    expect(lastRow.map((t) => t.summary_type)).toEqual(['climate', 'maintenance']);
    expect(lastRow.at(1)).toMatchObject({ hide_when_ok: true });
    expect(lastRow.at(0)).not.toHaveProperty('hide_when_ok');
    expect(standalone).toHaveLength(0);
  });

  it('keeps the tile in the single row of the 4-column layout', () => {
    const { stacks, stackTiles, standalone } = overviewOf({
      show_maintenance_summary: true,
      hide_maintenance_summary_when_ok: true,
      summaries_columns: 4,
    });
    expect(stacks).toHaveLength(1);
    expect(stackTiles.map((t) => t.summary_type)).toEqual(['lights', 'covers', 'security', 'batteries', 'maintenance']);
    expect(stackTiles.at(-1)).toMatchObject({ hide_when_ok: true });
    expect(standalone).toHaveLength(0);
  });

  it('lifts the tile out when it is the only summary (4 columns)', () => {
    const { stacks, standalone } = overviewOf({
      show_light_summary: false,
      show_covers_summary: false,
      show_security_summary: false,
      show_battery_summary: false,
      show_maintenance_summary: true,
      hide_maintenance_summary_when_ok: true,
      summaries_columns: 4,
    });
    expect(stacks).toHaveLength(0);
    expect(standalone).toEqual([
      expect.objectContaining({ summary_type: 'maintenance', hide_when_ok: true, grid_options: { columns: 'full' } }),
    ]);
  });

  it('keeps the user-visibility rule on the lifted tile', () => {
    const { standalone } = overviewOf({
      show_maintenance_summary: true,
      hide_maintenance_summary_when_ok: true,
      maintenance_visible_users: ['admin'],
    });
    expect(standalone.at(0)?.visibility).toEqual([{ condition: 'user', users: ['admin'] }]);
  });
});
