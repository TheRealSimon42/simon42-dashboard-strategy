import { describe, expect, it } from 'vitest';

import { getPresenceSimulationEntities } from '../../src/editor/entity-options';
import { makeHass } from '../fixtures/hass';

describe('getPresenceSimulationEntities', () => {
  it('returns only loaded switches from the Presence Simulation platform', () => {
    const hass = makeHass({
      entities: [
        {
          entity_id: 'switch.vacation_simulation',
          platform: 'presence_simulation',
          attributes: { friendly_name: 'Vacation Simulation' },
        },
        {
          entity_id: 'switch.away_simulation',
          platform: 'presence_simulation',
          attributes: { friendly_name: 'Away Simulation' },
        },
        { entity_id: 'switch.garden', platform: 'mqtt' },
        { entity_id: 'light.simulation', platform: 'presence_simulation' },
      ],
    });

    expect(getPresenceSimulationEntities(hass)).toEqual([
      { entity_id: 'switch.away_simulation', name: 'Away Simulation' },
      { entity_id: 'switch.vacation_simulation', name: 'Vacation Simulation' },
    ]);
  });

  it('returns no options without Home Assistant data', () => {
    expect(getPresenceSimulationEntities(null)).toEqual([]);
  });

  it('keeps a configured switch selectable when its state is temporarily missing', () => {
    const hass = makeHass({});

    expect(getPresenceSimulationEntities(hass, 'switch.presence_simulation')).toEqual([
      { entity_id: 'switch.presence_simulation', name: 'switch.presence_simulation' },
    ]);
  });
});
