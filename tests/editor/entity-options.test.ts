// ============================================================================
// Tests — editor entity picker options: area resolution
// ============================================================================
// The picker resolves an entity's area through its device; a child device
// without area (HA 2026.9+) must resolve to the parent's area so the
// "with area" filter and area grouping keep working.
// ============================================================================

import { describe, it, expect } from 'vitest';

import { getAllEntitiesForSelect, getPresenceSimulationEntities } from '../../src/editor/entity-options';
import { makeHass } from '../fixtures/hass';

describe('getAllEntitiesForSelect', () => {
  it('resolves the area of an entity on a child device via the parent device', () => {
    const hass = makeHass({
      areas: [{ area_id: 'kitchen', name: 'Kitchen' }],
      devices: [
        { id: 'cam', area_id: 'kitchen' },
        { id: 'cam_lens2', area_id: null, parent_device_id: 'cam' },
      ],
      entities: [
        { entity_id: 'camera.lens1', device_id: 'cam', attributes: { friendly_name: 'Lens 1' } },
        { entity_id: 'camera.lens2', device_id: 'cam_lens2', attributes: { friendly_name: 'Lens 2' } },
      ],
    });
    const byId = new Map(getAllEntitiesForSelect(hass).map((o) => [o.entity_id, o]));
    expect(byId.get('camera.lens1')?.area_id).toBe('kitchen');
    expect(byId.get('camera.lens2')?.area_id).toBe('kitchen');
    expect(byId.get('camera.lens2')?.device_area_id).toBe('kitchen');
  });
});

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
