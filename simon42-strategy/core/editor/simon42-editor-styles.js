// ====================================================================
// SIMON42 EDITOR STYLES
// ====================================================================
// Styles für den Dashboard Strategy Editor

export function getEditorStyles() {
  return `
    .card-config {
      padding: 16px;
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
    
    .form-row input[type="checkbox"],
    .form-row input[type="radio"] {
      margin-right: 8px;
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    
    .form-row input[type="checkbox"]:disabled,
    .form-row input[type="radio"]:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    
    .form-row label {
      cursor: pointer;
      user-select: none;
    }
    
    .form-row label.disabled-label {
      cursor: not-allowed;
      opacity: 0.5;
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
    
    .area-list {
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .area-item {
      border-bottom: 1px solid var(--divider-color);
      background: var(--card-background-color);
    }
    
    .area-item:last-child {
      border-bottom: none;
    }
    
    .area-item.dragging {
      opacity: 0.5;
    }
    
    .area-item.drag-over {
      border-top: 2px solid var(--primary-color);
    }
    
    .area-header {
      display: flex;
      align-items: center;
      padding: 12px;
    }
    
    .drag-handle {
      margin-right: 12px;
      color: var(--secondary-text-color);
      cursor: grab;
      user-select: none;
      padding: 4px;
    }
    
    .drag-handle:active {
      cursor: grabbing;
    }
    
    .area-item.dragging {
      opacity: 0.5;
      cursor: grabbing;
    }
    
    .area-checkbox {
      margin-right: 12px;
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
    
    .area-content {
      padding: 0 12px 12px 48px;
      background: var(--secondary-background-color);
    }
    
    .loading-placeholder {
      padding: 12px;
      text-align: center;
      color: var(--secondary-text-color);
      font-style: italic;
    }
    
    .entity-groups {
      padding-top: 8px;
    }
    
    .entity-group {
      margin-bottom: 8px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      background: var(--card-background-color);
    }
    
    .entity-group-header {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      cursor: pointer;
      user-select: none;
    }
    
    .entity-group-header:hover {
      background: var(--secondary-background-color);
    }
    
    .group-checkbox {
      margin-right: 8px;
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
    
    .group-checkbox[data-indeterminate="true"] {
      opacity: 0.6;
    }
    
    .entity-group-header ha-icon {
      margin-right: 8px;
      --mdc-icon-size: 18px;
      color: var(--secondary-text-color);
    }
    
    .group-name {
      flex: 1;
      font-weight: 500;
    }
    
    .entity-count {
      color: var(--secondary-text-color);
      font-size: 12px;
      margin-right: 8px;
    }
    
    .expand-button-small {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: var(--secondary-text-color);
    }
    
    .expand-button-small.expanded .expand-icon-small {
      transform: rotate(90deg);
    }
    
    .expand-icon-small {
      display: inline-block;
      font-size: 12px;
      transition: transform 0.2s;
    }
    
    .entity-list {
      padding: 8px 12px 8px 36px;
      border-top: 1px solid var(--divider-color);
    }
    
    .entity-item {
      display: flex;
      align-items: center;
      padding: 6px 0;
    }
    
    .entity-checkbox {
      margin-right: 8px;
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
    
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
      padding: 24px;
      text-align: center;
      color: var(--secondary-text-color);
      font-style: italic;
    }
  `;
}