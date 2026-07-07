// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR: ENTITY LIST DRAG & DROP
// ====================================================================
// Shared drag & drop reordering for the flat entity lists (favorites
// and room pins). Extracted verbatim from StrategyEditor.ts.
// ====================================================================

/* eslint-disable xss/no-mixed-html, @typescript-eslint/no-confusing-void-expression --
   False positive: lit-html's `html` tag escapes every interpolation by
   construction. Codacy's legacy ESLint 8 engine misreads lit render
   functions, DOM Element locals and input event payloads as raw HTML. The
   void-expression rule fights the codebase's established concise event-
   handler arrows (`(checked) => host._toggleChanged(...)`). */
import type { Simon42StrategyConfig } from '../../types/strategy';
import type { StrategyEditorHost } from '../editor-host';

export type EntityListKind = 'favorites' | 'room_pins';

export function handleEntityDragStart(
  host: StrategyEditorHost,
  ev: DragEvent,
  _listType: EntityListKind,
): void {
  const item = (ev.target as HTMLElement).closest('.entity-list-item') as HTMLElement | null;
  if (!item) { ev.preventDefault(); return; }

  item.classList.add('dragging');
  host._entityDraggedId = item.dataset.entityId || null;
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/plain', host._entityDraggedId || '');
  }
}

export function handleEntityDragEnd(host: StrategyEditorHost, ev: DragEvent): void {
  const item = (ev.target as HTMLElement).closest('.entity-list-item') as HTMLElement | null;
  if (item) item.classList.remove('dragging');
  host._entityDraggedId = null;
}

export function handleEntityDragOver(host: StrategyEditorHost, ev: DragEvent): void {
  ev.preventDefault();
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
  const item = (ev.currentTarget as HTMLElement);
  if (item.dataset.entityId !== host._entityDraggedId) {
    item.classList.add('drag-over');
  }
}

export function handleEntityDragLeave(_host: StrategyEditorHost, ev: DragEvent): void {
  (ev.currentTarget as HTMLElement).classList.remove('drag-over');
}

export function handleEntityDrop(
  host: StrategyEditorHost,
  ev: DragEvent,
  listType: EntityListKind,
): void {
  ev.stopPropagation();
  ev.preventDefault();

  const dropTarget = ev.currentTarget as HTMLElement;
  dropTarget.classList.remove('drag-over');

  const draggedId = host._entityDraggedId;
  const dropId = dropTarget.dataset.entityId;
  if (!draggedId || !dropId || draggedId === dropId) return;

  const currentList = listType === 'favorites'
    ? [...(host._config.favorite_entities || [])]
    : [...(host._config.room_pin_entities || [])];

  const draggedIndex = currentList.indexOf(draggedId);
  const dropIndex = currentList.indexOf(dropId);
  if (draggedIndex === -1 || dropIndex === -1) return;

  currentList.splice(draggedIndex, 1);
  currentList.splice(dropIndex, 0, draggedId);

  const key = listType === 'favorites' ? 'favorite_entities' : 'room_pin_entities';
  const newConfig: Simon42StrategyConfig = { ...host._config, [key]: currentList };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}
