import type { LovelaceCondition, LovelaceViewConfig } from '../types/lovelace';
import type { Simon42StrategyConfig } from '../types/strategy';

export function getViewVisibleUsers(
  config: Simon42StrategyConfig,
  path: string,
): string[] | undefined {
  const rules = config.view_visible_users || {};
  if (Object.hasOwn(rules, path)) {
    return (Reflect.get(rules, path) as string[] | undefined) || [];
  }
  if (path === 'maintenance' && (config.maintenance_visible_users?.length || 0) > 0) {
    return config.maintenance_visible_users;
  }
  return undefined;
}

/** Same lookup for overview sections (section_visible_users, keyed by
 *  SectionKey or custom section key). No legacy fallback needed. */
export function getSectionVisibleUsers(
  config: Simon42StrategyConfig,
  key: string,
): string[] | undefined {
  const rules = config.section_visible_users || {};
  if (Object.hasOwn(rules, key)) {
    return (Reflect.get(rules, key) as string[] | undefined) || [];
  }
  return undefined;
}

/**
 * Builds the native Lovelace user condition for a rule, or undefined when
 * no rule exists (= visible to everyone, no condition emitted). An empty
 * users array yields a never-matching condition — hidden for everyone,
 * mirroring `visible: false` on views. Display logic, not access control.
 */
export function userVisibilityConditions(users: string[] | undefined): LovelaceCondition[] | undefined {
  if (users === undefined) return undefined;
  return [{ condition: 'user', users }];
}

/**
 * Union of several per-view/per-section rules — for parent elements
 * (floor headings, summary rows) that should stay visible as long as ANY
 * of their children is. One child without a rule (undefined = everyone)
 * makes the parent unconditional.
 */
export function unionVisibleUsers(rules: (string[] | undefined)[]): string[] | undefined {
  const union = new Set<string>();
  for (const rule of rules) {
    if (rule === undefined) return undefined;
    for (const user of rule) union.add(user);
  }
  return [...union];
}

export function applyViewVisibility(
  view: LovelaceViewConfig,
  config: Simon42StrategyConfig,
): LovelaceViewConfig {
  const path = view.path;
  if (!path) return view;
  const users = getViewVisibleUsers(config, path);
  if (users === undefined) return view;
  return {
    ...view,
    visible: users.length === 0 ? false : users.map((user) => ({ user })),
  };
}
