// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR: COLLAPSIBLE PANEL SHELL
// ====================================================================
// Wraps every editor panel in a collapsible card with an icon header
// (visual anchor while scrolling, see #354). The expanded/collapsed
// state persists per browser in localStorage; panels absent from the
// stored set default to collapsed, so newly added panels start tidy.
// A collapsed panel's body is not rendered at all — panels with
// expensive bodies (areas) cost nothing while closed.
// ====================================================================

/* eslint-disable xss/no-mixed-html, @typescript-eslint/no-confusing-void-expression --
   False positive: lit-html's `html` tag escapes every interpolation by
   construction. Codacy's legacy ESLint 8 engine misreads lit render
   functions, DOM Element locals and input event payloads as raw HTML. The
   void-expression rule fights the codebase's established concise event-
   handler arrows (`(checked) => host._toggleChanged(...)`). */
import { html, nothing, type TemplateResult } from 'lit';
import { localize } from '../../utils/localize';
import type { StrategyEditorHost } from '../editor-host';

export interface PanelMeta {
  /** Stable key used for state persistence — never change once shipped. */
  key: string;
  /** MDI icon shown in the header. */
  icon: string;
  /** i18n key for the header label (reuses the former section titles). */
  labelKey: string;
  /** Optional video-tutorial GIF link shown in the header. */
  tutorialUrl?: string;
}

const STORAGE_KEY = 's42-editor-expanded-panels';

/** Load the persisted set of expanded panel keys (empty = all collapsed). */
export function loadExpandedPanels(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((k): k is string => typeof k === 'string'));
    }
  } catch {
    // Private mode / storage disabled — fall back to session-only state
  }
  return new Set();
}

function persistExpandedPanels(expanded: Set<string>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...expanded]));
  } catch {
    // Private mode / storage disabled — state stays session-only
  }
}

function togglePanel(host: StrategyEditorHost, key: string): void {
  if (host._expandedPanels.has(key)) {
    host._expandedPanels.delete(key);
  } else {
    host._expandedPanels.add(key);
  }
  persistExpandedPanels(host._expandedPanels);
  host.requestUpdate();
}

export function renderCollapsiblePanel(
  host: StrategyEditorHost,
  meta: PanelMeta,
  body: () => TemplateResult,
): TemplateResult {
  const expanded = host._expandedPanels.has(meta.key);

  return html`
    <div class="section panel${expanded ? '' : ' collapsed'}">
      <button
        type="button"
        class="panel-header"
        aria-expanded=${expanded ? 'true' : 'false'}
        @click=${() => togglePanel(host, meta.key)}
      >
        <ha-icon class="panel-icon" icon=${meta.icon}></ha-icon>
        <span class="panel-title">${localize(meta.labelKey)}</span>
        ${meta.tutorialUrl
          ? html`<a
              href=${meta.tutorialUrl}
              target="_blank"
              rel="noopener"
              class="panel-tutorial"
              title=${localize('editor.video_tutorial')}
              @click=${(e: Event) => { e.stopPropagation(); }}
            >&#x1F3AC;</a>`
          : nothing}
        <ha-icon class="panel-chevron" icon="mdi:chevron-down"></ha-icon>
      </button>
      ${expanded ? html`<div class="panel-body">${body()}</div>` : nothing}
    </div>
  `;
}
