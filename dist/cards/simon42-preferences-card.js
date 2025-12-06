// ====================================================================
// SIMON42 PREFERENCES CARD - Dashboard Preferences Toggle
// ====================================================================
// Interactive card for switching language and time format
// ====================================================================

import { t, getLanguage, setLanguage, initLanguage } from '../utils/simon42-i18n.js';
import { getUserPreferences } from '../utils/simon42-user-preferences.js';
import { logDebug, logInfo } from '../utils/simon42-logger.js';

class Simon42PreferencesCard extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._config = null;
    this._shadowRoot = this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this._config = config || {};
  }

  set hass(hass) {
    this._hass = hass;
    if (hass && this._config) {
      initLanguage(this._config, hass);
      this._render();
    }
  }

  _render() {
    if (!this._hass || !this._config) {
      return;
    }

    const prefs = getUserPreferences(this._hass, this._config);
    const currentLanguage = prefs.language || 'de';
    const currentTimeFormat = prefs.timeFormat || 'language';
    const hour12 = prefs.hour12;

    // Determine display values
    const languageDisplay = currentLanguage === 'en' ? 'EN' : 'DE';
    const timeFormatDisplay = hour12 ? '12h' : '24h';

    this._shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .preferences-card {
          padding: 16px;
          background: var(--card-background-color, #fff);
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.1));
        }
        .preference-group {
          margin-bottom: 12px;
        }
        .preference-group:last-child {
          margin-bottom: 0;
        }
        .preference-label {
          font-size: 12px;
          color: var(--secondary-text-color, #888);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .toggle-container {
          display: flex;
          gap: 4px;
          background: var(--divider-color, #e0e0e0);
          border-radius: 8px;
          padding: 4px;
        }
        .toggle-button {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--primary-text-color, #000);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        .toggle-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .toggle-button.active {
          background: var(--primary-color, #03a9f4);
          color: var(--text-primary-color, #fff);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      </style>
      <div class="preferences-card">
        <div class="preference-group">
          <div class="preference-label">${t('languageToggle')}</div>
          <div class="toggle-container">
            <button class="toggle-button ${currentLanguage === 'de' ? 'active' : ''}" 
                    data-preference="language" 
                    data-value="de">
              ${t('languageDE')}
            </button>
            <button class="toggle-button ${currentLanguage === 'en' ? 'active' : ''}" 
                    data-preference="language" 
                    data-value="en">
              ${t('languageEN')}
            </button>
          </div>
        </div>
        <div class="preference-group">
          <div class="preference-label">${t('timeFormatToggle')}</div>
          <div class="toggle-container">
            <button class="toggle-button ${!hour12 ? 'active' : ''}" 
                    data-preference="time_format" 
                    data-value="24">
              ${t('timeFormat24h')}
            </button>
            <button class="toggle-button ${hour12 ? 'active' : ''}" 
                    data-preference="time_format" 
                    data-value="12">
              ${t('timeFormat12h')}
            </button>
          </div>
        </div>
      </div>
    `;

    // Attach event listeners
    this._shadowRoot.querySelectorAll('.toggle-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const preference = e.target.dataset.preference;
        const value = e.target.dataset.value;
        this._handlePreferenceChange(preference, value);
      });
    });
  }

  _handlePreferenceChange(preference, value) {
    logDebug('[Preferences Card] Preference change:', preference, '=', value);

    // Store in localStorage for persistence
    const storageKey = 'simon42_dashboard_preferences';
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    if (preference === 'language') {
      stored.dashboard_language = value;
      // Also update language immediately for UI feedback
      setLanguage(value);
    } else if (preference === 'time_format') {
      stored.dashboard_time_format = value;
    }
    
    localStorage.setItem(storageKey, JSON.stringify(stored));
    logInfo('[Preferences Card] Preferences saved to localStorage:', stored);

    // Update config
    const newConfig = { ...this._config, ...stored };
    
    // Dispatch event to update dashboard config
    const event = new CustomEvent('simon42-preference-changed', {
      detail: {
        preference,
        value,
        config: newConfig
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);

    // Reload page to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 300);
  }

  getCardSize() {
    return 1;
  }
}

customElements.define('simon42-preferences-card', Simon42PreferencesCard);

// Register for card picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'simon42-preferences-card',
  name: 'Simon42 Preferences Card',
  description: 'Toggle card for dashboard language and time format preferences'
});

