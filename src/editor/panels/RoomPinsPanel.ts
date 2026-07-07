// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR PANEL: ROOM PINS
// ====================================================================
// Extracted verbatim from StrategyEditor.ts (module split). The dead
// select-based `_addRoomPinFromSelect` path (superseded by the search
// picker) was dropped in the move.
// ====================================================================

/* eslint-disable xss/no-mixed-html, @typescript-eslint/no-confusing-void-expression --
   False positive: lit-html's `html` tag escapes every interpolation by
   construction. Codacy's legacy ESLint 8 engine misreads lit render
   functions, DOM Element locals and input event payloads as raw HTML. The
   void-expression rule fights the codebase's established concise event-
   handler arrows (`(checked) => host._toggleChanged(...)`). */
import { html, nothing, type TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type { Simon42StrategyConfig } from '../../types/strategy';
import { localize } from '../../utils/localize';
import { getAllEntitiesForSelect, getFilteredEntities } from '../entity-options';
import type { StrategyEditorHost } from '../editor-host';
import {
  handleEntityDragStart,
  handleEntityDragEnd,
  handleEntityDragOver,
  handleEntityDragLeave,
  handleEntityDrop,
} from './entity-list-dnd';

export function renderRoomPinsSection(host: StrategyEditorHost): TemplateResult {
  const hass = host._hass;
  if (!hass) return html``;
  const roomPinEntities = host._config.room_pin_entities || [];
  const allEntities = getAllEntitiesForSelect(hass);
  const allAreas = Object.values(hass.areas).sort((a, b) => a.name.localeCompare(b.name));
  const roomPinsShowState = host._config.room_pins_show_state === true;
  const roomPinsHideLastChanged = host._config.room_pins_hide_last_changed === true;
  const roomPinsFirst = host._config.room_pins_first === true;

  const entityMap = new Map(allEntities.map((e) => [e.entity_id, e]));
  const areaMap = new Map(allAreas.map((a) => [a.area_id, a.name]));
  const filteredEntities = getFilteredEntities(host._hass, host._roomPinSearch, true);

  return html`

      <div id="room-pins-list" style="margin-bottom: 12px;">
        ${roomPinEntities.length === 0
          ? html`<div class="empty-state">${localize('editor.no_room_pins')}</div>`
          : html`
            <div class="entity-list-container">
              ${roomPinEntities.map((entityId) => {
                const entity = entityMap.get(entityId);
                const name = entity?.name || entityId;
                const areaId = entity?.area_id || entity?.device_area_id;
                const areaName = areaId ? areaMap.get(areaId) || areaId : localize('editor.no_room');

                return html`
                  <div class="entity-list-item" data-entity-id=${entityId}
                    draggable="true"
                    @dragstart=${(ev: DragEvent) => handleEntityDragStart(host, ev, 'room_pins')}
                    @dragend=${(ev: DragEvent) => handleEntityDragEnd(host, ev)}
                    @dragover=${(ev: DragEvent) => handleEntityDragOver(host, ev)}
                    @dragleave=${(ev: DragEvent) => handleEntityDragLeave(host, ev)}
                    @drop=${(ev: DragEvent) => handleEntityDrop(host, ev, 'room_pins')}>
                    <span class="drag-icon">&#x2630;</span>
                    <span class="item-info">
                      <span class="item-name">${name}</span>
                      <span class="item-entity-id">${entityId}</span>
                      <span class="item-area">&#x1F4CD; ${areaName}</span>
                    </span>
                    <button class="btn-remove" @click=${() => removeRoomPinEntity(host, entityId)}>&#x2715;</button>
                  </div>
                `;
              })}
            </div>
          `}
      </div>

      <div class="entity-search-picker">
        <input type="text" class="entity-search-input"
          placeholder=${localize('editor.select_entity') + '...'}
          .value=${host._roomPinSearch}
          @input=${(e: Event) => { host._roomPinSearch = (e.target as HTMLInputElement).value; host.requestUpdate(); }}
          @blur=${() => { setTimeout(() => { host._roomPinSearch = ''; host.requestUpdate(); }, 200); }}
        />
        ${host._roomPinSearch.length >= 2 ? html`
          <div class="entity-search-results">
            ${filteredEntities.length > 0
              ? filteredEntities.map((entity) => html`
                <div class="entity-search-result" @mousedown=${(e: Event) => { e.preventDefault(); addRoomPinEntity(host, entity.entity_id); host._roomPinSearch = ''; host.requestUpdate(); }}>
                  <span class="entity-search-name">${entity.name}</span>
                  <span class="entity-search-id">${entity.entity_id}</span>
                </div>
              `)
              : html`<div class="entity-search-no-results">${localize('editor.no_results')}</div>`
            }
          </div>
        ` : nothing}
      </div>
      <div class="description">${unsafeHTML(localize('editor.room_pins_desc'))}</div>

      ${host._renderCheckbox('room-pins-show-state', localize('editor.show_state'), roomPinsShowState,
        (checked) => host._toggleChanged('room_pins_show_state', checked, false))}

      ${host._renderCheckbox('room-pins-hide-last-changed', localize('editor.hide_last_changed'), roomPinsHideLastChanged,
        (checked) => host._toggleChanged('room_pins_hide_last_changed', checked, false))}

      ${host._renderCheckbox('room-pins-first', localize('editor.room_pins_first'), roomPinsFirst,
        (checked) => host._toggleChanged('room_pins_first', checked, false))}
  `;
}

function addRoomPinEntity(host: StrategyEditorHost, entityId: string): void {
  if (!host._hass) return;
  const currentPins = host._config.room_pin_entities || [];
  if (currentPins.includes(entityId)) return;

  const newConfig: Simon42StrategyConfig = {
    ...host._config,
    room_pin_entities: [...currentPins, entityId],
  };

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function removeRoomPinEntity(host: StrategyEditorHost, entityId: string): void {
  if (!host._hass) return;
  const currentPins = host._config.room_pin_entities || [];
  const newPins = currentPins.filter((id) => id !== entityId);

  const newConfig: Simon42StrategyConfig = {
    ...host._config,
    room_pin_entities: newPins.length > 0 ? newPins : undefined,
  };

  if (newPins.length === 0) {
    delete newConfig.room_pin_entities;
  }

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}
