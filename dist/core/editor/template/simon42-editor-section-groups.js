// ====================================================================
// EDITOR SECTION GROUPS
// ====================================================================
// Renders navigation bar and section groups
// ====================================================================

import { t } from '../../../utils/i18n/simon42-i18n.js';

/**
 * Renders the navigation bar for quick access to section groups
 * @returns {string} HTML for navigation bar
 */
export function renderNavigationBar() {
  return `
    <div class="editor-navigation-bar">
      <button class="nav-item" data-group="dashboard-cards" type="button" title="${t('navGroupDashboardCards')}">
        <ha-icon icon="mdi:view-dashboard"></ha-icon>
        <span class="nav-item-label">${t('navGroupDashboardCardsShort')}</span>
      </button>
      <button class="nav-item" data-group="views-summaries" type="button" title="${t('navGroupViewsSummaries')}">
        <ha-icon icon="mdi:view-list"></ha-icon>
        <span class="nav-item-label">${t('navGroupViewsSummariesShort')}</span>
      </button>
      <button class="nav-item" data-group="entity-management" type="button" title="${t('navGroupEntityManagement')}">
        <ha-icon icon="mdi:home"></ha-icon>
        <span class="nav-item-label">${t('navGroupEntityManagementShort')}</span>
      </button>
      <button class="nav-item" data-group="advanced" type="button" title="${t('navGroupAdvanced')}">
        <ha-icon icon="mdi:cog"></ha-icon>
        <span class="nav-item-label">${t('navGroupAdvancedShort')}</span>
      </button>
    </div>
  `;
}

/**
 * Renders a section group (non-collapsible, visibility controlled by navigation)
 * @param {string} groupId - Unique ID for the group
 * @param {string} title - Group title (unused, kept for API compatibility)
 * @param {string} content - HTML content for the group
 * @param {boolean} isExpanded - Whether the group is visible by default (unused, kept for API compatibility)
 * @returns {string} HTML for section group
 */
export function renderSectionGroup(groupId, title, content, isExpanded = false) {
  return `
    <div class="section-group" id="${groupId}" data-group-id="${groupId}">
      ${content}
    </div>
  `;
}

