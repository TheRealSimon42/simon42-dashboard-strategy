// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR PANELS: FAVORITES + LIGHT FAVORITES
// ====================================================================
// Extracted verbatim from StrategyEditor.ts (module split).
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
import { getAllEntitiesForSelect, getFilteredEntities } from '../entity-options';
import type { StrategyEditorHost } from '../editor-host';
import {
  handleEntityDragStart,
  handleEntityDragEnd,
  handleEntityDragOver,
  handleEntityDragLeave,
  handleEntityDrop,
} from './entity-list-dnd';

// -- Light favorites ----------------------------------------------------

export function renderLightFavoritesSection(host: StrategyEditorHost): TemplateResult {
  const lightFavs = host._config.light_favorite_entities || [];
  const allEntities = getAllEntitiesForSelect(host._hass);
  const entityMap = new Map(allEntities.map((e) => [e.entity_id, e.name]));
  const filtered = getFilteredEntities(host._hass, host._lightFavSearch).filter((e) => e.entity_id.startsWith('light.'));
  return html`

      ${lightFavs.length > 0 ? html`
        <div class="entity-list-container" style="margin-bottom: 8px;">
          ${lightFavs.map((entityId) => {
            const name = entityMap.get(entityId) || entityId;
            return html`
              <div class="entity-list-item" data-entity-id=${entityId}>
                <span class="item-info">
                  <span class="item-name">${name}</span>
                  <span class="item-entity-id">${entityId}</span>
                </span>
                <button class="btn-remove" @click=${() => removeLightFavorite(host, entityId)}>&#x2715;</button>
              </div>
            `;
          })}
        </div>
      ` : nothing}

      <div class="entity-search-picker">
        <input type="text" class="entity-search-input"
          placeholder=${localize('editor.select_entity') + '...'}
          .value=${host._lightFavSearch}
          @input=${(e: Event) => { host._lightFavSearch = (e.target as HTMLInputElement).value; host.requestUpdate(); }}
          @blur=${() => { setTimeout(() => { host._lightFavSearch = ''; host.requestUpdate(); }, 200); }}
        />
        ${host._lightFavSearch.length >= 2 ? html`
          <div class="entity-search-results">
            ${filtered.length > 0
              ? filtered.map((entity) => html`
                <div class="entity-search-result" @mousedown=${(e: Event) => { e.preventDefault(); addLightFavorite(host, entity.entity_id); host._lightFavSearch = ''; host.requestUpdate(); }}>
                  <span class="entity-search-name">${entity.name}</span>
                  <span class="entity-search-id">${entity.entity_id}</span>
                </div>
              `)
              : html`<div class="entity-search-no-results">${localize('editor.no_results')}</div>`
            }
          </div>
        ` : nothing}
      </div>
      <div class="description">${localize('editor.light_favorites_desc')}</div>
  `;
}

function addLightFavorite(host: StrategyEditorHost, entityId: string): void {
  const current = host._config.light_favorite_entities || [];
  if (current.includes(entityId)) return;
  const updated: Simon42StrategyConfig = { ...host._config, light_favorite_entities: [...current, entityId] };
  host._fireConfigChanged(updated);
}

function removeLightFavorite(host: StrategyEditorHost, entityId: string): void {
  const current = host._config.light_favorite_entities || [];
  const next = current.filter((e) => e !== entityId);
  const updated: Simon42StrategyConfig = { ...host._config };
  if (next.length === 0) delete updated.light_favorite_entities;
  else updated.light_favorite_entities = next;
  host._fireConfigChanged(updated);
}

// -- Favorites ------------------------------------------------------------

export function renderFavoritesSection(host: StrategyEditorHost): TemplateResult {
  const favoriteEntities = host._config.favorite_entities || [];
  const allEntities = getAllEntitiesForSelect(host._hass);
  const favoritesShowState = host._config.favorites_show_state === true;
  const favoritesHideLastChanged = host._config.favorites_hide_last_changed === true;

  const entityMap = new Map(allEntities.map((e) => [e.entity_id, e.name]));
  const filteredEntities = getFilteredEntities(host._hass, host._favoriteSearch);

  return html`

      <div id="favorites-list" style="margin-bottom: 12px;">
        ${favoriteEntities.length === 0
          ? html`<div class="empty-state">${localize('editor.no_favorites')}</div>`
          : html`
            <div class="entity-list-container">
              ${favoriteEntities.map((entityId) => {
                const name = entityMap.get(entityId) || entityId;
                return html`
                  <div class="entity-list-item" data-entity-id=${entityId}
                    draggable="true"
                    @dragstart=${(ev: DragEvent) => handleEntityDragStart(host, ev, 'favorites')}
                    @dragend=${(ev: DragEvent) => handleEntityDragEnd(host, ev)}
                    @dragover=${(ev: DragEvent) => handleEntityDragOver(host, ev)}
                    @dragleave=${(ev: DragEvent) => handleEntityDragLeave(host, ev)}
                    @drop=${(ev: DragEvent) => handleEntityDrop(host, ev, 'favorites')}>
                    <span class="drag-icon">&#x2630;</span>
                    <span class="item-info">
                      <span class="item-name">${name}</span>
                      <span class="item-entity-id">${entityId}</span>
                    </span>
                    <button class="btn-remove" @click=${() => removeFavoriteEntity(host, entityId)}>&#x2715;</button>
                  </div>
                `;
              })}
            </div>
          `}
      </div>

      <div class="entity-search-picker">
        <input type="text" class="entity-search-input"
          placeholder=${localize('editor.select_entity') + '...'}
          .value=${host._favoriteSearch}
          @input=${(e: Event) => { host._favoriteSearch = (e.target as HTMLInputElement).value; host.requestUpdate(); }}
          @blur=${() => { setTimeout(() => { host._favoriteSearch = ''; host.requestUpdate(); }, 200); }}
        />
        ${host._favoriteSearch.length >= 2 ? html`
          <div class="entity-search-results">
            ${filteredEntities.length > 0
              ? filteredEntities.map((entity) => html`
                <div class="entity-search-result" @mousedown=${(e: Event) => { e.preventDefault(); addFavoriteEntity(host, entity.entity_id); host._favoriteSearch = ''; host.requestUpdate(); }}>
                  <span class="entity-search-name">${entity.name}</span>
                  <span class="entity-search-id">${entity.entity_id}</span>
                </div>
              `)
              : html`<div class="entity-search-no-results">${localize('editor.no_results')}</div>`
            }
          </div>
        ` : nothing}
      </div>
      <div class="description">${localize('editor.favorites_desc')}</div>

      ${host._renderCheckbox('favorites-show-state', localize('editor.show_state'), favoritesShowState,
        (checked) => host._toggleChanged('favorites_show_state', checked, false))}

      ${host._renderCheckbox('favorites-hide-last-changed', localize('editor.hide_last_changed'), favoritesHideLastChanged,
        (checked) => host._toggleChanged('favorites_hide_last_changed', checked, false))}
  `;
}

function addFavoriteEntity(host: StrategyEditorHost, entityId: string): void {
  if (!host._hass) return;
  const currentFavorites = host._config.favorite_entities || [];
  if (currentFavorites.includes(entityId)) return;

  const newConfig: Simon42StrategyConfig = {
    ...host._config,
    favorite_entities: [...currentFavorites, entityId],
  };

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function removeFavoriteEntity(host: StrategyEditorHost, entityId: string): void {
  if (!host._hass) return;
  const currentFavorites = host._config.favorite_entities || [];
  const newFavorites = currentFavorites.filter((id) => id !== entityId);

  const newConfig: Simon42StrategyConfig = {
    ...host._config,
    favorite_entities: newFavorites.length > 0 ? newFavorites : undefined,
  };

  if (newFavorites.length === 0) {
    delete newConfig.favorite_entities;
  }

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}
