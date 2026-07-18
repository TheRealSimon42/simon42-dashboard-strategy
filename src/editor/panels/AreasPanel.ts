// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR PANEL: AREAS
// ====================================================================
// The per-area editor: area list with visibility/nav-pin/drag order,
// expandable entity groups (visibility, badges, names), per-area
// custom sections and the async area entity cache. Extracted verbatim
// from StrategyEditor.ts (module split); dynamic lookups on moved
// lines hardened per the CLAUDE.md Codacy pitfalls.
// ====================================================================

/* eslint-disable xss/no-mixed-html, @typescript-eslint/no-confusing-void-expression --
   False positive: lit-html's `html` tag escapes every interpolation by
   construction. Codacy's legacy ESLint 8 engine misreads lit render
   functions, DOM Element locals and input event payloads as raw HTML. The
   void-expression rule fights the codebase's established concise event-
   handler arrows (`(checked) => host._toggleChanged(...)`). */
import { html, nothing, type TemplateResult } from 'lit';
import yaml from 'js-yaml';
import type { HomeAssistant } from '../../types/homeassistant';
import type {
  Simon42StrategyConfig,
  AreaCustomSection,
  AreaDisplayType,
  AreaOptions,
  GroupOptions,
  RoomEntities,
} from '../../types/strategy';
import type { AreaRegistryEntry, EntityRegistryEntry } from '../../types/registries';
import { localize } from '../../utils/localize';
import { isBadgeCandidate, isDefaultShowName, resolveShowName } from '../../utils/badge-utils';
import { findUpsEntityGroups } from '../../views/RoomViewStrategy';
import { stateFor } from '../entity-options';
import type { StrategyEditorHost } from '../editor-host';
import { setAreaDisplayTypeOverride, setGlobalAreaDisplayType } from '../area-display-options';
import { renderStackOrderPanel } from './StackOrderPanel';

/** Injection-safe areas_options lookup (see CLAUDE.md Codacy pitfalls). */
export function areaOptionsFor(config: Simon42StrategyConfig, areaId: string): AreaOptions | undefined {
  return config.areas_options
    ? (Reflect.get(config.areas_options, areaId) as AreaOptions | undefined)
    : undefined;
}

interface DomainGroup {
  key: string;
  label: string;
  icon: string;
}

export function renderAreasSection(host: StrategyEditorHost): TemplateResult {
  const groupByFloors = host._config.group_by_floors === true;
  const areaDisplayType = host._config.area_display_type ?? 'compact';
  const showSwitchesOnAreas = host._config.show_switches_on_areas === true;
  const showAlertsOnAreas = host._config.show_alerts_on_areas === true;
  const showWindowAlertsOnAreas = host._config.show_window_alerts_on_areas === true;
  const showLocksInRooms = host._config.show_locks_in_rooms === true;
  const showVacuumsSectionInRooms = host._config.show_vacuums_section_in_rooms === true;
  const showSwitchesSectionInRooms = host._config.show_switches_section_in_rooms === true;
  const showAutomationsInRooms = host._config.show_automations_in_rooms === true;
  const showScriptsInRooms = host._config.show_scripts_in_rooms === true;
  const showUpsInRooms = host._config.show_ups_in_rooms === true;
  const showEnergyInRooms = host._config.show_energy_in_rooms === true;
  // Window / door contact badges default to visible — read as opt-out (!== false).
  const showWindowContactsInRooms = host._config.show_window_contacts_in_rooms !== false;
  const showDoorContactsInRooms = host._config.show_door_contacts_in_rooms !== false;
  const showCamerasInRooms = host._config.show_cameras_in_rooms !== false;
  const useDefaultAreaSort = host._config.use_default_area_sort === true;

  const hassRef = host._hass;
  if (!hassRef) return html``;
  const allAreas = Object.values(hassRef.areas).sort((a, b) => a.name.localeCompare(b.name));
  const hiddenAreas = host._config.areas_display?.hidden || [];
  const areaOrder = host._config.areas_display?.order || [];
  const navItems = host._config.areas_display?.nav_items || [];

  return html`

      ${host._renderCheckbox('group-by-floors', localize('editor.group_by_floors'), groupByFloors,
        (checked) => host._toggleChanged('group_by_floors', checked, false))}
      <div class="description">${localize('editor.group_by_floors_desc')}</div>

      <div class="form-row">
        <label for="area-display-type">${localize('editor.area_display_type')}</label>
        <select id="area-display-type"
          .value=${areaDisplayType}
          @change=${(e: Event) => globalAreaDisplayTypeChanged(host, (e.target as HTMLSelectElement).value as AreaDisplayType)}>
          <option value="compact">${localize('editor.area_display_type_compact')}</option>
          <option value="picture">${localize('editor.area_display_type_picture')}</option>
        </select>
      </div>
      <div class="description">${localize('editor.area_display_type_desc')}</div>

      ${host._renderCheckbox('show-switches-on-areas', localize('editor.show_switches_on_areas'), showSwitchesOnAreas,
        (checked) => host._toggleChanged('show_switches_on_areas', checked, false))}
      <div class="description">${localize('editor.show_switches_on_areas_desc')}</div>

      ${host._renderCheckbox('show-alerts-on-areas', localize('editor.show_alerts_on_areas'), showAlertsOnAreas,
        (checked) => host._toggleChanged('show_alerts_on_areas', checked, false))}
      <div class="description">${localize('editor.show_alerts_on_areas_desc')}</div>

      ${host._renderCheckbox('show-window-alerts-on-areas', localize('editor.show_window_alerts_on_areas'), showWindowAlertsOnAreas,
        (checked) => host._toggleChanged('show_window_alerts_on_areas', checked, false))}
      <div class="description">${localize('editor.show_window_alerts_on_areas_desc')}</div>

      ${host._renderCheckbox('show-locks-in-rooms', localize('editor.show_locks_in_rooms'), showLocksInRooms,
        (checked) => host._toggleChanged('show_locks_in_rooms', checked, false))}
      <div class="description">${localize('editor.show_locks_in_rooms_desc')}</div>

      ${host._renderCheckbox('show-vacuums-section-in-rooms', localize('editor.show_vacuums_section_in_rooms'), showVacuumsSectionInRooms,
        (checked) => host._toggleChanged('show_vacuums_section_in_rooms', checked, false))}
      <div class="description">${localize('editor.show_vacuums_section_in_rooms_desc')}</div>

      ${host._renderCheckbox('show-switches-section-in-rooms', localize('editor.show_switches_section_in_rooms'), showSwitchesSectionInRooms,
        (checked) => host._toggleChanged('show_switches_section_in_rooms', checked, false))}
      <div class="description">${localize('editor.show_switches_section_in_rooms_desc')}</div>

      ${host._renderCheckbox('show-automations-in-rooms', localize('editor.show_automations_in_rooms'), showAutomationsInRooms,
        (checked) => host._toggleChanged('show_automations_in_rooms', checked, false))}
      <div class="description">${localize('editor.show_automations_in_rooms_desc')}</div>

      ${host._renderCheckbox('show-scripts-in-rooms', localize('editor.show_scripts_in_rooms'), showScriptsInRooms,
        (checked) => host._toggleChanged('show_scripts_in_rooms', checked, false))}
      <div class="description">${localize('editor.show_scripts_in_rooms_desc')}</div>

      ${host._renderCheckbox('show-ups-in-rooms', localize('editor.show_ups_in_rooms'), showUpsInRooms,
        (checked) => host._toggleChanged('show_ups_in_rooms', checked, false))}
      <div class="description">${localize('editor.show_ups_in_rooms_desc')}</div>

      ${host._renderCheckbox('show-energy-in-rooms', localize('editor.show_energy_in_rooms'), showEnergyInRooms,
        (checked) => host._toggleChanged('show_energy_in_rooms', checked, false))}
      <div class="description">${localize('editor.show_energy_in_rooms_desc')}</div>

      ${host._renderCheckbox('show-window-contacts-in-rooms', localize('editor.show_window_contacts_in_rooms'), showWindowContactsInRooms,
        (checked) => {
          host._toggleChanged('show_window_contacts_in_rooms', checked, true);
          refreshAllAreaCaches(host);
        })}
      <div class="description">${localize('editor.show_window_contacts_in_rooms_desc')}</div>

      ${host._renderCheckbox('show-door-contacts-in-rooms', localize('editor.show_door_contacts_in_rooms'), showDoorContactsInRooms,
        (checked) => {
          host._toggleChanged('show_door_contacts_in_rooms', checked, true);
          refreshAllAreaCaches(host);
        })}
      <div class="description">${localize('editor.show_door_contacts_in_rooms_desc')}</div>

      ${host._renderCheckbox('show-cameras-in-rooms', localize('editor.show_cameras_in_rooms'), showCamerasInRooms,
        (checked) => host._toggleChanged('show_cameras_in_rooms', checked, true))}
      <div class="description">${localize('editor.show_cameras_in_rooms_desc')}</div>
      ${showCamerasInRooms ? html`
        <div style="margin-left: 26px;">
          ${host._renderCheckbox('camera-live-toggle', localize('editor.camera_live_toggle'),
            host._config.camera_live_toggle === true,
            (checked) => host._toggleChanged('camera_live_toggle', checked, false))}
          <div class="description">${localize('editor.camera_live_toggle_desc')}</div>
        </div>
      ` : nothing}
      ${host._renderCheckbox('hide-unavailable-in-rooms', localize('editor.hide_unavailable_in_rooms'),
        host._config.hide_unavailable_in_rooms !== false,
        (checked) => host._toggleChanged('hide_unavailable_in_rooms', checked, true))}
      <div class="description">${localize('editor.hide_unavailable_in_rooms_desc')}</div>

      ${host._renderCheckbox('use-default-area-sort', localize('editor.use_default_area_sort'), useDefaultAreaSort,
        (checked) => host._toggleChanged('use_default_area_sort', checked, false))}
      <div class="description">${localize('editor.use_default_area_sort_desc')}</div>

      <div class="description" style="margin-left: 0; margin-top: 16px; margin-bottom: 12px;">
        ${localize('editor.areas_manage_desc')}
      </div>

      <div class="area-list" id="area-list">
        ${renderAreaItems(host, allAreas, hiddenAreas, areaOrder, navItems)}
      </div>

      <details style="margin-top: 12px;">
        <summary style="cursor: pointer; font-size: 13px; font-weight: 500; color: var(--primary-text-color); padding: 4px 0;">
          ${localize('editor.room_visibility')}
        </summary>
        <div style="margin-left: 14px; margin-top: 6px;">
          <div class="description" style="margin-left: 0; margin-bottom: 8px;">
            ${localize('editor.room_visibility_desc')}
          </div>
          ${allAreas.filter((a) => !hiddenAreas.includes(a.area_id)).map((area) => {
            const rule = Reflect.get(host._config.room_visibility || {}, area.area_id) as
              { entity: string; state: string } | undefined;
            return html`
              <div style="border: 1px solid var(--divider-color); border-radius: 6px; padding: 8px; margin-bottom: 8px;">
                <div style="font-weight: 500; margin-bottom: 6px;">${area.name}</div>
                <div class="form-row">
                  <label for="room-vis-entity-${area.area_id}" style="min-width: 80px; font-size: 12px;">${localize('editor.section_visibility_entity')}</label>
                  <input type="text" id="room-vis-entity-${area.area_id}" style="flex: 1;"
                    placeholder="input_boolean.guest_mode"
                    .value=${rule?.entity || ''}
                    @change=${(e: Event) => roomVisibilityChanged(host, area.area_id, 'entity', (e.target as HTMLInputElement).value)} />
                </div>
                <div class="form-row">
                  <label for="room-vis-state-${area.area_id}" style="min-width: 80px; font-size: 12px;">${localize('editor.section_visibility_state')}</label>
                  <input type="text" id="room-vis-state-${area.area_id}" style="flex: 1;"
                    placeholder="on"
                    .value=${rule?.state || ''}
                    @change=${(e: Event) => roomVisibilityChanged(host, area.area_id, 'state', (e.target as HTMLInputElement).value)} />
                </div>
              </div>
            `;
          })}
        </div>
      </details>
  `;
}

function roomVisibilityChanged(host: StrategyEditorHost, areaId: string, field: 'entity' | 'state', value: string): void {
  const updated: Simon42StrategyConfig = { ...host._config };
  const current = { ...(updated.room_visibility || {}) };
  const existing = Reflect.get(current, areaId) as { entity: string; state: string } | undefined;
  const rule = { ...(existing || { entity: '', state: '' }) };
  if (field === 'entity') rule.entity = value.trim();
  else rule.state = value.trim();
  if (!rule.entity && !rule.state) {
    Reflect.deleteProperty(current, areaId);
  } else {
    Reflect.set(current, areaId, rule);
  }
  if (Object.keys(current).length === 0) {
    delete updated.room_visibility;
  } else {
    updated.room_visibility = current;
  }
  host._fireConfigChanged(updated);
}

function renderAreaItems(host: StrategyEditorHost, 
  allAreas: AreaRegistryEntry[],
  hiddenAreas: string[],
  areaOrder: string[],
  navItems: string[]
): TemplateResult | TemplateResult[] {
  if (allAreas.length === 0) {
    return html`<div class="empty-state">${localize('editor.no_areas')}</div>`;
  }

  // Sort areas by configured order
  const sortedAreas = [...allAreas].sort((a, b) => {
    const orderA = areaOrder.indexOf(a.area_id);
    const orderB = areaOrder.indexOf(b.area_id);
    const effectiveA = orderA !== -1 ? orderA : 9999 + allAreas.indexOf(a);
    const effectiveB = orderB !== -1 ? orderB : 9999 + allAreas.indexOf(b);
    return effectiveA - effectiveB;
  });

  return sortedAreas.map((area) => {
    const isHidden = hiddenAreas.includes(area.area_id);
    const isExpanded = host._expandedAreas.has(area.area_id);
    const cachedData = host._areaEntitiesCache.get(area.area_id);
    const isPinned = navItems.includes(area.area_id);

    return html`
      <div class="area-item"
        data-area-id=${area.area_id}
        draggable="true"
        @dragstart=${(ev: DragEvent) => handleDragStart(host, ev)}
        @dragend=${(ev: DragEvent) => handleDragEnd(host, ev)}
        @dragover=${(ev: DragEvent) => handleDragOver(host, ev)}
        @dragleave=${(ev: DragEvent) => handleDragLeave(host, ev)}
        @drop=${(ev: DragEvent) => handleDrop(host, ev)}>
        <div class="area-header">
          <span class="drag-handle" draggable="true">&#x2630;</span>
          <input type="checkbox" class="area-checkbox"
            data-area-id=${area.area_id}
            ?checked=${!isHidden}
            @change=${(e: Event) => areaVisibilityChanged(host, area.area_id, (e.target as HTMLInputElement).checked)} />
          <span class="area-name">${area.name}</span>
          ${area.icon ? html`<ha-icon class="area-icon" icon=${area.icon}></ha-icon>` : nothing}
          <button class="nav-pin-button ${isPinned ? 'pinned' : ''}"
            title="${localize('editor.area_pin_nav')}"
            ?disabled=${isHidden}
            @click=${(e: Event) => { e.stopPropagation(); areaNavPinChanged(host, area.area_id, !isPinned); }}>
            <ha-icon icon="${isPinned ? 'mdi:pin' : 'mdi:pin-outline'}"></ha-icon>
          </button>
          <button class="expand-button ${isExpanded ? 'expanded' : ''}"
            data-area-id=${area.area_id}
            ?disabled=${isHidden}
            @click=${(e: Event) => toggleAreaExpand(host, e, area.area_id)}>
            <span class="expand-icon">&#x25B6;</span>
          </button>
        </div>
        ${isExpanded
          ? html`
            <div class="area-content" data-area-id=${area.area_id}>
              ${renderAreaDisplayTypeOverride(host, area)}
              ${cachedData
                ? html`
                  ${renderAreaEntities(host, area.area_id, cachedData)}
                  ${renderStackOrderPanel(host, area.area_id, cachedData)}
                `
                : html`<div class="loading-placeholder">${localize('editor.loading_entities')}</div>`}
              ${renderAreaCustomSections(host, area.area_id)}
            </div>
          `
          : nothing}
      </div>
    `;
  });
}

function globalAreaDisplayTypeChanged(host: StrategyEditorHost, displayType: AreaDisplayType): void {
  const newConfig = setGlobalAreaDisplayType(host._config, displayType);
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function renderAreaDisplayTypeOverride(host: StrategyEditorHost, area: AreaRegistryEntry): TemplateResult {
  const override = areaOptionsFor(host._config, area.area_id)?.display_type ?? '';
  return html`
    <div class="form-row">
      <label for="area-display-type-${area.area_id}">${localize('editor.area_display_type_override')}</label>
      <select id="area-display-type-${area.area_id}"
        .value=${override}
        @change=${(e: Event) => areaDisplayTypeOverrideChanged(
          host,
          area.area_id,
          (e.target as HTMLSelectElement).value as AreaDisplayType | ''
        )}>
        <option value="">${localize('editor.area_display_type_inherit')}</option>
        <option value="compact">${localize('editor.area_display_type_compact')}</option>
        <option value="picture">${localize('editor.area_display_type_picture')}</option>
      </select>
    </div>
    ${!area.picture ? html`<div class="description">${localize('editor.area_display_type_no_picture')}</div>` : nothing}
  `;
}

function areaDisplayTypeOverrideChanged(
  host: StrategyEditorHost,
  areaId: string,
  displayType: AreaDisplayType | ''
): void {
  const newConfig = setAreaDisplayTypeOverride(host._config, areaId, displayType || undefined);
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function renderAreaEntities(host: StrategyEditorHost, 
  areaId: string,
  data: NonNullable<ReturnType<typeof host._areaEntitiesCache.get>>
): TemplateResult {
  const {
    groupedEntities,
    hiddenEntities,
    badgeCandidates,
    additionalBadges,
    availableEntities,
    defaultShowNames,
    namesVisible,
    namesHidden,
  } = data;

  const hass = host._hass;
  if (!hass) return html``;

  const domainGroups: DomainGroup[] = [
    { key: 'lights', label: localize('editor.domain_lights'), icon: 'mdi:lightbulb' },
    { key: 'climate', label: localize('editor.domain_climate'), icon: 'mdi:thermostat' },
    { key: 'covers', label: localize('editor.domain_covers'), icon: 'mdi:window-shutter' },
    { key: 'covers_curtain', label: localize('editor.domain_covers_curtain'), icon: 'mdi:curtains' },
    { key: 'covers_window', label: localize('editor.domain_covers_window'), icon: 'mdi:window-open-variant' },
    { key: 'media_player', label: localize('editor.domain_media_player'), icon: 'mdi:speaker' },
    { key: 'scenes', label: localize('editor.domain_scenes'), icon: 'mdi:palette' },
    { key: 'vacuum', label: localize('editor.domain_vacuum'), icon: 'mdi:robot-vacuum' },
    { key: 'fan', label: localize('editor.domain_fan'), icon: 'mdi:fan' },
    { key: 'switches', label: localize('editor.domain_switches'), icon: 'mdi:light-switch' },
    { key: 'locks', label: localize('editor.domain_locks'), icon: 'mdi:lock' },
    { key: 'cameras', label: localize('editor.domain_cameras'), icon: 'mdi:cctv' },
    { key: 'ups', label: localize('editor.domain_ups'), icon: 'mdi:power-plug-battery' },
    { key: 'energy', label: localize('editor.domain_energy'), icon: 'mdi:lightning-bolt' },
  ];

  // Cameras/UPS/energy can be toggled per room only while the global
  // toggle is on — when it's off, the group stays visible but greyed out
  // so users see WHY the block is missing instead of it silently vanishing.
  const groupDisabledByGlobalToggle = new Map<string, boolean>([
    ['cameras', host._config.show_cameras_in_rooms === false],
    ['ups', host._config.show_ups_in_rooms !== true],
    ['energy', host._config.show_energy_in_rooms !== true],
  ]);

  const hasEntities = domainGroups.some((g) => ((Reflect.get(groupedEntities, g.key) as string[] | undefined)?.length ?? 0) > 0);
  const hasBadges = badgeCandidates.length > 0 || additionalBadges.length > 0;

  if (!hasEntities && !hasBadges) {
    return html`<div class="empty-state">${localize('editor.no_entities_in_area')}</div>`;
  }

  const expandedGroups = host._expandedGroups.get(areaId) || new Set<string>();

  return html`
    <div class="entity-groups">
      ${domainGroups.map((group) => {
        const entities = Reflect.get(groupedEntities, group.key) as string[] | undefined;
        if (!entities || entities.length === 0) return nothing;

        const hiddenInGroup = (Reflect.get(hiddenEntities, group.key) as string[] | undefined) || [];
        const allHidden = entities.every((e) => hiddenInGroup.includes(e));
        const someHidden = entities.some((e) => hiddenInGroup.includes(e)) && !allHidden;
        const isGroupExpanded = expandedGroups.has(group.key);
        const isGroupDisabled = groupDisabledByGlobalToggle.get(group.key) === true;

        return html`
          <div class="entity-group ${isGroupDisabled ? 'disabled' : ''}" data-group=${group.key}
            title=${isGroupDisabled
              ? localize(group.key === 'cameras' ? 'editor.domain_cameras_disabled_hint' : 'editor.domain_group_disabled_hint')
              : ''}>
            <div class="entity-group-header"
              @click=${() => toggleGroupExpand(host, areaId, group.key)}>
              <input type="checkbox" class="group-checkbox"
                data-area-id=${areaId}
                data-group=${group.key}
                ?disabled=${isGroupDisabled}
                ?checked=${!allHidden && !isGroupDisabled}
                .indeterminate=${someHidden && !isGroupDisabled}
                @click=${(e: Event) => e.stopPropagation()}
                @change=${(e: Event) => {
                  e.stopPropagation();
                  const checked = (e.target as HTMLInputElement).checked;
                  groupVisibilityChanged(host, areaId, group.key, checked, entities);
                }} />
              <ha-icon icon=${group.icon}></ha-icon>
              <span class="group-name">${group.label}</span>
              <span class="entity-count">(${entities.length})</span>
              <button class="expand-button-small ${isGroupExpanded ? 'expanded' : ''}"
                @click=${(e: Event) => { e.stopPropagation(); toggleGroupExpand(host, areaId, group.key); }}>
                <span class="expand-icon-small">&#x25B6;</span>
              </button>
            </div>
            ${isGroupExpanded
              ? html`
                <div class="entity-list" data-area-id=${areaId} data-group=${group.key}>
                  ${entities.map((entityId) => {
                    const stateObj = stateFor(hass, entityId);
                    const name = stateObj?.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
                    const isEntityHidden = hiddenInGroup.includes(entityId);
                    return html`
                      <div class="entity-item">
                        <input type="checkbox" class="entity-checkbox"
                          ?disabled=${isGroupDisabled}
                          ?checked=${!isEntityHidden && !isGroupDisabled}
                          @change=${(e: Event) => entityVisibilityChanged(host, areaId, group.key, entityId, (e.target as HTMLInputElement).checked)} />
                        <span class="entity-name">${name}</span>
                        <span class="entity-id">${entityId}</span>
                      </div>
                    `;
                  })}
                </div>
              `
              : nothing}
          </div>
        `;
      })}
      ${hasBadges
        ? renderBadgeGroup(host, areaId, badgeCandidates, additionalBadges, availableEntities, hiddenEntities, defaultShowNames, namesVisible, namesHidden, expandedGroups)
        : nothing}
    </div>
  `;
}

function renderBadgeGroup(host: StrategyEditorHost, 
  areaId: string,
  badgeCandidates: string[],
  additionalBadges: string[],
  availableEntities: Array<{ entity_id: string; name: string }>,
  hiddenEntities: Record<string, string[]>,
  defaultShowNames: Set<string>,
  namesVisible: string[],
  namesHidden: string[],
  expandedGroups: Set<string>
): TemplateResult {
  const hass = host._hass;
  if (!hass) return html``;
  const totalCount = badgeCandidates.length + additionalBadges.length;
  if (totalCount === 0) return html``;

  const hiddenInBadges = (Reflect.get(hiddenEntities, 'badges') as string[] | undefined) || [];
  const allHidden = badgeCandidates.length > 0 && badgeCandidates.every((e) => hiddenInBadges.includes(e));
  const someHidden = badgeCandidates.some((e) => hiddenInBadges.includes(e)) && !allHidden;

  const namesVisibleSet = new Set(namesVisible);
  const namesHiddenSet = new Set(namesHidden);

  function isNameShown(entityId: string): boolean {
    return resolveShowName(entityId, defaultShowNames.has(entityId), namesVisibleSet, namesHiddenSet);
  }

  const isGroupExpanded = expandedGroups.has('badges');

  return html`
    <div class="entity-group" data-group="badges">
      <div class="entity-group-header"
        @click=${() => toggleGroupExpand(host, areaId, 'badges')}>
        <input type="checkbox" class="group-checkbox"
          data-area-id=${areaId}
          data-group="badges"
          ?checked=${!allHidden}
          .indeterminate=${someHidden}
          @click=${(e: Event) => e.stopPropagation()}
          @change=${(e: Event) => {
            e.stopPropagation();
            const checked = (e.target as HTMLInputElement).checked;
            groupVisibilityChanged(host, areaId, 'badges', checked, badgeCandidates);
          }} />
        <ha-icon icon="mdi:checkbox-multiple-blank-circle"></ha-icon>
        <span class="group-name">${localize('editor.domain_badges')}</span>
        <span class="entity-count">(${totalCount})</span>
        <button class="expand-button-small ${isGroupExpanded ? 'expanded' : ''}"
          @click=${(e: Event) => { e.stopPropagation(); toggleGroupExpand(host, areaId, 'badges'); }}>
          <span class="expand-icon-small">&#x25B6;</span>
        </button>
      </div>
      ${isGroupExpanded
        ? html`
          <div class="entity-list" data-area-id=${areaId} data-group="badges">
            ${badgeCandidates.map((entityId) => {
              const stateObj = stateFor(hass, entityId);
              const name = stateObj?.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
              const isHidden = hiddenInBadges.includes(entityId);
              const showName = isNameShown(entityId);

              return html`
                <div class="entity-item">
                  <input type="checkbox" class="entity-checkbox"
                    ?checked=${!isHidden}
                    @change=${(e: Event) => entityVisibilityChanged(host, areaId, 'badges', entityId, (e.target as HTMLInputElement).checked)} />
                  <span class="entity-name">${name}</span>
                  <input type="checkbox" class="badge-name-checkbox"
                    ?checked=${showName}
                    title=${localize('editor.badges_show_name')}
                    @change=${(e: Event) => badgeShowNameChanged(host, areaId, entityId, (e.target as HTMLInputElement).checked)} />
                  <span class="badge-name-label">${localize('editor.badges_name_short')}</span>
                  <span class="entity-id">${entityId}</span>
                </div>
              `;
            })}

            ${additionalBadges.length > 0
              ? html`
                <div class="badge-separator">${localize('editor.badges_additional')}</div>
                ${additionalBadges.map((entityId) => {
                  const stateObj = stateFor(hass, entityId);
                  const name = stateObj?.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
                  const showName = isNameShown(entityId);

                  return html`
                    <div class="entity-item badge-additional-item">
                      <span class="entity-name">${name}</span>
                      <input type="checkbox" class="badge-name-checkbox"
                        ?checked=${showName}
                        title=${localize('editor.badges_show_name')}
                        @change=${(e: Event) => badgeShowNameChanged(host, areaId, entityId, (e.target as HTMLInputElement).checked)} />
                      <span class="badge-name-label">${localize('editor.badges_name_short')}</span>
                      <span class="entity-id">${entityId}</span>
                      <button class="badge-remove-btn"
                        title=${localize('editor.badges_remove')}
                        @click=${() => badgeAdditionalChanged(host, areaId, entityId, false)}>&#x2715;</button>
                    </div>
                  `;
                })}
              `
              : nothing}

            ${availableEntities.length > 0
              ? html`
                <div class="badge-add-section">
                  <select class="badge-entity-picker" data-area-id=${areaId}>
                    <option value="">${localize('editor.badges_select_entity')}</option>
                    ${availableEntities.map((e) => html`
                      <option value=${e.entity_id}>${e.name} (${e.entity_id})</option>
                    `)}
                  </select>
                  <button class="badge-add-button"
                    @click=${(e: Event) => addBadgeFromPicker(host, e, areaId)}>
                    ${localize('editor.badges_add')}
                  </button>
                </div>
              `
              : nothing}
          </div>
        `
        : nothing}
    </div>
  `;
}

async function loadAreaEntities(host: StrategyEditorHost, areaId: string): Promise<void> {
  if (!host._hass) return;

  const groupedEntities = await getAreaGroupedEntities(areaId, host._hass);
  const hiddenEntities = getHiddenEntitiesForArea(areaId, host._config);
  const entityOrders = getEntityOrdersForArea(areaId, host._config);
  const badgeCandidates = getAreaBadgeCandidates(areaId, host._hass, host._config);
  const additionalBadges = getAdditionalBadgesForArea(areaId, host._config);
  const availableEntities = getAvailableBadgeEntities(areaId, host._hass, badgeCandidates, additionalBadges);
  const defaultShowNames = getDefaultShowNameEntities(badgeCandidates, host._hass);
  const { namesVisible, namesHidden } = getBadgeNamesConfig(areaId, host._config);

  host._areaEntitiesCache.set(areaId, {
    groupedEntities,
    hiddenEntities,
    entityOrders,
    badgeCandidates,
    additionalBadges,
    availableEntities,
    defaultShowNames,
    namesVisible,
    namesHidden,
  });

  host.requestUpdate();
}

/** Re-derive cached per-area data for all loaded areas (e.g. after a global toggle changed) */
function refreshAllAreaCaches(host: StrategyEditorHost): void {
  for (const areaId of host._areaEntitiesCache.keys()) {
    refreshAreaCache(host, areaId);
  }
}

function refreshAreaCache(host: StrategyEditorHost, areaId: string): void {
  if (!host._hass) return;
  const cached = host._areaEntitiesCache.get(areaId);
  if (!cached) return;

  const groupedEntities = cached.groupedEntities;
  const hiddenEntities = getHiddenEntitiesForArea(areaId, host._config);
  const entityOrders = getEntityOrdersForArea(areaId, host._config);
  const badgeCandidates = getAreaBadgeCandidates(areaId, host._hass, host._config);
  const additionalBadges = getAdditionalBadgesForArea(areaId, host._config);
  const availableEntities = getAvailableBadgeEntities(areaId, host._hass, badgeCandidates, additionalBadges);
  const defaultShowNames = getDefaultShowNameEntities(badgeCandidates, host._hass);
  const { namesVisible, namesHidden } = getBadgeNamesConfig(areaId, host._config);

  host._areaEntitiesCache.set(areaId, {
    groupedEntities,
    hiddenEntities,
    entityOrders,
    badgeCandidates,
    additionalBadges,
    availableEntities,
    defaultShowNames,
    namesVisible,
    namesHidden,
  });
}

function getAreaCustomSections(host: StrategyEditorHost, areaId: string): AreaCustomSection[] {
  return areaOptionsFor(host._config, areaId)?.custom_sections || [];
}

/** Writes the custom_sections list for one area, pruning empty objects
 *  (same cleanup pattern as the groups_options writers). */
function setAreaCustomSections(host: StrategyEditorHost, areaId: string, sections: AreaCustomSection[]): void {
  const currentAreaOptions = areaOptionsFor(host._config, areaId) || {};

  const newAreaOptions: AreaOptions = { ...currentAreaOptions };
  if (sections.length === 0) {
    delete newAreaOptions.custom_sections;
  } else {
    newAreaOptions.custom_sections = sections;
  }

  const newAreasOptions: Record<string, AreaOptions> = {
    ...host._config.areas_options,
    [areaId]: newAreaOptions,
  };
  if (Object.keys(newAreaOptions).length === 0) {
    Reflect.deleteProperty(newAreasOptions, areaId);
  }

  const newConfig: Simon42StrategyConfig = {
    ...host._config,
    areas_options: newAreasOptions,
  };
  if (newConfig.areas_options && Object.keys(newConfig.areas_options).length === 0) {
    delete newConfig.areas_options;
  }

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function addAreaCustomSection(host: StrategyEditorHost, areaId: string): void {
  const sections = [...getAreaCustomSections(host, areaId)];
  sections.push({ yaml: '', parsed_config: undefined } as AreaCustomSection);
  setAreaCustomSections(host, areaId, sections);
}

function removeAreaCustomSection(host: StrategyEditorHost, areaId: string, index: number): void {
  const sections = [...getAreaCustomSections(host, areaId)];
  sections.splice(index, 1);
  setAreaCustomSections(host, areaId, sections);
}

function updateAreaCustomSectionPosition(host: StrategyEditorHost, areaId: string, index: number, value: string): void {
  const sections = [...getAreaCustomSections(host, areaId)];
  const existing = sections.at(index);
  if (!existing) return;
  sections.splice(index, 1, { ...existing, position: value === 'top' ? 'top' : 'bottom' });
  setAreaCustomSections(host, areaId, sections);
}

function updateAreaCustomSectionYaml(host: StrategyEditorHost, areaId: string, index: number, yamlString: string): void {
  const sections = [...getAreaCustomSections(host, areaId)];
  const existing = sections.at(index);
  if (!existing) return;

  const updated: AreaCustomSection = { ...existing, yaml: yamlString };
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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message.split('\n')[0] : 'Ungültiges YAML';
      updated._yaml_error = message || 'Ungültiges YAML';
      updated.parsed_config = undefined;
    }
  } else {
    updated.parsed_config = undefined;
  }

  sections.splice(index, 1, updated);
  setAreaCustomSections(host, areaId, sections);
}

function renderAreaCustomSections(host: StrategyEditorHost, areaId: string): TemplateResult {
  const sections = getAreaCustomSections(host, areaId);

  return html`
    <div class="area-custom-sections" style="margin-top: 12px;">
      <div style="font-weight: 500; margin-bottom: 4px;">${localize('editor.area_custom_sections')}</div>
      <div class="description" style="margin-bottom: 8px;">${localize('editor.area_custom_sections_desc')}</div>
      ${sections.map((section, index) => renderAreaCustomSectionItem(host, areaId, section, index))}
      <button class="btn-primary" @click=${() => addAreaCustomSection(host, areaId)}>
        ${localize('editor.add_custom_section')}
      </button>
    </div>
  `;
}

function renderAreaCustomSectionItem(host: StrategyEditorHost, 
  areaId: string,
  section: AreaCustomSection,
  index: number
): TemplateResult {
  const yamlMsg = section._yaml_error
    ? html`<span style="color: var(--error-color);">&#x274C; ${section._yaml_error}</span>`
    : section.yaml
      ? html`<span style="color: var(--success-color, green);">&#x2705; ${localize('editor.yaml_valid')}</span>`
      : nothing;
  const position = section.position === 'top' ? 'top' : 'bottom';

  return html`
    <div class="custom-item" data-index=${index}>
      <div class="custom-item-header">
        <strong>${section.heading || localize('editor.new_section')}</strong>
        <button class="btn-remove" @click=${() => removeAreaCustomSection(host, areaId, index)}>&#x2715;</button>
      </div>
      <div class="custom-item-fields">
        <div class="custom-item-row">
          <select style="flex: 1;"
            @change=${(e: Event) => updateAreaCustomSectionPosition(host, areaId, index, (e.target as HTMLSelectElement).value)}>
            <option value="bottom" ?selected=${position === 'bottom'}>${localize('editor.custom_section_position_bottom')}</option>
            <option value="top" ?selected=${position === 'top'}>${localize('editor.custom_section_position_top')}</option>
          </select>
        </div>
        <textarea rows="8" placeholder=${localize('editor.custom_section_yaml_placeholder')}
          .value=${section.yaml || ''}
          style="width: 100%;"
          @change=${(e: Event) => updateAreaCustomSectionYaml(host, areaId, index, (e.target as HTMLTextAreaElement).value)}></textarea>
        <div class="custom-item-validation">
          ${yamlMsg}
        </div>
      </div>
    </div>
  `;
}

function areaVisibilityChanged(host: StrategyEditorHost, areaId: string, isVisible: boolean): void {
  if (!host._hass) return;

  let hiddenAreas = [...(host._config.areas_display?.hidden || [])];

  if (isVisible) {
    hiddenAreas = hiddenAreas.filter((id) => id !== areaId);
  } else {
    if (!hiddenAreas.includes(areaId)) {
      hiddenAreas.push(areaId);
    }
    // Collapse area when hidden
    host._expandedAreas.delete(areaId);
    host._expandedGroups.delete(areaId);
    host._areaEntitiesCache.delete(areaId);
  }

  const newConfig: Simon42StrategyConfig = {
    ...host._config,
    areas_display: {
      ...host._config.areas_display,
      hidden: hiddenAreas,
    },
  };

  if (newConfig.areas_display?.hidden?.length === 0) {
    delete newConfig.areas_display.hidden;
  }
  if (newConfig.areas_display && Object.keys(newConfig.areas_display).length === 0) {
    delete newConfig.areas_display;
  }

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function areaNavPinChanged(host: StrategyEditorHost, areaId: string, isPinned: boolean): void {
  let navItems = [...(host._config.areas_display?.nav_items || [])];

  if (isPinned) {
    if (!navItems.includes(areaId)) navItems.push(areaId);
  } else {
    navItems = navItems.filter((id) => id !== areaId);
  }

  const newConfig: Simon42StrategyConfig = {
    ...host._config,
    areas_display: { ...host._config.areas_display, nav_items: navItems },
  };

  if (newConfig.areas_display?.nav_items?.length === 0) delete newConfig.areas_display.nav_items;
  if (newConfig.areas_display && Object.keys(newConfig.areas_display).length === 0) delete newConfig.areas_display;

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function toggleAreaExpand(host: StrategyEditorHost, e: Event, areaId: string): void {
  e.stopPropagation();

  const newExpandedAreas = new Set(host._expandedAreas);

  if (newExpandedAreas.has(areaId)) {
    newExpandedAreas.delete(areaId);
    const newExpandedGroups = new Map(host._expandedGroups);
    newExpandedGroups.delete(areaId);
    host._expandedGroups = newExpandedGroups;
  } else {
    newExpandedAreas.add(areaId);
    // Load entities if not cached
    if (!host._areaEntitiesCache.has(areaId)) {
      void loadAreaEntities(host, areaId);
    }
  }

  host._expandedAreas = newExpandedAreas;
}

function toggleGroupExpand(host: StrategyEditorHost, areaId: string, groupKey: string): void {
  const newExpandedGroups = new Map(host._expandedGroups);
  const areaGroups = new Set(newExpandedGroups.get(areaId) || []);

  if (areaGroups.has(groupKey)) {
    areaGroups.delete(groupKey);
  } else {
    areaGroups.add(groupKey);
  }

  if (areaGroups.size > 0) {
    newExpandedGroups.set(areaId, areaGroups);
  } else {
    newExpandedGroups.delete(areaId);
  }

  host._expandedGroups = newExpandedGroups;
}

function groupVisibilityChanged(host: StrategyEditorHost, areaId: string, group: string, isVisible: boolean, entities: string[]): void {
  if (!host._hass) return;

  const currentAreaOptions = areaOptionsFor(host._config, areaId) || {};
  const currentGroupsOptions = currentAreaOptions.groups_options || {};
  const currentGroupOptions = Reflect.get(currentGroupsOptions, group) as GroupOptions | undefined;
  let hiddenEntities = [...(currentGroupOptions?.hidden || [])];

  if (isVisible) {
    hiddenEntities = hiddenEntities.filter((e) => !entities.includes(e));
  } else {
    hiddenEntities = [...new Set([...hiddenEntities, ...entities])];
  }

  updateEntityConfig(host, areaId, group, hiddenEntities);
}

function entityVisibilityChanged(host: StrategyEditorHost, areaId: string, group: string, entityId: string, isVisible: boolean): void {
  if (!host._hass) return;

  // Handle badge additional entities
  if (group === 'badges_additional') {
    badgeAdditionalChanged(host, areaId, entityId, isVisible);
    return;
  }

  // Handle badge show_name toggle
  if (group === 'badges_show_name') {
    badgeShowNameChanged(host, areaId, entityId, isVisible);
    return;
  }

  const currentAreaOptions = areaOptionsFor(host._config, areaId) || {};
  const currentGroupsOptions = currentAreaOptions.groups_options || {};
  const currentGroupOptions = Reflect.get(currentGroupsOptions, group) as GroupOptions | undefined;
  let hiddenEntities = [...(currentGroupOptions?.hidden || [])];

  if (isVisible) {
    hiddenEntities = hiddenEntities.filter((e) => e !== entityId);
  } else {
    if (!hiddenEntities.includes(entityId)) {
      hiddenEntities.push(entityId);
    }
  }

  updateEntityConfig(host, areaId, group, hiddenEntities);
}

function updateEntityConfig(host: StrategyEditorHost, areaId: string, group: string, hiddenEntities: string[]): void {
  const currentAreaOptions = areaOptionsFor(host._config, areaId) || {};
  const currentGroupsOptions = currentAreaOptions.groups_options || {};
  const currentGroupOptions = Reflect.get(currentGroupsOptions, group) as GroupOptions | undefined;

  const newGroupOptions: GroupOptions = {
    ...currentGroupOptions,
    hidden: hiddenEntities,
  };

  if (hiddenEntities.length === 0) {
    delete newGroupOptions.hidden;
  }

  const newGroupsOptions: Record<string, GroupOptions> = {
    ...currentGroupsOptions,
    [group]: newGroupOptions,
  };

  if (Object.keys(newGroupOptions).length === 0) {
    Reflect.deleteProperty(newGroupsOptions, group);
  }

  const newAreaOptions: AreaOptions = {
    ...currentAreaOptions,
    groups_options: newGroupsOptions,
  };

  if (Object.keys(newGroupsOptions).length === 0) {
    delete newAreaOptions.groups_options;
  }

  const newAreasOptions: Record<string, AreaOptions> = {
    ...host._config.areas_options,
    [areaId]: newAreaOptions,
  };

  if (Object.keys(newAreaOptions).length === 0) {
    Reflect.deleteProperty(newAreasOptions, areaId);
  }

  const newConfig: Simon42StrategyConfig = {
    ...host._config,
    areas_options: newAreasOptions,
  };

  if (newConfig.areas_options && Object.keys(newConfig.areas_options).length === 0) {
    delete newConfig.areas_options;
  }

  host._config = newConfig;
  host._fireConfigChanged(newConfig);

  // Refresh cached data so re-render picks up the changes
  refreshAreaCache(host, areaId);
}

function badgeAdditionalChanged(host: StrategyEditorHost, areaId: string, entityId: string, isAdd: boolean): void {
  const currentAreaOptions = areaOptionsFor(host._config, areaId) || {};
  const currentGroupsOptions = currentAreaOptions.groups_options || {};
  const currentBadgeOptions = (Reflect.get(currentGroupsOptions, 'badges') as GroupOptions | undefined) || {};

  let additional = [...(currentBadgeOptions.additional || [])];

  if (isAdd) {
    if (!additional.includes(entityId)) additional.push(entityId);
  } else {
    additional = additional.filter((e) => e !== entityId);
  }

  const newBadgeOptions: GroupOptions = { ...currentBadgeOptions };
  if (additional.length > 0) {
    newBadgeOptions.additional = additional;
  } else {
    delete newBadgeOptions.additional;
  }

  const newGroupsOptions: Record<string, GroupOptions> = {
    ...currentGroupsOptions,
    badges: newBadgeOptions,
  };

  if (Object.keys(newGroupsOptions.badges).length === 0) {
    delete newGroupsOptions.badges;
  }

  const newAreaOptions: AreaOptions = {
    ...currentAreaOptions,
    groups_options: newGroupsOptions,
  };

  if (Object.keys(newGroupsOptions).length === 0) {
    delete newAreaOptions.groups_options;
  }

  const newAreasOptions: Record<string, AreaOptions> = {
    ...host._config.areas_options,
    [areaId]: newAreaOptions,
  };

  if (Object.keys(newAreaOptions).length === 0) {
    Reflect.deleteProperty(newAreasOptions, areaId);
  }

  const newConfig: Simon42StrategyConfig = {
    ...host._config,
    areas_options: newAreasOptions,
  };

  if (newConfig.areas_options && Object.keys(newConfig.areas_options).length === 0) {
    delete newConfig.areas_options;
  }

  host._config = newConfig;
  host._fireConfigChanged(newConfig);

  // Refresh cached data
  refreshAreaCache(host, areaId);
}

function badgeShowNameChanged(host: StrategyEditorHost, areaId: string, entityId: string, showName: boolean): void {
  if (!host._hass) return;

  const currentAreaOptions = areaOptionsFor(host._config, areaId) || {};
  const currentGroupsOptions = currentAreaOptions.groups_options || {};
  const currentBadgeOptions = (Reflect.get(currentGroupsOptions, 'badges') as GroupOptions | undefined) || {};

  let namesVisible = [...(currentBadgeOptions.names_visible || [])];
  let namesHidden = [...(currentBadgeOptions.names_hidden || [])];

  const stateObj = stateFor(host._hass, entityId);
  const dc = stateObj?.attributes.device_class as string | undefined;
  const defaultShowName = isDefaultShowName(dc);

  if (showName === defaultShowName) {
    namesVisible = namesVisible.filter((e) => e !== entityId);
    namesHidden = namesHidden.filter((e) => e !== entityId);
  } else if (showName) {
    if (!namesVisible.includes(entityId)) namesVisible.push(entityId);
    namesHidden = namesHidden.filter((e) => e !== entityId);
  } else {
    namesVisible = namesVisible.filter((e) => e !== entityId);
    if (!namesHidden.includes(entityId)) namesHidden.push(entityId);
  }

  const newBadgeOptions: GroupOptions = { ...currentBadgeOptions };
  if (namesVisible.length > 0) newBadgeOptions.names_visible = namesVisible;
  else delete newBadgeOptions.names_visible;
  if (namesHidden.length > 0) newBadgeOptions.names_hidden = namesHidden;
  else delete newBadgeOptions.names_hidden;

  const newGroupsOptions: Record<string, GroupOptions> = { ...currentGroupsOptions, badges: newBadgeOptions };
  if (Object.keys(newGroupsOptions.badges).length === 0) delete newGroupsOptions.badges;

  const newAreaOptions: AreaOptions = { ...currentAreaOptions, groups_options: newGroupsOptions };
  if (Object.keys(newGroupsOptions).length === 0) delete newAreaOptions.groups_options;

  const newAreasOptions: Record<string, AreaOptions> = { ...host._config.areas_options, [areaId]: newAreaOptions };
  if (Object.keys(newAreaOptions).length === 0) Reflect.deleteProperty(newAreasOptions, areaId);

  const newConfig: Simon42StrategyConfig = { ...host._config, areas_options: newAreasOptions };
  if (newConfig.areas_options && Object.keys(newConfig.areas_options).length === 0) delete newConfig.areas_options;

  host._config = newConfig;
  host._fireConfigChanged(newConfig);

  // Refresh cached data
  refreshAreaCache(host, areaId);
}

function addBadgeFromPicker(host: StrategyEditorHost, e: Event, areaId: string): void {
  e.stopPropagation();
  const picker = (host.shadowRoot?.querySelector(
    `.badge-entity-picker[data-area-id="${areaId}"]`
  ) ?? null) as HTMLSelectElement | null;
  if (!picker || !picker.value) return;

  const entityId = picker.value;
  badgeAdditionalChanged(host, areaId, entityId, true);
  picker.value = '';
}

function handleDragStart(host: StrategyEditorHost, ev: DragEvent): void {
  const dragHandle = (ev.target as HTMLElement).closest('.drag-handle');
  if (!dragHandle) {
    ev.preventDefault();
    return;
  }

  const areaItem = (ev.target as HTMLElement).closest('.area-item') as HTMLElement | null;
  if (!areaItem) {
    ev.preventDefault();
    return;
  }

  areaItem.classList.add('dragging');
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/plain', areaItem.dataset.areaId || '');
  }
  host._draggedElement = areaItem;
}

function handleDragEnd(host: StrategyEditorHost, ev: DragEvent): void {
  const areaItem = (ev.target as HTMLElement).closest('.area-item') as HTMLElement | null;
  if (areaItem) {
    areaItem.classList.remove('dragging');
  }

  // Remove all drag-over classes
  const areaList = host.shadowRoot?.querySelector('#area-list');
  if (areaList) {
    areaList.querySelectorAll('.area-item').forEach((item) => {
      item.classList.remove('drag-over');
    });
  }
}

function handleDragOver(host: StrategyEditorHost, ev: DragEvent): void {
  ev.preventDefault();
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';

  const item = (ev.currentTarget as HTMLElement);
  if (item !== host._draggedElement) {
    item.classList.add('drag-over');
  }
}

function handleDragLeave(host: StrategyEditorHost, ev: DragEvent): void {
  (ev.currentTarget as HTMLElement).classList.remove('drag-over');
}

function handleDrop(host: StrategyEditorHost, ev: DragEvent): void {
  ev.stopPropagation();
  ev.preventDefault();

  const dropTarget = ev.currentTarget as HTMLElement;
  dropTarget.classList.remove('drag-over');

  if (!host._draggedElement || host._draggedElement === dropTarget) return;

  const draggedAreaId = host._draggedElement.dataset.areaId;
  const dropAreaId = dropTarget.dataset.areaId;
  if (!draggedAreaId || !dropAreaId) return;

  // Compute new order from current config state (NOT from DOM)
  const currentOrder = getAreaOrder(host);
  const draggedIndex = currentOrder.indexOf(draggedAreaId);
  const dropIndex = currentOrder.indexOf(dropAreaId);
  if (draggedIndex === -1 || dropIndex === -1) return;

  const newOrder = [...currentOrder];
  newOrder.splice(draggedIndex, 1);
  newOrder.splice(dropIndex, 0, draggedAreaId);

  updateAreaOrder(host, newOrder);
}

function getAreaOrder(host: StrategyEditorHost): string[] {
  if (!host._hass) return [];
  const configOrder = host._config.areas_display?.order;
  if (configOrder && configOrder.length > 0) return [...configOrder];
  return Object.keys(host._hass.areas);
}

function updateAreaOrder(host: StrategyEditorHost, newOrder: string[]): void {

  const newConfig: Simon42StrategyConfig = {
    ...host._config,
    areas_display: {
      ...host._config.areas_display,
      order: newOrder,
    },
  };

  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

// ====================================================================
// HELPER FUNCTIONS (local to this module)
// ====================================================================

async function getAreaGroupedEntities(areaId: string, hass: HomeAssistant): Promise<RoomEntities> {
  const devices = Object.values(hass.devices);
  const entities = Object.values(hass.entities);

  const areaDevices = new Set<string>();
  for (const device of devices) {
    if (device.area_id === areaId) {
      areaDevices.add(device.id);
    }
  }

  const roomEntities: RoomEntities = {
    lights: [],
    covers: [],
    covers_curtain: [],
    covers_window: [],
    scenes: [],
    climate: [],
    media_player: [],
    vacuum: [],
    fan: [],
    humidifier: [],
    valve: [],
    water_heater: [],
    switches: [],
    locks: [],
    automations: [],
    scripts: [],
    cameras: [],
    ups: [],
    energy: [],
  };

  const excludeLabels = entities
    .filter((e: EntityRegistryEntry) => e.labels.includes('no_dboard'))
    .map((e: EntityRegistryEntry) => e.entity_id);

  const areaEntries: EntityRegistryEntry[] = [];
  for (const entity of entities) {
    let belongsToArea = false;

    if (entity.area_id) {
      belongsToArea = entity.area_id === areaId;
    } else if (entity.device_id && areaDevices.has(entity.device_id)) {
      belongsToArea = true;
    }

    if (!belongsToArea) continue;
    if (excludeLabels.includes(entity.entity_id)) continue;
    if (!stateFor(hass, entity.entity_id)) continue;
    if (entity.hidden) continue;

    const entityRegistry = Reflect.get(hass.entities, entity.entity_id) as
      EntityRegistryEntry | undefined;
    if (entityRegistry?.hidden) continue;

    areaEntries.push(entity);
  }

  // Same UPS grouping as the room view: detected UPS devices get their own
  // group, their entities leave the normal domain groups.
  const upsGroups = findUpsEntityGroups(areaEntries, hass);
  const usedByUps = new Set(upsGroups.flatMap(({ entityIds }) => entityIds));
  roomEntities.ups.push(...usedByUps);

  for (const entity of areaEntries) {
    if (usedByUps.has(entity.entity_id)) continue;

    const domain = entity.entity_id.split('.')[0];
    const stateObj = stateFor(hass, entity.entity_id);
    const deviceClass = stateObj?.attributes.device_class;

    if (domain === 'light') {
      roomEntities.lights.push(entity.entity_id);
    } else if (domain === 'cover') {
      if (deviceClass === 'curtain') {
        roomEntities.covers_curtain.push(entity.entity_id);
      } else if (deviceClass === 'window' || deviceClass === 'door' || deviceClass === 'gate' || deviceClass === 'garage') {
        roomEntities.covers_window.push(entity.entity_id);
      } else {
        roomEntities.covers.push(entity.entity_id);
      }
    } else if (domain === 'scene') {
      roomEntities.scenes.push(entity.entity_id);
    } else if (domain === 'climate') {
      roomEntities.climate.push(entity.entity_id);
    } else if (domain === 'media_player') {
      roomEntities.media_player.push(entity.entity_id);
    } else if (domain === 'vacuum' || domain === 'lawn_mower') {
      roomEntities.vacuum.push(entity.entity_id);
    } else if (domain === 'fan') {
      roomEntities.fan.push(entity.entity_id);
    } else if (domain === 'humidifier') {
      roomEntities.humidifier.push(entity.entity_id);
    } else if (domain === 'valve') {
      roomEntities.valve.push(entity.entity_id);
    } else if (domain === 'water_heater') {
      roomEntities.water_heater.push(entity.entity_id);
    } else if (domain === 'switch') {
      roomEntities.switches.push(entity.entity_id);
    } else if (domain === 'lock') {
      roomEntities.locks.push(entity.entity_id);
    } else if (domain === 'automation') {
      roomEntities.automations.push(entity.entity_id);
    } else if (domain === 'script') {
      roomEntities.scripts.push(entity.entity_id);
    } else if (domain === 'camera') {
      roomEntities.cameras.push(entity.entity_id);
    } else if (domain === 'sensor' && ['power', 'energy', 'water', 'gas'].includes(deviceClass || '')) {
      roomEntities.energy.push(entity.entity_id);
    }
  }

  return roomEntities;
}

function getAreaBadgeCandidates(areaId: string, hass: HomeAssistant, config: Simon42StrategyConfig): string[] {
  const devices = Object.values(hass.devices);
  const entities = Object.values(hass.entities);

  const areaDevices = new Set<string>();
  for (const device of devices) {
    if (device.area_id === areaId) areaDevices.add(device.id);
  }

  const candidates: string[] = [];

  for (const entity of entities) {
    let belongsToArea = false;
    if (entity.area_id) belongsToArea = entity.area_id === areaId;
    else if (entity.device_id && areaDevices.has(entity.device_id)) belongsToArea = true;
    if (!belongsToArea) continue;
    if (entity.hidden) continue;
    if (entity.labels.includes('no_dboard')) continue;
    if (!stateFor(hass, entity.entity_id)) continue;

    const domain = entity.entity_id.split('.')[0];
    const stateObj = stateFor(hass, entity.entity_id);
    const dc = stateObj?.attributes.device_class as string | undefined;
    const unit = stateObj?.attributes.unit_of_measurement as string | undefined;

    if (!isBadgeCandidate(domain, dc, unit, entity.entity_id)) continue;

    // Globally disabled contact types don't render as badges — don't offer
    // them as candidates either (they stay pickable as additional badges,
    // which is the deliberate per-room override).
    if (domain === 'binary_sensor' && dc === 'window' && config.show_window_contacts_in_rooms === false) continue;
    if (domain === 'binary_sensor' && dc === 'door' && config.show_door_contacts_in_rooms === false) continue;

    if (domain === 'sensor' && (dc === 'battery' || entity.entity_id.includes('battery'))) {
      const val = parseFloat(stateObj?.state ?? '');
      if (!isNaN(val) && val < 20) candidates.push(entity.entity_id);
      continue;
    }

    candidates.push(entity.entity_id);
  }

  return candidates;
}

function getAdditionalBadgesForArea(areaId: string, config: Simon42StrategyConfig): string[] {
  const groups = areaOptionsFor(config, areaId)?.groups_options;
  const badges = groups ? (Reflect.get(groups, 'badges') as GroupOptions | undefined) : undefined;
  return badges?.additional || [];
}

function getAvailableBadgeEntities(
  areaId: string,
  hass: HomeAssistant,
  existingCandidates: string[],
  existingAdditional: string[]
): Array<{ entity_id: string; name: string }> {
  const devices = Object.values(hass.devices);
  const entities = Object.values(hass.entities);
  const excludeSet = new Set([...existingCandidates, ...existingAdditional]);

  const areaDevices = new Set<string>();
  for (const device of devices) {
    if (device.area_id === areaId) areaDevices.add(device.id);
  }

  const available: Array<{ entity_id: string; name: string }> = [];

  for (const entity of entities) {
    let belongsToArea = false;
    if (entity.area_id) belongsToArea = entity.area_id === areaId;
    else if (entity.device_id && areaDevices.has(entity.device_id)) belongsToArea = true;
    if (!belongsToArea) continue;
    if (entity.hidden) continue;
    if (!stateFor(hass, entity.entity_id)) continue;

    const domain = entity.entity_id.split('.')[0];
    if (domain !== 'sensor' && domain !== 'binary_sensor') continue;
    if (excludeSet.has(entity.entity_id)) continue;

    const stateObj = stateFor(hass, entity.entity_id);
    const name = (stateObj?.attributes.friendly_name as string) || entity.entity_id.split('.')[1].replace(/_/g, ' ');
    available.push({ entity_id: entity.entity_id, name });
  }

  available.sort((a, b) => a.name.localeCompare(b.name));
  return available;
}

function getDefaultShowNameEntities(badgeCandidates: string[], hass: HomeAssistant): Set<string> {
  const result = new Set<string>();
  for (const entityId of badgeCandidates) {
    const stateObj = stateFor(hass, entityId);
    if (!stateObj) continue;
    const dc = stateObj.attributes.device_class as string | undefined;
    if (isDefaultShowName(dc)) result.add(entityId);
  }
  return result;
}

function getBadgeNamesConfig(
  areaId: string,
  config: Simon42StrategyConfig
): { namesVisible: string[]; namesHidden: string[] } {
  const groups = areaOptionsFor(config, areaId)?.groups_options;
  const opts = groups ? (Reflect.get(groups, 'badges') as GroupOptions | undefined) : undefined;
  return {
    namesVisible: opts?.names_visible || [],
    namesHidden: opts?.names_hidden || [],
  };
}

function getHiddenEntitiesForArea(areaId: string, config: Simon42StrategyConfig): Record<string, string[]> {
  const areaOptions = areaOptionsFor(config, areaId);
  if (!areaOptions || !areaOptions.groups_options) {
    return {};
  }

  const hidden: Record<string, string[]> = {};
  for (const [group, options] of Object.entries(areaOptions.groups_options)) {
    if (options.hidden) {
      Reflect.set(hidden, group, options.hidden);
    }
  }

  return hidden;
}

function getEntityOrdersForArea(areaId: string, config: Simon42StrategyConfig): Record<string, string[]> {
  const areaOptions = areaOptionsFor(config, areaId);
  if (!areaOptions || !areaOptions.groups_options) {
    return {};
  }

  const orders: Record<string, string[]> = {};
  for (const [group, options] of Object.entries(areaOptions.groups_options)) {
    if (options.order) {
      Reflect.set(orders, group, options.order);
    }
  }

  return orders;
}
