import { describe, expect, it } from 'vitest';

import { applyDesign } from '../../src/utils/design';

describe('applyDesign', () => {
  it('returns the view unchanged (same reference) without design config', () => {
    const view = { path: 'home', sections: [] };
    expect(applyDesign(view, {})).toBe(view);
  });

  it('stamps the configured theme on a view', () => {
    expect(applyDesign({ path: 'home' }, { theme: 'ios-dark' }))
      .toEqual({ path: 'home', theme: 'ios-dark' });
  });

  it('does not override a view-level theme (custom view YAML wins)', () => {
    expect(applyDesign({ path: 'custom', theme: 'noctis' }, { theme: 'ios-dark' }))
      .toEqual({ path: 'custom', theme: 'noctis' });
  });

  it('stamps the configured background on a view', () => {
    const background = { image: '/local/bg.jpg', opacity: 40, attachment: 'fixed' as const };
    expect(applyDesign({ path: 'home' }, { background }))
      .toEqual({ path: 'home', background });
  });

  it('does not override a view-level background', () => {
    const own = { image: '/local/own.jpg' };
    expect(applyDesign({ path: 'custom', background: own }, { background: { image: '/local/global.jpg' } }))
      .toEqual({ path: 'custom', background: own });
  });

  it('ignores a background without image', () => {
    const view = { path: 'home' };
    expect(applyDesign(view, { background: { opacity: 40 } })).toBe(view);
  });

  it('stamps theme and background independently', () => {
    expect(applyDesign({ path: 'custom', theme: 'noctis' }, { theme: 'ios-dark', background: { image: '/local/bg.jpg' } }))
      .toEqual({ path: 'custom', theme: 'noctis', background: { image: '/local/bg.jpg' } });
  });
});
