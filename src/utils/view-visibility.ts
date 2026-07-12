import type { LovelaceViewConfig } from '../types/lovelace';
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
