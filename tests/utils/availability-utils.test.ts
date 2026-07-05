import { describe, expect, it } from 'vitest';

import {
  isUnavailableState,
  shouldHideUnavailableEntities,
  withUnavailableEntitiesHidden,
} from '../../src/utils/availability-utils';

describe('availability-utils', () => {
  it('recognizes unavailable states and config toggle', () => {
    expect(isUnavailableState('unavailable')).toBe(true);
    expect(isUnavailableState('unknown')).toBe(true);
    expect(isUnavailableState('on')).toBe(false);
    expect(shouldHideUnavailableEntities({ hide_unavailable_entities: true })).toBe(true);
    expect(shouldHideUnavailableEntities({ hide_unavailable_entities: false })).toBe(false);
  });

  it('adds availability visibility to entity cards and badges', () => {
    const view = withUnavailableEntitiesHidden(
      {
        badges: [{ type: 'entity', entity: 'sensor.badge' }],
        cards: [{ type: 'tile', entity: 'light.kitchen' }],
      },
      { hide_unavailable_entities: true }
    );

    expect(view.badges?.[0]).toMatchObject({
      visibility: [
        { condition: 'state', entity: 'sensor.badge', state_not: 'unavailable' },
        { condition: 'state', entity: 'sensor.badge', state_not: 'unknown' },
      ],
    });
    expect(view.cards?.[0]).toMatchObject({
      visibility: [
        { condition: 'state', entity: 'light.kitchen', state_not: 'unavailable' },
        { condition: 'state', entity: 'light.kitchen', state_not: 'unknown' },
      ],
    });
  });

  it('hides a section when all non-heading cards are entity-backed', () => {
    const view = withUnavailableEntitiesHidden(
      {
        sections: [
          {
            type: 'grid',
            cards: [
              { type: 'heading', heading: 'Lights' },
              { type: 'tile', entity: 'light.a' },
              { type: 'tile', entity: 'light.b' },
            ],
          },
        ],
      },
      { hide_unavailable_entities: true }
    );

    expect(view.sections?.[0]).toMatchObject({
      visibility: [
        {
          condition: 'or',
          conditions: [
            { condition: 'state', entity: 'light.a', state_not: ['unavailable', 'unknown'] },
            { condition: 'state', entity: 'light.b', state_not: ['unavailable', 'unknown'] },
          ],
        },
      ],
    });
  });
});
