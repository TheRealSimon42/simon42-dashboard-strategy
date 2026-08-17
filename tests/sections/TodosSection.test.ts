// ============================================================================
// Tests — Todos section auto-hide and custom-card attachment
// ============================================================================

import { beforeEach, describe, expect, it } from 'vitest';

import { Registry } from '../../src/Registry';
import { createTodosSection } from '../../src/sections/TodosSection';
import { makeHass } from '../fixtures/hass';

beforeEach(() => {
  Registry.resetForTesting();
});

describe('createTodosSection', () => {
  it('keeps the existing auto-hide behavior when no native todo entity exists', () => {
    const hass = makeHass();
    Registry.initialize(hass, {});

    expect(createTodosSection(hass, true, undefined)).toBeNull();
  });

  it('keeps an otherwise empty enabled section for assigned custom cards', () => {
    const hass = makeHass();
    Registry.initialize(hass, {});

    expect(createTodosSection(hass, true, undefined, false, true)).toEqual({
      type: 'grid',
      cards: [
        {
          type: 'heading',
          heading_style: 'title',
          heading: 'To-do',
          icon: 'mdi:format-list-checks',
        },
      ],
    });
  });

  it('renders native todo-list cards when todo entities are available', () => {
    const hass = makeHass({ entities: [{ entity_id: 'todo.shopping' }] });
    Registry.initialize(hass, {});

    expect(createTodosSection(hass, true, undefined)?.cards).toEqual([
      {
        type: 'heading',
        heading_style: 'title',
        heading: 'To-do',
        icon: 'mdi:format-list-checks',
      },
      { type: 'todo-list', entity: 'todo.shopping' },
    ]);
  });

  it('remains disabled even when custom cards target todos', () => {
    const hass = makeHass();
    Registry.initialize(hass, {});

    expect(createTodosSection(hass, false, undefined, false, true)).toBeNull();
  });
});

