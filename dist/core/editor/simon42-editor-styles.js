// ====================================================================
// SIMON42 EDITOR STYLES
// ====================================================================
// Styles für den Dashboard Strategy Editor

export function getEditorStyles() {
  return `
    simon42-dashboard-strategy-editor {
      display: block;
      padding: 0 !important;
      margin: 0 !important;
    }
    
    /* Remove spacing from parent containers */
    ha-card-editor,
    ha-card-editor > *,
    ha-card-editor ha-card {
      padding-top: 0 !important;
      margin-top: 0 !important;
    }
    
    .card-config {
      padding: 0 !important;
      position: relative;
      margin: 0 !important;
    }
    
    .card-config > .editor-navigation-bar {
      margin-top: 0 !important;
      margin-bottom: 16px;
      padding-top: 12px;
      padding-bottom: 12px;
      position: relative !important;
      top: 0 !important;
    }
    
    .editor-navigation-bar {
      position: relative;
      z-index: 100;
      display: flex !important;
      flex-direction: row !important;
      align-items: center;
      gap: 6px;
      padding: 12px 16px;
      margin: 0 0 16px 0;
      background: var(--card-background-color);
      border-bottom: 1px solid var(--divider-color);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      flex-wrap: nowrap !important;
      overflow-x: auto;
      overflow-y: hidden;
      box-sizing: border-box;
      min-height: 44px;
    }
    
    .editor-navigation-bar::-webkit-scrollbar {
      height: 4px;
    }
    
    .editor-navigation-bar::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .editor-navigation-bar::-webkit-scrollbar-thumb {
      background: var(--divider-color);
      border-radius: 2px;
    }
    
    .card-config > .section-group {
      margin: 16px;
      margin-top: 0;
    }
    
    .card-config > .section-group:first-of-type {
      margin-top: 0;
    }
    
    .section {
      margin-bottom: 24px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
      color: var(--primary-text-color);
    }
    
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
    
    /* Styles for Home Assistant's official editor components */
    ha-expansion-panel {
      margin-bottom: 16px;
    }
    
    ha-items-display-editor {
      display: block;
    }
    
    ha-md-list {
      padding: 0;
    }
    
    ha-md-list-item.draggable {
      cursor: default;
    }
    
    ha-md-list-item.draggable .handle {
      cursor: grab;
      color: var(--secondary-text-color);
    }
    
    ha-md-list-item.draggable .handle:active {
      cursor: grabbing;
    }
    
    /* Entity Name Translation native styling */
    .translation-lang-selectors {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
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
    
    /* Ensure proper spacing for area content */
    .area-content {
      padding: 0;
      background: transparent;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out, padding 0.3s ease-out;
    }
    
    .area-content[style*="block"] {
      max-height: 5000px;
      padding-top: 4px;
      padding-bottom: 8px;
    }
    
    .area-checkbox {
      margin-right: 12px;
    }
    
    /* Smaller switches for list contexts (area, group, entity checkboxes) */
    .area-checkbox.ios-switch,
    .group-checkbox.ios-switch,
    .entity-checkbox.ios-switch {
      width: 44px;
      height: 22px;
      border-radius: 11px;
      margin-right: 12px;
    }
    
    .area-checkbox.ios-switch::before,
    .group-checkbox.ios-switch::before,
    .entity-checkbox.ios-switch::before {
      width: 18px;
      height: 18px;
      top: 2px;
      left: 2px;
    }
    
    .area-checkbox.ios-switch:checked::before,
    .group-checkbox.ios-switch:checked::before,
    .entity-checkbox.ios-switch:checked::before {
      transform: translateX(22px);
    }
    
    .area-checkbox.ios-switch:active::before,
    .group-checkbox.ios-switch:active::before,
    .entity-checkbox.ios-switch:active::before {
      width: 24px;
    }
    
    .area-checkbox.ios-switch:checked:active::before,
    .group-checkbox.ios-switch:checked:active::before,
    .entity-checkbox.ios-switch:checked:active::before {
      transform: translateX(14px);
    }
    
    .area-name {
      flex: 1;
    }
    
    .area-icon {
      margin-left: 8px;
      margin-right: 12px;
      color: var(--secondary-text-color);
    }
    
    .expand-button {
      background: none;
      border: none;
      padding: 4px 8px;
      cursor: pointer;
      color: var(--secondary-text-color);
      transition: transform 0.2s;
    }
    
    .expand-button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    
    .expand-button.expanded .expand-icon {
      transform: rotate(90deg);
    }
    
    .expand-icon {
      display: inline-block;
      transition: transform 0.2s;
    }
    
    
    .loading-placeholder {
      padding: 16px;
      text-align: center;
      color: var(--secondary-text-color);
      font-style: italic;
      font-size: 14px;
    }
    
    .entity-groups {
      padding: 0;
      margin: 0;
    }
    
    .entity-group {
      margin-bottom: 0;
      border: none;
      border-radius: 0;
      background: transparent;
      border-bottom: 1px solid var(--divider-color);
    }
    
    .entity-group:last-child {
      border-bottom: none;
    }
    
    .entity-group-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s;
    }
    
    .entity-group-header:hover {
      background: var(--secondary-background-color);
    }
    
    /* ha-switch for groups and entities */
    .entity-group-header ha-switch,
    .entity-item ha-switch {
      margin-right: 8px;
      flex-shrink: 0;
    }
    
    .group-checkbox[data-indeterminate="true"] {
      opacity: 0.6;
    }
    
    .entity-group-header ha-icon {
      margin-right: 12px;
      --mdc-icon-size: 20px;
      color: var(--primary-text-color);
    }
    
    .group-name {
      flex: 1;
      font-weight: 400;
      font-size: 14px;
      color: var(--primary-text-color);
    }
    
    .entity-count {
      color: var(--secondary-text-color);
      font-size: 12px;
      margin-right: 12px;
    }
    
    .expand-button-small {
      background: none;
      border: none;
      padding: 4px 8px;
      cursor: pointer;
      color: var(--secondary-text-color);
      transition: transform 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .expand-button-small:hover {
      color: var(--primary-text-color);
    }
    
    .expand-button-small.expanded .expand-icon-small {
      transform: rotate(90deg);
    }
    
    .expand-icon-small {
      display: inline-block;
      font-size: 10px;
      transition: transform 0.2s;
    }
    
    .entity-list {
      padding: 0 16px 0 48px;
      border-top: none;
      background: transparent;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out, padding 0.3s ease-out;
    }
    
    .entity-list.expanded {
      max-height: 2000px;
      padding-top: 4px;
      padding-bottom: 8px;
    }
    
    .entity-item {
      display: flex;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color);
    }
    
    .entity-item:last-child {
      border-bottom: none;
    }
    
    /* Entity checkboxes are now MDC switches, handled above */
    
    .entity-name {
      flex: 1;
      font-size: 14px;
    }
    
    .entity-id {
      font-size: 11px;
      color: var(--secondary-text-color);
      font-family: monospace;
      margin-left: 8px;
    }
    
    .empty-state {
      padding: 16px;
      text-align: center;
      color: var(--secondary-text-color);
      font-style: italic;
      font-size: 14px;
    }
    
    .nav-item {
      display: inline-flex !important;
      flex-direction: row !important;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      transition: all 0.2s;
      font-size: 13px;
      white-space: nowrap !important;
      flex-shrink: 0;
      min-width: fit-content;
      height: auto;
      width: auto !important;
    }
    
    .nav-item-label {
      display: inline-block;
      white-space: nowrap;
    }
    
    .nav-item:hover {
      background: var(--secondary-background-color);
      border-color: var(--primary-color);
    }
    
    .nav-item.active {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }
    
    .nav-item ha-icon {
      --mdc-icon-size: 18px;
    }
    
    /* Section Groups */
    .section-group {
      margin-bottom: 16px;
      border: none;
      border-radius: 0;
      overflow: visible;
      background: transparent;
    }
    
    .section-group-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      cursor: pointer;
      user-select: none;
      background: var(--card-background-color);
      transition: background-color 0.2s;
    }
    
    .section-group-header:hover {
      background: var(--secondary-background-color);
    }
    
    .section-group-chevron {
      margin-right: 12px;
      font-size: 12px;
      color: var(--secondary-text-color);
      transition: transform 0.2s;
      display: inline-block;
      width: 16px;
      text-align: center;
    }
    
    .section-group-header.expanded .section-group-chevron {
      transform: rotate(90deg);
    }
    
    .section-group-title {
      flex: 1;
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    
    .section-group-content {
      padding: 16px;
      border-top: none;
      background: transparent;
      overflow: hidden;
      transition: max-height 0.3s ease-out, padding 0.3s ease-out;
    }
    
    .section-group-content:not(.expanded) {
      max-height: 0;
      padding-top: 0;
      padding-bottom: 0;
    }
    
    .section-group-content.expanded {
      max-height: 10000px;
    }
    
    @media (max-width: 600px) {
      .editor-navigation-bar {
        flex-direction: row !important;
        padding: 6px 8px;
        gap: 4px;
      }
      
      .nav-item {
        flex-direction: row !important;
        flex: 1 1 0;
        padding: 6px 8px;
        font-size: 12px;
        justify-content: center;
        min-width: 0;
      }
      
      .nav-item-label {
        display: none;
      }
      
      .nav-item ha-icon {
        --mdc-icon-size: 20px;
      }
    }
    
    @media (max-width: 480px) {
      .editor-navigation-bar {
        flex-direction: row !important;
        padding: 6px 4px;
        gap: 4px;
      }
      
      .nav-item {
        flex-direction: row !important;
        flex: 1 1 0;
        padding: 6px 8px;
        justify-content: center;
        min-width: 0;
      }
      
      .nav-item-label {
        display: none;
      }
    }
  `;
}