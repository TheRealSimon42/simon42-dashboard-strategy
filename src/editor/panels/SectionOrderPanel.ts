// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR PANEL: SECTION ORDER
// ====================================================================
// Overview section ordering (drag & drop), per-section visibility
// toggles + conditional visibility rules, hidden headings, weather /
// energy sub-options and the overview badge toggles. Extracted
// verbatim from StrategyEditor.ts (module split); dynamic object
// lookups on moved lines hardened per the CLAUDE.md Codacy pitfalls.
// ====================================================================

/* eslint-disable xss/no-mixed-html, @typescript-eslint/no-confusing-void-expression --
   False positive: lit-html's `html` tag escapes every interpolation by
   construction. Codacy's legacy ESLint 8 engine misreads lit render
   functions, DOM Element locals and input event payloads as raw HTML. The
   void-expression rule fights the codebase's established concise event-
   handler arrows (`(checked) => host._toggleChanged(...)`). */
import { html, nothing, type TemplateResult } from 'lit';
import type {
  Simon42StrategyConfig,
  SectionKey,
  SectionOrderKey,
  WeatherPresentation,
  HeadingKey,
} from '../../types/strategy';
import { SECTION_META_BY_KEY, isSectionHiddenByConfig } from '../../sections/section-registry';
import { customSectionHasCards } from '../../sections/CustomSections';
import { localize } from '../../utils/localize';
import { getWeatherEntities, getPowerSensorEntities } from '../entity-options';
import type { StrategyEditorHost } from '../editor-host';

function updateSectionsOrder(host: StrategyEditorHost, newOrder: SectionOrderKey[]): void {
  const newConfig: Simon42StrategyConfig = {
    ...host._config,
    sections_order: newOrder,
  };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function isSectionDisabled(host: StrategyEditorHost, key: SectionOrderKey): boolean {
  // custom_cards has no toggle: its visibility derives from content
  if (key === 'custom_cards') {
    return (host._config.custom_cards || []).length === 0;
  }
  const custom = (host._config.custom_sections || []).find((cs) => cs.key === key);
  if (custom) {
    // custom sections auto-hide when they have no valid cards
    return !customSectionHasCards(custom);
  }
  return isSectionHiddenByConfig(key as SectionKey, host._config);
}

function isSectionToggleable(host: StrategyEditorHost, key: SectionOrderKey): boolean {
  return SECTION_META_BY_KEY.get(key as SectionKey)?.toggle !== undefined;
}

function toggleSectionVisibility(host: StrategyEditorHost, key: SectionOrderKey, visible: boolean): void {
  const toggle = SECTION_META_BY_KEY.get(key as SectionKey)?.toggle;
  if (toggle) {
    host._toggleChanged(toggle.flag, visible, toggle.defaultOn);
  }
}

/**
 * Persist a weather_presentation pick. Migrates off the legacy boolean:
 * sets weather_presentation explicitly and deletes the deprecated
 * `show_weather_forecast_card` field so the YAML reflects user intent.
 */
function setWeatherPresentation(host: StrategyEditorHost, presentation: WeatherPresentation): void {
  const newConfig: Simon42StrategyConfig = {
    ...host._config,
    weather_presentation: presentation,
  };
  delete newConfig.show_weather_forecast_card;
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

export function renderSectionOrderPanel(host: StrategyEditorHost): TemplateResult {
  const order = host._getSectionsOrder();
  const energyLinkDashboard = host._config.energy_link_dashboard !== false;
  const showEnergy = host._config.show_energy !== false;
  const showWeather = host._config.show_weather !== false;
  const showEnergyDistributionCard = host._config.show_energy_distribution_card !== false;
  // weather_presentation supersedes the legacy show_weather_forecast_card
  // boolean. Resolution mirrors createWeatherSection:
  //   explicit weather_presentation → use it
  //   else show_weather_forecast_card === false → 'none'
  //   else 'forecast_daily'
  const weatherPresentation: WeatherPresentation =
    host._config.weather_presentation ??
    (host._config.show_weather_forecast_card === false ? 'none' : 'forecast_daily');
  const weatherEntity = host._config.weather_entity || '';
  const weatherEntities = getWeatherEntities(host._hass);
  const hiddenHeadings = new Set(host._config.hidden_section_headings || []);
  const powerBadgeEntity = host._config.power_badge_entity || '';
  const powerSensorEntities = getPowerSensorEntities(host._hass);

  return html`
      <div class="description" style="margin-left: 0; margin-bottom: 12px;">
        ${localize('editor.section_order_desc')}
      </div>
      <div class="section-order-list" id="section-order-list">
        ${order.map((key) => {
          const meta = host._sectionDisplayMeta(key);
          if (!meta) return nothing;
          const disabled = isSectionDisabled(host, key);
          const toggleable = isSectionToggleable(host, key);
          return html`
            <div class="section-order-item ${disabled ? 'disabled' : ''}"
              data-section-key=${key}
              draggable="true"
              @dragstart=${(ev: DragEvent) => handleSectionDragStart(host, ev)}
              @dragend=${(ev: DragEvent) => handleSectionDragEnd(host, ev)}
              @dragover=${(ev: DragEvent) => handleSectionDragOver(host, ev)}
              @dragleave=${(ev: DragEvent) => handleSectionDragLeave(host, ev)}
              @drop=${(ev: DragEvent) => handleSectionDrop(host, ev)}>
              <span class="drag-handle" draggable="true">&#x2630;</span>
              <ha-icon class="section-icon" icon=${meta.icon}></ha-icon>
              <span class="section-label">${meta.label}</span>
              ${disabled && !toggleable ? html`<span class="section-hidden-tag">(${localize('editor.section_hidden')})</span>` : nothing}
              ${toggleable ? html`
                <label class="section-toggle" @mousedown=${(e: Event) => { e.stopPropagation(); }}>
                  <input type="checkbox"
                    ?checked=${!disabled}
                    @change=${(e: Event) => { toggleSectionVisibility(host, key, (e.target as HTMLInputElement).checked); }}
                    @dragstart=${(e: Event) => { e.stopPropagation(); }} />
                </label>
              ` : nothing}
            </div>
            ${key === 'weather' && showWeather ? html`
              <div class="section-order-sub" style="flex-wrap: wrap;">
                <label for="weather-presentation">${localize('editor.weather_presentation')}</label>
                <select id="weather-presentation"
                  .value=${weatherPresentation}
                  @change=${(e: Event) => setWeatherPresentation(host, (e.target as HTMLSelectElement).value as WeatherPresentation)}>
                  <option value="forecast_daily" ?selected=${weatherPresentation === 'forecast_daily'}>${localize('editor.weather_presentation_forecast_daily')}</option>
                  <option value="forecast_hourly" ?selected=${weatherPresentation === 'forecast_hourly'}>${localize('editor.weather_presentation_forecast_hourly')}</option>
                  <option value="forecast_twice_daily" ?selected=${weatherPresentation === 'forecast_twice_daily'}>${localize('editor.weather_presentation_forecast_twice_daily')}</option>
                  <option value="tile" ?selected=${weatherPresentation === 'tile'}>${localize('editor.weather_presentation_tile')}</option>
                  <option value="none" ?selected=${weatherPresentation === 'none'}>${localize('editor.weather_presentation_none')}</option>
                </select>
              </div>
            ` : nothing}
            ${key === 'weather' && showWeather && weatherEntities.length > 1 ? html`
              <div class="section-order-sub" style="flex-wrap: wrap;">
                <label for="weather-entity">${localize('editor.weather_entity')}</label>
                <select id="weather-entity"
                  .value=${weatherEntity}
                  @change=${(e: Event) => weatherEntityChanged(host, e)}>
                  <option value="" ?selected=${!weatherEntity}>${localize('editor.weather_entity_auto')}</option>
                  ${weatherEntities.map((entity) => html`
                    <option value=${entity.entity_id} ?selected=${entity.entity_id === weatherEntity}>
                      ${entity.name}
                    </option>
                  `)}
                </select>
              </div>
            ` : nothing}
            ${key === 'weather' && showWeather && hasDwdPollenflug(host) ? html`
              <div class="section-order-sub" style="flex-wrap: wrap;">
                ${host._renderCheckbox('show-pollen-card', localize('editor.show_pollen_card'), host._config.show_pollen_card === true,
                  (checked) => host._toggleChanged('show_pollen_card', checked, false))}
              </div>
              <div class="description" style="margin-left: 26px;">${localize('editor.show_pollen_card_desc')}</div>
            ` : nothing}
            ${key === 'energy' && showEnergy ? html`
              <div class="section-order-sub">
                <input type="checkbox" id="energy-link-dashboard"
                  ?checked=${energyLinkDashboard}
                  @change=${(e: Event) => { host._toggleChanged('energy_link_dashboard', (e.target as HTMLInputElement).checked, true); }} />
                <label for="energy-link-dashboard">${localize('editor.energy_link_dashboard')}</label>
              </div>
              <div class="section-order-sub">
                <input type="checkbox" id="show-energy-distribution-card"
                  ?checked=${showEnergyDistributionCard}
                  @change=${(e: Event) => { host._toggleChanged('show_energy_distribution_card', (e.target as HTMLInputElement).checked, true); }} />
                <label for="show-energy-distribution-card">${localize('editor.show_energy_distribution_card')}</label>
              </div>

              ${powerSensorEntities.length > 0 ? html`
                <div class="section-order-sub" style="display: block;">
                  <label for="power-badge-entity" style="display: block; margin-bottom: 4px;">${localize('editor.power_badge_entity')}</label>
                  <select id="power-badge-entity"
                    style="width: 100%;"
                    @change=${(e: Event) => powerBadgeEntityChanged(host, e)}>
                    <option value="" ?selected=${!powerBadgeEntity}>${localize('editor.power_badge_none')}</option>
                    ${powerSensorEntities.map((entity) => html`
                      <option value=${entity.entity_id} ?selected=${entity.entity_id === powerBadgeEntity}>
                        ${entity.name}
                      </option>
                    `)}
                  </select>
                  <div class="description">${localize('editor.power_badge_entity_desc')}</div>
                </div>
              ` : nothing}
            ` : nothing}
          `;
        })}
      </div>

      <details style="margin-top: 12px;">
        <summary style="cursor: pointer; font-size: 13px; font-weight: 500; color: var(--primary-text-color); padding: 4px 0;">
          ${localize('editor.hide_section_headings')}
        </summary>
        <div style="margin-left: 14px; margin-top: 6px;">
          <div class="description" style="margin-left: 0; margin-bottom: 8px;">
            ${localize('editor.hide_section_headings_desc')}
          </div>
          ${(['overview', 'summaries', 'favorites', 'custom_cards', 'areas', 'areas_other', 'weather', 'energy'] as const).map((hk) => html`
            <div class="form-row">
              <input type="checkbox" id="hide-heading-${hk}"
                ?checked=${hiddenHeadings.has(hk)}
                @change=${(e: Event) => { toggleHiddenHeading(host, hk, (e.target as HTMLInputElement).checked); }} />
              <label for="hide-heading-${hk}">${localize('editor.heading_label_' + hk)}</label>
            </div>
          `)}
        </div>
      </details>

      <details style="margin-top: 12px;">
        <summary style="cursor: pointer; font-size: 13px; font-weight: 500; color: var(--primary-text-color); padding: 4px 0;">
          ${localize('editor.section_visibility')}
        </summary>
        <div style="margin-left: 14px; margin-top: 6px;">
          <div class="description" style="margin-left: 0; margin-bottom: 8px;">
            ${localize('editor.section_visibility_desc')}
          </div>
          ${order.map((key) => {
            const meta = host._sectionDisplayMeta(key);
            if (!meta) return nothing;
            const rule = Reflect.get(host._config.section_visibility || {}, key) as
              { entity: string; state: string } | undefined;
            return html`
              <div style="border: 1px solid var(--divider-color); border-radius: 6px; padding: 8px; margin-bottom: 8px;">
                <div style="font-weight: 500; margin-bottom: 6px;">${meta.label}</div>
                <div class="form-row">
                  <label for="visibility-entity-${key}" style="min-width: 80px; font-size: 12px;">${localize('editor.section_visibility_entity')}</label>
                  <input type="text" id="visibility-entity-${key}" style="flex: 1;"
                    placeholder="calendar.workday_sensor"
                    .value=${rule?.entity || ''}
                    @change=${(e: Event) => sectionVisibilityChanged(host, key, 'entity', (e.target as HTMLInputElement).value)} />
                </div>
                <div class="form-row">
                  <label for="visibility-state-${key}" style="min-width: 80px; font-size: 12px;">${localize('editor.section_visibility_state')}</label>
                  <input type="text" id="visibility-state-${key}" style="flex: 1;"
                    placeholder="on"
                    .value=${rule?.state || ''}
                    @change=${(e: Event) => sectionVisibilityChanged(host, key, 'state', (e.target as HTMLInputElement).value)} />
                </div>
              </div>
            `;
          })}
        </div>
      </details>

      <div style="margin-top: 12px;">
        ${host._renderCheckbox('show-unavailable-alert-badge', localize('editor.show_unavailable_alert_badge'),
          host._config.show_unavailable_alert_badge === true,
          (checked) => host._toggleChanged('show_unavailable_alert_badge', checked, false))}
        <div class="description">${localize('editor.show_unavailable_alert_badge_desc')}</div>
        ${host._renderCheckbox('show-now-playing-badge', localize('editor.show_now_playing_badge'),
          host._config.show_now_playing_badge === true,
          (checked) => host._toggleChanged('show_now_playing_badge', checked, false))}
        <div class="description">${localize('editor.show_now_playing_badge_desc')}</div>
        ${host._renderCheckbox('show-sun-badge', localize('editor.show_sun_badge'),
          host._config.show_sun_badge === true,
          (checked) => host._toggleChanged('show_sun_badge', checked, false))}
        <div class="description">${localize('editor.show_sun_badge_desc')}</div>
        ${host._renderCheckbox('show-updates-badge', localize('editor.show_updates_badge'),
          host._config.show_updates_badge === true,
          (checked) => host._toggleChanged('show_updates_badge', checked, false))}
        <div class="description">${localize('editor.show_updates_badge_desc')}</div>
      </div>
  `;
}

function toggleHiddenHeading(host: StrategyEditorHost, key: HeadingKey, hide: boolean): void {
  const current = new Set<HeadingKey>(host._config.hidden_section_headings || []);
  if (hide) {
    current.add(key);
  } else {
    current.delete(key);
  }
  const next = [...current];
  const updated: Simon42StrategyConfig = { ...host._config };
  if (next.length === 0) {
    delete updated.hidden_section_headings;
  } else {
    updated.hidden_section_headings = next;
  }
  host._fireConfigChanged(updated);
}

function sectionVisibilityChanged(host: StrategyEditorHost, sectionKey: string, field: 'entity' | 'state', value: string): void {
  const updated: Simon42StrategyConfig = { ...host._config };
  const current = { ...(updated.section_visibility || {}) };
  const existing = Reflect.get(current, sectionKey) as { entity: string; state: string } | undefined;
  const rule = { ...(existing || { entity: '', state: '' }) };
  if (field === 'entity') rule.entity = value.trim();
  else rule.state = value.trim();
  if (!rule.entity && !rule.state) {
    Reflect.deleteProperty(current, sectionKey);
  } else {
    Reflect.set(current, sectionKey, rule);
  }
  if (Object.keys(current).length === 0) {
    delete updated.section_visibility;
  } else {
    updated.section_visibility = current;
  }
  host._fireConfigChanged(updated);
}

function handleSectionDragStart(host: StrategyEditorHost, ev: DragEvent): void {
  const dragHandle = (ev.target as HTMLElement).closest('.drag-handle');
  if (!dragHandle) { ev.preventDefault(); return; }

  const item = (ev.target as HTMLElement).closest('.section-order-item') as HTMLElement | null;
  if (!item) { ev.preventDefault(); return; }

  item.classList.add('dragging');
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/plain', item.dataset.sectionKey || '');
  }
  host._sectionDraggedElement = item;
}

function handleSectionDragEnd(host: StrategyEditorHost, ev: DragEvent): void {
  const item = (ev.target as HTMLElement).closest('.section-order-item') as HTMLElement | null;
  if (item) item.classList.remove('dragging');

  const list = host.shadowRoot?.querySelector('#section-order-list');
  if (list) {
    list.querySelectorAll('.section-order-item').forEach((el: Element) => {
      el.classList.remove('drag-over');
    });
  }
  host._sectionDraggedElement = null;
}

function handleSectionDragOver(host: StrategyEditorHost, ev: DragEvent): void {
  ev.preventDefault();
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';

  const item = ev.currentTarget as HTMLElement;
  if (item !== host._sectionDraggedElement) {
    item.classList.add('drag-over');
  }
}

function handleSectionDragLeave(host: StrategyEditorHost, ev: DragEvent): void {
  (ev.currentTarget as HTMLElement).classList.remove('drag-over');
}

function handleSectionDrop(host: StrategyEditorHost, ev: DragEvent): void {
  ev.stopPropagation();
  ev.preventDefault();

  const dropTarget = ev.currentTarget as HTMLElement;
  dropTarget.classList.remove('drag-over');

  if (!host._sectionDraggedElement || host._sectionDraggedElement === dropTarget) return;

  const draggedKey = host._sectionDraggedElement.dataset.sectionKey as SectionOrderKey | undefined;
  const dropKey = dropTarget.dataset.sectionKey as SectionOrderKey | undefined;
  if (!draggedKey || !dropKey) return;

  const currentOrder = host._getSectionsOrder();
  const draggedIndex = currentOrder.indexOf(draggedKey);
  const dropIndex = currentOrder.indexOf(dropKey);
  if (draggedIndex === -1 || dropIndex === -1) return;

  const newOrder = [...currentOrder];
  newOrder.splice(draggedIndex, 1);
  newOrder.splice(dropIndex, 0, draggedKey);

  updateSectionsOrder(host, newOrder);
}

/** DWD Pollenflug (HACS) installed? Gates the pollen card toggle. */
function hasDwdPollenflug(host: StrategyEditorHost): boolean {
  if (!host._hass) return false;
  return Object.values(host._hass.entities).some(function isPollenEntity(entity) {
    return entity.platform === 'dwd_pollenflug';
  });
}

function weatherEntityChanged(host: StrategyEditorHost, e: Event): void {
  if (!host._hass) return;

  const entityId = (e.target as HTMLSelectElement).value;
  const newConfig: Simon42StrategyConfig = {
    ...host._config,
    weather_entity: entityId,
  };

  if (!entityId || entityId === '') {
    delete newConfig.weather_entity;
  }

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function powerBadgeEntityChanged(host: StrategyEditorHost, e: Event): void {
  const entityId = (e.target as HTMLSelectElement).value;
  const newConfig: Simon42StrategyConfig = { ...host._config };
  if (entityId) {
    newConfig.power_badge_entity = entityId;
  } else {
    delete newConfig.power_badge_entity;
  }
  host._fireConfigChanged(newConfig);
}
