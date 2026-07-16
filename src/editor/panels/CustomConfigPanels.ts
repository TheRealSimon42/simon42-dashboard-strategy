// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR PANELS: CUSTOM CARDS / BADGES /
// VIEWS / SECTIONS
// ====================================================================
// The four YAML-passthrough config editors. Extracted verbatim from
// StrategyEditor.ts (module split); `as Record<string, any>` casts on
// moved lines became `Record<string, unknown>` per the CLAUDE.md
// Codacy pitfalls (assignment target is unchanged).
// ====================================================================

/* eslint-disable xss/no-mixed-html, @typescript-eslint/no-confusing-void-expression --
   False positive: lit-html's `html` tag escapes every interpolation by
   construction. Codacy's legacy ESLint 8 engine misreads lit render
   functions, DOM Element locals and input event payloads as raw HTML. The
   void-expression rule fights the codebase's established concise event-
   handler arrows (`(checked) => host._toggleChanged(...)`). */
import { html, nothing, type TemplateResult } from 'lit';
import yaml from 'js-yaml';
import type {
  Simon42StrategyConfig,
  CustomView,
  CustomCard,
  CustomBadge,
  CustomSection,
} from '../../types/strategy';
import { DEFAULT_SECTIONS_ORDER } from '../../types/strategy';
import { SECTION_META_BY_KEY } from '../../sections/section-registry';
import { localize } from '../../utils/localize';
import { getViewOptions } from './ViewVisibilityPanel';
import type { StrategyEditorHost, RefDashboardOption } from '../editor-host';

// -- Custom Cards ---------------------------------------------------------

export function renderCustomCardsSection(host: StrategyEditorHost): TemplateResult {
  const customCards = host._config.custom_cards || [];
  const customCardsHeading = host._config.custom_cards_heading || '';
  const customCardsIcon = host._config.custom_cards_icon || '';

  return html`
      <div class="custom-item-row" style="margin-bottom: 12px;">
        <input type="text" id="custom-cards-heading"
          .value=${customCardsHeading}
          placeholder=${localize('editor.custom_cards_heading_placeholder')}
          style="flex: 2;"
          @change=${(e: Event) => customCardsHeadingChanged(host, e)} />
        <input type="text" id="custom-cards-icon"
          .value=${customCardsIcon}
          placeholder="mdi:cards"
          style="flex: 1;"
          @change=${(e: Event) => customCardsIconChanged(host, e)} />
      </div>
      <div class="description" style="margin-bottom: 8px;">${localize('editor.custom_cards_desc')}</div>

      <div id="custom-cards-list">
        ${customCards.length === 0
          ? html`<div class="empty-state">${localize('editor.no_custom_cards')}</div>`
          : customCards.map((card, index) => renderCustomCardItem(host, card, index))}
      </div>

      <button class="btn-primary" style="margin-top: 8px;" @click=${() => addCustomCard(host)}>
        ${localize('editor.add_custom_card')}
      </button>
      <div class="description">${localize('editor.custom_cards_help')}</div>
  `;
}

function renderCustomCardItem(host: StrategyEditorHost, card: CustomCard, index: number): TemplateResult {
  const validationMsg = card._yaml_error
    ? html`<span style="color: var(--error-color);">&#x274C; ${card._yaml_error}</span>`
    : card.yaml
      ? html`<span style="color: var(--success-color, green);">&#x2705; ${localize('editor.yaml_valid')}</span>`
      : nothing;

  return html`
    <div class="custom-item" data-index=${index}>
      <div class="custom-item-header">
        <strong>${card.title || localize('editor.new_card')}</strong>
        <button class="btn-remove" @click=${() => removeCustomCard(host, index)}>&#x2715;</button>
      </div>
      <div class="custom-item-fields">
        <input type="text" .value=${card.title || ''} placeholder=${localize('editor.card_title_placeholder')}
          @change=${(e: Event) => updateCustomCardField(host, index, 'title', (e.target as HTMLInputElement).value)} />
        <div class="custom-card-target">
          <label>${localize('editor.target_section')}:</label>
          <select
            @change=${(e: Event) => updateCustomCardField(host, index, 'target_section', (e.target as HTMLSelectElement).value)}>
            ${[...SECTION_META_BY_KEY.entries()].map(([key, meta]) => html`
              <option value=${key} ?selected=${(card.target_section || 'custom_cards') === key}>
                ${localize(meta.labelKey)}
              </option>
            `)}
            ${host._validCustomSectionKeys().map((key) => html`
              <option value=${key} ?selected=${card.target_section === key}>
                ${host._sectionDisplayMeta(key)?.label ?? key}
              </option>
            `)}
          </select>
        </div>
        <textarea rows="6" placeholder=${localize('editor.yaml_placeholder')}
          .value=${card.yaml || ''}
          style="width: 100%;"
          @change=${(e: Event) => updateCustomCardYaml(host, index, (e.target as HTMLTextAreaElement).value)}></textarea>
        <div class="custom-item-validation">
          ${validationMsg}
        </div>
      </div>
    </div>
  `;
}

function customCardsHeadingChanged(host: StrategyEditorHost, e: Event): void {
  const value = (e.target as HTMLInputElement).value.trim();
  const newConfig: Simon42StrategyConfig = { ...host._config };
  if (value) {
    newConfig.custom_cards_heading = value;
  } else {
    delete newConfig.custom_cards_heading;
  }
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function customCardsIconChanged(host: StrategyEditorHost, e: Event): void {
  const value = (e.target as HTMLInputElement).value.trim();
  const newConfig: Simon42StrategyConfig = { ...host._config };
  if (value) {
    newConfig.custom_cards_icon = value;
  } else {
    delete newConfig.custom_cards_icon;
  }
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function addCustomCard(host: StrategyEditorHost): void {
  const customCards: CustomCard[] = [...(host._config.custom_cards || [])];
  customCards.push({ title: '', yaml: '', parsed_config: undefined } as CustomCard);

  const newConfig: Simon42StrategyConfig = { ...host._config, custom_cards: customCards };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function removeCustomCard(host: StrategyEditorHost, index: number): void {
  const customCards: CustomCard[] = [...(host._config.custom_cards || [])];
  customCards.splice(index, 1);

  const newConfig: Simon42StrategyConfig = { ...host._config };
  if (customCards.length === 0) {
    delete newConfig.custom_cards;
  } else {
    newConfig.custom_cards = customCards;
  }

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function updateCustomCardField(host: StrategyEditorHost, index: number, field: string, value: string): void {
  const customCards: CustomCard[] = [...(host._config.custom_cards || [])];
  const existing = customCards.at(index);
  if (!existing) return;

  customCards.splice(index, 1, { ...existing, [field]: value });

  const newConfig: Simon42StrategyConfig = { ...host._config, custom_cards: customCards };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function updateCustomCardYaml(host: StrategyEditorHost, index: number, yamlString: string): void {
  const customCards: CustomCard[] = [...(host._config.custom_cards || [])];
  const existing = customCards.at(index);
  if (!existing) return;

  const updated: CustomCard = { ...existing, yaml: yamlString };
  delete updated._yaml_error;

  if (yamlString.trim()) {
    try {
      // nosemgrep -- js-yaml v4 load() uses the safe schema by default; no code-executing types exist
      const parsed = yaml.load(yamlString);
      if (parsed && typeof parsed === 'object') {
        updated.parsed_config = parsed as Record<string, unknown>;
      } else {
        updated._yaml_error = 'YAML muss ein Objekt oder Array ergeben';
        updated.parsed_config = undefined;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message.split('\n')[0] : 'Ungültiges YAML';
      updated._yaml_error = message || 'Ungültiges YAML';
      updated.parsed_config = undefined;
    }
  } else {
    updated.parsed_config = undefined;
  }

  customCards.splice(index, 1, updated);

  const newConfig: Simon42StrategyConfig = { ...host._config, custom_cards: customCards };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

// -- Custom Badges ----------------------------------------------------------

export function renderCustomBadgesSection(host: StrategyEditorHost): TemplateResult {
  const customBadges = host._config.custom_badges || [];

  return html`

      <div id="custom-badges-list">
        ${customBadges.length === 0
          ? html`<div class="empty-state">${localize('editor.no_custom_badges')}</div>`
          : customBadges.map((badge, index) => renderCustomBadgeItem(host, badge, index))}
      </div>

      <button class="btn-primary" style="margin-top: 8px;" @click=${() => addCustomBadge(host)}>
        ${localize('editor.add_custom_badge')}
      </button>
      <div class="description">${localize('editor.custom_badges_help')}</div>
  `;
}

function renderCustomBadgeItem(host: StrategyEditorHost, badge: CustomBadge, index: number): TemplateResult {
  const validationMsg = badge._yaml_error
    ? html`<span style="color: var(--error-color);">&#x274C; ${badge._yaml_error}</span>`
    : badge.yaml
      ? html`<span style="color: var(--success-color, green);">&#x2705; ${localize('editor.yaml_valid')}</span>`
      : nothing;

  return html`
    <div class="custom-item" data-index=${index}>
      <div class="custom-item-header">
        <strong>Badge ${index + 1}</strong>
        <button class="btn-remove" @click=${() => removeCustomBadge(host, index)}>&#x2715;</button>
      </div>
      <textarea rows="4" placeholder="type: entity&#10;entity: sun.sun"
        .value=${badge.yaml || ''}
        style="width: 100%;"
        @change=${(e: Event) => updateCustomBadgeYaml(host, index, (e.target as HTMLTextAreaElement).value)}></textarea>
      <div class="custom-item-validation">
        ${validationMsg}
      </div>
    </div>
  `;
}

function addCustomBadge(host: StrategyEditorHost): void {
  const customBadges: CustomBadge[] = [...(host._config.custom_badges || [])];
  customBadges.push({ yaml: '', parsed_config: undefined } as CustomBadge);

  const newConfig: Simon42StrategyConfig = { ...host._config, custom_badges: customBadges };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function removeCustomBadge(host: StrategyEditorHost, index: number): void {
  const customBadges: CustomBadge[] = [...(host._config.custom_badges || [])];
  customBadges.splice(index, 1);

  const newConfig: Simon42StrategyConfig = { ...host._config };
  if (customBadges.length === 0) {
    delete newConfig.custom_badges;
  } else {
    newConfig.custom_badges = customBadges;
  }

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function updateCustomBadgeYaml(host: StrategyEditorHost, index: number, yamlString: string): void {
  const customBadges: CustomBadge[] = [...(host._config.custom_badges || [])];
  const existing = customBadges.at(index);
  if (!existing) return;

  const updated: CustomBadge = { ...existing, yaml: yamlString };
  delete updated._yaml_error;

  if (yamlString.trim()) {
    try {
      // nosemgrep -- js-yaml v4 load() uses the safe schema by default; no code-executing types exist
      const parsed = yaml.load(yamlString);
      if (parsed && typeof parsed === 'object') {
        updated.parsed_config = parsed as Record<string, unknown>;
      } else {
        updated._yaml_error = 'YAML muss ein Objekt ergeben';
        updated.parsed_config = undefined;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message.split('\n')[0] : 'Ungültiges YAML';
      updated._yaml_error = message || 'Ungültiges YAML';
      updated.parsed_config = undefined;
    }
  } else {
    updated.parsed_config = undefined;
  }

  customBadges.splice(index, 1, updated);

  const newConfig: Simon42StrategyConfig = { ...host._config, custom_badges: customBadges };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

// -- Custom Views -------------------------------------------------------------

/**
 * Editor discriminator for reference views (#169): the presence of the
 * `ref_dashboard` key marks the item as reference mode — even while the
 * value is still empty (freshly added, nothing selected yet).
 */
function isRefViewItem(view: CustomView): boolean {
  return view.ref_dashboard !== undefined;
}

/** View paths generated by the strategy itself — not usable for custom views. */
const RESERVED_VIEW_PATHS = new Set([
  'home', 'lights', 'covers', 'security', 'batteries', 'climate', 'maintenance', 'cameras',
]);

export function renderCustomViewsSection(host: StrategyEditorHost): TemplateResult {
  const customViews = host._config.custom_views || [];

  return html`

      <div id="custom-views-list">
        ${customViews.length === 0
          ? html`<div class="empty-state">${localize('editor.no_custom_views')}</div>`
          : customViews.map((view, index) => renderCustomViewItem(host, view, index))}
      </div>

      <div class="custom-item-row" style="margin-top: 8px;">
        <button class="btn-primary" @click=${() => addCustomView(host)}>
          ${localize('editor.add_custom_view')}
          <ha-icon icon="mdi:code-braces" style="--mdc-icon-size: 16px;"></ha-icon>
        </button>
        <button class="btn-primary" @click=${() => addCustomRefView(host)}>
          ${localize('editor.add_custom_view_ref')}
          <ha-icon icon="mdi:link-variant" style="--mdc-icon-size: 16px;"></ha-icon>
        </button>
      </div>
      <div class="description">${localize('editor.custom_views_help')}</div>
      <div class="description">${localize('editor.custom_views_ref_help')}</div>
  `;
}

function renderCustomViewItem(host: StrategyEditorHost, view: CustomView, index: number): TemplateResult {
  return html`
    <div class="custom-item" data-index=${index}>
      <div class="custom-item-header">
        <strong>${view.title || localize('editor.new_view')}</strong>
        <button class="btn-remove" @click=${() => removeCustomView(host, index)}>&#x2715;</button>
      </div>
      <div class="custom-item-fields">
        <div class="custom-item-row">
          <input type="text" .value=${view.title || ''} placeholder=${localize('editor.title_placeholder')}
            style="flex: 2;"
            @change=${(e: Event) => updateCustomViewField(host, index, 'title', (e.target as HTMLInputElement).value)} />
          <input type="text" .value=${view.path || ''} placeholder=${localize('editor.path_placeholder')}
            style="flex: 2;"
            @change=${(e: Event) => updateCustomViewField(host, index, 'path', (e.target as HTMLInputElement).value)} />
          <input type="text" .value=${view.icon || ''} placeholder="mdi:star"
            style="flex: 1;"
            @change=${(e: Event) => updateCustomViewField(host, index, 'icon', (e.target as HTMLInputElement).value)} />
        </div>
        ${renderCustomViewPositionRow(host, view, index)}
        ${isRefViewItem(view)
          ? renderCustomViewRefFields(host, view, index)
          : renderCustomViewYamlFields(host, view, index)}
      </div>
    </div>
  `;
}

/**
 * Position anchor (#377): dropdown of all generated views (in tab order)
 * after which this custom view is inserted. Default: end of the tab bar.
 */
function renderCustomViewPositionRow(host: StrategyEditorHost, view: CustomView, index: number): TemplateResult {
  const options = getViewOptions(host).filter((option) => option.key !== view.path);
  // Stored anchor no longer exists (renamed room/view): keep it
  // selectable-but-marked instead of silently snapping to the end.
  const orphaned = !!view.after_view && !options.some((option) => option.key === view.after_view);

  return html`
    <div class="custom-item-row">
      <select style="flex: 1;"
        @change=${(e: Event) => updateCustomViewAfterView(host, index, (e.target as HTMLSelectElement).value)}>
        <option value="" ?selected=${!view.after_view}>${localize('editor.custom_view_position_end')}</option>
        ${orphaned
          ? html`<option value=${view.after_view || ''} selected>&#x26A0; ${localize('editor.custom_view_position_after')} ${view.after_view}</option>`
          : nothing}
        ${options.map((option) => html`
          <option value=${option.key} ?selected=${view.after_view === option.key}>
            ${localize('editor.custom_view_position_after')} ${option.title}
          </option>`)}
      </select>
    </div>
  `;
}

function updateCustomViewAfterView(host: StrategyEditorHost, index: number, value: string): void {
  const customViews: CustomView[] = [...(host._config.custom_views || [])];
  const existing = customViews.at(index);
  if (!existing) return;

  const next: CustomView = { ...existing };
  if (value) next.after_view = value;
  else delete next.after_view;
  customViews.splice(index, 1, next);

  const newConfig: Simon42StrategyConfig = { ...host._config, custom_views: customViews };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function renderCustomViewYamlFields(host: StrategyEditorHost, view: CustomView, index: number): TemplateResult {
  const validationMsg = view._yaml_error
    ? html`<span style="color: var(--error-color);">&#x274C; ${view._yaml_error}</span>`
    : view.yaml
      ? html`<span style="color: var(--success-color, green);">&#x2705; ${localize('editor.yaml_valid')}</span>`
      : nothing;

  return html`
    <textarea rows="8" placeholder=${localize('editor.yaml_placeholder')}
      .value=${view.yaml || ''}
      style="width: 100%;"
      @change=${(e: Event) => updateCustomViewYaml(host, index, (e.target as HTMLTextAreaElement).value)}></textarea>
    <div class="custom-item-validation">
      ${validationMsg}
    </div>
  `;
}

function renderCustomViewRefFields(host: StrategyEditorHost, view: CustomView, index: number): TemplateResult {
  if (host._refDashboards === null) {
    void loadRefDashboards(host);
    return html`<div class="description">${localize('editor.ref_loading')}</div>`;
  }

  const dashboards = host._refDashboards;
  if (dashboards.length === 0) {
    return html`<div class="custom-item-validation">
      <span style="color: var(--error-color);">&#x274C; ${localize('editor.ref_no_dashboards')}</span>
    </div>`;
  }

  const selected = dashboards.find((d) => d.url_path === view.ref_dashboard);
  // Stored reference points to a dashboard that no longer exists (or became
  // strategy-generated): keep it selectable-but-marked instead of silently
  // snapping to another dashboard.
  const orphaned = !!view.ref_dashboard && !selected;

  return html`
    <div class="custom-item-row">
      <select style="flex: 1;"
        @change=${(e: Event) => refDashboardChanged(host, index, (e.target as HTMLSelectElement).value)}>
        <option value="" ?selected=${!view.ref_dashboard} disabled>${localize('editor.ref_select_dashboard')}</option>
        ${orphaned
          ? html`<option value=${view.ref_dashboard || ''} selected>&#x26A0; ${view.ref_dashboard}</option>`
          : nothing}
        ${dashboards.map((d) => html`
          <option value=${d.url_path} ?selected=${d.url_path === view.ref_dashboard}>${d.title}</option>
        `)}
      </select>
      <select style="flex: 1;" ?disabled=${!selected}
        @change=${(e: Event) => refViewChanged(host, index, (e.target as HTMLSelectElement).value)}>
        <option value="" ?selected=${!view.ref_view} disabled>${localize('editor.ref_select_view')}</option>
        ${(selected?.views || []).map((v) => {
          const value = v.path ?? String(v.index);
          const label = `${v.title || `${localize('editor.ref_view_untitled')} ${v.index + 1}`}${v.path ? ` (${v.path})` : ''}`;
          return html`<option value=${value} ?selected=${value === view.ref_view}>${label}</option>`;
        })}
      </select>
    </div>
    <div class="custom-item-validation">
      ${orphaned
        ? html`<span style="color: var(--error-color);">&#x274C; ${localize('editor.ref_dashboard_missing')}</span>`
        : view.ref_dashboard && view.ref_view
          ? html`<span style="color: var(--success-color, green);">&#x2705; ${localize('editor.ref_valid')}</span>`
          : html`<span>${localize('editor.ref_incomplete')}</span>`}
    </div>
  `;
}

/**
 * Load the referenceable dashboards once per editor session: the dashboard
 * list plus each dashboard's stored config (for its views). Strategy
 * dashboards are filtered out — `lovelace/config` returns their stored
 * config (`{strategy: ...}`, no views), so referencing them can never work
 * (this also rules out referencing the simon42 dashboard itself).
 */
async function loadRefDashboards(host: StrategyEditorHost): Promise<void> {
  const hass = host._hass;
  if (host._refDashboardsLoading || !hass) return;
  host._refDashboardsLoading = true;

  const options: RefDashboardOption[] = [];
  try {
    const list = await hass.callWS<Array<{ url_path: string; title: string }>>({
      type: 'lovelace/dashboards/list',
    });
    const candidates = [
      { url_path: 'lovelace', title: localize('editor.ref_default_dashboard') },
      // Some HA versions include the default dashboard in the list — dedupe
      ...list
        .filter((d) => d.url_path && d.url_path !== 'lovelace')
        .map((d) => ({ url_path: d.url_path, title: d.title })),
    ];
    await Promise.all(
      candidates.map(async (candidate) => {
        try {
          const config = await hass.callWS<{ views?: Array<Record<string, unknown>>; strategy?: unknown }>({
            type: 'lovelace/config',
            url_path: candidate.url_path === 'lovelace' ? null : candidate.url_path,
          });
          if (config.strategy) return;
          const views = (config.views || []).map((v, index) => ({
            path: typeof v.path === 'string' ? v.path : undefined,
            title: typeof v.title === 'string' ? v.title : undefined,
            icon: typeof v.icon === 'string' ? v.icon : undefined,
            index,
          }));
          if (views.length > 0) options.push({ url_path: candidate.url_path, title: candidate.title, views });
        } catch (error: unknown) {
          // Dashboard without stored config (auto-generated default) or no
          // access — simply not referenceable, skip silently.
          void error;
        }
      })
    );
    // Promise.all fills `options` in completion order — sort for a stable dropdown
    options.sort((a, b) => a.title.localeCompare(b.title));
  } catch (error: unknown) {
    void error;
  }

  host._refDashboards = options;
  host._refDashboardsLoading = false;
  host.requestUpdate();
}

/** All view paths already taken: generated views, areas, other custom views. */
function takenViewPaths(host: StrategyEditorHost, excludeIndex: number): Set<string> {
  const taken = new Set<string>(RESERVED_VIEW_PATHS);
  for (const areaId of Object.keys(host._hass?.areas || {})) taken.add(areaId);
  (host._config.custom_views || []).forEach((cv, i) => {
    if (i !== excludeIndex && cv.path) taken.add(cv.path);
  });
  return taken;
}

/** Make a view path unique by suffixing `-ref`, `-ref2`, ... on conflicts. */
function uniquifyViewPath(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let candidate = `${base}-ref`;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${base}-ref${n}`;
    n++;
  }
  return candidate;
}

function addCustomView(host: StrategyEditorHost): void {
  const customViews: CustomView[] = [...(host._config.custom_views || [])];
  customViews.push({
    title: 'Neue View',
    path: `custom-view-${customViews.length + 1}`,
    icon: 'mdi:card-text-outline',
    yaml: '',
    parsed_config: undefined,
  } as CustomView);

  const newConfig: Simon42StrategyConfig = { ...host._config, custom_views: customViews };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function addCustomRefView(host: StrategyEditorHost): void {
  const customViews: CustomView[] = [...(host._config.custom_views || [])];
  customViews.push({
    title: '',
    path: '',
    icon: '',
    ref_dashboard: '',
    ref_view: '',
  });

  const newConfig: Simon42StrategyConfig = { ...host._config, custom_views: customViews };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
  void loadRefDashboards(host);
}

function refDashboardChanged(host: StrategyEditorHost, index: number, urlPath: string): void {
  const customViews: CustomView[] = [...(host._config.custom_views || [])];
  const existing = customViews.at(index);
  if (!existing) return;

  // Changing the dashboard invalidates the view selection
  customViews.splice(index, 1, { ...existing, ref_dashboard: urlPath, ref_view: '' });

  const newConfig: Simon42StrategyConfig = { ...host._config, custom_views: customViews };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function refViewChanged(host: StrategyEditorHost, index: number, refView: string): void {
  const customViews: CustomView[] = [...(host._config.custom_views || [])];
  const existing = customViews.at(index);
  if (!existing) return;

  const dashboard = (host._refDashboards || []).find((d) => d.url_path === existing.ref_dashboard);
  const sourceView = (dashboard?.views || []).find((v) => (v.path ?? String(v.index)) === refView);

  // Auto-fill title/path/icon from the source view; only fill fields the
  // user hasn't set yet so a re-selection doesn't clobber manual edits.
  const updated: CustomView = { ...existing, ref_view: refView };
  if (!updated.title && sourceView?.title) updated.title = sourceView.title;
  if (!updated.title) updated.title = localize('editor.new_view');
  if (!updated.icon) updated.icon = sourceView?.icon || 'mdi:link-variant';
  if (!updated.path) {
    const base = sourceView?.path || `custom-view-${index + 1}`;
    updated.path = uniquifyViewPath(base, takenViewPaths(host, index));
  }

  customViews.splice(index, 1, updated);

  const newConfig: Simon42StrategyConfig = { ...host._config, custom_views: customViews };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

export function removeCustomView(host: StrategyEditorHost, index: number): void {
  const customViews: CustomView[] = [...(host._config.custom_views || [])];
  const removed = customViews.at(index);
  if (!removed) return;
  customViews.splice(index, 1);

  const newConfig: Simon42StrategyConfig = { ...host._config };
  if (customViews.length === 0) {
    delete newConfig.custom_views;
  } else {
    newConfig.custom_views = customViews;
  }
  if (removed.path && Object.hasOwn(newConfig.view_visible_users || {}, removed.path)) {
    const nextVisibility = { ...(newConfig.view_visible_users || {}) };
    Reflect.deleteProperty(nextVisibility, removed.path);
    if (Object.keys(nextVisibility).length === 0) delete newConfig.view_visible_users;
    else newConfig.view_visible_users = nextVisibility;
  }

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

export function updateCustomViewField(host: StrategyEditorHost, index: number, field: string, value: string): void {
  const customViews: CustomView[] = [...(host._config.custom_views || [])];
  const existing = customViews.at(index);
  if (!existing) return;

  customViews.splice(index, 1, { ...existing, [field]: value });

  const newConfig: Simon42StrategyConfig = { ...host._config, custom_views: customViews };
  if (field === 'path' && existing.path && existing.path !== value
      && Object.hasOwn(newConfig.view_visible_users || {}, existing.path)) {
    const nextVisibility = { ...(newConfig.view_visible_users || {}) };
    const users = Reflect.get(nextVisibility, existing.path) as string[];
    Reflect.deleteProperty(nextVisibility, existing.path);
    if (value) Reflect.set(nextVisibility, value, users);
    if (Object.keys(nextVisibility).length === 0) delete newConfig.view_visible_users;
    else newConfig.view_visible_users = nextVisibility;
  }
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function updateCustomViewYaml(host: StrategyEditorHost, index: number, yamlString: string): void {
  const customViews: CustomView[] = [...(host._config.custom_views || [])];
  const existing = customViews.at(index);
  if (!existing) return;

  const updated: CustomView = { ...existing, yaml: yamlString };
  delete updated._yaml_error;

  if (yamlString.trim()) {
    try {
      // nosemgrep -- js-yaml v4 load() uses the safe schema by default; no code-executing types exist
      const parsed = yaml.load(yamlString);
      if (parsed && typeof parsed === 'object') {
        updated.parsed_config = parsed as Record<string, unknown>;
      } else {
        updated._yaml_error = 'YAML muss ein Objekt ergeben';
        updated.parsed_config = undefined;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message.split('\n')[0] : 'Ungültiges YAML';
      updated._yaml_error = message || 'Ungültiges YAML';
      updated.parsed_config = undefined;
    }
  } else {
    updated.parsed_config = undefined;
  }

  customViews.splice(index, 1, updated);

  const newConfig: Simon42StrategyConfig = { ...host._config, custom_views: customViews };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

// -- Custom Sections -----------------------------------------------------------

export function renderCustomSectionsSection(host: StrategyEditorHost): TemplateResult {
  const customSections = host._config.custom_sections || [];

  return html`
      <div class="description" style="margin-bottom: 8px;">${localize('editor.custom_sections_desc')}</div>

      <div id="custom-sections-list">
        ${customSections.length === 0
          ? html`<div class="empty-state">${localize('editor.no_custom_sections')}</div>`
          : customSections.map((section, index) => renderCustomSectionItem(host, section, index))}
      </div>

      <button class="btn-primary" style="margin-top: 8px;" @click=${() => addCustomSection(host)}>
        ${localize('editor.add_custom_section')}
      </button>
      <div class="description">${localize('editor.custom_sections_help')}</div>
  `;
}

function renderCustomSectionItem(host: StrategyEditorHost, section: CustomSection, index: number): TemplateResult {
  const keyError = customSectionKeyError(host, section.key || '', index);
  const yamlMsg = section._yaml_error
    ? html`<span style="color: var(--error-color);">&#x274C; ${section._yaml_error}</span>`
    : section.yaml
      ? html`<span style="color: var(--success-color, green);">&#x2705; ${localize('editor.yaml_valid')}</span>`
      : nothing;

  return html`
    <div class="custom-item" data-index=${index}>
      <div class="custom-item-header">
        <strong>${section.heading || section.key || localize('editor.new_section')}</strong>
        <button class="btn-remove" @click=${() => removeCustomSection(host, index)}>&#x2715;</button>
      </div>
      <div class="custom-item-fields">
        <div class="custom-item-row">
          <input type="text" .value=${section.key || ''}
            placeholder=${localize('editor.custom_section_key_placeholder')}
            style="flex: 1;"
            @change=${(e: Event) => updateCustomSectionField(host, index, 'key', (e.target as HTMLInputElement).value.trim())} />
        </div>
        ${keyError
          ? html`<div class="custom-item-validation"><span style="color: var(--error-color);">&#x274C; ${keyError}</span></div>`
          : nothing}
        <textarea rows="8" placeholder=${localize('editor.custom_section_yaml_placeholder')}
          .value=${section.yaml || ''}
          style="width: 100%;"
          @change=${(e: Event) => updateCustomSectionYaml(host, index, (e.target as HTMLTextAreaElement).value)}></textarea>
        <div class="custom-item-validation">
          ${yamlMsg}
        </div>
      </div>
    </div>
  `;
}

/** Inline validation for a custom section's key field. */
function customSectionKeyError(host: StrategyEditorHost, key: string, index: number): string | null {
  if (!key || key.trim() === '') return localize('editor.custom_section_key_required');
  if ((DEFAULT_SECTIONS_ORDER as string[]).includes(key)) {
    return localize('editor.custom_section_key_conflict');
  }
  const sections = host._config.custom_sections || [];
  if (sections.some((s, i) => i !== index && s.key === key)) {
    return localize('editor.custom_section_key_duplicate');
  }
  return null;
}

function addCustomSection(host: StrategyEditorHost): void {
  const sections: CustomSection[] = [...(host._config.custom_sections || [])];
  sections.push({ key: '', yaml: '', parsed_config: undefined } as CustomSection);

  const newConfig: Simon42StrategyConfig = { ...host._config, custom_sections: sections };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

export function removeCustomSection(host: StrategyEditorHost, index: number): void {
  const sections: CustomSection[] = [...(host._config.custom_sections || [])];
  const removedKey = sections.at(index)?.key;
  sections.splice(index, 1);

  const newConfig: Simon42StrategyConfig = { ...host._config };
  if (sections.length === 0) {
    delete newConfig.custom_sections;
  } else {
    newConfig.custom_sections = sections;
  }
  // Drop the removed key from a persisted sections_order so it doesn't
  // linger as an invalid entry in the config
  if (removedKey && newConfig.sections_order?.includes(removedKey)) {
    newConfig.sections_order = newConfig.sections_order.filter((k) => k !== removedKey);
  }
  // Same for a per-user visibility rule keyed by the removed section
  if (removedKey && Object.hasOwn(newConfig.section_visible_users || {}, removedKey)) {
    const nextVisibility = { ...(newConfig.section_visible_users || {}) };
    Reflect.deleteProperty(nextVisibility, removedKey);
    if (Object.keys(nextVisibility).length === 0) delete newConfig.section_visible_users;
    else newConfig.section_visible_users = nextVisibility;
  }

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

export function updateCustomSectionField(host: StrategyEditorHost, index: number, field: 'key', value: string): void {
  const sections: CustomSection[] = [...(host._config.custom_sections || [])];
  const existing = sections.at(index);
  if (!existing) return;
  const previousKey = existing.key;
  sections.splice(index, 1, { ...existing, [field]: value });

  const newConfig: Simon42StrategyConfig = { ...host._config, custom_sections: sections };
  // Key rename: keep a persisted sections_order position and re-targeted
  // custom cards in sync instead of silently orphaning them
  if (previousKey && previousKey !== value) {
    if (newConfig.sections_order?.includes(previousKey)) {
      newConfig.sections_order = newConfig.sections_order.map((k) => (k === previousKey ? value : k));
    }
    if (newConfig.custom_cards?.some((c) => c.target_section === previousKey)) {
      newConfig.custom_cards = newConfig.custom_cards.map((c) =>
        c.target_section === previousKey ? { ...c, target_section: value } : c
      );
    }
    // Move a per-user visibility rule along with the renamed key
    if (Object.hasOwn(newConfig.section_visible_users || {}, previousKey)) {
      const nextVisibility = { ...(newConfig.section_visible_users || {}) };
      const users = Reflect.get(nextVisibility, previousKey) as string[];
      Reflect.deleteProperty(nextVisibility, previousKey);
      if (value) Reflect.set(nextVisibility, value, users);
      if (Object.keys(nextVisibility).length === 0) delete newConfig.section_visible_users;
      else newConfig.section_visible_users = nextVisibility;
    }
  }

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function updateCustomSectionYaml(host: StrategyEditorHost, index: number, yamlString: string): void {
  const sections: CustomSection[] = [...(host._config.custom_sections || [])];
  const existing = sections.at(index);
  if (!existing) return;

  const updated: CustomSection = { ...existing, yaml: yamlString };
  delete updated._yaml_error;

  if (yamlString.trim()) {
    try {
      // nosemgrep -- js-yaml v4 load() uses the safe schema by default; no code-executing types exist
      const parsed = yaml.load(yamlString);
      if (parsed && typeof parsed === 'object') {
        // complete section, single card or card list — normalized at build time
        updated.parsed_config = parsed;
      } else {
        updated._yaml_error = localize('editor.custom_section_yaml_invalid');
        updated.parsed_config = undefined;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message.split('\n')[0] : 'Ungültiges YAML';
      updated._yaml_error = message || 'Ungültiges YAML';
      updated.parsed_config = undefined;
    }
  } else {
    updated.parsed_config = undefined;
  }

  sections.splice(index, 1, updated);

  const newConfig: Simon42StrategyConfig = { ...host._config, custom_sections: sections };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}
