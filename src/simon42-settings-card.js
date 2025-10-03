// ====================================================================
// SIMON42 SETTINGS CARD
// ====================================================================
// Card mit Einstellungs-Button für das Dashboard
// Öffnet einen Dialog mit allen Konfigurationsoptionen
// ====================================================================

class Simon42SettingsCard extends HTMLElement {
  constructor() {
    super();
    this.configManager = null;
  }

  setConfig(config) {
    this.configManager = config.configManager || window.simon42ConfigManager;
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  render() {
    if (!this.configManager) return;

    this.innerHTML = `
      <ha-card>
        <div class="card-content" style="display: flex; gap: 12px; align-items: center; justify-content: center;">
          <ha-icon-button id="settings-btn">
            <ha-icon icon="mdi:cog"></ha-icon>
          </ha-icon-button>
          <span style="color: var(--secondary-text-color);">Dashboard-Einstellungen</span>
        </div>
      </ha-card>
    `;

    this.querySelector('#settings-btn').addEventListener('click', () => {
      this.openSettingsDialog();
    });
  }

  async openSettingsDialog() {
    const areas = await this._hass.callWS({ type: "config/area_registry/list" });
    
    // Erstelle Dialog
    const dialog = document.createElement('ha-dialog');
    dialog.setAttribute('heading', 'Dashboard Einstellungen');
    dialog.open = true;

    const dialogContent = document.createElement('div');
    dialogContent.style.padding = '20px';
    
    // Views Section
    dialogContent.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h3 style="margin-top: 0;">Ansichten</h3>
        <p style="color: var(--secondary-text-color); font-size: 14px; margin-bottom: 12px;">
          Wähle aus, welche Ansichten im Dashboard angezeigt werden sollen.
        </p>
        <div id="views-settings" style="display: flex; flex-direction: column; gap: 8px;">
          ${this.createViewToggle('lights', 'mdi:lamps', 'Lichter')}
          ${this.createViewToggle('covers', 'mdi:blinds-horizontal', 'Rollos & Vorhänge')}
          ${this.createViewToggle('security', 'mdi:security', 'Sicherheit')}
          ${this.createViewToggle('batteries', 'mdi:battery-alert', 'Batterien')}
        </div>
      </div>

      <div>
        <h3>Bereiche</h3>
        <p style="color: var(--secondary-text-color); font-size: 14px; margin-bottom: 12px;">
          Wähle aus, welche Bereiche im Dashboard angezeigt werden sollen.
        </p>
        <div id="areas-settings" style="display: flex; flex-direction: column; gap: 8px;">
          ${areas.map(area => this.createAreaToggle(area)).join('')}
        </div>
      </div>
    `;

    dialog.appendChild(dialogContent);

    // Buttons
    const buttons = document.createElement('div');
    buttons.setAttribute('slot', 'primaryAction');
    buttons.innerHTML = `
      <mwc-button id="save-btn" dialogAction="save">Speichern</mwc-button>
      <mwc-button id="cancel-btn" dialogAction="cancel">Abbrechen</mwc-button>
    `;
    dialog.appendChild(buttons);

    document.body.appendChild(dialog);

    // Event Listeners für Toggles
    dialog.querySelectorAll('.view-toggle').forEach(toggle => {
      toggle.addEventListener('click', async (e) => {
        const viewPath = e.currentTarget.dataset.view;
        const newState = await this.configManager.toggleViewVisibility(viewPath);
        e.currentTarget.querySelector('ha-switch').checked = newState;
      });
    });

    dialog.querySelectorAll('.area-toggle').forEach(toggle => {
      toggle.addEventListener('click', async (e) => {
        const areaId = e.currentTarget.dataset.area;
        const newState = await this.configManager.toggleAreaVisibility(areaId);
        e.currentTarget.querySelector('ha-switch').checked = newState;
      });
    });

    // Dialog schließen und neu laden
    dialog.addEventListener('closed', (e) => {
      if (e.detail.action === 'save') {
        // Dashboard neu laden
        window.location.reload();
      }
      dialog.remove();
    });
  }

  createViewToggle(viewPath, icon, name) {
    const isVisible = !this.configManager.isViewHidden(viewPath);
    return `
      <div class="view-toggle" data-view="${viewPath}" 
           style="display: flex; align-items: center; justify-content: space-between; 
                  padding: 12px; background: var(--card-background-color); 
                  border-radius: 8px; cursor: pointer;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <ha-icon icon="${icon}" style="color: var(--primary-color);"></ha-icon>
          <span>${name}</span>
        </div>
        <ha-switch .checked="${isVisible}"></ha-switch>
      </div>
    `;
  }

  createAreaToggle(area) {
    const isVisible = !this.configManager.isAreaHidden(area.area_id);
    return `
      <div class="area-toggle" data-area="${area.area_id}" 
           style="display: flex; align-items: center; justify-content: space-between; 
                  padding: 12px; background: var(--card-background-color); 
                  border-radius: 8px; cursor: pointer;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <ha-icon icon="mdi:floor-plan" style="color: var(--primary-color);"></ha-icon>
          <span>${area.name}</span>
        </div>
        <ha-switch .checked="${isVisible}"></ha-switch>
      </div>
    `;
  }

  getCardSize() {
    return 1;
  }
}

customElements.define('simon42-settings-card', Simon42SettingsCard);

// Registriere die Card bei Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
  type: "simon42-settings-card",
  name: "Simon42 Settings Card",
  description: "Einstellungen für das Simon42 Dashboard"
});
