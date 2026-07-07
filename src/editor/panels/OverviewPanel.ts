// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR PANEL: OVERVIEW
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
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type { Simon42StrategyConfig } from '../../types/strategy';
import { localize } from '../../utils/localize';
import { getAlarmEntities } from '../entity-options';
import type { StrategyEditorHost } from '../editor-host';

export function renderOverviewSection(host: StrategyEditorHost): TemplateResult {
  const showClockCard = host._config.show_clock_card !== false;
  const showSearchCard = host._config.show_search_card === true;
  const hideUnavailableEntities = host._config.hide_unavailable_entities === true;
  const denseSectionPlacement = host._config.dense_section_placement === true;
  const showPersonBadges = host._config.show_person_badges !== false;
  const hasSearchCardDeps = checkSearchCardDependencies();
  const alarmEntity = host._config.alarm_entity || '';
  const alarmEntities = getAlarmEntities(host._hass);

  return html`

      ${host._renderCheckbox('show-clock-card', localize('editor.show_clock_card'), showClockCard,
        (checked) => host._toggleChanged('show_clock_card', checked, true))}
      <div class="description">${localize('editor.show_clock_card_desc')}</div>

      <div style="font-size: 13px; font-weight: 500; color: var(--primary-text-color); margin-top: 12px; margin-bottom: 4px;">
        ${localize('editor.person_badge_layout')}
      </div>
      ${(['minimal', 'with_state', 'with_state_and_time'] as const).map((opt) => {
        const current = host._config.person_badge_layout || 'with_state';
        return html`
          <div class="form-row">
            <input type="radio" id="person-badge-${opt}" name="person-badge-layout" value=${opt}
              ?checked=${current === opt}
              @change=${() => personBadgeLayoutChanged(host, opt)} />
            <label for="person-badge-${opt}">${localize('editor.person_badge_layout_' + opt)}</label>
          </div>
        `;
      })}
      <div class="description">${localize('editor.person_badge_layout_desc')}</div>

      <div class="form-row">
        <label for="alarm-entity" style="margin-right: 8px; min-width: 120px;">${localize('editor.alarm_entity')}</label>
        <select id="alarm-entity"
          style="flex: 1;"
          @change=${(e: Event) => alarmEntityChanged(host, e)}>
          <option value="" ?selected=${!alarmEntity}>${localize('editor.alarm_none')}</option>
          ${alarmEntities.map((entity) => html`
            <option value=${entity.entity_id} ?selected=${entity.entity_id === alarmEntity}>
              ${entity.name}
            </option>
          `)}
        </select>
      </div>
      <div class="description">${localize('editor.alarm_desc')}</div>

      ${host._renderCheckbox('show-search-card', localize('editor.show_search_card'), showSearchCard,
        (checked) => { host._toggleChanged('show_search_card', checked, false); })}
      <div class="description">
        ${hasSearchCardDeps
          ? localize('editor.show_search_card_desc')
          : html`<span>&#x26A0;&#xFE0F; ${unsafeHTML(localize('editor.show_search_card_missing'))}</span>`}
      </div>
      ${host._renderCheckbox('hide-unavailable-entities', localize('editor.hide_unavailable_entities'), hideUnavailableEntities,
        (checked) => host._toggleChanged('hide_unavailable_entities', checked, false))}
      <div class="description">${localize('editor.hide_unavailable_entities_desc')}</div>

      ${host._renderCheckbox('dense-section-placement', localize('editor.dense_section_placement'), denseSectionPlacement,
        (checked) => host._toggleChanged('dense_section_placement', checked, false))}
      <div class="description">${localize('editor.dense_section_placement_desc')}</div>

      ${host._renderCheckbox('show-person-badges', localize('editor.show_person_badges'), showPersonBadges,
        (checked) => host._toggleChanged('show_person_badges', checked, true))}
      <div class="description">${localize('editor.show_person_badges_desc')}</div>
      ${showSearchCard ? html`
        <div style="margin-left: 26px; margin-bottom: 8px;">
          <div style="font-size: 13px; font-weight: 500; color: var(--primary-text-color); margin-top: 4px; margin-bottom: 4px;">
            ${localize('editor.search_card_variant')}
          </div>
          ${(['custom', 'tip'] as const).map((opt) => {
            const current = host._config.search_card_variant === 'tip' ? 'tip' : 'custom';
            return html`
              <div class="form-row">
                <input type="radio" id="search-variant-${opt}" name="search-card-variant" value=${opt}
                  ?checked=${current === opt}
                  @change=${() => searchCardVariantChanged(host, opt)} />
                <label for="search-variant-${opt}">${localize('editor.search_card_variant_' + opt)}</label>
              </div>
            `;
          })}
        </div>
      ` : nothing}
  `;
}

function checkSearchCardDependencies(): boolean {
  const hasSearchCard = customElements.get('search-card') !== undefined;
  const hasCardTools = customElements.get('card-tools') !== undefined;
  return hasSearchCard && hasCardTools;
}

function searchCardVariantChanged(host: StrategyEditorHost, variant: 'custom' | 'tip'): void {
  const updated: Simon42StrategyConfig = { ...host._config };
  if (variant === 'custom') {
    delete updated.search_card_variant;
  } else {
    updated.search_card_variant = variant;
  }
  host._fireConfigChanged(updated);
}

function personBadgeLayoutChanged(
  host: StrategyEditorHost,
  layout: 'minimal' | 'with_state' | 'with_state_and_time',
): void {
  const updated: Simon42StrategyConfig = { ...host._config };
  if (layout === 'with_state') {
    delete updated.person_badge_layout;
  } else {
    updated.person_badge_layout = layout;
  }
  host._fireConfigChanged(updated);
}

function alarmEntityChanged(host: StrategyEditorHost, e: Event): void {
  if (!host._hass) return;

  const entityId = (e.target as HTMLSelectElement).value;
  const newConfig: Simon42StrategyConfig = {
    ...host._config,
    alarm_entity: entityId,
  };

  if (!entityId || entityId === '') {
    delete newConfig.alarm_entity;
  }

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}
