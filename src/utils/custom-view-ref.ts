// ====================================================================
// SIMON42 DASHBOARD STRATEGY - CUSTOM VIEW REFERENCES (#169)
// ====================================================================
// Resolves custom views that reference a view in another dashboard.
// The referenced dashboard config is fetched at generate time via the
// same WebSocket call the frontend itself uses (`lovelace/config`), so
// edits to the source view show up on the next dashboard load without
// copying YAML around.
//
// Guard rails:
//   - Strategy dashboards cannot be referenced: `lovelace/config`
//     returns their STORED config (`{strategy: ...}`, no views), so a
//     reference could never resolve — and allowing it would invite
//     self-references. The editor filters them out of the dropdown;
//     this resolver double-checks at runtime.
//   - Any failure (dashboard deleted, view deleted, WS error) degrades
//     to a readable error view instead of breaking generate().
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import type { LovelaceViewConfig } from '../types/lovelace';
import type { CustomView } from '../types/strategy';
import { localize } from './localize';

/** Sentinel for the default dashboard (real url_path is null). */
export const DEFAULT_DASHBOARD_SENTINEL = 'lovelace';

/** Result of fetching one dashboard config: views, or an error marker. */
interface FetchedDashboard {
  views?: LovelaceViewConfig[];
  /** Set when the dashboard is strategy-generated (not referenceable). */
  isStrategy?: boolean;
  /** Set when the fetch failed (deleted dashboard, WS error, ...). */
  error?: boolean;
}

/** True when a custom view is a reference view (vs. YAML passthrough). */
export function isRefView(view: CustomView): boolean {
  return typeof view.ref_dashboard === 'string' && view.ref_dashboard !== '';
}

/** Fetch a dashboard's stored config; never throws. */
async function fetchDashboardConfig(hass: HomeAssistant, urlPath: string): Promise<FetchedDashboard> {
  try {
    const config = await hass.callWS<{ views?: LovelaceViewConfig[]; strategy?: unknown }>({
      type: 'lovelace/config',
      url_path: urlPath === DEFAULT_DASHBOARD_SENTINEL ? null : urlPath,
    });
    if (config.strategy) return { isStrategy: true };
    return { views: config.views || [] };
  } catch (error: unknown) {
    void error;
    return { error: true };
  }
}

/** Find the referenced view: by path first, index fallback for path-less views. */
function findReferencedView(views: LovelaceViewConfig[], refView: string): LovelaceViewConfig | undefined {
  const byPath = views.find((view) => view.path === refView);
  if (byPath) return byPath;
  if (/^\d+$/.test(refView)) return views.at(Number(refView));
  return undefined;
}

/** Readable single-card error view so a broken reference never breaks the dashboard. */
function buildErrorView(cv: CustomView, messageKey: string): LovelaceViewConfig {
  const source = `\`${cv.ref_dashboard ?? '?'}\` → \`${cv.ref_view ?? '?'}\``;
  return {
    type: 'sections',
    max_columns: 1,
    sections: [
      {
        type: 'grid',
        cards: [
          {
            type: 'markdown',
            content: `**${localize('custom_views.ref_error_title')}**\n\n${localize(messageKey)}\n\n${source}`,
          },
        ],
      },
    ],
  };
}

/** Resolve one reference view against the (already fetched) dashboard. */
function resolveRefView(cv: CustomView, dashboard: FetchedDashboard): LovelaceViewConfig {
  if (dashboard.error) return buildErrorView(cv, 'custom_views.ref_error_dashboard');
  if (dashboard.isStrategy) return buildErrorView(cv, 'custom_views.ref_error_strategy');
  const view = findReferencedView(dashboard.views || [], cv.ref_view || '');
  if (!view) return buildErrorView(cv, 'custom_views.ref_error_view');
  return view;
}

/**
 * Resolve all custom views (YAML and reference mode) into view configs,
 * preserving array order. Each referenced dashboard is fetched exactly
 * once per call; all fetches run in parallel.
 */
export async function resolveCustomViews(
  customViews: CustomView[],
  hass: HomeAssistant
): Promise<LovelaceViewConfig[]> {
  const refDashboards = new Set<string>();
  for (const cv of customViews) {
    if (isRefView(cv) && cv.ref_view && cv.title && cv.path) refDashboards.add(cv.ref_dashboard as string);
  }

  const fetched = new Map<string, FetchedDashboard>();
  await Promise.all(
    [...refDashboards].map(async (urlPath) => {
      fetched.set(urlPath, await fetchDashboardConfig(hass, urlPath));
    })
  );

  const resolved: LovelaceViewConfig[] = [];
  for (const cv of customViews) {
    if (!cv.title || !cv.path) continue;
    if (isRefView(cv)) {
      if (!cv.ref_view) continue;
      const dashboard = fetched.get(cv.ref_dashboard as string);
      if (!dashboard) continue;
      resolved.push({
        ...resolveRefView(cv, dashboard),
        title: cv.title,
        path: cv.path,
        icon: cv.icon || 'mdi:link-variant',
      });
    } else if (cv.parsed_config) {
      resolved.push({
        ...cv.parsed_config,
        title: cv.title,
        path: cv.path,
        icon: cv.icon || 'mdi:card-text-outline',
      });
    }
  }
  return resolved;
}

/**
 * Insert the resolved custom views into the generated view list (#377).
 * Each custom view with an `after_view` anchor is placed directly behind
 * the view with that path; unset or unknown anchors append at the end
 * (previous behavior). Same-anchor views keep their config order, and
 * anchors may point at custom views inserted earlier in the list.
 * Mutates and returns `views`.
 */
export function insertCustomViews(
  views: LovelaceViewConfig[],
  customViews: CustomView[],
  resolvedViews: LovelaceViewConfig[]
): LovelaceViewConfig[] {
  const anchorByPath = new Map<string, string>();
  for (const cv of customViews) {
    if (cv.path && cv.after_view) anchorByPath.set(cv.path, cv.after_view);
  }

  const insertedPerAnchor = new Map<string, number>();
  for (const view of resolvedViews) {
    const anchor = view.path ? anchorByPath.get(view.path) : undefined;
    const anchorIndex = anchor
      ? views.findIndex(function byPath(v) {
          return v.path === anchor;
        })
      : -1;
    if (anchor !== undefined && anchorIndex >= 0) {
      // Same-anchor views keep their config order: skip past the ones
      // already inserted behind this anchor.
      const offset = insertedPerAnchor.get(anchor) ?? 0;
      views.splice(anchorIndex + 1 + offset, 0, view);
      insertedPerAnchor.set(anchor, offset + 1);
    } else {
      views.push(view);
    }
  }
  return views;
}
