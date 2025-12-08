// ====================================================================
// SIMON42 EDITOR LIST STYLES
// ====================================================================
// Entity lists, area/group/entity items, expansion panels, and list containers

export function getListStyles() {
  return `
    /* Styles for Home Assistant's official editor components */
    ha-expansion-panel {
      margin-bottom: 16px;
    }
    
    /* Remove background from expansion panel content */
    ha-expansion-panel .content {
      background: transparent !important;
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
    
    /* Hidden area styling */
    ha-md-list-item.area-hidden {
      opacity: 0.6;
      /* Allow clicking to activate hidden areas */
      cursor: pointer;
    }
    
    /* Drag handle should still work for hidden areas */
    ha-md-list-item.area-hidden .handle {
      cursor: grab;
    }
    
    ha-md-list-item.area-hidden:hover {
      background: var(--secondary-background-color);
    }
    
    .area-hidden-hint {
      font-size: 11px;
      color: var(--secondary-text-color);
      font-style: italic;
      margin-top: 2px;
      display: block;
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
    
    /* Standardized Entity List Styles */
    .entity-list-container {
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .entity-list-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid var(--divider-color);
      background: transparent;
    }
    
    .entity-list-item:last-child {
      border-bottom: none;
    }
    
    .entity-list-drag-handle {
      margin-right: 12px;
      cursor: grab;
      color: var(--secondary-text-color);
      flex-shrink: 0;
    }
    
    .entity-list-drag-handle:active {
      cursor: grabbing;
    }
    
    .entity-list-content {
      flex: 1;
      font-size: 14px;
      min-width: 0;
    }
    
    .entity-list-name {
      font-weight: 500;
      color: var(--primary-text-color);
    }
    
    .entity-list-id {
      margin-left: 8px;
      font-size: 12px;
      color: var(--secondary-text-color);
      font-family: monospace;
    }
    
    .entity-list-meta {
      font-size: 11px;
      color: var(--secondary-text-color);
      margin-top: 2px;
      display: block;
    }
    
    .entity-list-remove-btn {
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      flex-shrink: 0;
      font-size: 14px;
      line-height: 1;
    }
    
    .entity-list-remove-btn:hover {
      background: var(--secondary-background-color);
      border-color: var(--primary-color);
    }
    
    .entity-list-select {
      min-width: 150px;
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
    
    .entity-list-select:hover {
      border-color: var(--primary-color);
    }
    
    .entity-list-select:focus {
      border-color: var(--primary-color);
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    
    .entity-list-pattern-text {
      flex: 1;
      font-size: 14px;
      font-family: monospace;
      word-break: break-all;
      white-space: pre-wrap;
      min-width: 0;
    }
  `;
}
