// ====================================================================
// Stack manual cards and generated device sections in one Lovelace section.
// Home Assistant creates the nested hui-section elements and passes them
// through the section layout's `sections` property.
// ====================================================================

import { LitElement, css, html } from 'lit';
import type { LovelaceSectionConfig } from '../types/lovelace';

class Simon42StackedSection extends LitElement {
  static properties = {
    sections: { attribute: false },
  };

  public sections: HTMLElement[] = [];

  public setConfig(_config: LovelaceSectionConfig): void {
    // Child sections are provided by Home Assistant after setConfig.
    this.requestUpdate();
  }

  protected render() {
    return html`<div class="stack">${this.sections.map((section) => html`<div class="part">${section}</div>`)}</div>`;
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    .stack {
      display: flex;
      flex-direction: column;
      gap: var(--ha-section-grid-row-gap, 8px);
    }
    .part {
      min-width: 0;
    }
  `;
}

if (!customElements.get('simon42-stacked-section')) {
  customElements.define('simon42-stacked-section', Simon42StackedSection);
}
