import { describe, expect, it } from 'vitest';

import { setAreaDisplayTypeOverride, setGlobalAreaDisplayType } from '../../src/editor/area-display-options';

describe('area display editor config', () => {
  it('stores picture globally and prunes the default compact value', () => {
    const picture = setGlobalAreaDisplayType({ show_switches_on_areas: true }, 'picture');
    expect(picture).toEqual({ show_switches_on_areas: true, area_display_type: 'picture' });

    const compact = setGlobalAreaDisplayType(picture, 'compact');
    expect(compact).toEqual({ show_switches_on_areas: true });
  });

  it('sets an area override without losing sibling area options', () => {
    const result = setAreaDisplayTypeOverride(
      { areas_options: { kitchen: { stacks_order: ['lights', 'misc'] } } },
      'living_room',
      'picture'
    );
    expect(result.areas_options).toEqual({
      kitchen: { stacks_order: ['lights', 'misc'] },
      living_room: { display_type: 'picture' },
    });
  });

  it('removes inheritance overrides and prunes empty areas_options objects', () => {
    const result = setAreaDisplayTypeOverride(
      { areas_options: { living_room: { display_type: 'picture' } } },
      'living_room',
      undefined
    );
    expect(result).toEqual({});
  });

  it('preserves other settings when an override is removed', () => {
    const result = setAreaDisplayTypeOverride(
      {
        areas_options: {
          living_room: { display_type: 'picture', groups_options: { lights: { hidden: ['light.ceiling'] } } },
        },
      },
      'living_room',
      undefined
    );
    expect(result.areas_options?.living_room).toEqual({
      groups_options: { lights: { hidden: ['light.ceiling'] } },
    });
  });
});
