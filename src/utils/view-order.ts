// ====================================================================
// VIEW ORDER (views_order)
// ====================================================================
// Single source of truth for a user-defined tab order. Default order
// (no `views_order`): overview → summary views → room views → custom
// views (custom views honor their `after_view` anchor).
//
// `views_order` is a list of view paths. Rules — same merge semantics
// as sections_order / stacks_order (mergeConfiguredOrder):
//   - The overview (`home`) is the dashboard's start page and always
//     stays first, whatever the list says.
//   - Listed views come first, in the configured order.
//   - Views NOT in the list (a new room, a newly enabled summary view,
//     a new custom view) follow in their default order.
//   - Unknown / stale paths (deleted room, renamed view) are ignored.
//
// Used by generate() (emitted views) and by the editor's view list
// (getViewOptions → order panel, view rules, after_view dropdown), so
// the editor always mirrors the emitted tab order.
// ====================================================================

/** Path of the overview view — pinned as the first tab (start page). */
export const OVERVIEW_VIEW_PATH = 'home';

/**
 * Apply a configured `views_order` to a list of views in default order.
 * Generic over the element type: the strategy passes view configs, the
 * editor passes path/title options. Returns a new array; the input is
 * never mutated. Without a configured order the input is returned as-is.
 */
export function applyViewsOrder<T>(
  views: T[],
  order: readonly string[] | undefined,
  keyOf: (view: T) => string | undefined
): T[] {
  if (!order || order.length === 0) return views;

  const pinned: T[] = [];
  const rest: T[] = [];
  const byKey = new Map<string, T>();
  for (const view of views) {
    const key = keyOf(view);
    if (key === OVERVIEW_VIEW_PATH) {
      pinned.push(view);
      continue;
    }
    rest.push(view);
    if (key !== undefined && !byKey.has(key)) byKey.set(key, view);
  }

  const listed = new Set<T>();
  const ordered: T[] = [];
  for (const key of order) {
    const view = byKey.get(key);
    if (view !== undefined && !listed.has(view)) {
      listed.add(view);
      ordered.push(view);
    }
  }

  const unlisted = rest.filter(function isUnlisted(view) {
    return !listed.has(view);
  });
  return [...pinned, ...ordered, ...unlisted];
}

/**
 * Follow a custom view path rename (`newPath`) or removal (`newPath`
 * empty/undefined) in a stored `views_order`, so the view keeps its slot.
 * Returns undefined when nothing is left (→ delete the config key).
 */
export function renameInViewsOrder(
  order: readonly string[] | undefined,
  oldPath: string,
  newPath?: string
): string[] | undefined {
  if (!order || order.length === 0) return undefined;
  const next: string[] = [];
  for (const key of order) {
    if (key !== oldPath) next.push(key);
    else if (newPath && !order.includes(newPath)) next.push(newPath);
  }
  return next.length > 0 ? next : undefined;
}

/**
 * Build the `views_order` to persist after a drag & drop in the editor.
 *
 * `displayed` is the full new order of the views the editor currently
 * shows (the overview is dropped if present). Paths from the previously
 * stored order that are NOT displayed right now (e.g. a room hidden by
 * `room_visibility` at this moment) keep their slot behind the displayed
 * view they followed in the stored order — so reordering never silently
 * moves a temporarily hidden room somewhere else.
 */
export function mergeViewsOrder(stored: readonly string[] | undefined, displayed: readonly string[]): string[] {
  const result = displayed.filter(function notOverview(key) {
    return key !== OVERVIEW_VIEW_PATH;
  });
  const shown = new Set(result);

  let anchor: string | undefined;
  for (const key of stored || []) {
    if (key === OVERVIEW_VIEW_PATH) continue;
    if (shown.has(key)) {
      anchor = key;
      continue;
    }
    if (result.includes(key)) continue;
    // Hidden stored path: re-insert directly behind its stored predecessor
    // (or at the front when it led the stored list).
    const insertAt = anchor === undefined ? 0 : result.indexOf(anchor) + 1;
    result.splice(insertAt, 0, key);
    anchor = key;
  }
  return result;
}
