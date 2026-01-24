// ====================================================================
// CONFIG MANAGER - Centralized Config Management Utility
// ====================================================================
// Handles property updates and default value cleanup
// Eliminates duplication in editor config update methods
// ====================================================================

/**
 * Centralized config management utility
 * Handles property updates and default value cleanup
 */
export class ConfigManager {
  constructor(editor) {
    this.editor = editor;
  }

  /**
   * Updates a config property, removing it if it matches the default value
   * @param {string} key - Config property key
   * @param {*} value - New value
   * @param {*} defaultValue - Default value (property removed if value === defaultValue)
   * @param {Function} [validator] - Optional validator function
   */
  updateProperty(key, value, defaultValue, validator = null) {
    if (!this.editor._config || !this.editor._hass) {
      return;
    }

    // Validate if validator provided
    if (validator && !validator(value)) {
      return;
    }

    const newConfig = { ...this.editor._config };

    if (value === defaultValue) {
      delete newConfig[key];
    } else {
      newConfig[key] = value;
    }

    this.editor._config = newConfig;
    this.editor._fireConfigChanged(newConfig);
  }

  /**
   * Updates a config property with custom cleanup logic
   * @param {string} key - Config property key
   * @param {*} value - New value
   * @param {Function} shouldRemove - Function that returns true if property should be removed
   */
  updatePropertyCustom(key, value, shouldRemove) {
    if (!this.editor._config || !this.editor._hass) {
      return;
    }

    const newConfig = { ...this.editor._config };

    if (shouldRemove(value)) {
      delete newConfig[key];
    } else {
      newConfig[key] = value;
    }

    this.editor._config = newConfig;
    this.editor._fireConfigChanged(newConfig);
  }

  /**
   * Updates multiple properties at once
   * @param {Object} updates - Object with key-value pairs
   * @param {Object} defaults - Object with default values
   */
  updateProperties(updates, defaults = {}) {
    if (!this.editor._config || !this.editor._hass) {
      return;
    }

    const newConfig = { ...this.editor._config };

    Object.entries(updates).forEach(([key, value]) => {
      const defaultValue = defaults[key];
      if (value === defaultValue) {
        delete newConfig[key];
      } else {
        newConfig[key] = value;
      }
    });

    this.editor._config = newConfig;
    this.editor._fireConfigChanged(newConfig);
  }
}

