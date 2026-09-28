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
