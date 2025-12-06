// ====================================================================
// SIMON42 TOOLBAR PREFERENCES - Toolbar Preferences Injection
// ====================================================================
// Injects language and time format preferences directly into the toolbar
// ====================================================================

import { t, getLanguage, setLanguage, initLanguage } from '../utils/simon42-i18n.js';
import { getUserPreferences } from '../utils/simon42-user-preferences.js';
import { logDebug, logInfo } from '../utils/simon42-logger.js';

class Simon42ToolbarPreferences extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._config = null;
    this._injected = false;
    this._shadowRoot = this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this._config = config || {};
  }

  set hass(hass) {
    this._hass = hass;
    if (hass && this._config) {
      initLanguage(this._config, hass);
      // Card ist unsichtbar, nur für Toolbar-Injection
      this._shadowRoot.innerHTML = '<style>:host { display: none !important; }</style>';
      this._injectIntoToolbar();
    }
  }

  connectedCallback() {
    // Warte bis das DOM vollständig geladen ist
    if (this._hass && this._config) {
      setTimeout(() => this._injectIntoToolbar(), 100);
    }
  }

  _injectIntoToolbar() {
    if (this._injected) return;

    // Finde die Toolbar - verschiedene Selektoren für verschiedene HA-Versionen
    let toolbar = null;
    
    // Versuche verschiedene Selektoren
    const selectors = [
      () => document.querySelector('ha-app-layout')?.shadowRoot?.querySelector('.header'),
      () => document.querySelector('ha-app-layout')?.shadowRoot?.querySelector('app-toolbar'),
      () => document.querySelector('app-toolbar'),
      () => document.querySelector('.header'),
      () => document.querySelector('[slot="header"]'),
      () => document.querySelector('ha-top-app-bar-fixed')?.shadowRoot?.querySelector('.header'),
      () => document.querySelector('ha-top-app-bar-fixed')?.shadowRoot?.querySelector('app-toolbar'),
      () => document.querySelector('ha-top-app-bar-fixed')?.shadowRoot?.querySelector('.toolbar')
    ];

    for (const selector of selectors) {
      try {
        toolbar = selector();
        if (toolbar) break;
      } catch (e) {
        // Ignore shadow DOM errors
      }
    }

    if (!toolbar) {
      // Versuche es später nochmal (maximal 5 Sekunden)
      if (!this._retryCount) this._retryCount = 0;
      if (this._retryCount < 10) {
        this._retryCount++;
        setTimeout(() => this._injectIntoToolbar(), 500);
      }
      return;
    }

    // Prüfe ob bereits injiziert
    if (toolbar.querySelector('.simon42-toolbar-preferences')) {
      this._injected = true;
      return;
    }

    const prefs = getUserPreferences(this._hass, this._config);
    const currentLanguage = prefs.language || 'de';
    const hour12 = prefs.hour12;

    // Erstelle Container für Preferences
    const container = document.createElement('div');
    container.className = 'simon42-toolbar-preferences';
    container.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
      margin-left: auto;
      margin-right: 16px;
    `;

    // Erstelle Language Toggle
    const langGroup = document.createElement('div');
    langGroup.style.cssText = `
      display: flex;
      gap: 4px;
      align-items: center;
      background: var(--divider-color, rgba(0,0,0,0.1));
      border-radius: 12px;
      padding: 2px;
    `;

    const deButton = this._createToggleButton('DE', currentLanguage === 'de', () => {
      this._handlePreferenceChange('language', 'de');
    });
    const enButton = this._createToggleButton('EN', currentLanguage === 'en', () => {
      this._handlePreferenceChange('language', 'en');
    });

    langGroup.appendChild(deButton);
    langGroup.appendChild(enButton);

    // Separator
    const separator = document.createElement('div');
    separator.style.cssText = `
      width: 1px;
      height: 20px;
      background: var(--divider-color, rgba(0,0,0,0.1));
      margin: 0 4px;
    `;

    // Erstelle Time Format Toggle
    const timeGroup = document.createElement('div');
    timeGroup.style.cssText = `
      display: flex;
      gap: 4px;
      align-items: center;
      background: var(--divider-color, rgba(0,0,0,0.1));
      border-radius: 12px;
      padding: 2px;
    `;

    const h24Button = this._createToggleButton('24h', !hour12, () => {
      this._handlePreferenceChange('time_format', '24');
    });
    const h12Button = this._createToggleButton('12h', hour12, () => {
      this._handlePreferenceChange('time_format', '12');
    });

    timeGroup.appendChild(h24Button);
    timeGroup.appendChild(h12Button);

    container.appendChild(langGroup);
    container.appendChild(separator);
    container.appendChild(timeGroup);

    // Füge Container zur Toolbar hinzu
    toolbar.appendChild(container);
    this._injected = true;

    logDebug('[Toolbar Preferences] Injected into toolbar');
  }

  _createToggleButton(text, active, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
      padding: 4px 10px;
      border: none;
      border-radius: 10px;
      background: ${active ? 'var(--primary-color, #03a9f4)' : 'transparent'};
      color: ${active ? 'var(--text-primary-color, #fff)' : 'var(--primary-text-color, #000)'};
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 32px;
      text-align: center;
    `;
    button.addEventListener('click', onClick);
    button.addEventListener('mouseenter', () => {
      if (!active) {
        button.style.background = 'rgba(0, 0, 0, 0.05)';
      }
    });
    button.addEventListener('mouseleave', () => {
      if (!active) {
        button.style.background = 'transparent';
      }
    });
    return button;
  }

  _handlePreferenceChange(preference, value) {
    logDebug('[Toolbar Preferences] Preference change:', preference, '=', value);

    // Store in localStorage for persistence
    const storageKey = 'simon42_dashboard_preferences';
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    if (preference === 'language') {
      stored.dashboard_language = value;
      setLanguage(value);
    } else if (preference === 'time_format') {
      stored.dashboard_time_format = value;
    }
    
    localStorage.setItem(storageKey, JSON.stringify(stored));
    logInfo('[Toolbar Preferences] Preferences saved to localStorage:', stored);

    // Reload page to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 300);
  }
}

customElements.define('simon42-toolbar-preferences', Simon42ToolbarPreferences);

// Register for card picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'simon42-toolbar-preferences',
  name: 'Simon42 Toolbar Preferences',
  description: 'Injects language and time format preferences directly into the toolbar'
});

