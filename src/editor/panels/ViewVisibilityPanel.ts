import { html, type TemplateResult } from 'lit';

import { getVisibleAreasFromHass } from '../../utils/name-utils';
import { localize } from '../../utils/localize';
import { getViewVisibleUsers } from '../../utils/view-visibility';
import type { Simon42StrategyConfig } from '../../types/strategy';
import type { StrategyEditorHost } from '../editor-host';

interface ViewOption {
  path: string;
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

  return html`
    <div class="description" style="margin-left: 0;">
      ${localize('editor.view_visibility_desc')}
    </div>
    ${users.length === 0
      ? html`<div class="description" style="margin-left: 0;">${localize('editor.view_visibility_no_users')}</div>`
      : views.map((view) => renderViewUsers(host, view, users))}
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

function getViewOptions(host: StrategyEditorHost): ViewOption[] {
  if (!host._hass) return [];
  const config = host._config;
  const views: ViewOption[] = [{ path: 'home', title: localize('views.overview') }];
  const add = (enabled: boolean, path: string, titleKey: string) => {
    if (enabled) views.push({ path, title: localize(titleKey) });
  };

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
      const rule = roomVisibility[area.area_id];
      if (!rule?.entity) return true;
      return host._hass?.states[rule.entity]?.state === rule.state;
    });
  for (const area of areas) views.push({ path: area.area_id, title: area.name });

  for (const view of config.custom_views || []) {
    if (view.parsed_config && view.title && view.path) {
      views.push({ path: view.path, title: view.title });
    }
  }
  return views;
}

function renderViewUsers(host: StrategyEditorHost, view: ViewOption, users: UserOption[]): TemplateResult {
  const configured = getViewVisibleUsers(host._config, view.path);
  const selected = configured === undefined ? users.map((user) => user.userId) : configured;

  return html`
    <div class="option-group">
      <div class="option-group-title">
        <ha-icon icon="mdi:tab"></ha-icon>
        ${view.title} <span class="entity-id">/${view.path}</span>
      </div>
      ${users.map((user) => host._renderCheckbox(
        `view-${view.path}-user-${user.userId}`,
        user.name,
        selected.includes(user.userId),
        (checked) => viewUserChanged(host, view.path, user.userId, users.map((option) => option.userId), checked),
      ))}
    </div>
  `;
}

export function viewUserChanged(
  host: StrategyEditorHost,
  path: string,
  userId: string,
  knownUserIds: string[],
  checked: boolean,
): void {
  const currentMap = host._config.view_visible_users || {};
  const hasRule = Object.prototype.hasOwnProperty.call(currentMap, path);
  const configured = getViewVisibleUsers(host._config, path);
  const effective = new Set(hasRule || configured !== undefined ? (configured || []) : knownUserIds);
  if (checked) effective.add(userId);
  else effective.delete(userId);

  const known = knownUserIds.filter((id) => effective.has(id));
  const unknown = [...effective].filter((id) => !knownUserIds.includes(id));
  const nextMap = { ...currentMap };
  if (unknown.length === 0 && known.length === knownUserIds.length) {
    delete nextMap[path];
  } else {
    nextMap[path] = [...known, ...unknown];
  }

  const updated: Simon42StrategyConfig = { ...host._config };
  if (path === 'maintenance') delete updated.maintenance_visible_users;
  if (Object.keys(nextMap).length === 0) delete updated.view_visible_users;
  else updated.view_visible_users = nextMap;
  host._fireConfigChanged(updated);
}
