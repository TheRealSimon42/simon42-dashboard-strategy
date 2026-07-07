// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR PANEL: PER-AREA STACK ORDER
// ====================================================================
// Drag & drop ordering of the generated room-view stacks per area.
// Rendered inside the areas panel. Extracted verbatim from
// StrategyEditor.ts (module split); dynamic lookups on moved lines
// hardened per the CLAUDE.md Codacy pitfalls.
// ====================================================================

/* eslint-disable xss/no-mixed-html, @typescript-eslint/no-confusing-void-expression --
   False positive: lit-html's `html` tag escapes every interpolation by
   construction. Codacy's legacy ESLint 8 engine misreads lit render
   functions, DOM Element locals and input event payloads as raw HTML. The
   void-expression rule fights the codebase's established concise event-
   handler arrows (`(checked) => host._toggleChanged(...)`). */
import { html, nothing, type TemplateResult } from 'lit';
import type { Simon42StrategyConfig, AreaOptions, StackKey } from '../../types/strategy';
import { DEFAULT_STACKS_ORDER } from '../../types/strategy';
import { localize } from '../../utils/localize';
import type { StrategyEditorHost, AreaEntitiesCacheEntry } from '../editor-host';

function updateStacksOrder(host: StrategyEditorHost, areaId: string, newOrder: StackKey[]): void {
  const currentAreaOptions = (Reflect.get(host._config.areas_options || {}, areaId) as AreaOptions | undefined) || {};
  const newAreaOptions: AreaOptions = { ...currentAreaOptions };

  if (newOrder.join('|') === DEFAULT_STACKS_ORDER.join('|')) {
    delete newAreaOptions.stacks_order;
  } else {
    newAreaOptions.stacks_order = newOrder;
  }

  const newAreasOptions: Record<string, AreaOptions> = {
    ...host._config.areas_options,
    [areaId]: newAreaOptions,
  };

  if (Object.keys(newAreaOptions).length === 0) {
    Reflect.deleteProperty(newAreasOptions, areaId);
  }

  const newConfig: Simon42StrategyConfig = { ...host._config };
  if (Object.keys(newAreasOptions).length === 0) {
    delete newConfig.areas_options;
  } else {
    newConfig.areas_options = newAreasOptions;
  }

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

const STACK_META = new Map<StackKey, { icon: string; labelKey: string }>([
  ['ups', { icon: 'mdi:power-plug-battery', labelKey: 'stacks.ups' }],
  ['energy', { icon: 'mdi:lightning-bolt', labelKey: 'stacks.energy' }],
  ['cameras', { icon: 'mdi:cctv', labelKey: 'stacks.cameras' }],
  ['lights', { icon: 'mdi:lightbulb', labelKey: 'stacks.lights' }],
  ['locks', { icon: 'mdi:lock', labelKey: 'stacks.locks' }],
  ['climate', { icon: 'mdi:thermostat', labelKey: 'stacks.climate' }],
  ['covers', { icon: 'mdi:window-shutter', labelKey: 'stacks.covers' }],
  ['covers_curtain', { icon: 'mdi:curtains', labelKey: 'stacks.covers_curtain' }],
  ['covers_window', { icon: 'mdi:window-open-variant', labelKey: 'stacks.covers_window' }],
  ['media', { icon: 'mdi:speaker', labelKey: 'stacks.media' }],
  ['scenes', { icon: 'mdi:palette', labelKey: 'stacks.scenes' }],
  ['vacuums', { icon: 'mdi:robot-vacuum', labelKey: 'stacks.vacuums' }],
  ['misc', { icon: 'mdi:dots-horizontal', labelKey: 'stacks.misc' }],
  ['automations', { icon: 'mdi:robot', labelKey: 'stacks.automations' }],
  ['scripts', { icon: 'mdi:script-text', labelKey: 'stacks.scripts' }],
  ['room_pins', { icon: 'mdi:pin', labelKey: 'stacks.room_pins' }],
]);

function presentStackKeys(host: StrategyEditorHost, 
  data: AreaEntitiesCacheEntry
): Set<StackKey> {
  const g = data.groupedEntities;
  const present = new Set<StackKey>();
  function has(key: string): boolean {
    return ((Reflect.get(g, key) as string[] | undefined)?.length ?? 0) > 0;
  }

  if (has('ups')) present.add('ups');
  if (has('energy')) present.add('energy');
  if (has('lights')) present.add('lights');
  if (has('locks')) present.add('locks');
  if (has('climate') || has('fan')) present.add('climate');
  if (has('covers')) present.add('covers');
  if (has('covers_curtain')) present.add('covers_curtain');
  if (has('covers_window')) present.add('covers_window');
  if (has('media_player')) present.add('media');
  if (has('scenes')) present.add('scenes');
  if (has('vacuum') && host._config.show_vacuums_section_in_rooms === true) present.add('vacuums');
  if (has('vacuum') || has('switches') || has('humidifier') || has('valve') || has('water_heater')) present.add('misc');
  if (has('automations')) present.add('automations');
  if (has('scripts')) present.add('scripts');

  present.add('cameras');
  present.add('room_pins');

  return present;
}

export function renderStackOrderPanel(host: StrategyEditorHost, 
  areaId: string,
  data: AreaEntitiesCacheEntry
): TemplateResult {
  const order = host._getStacksOrder(areaId);
  const present = presentStackKeys(host, data);
  const visibleOrder = order.filter((key) => present.has(key));
  const inactiveOrder = order.filter((key) => !present.has(key));

  return html`
    <div class="entity-group" data-group="stack_order">
      <div class="entity-group-header">
        <ha-icon icon="mdi:sort"></ha-icon>
        <span class="group-name">${localize('editor.stack_order')}</span>
      </div>
      <div class="entity-list">
        <div class="description" style="margin-left: 0; margin-bottom: 8px;">
          ${localize('editor.stack_order_desc')}
        </div>
        <div class="section-order-list" data-area-id=${areaId}>
          ${visibleOrder.map((key) => {
            const meta = STACK_META.get(key);
            if (!meta) return nothing;
            return html`
              <div class="section-order-item"
                data-area-id=${areaId}
                data-stack-key=${key}
                draggable="true"
                @dragstart=${(ev: DragEvent) => handleStackDragStart(host, ev)}
                @dragend=${(ev: DragEvent) => handleStackDragEnd(host, ev)}
                @dragover=${(ev: DragEvent) => handleStackDragOver(host, ev)}
                @dragleave=${(ev: DragEvent) => handleStackDragLeave(host, ev)}
                @drop=${(ev: DragEvent) => handleStackDrop(host, ev)}>
                <span class="drag-handle" draggable="true">&#x2630;</span>
                <ha-icon class="section-icon" icon=${meta.icon}></ha-icon>
                <span class="section-label">${localize(meta.labelKey)}</span>
              </div>
            `;
          })}
        </div>
        ${inactiveOrder.length > 0
          ? html`
            <div class="section-order-compact">
              <div class="compact-title">${localize('editor.stack_order_inactive')}</div>
              <div class="compact-chip-list">
                ${inactiveOrder.map((key) => {
                  const meta = STACK_META.get(key);
                  if (!meta) return nothing;
                  return html`
                    <span class="compact-chip">
                      <ha-icon icon=${meta.icon}></ha-icon>
                      ${localize(meta.labelKey)}
                    </span>
                  `;
                })}
              </div>
            </div>
          `
          : nothing}
      </div>
    </div>
  `;
}

function handleStackDragStart(host: StrategyEditorHost, ev: DragEvent): void {
  const dragHandle = (ev.target as HTMLElement).closest('.drag-handle');
  if (!dragHandle) { ev.preventDefault(); return; }

  const item = (ev.target as HTMLElement).closest('.section-order-item') as HTMLElement | null;
  if (!item) { ev.preventDefault(); return; }

  item.classList.add('dragging');
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/plain', item.dataset.stackKey || '');
  }
  host._stackDraggedElement = item;
}

function handleStackDragEnd(host: StrategyEditorHost, ev: DragEvent): void {
  const item = (ev.target as HTMLElement).closest('.section-order-item') as HTMLElement | null;
  if (item) item.classList.remove('dragging');

  host.shadowRoot
    ?.querySelectorAll('.section-order-item.drag-over')
    .forEach((el) => {
      el.classList.remove('drag-over');
    });
  host._stackDraggedElement = null;
}

function handleStackDragOver(host: StrategyEditorHost, ev: DragEvent): void {
  ev.preventDefault();
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';

  const item = ev.currentTarget as HTMLElement;
  if (item !== host._stackDraggedElement) {
    item.classList.add('drag-over');
  }
}

function handleStackDragLeave(host: StrategyEditorHost, ev: DragEvent): void {
  (ev.currentTarget as HTMLElement).classList.remove('drag-over');
}

function handleStackDrop(host: StrategyEditorHost, ev: DragEvent): void {
  ev.stopPropagation();
  ev.preventDefault();

  const dropTarget = ev.currentTarget as HTMLElement;
  dropTarget.classList.remove('drag-over');

  if (!host._stackDraggedElement || host._stackDraggedElement === dropTarget) return;

  const draggedKey = host._stackDraggedElement.dataset.stackKey as StackKey | undefined;
  const dropKey = dropTarget.dataset.stackKey as StackKey | undefined;
  const areaId = dropTarget.dataset.areaId;
  if (!draggedKey || !dropKey || !areaId) return;

  const currentOrder = host._getStacksOrder(areaId);
  const draggedIndex = currentOrder.indexOf(draggedKey);
  const dropIndex = currentOrder.indexOf(dropKey);
  if (draggedIndex === -1 || dropIndex === -1) return;

  const newOrder = [...currentOrder];
  newOrder.splice(draggedIndex, 1);
  newOrder.splice(dropIndex, 0, draggedKey);

  updateStacksOrder(host, areaId, newOrder);
}
