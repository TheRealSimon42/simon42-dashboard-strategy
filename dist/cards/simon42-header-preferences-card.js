// ====================================================================
// SIMON42 HEADER PREFERENCES CARD - Compact Header Preferences
// ====================================================================
// Compact card for header with language and time format toggles
// ====================================================================

import { t, getLanguage, setLanguage, initLanguage } from '../utils/simon42-i18n.js';
import { getUserPreferences } from '../utils/simon42-user-preferences.js';
import { logDebug, logInfo } from '../utils/simon42-logger.js';

class Simon42HeaderPreferencesCard extends HTMLElement {
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
        ha-card {
          box-shadow: none !important;
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
        }
        .header-preferences {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 8px;
          justify-content: flex-end;
        }
        .preference-group {
          display: flex;
          gap: 4px;
          align-items: center;
          background: var(--divider-color, rgba(0,0,0,0.1));
          border-radius: 12px;
          padding: 2px;
        }
        .toggle-button {
          padding: 4px 10px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: var(--primary-text-color, #000);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 32px;
          text-align: center;
        }
        .toggle-button:hover {
          background: rgba(0, 0, 0, 0.05);
        }
        .toggle-button.active {
          background: var(--primary-color, #03a9f4);
          color: var(--text-primary-color, #fff);
        }
        .separator {
          width: 1px;
          height: 20px;
          background: var(--divider-color, rgba(0,0,0,0.1));
          margin: 0 4px;
        }
      </style>
      <div class="header-preferences">
        <div class="preference-group">
          <button class="toggle-button ${currentLanguage === 'de' ? 'active' : ''}" 
                  data-preference="language" 
                  data-value="de"
                  title="${t('languageToggle')}: DE">
            DE
          </button>
          <button class="toggle-button ${currentLanguage === 'en' ? 'active' : ''}" 
                  data-preference="language" 
                  data-value="en"
                  title="${t('languageToggle')}: EN">
            EN
          </button>
        </div>
        <div class="separator"></div>
        <div class="preference-group">
          <button class="toggle-button ${!hour12 ? 'active' : ''}" 
                  data-preference="time_format" 
                  data-value="24"
                  title="${t('timeFormatToggle')}: 24h">
            24h
          </button>
          <button class="toggle-button ${hour12 ? 'active' : ''}" 
                  data-preference="time_format" 
                  data-value="12"
                  title="${t('timeFormatToggle')}: 12h">
            12h
          </button>
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
    logDebug('[Header Preferences] Preference change:', preference, '=', value);

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
    logInfo('[Header Preferences] Preferences saved to localStorage:', stored);

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

customElements.define('simon42-header-preferences-card', Simon42HeaderPreferencesCard);

// Register for card picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'simon42-header-preferences-card',
  name: 'Simon42 Header Preferences Card',
  description: 'Compact header card for dashboard language and time format preferences'
});

