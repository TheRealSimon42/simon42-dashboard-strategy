import { html, type TemplateResult } from 'lit';

import { getVisibleAreasFromHass } from '../../utils/name-utils';
import { localize } from '../../utils/localize';
import { getViewVisibleUsers, getSectionVisibleUsers } from '../../utils/view-visibility';
import { SECTION_REGISTRY, isSectionHiddenByConfig } from '../../sections/section-registry';
import type { Simon42StrategyConfig } from '../../types/strategy';
import type { StrategyEditorHost } from '../editor-host';

/* eslint-disable xss/no-mixed-html, @typescript-eslint/no-confusing-void-expression --
   lit-html escapes interpolations; concise checkbox handlers are the editor convention. */

interface RuleOption {
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
    ${users.length === 0
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
        `}
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

function getViewOptions(host: StrategyEditorHost): RuleOption[] {
  if (!host._hass) return [];
  const config = host._config;
  const views: RuleOption[] = [{ key: 'home', title: localize('views.overview') }];
  function add(enabled: boolean, key: string, titleKey: string): void {
    if (enabled) views.push({ key, title: localize(titleKey) });
  }

  add(config.show_light_summary !== false, 'lights', 'views.lights');
  add(config.show_covers_summary !== false, 'covers', 'views.covers');
  add(config.show_security_summary !== false, 'security', 'views.security');
  add(config.show_battery_summary !== false || config.show_battery_view === true, 'batteries', 'views.batteries');
  add(config.show_climate_summary === true, 'climate', 'views.climate');
  add(config.show_maintenance_summary === true, 'maintenance', 'views.maintenance');
  add(config.show_camera_view === true, 'cameras', 'views.cameras');

  const roomVisibility = config.room_visibility || {};
  const areas = getVisibleAreasFromHass(host._hass, config.areas_display, config.use_default_area_sort)
    .filter((area) => {
      const rule = Reflect.get(roomVisibility, area.area_id) as { entity?: string; state?: string } | undefined;
      if (!rule || !rule.entity) return true;
      return host._hass?.states[rule.entity]?.state === rule.state;
    });
  for (const area of areas) views.push({ key: area.area_id, title: area.name });

  for (const view of config.custom_views || []) {
    const isComplete = view.parsed_config || (view.ref_dashboard && view.ref_view);
    if (isComplete && view.title && view.path) {
      views.push({ key: view.path, title: view.title });
    }
  }
  return views;
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
  kind: 'view' | 'section',
): TemplateResult {
  const configured = kind === 'view'
    ? getViewVisibleUsers(host._config, option.key)
    : getSectionVisibleUsers(host._config, option.key);
  const selected = configured === undefined ? users.map((user) => user.userId) : configured;

  return html`
    <div class="option-group">
      <div class="option-group-title">
        <ha-icon icon=${kind === 'view' ? 'mdi:tab' : 'mdi:view-grid-outline'}></ha-icon>
        ${option.title} <span class="entity-id">${kind === 'view' ? `/${option.key}` : option.key}</span>
      </div>
      ${users.map((user) => host._renderCheckbox(
        `${kind}-${option.key}-user-${user.userId}`,
        user.name,
        selected.includes(user.userId),
        (checked) => { ruleUserChanged(host, kind, option.key, user.userId, users.map((o) => o.userId), checked); },
      ))}
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
  checked: boolean,
): void {
  const currentMap = (kind === 'view' ? host._config.view_visible_users : host._config.section_visible_users) || {};
  const hasRule = Object.hasOwn(currentMap, key);
  const configured = kind === 'view'
    ? getViewVisibleUsers(host._config, key)
    : getSectionVisibleUsers(host._config, key);
  const effective = new Set(hasRule || configured !== undefined ? (configured || []) : knownUserIds);
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
  checked: boolean,
): void {
  ruleUserChanged(host, 'view', path, userId, knownUserIds, checked);
}
