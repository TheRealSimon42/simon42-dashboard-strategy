// ====================================================================
// VIDEO TIP CARD — one curated simon42 video with a "seen" dismissal
// ====================================================================
// Static content: renders once from its config, no hass-driven updates
// (HA still assigns .hass on every state change — it's not a declared
// reactive property, so Lit never re-renders for it). "Gesehen" writes
// the tip id to localStorage (per browser) and hides the card
// immediately; the next strategy generate skips it entirely.
// ====================================================================

import { LitElement, html, css } from 'lit';
import { localize } from '../utils/localize';
import { dismissTip } from '../utils/video-tips';

interface VideoTipCardConfig {
  type: string;
  tip_id: string;
  title: string;
  url: string;
}

class Simon42VideoTipCard extends LitElement {
  static properties = {
    _dismissed: { state: true },
  };

  public hass?: unknown; // assigned by HA, intentionally not reactive
  private _config!: VideoTipCardConfig;
  private _dismissed = false;

  static styles = css`
    :host {
      display: block;
    }
    :host([hidden]) {
      display: none;
    }
    ha-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      box-sizing: border-box;
    }
    .icon {
      --mdc-icon-size: 32px;
      color: var(--red-color, #f44336);
      flex-shrink: 0;
    }
    .body {
      flex: 1;
      min-width: 0;
    }
    .title {
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text-color);
      line-height: 1.3;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    a.watch {
      color: var(--primary-color);
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      padding: 6px 8px;
      border-radius: 6px;
    }
    a.watch:hover {
      background: rgba(var(--rgb-primary-color, 33, 150, 243), 0.12);
    }
    button.dismiss {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--secondary-text-color);
      padding: 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
    }
    button.dismiss:hover {
      color: var(--primary-text-color);
    }
  `;

  setConfig(config: VideoTipCardConfig): void {
    if (!config.tip_id || !config.url || !config.title) {
      throw new Error('simon42-video-tip-card: tip_id, title and url are required');
    }
    this._config = config;
  }

  private _dismiss(): void {
    dismissTip(this._config.tip_id);
    this._dismissed = true;
    this.toggleAttribute('hidden', true);
  }

  protected render() {
    if (this._dismissed) return html``;
    return html`
      <ha-card>
        <ha-icon class="icon" icon="mdi:youtube"></ha-icon>
        <div class="body">
          <div class="title">${this._config.title}</div>
        </div>
        <div class="actions">
          <a class="watch" href=${this._config.url} target="_blank" rel="noopener noreferrer">
            ${localize('maintenance.video_tip_watch')}
          </a>
          <button
            class="dismiss"
            title=${localize('maintenance.video_tip_dismiss')}
            @click=${() => { this._dismiss(); }}
          >
            <ha-icon icon="mdi:check"></ha-icon>
          </button>
        </div>
      </ha-card>
    `;
  }

  getCardSize(): number {
    return 1;
  }
}

customElements.define('simon42-video-tip-card', Simon42VideoTipCard);

// Deliberately NOT registered in window.customCards — the card only makes
// sense inside the maintenance view (same reasoning as the summary card).
