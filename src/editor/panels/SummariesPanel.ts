// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR PANEL: SUMMARIES
// ====================================================================
// Summary tile toggles (lights, covers, security, climate, batteries,
// maintenance) with their sub-options and the pickers for maintenance
// users, hidden cameras and extra security entities. Extracted
// verbatim from StrategyEditor.ts (module split); dynamic lookups on
// moved lines hardened per the CLAUDE.md Codacy pitfalls.
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
import { Registry } from '../../Registry';
import { collectCameraBlocks } from '../../views/CctvViewStrategy';
import { getAllEntitiesForSelect, getFilteredEntities, stateFor } from '../entity-options';
import type { StrategyEditorHost } from '../editor-host';

export function renderSummariesSection(host: StrategyEditorHost): TemplateResult {
  const summariesColumns = host._config.summaries_columns || 2;
  const showLightSummary = host._config.show_light_summary !== false;
  const groupLightsByFloors = host._config.group_lights_by_floors === true;
  const nestedLightGroups = host._config.nested_light_groups === true;
  const showCoversSummary = host._config.show_covers_summary !== false;
  const showPartiallyOpenCovers = host._config.show_partially_open_covers === true;
  const groupCoversByFloors = host._config.group_covers_by_floors === true;
  const showSecuritySummary = host._config.show_security_summary !== false;
  const showClimateSummary = host._config.show_climate_summary === true;
  const showBatterySummary = host._config.show_battery_summary !== false;
  const hideMobileAppBatteries = host._config.hide_mobile_app_batteries === true;
  const hideBatteryNotesEntities = host._config.hide_battery_notes_entities === true;
  const batteryCriticalThreshold = host._config.battery_critical_threshold ?? 20;
  const batteryLowThreshold = host._config.battery_low_threshold ?? 50;
  const showAreaInBatteryView = host._config.show_area_in_battery_view === true;
  const unavailableBatteriesBucket = host._config.unavailable_batteries_bucket === 'critical' ? 'critical' : 'good';

  return html`

      <div class="form-row">
        <input type="radio" id="summaries-2-columns" name="summaries-columns" value="2"
          ?checked=${summariesColumns === 2}
          @change=${() => summariesColumnsChanged(host, 2)} />
        <label for="summaries-2-columns">${localize('editor.columns_2')}</label>
      </div>
      <div class="form-row">
        <input type="radio" id="summaries-4-columns" name="summaries-columns" value="4"
          ?checked=${summariesColumns === 4}
          @change=${() => summariesColumnsChanged(host, 4)} />
        <label for="summaries-4-columns">${localize('editor.columns_4')}</label>
      </div>
      <div class="description">${localize('editor.columns_desc')}</div>

      ${host._renderCheckbox('show-light-summary', localize('editor.show_light_summary'), showLightSummary,
        (checked) => host._toggleChanged('show_light_summary', checked, true))}

      ${host._renderCheckbox('group-lights-by-floors', localize('editor.group_lights_by_floors'), groupLightsByFloors,
        (checked) => host._toggleChanged('group_lights_by_floors', checked, false))}
      <div class="description">${localize('editor.group_lights_by_floors_desc')}</div>

      ${host._renderCheckbox('lights-sort-by-name', localize('editor.lights_sort_by_name'), host._config.lights_sort_by === 'name',
        (checked) => lightsSortByChanged(host, checked))}
      <div class="description">${localize('editor.lights_sort_by_name_desc')}</div>

      ${host._renderCheckbox('nested-light-groups', localize('editor.nested_light_groups'), nestedLightGroups,
        (checked) => host._toggleChanged('nested_light_groups', checked, false))}
      <div class="description">${localize('editor.nested_light_groups_desc')}</div>

      ${host._renderCheckbox('show-covers-summary', localize('editor.show_covers_summary'), showCoversSummary,
        (checked) => host._toggleChanged('show_covers_summary', checked, true))}

      <div style="margin-left: 26px; margin-bottom: 8px;">
        ${host._renderCheckbox('show-partially-open-covers', localize('editor.show_partially_open_covers'), showPartiallyOpenCovers,
          (checked) => host._toggleChanged('show_partially_open_covers', checked, false))}
        <div class="description">${localize('editor.show_partially_open_covers_desc')}</div>

        ${host._renderCheckbox('group-covers-by-floors', localize('editor.group_covers_by_floors'), groupCoversByFloors,
          (checked) => host._toggleChanged('group_covers_by_floors', checked, false))}
        <div class="description">${localize('editor.group_covers_by_floors_desc')}</div>
      </div>

      ${host._renderCheckbox('show-security-summary', localize('editor.show_security_summary'), showSecuritySummary,
        (checked) => host._toggleChanged('show_security_summary', checked, true))}

      <div style="margin-left: 26px; margin-bottom: 8px;">
        ${host._renderCheckbox('show-cameras-in-security', localize('editor.show_cameras_in_security'), host._config.show_cameras_in_security === true,
          (checked) => host._toggleChanged('show_cameras_in_security', checked, false))}
        <div class="description">${localize('editor.show_cameras_in_security_desc')}</div>

        ${host._config.show_cameras_in_security === true ? renderHiddenCamerasPicker(host) : nothing}

        ${host._renderCheckbox('group-security-by-areas', localize('editor.group_security_by_areas'), host._config.group_security_by_areas === true,
          (checked) => host._toggleChanged('group_security_by_areas', checked, false))}
        <div class="description">${localize('editor.group_security_by_areas_desc')}</div>

        ${host._renderCheckbox('show-security-activity', localize('editor.show_security_activity'), host._config.show_security_activity !== false,
          (checked) => host._toggleChanged('show_security_activity', checked, true))}
        <div class="description">${localize('editor.show_security_activity_desc')}</div>

        ${host._config.show_security_activity !== false && host._config.group_security_by_areas !== true ? html`
          <div style="margin-left: 26px;">
            ${host._renderCheckbox('security-activity-at-end', localize('editor.security_activity_at_end'), host._config.security_activity_position === 'end',
              (checked) => securityActivityPositionChanged(host, checked))}
          </div>
        ` : nothing}

        ${renderSecurityExtraEntitiesPicker(host)}
      </div>

      ${host._renderCheckbox('show-climate-summary', localize('editor.show_climate_summary'), showClimateSummary,
        (checked) => host._toggleChanged('show_climate_summary', checked, false))}
      <div class="description">${localize('editor.show_climate_summary_desc')}</div>

      ${host._renderCheckbox('show-camera-view', localize('editor.show_camera_view'), host._config.show_camera_view === true,
        (checked) => host._toggleChanged('show_camera_view', checked, false))}
      <div class="description">${localize('editor.show_camera_view_desc')}</div>

      <div style="margin-left: 26px; margin-bottom: 8px;">
        ${host._renderCheckbox('show-camera-events', localize('editor.show_camera_events'), host._config.show_camera_events === true,
          (checked) => host._toggleChanged('show_camera_events', checked, false))}
        <div class="description">${localize('editor.show_camera_events_desc')}</div>

        ${host._config.show_camera_view === true && host._config.show_cameras_in_security !== true
          ? renderHiddenCamerasPicker(host)
          : nothing}
      </div>

      ${host._renderCheckbox('show-battery-summary', localize('editor.show_battery_summary'), showBatterySummary,
        (checked) => host._toggleChanged('show_battery_summary', checked, true))}

      <div style="margin-left: 26px; margin-bottom: 8px;">
        ${host._renderCheckbox('hide-mobile-app-batteries', localize('editor.hide_mobile_app_batteries'), hideMobileAppBatteries,
          (checked) => host._toggleChanged('hide_mobile_app_batteries', checked, false))}
        <div class="description">${localize('editor.hide_mobile_app_batteries_desc')}</div>

        ${host._renderCheckbox('show-battery-view', localize('editor.show_battery_view'), host._config.show_battery_view === true,
          (checked) => host._toggleChanged('show_battery_view', checked, false))}
        <div class="description">${localize('editor.show_battery_view_desc')}</div>

        ${host._renderCheckbox('show-area-in-battery-view', localize('editor.show_area_in_battery_view'), showAreaInBatteryView,
          (checked) => host._toggleChanged('show_area_in_battery_view', checked, false))}
        <div class="description">${localize('editor.show_area_in_battery_view_desc')}</div>
        ${host._renderCheckbox('hide-battery-notes-entities', localize('editor.hide_battery_notes_entities'), hideBatteryNotesEntities,
          (checked) => host._toggleChanged('hide_battery_notes_entities', checked, false))}
        <div class="description">${localize('editor.hide_battery_notes_entities_desc')}</div>

        <div style="font-size: 13px; font-weight: 500; color: var(--primary-text-color); margin-top: 12px; margin-bottom: 4px;">
          ${localize('editor.battery_thresholds')}
        </div>
        <div class="form-row">
          <label for="battery-critical-threshold" style="min-width: 140px;">${localize('editor.battery_critical_below')}</label>
          <input type="number" id="battery-critical-threshold" min="1" max="99"
            .value=${String(batteryCriticalThreshold)}
            style="width: 70px;"
            @change=${(e: Event) => batteryCriticalChanged(host, e)} /> %
        </div>
        <div class="form-row">
          <label for="battery-low-threshold" style="min-width: 140px;">${localize('editor.battery_low_below')}</label>
          <input type="number" id="battery-low-threshold" min="1" max="99"
            .value=${String(batteryLowThreshold)}
            style="width: 70px;"
            @change=${(e: Event) => batteryLowChanged(host, e)} /> %
        </div>
        <div class="description">${localize('editor.battery_thresholds_desc')}</div>

        <div style="font-size: 13px; font-weight: 500; color: var(--primary-text-color); margin-top: 12px; margin-bottom: 4px;">
          ${localize('editor.unavailable_batteries_bucket')}
        </div>
        <div class="form-row">
          <input type="radio" id="unavailable-batteries-critical" name="unavailable-batteries-bucket" value="critical"
            ?checked=${unavailableBatteriesBucket === 'critical'}
            @change=${() => unavailableBatteriesBucketChanged(host, 'critical')} />
          <label for="unavailable-batteries-critical">${localize('editor.unavailable_batteries_critical')}</label>
        </div>
        <div class="form-row">
          <input type="radio" id="unavailable-batteries-good" name="unavailable-batteries-bucket" value="good"
            ?checked=${unavailableBatteriesBucket === 'good'}
            @change=${() => unavailableBatteriesBucketChanged(host, 'good')} />
          <label for="unavailable-batteries-good">${localize('editor.unavailable_batteries_good')}</label>
        </div>
        <div class="description">${localize('editor.unavailable_batteries_bucket_desc')}</div>
      </div>

      ${host._renderCheckbox('show-maintenance-summary', localize('editor.show_maintenance_summary'), host._config.show_maintenance_summary === true,
        (checked) => host._toggleChanged('show_maintenance_summary', checked, false))}
      <div class="description">${localize('editor.show_maintenance_summary_desc')}</div>

      ${host._config.show_maintenance_summary === true ? html`
        <div style="margin-left: 26px; margin-bottom: 8px;">
          ${host._renderCheckbox('show-maintenance-activity', localize('editor.show_maintenance_activity'), host._config.show_maintenance_activity !== false,
            (checked) => host._toggleChanged('show_maintenance_activity', checked, true))}
          <div class="description">${localize('editor.show_maintenance_activity_desc')}</div>

          ${host._renderCheckbox('show-video-tips', localize('editor.show_video_tips'), host._config.show_video_tips !== false,
            (checked) => host._toggleChanged('show_video_tips', checked, true))}
          <div class="description">${localize('editor.show_video_tips_desc')}</div>

          ${renderMaintenanceUsersPicker(host)}
        </div>
      ` : nothing}
  `;
}

/**
 * User restriction for the maintenance tile/view. Options come from
 * person entities carrying a user_id — no admin-only WS call needed.
 * Empty selection state (no key in config) = visible to everyone.
 */
function renderMaintenanceUsersPicker(host: StrategyEditorHost): TemplateResult {
  if (!host._hass) return html``;
  const options: { userId: string; name: string }[] = [];
  for (const [entityId, state] of Object.entries(host._hass.states)) {
    if (!entityId.startsWith('person.')) continue;
    const userId = state.attributes.user_id as string | undefined;
    if (!userId) continue;
    options.push({
      userId,
      name: (state.attributes.friendly_name as string | undefined) || entityId,
    });
  }

  const selected = host._config.maintenance_visible_users || [];
  const allVisible = selected.length === 0;

  return html`
    <div style="font-size: 13px; font-weight: 500; color: var(--primary-text-color); margin-top: 4px; margin-bottom: 4px;">
      ${localize('editor.maintenance_visible_users')}
    </div>
    <div class="description" style="margin-left: 0;">
      ${localize('editor.maintenance_visible_users_desc')}
    </div>
    ${options.length === 0
      ? html`<div class="description" style="margin-left: 0;">${localize('editor.maintenance_visible_users_none')}</div>`
      : options.map((opt) => host._renderCheckbox(
          `maintenance-user-${opt.userId}`,
          opt.name,
          allVisible || selected.includes(opt.userId),
          (checked) => maintenanceUserChanged(host, opt.userId, options.map((o) => o.userId), checked)
        ))}
  `;
}

function maintenanceUserChanged(host: StrategyEditorHost, userId: string, allUserIds: string[], checked: boolean): void {
  const current = host._config.maintenance_visible_users || [];
  // No restriction stored = everyone checked; start from the full set
  const effective = new Set(current.length > 0 ? current : allUserIds);
  if (checked) effective.add(userId);
  else effective.delete(userId);

  const updated: Simon42StrategyConfig = { ...host._config };
  const known = allUserIds.filter((id) => effective.has(id));
  // Ids configured via YAML for users without a person entity — keep them
  const unknown = [...effective].filter((id) => !allUserIds.includes(id));
  if (unknown.length === 0 && known.length === allUserIds.length) {
    delete updated.maintenance_visible_users; // everyone = no restriction
  } else {
    updated.maintenance_visible_users = [...known, ...unknown];
  }
  host._fireConfigChanged(updated);
}

function unavailableBatteriesBucketChanged(host: StrategyEditorHost, bucket: 'critical' | 'good'): void {
  const updated: Simon42StrategyConfig = { ...host._config };
  // 'good' is now the default → omit the key when matching default
  if (bucket === 'good') {
    delete updated.unavailable_batteries_bucket;
  } else {
    updated.unavailable_batteries_bucket = bucket;
  }
  host._fireConfigChanged(updated);
}

function securityActivityPositionChanged(host: StrategyEditorHost, atEnd: boolean): void {
  const updated: Simon42StrategyConfig = { ...host._config };
  // 'start' is the default → omit the key when matching default
  if (atEnd) {
    updated.security_activity_position = 'end';
  } else {
    delete updated.security_activity_position;
  }
  host._config = updated;
  host._fireConfigChanged(updated);
}

function cameraHiddenChanged(host: StrategyEditorHost, entityId: string, visible: boolean): void {
  const hidden = new Set(host._config.hidden_cameras || []);
  if (visible) hidden.delete(entityId);
  else hidden.add(entityId);
  const updated: Simon42StrategyConfig = { ...host._config };
  if (hidden.size === 0) {
    delete updated.hidden_cameras;
  } else {
    updated.hidden_cameras = [...hidden].sort();
  }
  host._config = updated;
  host._fireConfigChanged(updated);
}

/** Per-camera visibility for the security view (security-only exclusion). */
function renderHiddenCamerasPicker(host: StrategyEditorHost): TemplateResult {
  if (!host._hass) return html``;
  // Same dedup as the views (one camera per device, preferred stream);
  // Registry is initialized by the dashboard render, this is a no-op.
  Registry.initialize(host._hass, host._config);
  const blocks = collectCameraBlocks(host._hass, host._config);
  if (blocks.length === 0) return html``;

  const hidden = new Set(host._config.hidden_cameras || []);
  return html`
    <div style="margin-left: 26px; margin-bottom: 8px;">
      <div style="font-size: 13px; font-weight: 500; color: var(--primary-text-color); margin-top: 4px; margin-bottom: 4px;">
        ${localize('editor.security_cameras_visibility')}
      </div>
      <div class="description" style="margin-left: 0;">
        ${localize('editor.security_cameras_visibility_desc')}
      </div>
      ${blocks.map((block) => {
        const name =
          (host._hass ? stateFor(host._hass, block.cameraId)?.attributes.friendly_name as string | undefined : undefined) ||
          block.cameraId;
        return host._renderCheckbox(
          `security-camera-${block.cameraId}`,
          name,
          !hidden.has(block.cameraId),
          (checked) => cameraHiddenChanged(host, block.cameraId, checked)
        );
      })}
    </div>
  `;
}

function renderSecurityExtraEntitiesPicker(host: StrategyEditorHost): TemplateResult {
  const extras = host._config.security_extra_entities || [];
  const allEntities = getAllEntitiesForSelect(host._hass);
  const entityMap = new Map(allEntities.map((e) => [e.entity_id, e.name]));
  const filtered = getFilteredEntities(host._hass, host._securityExtraSearch);
  return html`
    <div style="font-size: 13px; font-weight: 500; color: var(--primary-text-color); margin-top: 4px; margin-bottom: 4px;">
      ${localize('editor.security_extra_entities')}
    </div>
    <div class="description" style="margin-left: 0; margin-bottom: 8px;">
      ${localize('editor.security_extra_entities_desc')}
    </div>
    ${extras.length > 0 ? html`
      <div class="entity-list-container" style="margin-bottom: 8px;">
        ${extras.map((entityId) => {
          const name = entityMap.get(entityId) || entityId;
          return html`
            <div class="entity-list-item" data-entity-id=${entityId}>
              <span class="item-info">
                <span class="item-name">${name}</span>
                <span class="item-entity-id">${entityId}</span>
              </span>
              <button class="btn-remove" @click=${() => removeSecurityExtraEntity(host, entityId)}>&#x2715;</button>
            </div>
          `;
        })}
      </div>
    ` : nothing}
    <div class="entity-search-picker">
      <input type="text" class="entity-search-input"
        placeholder=${localize('editor.select_entity') + '...'}
        .value=${host._securityExtraSearch}
        @input=${(e: Event) => { host._securityExtraSearch = (e.target as HTMLInputElement).value; host.requestUpdate(); }}
        @blur=${() => { setTimeout(() => { host._securityExtraSearch = ''; host.requestUpdate(); }, 200); }}
      />
      ${host._securityExtraSearch.length >= 2 ? html`
        <div class="entity-search-results">
          ${filtered.length > 0
            ? filtered.map((entity) => html`
              <div class="entity-search-result" @mousedown=${(e: Event) => { e.preventDefault(); addSecurityExtraEntity(host, entity.entity_id); host._securityExtraSearch = ''; host.requestUpdate(); }}>
                <span class="entity-search-name">${entity.name}</span>
                <span class="entity-search-id">${entity.entity_id}</span>
              </div>
            `)
            : html`<div class="entity-search-no-results">${localize('editor.no_results')}</div>`
          }
        </div>
      ` : nothing}
    </div>
  `;
}

function addSecurityExtraEntity(host: StrategyEditorHost, entityId: string): void {
  const current = host._config.security_extra_entities || [];
  if (current.includes(entityId)) return;
  const updated: Simon42StrategyConfig = { ...host._config, security_extra_entities: [...current, entityId] };
  host._fireConfigChanged(updated);
}

function removeSecurityExtraEntity(host: StrategyEditorHost, entityId: string): void {
  const current = host._config.security_extra_entities || [];
  const next = current.filter((e) => e !== entityId);
  const updated: Simon42StrategyConfig = { ...host._config };
  if (next.length === 0) {
    delete updated.security_extra_entities;
  } else {
    updated.security_extra_entities = next;
  }
  host._fireConfigChanged(updated);
}

/** lights_sort_by is an enum with a boolean-shaped editor toggle:
 *  checked → 'name', unchecked → remove (default 'last_changed'). */
function lightsSortByChanged(host: StrategyEditorHost, checked: boolean): void {
  const newConfig: Simon42StrategyConfig = { ...host._config };
  if (checked) {
    newConfig.lights_sort_by = 'name';
  } else {
    delete newConfig.lights_sort_by;
  }
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function summariesColumnsChanged(host: StrategyEditorHost, columns: 2 | 4): void {
  if (!host._hass) return;

  const newConfig: Simon42StrategyConfig = {
    ...host._config,
    summaries_columns: columns,
  };

  if (columns === 2) {
    delete newConfig.summaries_columns;
  }

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function batteryCriticalChanged(host: StrategyEditorHost, e: Event): void {
  const value = parseInt((e.target as HTMLInputElement).value, 10);
  if (isNaN(value) || value < 1 || value > 99) return;
  const newConfig: Simon42StrategyConfig = { ...host._config, battery_critical_threshold: value };
  if (value === 20) delete newConfig.battery_critical_threshold;
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function batteryLowChanged(host: StrategyEditorHost, e: Event): void {
  const value = parseInt((e.target as HTMLInputElement).value, 10);
  if (isNaN(value) || value < 1 || value > 99) return;
  const newConfig: Simon42StrategyConfig = { ...host._config, battery_low_threshold: value };
  if (value === 50) delete newConfig.battery_low_threshold;
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}
