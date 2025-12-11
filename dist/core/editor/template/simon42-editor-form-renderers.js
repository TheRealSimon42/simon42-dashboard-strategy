// ====================================================================
// EDITOR FORM RENDERERS
// ====================================================================
// Renders form components (switches, inputs, selects)
// ====================================================================

/**
 * Renders a Home Assistant switch component (ha-switch)
 * @param {string} id - Element ID
 * @param {boolean} checked - Whether switch is checked
 * @param {string} ariaLabel - Aria label for accessibility
 * @param {boolean} disabled - Whether switch is disabled
 * @returns {string} HTML string for ha-switch
 */
export function renderMDCSwitch(id, checked = false, ariaLabel = '', disabled = false) {
  // Ensure checked is explicitly a boolean
  const checkedValue = checked === true;
  const disabledValue = disabled === true;
  return `
    <ha-switch 
      id="${id}" 
      .checked="${checkedValue}"
      .disabled="${disabledValue}"
      aria-label="${ariaLabel}"
    ></ha-switch>
  `;
}

