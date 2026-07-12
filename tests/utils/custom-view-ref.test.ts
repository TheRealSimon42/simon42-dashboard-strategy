import { describe, expect, it, vi } from 'vitest';

import { isRefView, resolveCustomViews } from '../../src/utils/custom-view-ref';
import type { HomeAssistant } from '../../src/types/homeassistant';
import type { CustomView } from '../../src/types/strategy';

/** hass stub whose callWS serves canned lovelace/config responses per url_path. */
function makeHass(dashboards: Record<string, unknown>): HomeAssistant {
  const callWS = vi.fn((msg: { type: string; url_path?: string | null }) => {
    const key = msg.url_path === null ? 'lovelace' : (msg.url_path ?? 'lovelace');
    const config = dashboards[key];
    if (config === undefined) return Promise.reject(new Error('config_not_found'));
    return Promise.resolve(config);
  });
  return { callWS } as unknown as HomeAssistant;
}

const SOURCE_DASHBOARD = {
  views: [
    { title: 'Energie', path: 'energie', icon: 'mdi:flash', sections: [{ type: 'grid', cards: [] }] },
    { title: 'Ohne Pfad', cards: [{ type: 'markdown', content: 'hi' }] },
  ],
};

describe('isRefView', () => {
  it('is true only for a non-empty ref_dashboard', () => {
    expect(isRefView({ ref_dashboard: 'dash-a' })).toBe(true);
    expect(isRefView({ ref_dashboard: '' })).toBe(false);
    expect(isRefView({ yaml: 'type: sections' })).toBe(false);
  });
});

describe('resolveCustomViews', () => {
  it('passes YAML views through unchanged (existing behavior)', async () => {
    const views: CustomView[] = [
      { title: 'Meine View', path: 'meine-view', parsed_config: { sections: [] } },
    ];
    const resolved = await resolveCustomViews(views, makeHass({}));
    expect(resolved).toEqual([
      { sections: [], title: 'Meine View', path: 'meine-view', icon: 'mdi:card-text-outline' },
    ]);
  });

  it('skips views without title or path', async () => {
    const views: CustomView[] = [
      { title: '', path: 'x', parsed_config: {} },
      { title: 'x', path: '', ref_dashboard: 'dash-a', ref_view: 'energie' },
    ];
    const hass = makeHass({ 'dash-a': SOURCE_DASHBOARD });
    expect(await resolveCustomViews(views, hass)).toEqual([]);
    expect(hass.callWS).not.toHaveBeenCalled();
  });

  it('resolves a referenced view by path and applies own title/path/icon', async () => {
    const views: CustomView[] = [
      { title: 'Energie (Ref)', path: 'energie-ref', icon: 'mdi:flash', ref_dashboard: 'dash-a', ref_view: 'energie' },
    ];
    const resolved = await resolveCustomViews(views, makeHass({ 'dash-a': SOURCE_DASHBOARD }));
    expect(resolved).toEqual([
      {
        title: 'Energie (Ref)',
        path: 'energie-ref',
        icon: 'mdi:flash',
        sections: [{ type: 'grid', cards: [] }],
      },
    ]);
  });

  it('resolves a path-less view by its stringified index', async () => {
    const views: CustomView[] = [
      { title: 'Zweite', path: 'zweite', ref_dashboard: 'dash-a', ref_view: '1' },
    ];
    const resolved = await resolveCustomViews(views, makeHass({ 'dash-a': SOURCE_DASHBOARD }));
    expect(resolved[0].cards).toEqual([{ type: 'markdown', content: 'hi' }]);
  });

  it('prefers a path match over an index match', async () => {
    const dashboards = {
      'dash-a': { views: [{ title: 'A', cards: [] }, { title: 'B', path: '0', cards: [{ type: 'markdown' }] }] },
    };
    const views: CustomView[] = [{ title: 'x', path: 'x', ref_dashboard: 'dash-a', ref_view: '0' }];
    const resolved = await resolveCustomViews(views, makeHass(dashboards));
    expect(resolved[0].cards).toEqual([{ type: 'markdown' }]);
  });

  it('maps the lovelace sentinel to url_path null', async () => {
    const hass = makeHass({ lovelace: SOURCE_DASHBOARD });
    const views: CustomView[] = [{ title: 'x', path: 'x', ref_dashboard: 'lovelace', ref_view: 'energie' }];
    await resolveCustomViews(views, hass);
    expect(hass.callWS).toHaveBeenCalledWith({ type: 'lovelace/config', url_path: null });
  });

  it('fetches each referenced dashboard only once', async () => {
    const hass = makeHass({ 'dash-a': SOURCE_DASHBOARD });
    const views: CustomView[] = [
      { title: 'Eins', path: 'eins', ref_dashboard: 'dash-a', ref_view: 'energie' },
      { title: 'Zwei', path: 'zwei', ref_dashboard: 'dash-a', ref_view: '1' },
    ];
    const resolved = await resolveCustomViews(views, hass);
    expect(resolved).toHaveLength(2);
    expect(hass.callWS).toHaveBeenCalledTimes(1);
  });

  it('keeps custom_views array order across mixed YAML and reference views', async () => {
    const views: CustomView[] = [
      { title: 'Ref', path: 'ref', ref_dashboard: 'dash-a', ref_view: 'energie' },
      { title: 'Yaml', path: 'yaml', parsed_config: { cards: [] } },
    ];
    const resolved = await resolveCustomViews(views, makeHass({ 'dash-a': SOURCE_DASHBOARD }));
    expect(resolved.map((v) => v.path)).toEqual(['ref', 'yaml']);
  });

  it('degrades to an error view when the dashboard fetch fails', async () => {
    const views: CustomView[] = [{ title: 'Weg', path: 'weg', ref_dashboard: 'geloescht', ref_view: 'x' }];
    const resolved = await resolveCustomViews(views, makeHass({}));
    expect(resolved).toHaveLength(1);
    expect(resolved[0].path).toBe('weg');
    expect(JSON.stringify(resolved[0].sections)).toContain('markdown');
  });

  it('degrades to an error view when the source dashboard is a strategy dashboard', async () => {
    const hass = makeHass({ 'strategy-dash': { strategy: { type: 'simon42-dashboard' } } });
    const views: CustomView[] = [{ title: 'S', path: 's', ref_dashboard: 'strategy-dash', ref_view: 'home' }];
    const resolved = await resolveCustomViews(views, hass);
    expect(JSON.stringify(resolved[0].sections)).toContain('markdown');
  });

  it('degrades to an error view when the referenced view is gone', async () => {
    const views: CustomView[] = [{ title: 'x', path: 'x', ref_dashboard: 'dash-a', ref_view: 'gibts-nicht' }];
    const resolved = await resolveCustomViews(views, makeHass({ 'dash-a': SOURCE_DASHBOARD }));
    expect(JSON.stringify(resolved[0].sections)).toContain('markdown');
  });

  it('ignores an incomplete reference (no ref_view)', async () => {
    const hass = makeHass({ 'dash-a': SOURCE_DASHBOARD });
    const views: CustomView[] = [{ title: 'x', path: 'x', ref_dashboard: 'dash-a', ref_view: '' }];
    expect(await resolveCustomViews(views, hass)).toEqual([]);
    expect(hass.callWS).not.toHaveBeenCalled();
  });
});
