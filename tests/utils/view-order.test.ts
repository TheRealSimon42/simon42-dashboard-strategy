// ====================================================================
// Tests: user-defined tab order (views_order)
// ====================================================================
// applyViewsOrder is the single source of truth for the tab order.
// generate() and the editor's view list (getViewOptions → order panel,
// view rules, after_view dropdown) both run through it, so the editor
// always mirrors the emitted tab order.
// ====================================================================

import { describe, expect, it, vi } from 'vitest';

import { applyViewsOrder, mergeViewsOrder, renameInViewsOrder } from '../../src/utils/view-order';
import { insertCustomViews } from '../../src/utils/custom-view-ref';
import { getViewOptions } from '../../src/editor/panels/ViewVisibilityPanel';
import { removeCustomView, updateCustomViewField } from '../../src/editor/panels/CustomConfigPanels';
import { makeHass } from '../fixtures/hass';
import type { LovelaceViewConfig } from '../../src/types/lovelace';
import type { Simon42StrategyConfig } from '../../src/types/strategy';
import type { StrategyEditorHost } from '../../src/editor/editor-host';

function view(path: string): LovelaceViewConfig {
  return { title: path, path };
}

function paths(views: LovelaceViewConfig[]): (string | undefined)[] {
  return views.map(function toPath(v) {
    return v.path;
  });
}

function pathOf(v: LovelaceViewConfig): string | undefined {
  return v.path;
}

// Default order as generate() emits it: overview → summaries → rooms → custom
const DEFAULT = ['home', 'lights', 'security', 'wohnzimmer', 'kueche', 'bad', 'garten'].map(view);

describe('applyViewsOrder', () => {
  it('returns the input unchanged without views_order', () => {
    expect(applyViewsOrder(DEFAULT, undefined, pathOf)).toBe(DEFAULT);
    expect(applyViewsOrder(DEFAULT, [], pathOf)).toBe(DEFAULT);
  });

  it('applies a complete custom order', () => {
    const order = ['wohnzimmer', 'garten', 'kueche', 'lights', 'bad', 'security'];
    expect(paths(applyViewsOrder(DEFAULT, order, pathOf))).toEqual(['home', ...order]);
  });

  it('moves single views — e.g. a room directly behind the overview', () => {
    const result = applyViewsOrder(DEFAULT, ['wohnzimmer'], pathOf);
    expect(paths(result)).toEqual(['home', 'wohnzimmer', 'lights', 'security', 'kueche', 'bad', 'garten']);
  });

  it('appends unlisted views in their default order (same as sections_order)', () => {
    // A new room "bad" that is not in the stored order yet shows up behind
    // the listed views instead of vanishing.
    const order = ['kueche', 'wohnzimmer', 'lights', 'security', 'garten'];
    expect(paths(applyViewsOrder(DEFAULT, order, pathOf))).toEqual([
      'home',
      'kueche',
      'wohnzimmer',
      'lights',
      'security',
      'garten',
      'bad',
    ]);
  });

  it('keeps the overview first even if the order lists it elsewhere', () => {
    const result = applyViewsOrder(DEFAULT, ['bad', 'home', 'lights'], pathOf);
    expect(result.at(0)?.path).toBe('home');
    expect(paths(result).slice(0, 3)).toEqual(['home', 'bad', 'lights']);
  });

  it('ignores unknown paths and duplicates', () => {
    const result = applyViewsOrder(DEFAULT, ['geloescht', 'bad', 'bad', 'lights'], pathOf);
    expect(paths(result)).toEqual(['home', 'bad', 'lights', 'security', 'wohnzimmer', 'kueche', 'garten']);
  });

  it('falls back to the default order when no listed path exists anymore', () => {
    expect(paths(applyViewsOrder(DEFAULT, ['geloescht'], pathOf))).toEqual(paths(DEFAULT));
  });

  it('does not mutate the input array', () => {
    const input = [...DEFAULT];
    applyViewsOrder(input, ['garten', 'bad'], pathOf);
    expect(paths(input)).toEqual(paths(DEFAULT));
  });

  it('runs after after_view placement and takes precedence over it', () => {
    const generated = ['home', 'lights', 'wohnzimmer', 'kueche'].map(view);
    insertCustomViews(generated, [{ title: 'Garten', path: 'garten', after_view: 'wohnzimmer' }], [view('garten')]);
    expect(paths(generated)).toEqual(['home', 'lights', 'wohnzimmer', 'garten', 'kueche']);
    // Not listed: the custom view follows behind the listed views…
    expect(paths(applyViewsOrder(generated, ['kueche', 'wohnzimmer', 'lights'], pathOf))).toEqual([
      'home',
      'kueche',
      'wohnzimmer',
      'lights',
      'garten',
    ]);
    // …listed, views_order wins.
    expect(paths(applyViewsOrder(generated, ['garten', 'kueche', 'wohnzimmer', 'lights'], pathOf))).toEqual([
      'home',
      'garten',
      'kueche',
      'wohnzimmer',
      'lights',
    ]);
  });
});

describe('mergeViewsOrder', () => {
  it('stores the displayed order (overview dropped) when nothing was stored', () => {
    expect(mergeViewsOrder(undefined, ['home', 'bad', 'lights'])).toEqual(['bad', 'lights']);
  });

  it('keeps the slot of a stored view that is currently not displayed', () => {
    // "gaeste" is hidden via room_visibility right now; it was stored
    // behind "wohnzimmer" and must stay there after reordering.
    const stored = ['wohnzimmer', 'gaeste', 'kueche', 'lights'];
    const displayed = ['lights', 'wohnzimmer', 'kueche'];
    expect(mergeViewsOrder(stored, displayed)).toEqual(['lights', 'wohnzimmer', 'gaeste', 'kueche']);
  });

  it('adds views that were not stored yet', () => {
    expect(mergeViewsOrder(['wohnzimmer', 'lights'], ['lights', 'wohnzimmer', 'neu'])).toEqual([
      'lights',
      'wohnzimmer',
      'neu',
    ]);
  });
});

describe('renameInViewsOrder', () => {
  it('follows a rename in place', () => {
    expect(renameInViewsOrder(['a', 'alt', 'b'], 'alt', 'neu')).toEqual(['a', 'neu', 'b']);
  });

  it('removes the path when the view is deleted', () => {
    expect(renameInViewsOrder(['a', 'alt', 'b'], 'alt')).toEqual(['a', 'b']);
  });

  it('returns undefined when nothing is left', () => {
    expect(renameInViewsOrder(['alt'], 'alt')).toBeUndefined();
    expect(renameInViewsOrder(undefined, 'alt', 'neu')).toBeUndefined();
  });

  it('does not create duplicates when renaming onto a listed path', () => {
    expect(renameInViewsOrder(['a', 'alt', 'b'], 'alt', 'b')).toEqual(['a', 'b']);
  });
});

describe('editor integration', () => {
  function makeHost(config: Simon42StrategyConfig): StrategyEditorHost {
    const hass = makeHass({
      areas: [
        { area_id: 'wohnzimmer', name: 'Wohnzimmer' },
        { area_id: 'kueche', name: 'Küche' },
      ],
    });
    return { _config: config, _hass: hass, _fireConfigChanged: vi.fn() } as unknown as StrategyEditorHost;
  }

  function keys(host: StrategyEditorHost): string[] {
    return getViewOptions(host).map(function toKey(option) {
      return option.key;
    });
  }

  function emitted(host: StrategyEditorHost): Simon42StrategyConfig {
    return vi.mocked(host._fireConfigChanged).mock.calls[0][0];
  }

  const BASE: Simon42StrategyConfig = {
    areas_display: { order: ['wohnzimmer', 'kueche'] },
    custom_views: [
      { title: 'Garten', path: 'garten', parsed_config: { cards: [] }, after_view: 'wohnzimmer' },
      { title: 'Extra', path: 'extra', parsed_config: { cards: [] } },
    ],
  };

  it('view list mirrors generate(): after_view placement in the default order', () => {
    expect(keys(makeHost(BASE))).toEqual([
      'home',
      'lights',
      'covers',
      'security',
      'batteries',
      'wohnzimmer',
      'garten',
      'kueche',
      'extra',
    ]);
  });

  it('view list applies views_order', () => {
    const host = makeHost({ ...BASE, views_order: ['wohnzimmer', 'kueche', 'extra'] });
    expect(keys(host)).toEqual([
      'home',
      'wohnzimmer',
      'kueche',
      'extra',
      'lights',
      'covers',
      'security',
      'batteries',
      'garten',
    ]);
  });

  it('renaming a custom view path keeps its slot in views_order', () => {
    const host = makeHost({ ...BASE, views_order: ['extra', 'wohnzimmer'] });
    updateCustomViewField(host, 1, 'path', 'extra-neu');
    expect(emitted(host).views_order).toEqual(['extra-neu', 'wohnzimmer']);
  });

  it('removing a custom view drops it from views_order', () => {
    const host = makeHost({ ...BASE, views_order: ['extra'] });
    removeCustomView(host, 1);
    expect(emitted(host).views_order).toBeUndefined();
  });
});
