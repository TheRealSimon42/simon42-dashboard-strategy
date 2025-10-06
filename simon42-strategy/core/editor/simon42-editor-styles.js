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
    
    .form-row input[type="checkbox"] {
      margin-right: 8px;
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    
    .form-row label {
      cursor: pointer;
      user-select: none;
    }
    
    .description {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-top: 4px;
      margin-left: 26px;
      margin-bottom: 16px;
    }
    
    .area-list {
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .area-item {
      display: flex;
      align-items: center;
      padding: 12px;
      border-bottom: 1px solid var(--divider-color);
      background: var(--card-background-color);
      cursor: move;
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
    
    .drag-handle {
      margin-right: 12px;
      color: var(--secondary-text-color);
      cursor: move;
    }
    
    .area-checkbox {
      margin-right: 12px;
    }
    
    .area-name {
      flex: 1;
    }
    
    .area-icon {
      margin-left: 8px;
      color: var(--secondary-text-color);
    }
    
    .empty-state {
      padding: 24px;
      text-align: center;
      color: var(--secondary-text-color);
      font-style: italic;
    }
  `;
}
