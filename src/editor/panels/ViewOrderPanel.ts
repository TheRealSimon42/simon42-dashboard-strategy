// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR PANEL: VIEWS ORDER
// ====================================================================
// Drag & drop ordering of all tabs (summary views, room views, custom
// views) → `views_order`. The list comes from getViewOptions(), which
// runs through the same applyViewsOrder() as generate(), so the panel
// always shows the real tab order. The overview stays pinned first
// (start page). Rendered inside the "Views" panel.
// ====================================================================

/* eslint-disable xss/no-mixed-html, @typescript-eslint/no-confusing-void-expression --
   False positive: lit-html's `html` tag escapes every interpolation by
   construction. Codacy's legacy ESLint 8 engine misreads lit render
   functions, DOM Element locals and input event payloads as raw HTML. The
   void-expression rule fights the codebase's established concise event-
   handler arrows (`(checked) => host._toggleChanged(...)`). */
import { html, nothing, type TemplateResult } from 'lit';
import type { Simon42StrategyConfig } from '../../types/strategy';
import { localize } from '../../utils/localize';
import { mergeViewsOrder, OVERVIEW_VIEW_PATH } from '../../utils/view-order';
import { buildViewOptions, getViewOptions, type RuleOption } from './ViewVisibilityPanel';
import type { StrategyEditorHost } from '../editor-host';

/** Summary/utility view paths that become subviews unless show_summary_views. */
const SUMMARY_VIEW_PATHS = new Set(['lights', 'covers', 'security', 'batteries', 'climate', 'maintenance']);

/**
 * True when the view is rendered as a subview (no tab in the top bar).
 * Mirrors the subview flags set in generate(). Reordering a subview only
 * matters once it becomes a tab, so the panel marks these rows.
 */
function isSubview(config: Simon42StrategyConfig, key: string, customPaths: Set<string>): boolean {
  if (key === OVERVIEW_VIEW_PATH || key === 'cameras' || customPaths.has(key)) return false;
  if (SUMMARY_VIEW_PATHS.has(key)) return config.show_summary_views !== true;
  // Room views
  if (config.show_room_views === true) return false;
  return !(config.areas_display?.nav_items || []).includes(key);
}

/** Icons of the fixed views — identical to the ones generate() assigns. */
const FIXED_VIEW_ICONS = new Map<string, string>([
  [OVERVIEW_VIEW_PATH, 'mdi:home'],
  ['lights', 'mdi:lamps'],
  ['covers', 'mdi:blinds-horizontal'],
  ['security', 'mdi:security'],
  ['batteries', 'mdi:battery-alert'],
  ['climate', 'mdi:thermostat'],
  ['maintenance', 'mdi:wrench'],
  ['cameras', 'mdi:cctv'],
]);

function viewIcon(host: StrategyEditorHost, key: string, customIcons: Map<string, string>): string {
  const fixed = FIXED_VIEW_ICONS.get(key) || customIcons.get(key);
  if (fixed) return fixed;
  const area = host._hass ? (Reflect.get(host._hass.areas, key) as { icon?: string | null } | undefined) : undefined;
  return area?.icon || 'mdi:floor-plan';
}

/** Order keys (overview excluded) — the unit views_order is stored in. */
function orderKeys(options: RuleOption[]): string[] {
  return options
    .map(function toKey(option) {
      return option.key;
    })
    .filter(function notOverview(key) {
      return key !== OVERVIEW_VIEW_PATH;
    });
}

function updateViewsOrder(host: StrategyEditorHost, displayedOrder: string[]): void {
  if (!host._hass) return;
  const newConfig: Simon42StrategyConfig = { ...host._config };
  const merged = mergeViewsOrder(host._config.views_order, displayedOrder);

  // Dragged back to exactly the default order → drop the key (clean YAML).
  const defaultOrder = orderKeys(buildViewOptions(host._hass, withoutViewsOrder(host._config)));
  const isDefault = merged.join('|') === defaultOrder.join('|');

  if (isDefault) {
    delete newConfig.views_order;
  } else {
    newConfig.views_order = merged;
  }
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function withoutViewsOrder(config: Simon42StrategyConfig): Simon42StrategyConfig {
  const copy: Simon42StrategyConfig = { ...config };
  delete copy.views_order;
  return copy;
}

function resetViewsOrder(host: StrategyEditorHost): void {
  const newConfig = withoutViewsOrder(host._config);
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

export function renderViewOrderPanel(host: StrategyEditorHost): TemplateResult {
  if (!host._hass) return html``;
  const options = getViewOptions(host);
  const customViews = host._config.custom_views || [];
  const customPaths = new Set(
    customViews.map(function toPath(view) {
      return view.path || '';
    })
  );
  const customIcons = new Map<string, string>();
  for (const view of customViews) {
    if (view.path)
      customIcons.set(view.path, view.icon || (view.ref_dashboard ? 'mdi:link-variant' : 'mdi:card-text-outline'));
  }
  const hasCustomOrder = (host._config.views_order || []).length > 0;

  return html`
    <div class="option-group-title" style="margin-top: 16px;">
      <ha-icon icon="mdi:sort"></ha-icon>
      ${localize('editor.views_order')}
    </div>
    <div class="description" style="margin-left: 0; margin-bottom: 8px;">
      ${localize('editor.views_order_desc')}
    </div>
    <div class="section-order-list" id="views-order-list">
      ${options.map((option) => renderViewRow(host, option, customPaths, customIcons))}
    </div>
    ${
      hasCustomOrder
        ? html`
      <button class="btn-primary" style="margin-top: 8px;" @click=${() => resetViewsOrder(host)}>
        ${localize('editor.views_order_reset')}
      </button>
    `
        : nothing
    }
  `;
}

function renderViewRow(
  host: StrategyEditorHost,
  option: RuleOption,
  customPaths: Set<string>,
  customIcons: Map<string, string>
): TemplateResult {
  const icon = viewIcon(host, option.key, customIcons);
  if (option.key === OVERVIEW_VIEW_PATH) {
    return html`
      <div class="section-order-item" data-view-key=${option.key}>
        <span class="drag-handle" style="visibility: hidden;">&#x2630;</span>
        <ha-icon class="section-icon" icon=${icon}></ha-icon>
        <span class="section-label">${option.title}</span>
        <span class="section-hidden-tag">(${localize('editor.views_order_fixed')})</span>
      </div>
    `;
  }
  const subview = isSubview(host._config, option.key, customPaths);
  return html`
    <div class="section-order-item"
      data-view-key=${option.key}
      draggable="true"
      @dragstart=${(ev: DragEvent) => handleViewDragStart(host, ev)}
      @dragend=${(ev: DragEvent) => handleViewDragEnd(host, ev)}
      @dragover=${(ev: DragEvent) => handleViewDragOver(host, ev)}
      @dragleave=${(ev: DragEvent) => handleViewDragLeave(host, ev)}
      @drop=${(ev: DragEvent) => handleViewDrop(host, ev)}>
      <span class="drag-handle" draggable="true">&#x2630;</span>
      <ha-icon class="section-icon" icon=${icon}></ha-icon>
      <span class="section-label">${option.title}</span>
      ${subview ? html`<span class="section-hidden-tag">(${localize('editor.views_order_subview')})</span>` : nothing}
    </div>
  `;
}

function handleViewDragStart(host: StrategyEditorHost, ev: DragEvent): void {
  const dragHandle = (ev.target as HTMLElement).closest('.drag-handle');
  if (!dragHandle) {
    ev.preventDefault();
    return;
  }

  const item = (ev.target as HTMLElement).closest('.section-order-item') as HTMLElement | null;
  if (!item) {
    ev.preventDefault();
    return;
  }

  item.classList.add('dragging');
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/plain', item.dataset.viewKey || '');
  }
  host._viewDraggedElement = item;
}

function handleViewDragEnd(host: StrategyEditorHost, ev: DragEvent): void {
  const item = (ev.target as HTMLElement).closest('.section-order-item') as HTMLElement | null;
  if (item) item.classList.remove('dragging');

  host.shadowRoot?.querySelectorAll('#views-order-list .section-order-item.drag-over').forEach((el) => {
    el.classList.remove('drag-over');
  });
  host._viewDraggedElement = null;
}

function handleViewDragOver(host: StrategyEditorHost, ev: DragEvent): void {
  ev.preventDefault();
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';

  const item = ev.currentTarget as HTMLElement;
  if (item !== host._viewDraggedElement) {
    item.classList.add('drag-over');
  }
}

function handleViewDragLeave(host: StrategyEditorHost, ev: DragEvent): void {
  (ev.currentTarget as HTMLElement).classList.remove('drag-over');
}

function handleViewDrop(host: StrategyEditorHost, ev: DragEvent): void {
  ev.stopPropagation();
  ev.preventDefault();

  const dropTarget = ev.currentTarget as HTMLElement;
  dropTarget.classList.remove('drag-over');

  if (!host._viewDraggedElement || host._viewDraggedElement === dropTarget) return;

  const draggedKey = host._viewDraggedElement.dataset.viewKey;
  const dropKey = dropTarget.dataset.viewKey;
  if (!draggedKey || !dropKey) return;

  const currentOrder = orderKeys(getViewOptions(host));
  const draggedIndex = currentOrder.indexOf(draggedKey);
  const dropIndex = currentOrder.indexOf(dropKey);
  if (draggedIndex === -1 || dropIndex === -1) return;

  const newOrder = [...currentOrder];
  newOrder.splice(draggedIndex, 1);
  newOrder.splice(dropIndex, 0, draggedKey);

  updateViewsOrder(host, newOrder);
}
