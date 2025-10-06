// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR
// ====================================================================
import { getEditorStyles } from './editor/simon42-editor-styles.js';
import { renderEditorHTML } from './editor/simon42-editor-template.js';
import { 
  attachEnergyCheckboxListener,
  attachSubviewsCheckboxListener,
  attachAreaCheckboxListeners,
  attachDragAndDropListeners,
  sortAreaItems
} from './editor/simon42-editor-handlers.js';

class Simon42DashboardStrategyEditor extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass || !this._config) {
      return;
    }

    const showEnergy = this._config.show_energy !== false;
    const showSubviews = this._config.show_subviews === true;
    const allAreas = Object.values(this._hass.areas).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    const hiddenAreas = this._config.areas_display?.hidden || [];
    const areaOrder = this._config.areas_display?.order || [];

    // Setze HTML-Inhalt mit Styles und Template
    this.innerHTML = `
      <style>${getEditorStyles()}</style>
      ${renderEditorHTML({ allAreas, hiddenAreas, areaOrder, showEnergy, showSubviews })}
    `;

    // Binde Event-Listener
    attachEnergyCheckboxListener(this, (showEnergy) => this._showEnergyChanged(showEnergy));
    attachSubviewsCheckboxListener(this, (showSubviews) => this._showSubviewsChanged(showSubviews));
    attachAreaCheckboxListeners(this, (areaId, isVisible) => this._areaVisibilityChanged(areaId, isVisible));
    
    // Sortiere die Area-Items nach displayOrder
    sortAreaItems(this);
    
    // Drag & Drop Event Listener
    attachDragAndDropListeners(
      this,
      () => this._updateAreaOrder()
    );
  }

  _updateAreaOrder() {
    const areaList = this.querySelector('#area-list');
    const items = Array.from(areaList.querySelectorAll('.area-item'));
    const newOrder = items.map(item => item.dataset.areaId);

    const newConfig = {
      ...this._config,
      areas_display: {
        ...this._config.areas_display,
        order: newOrder
      }
    };

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _showEnergyChanged(showEnergy) {
    if (!this._config || !this._hass) {
      return;
    }

    const newConfig = {
      ...this._config,
      show_energy: showEnergy
    };

    // Wenn der Standardwert (true) gesetzt ist, entfernen wir die Property
    if (showEnergy === true) {
      delete newConfig.show_energy;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _showSubviewsChanged(showSubviews) {
    if (!this._config || !this._hass) {
      return;
    }

    const newConfig = {
      ...this._config,
      show_subviews: showSubviews
    };

    // Wenn der Standardwert (false) gesetzt ist, entfernen wir die Property
    if (showSubviews === false) {
      delete newConfig.show_subviews;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _areaVisibilityChanged(areaId, isVisible) {
    if (!this._config || !this._hass) {
      return;
    }

    let hiddenAreas = [...(this._config.areas_display?.hidden || [])];
    
    if (isVisible) {
      // Entferne aus hidden
      hiddenAreas = hiddenAreas.filter(id => id !== areaId);
    } else {
      // Füge zu hidden hinzu
      if (!hiddenAreas.includes(areaId)) {
        hiddenAreas.push(areaId);
      }
    }

    const newConfig = {
      ...this._config,
      areas_display: {
        ...this._config.areas_display,
        hidden: hiddenAreas
      }
    };

    // Entferne hidden array wenn leer
    if (newConfig.areas_display.hidden.length === 0) {
      delete newConfig.areas_display.hidden;
    }

    // Entferne areas_display wenn leer
    if (Object.keys(newConfig.areas_display).length === 0) {
      delete newConfig.areas_display;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _fireConfigChanged(config) {
    const event = new CustomEvent('config-changed', {
      detail: { config },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
}

// Registriere Custom Element
customElements.define("simon42-dashboard-strategy-editor", Simon42DashboardStrategyEditor);
