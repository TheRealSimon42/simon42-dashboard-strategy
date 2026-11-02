// ============================================================================
// Tests — Overview View Strategy: section assembly
// ============================================================================
// Custom cards assigned to a built-in section via target_section must not
// vanish when that section auto-hides because it has no content (#429):
// the section stays as a heading-only anchor and the cards render in place.
// A section switched off by its toggle stays hidden — cards included.
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Registry } from '../../src/Registry';
import { makeHass } from '../fixtures/hass';
import type { Simon42StrategyConfig } from '../../src/types/strategy';
import type { LovelaceSectionConfig } from '../../src/types/lovelace';

// The view strategy module defines a custom element at import time; the
// node test environment has no DOM, so stub the two globals it touches.
vi.stubGlobal('HTMLElement', class {});
vi.stubGlobal('customElements', { define: vi.fn(), get: vi.fn() });
const { Simon42ViewOverviewStrategy } = await import('../../src/views/OverviewViewStrategy');

const SWIPE_CARD = { type: 'custom:todo-swipe-card', entity: 'todo.hidden' };

function hassWithoutTodos() {
  return makeHass({
    areas: [{ area_id: 'kitchen', name: 'Kitchen' }],
    entities: [
      { entity_id: 'light.kitchen', area_id: 'kitchen', state: 'on' },
      // The only todo entity is hidden from the dashboard → todos section is empty
      { entity_id: 'todo.hidden', labels: ['no_dboard'], state: '3' },
    ],
  });
}

async function generateSections(dashboardConfig: Simon42StrategyConfig): Promise<LovelaceSectionConfig[]> {
  const hass = hassWithoutTodos();
  Registry.resetForTesting();
  const view = await Simon42ViewOverviewStrategy.generate({ dashboardConfig }, hass);
  return (view.sections ?? []) as LovelaceSectionConfig[];
}

function findTodosSection(sections: LovelaceSectionConfig[]): LovelaceSectionConfig | undefined {
  return sections.find((s) => s.cards?.some((c) => c.type === SWIPE_CARD.type));
}

beforeEach(() => {
  Registry.resetForTesting();
});

describe('Overview assembly: custom cards on auto-hidden sections (#429)', () => {
  it('keeps an anchor section with heading when the target section is empty', async () => {
    const sections = await generateSections({
      show_todos_section: true,
      custom_cards: [{ target_section: 'todos', parsed_config: SWIPE_CARD }],
    });
    const todos = findTodosSection(sections);
    expect(todos).toBeDefined();
    expect(todos?.cards?.map((c) => c.type)).toEqual(['heading', SWIPE_CARD.type]);
    expect(todos?.cards?.[0]).toMatchObject({ heading_style: 'title', icon: 'mdi:format-list-checks' });
  });

  it('does not attach the cards to the previous section', async () => {
    const sections = await generateSections({
      show_todos_section: true,
      custom_cards: [{ target_section: 'todos', parsed_config: SWIPE_CARD }],
    });
    const todos = findTodosSection(sections);
    // Anchor = heading + the assigned card, nothing from another section
    expect(todos?.cards).toHaveLength(2);
  });

  it('keeps the section hidden when its toggle is off', async () => {
    const sections = await generateSections({
      show_todos_section: false,
      custom_cards: [{ target_section: 'todos', parsed_config: SWIPE_CARD }],
    });
    expect(findTodosSection(sections)).toBeUndefined();
  });

  it('renders no anchor when nothing is assigned', async () => {
    const sections = await generateSections({ show_todos_section: true });
    const anchors = sections.filter((s) => s.cards?.length === 1 && s.cards[0].type === 'heading');
    expect(anchors).toHaveLength(0);
  });
});

describe('Overview unavailable-entities badge', () => {
  it('uses a text badge instead of attaching the count to a numeric sensor', async () => {
    const hass = makeHass({
      entities: [
        { entity_id: 'sensor.power', state: '1200' },
        { entity_id: 'sensor.temperature', state: '21.5' },
        { entity_id: 'switch.offline', state: 'unavailable' },
      ],
    });
    Registry.resetForTesting();

    const view = await Simon42ViewOverviewStrategy.generate(
      { dashboardConfig: { show_unavailable_alert_badge: true } },
      hass
    );

    expect(view.badges).toEqual([
      {
        type: 'shortcut',
        text: '1',
        icon: 'mdi:alert-circle-outline',
        color: 'red',
      },
    ]);
  });

  it('uses the maintenance view count for device groups and configured ignores', async () => {
    const hass = makeHass({
      devices: [
        { id: 'device_all_unavailable', name: 'Offline device' },
        { id: 'device_partially_available', name: 'Online device' },
        { id: 'device_ignored', name: 'Ignored device' },
      ],
      entities: [
        { entity_id: 'sensor.offline_a', device_id: 'device_all_unavailable', state: 'unavailable' },
        { entity_id: 'sensor.offline_b', device_id: 'device_all_unavailable', state: 'unavailable' },
        { entity_id: 'sensor.partial_a', device_id: 'device_partially_available', state: 'unavailable' },
        { entity_id: 'sensor.partial_b', device_id: 'device_partially_available', state: 'on' },
        { entity_id: 'sensor.ignored', device_id: 'device_ignored', state: 'unavailable' },
        { entity_id: 'sensor.diagnostic', state: 'unavailable', entity_category: 'diagnostic' },
        { entity_id: 'sensor.orphan', state: 'unavailable' },
      ],
    });
    Registry.resetForTesting();

    const view = await Simon42ViewOverviewStrategy.generate(
      {
        dashboardConfig: {
          show_unavailable_alert_badge: true,
          maintenance_ignored_devices: ['device_ignored'],
        },
      },
      hass
    );

    expect(view.badges).toEqual([
      {
        type: 'shortcut',
        text: '2',
        icon: 'mdi:alert-circle-outline',
        color: 'red',
      },
    ]);
  });

  it('hides the badge when unavailable entities belong only to partially available devices', async () => {
    const hass = makeHass({
      devices: [{ id: 'device_online', name: 'Partially online device' }],
      entities: [
        ...Array.from({ length: 13 }, function unavailableEntity(_, index) {
          return {
            entity_id: `sensor.unavailable_${index}`,
            device_id: 'device_online',
            state: 'unavailable',
          };
        }),
        { entity_id: 'sensor.available', device_id: 'device_online', state: 'on' },
      ],
    });
    Registry.resetForTesting();

    const view = await Simon42ViewOverviewStrategy.generate(
      { dashboardConfig: { show_unavailable_alert_badge: true } },
      hass
    );

    expect(view.badges).toBeUndefined();
  });
});
