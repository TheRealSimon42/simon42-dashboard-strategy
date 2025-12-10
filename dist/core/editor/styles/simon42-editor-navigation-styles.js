// ====================================================================
// SIMON42 EDITOR NAVIGATION STYLES
// ====================================================================
// Navigation bar and navigation item styles

export function getNavigationStyles() {
  return `
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
    
    .nav-item {
      display: inline-flex !important;
      flex-direction: row !important;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      background: transparent;
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
