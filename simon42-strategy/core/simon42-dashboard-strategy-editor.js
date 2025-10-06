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
  attachExpandButtonListeners,
  sortAreaItems
} from './editor/simon42-editor-handlers.js';

class Simon42DashboardStrategyEditor extends HTMLElement {
  constructor() {
    super();
    // Persistenter State für aufgeklappte Areas und Gruppen
    this._expandedAreas = new Set();
    this._expandedGroups = new Map(); // Map<areaId, Set<groupKey>>
    this._isRendering = false;
  }

  setConfig(config) {
    this._config = config || {};
    // Nur rendern wenn wir nicht gerade selbst die Config ändern
    if (!this._isUpdatingConfig) {
      this._render();
    }
  }

  set hass(hass) {
    const shouldRender = !this._hass; // Nur beim ersten Mal rendern
    this._hass = hass;
    if (shouldRender) {
      this._render();
    }
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
    
    // Expand Button Listener
    attachExpandButtonListeners(
      this,
      this._hass,
      this._config,
      (areaId, group, entityId, isVisible) => this._entityVisibilityChanged(areaId, group, entityId, isVisible)
    );
    
    // Restore expanded state
    this._restoreExpandedState();
  }

  _restoreExpandedState() {
    // Restore expanded areas
    this._expandedAreas.forEach(areaId => {
      const button = this.querySelector(`.expand-button[data-area-id="${areaId}"]`);
      const content = this.querySelector(`.area-content[data-area-id="${areaId}"]`);
      
      if (button && content) {
        content.style.display = 'block';
        button.classList.add('expanded');
        
        // Restore expanded groups for this area
        const expandedGroups = this._expandedGroups.get(areaId);
        if (expandedGroups) {
          expandedGroups.forEach(groupKey => {
            const groupButton = content.querySelector(`.expand-button-small[data-area-id="${areaId}"][data-group="${groupKey}"]`);
            const entityList = content.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${groupKey}"]`);
            
            if (groupButton && entityList) {
              entityList.style.display = 'block';
              groupButton.classList.add('expanded');
            }
          });
        }
      }
    });
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

  _entityVisibilityChanged(areaId, group, entityId, isVisible) {
    if (!this._config || !this._hass) {
      return;
    }

    // Hole aktuelle groups_options für dieses Areal
    const currentAreaOptions = this._config.areas_options?.[areaId] || {};
    const currentGroupsOptions = currentAreaOptions.groups_options || {};
    const currentGroupOptions = currentGroupsOptions[group] || {};
    
    let hiddenEntities = [...(currentGroupOptions.hidden || [])];
    
    if (entityId === null) {
      // Alle Entities in der Gruppe
      // Wenn isVisible = false, alle Entities zur Hidden-Liste hinzufügen
      // Wenn isVisible = true, alle Entities aus Hidden-Liste entfernen
      
      if (!isVisible) {
        // Hole alle Entities in dieser Gruppe und füge sie zu hidden hinzu
        // Dies erfordert Zugriff auf die Entity-Liste, die wir aus dem DOM lesen können
        const entityList = this.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${group}"]`);
        if (entityList) {
          const entityCheckboxes = entityList.querySelectorAll('.entity-checkbox');
          const allEntities = Array.from(entityCheckboxes).map(cb => cb.dataset.entityId);
          hiddenEntities = [...new Set([...hiddenEntities, ...allEntities])];
        }
      } else {
        // Entferne alle Entities dieser Gruppe aus hidden
        const entityList = this.querySelector(`.entity-list[data-area-id="${areaId}"][data-group="${group}"]`);
        if (entityList) {
          const entityCheckboxes = entityList.querySelectorAll('.entity-checkbox');
          const allEntities = Array.from(entityCheckboxes).map(cb => cb.dataset.entityId);
          hiddenEntities = hiddenEntities.filter(e => !allEntities.includes(e));
        }
      }
    } else {
      // Einzelne Entity
      if (isVisible) {
        // Entferne aus hidden
        hiddenEntities = hiddenEntities.filter(e => e !== entityId);
      } else {
        // Füge zu hidden hinzu
        if (!hiddenEntities.includes(entityId)) {
          hiddenEntities.push(entityId);
        }
      }
    }

    // Baue neue Config
    const newGroupOptions = {
      ...currentGroupOptions,
      hidden: hiddenEntities
    };

    // Entferne hidden wenn leer
    if (newGroupOptions.hidden.length === 0) {
      delete newGroupOptions.hidden;
    }

    const newGroupsOptions = {
      ...currentGroupsOptions,
      [group]: newGroupOptions
    };

    // Entferne group wenn leer
    if (Object.keys(newGroupsOptions[group]).length === 0) {
      delete newGroupsOptions[group];
    }

    const newAreaOptions = {
      ...currentAreaOptions,
      groups_options: newGroupsOptions
    };

    // Entferne groups_options wenn leer
    if (Object.keys(newAreaOptions.groups_options).length === 0) {
      delete newAreaOptions.groups_options;
    }

    const newAreasOptions = {
      ...this._config.areas_options,
      [areaId]: newAreaOptions
    };

    // Entferne area wenn leer
    if (Object.keys(newAreasOptions[areaId]).length === 0) {
      delete newAreasOptions[areaId];
    }

    const newConfig = {
      ...this._config,
      areas_options: newAreasOptions
    };

    // Entferne areas_options wenn leer
    if (Object.keys(newConfig.areas_options).length === 0) {
      delete newConfig.areas_options;
    }

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _fireConfigChanged(config) {
    // Setze Flag, damit setConfig() nicht erneut rendert
    this._isUpdatingConfig = true;
    this._config = config;
    
    const event = new CustomEvent('config-changed', {
      detail: { config },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
    
    // Reset Flag nach einem Tick
    setTimeout(() => {
      this._isUpdatingConfig = false;
    }, 0);
  }
}

// Registriere Custom Element
customElements.define("simon42-dashboard-strategy-editor", Simon42DashboardStrategyEditor);