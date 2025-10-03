// ====================================================================
// SIMON42 CONFIGURATION MANAGER
// ====================================================================
// Verwaltet alle Konfigurationseinstellungen für das Dashboard
// Speichert und lädt Einstellungen aus dem Home Assistant Storage
// ====================================================================

class Simon42ConfigManager {
  constructor(hass) {
    this.hass = hass;
    this.config = {
      hidden_areas: [],        // Liste der ausgeblendeten Bereiche
      hidden_views: [],        // Liste der ausgeblendeten Views (lights, covers, etc.)
      area_order: [],          // Benutzerdefinierte Reihenfolge der Bereiche
      favorites: [],           // Favoriten-Entities
      ui: {
        compact_mode: false    // Kompakter Modus für Cards
      }
    };
    this.storageKey = 'simon42_dashboard_config';
  }

  /**
   * Lädt die Konfiguration aus dem Home Assistant Storage
   */
  async loadConfig() {
    try {
      const dashboardPath = this.getDashboardPath();
      const storageKey = `${this.storageKey}_${dashboardPath}`;
      
      // Versuche, die Konfiguration aus dem Storage zu laden
      const storedConfig = await this.hass.callWS({
        type: 'lovelace/config',
        url_path: storageKey
      }).catch(() => null);

      if (storedConfig && storedConfig.config) {
        this.config = { ...this.config, ...storedConfig.config };
      }
    } catch (error) {
      console.log('Simon42 Config: Keine gespeicherte Konfiguration gefunden, verwende Standardwerte');
    }
    
    return this.config;
  }

  /**
   * Speichert die Konfiguration im Home Assistant Storage
   */
  async saveConfig() {
    try {
      const dashboardPath = this.getDashboardPath();
      const storageKey = `${this.storageKey}_${dashboardPath}`;
      
      await this.hass.callWS({
        type: 'lovelace/config/save',
        url_path: storageKey,
        config: this.config
      });
      
      console.log('Simon42 Config: Konfiguration gespeichert');
      return true;
    } catch (error) {
      console.error('Simon42 Config: Fehler beim Speichern:', error);
      return false;
    }
  }

  /**
   * Ermittelt den aktuellen Dashboard-Pfad
   */
  getDashboardPath() {
    const path = window.location.pathname;
    const match = path.match(/\/([^\/]+)/);
    return match ? match[1] : 'lovelace';
  }

  /**
   * Prüft, ob ein Bereich ausgeblendet ist
   */
  isAreaHidden(areaId) {
    return this.config.hidden_areas.includes(areaId);
  }

  /**
   * Prüft, ob eine View ausgeblendet ist
   */
  isViewHidden(viewPath) {
    return this.config.hidden_views.includes(viewPath);
  }

  /**
   * Blendet einen Bereich aus oder ein
   */
  async toggleAreaVisibility(areaId) {
    const index = this.config.hidden_areas.indexOf(areaId);
    
    if (index > -1) {
      // Bereich ist ausgeblendet, wieder einblenden
      this.config.hidden_areas.splice(index, 1);
    } else {
      // Bereich ausblenden
      this.config.hidden_areas.push(areaId);
    }
    
    await this.saveConfig();
    return !this.isAreaHidden(areaId); // Gibt den neuen Sichtbarkeitsstatus zurück
  }

  /**
   * Blendet eine View aus oder ein
   */
  async toggleViewVisibility(viewPath) {
    const index = this.config.hidden_views.indexOf(viewPath);
    
    if (index > -1) {
      this.config.hidden_views.splice(index, 1);
    } else {
      this.config.hidden_views.push(viewPath);
    }
    
    await this.saveConfig();
    return !this.isViewHidden(viewPath);
  }

  /**
   * Setzt eine neue Reihenfolge für die Bereiche
   */
  async setAreaOrder(areaOrder) {
    this.config.area_order = areaOrder;
    await this.saveConfig();
  }

  /**
   * Gibt die gespeicherte Bereichsreihenfolge zurück
   */
  getAreaOrder() {
    return this.config.area_order;
  }

  /**
   * Sortiert Bereiche nach der gespeicherten Reihenfolge
   */
  sortAreas(areas) {
    const order = this.getAreaOrder();
    
    if (order.length === 0) {
      return areas; // Keine benutzerdefinierte Reihenfolge
    }

    // Filtere ausgeblendete Bereiche heraus
    const visibleAreas = areas.filter(area => !this.isAreaHidden(area.area_id));
    
    // Sortiere nach der benutzerdefinierten Reihenfolge
    return visibleAreas.sort((a, b) => {
      const indexA = order.indexOf(a.area_id);
      const indexB = order.indexOf(b.area_id);
      
      // Wenn beide in der Reihenfolge sind, nach Index sortieren
      if (indexA > -1 && indexB > -1) {
        return indexA - indexB;
      }
      
      // Wenn nur A in der Reihenfolge ist, kommt A zuerst
      if (indexA > -1) return -1;
      
      // Wenn nur B in der Reihenfolge ist, kommt B zuerst
      if (indexB > -1) return 1;
      
      // Sonst alphabetisch sortieren
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Fügt eine Entity zu den Favoriten hinzu oder entfernt sie
   */
  async toggleFavorite(entityId) {
    const index = this.config.favorites.indexOf(entityId);
    
    if (index > -1) {
      this.config.favorites.splice(index, 1);
    } else {
      this.config.favorites.push(entityId);
    }
    
    await this.saveConfig();
    return this.config.favorites.includes(entityId);
  }

  /**
   * Prüft, ob eine Entity als Favorit markiert ist
   */
  isFavorite(entityId) {
    return this.config.favorites.includes(entityId);
  }

  /**
   * Gibt alle Favoriten zurück
   */
  getFavorites() {
    return this.config.favorites;
  }

  /**
   * Aktualisiert die UI-Einstellungen
   */
  async updateUISettings(settings) {
    this.config.ui = { ...this.config.ui, ...settings };
    await this.saveConfig();
  }

  /**
   * Gibt die UI-Einstellungen zurück
   */
  getUISettings() {
    return this.config.ui;
  }
}

// Exportiere die Klasse global
window.Simon42ConfigManager = Simon42ConfigManager;
