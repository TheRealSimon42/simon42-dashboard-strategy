import { html, type TemplateResult } from 'lit';

import { getVisibleAreasFromHass } from '../../utils/name-utils';
import { localize } from '../../utils/localize';
import { getViewVisibleUsers, getSectionVisibleUsers } from '../../utils/view-visibility';
import { isUtilityViewEnabled } from '../../utils/summary-view-utils';
import { applyViewsOrder, OVERVIEW_VIEW_PATH } from '../../utils/view-order';
import { insertCustomViews } from '../../utils/custom-view-ref';
import type { LovelaceViewConfig } from '../../types/lovelace';
import type { HomeAssistant } from '../../types/homeassistant';
import { SECTION_REGISTRY, isSectionHiddenByConfig } from '../../sections/section-registry';
import type { Simon42StrategyConfig } from '../../types/strategy';
import type { StrategyEditorHost } from '../editor-host';

/* eslint-disable xss/no-mixed-html, @typescript-eslint/no-confusing-void-expression --
   lit-html escapes interpolations; concise checkbox handlers are the editor convention. */

export interface RuleOption {
  /** Rule key: view path (view_visible_users) or section key (section_visible_users) */
  key: string;
  title: string;
}

interface UserOption {
  userId: string;
  name: string;
}

export function renderViewVisibilitySection(host: StrategyEditorHost): TemplateResult {
  if (!host._hass) return html``;
  const users = getUserOptions(host);
  const views = getViewOptions(host);
  const sections = getSectionOptions(host);

  return html`
    <div class="description" style="margin-left: 0;">
      ${localize('editor.view_visibility_desc')}
    </div>
    <div class="description" style="margin-left: 0; color: var(--error-color, #db4437); font-weight: 500;">
      &#9888;&#65039; ${localize('editor.view_visibility_warning')}
    </div>
    <div class="description" style="margin-left: 0; color: var(--warning-color, #ffa600); font-weight: 500;">
      &#9888;&#65039; ${localize('editor.view_visibility_no_person_warning')}
    </div>
    <div class="description" style="margin-left: 0;">
      ${localize('editor.view_visibility_reload_hint')}
    </div>
    ${
      users.length === 0
        ? html`<div class="description" style="margin-left: 0;">${localize('editor.view_visibility_no_users')}</div>`
        : html`
          <div class="option-group-title" style="margin-top: 8px;">
            <ha-icon icon="mdi:tab"></ha-icon>
            ${localize('editor.view_visibility_views_title')}
          </div>
          ${views.map((view) => renderRuleUsers(host, view, users, 'view'))}
          <div class="option-group-title" style="margin-top: 16px;">
            <ha-icon icon="mdi:view-grid-outline"></ha-icon>
            ${localize('editor.view_visibility_sections_title')}
          </div>
          <div class="description" style="margin-left: 0;">
            ${localize('editor.view_visibility_sections_desc')}
          </div>
          ${sections.map((section) => renderRuleUsers(host, section, users, 'section'))}
        `
    }
  `;
}

function getUserOptions(host: StrategyEditorHost): UserOption[] {
  if (!host._hass) return [];
  const options: UserOption[] = [];
  for (const [entityId, state] of Object.entries(host._hass.states)) {
    if (!entityId.startsWith('person.')) continue;
    const userId = state.attributes.user_id as string | undefined;
    if (!userId) continue;
    options.push({
      userId,
      name: (state.attributes.friendly_name as string | undefined) || entityId,
    });
  }
  return options.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * All views the strategy currently generates (path + display title), in tab
 * order. Also reused by the custom-views panel as anchor targets for
 * `after_view` (#377) and by the views order panel — the list mirrors
 * exactly what generate() emits: custom views honor their `after_view`
 * anchor, and the user-defined `views_order` is applied last.
 */
export function getViewOptions(host: StrategyEditorHost): RuleOption[] {
  if (!host._hass) return [];
  return buildViewOptions(host._hass, host._config);
}

/** Host-independent core of getViewOptions (also used for the default order). */
export function buildViewOptions(hass: HomeAssistant, config: Simon42StrategyConfig): RuleOption[] {
  const views: RuleOption[] = [{ key: OVERVIEW_VIEW_PATH, title: localize('views.overview') }];
  function add(enabled: boolean, key: string, titleKey: string): void {
    if (enabled) views.push({ key, title: localize(titleKey) });
  }

  add(isUtilityViewEnabled(config, 'lights'), 'lights', 'views.lights');
  add(isUtilityViewEnabled(config, 'covers'), 'covers', 'views.covers');
  add(isUtilityViewEnabled(config, 'security'), 'security', 'views.security');
  add(isUtilityViewEnabled(config, 'batteries'), 'batteries', 'views.batteries');
  add(isUtilityViewEnabled(config, 'climate'), 'climate', 'views.climate');
  add(config.show_maintenance_summary === true, 'maintenance', 'views.maintenance');
  add(config.show_camera_view === true, 'cameras', 'views.cameras');

  const roomVisibility = config.room_visibility || {};
  const areas = getVisibleAreasFromHass(hass, config.areas_display, config.use_default_area_sort).filter((area) => {
    const rule = Reflect.get(roomVisibility, area.area_id) as { entity?: string; state?: string } | undefined;
    if (!rule || !rule.entity) return true;
    const st = Reflect.get(hass.states as Record<string, unknown>, rule.entity) as { state?: string } | undefined;
    return st?.state === rule.state;
  });
  for (const area of areas) views.push({ key: area.area_id, title: area.name });

  // Same placement as generate(): after_view anchor, otherwise appended.
  const customViews = (config.custom_views || []).filter(function isComplete(view) {
    return !!(view.parsed_config || (view.ref_dashboard && view.ref_view)) && !!view.title && !!view.path;
  });
  const placed: LovelaceViewConfig[] = views.map(function toView(option) {
    return { path: option.key, title: option.title };
  });
  insertCustomViews(
    placed,
    customViews,
    customViews.map(function toView(view) {
      return { path: view.path, title: view.title };
    })
  );

  return applyViewsOrder(placed, config.views_order, (view) => view.path).map(function toOption(view) {
    return { key: view.path || '', title: view.title || '' };
  });
}

/**
 * Overview sections offered for per-user rules: all registry sections
 * currently enabled by their toggle, plus the user's custom sections.
 * Skips 'overview' (clock/summaries hub — hiding it per user belongs to
 * the individual tiles) — but keeps everything else, incl. weather/energy.
 */
function getSectionOptions(host: StrategyEditorHost): RuleOption[] {
  const config = host._config;
  const sections: RuleOption[] = [];
  for (const meta of SECTION_REGISTRY) {
    if (meta.key === 'overview' || meta.key === 'custom_cards') continue;
    if (isSectionHiddenByConfig(meta.key, config)) continue;
    sections.push({ key: meta.key, title: localize(meta.labelKey) });
  }
  for (const section of config.custom_sections || []) {
    if (typeof section.key === 'string' && section.key.trim() !== '') {
      sections.push({ key: section.key, title: section.heading || section.key });
    }
  }
  return sections;
}

function renderRuleUsers(
  host: StrategyEditorHost,
  option: RuleOption,
  users: UserOption[],
  kind: 'view' | 'section'
): TemplateResult {
  const configured =
    kind === 'view' ? getViewVisibleUsers(host._config, option.key) : getSectionVisibleUsers(host._config, option.key);
  const selected = configured === undefined ? users.map((user) => user.userId) : configured;

  return html`
    <div class="option-group">
      <div class="option-group-title">
        <ha-icon icon=${kind === 'view' ? 'mdi:tab' : 'mdi:view-grid-outline'}></ha-icon>
        ${option.title} <span class="entity-id">${kind === 'view' ? `/${option.key}` : option.key}</span>
      </div>
      ${users.map((user) =>
        host._renderCheckbox(
          `${kind}-${option.key}-user-${user.userId}`,
          user.name,
          selected.includes(user.userId),
          (checked) => {
            ruleUserChanged(
              host,
              kind,
              option.key,
              user.userId,
              users.map((o) => o.userId),
              checked
            );
          }
        )
      )}
    </div>
  `;
}

/**
 * Shared checkbox handler for both rule maps. "All known users checked and
 * no unknown ids" = no restriction → the rule is removed entirely; anything
 * else writes the explicit allow-list (unknown ids — users without person
 * entity, set via YAML — are preserved).
 */
export function ruleUserChanged(
  host: StrategyEditorHost,
  kind: 'view' | 'section',
  key: string,
  userId: string,
  knownUserIds: string[],
  checked: boolean
): void {
  const currentMap = (kind === 'view' ? host._config.view_visible_users : host._config.section_visible_users) || {};
  const hasRule = Object.hasOwn(currentMap, key);
  const configured =
    kind === 'view' ? getViewVisibleUsers(host._config, key) : getSectionVisibleUsers(host._config, key);
  const effective = new Set(hasRule || configured !== undefined ? configured || [] : knownUserIds);
  if (checked) effective.add(userId);
  else effective.delete(userId);

  const known = knownUserIds.filter((id) => effective.has(id));
  const unknown = [...effective].filter((id) => !knownUserIds.includes(id));
  const nextMap = { ...currentMap };
  if (unknown.length === 0 && known.length === knownUserIds.length) {
    Reflect.deleteProperty(nextMap, key);
  } else {
    Reflect.set(nextMap, key, [...known, ...unknown]);
  }

  const updated: Simon42StrategyConfig = { ...host._config };
  if (kind === 'view') {
    if (key === 'maintenance') delete updated.maintenance_visible_users;
    if (Object.keys(nextMap).length === 0) delete updated.view_visible_users;
    else updated.view_visible_users = nextMap;
  } else if (Object.keys(nextMap).length === 0) {
    delete updated.section_visible_users;
  } else {
    updated.section_visible_users = nextMap;
  }
  host._fireConfigChanged(updated);
}

/** Backwards-compatible wrapper (kept for the existing unit tests / callers). */
export function viewUserChanged(
  host: StrategyEditorHost,
  path: string,
  userId: string,
  knownUserIds: string[],
  checked: boolean
): void {
  ruleUserChanged(host, 'view', path, userId, knownUserIds, checked);
}
