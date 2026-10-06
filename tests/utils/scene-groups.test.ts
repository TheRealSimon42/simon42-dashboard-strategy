// ============================================================================
// Tests — scene ↔ light-group association and the colour-temperature gate
// ============================================================================
// The fixtures mirror a real household: a Hue-driven living room whose group
// is colour-temperature capable, and a kitchen whose three nested groups are
// dimmable only but still own 22 scenes. The gate is what keeps those 22 out
// of the room view.
// ============================================================================

import { describe, it, expect } from 'vitest';

import { makeHass } from '../fixtures/hass';
import {
  lightGroupMembers,
  scenesForLightGroup,
  sceneLabel,
  supportsColorTemperature,
} from '../../src/utils/scene-groups';

function hueScene(entityId: string, groupName: string, name: string) {
  return {
    entity_id: entityId,
    state: 'unknown',
    attributes: { group_name: groupName, group_type: 'room', name, friendly_name: `${groupName} ${name}` },
  };
}

const hass = makeHass({
  entities: [
    {
      entity_id: 'light.wohnzimmer',
      attributes: {
        friendly_name: 'Wohnzimmer',
        entity_id: ['light.color_temperature_light_1'],
        supported_color_modes: ['color_temp'],
        min_color_temp_kelvin: 2702,
        max_color_temp_kelvin: 6535,
      },
    },
    { entity_id: 'light.color_temperature_light_1', attributes: { supported_color_modes: ['color_temp'] } },
    {
      entity_id: 'light.kuche',
      attributes: {
        friendly_name: 'Küche',
        entity_id: ['light.kuche_decke_1', 'light.kuche_links'],
        supported_color_modes: ['brightness'],
      },
    },
    hueScene('scene.wohnzimmer_entspannen', 'Wohnzimmer', 'Entspannen'),
    hueScene('scene.wohnzimmer_hell', 'Wohnzimmer', 'Hell'),
    hueScene('scene.wohnzimmer_nachtlicht', 'Wohnzimmer', 'Nachtlicht'),
    hueScene('scene.kuche_hell', 'Küche', 'Hell'),
  ],
});

describe('supportsColorTemperature', () => {
  it('accepts a group that reports the color_temp mode', () => {
    expect(supportsColorTemperature(hass, 'light.wohnzimmer')).toBe(true);
  });

  it('rejects a dimmable-only group', () => {
    expect(supportsColorTemperature(hass, 'light.kuche')).toBe(false);
  });

  it('accepts a Kelvin range even when the mode list is missing', () => {
    const rangeOnly = makeHass({
      entities: [
        { entity_id: 'light.strip', attributes: { min_color_temp_kelvin: 2200, max_color_temp_kelvin: 4000 } },
      ],
    });
    expect(supportsColorTemperature(rangeOnly, 'light.strip')).toBe(true);
  });

  it('is false for an unknown entity', () => {
    expect(supportsColorTemperature(hass, 'light.does_not_exist')).toBe(false);
  });
});

describe('lightGroupMembers', () => {
  it('returns the members of a group', () => {
    expect(lightGroupMembers(hass, 'light.wohnzimmer')).toEqual(['light.color_temperature_light_1']);
  });

  it('treats a plain light as its own member', () => {
    expect(lightGroupMembers(hass, 'light.color_temperature_light_1')).toEqual([
      'light.color_temperature_light_1',
    ]);
  });
});

describe('scenesForLightGroup', () => {
  const allScenes = [
    'scene.wohnzimmer_entspannen',
    'scene.wohnzimmer_hell',
    'scene.wohnzimmer_nachtlicht',
    'scene.kuche_hell',
  ];

  it('matches Hue scenes via group_name and sorts them by label', () => {
    expect(scenesForLightGroup(hass, 'light.wohnzimmer', allScenes)).toEqual([
      'scene.wohnzimmer_entspannen',
      'scene.wohnzimmer_hell',
      'scene.wohnzimmer_nachtlicht',
    ]);
  });

  it('returns nothing for a dimmable-only group, however many scenes it owns', () => {
    expect(scenesForLightGroup(hass, 'light.kuche', allScenes)).toEqual([]);
  });

  it('matches HA-native scenes whose member lights are all in the group', () => {
    const native = makeHass({
      entities: [
        {
          entity_id: 'light.buro',
          attributes: {
            friendly_name: 'Büro',
            entity_id: ['light.desk', 'light.shelf'],
            supported_color_modes: ['color_temp'],
          },
        },
        {
          entity_id: 'scene.abendlicht',
          attributes: { friendly_name: 'Büro Abendlicht', entity_id: ['light.desk', 'light.shelf'] },
        },
        // Touches a light outside the group → must not be offered here.
        {
          entity_id: 'scene.ganzes_haus',
          attributes: { friendly_name: 'Ganzes Haus', entity_id: ['light.desk', 'light.flur'] },
        },
      ],
    });
    expect(scenesForLightGroup(native, 'light.buro', ['scene.abendlicht', 'scene.ganzes_haus'])).toEqual([
      'scene.abendlicht',
    ]);
  });

  it('offers nothing when the candidate pool leaves the group out', () => {
    // The caller decides the pool — that is how no_dboard and a hidden scene
    // group reach the chips without this module knowing about either.
    expect(scenesForLightGroup(hass, 'light.wohnzimmer', ['scene.kuche_hell'])).toEqual([]);
  });

  it('ignores a scene of another group that happens to be in the pool', () => {
    expect(scenesForLightGroup(hass, 'light.wohnzimmer', allScenes)).not.toContain('scene.kuche_hell');
  });
});

describe('sceneLabel', () => {
  it('prefers the bare scene name published by the integration', () => {
    expect(sceneLabel(hass, 'scene.wohnzimmer_entspannen', 'light.wohnzimmer')).toBe('Entspannen');
  });

  it('strips the group prefix when only a friendly name exists', () => {
    const native = makeHass({
      entities: [
        { entity_id: 'light.buro', attributes: { friendly_name: 'Büro' } },
        { entity_id: 'scene.abendlicht', attributes: { friendly_name: 'Büro Abendlicht' } },
      ],
    });
    expect(sceneLabel(native, 'scene.abendlicht', 'light.buro')).toBe('Abendlicht');
  });

  it('keeps names that do not carry the prefix', () => {
    const native = makeHass({
      entities: [
        { entity_id: 'light.buro', attributes: { friendly_name: 'Büro' } },
        { entity_id: 'scene.feierabend', attributes: { friendly_name: 'Feierabend' } },
      ],
    });
    expect(sceneLabel(native, 'scene.feierabend', 'light.buro')).toBe('Feierabend');
  });
});
