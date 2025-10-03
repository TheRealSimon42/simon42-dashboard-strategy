// ====================================================================
// SIMON42 SETTINGS CARD
// ====================================================================
// Card mit Einstellungs-Button für das Dashboard
// Öffnet einen Dialog mit allen Konfigurationsoptionen
// Verbesserte Fehlerbehandlung und UI
// ====================================================================

class Simon42SettingsCard extends HTMLElement {
  constructor() {
    super();
    this.configManager = null;
  }

  setConfig(config) {
    this.configManager = config.configManager || window.simon42ConfigManager;
    
    if (!this.configManager) {
      console.warn('⚠️ Simon42 Settings: Config Manager nicht verfügbar');
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  render() {
    if (!this.configManager) {
      this.innerHTML = `
        <ha-card>
          <div class="card-content" style="text-align: center; padding: 16px;">
            <ha-icon icon="mdi:alert-circle" style="color: var(--error-color); --mdc-icon-size: 48px;"></ha-icon>
            <p style="color: var(--error-color); margin: 8px 0 0 0;">
              Config Manager nicht geladen
            </p>
          </div>
        </ha-card>
      `;
      return;
    }

    this.innerHTML = `
      <ha-card>
        <div class="card-content" style="display: flex; gap: 12px; align-items: center; justify-content: center; padding: 12px;">
          <mwc-button id="settings-btn" raised>
            <ha-icon icon="mdi:cog" slot="icon"></ha-icon>
            Dashboard-Einstellungen
          </mwc-button>
        </div>
      </ha-card>
    `;

    const button = this.querySelector('#settings-btn');
    if (button) {
      button.addEventListener('click', () => this.openSettingsDialog());
    }
  }

  async openSettingsDialog() {
    try {
      const areas = await this._hass.callWS({ type: "config/area_registry/list" });
      
      // Erstelle Dialog-Container
      const dialogContainer = document.createElement('div');
      dialogContainer.innerHTML = `
        <ha-dialog open heading="Dashboard Einstellungen">
          <div class="dialog-content" style="padding: 0 24px 24px 24px;">
            
            <!-- Views Section -->
            <div style="margin-bottom: 24px;">
              <h3 style="margin: 16px 0 8px 0; font-size: 16px; font-weight: 500;">Ansichten</h3>
              <p style="color: var(--secondary-text-color); font-size: 14px; margin: 0 0 12px 0;">
                Wähle aus, welche Ansichten im Dashboard angezeigt werden sollen.
              </p>
              <div id="views-settings">
                ${this.createViewToggle('lights', 'mdi:lightbulb', 'Lichter')}
                ${this.createViewToggle('covers', 'mdi:blinds-horizontal', 'Rollos & Vorhänge')}
                ${this.createViewToggle('security', 'mdi:security', 'Sicherheit')}
                ${this.createViewToggle('batteries', 'mdi:battery-alert', 'Batterien')}
              </div>
            </div>

            <!-- Bereiche Section -->
            <div>
              <h3 style="margin: 16px 0 8px 0; font-size: 16px; font-weight: 500;">Bereiche</h3>
              <p style="color: var(--secondary-text-color); font-size: 14px; margin: 0 0 12px 0;">
                Wähle aus, welche Bereiche im Dashboard angezeigt werden sollen.
              </p>
              <div id="areas-settings">
                ${areas.length > 0 ? areas.map(area => this.createAreaToggle(area)).join('') : '<p style="color: var(--secondary-text-color); padding: 12px;">Keine Bereiche gefunden</p>'}
              </div>
            </div>

            <!-- Info Section -->
            <div style="margin-top: 24px; padding: 12px; background: var(--primary-background-color); border-radius: 8px; border-left: 4px solid var(--primary-color);">
              <p style="margin: 0; font-size: 13px; color: var(--secondary-text-color);">
                <ha-icon icon="mdi:information" style="vertical-align: middle; --mdc-icon-size: 18px;"></ha-icon>
                Änderungen werden im Browser-Speicher gespeichert. Nach dem Speichern wird das Dashboard neu geladen.
              </p>
            </div>

          </div>

          <!-- Dialog Buttons -->
          <mwc-button slot="primaryAction" dialogAction="save">
            <ha-icon icon="mdi:content-save" slot="icon"></ha-icon>
            Speichern & Neu laden
          </mwc-button>
          <mwc-button slot="secondaryAction" dialogAction="cancel">
            Abbrechen
          </mwc-button>
        </ha-dialog>
      `;

      document.body.appendChild(dialogContainer);
      const dialog = dialogContainer.querySelector('ha-dialog');

      // Event Listeners für View-Toggles
      dialogContainer.querySelectorAll('.view-toggle').forEach(toggleContainer => {
        const checkbox = toggleContainer.querySelector('ha-checkbox');
        if (checkbox) {
          checkbox.addEventListener('change', async (e) => {
            const viewPath = toggleContainer.dataset.view;
            try {
              await this.configManager.toggleViewVisibility(viewPath);
              console.log(`✅ View "${viewPath}" umgeschaltet`);
            } catch (error) {
              console.error('❌ Fehler beim Umschalten der View:', error);
            }
          });
        }
      });

      // Event Listeners für Area-Toggles
      dialogContainer.querySelectorAll('.area-toggle').forEach(toggleContainer => {
        const checkbox = toggleContainer.querySelector('ha-checkbox');
        if (checkbox) {
          checkbox.addEventListener('change', async (e) => {
            const areaId = toggleContainer.dataset.area;
            try {
              await this.configManager.toggleAreaVisibility(areaId);
              console.log(`✅ Bereich "${areaId}" umgeschaltet`);
            } catch (error) {
              console.error('❌ Fehler beim Umschalten des Bereichs:', error);
            }
          });
        }
      });

      // Dialog schließen
      dialog.addEventListener('closed', (e) => {
        if (e.detail.action === 'save') {
          console.log('💾 Einstellungen gespeichert, lade Dashboard neu...');
          // Dashboard neu laden
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
        dialogContainer.remove();
      });

    } catch (error) {
      console.error('❌ Fehler beim Öffnen des Einstellungs-Dialogs:', error);
      this.showError('Fehler beim Laden der Einstellungen. Bitte versuche es erneut.');
    }
  }

  createViewToggle(viewPath, icon, name) {
    const isVisible = !this.configManager.isViewHidden(viewPath);
    return `
      <div class="view-toggle" data-view="${viewPath}" 
           style="display: flex; align-items: center; justify-content: space-between; 
                  padding: 12px; background: var(--card-background-color); 
                  border-radius: 8px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <ha-icon icon="${icon}" style="color: var(--primary-color); --mdc-icon-size: 24px;"></ha-icon>
          <span style="font-size: 14px;">${name}</span>
        </div>
        <ha-checkbox ${isVisible ? 'checked' : ''}></ha-checkbox>
      </div>
    `;
  }

  createAreaToggle(area) {
    const isVisible = !this.configManager.isAreaHidden(area.area_id);
    return `
      <div class="area-toggle" data-area="${area.area_id}" 
           style="display: flex; align-items: center; justify-content: space-between; 
                  padding: 12px; background: var(--card-background-color); 
                  border-radius: 8px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <ha-icon icon="mdi:floor-plan" style="color: var(--primary-color); --mdc-icon-size: 24px;"></ha-icon>
          <span style="font-size: 14px;">${area.name}</span>
        </div>
        <ha-checkbox ${isVisible ? 'checked' : ''}></ha-checkbox>
      </div>
    `;
  }

  showError(message) {
    // Erstelle eine Toast-Benachrichtigung
    const event = new CustomEvent('hass-notification', {
      detail: { message: message, duration: 5000 },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
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

console.log('✅ Simon42 Settings Card geladen');