import { beforeEach, describe, expect, it } from 'vitest';

import { Registry } from '../../src/Registry';
import { createAgendaSection } from '../../src/sections/AgendaSection';
import { makeHass } from '../fixtures/hass';

beforeEach(() => {
  Registry.resetForTesting();
});

describe('createAgendaSection', () => {
  it('includes only configured calendars', () => {
    const hass = makeHass({
      entities: [{ entity_id: 'calendar.work' }, { entity_id: 'calendar.family' }],
    });
    Registry.initialize(hass, {});

    const section = createAgendaSection(hass, true, ['calendar.work']);

    expect(section?.cards?.at(-1)).toEqual({
      type: 'calendar',
      entities: ['calendar.work'],
      initial_view: 'listWeek',
    });
  });

  it('keeps showing every visible calendar for an empty selection', () => {
    const hass = makeHass({
      entities: [{ entity_id: 'calendar.work' }, { entity_id: 'calendar.family' }],
    });
    Registry.initialize(hass, {});

    const section = createAgendaSection(hass, true, []);

    expect(section?.cards?.at(-1)).toMatchObject({
      type: 'calendar',
      entities: ['calendar.work', 'calendar.family'],
    });
  });
});
