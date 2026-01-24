// ====================================================================
// SIMON42 EDITOR BASE STYLES
// ====================================================================
// Base container and layout styles for the editor

export function getBaseStyles() {
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
    
    .loading-placeholder {
      padding: 16px;
      text-align: center;
      color: var(--secondary-text-color);
      font-style: italic;
      font-size: 14px;
    }
    
    .empty-state {
      padding: 12px;
      text-align: center;
      color: var(--secondary-text-color);
      font-style: italic;
      font-size: 14px;
    }
  `;
}
