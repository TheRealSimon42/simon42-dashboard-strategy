// ============================================================================
// Tests — To-do overview section
// ============================================================================

import { beforeEach, describe, expect, it } from 'vitest';

import { Registry } from '../../src/Registry';
import { createTodosSection } from '../../src/sections/TodosSection';
import { makeHass } from '../fixtures/hass';

beforeEach(() => {
  Registry.resetForTesting();
});

function setup() {
  const hass = makeHass({
    entities: [
      { entity_id: 'todo.shopping' },
      { entity_id: 'todo.tasks' },
    ],
  });
  Registry.initialize(hass, {});
  return hass;
}

function todoCards(section: ReturnType<typeof createTodosSection>) {
  return (section?.cards ?? []).filter((card) => card.type === 'todo-list');
}

describe('createTodosSection', () => {
  it('keeps completed items visible by default', () => {
    const cards = todoCards(createTodosSection(setup(), true, undefined));

    expect(cards).toEqual([
      { type: 'todo-list', entity: 'todo.shopping' },
      { type: 'todo-list', entity: 'todo.tasks' },
    ]);
  });

  it('passes hide_completed to every generated native card when enabled', () => {
    const cards = todoCards(createTodosSection(setup(), true, undefined, false, true));

    expect(cards).toEqual([
      { type: 'todo-list', entity: 'todo.shopping', hide_completed: true },
      { type: 'todo-list', entity: 'todo.tasks', hide_completed: true },
    ]);
  });

  it('preserves explicit entity selection and filters missing entities', () => {
    const cards = todoCards(createTodosSection(setup(), true, ['todo.tasks', 'todo.missing'], false, true));

    expect(cards).toEqual([
      { type: 'todo-list', entity: 'todo.tasks', hide_completed: true },
    ]);
  });

  it('keeps the existing auto-hide behavior when disabled', () => {
    expect(createTodosSection(setup(), false, undefined)).toBeNull();
    expect(createTodosSection(setup(), true, ['todo.missing'])).toBeNull();
  });
});
