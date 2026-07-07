// ====================================================================
// SIMON42 DASHBOARD STRATEGY - EDITOR STYLES
// ====================================================================
// Extracted verbatim from StrategyEditor.ts (module split). Shared by
// the editor host element; panel modules render into its shadow root.
// ====================================================================

import { css } from 'lit';

export const EDITOR_STYLES = css`
  /* -- Base layout --------------------------------------------------- */
  .card-config {
    padding: 16px;
    font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
    font-size: var(--mdc-typography-body1-font-size, 14px);
    color: var(--primary-text-color);
  }
  .section {
    margin-bottom: 16px;
    background: var(--card-background-color, #fff);
    border: 1px solid var(--divider-color, #e8e8e8);
    border-radius: var(--ha-card-border-radius, 12px);
    padding: 16px;
    transition: box-shadow 0.2s ease;
  }
  /* -- Collapsible panel shell (#354) --------------------------------- */
  .section.panel {
    padding: 0;
    overflow: hidden;
  }
  .panel-header {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 13px 16px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 15px;
    font-weight: 500;
    color: var(--primary-text-color);
    text-align: left;
    letter-spacing: 0.01em;
  }
  .panel-header:hover {
    background: var(--secondary-background-color, rgba(0, 0, 0, 0.04));
  }
  .panel-icon {
    --mdc-icon-size: 20px;
    color: var(--primary-color);
    flex-shrink: 0;
  }
  .panel-title {
    flex: 1;
    min-width: 0;
  }
  .panel-tutorial {
    color: var(--primary-color);
    text-decoration: none;
    font-size: 18px;
    line-height: 1;
  }
  .panel-chevron {
    --mdc-icon-size: 22px;
    color: var(--secondary-text-color);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }
  .panel.collapsed .panel-chevron {
    transform: rotate(-90deg);
  }
  .panel-body {
    padding: 12px 16px 16px;
    border-top: 1px solid var(--divider-color, #e8e8e8);
  }

  .section-title {
    font-size: 15px;
    font-weight: 500;
    margin: 0 0 12px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--divider-color, #e8e8e8);
    color: var(--primary-text-color);
    letter-spacing: 0.01em;
  }

  /* -- Form rows ----------------------------------------------------- */
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
    accent-color: var(--primary-color);
  }
  .form-row input[type="checkbox"]:disabled,
  .form-row input[type="radio"]:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .form-row label {
    cursor: pointer;
    user-select: none;
    font-size: 14px;
    color: var(--primary-text-color);
  }
  .form-row label.disabled-label {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .form-row .alarm-select {
    flex: 1;
    max-width: 300px;
  }
  .description {
    font-size: 12px;
    color: var(--secondary-text-color);
    margin: 2px 0 12px 26px;
    line-height: 1.4;
  }
  .description strong {
    font-weight: 600;
    color: var(--primary-text-color);
  }

  /* -- Native <select> — HA-like ------------------------------------- */
  select,
  .form-row select {
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    padding: 10px 32px 10px 12px;
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    background-color: var(--card-background-color);
    color: var(--primary-text-color);
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%236e6e6e' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 16px;
    transition: border-color 0.2s ease;
  }
  select:focus,
  .form-row select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 1px var(--primary-color);
  }
  select:hover,
  .form-row select:hover {
    border-color: var(--primary-color);
  }

  /* -- Native <input type="text/number"> — HA-like ------------------- */
  input[type="text"],
  input[type="number"] {
    font-family: inherit;
    font-size: 14px;
    padding: 10px 12px;
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    background: var(--card-background-color);
    color: var(--primary-text-color);
    transition: border-color 0.2s ease;
    box-sizing: border-box;
  }
  input[type="text"]:focus,
  input[type="number"]:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 1px var(--primary-color);
  }
  input[type="text"]:hover,
  input[type="number"]:hover {
    border-color: var(--primary-color);
  }
  input[type="text"]::placeholder {
    color: var(--secondary-text-color);
    opacity: 0.7;
  }

  /* -- Native <textarea> — YAML editors ------------------------------ */
  textarea {
    font-family: "Roboto Mono", "SFMono-Regular", "Consolas", "Liberation Mono", monospace;
    font-size: 12px;
    line-height: 1.5;
    padding: 12px;
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    background: var(--card-background-color);
    color: var(--primary-text-color);
    resize: vertical;
    min-height: 80px;
    box-sizing: border-box;
    transition: border-color 0.2s ease;
    tab-size: 2;
  }
  textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 1px var(--primary-color);
  }
  textarea:hover {
    border-color: var(--primary-color);
  }
  textarea::placeholder {
    color: var(--secondary-text-color);
    opacity: 0.7;
    font-family: inherit;
  }

  /* -- Buttons — HA-like --------------------------------------------- */
  button {
    font-family: inherit;
    font-size: 14px;
  }
  .btn-primary {
    padding: 10px 20px;
    border-radius: var(--ha-card-border-radius, 12px);
    border: none;
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    cursor: pointer;
    font-weight: 500;
    transition: opacity 0.2s ease, box-shadow 0.2s ease;
    white-space: nowrap;
  }
  .btn-primary:hover {
    opacity: 0.85;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }
  .btn-primary:active {
    opacity: 0.75;
  }
  .btn-remove {
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--divider-color);
    background: var(--card-background-color);
    color: var(--secondary-text-color);
    cursor: pointer;
    font-size: 14px;
    transition: color 0.2s ease, border-color 0.2s ease;
    line-height: 1;
  }
  .btn-remove:hover {
    color: var(--error-color, #db4437);
    border-color: var(--error-color, #db4437);
  }

  /* -- Area list ----------------------------------------------------- */
  .area-list {
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
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
    padding: 12px 16px;
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
  .area-checkbox {
    margin-right: 12px;
    accent-color: var(--primary-color);
  }
  .area-name {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
  }
  .area-icon {
    margin-left: 8px;
    margin-right: 12px;
    color: var(--secondary-text-color);
  }
  .nav-pin-button {
    background: none;
    border: none;
    color: var(--secondary-text-color);
    cursor: pointer;
    padding: 4px;
    margin-right: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: color 0.15s ease, background 0.15s ease;
  }
  .nav-pin-button.pinned {
    color: var(--primary-color);
  }
  .nav-pin-button:hover:not(:disabled) {
    background: var(--secondary-background-color);
  }
  .nav-pin-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
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

  /* -- Section order list --------------------------------------------- */
  .section-order-list {
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    overflow: hidden;
  }
  .section-order-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--divider-color);
    background: var(--card-background-color);
    transition: opacity 0.2s;
  }
  .section-order-item:last-child {
    border-bottom: none;
  }
  .section-order-item.dragging {
    opacity: 0.4;
  }
  .section-order-item.drag-over {
    border-top: 2px solid var(--primary-color);
  }
  .section-order-item.disabled {
    opacity: 0.5;
  }
  .section-order-item .drag-handle {
    margin-right: 12px;
    color: var(--secondary-text-color);
    cursor: grab;
    user-select: none;
    padding: 4px;
  }
  .section-order-item .drag-handle:active {
    cursor: grabbing;
  }
  .section-order-item .section-icon {
    margin-right: 10px;
    color: var(--secondary-text-color);
    --mdc-icon-size: 20px;
  }
  .section-order-item .section-label {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
  }
  .section-order-item .section-hidden-tag {
    font-size: 12px;
    color: var(--secondary-text-color);
    font-style: italic;
    margin-left: 8px;
  }
  .section-order-item .section-toggle {
    margin-left: auto;
    cursor: pointer;
  }
  .section-order-item .section-toggle input {
    cursor: pointer;
    width: 16px;
    height: 16px;
  }
  .section-order-sub {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px 8px 56px;
    border-bottom: 1px solid var(--divider-color);
    font-size: 13px;
    color: var(--secondary-text-color);
  }
  .section-order-sub input {
    cursor: pointer;
  }
  .section-order-sub label {
    cursor: pointer;
  }

  /* -- Entity groups ------------------------------------------------- */
  .entity-groups {
    padding-top: 8px;
  }
  .entity-group {
    margin-bottom: 8px;
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    background: var(--card-background-color);
    overflow: hidden;
  }
  .entity-group.disabled {
    opacity: 0.5;
  }
  .entity-group-header {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.15s ease;
  }
  .entity-group-header:hover {
    background: var(--secondary-background-color);
  }
  .group-checkbox {
    margin-right: 8px;
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--primary-color);
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
    font-size: 14px;
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

  /* -- Entity list --------------------------------------------------- */
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
    accent-color: var(--primary-color);
  }
  .entity-name {
    flex: 1;
    font-size: 14px;
  }
  .entity-id {
    font-size: 11px;
    color: var(--secondary-text-color);
    font-family: "Roboto Mono", monospace;
    margin-left: 8px;
  }
  .empty-state {
    padding: 24px;
    text-align: center;
    color: var(--secondary-text-color);
    font-style: italic;
  }

  /* -- Badge entity management --------------------------------------- */
  .badge-separator {
    padding: 8px 0 4px;
    font-size: 12px;
    font-weight: 500;
    color: var(--secondary-text-color);
    border-top: 1px dashed var(--divider-color);
    margin-top: 4px;
  }
  .badge-additional-item {
    padding-left: 0;
  }
  .badge-remove-btn {
    background: none;
    border: none;
    padding: 2px 6px;
    cursor: pointer;
    color: var(--error-color, #db4437);
    font-size: 14px;
    margin-left: 8px;
    border-radius: 4px;
    transition: background-color 0.15s ease;
  }
  .badge-remove-btn:hover {
    background: var(--secondary-background-color);
  }
  .badge-add-section {
    display: flex;
    gap: 8px;
    padding: 8px 0 4px;
    align-items: center;
  }
  .badge-entity-picker {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    background: var(--card-background-color);
    color: var(--primary-text-color);
    font-size: 13px;
  }
  .badge-add-button {
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    transition: opacity 0.2s ease;
  }
  .badge-add-button:hover {
    opacity: 0.85;
  }
  .badge-name-checkbox {
    margin-left: auto;
    margin-right: 2px;
    width: 14px;
    height: 14px;
    cursor: pointer;
    accent-color: var(--primary-color);
  }
  .badge-name-label {
    font-size: 11px;
    color: var(--secondary-text-color);
    margin-right: 8px;
    white-space: nowrap;
  }

  /* -- Entity search picker ------------------------------------------ */
  .entity-search-picker {
    position: relative;
    flex: 1;
    min-width: 0;
  }
  .entity-search-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    background: var(--card-background-color);
    color: var(--primary-text-color);
    font-family: inherit;
    font-size: 14px;
    box-sizing: border-box;
    transition: border-color 0.2s ease;
  }
  .entity-search-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 1px var(--primary-color);
  }
  .entity-search-input::placeholder {
    color: var(--secondary-text-color);
    opacity: 0.7;
  }
  .entity-search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 10;
    margin-top: 4px;
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    background: var(--card-background-color);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    overflow: hidden;
    max-height: 320px;
    overflow-y: auto;
  }
  .entity-search-result {
    display: flex;
    flex-direction: column;
    padding: 10px 14px;
    cursor: pointer;
    transition: background-color 0.1s ease;
    border-bottom: 1px solid var(--divider-color);
  }
  .entity-search-result:last-child {
    border-bottom: none;
  }
  .entity-search-result:hover {
    background: var(--secondary-background-color);
  }
  .entity-search-result .entity-search-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--primary-text-color);
  }
  .entity-search-result .entity-search-id {
    font-size: 11px;
    color: var(--secondary-text-color);
    font-family: "Roboto Mono", monospace;
    margin-top: 2px;
  }
  .entity-search-no-results {
    padding: 12px 14px;
    color: var(--secondary-text-color);
    font-style: italic;
    font-size: 13px;
  }

  /* -- Favorites / Room Pins list items ------------------------------ */
  .entity-list-container {
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    overflow: hidden;
  }
  .entity-list-item {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid var(--divider-color);
    background: var(--card-background-color);
    transition: background-color 0.1s ease;
  }
  .entity-list-item:last-child {
    border-bottom: none;
  }
  .entity-list-item:hover {
    background: var(--secondary-background-color);
  }
  .entity-list-item .drag-icon {
    margin-right: 12px;
    color: var(--secondary-text-color);
    font-size: 16px;
    cursor: grab;
    user-select: none;
    padding: 4px;
  }
  .entity-list-item .drag-icon:active {
    cursor: grabbing;
  }
  .entity-list-item.dragging {
    opacity: 0.5;
  }
  .entity-list-item.drag-over {
    border-top: 2px solid var(--primary-color);
  }
  .entity-list-item .item-info {
    flex: 1;
    min-width: 0;
    font-size: 14px;
  }
  .entity-list-item .item-name {
    font-weight: 500;
    color: var(--primary-text-color);
  }
  .entity-list-item .item-entity-id {
    margin-left: 8px;
    font-size: 12px;
    color: var(--secondary-text-color);
    font-family: "Roboto Mono", monospace;
  }
  .entity-list-item .item-area {
    display: block;
    font-size: 11px;
    color: var(--secondary-text-color);
    margin-top: 2px;
  }

  /* -- Custom view/card/badge items ---------------------------------- */
  .custom-item {
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    padding: 16px;
    margin-bottom: 12px;
    background: var(--card-background-color);
  }
  .custom-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .custom-item-header strong {
    font-size: 14px;
    font-weight: 500;
  }
  .custom-item-fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .custom-card-target {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }
  .custom-card-target label {
    color: var(--secondary-text-color);
    white-space: nowrap;
  }
  .custom-card-target select {
    flex: 1;
    padding: 4px 8px;
    border: 1px solid var(--divider-color);
    border-radius: 4px;
    background: var(--card-background-color);
    color: var(--primary-text-color);
    font-size: 13px;
  }
  .custom-item-row {
    display: flex;
    gap: 8px;
  }
  .custom-item-validation {
    font-size: 12px;
    min-height: 16px;
  }

  /* -- Section dividers ---------------------------------------------- */
  .section-divider {
    margin: 28px 0 12px;
    padding: 0;
  }
  .section-divider-title {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--secondary-text-color);
  }

  /* -- Mobile responsive --------------------------------------------- */
  @media (max-width: 600px) {
    .card-config {
      padding: 12px 8px;
    }
    .section {
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 15px;
      margin-bottom: 8px;
    }
    .form-row {
      flex-wrap: wrap;
      gap: 4px;
    }
    .form-row label {
      font-size: 13px;
    }
    .description {
      margin-left: 26px;
      margin-bottom: 12px;
      font-size: 11px;
    }

    select,
    .form-row select {
      width: 100%;
      min-width: 0;
      font-size: 13px;
      padding: 8px 28px 8px 10px;
    }
    input[type="text"],
    input[type="number"] {
      width: 100%;
      font-size: 13px;
      padding: 8px 10px;
    }
    textarea {
      font-size: 11px;
      padding: 10px;
      min-height: 60px;
    }

    .entity-search-picker {
      width: 100%;
    }
    .entity-search-results {
      max-height: 240px;
    }
    .entity-search-result {
      padding: 8px 10px;
    }

    .area-header {
      padding: 10px 12px;
    }
    .area-content {
      padding: 0 8px 8px 24px;
    }
    .entity-list {
      padding: 6px 8px 6px 16px;
    }

    .custom-item {
      padding: 12px;
    }
    .custom-item-row {
      flex-direction: column;
    }

    .entity-list-item {
      padding: 8px 10px;
    }
    .entity-list-item .item-entity-id {
      display: block;
      margin-left: 0;
      margin-top: 2px;
    }

    .badge-add-section {
      flex-wrap: wrap;
    }

    .btn-primary {
      padding: 8px 16px;
      font-size: 13px;
    }
  }
`;
