// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR PANEL: BANNER
// ====================================================================

/* eslint-disable xss/no-mixed-html, @typescript-eslint/no-confusing-void-expression --
   False positive: lit-html's `html` tag escapes every interpolation by
   construction. Codacy's legacy ESLint 8 engine misreads lit render
   functions, DOM Element locals and input event payloads as raw HTML. The
   void-expression rule fights the codebase's established concise event-
   handler arrows (`(checked) => host._toggleChanged(...)`). */
import { html, nothing, type TemplateResult } from 'lit';
import type { Simon42StrategyConfig, BannerEntityConfig } from '../../types/strategy';
import { localize } from '../../utils/localize';
import { getAllEntitiesForSelect } from '../entity-options';
import type { StrategyEditorHost } from '../editor-host';

export function renderBannerSection(host: StrategyEditorHost): TemplateResult {
  const bannerEntities = getBannerEntities(host._config);
  const allEntities = getAllEntitiesForSelect(host._hass);

  return html`
    <div class="description" style="margin-bottom: 8px;">
      ${localize('editor.banner_desc')}
    </div>

    ${bannerEntities.map((b, i) => html`
      <div class="form-row" style="align-items: center; gap: 8px; flex-wrap: nowrap;">
        <select style="flex: 1; min-width: 0;"
          @change=${(e: Event) => bannerEntityChanged(host, i, (e.target as HTMLSelectElement).value)}>
          <option value="" ?selected=${!b.entity}>—</option>
          ${allEntities.map((opt) => html`
            <option value=${opt.entity_id} ?selected=${opt.entity_id === b.entity}>
              ${opt.name} (${opt.entity_id})
            </option>
          `)}
        </select>
        <select style="width: 100px; flex-shrink: 0;"
          @change=${(e: Event) => bannerAlertTypeChanged(host, i, (e.target as HTMLSelectElement).value as BannerEntityConfig['alert_type'])}>
          ${(['info', 'warning', 'error', 'success'] as const).map((t) => html`
            <option value=${t} ?selected=${(b.alert_type ?? 'info') === t}>${t}</option>
          `)}
        </select>
        <button class="btn-remove" @click=${() => removeBannerEntity(host, i)}>&#x2715;</button>
      </div>
    `)}

    <div class="form-row" style="margin-top: 8px;">
      <div class="entity-search-picker" style="flex: 1;">
        <input type="text" class="entity-search-input"
          placeholder=${localize('editor.banner_add')}
          .value=${host._bannerSearch}
          @input=${(e: Event) => { host._bannerSearch = (e.target as HTMLInputElement).value; host.requestUpdate(); }}
          @blur=${() => { setTimeout(() => { host._bannerSearch = ''; host.requestUpdate(); }, 200); }}
        />
        ${host._bannerSearch.length >= 2 ? html`
          <div class="entity-search-results">
            ${(() => {
              const results = allEntities
                .filter((opt) => !bannerEntities.some((b) => b.entity === opt.entity_id))
                .filter((opt) =>
                  opt.name.toLowerCase().includes(host._bannerSearch.toLowerCase()) ||
                  opt.entity_id.toLowerCase().includes(host._bannerSearch.toLowerCase())
                )
                .slice(0, 10);
              return results.length > 0
                ? results.map((entity) => html`
                  <div class="entity-search-result" @mousedown=${(e: Event) => {
                    e.preventDefault();
                    addBannerEntityById(host, entity.entity_id);
                    host._bannerSearch = '';
                    host.requestUpdate();
                  }}>
                    <span class="entity-search-name">${entity.name}</span>
                    <span class="entity-search-id">${entity.entity_id}</span>
                  </div>
                `)
                : html`<div class="entity-search-no-results">${localize('editor.no_results')}</div>`;
            })()}
          </div>
        ` : nothing}
      </div>
    </div>

    ${bannerEntities.length === 0 ? html`
      <div class="description">${localize('editor.banner_none')}</div>
    ` : nothing}
  `;
}

function getBannerEntities(config: Simon42StrategyConfig): BannerEntityConfig[] {
  if (config.banner_entities?.length) {
    return config.banner_entities;
  }
  if (config.banner_entity) {
    return [{ entity: config.banner_entity, alert_type: config.banner_alert_type ?? 'info' }];
  }
  return [];
}

function saveBannerEntities(host: StrategyEditorHost, entities: BannerEntityConfig[]): void {
  const newConfig: Simon42StrategyConfig = { ...host._config };
  delete newConfig.banner_entity;
  delete newConfig.banner_alert_type;
  if (entities.length > 0) {
    newConfig.banner_entities = entities;
  } else {
    delete newConfig.banner_entities;
  }
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function addBannerEntityById(host: StrategyEditorHost, entityId: string): void {
  if (!entityId) return;
  const current = getBannerEntities(host._config);
  if (current.some((b) => b.entity === entityId)) return;
  saveBannerEntities(host, [...current, { entity: entityId, alert_type: 'info' }]);
}

function removeBannerEntity(host: StrategyEditorHost, index: number): void {
  const current = getBannerEntities(host._config);
  saveBannerEntities(host, current.filter((_, i) => i !== index));
}

function bannerEntityChanged(host: StrategyEditorHost, index: number, entityId: string): void {
  const current = getBannerEntities(host._config);
  const updated = current.map((b, i) => (i === index ? { ...b, entity: entityId } : b));
  saveBannerEntities(host, updated);
}

function bannerAlertTypeChanged(
  host: StrategyEditorHost,
  index: number,
  alertType: BannerEntityConfig['alert_type'],
): void {
  const current = getBannerEntities(host._config);
  const updated = current.map((b, i) => (i === index ? { ...b, alert_type: alertType } : b));
  saveBannerEntities(host, updated);
}
