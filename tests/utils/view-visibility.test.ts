import { describe, expect, it } from 'vitest';

import { applyViewVisibility, getViewVisibleUsers } from '../../src/utils/view-visibility';

describe('view visibility', () => {
  it('preserves a view when no rule exists', () => {
    const view = { path: 'home', visible: [{ user: 'yaml-user' }] };
    expect(applyViewVisibility(view, {})).toBe(view);
  });

  it('maps selected users to native view visibility', () => {
    expect(applyViewVisibility(
      { path: 'lights' },
      { view_visible_users: { lights: ['user-a', 'user-b'] } },
    )).toEqual({ path: 'lights', visible: [{ user: 'user-a' }, { user: 'user-b' }] });
  });

  it('maps an explicit empty list to hidden for everyone', () => {
    expect(applyViewVisibility(
      { path: 'home' },
      { view_visible_users: { home: [] } },
    )).toEqual({ path: 'home', visible: false });
  });

  it('overrides visibility supplied by custom view YAML', () => {
    expect(applyViewVisibility(
      { path: 'custom', visible: [{ user: 'yaml-user' }] },
      { view_visible_users: { custom: ['configured-user'] } },
    )).toEqual({ path: 'custom', visible: [{ user: 'configured-user' }] });
  });

  it('uses legacy maintenance users only without a new rule', () => {
    const config = { maintenance_visible_users: ['legacy'] };
    expect(getViewVisibleUsers(config, 'maintenance')).toEqual(['legacy']);
    expect(getViewVisibleUsers({
      ...config,
      view_visible_users: { maintenance: [] },
    }, 'maintenance')).toEqual([]);
  });
});
