// ====================================================================
// SIMON42 EDITOR STYLES
// ====================================================================
// Styles für den Dashboard Strategy Editor
// Main orchestrator that combines all style modules

import { getBaseStyles } from './styles/simon42-editor-base-styles.js';
import { getNavigationStyles } from './styles/simon42-editor-navigation-styles.js';
import { getFormStyles } from './styles/simon42-editor-form-styles.js';
import { getListStyles } from './styles/simon42-editor-list-styles.js';

export function getEditorStyles() {
  return `
    ${getBaseStyles()}
    ${getNavigationStyles()}
    ${getFormStyles()}
    ${getListStyles()}
  `;
}