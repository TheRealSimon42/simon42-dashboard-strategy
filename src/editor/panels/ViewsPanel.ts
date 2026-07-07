// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR PANEL: VIEWS
// ====================================================================
// Extracted verbatim from StrategyEditor.ts (module split).
// ====================================================================

import { html, type TemplateResult } from 'lit';
import { localize } from '../../utils/localize';
import type { StrategyEditorHost } from '../editor-host';

export function renderViewsSection(host: StrategyEditorHost): TemplateResult {
  const showSummaryViews = host._config.show_summary_views === true;
  const showRoomViews = host._config.show_room_views === true;

  return html`
    <div class="section">
      <div class="section-title">${localize('editor.section_views')}</div>

      ${host._renderCheckbox('show-summary-views', localize('editor.show_summary_views'), showSummaryViews,
        (checked) => host._toggleChanged('show_summary_views', checked, false))}
      <div class="description">${localize('editor.show_summary_views_desc')}</div>

      ${host._renderCheckbox('show-room-views', localize('editor.show_room_views'), showRoomViews,
        (checked) => host._toggleChanged('show_room_views', checked, false))}
      <div class="description">${localize('editor.show_room_views_desc')}</div>
    </div>
  `;
}
