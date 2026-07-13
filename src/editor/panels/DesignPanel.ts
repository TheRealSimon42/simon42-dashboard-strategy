// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR PANEL: DESIGN (#188)
// ====================================================================
// Global theme + background image for all generated views. Thin UI over
// the native per-view `theme`/`background` keys (stamped in generate()
// via utils/design.ts). Advanced background options (size, alignment,
// repeat) stay YAML-only to keep the panel small.
// ====================================================================

/* eslint-disable xss/no-mixed-html, @typescript-eslint/no-confusing-void-expression --
   False positive: lit-html's `html` tag escapes every interpolation by
   construction. Codacy's legacy ESLint 8 engine misreads lit render
   functions, DOM Element locals and input event payloads as raw HTML. The
   void-expression rule fights the codebase's established concise event-
   handler arrows (`(checked) => host._toggleChanged(...)`). */
import { html, nothing, type TemplateResult } from 'lit';
import { localize } from '../../utils/localize';
import type { Simon42StrategyConfig } from '../../types/strategy';
import type { LovelaceViewBackgroundConfig } from '../../types/lovelace';
import type { StrategyEditorHost } from '../editor-host';

export function renderDesignSection(host: StrategyEditorHost): TemplateResult {
  const theme = host._config.theme || '';
  const background = host._config.background || {};
  const image = typeof background.image === 'string' ? background.image : '';
  const opacity = typeof background.opacity === 'number' ? background.opacity : 100;
  const fixed = background.attachment === 'fixed';
  const themeNames = Object.keys(host._hass?.themes?.themes || {}).sort((a, b) => a.localeCompare(b));

  return html`
      <div class="description" style="margin-left: 0;">${localize('editor.design_desc')}</div>

      <div class="custom-item-row" style="margin-top: 8px; align-items: center;">
        <label style="flex: 1;">${localize('editor.design_theme_label')}:</label>
        <select style="flex: 2;"
          @change=${(e: Event) => themeChanged(host, (e.target as HTMLSelectElement).value)}>
          <option value="" ?selected=${theme === ''}>${localize('editor.design_theme_default')}</option>
          ${themeNames.map((name) => html`
            <option value=${name} ?selected=${name === theme}>${name}</option>
          `)}
        </select>
      </div>

      <div class="custom-item-row" style="margin-top: 12px; align-items: center;">
        <label style="flex: 1;">${localize('editor.design_bg_image_label')}:</label>
        <input type="text" style="flex: 2;" .value=${image}
          placeholder="/local/hintergrund.jpg"
          @change=${(e: Event) => backgroundImageChanged(host, (e.target as HTMLInputElement).value.trim())} />
      </div>
      <div class="description">${localize('editor.design_bg_image_hint')}</div>

      ${image
        ? html`
          <div class="custom-item-row" style="align-items: center;">
            <label style="flex: 1;">${localize('editor.design_bg_opacity_label')}:</label>
            <input type="range" min="10" max="100" step="5" style="flex: 2;" .value=${String(opacity)}
              @change=${(e: Event) => backgroundOptionChanged(host, 'opacity', Number((e.target as HTMLInputElement).value))} />
            <span style="min-width: 42px; text-align: right;">${opacity}%</span>
          </div>
          ${host._renderCheckbox('design-bg-fixed', localize('editor.design_bg_fixed_label'), fixed,
            (checked) => backgroundOptionChanged(host, 'attachment', checked ? 'fixed' : undefined))}
        `
        : nothing}
  `;
}

function themeChanged(host: StrategyEditorHost, value: string): void {
  const newConfig: Simon42StrategyConfig = { ...host._config };
  if (value) {
    newConfig.theme = value;
  } else {
    delete newConfig.theme;
  }
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function backgroundImageChanged(host: StrategyEditorHost, image: string): void {
  const newConfig: Simon42StrategyConfig = { ...host._config };
  if (image) {
    newConfig.background = { ...(newConfig.background || {}), image };
  } else {
    // Without an image the background is meaningless — drop the whole key
    delete newConfig.background;
  }
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}

function backgroundOptionChanged(
  host: StrategyEditorHost,
  option: 'opacity' | 'attachment',
  value: number | string | undefined
): void {
  const existing = host._config.background;
  if (!existing?.image) return;

  const background: LovelaceViewBackgroundConfig = { ...existing };
  // 100% opacity / non-fixed are the native defaults — keep the config clean
  if (option === 'opacity') {
    if (typeof value === 'number' && value < 100) background.opacity = value;
    else delete background.opacity;
  } else if (value === 'fixed') {
    background.attachment = 'fixed';
  } else {
    delete background.attachment;
  }

  const newConfig: Simon42StrategyConfig = { ...host._config, background };
  host._config = newConfig;
  host._fireConfigChanged(newConfig);
}
