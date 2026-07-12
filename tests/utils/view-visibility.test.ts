import { describe, expect, it } from 'vitest';

import {
  applyViewVisibility,
  getViewVisibleUsers,
  getSectionVisibleUsers,
  userVisibilityConditions,
  unionVisibleUsers,
} from '../../src/utils/view-visibility';

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

describe('section visibility rules', () => {
  it('returns undefined without a rule and the list with one', () => {
    expect(getSectionVisibleUsers({}, 'energy')).toBeUndefined();
    expect(getSectionVisibleUsers({ section_visible_users: { energy: ['u1'] } }, 'energy')).toEqual(['u1']);
    expect(getSectionVisibleUsers({ section_visible_users: { energy: [] } }, 'energy')).toEqual([]);
  });

  it('has no maintenance legacy fallback', () => {
    expect(getSectionVisibleUsers({ maintenance_visible_users: ['legacy'] }, 'maintenance')).toBeUndefined();
  });
});

describe('userVisibilityConditions', () => {
  it('emits no condition without a rule', () => {
    expect(userVisibilityConditions(undefined)).toBeUndefined();
  });

  it('maps a rule to a native user condition (empty = hidden for everyone)', () => {
    expect(userVisibilityConditions(['u1'])).toEqual([{ condition: 'user', users: ['u1'] }]);
    expect(userVisibilityConditions([])).toEqual([{ condition: 'user', users: [] }]);
  });
});

describe('unionVisibleUsers', () => {
  it('is unconditional as soon as one child has no rule', () => {
    expect(unionVisibleUsers([['u1'], undefined])).toBeUndefined();
    expect(unionVisibleUsers([])).toEqual([]);
  });

  it('unions and dedupes the child rules', () => {
    expect(unionVisibleUsers([['u1', 'u2'], ['u2', 'u3'], []])).toEqual(['u1', 'u2', 'u3']);
  });
});
