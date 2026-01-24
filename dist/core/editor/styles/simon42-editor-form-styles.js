// ====================================================================
// SIMON42 EDITOR FORM STYLES
// ====================================================================
// Form elements, inputs, selects, buttons, and descriptions

export function getFormStyles() {
  return `
    .form-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .form-row input[type="radio"] {
      margin-right: 8px;
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    
    .form-row input[type="radio"]:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    
    /* ha-switch styles - Home Assistant uses these by default, but ensure proper spacing */
    .form-row ha-switch {
      margin-right: 12px;
      flex-shrink: 0;
    }
    
    .form-row label {
      cursor: pointer;
      user-select: none;
    }
    
    .form-row label.disabled-label {
      cursor: not-allowed;
      opacity: 0.5;
    }
    
    /* Indented sub-options that only show when parent switch is enabled */
    .sub-option {
      margin-left: 24px;
      margin-top: 12px;
      border-left: 2px solid var(--divider-color);
      padding-left: 16px;
    }
    
    /* Nested sub-options (sub-options of sub-options) */
    .sub-option .sub-option {
      margin-left: 0;
      margin-top: 12px;
    }
    
    .sub-option .form-row {
      margin-left: 0;
    }
    
    .sub-option .section-title {
      margin-left: 0;
    }

    .form-row ha-entity-picker {
      flex: 1;
      max-width: 300px;
    }

    .form-row select {
      cursor: pointer;
      font-family: inherit;
      font-size: 14px;
    }
    
    .form-row select:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    
    .form-row button {
      cursor: pointer;
      font-family: inherit;
    }
    
    .form-row button:hover:not(:disabled) {
      opacity: 0.9;
    }
    
    .form-row button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
    
    .description {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-top: 4px;
      margin-left: 26px;
      margin-bottom: 16px;
    }
    
    .description strong {
      font-weight: 600;
      color: var(--primary-text-color);
    }
    
    /* Entity Name Translation native styling */
    .translation-lang-selectors {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    /* Mobile: Remove margins from Entity Translation List items */
    @media (max-width: 600px) {
      .entity-name-translation-item {
        margin-left: 0 !important;
        margin-right: 0 !important;
        padding-left: 8px !important;
        padding-right: 8px !important;
      }
      
      .entity-name-translation-item ha-md-list-item {
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
    }
    
    .native-select {
      min-width: 100px;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 12px;
      font-family: inherit;
      cursor: pointer;
      outline: none;
    }
    
    .native-select:hover {
      border-color: var(--primary-color);
    }
    
    .native-select:focus {
      border-color: var(--primary-color);
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    
    .translation-arrow {
      color: var(--secondary-text-color);
      font-size: 14px;
      flex-shrink: 0;
    }
    
    .translation-add-form {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    
    .native-input {
      flex: 1;
      min-width: 120px;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 14px;
      font-family: inherit;
      outline: none;
    }
    
    .native-input:hover {
      border-color: var(--primary-color);
    }
    
    .native-input:focus {
      border-color: var(--primary-color);
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    
    .translation-lang-select {
      min-width: 100px;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 14px;
      font-family: inherit;
      cursor: pointer;
      outline: none;
    }
    
    .translation-lang-select:hover {
      border-color: var(--primary-color);
    }
    
    .translation-lang-select:focus {
      border-color: var(--primary-color);
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    
    /* Add button - consistent styling for all "Add" buttons */
    .add-btn {
      flex-shrink: 0;
      padding: 8px 16px;
      border-radius: 4px;
      border: 1px solid var(--divider-color);
      background: var(--primary-color);
      color: var(--text-primary-color);
      cursor: pointer;
      white-space: nowrap;
      font-family: inherit;
      font-size: 14px;
    }
    
    .add-btn:hover:not(:disabled) {
      opacity: 0.9;
    }
    
    .add-btn:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  `;
}
