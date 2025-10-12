// ====================================================================
// SIMON42 REGISTRY CACHE - Zentrales Caching für Registry-Aufrufe
// ====================================================================
// Verhindert mehrfache WS-Calls für Areas, Devices, Entities, Floors

class Simon42RegistryCache {
  constructor() {
    this.cache = {};
    this.loading = {}; // Verhindert doppelte Requests während des Ladens
    this.timestamps = {};
    this.TTL = 30000; // Cache für 30 Sekunden (optional)
  }

  /**
   * Lädt Registry-Daten aus Cache oder von Home Assistant
   * @param {Object} hass - Home Assistant Objekt
   * @param {string} type - Registry-Type (z.B. "config/entity_registry/list")
   * @param {boolean} forceRefresh - Cache ignorieren und neu laden
   * @returns {Promise<Array>} Registry-Daten
   */
  async get(hass, type, forceRefresh = false) {
    // Prüfe ob Cache gültig ist
    if (!forceRefresh && this.cache[type]) {
      // Optional: TTL-Check
      const age = Date.now() - this.timestamps[type];
      if (age < this.TTL) {
        console.log(`[Registry Cache] HIT for ${type} (age: ${age}ms)`);
        return this.cache[type];
      }
      console.log(`[Registry Cache] EXPIRED for ${type} (age: ${age}ms)`);
    }

    // Wenn bereits ein Request läuft, darauf warten
    if (this.loading[type]) {
      console.log(`[Registry Cache] WAITING for ${type}`);
      return this.loading[type];
    }

    // Neuer Request
    console.log(`[Registry Cache] LOADING ${type}`);
    this.loading[type] = hass.callWS({ type });

    try {
      const data = await this.loading[type];
      this.cache[type] = data;
      this.timestamps[type] = Date.now();
      delete this.loading[type];
      return data;
    } catch (err) {
      console.error(`[Registry Cache] ERROR loading ${type}:`, err);
      delete this.loading[type];
      throw err;
    }
  }

  /**
   * Invalidiert Cache für einen bestimmten Type
   * @param {string} type - Registry-Type (optional, wenn leer: alle)
   */
  invalidate(type) {
    if (type) {
      delete this.cache[type];
      delete this.timestamps[type];
      console.log(`[Registry Cache] INVALIDATED ${type}`);
    } else {
      this.cache = {};
      this.timestamps = {};
      console.log(`[Registry Cache] INVALIDATED ALL`);
    }
  }

  /**
   * Invalidiert Cache wenn älter als TTL
   */
  cleanup() {
    const now = Date.now();
    for (const type in this.cache) {
      const age = now - this.timestamps[type];
      if (age > this.TTL) {
        this.invalidate(type);
      }
    }
  }

  /**
   * Prüft ob Cache für Type existiert
   * @param {string} type - Registry-Type
   * @returns {boolean}
   */
  has(type) {
    return !!this.cache[type];
  }

  /**
   * Gibt Cache-Statistiken zurück
   * @returns {Object}
   */
  getStats() {
    const stats = {
      cached: Object.keys(this.cache).length,
      loading: Object.keys(this.loading).length,
      types: {}
    };

    for (const type in this.cache) {
      stats.types[type] = {
        entries: this.cache[type].length,
        age: Date.now() - this.timestamps[type]
      };
    }

    return stats;
  }
}

// Erstelle globale Singleton-Instanz
if (!window.simon42RegistryCache) {
  window.simon42RegistryCache = new Simon42RegistryCache();
  console.log('[Simon42] Registry Cache initialized');
}

// Cleanup alle 60 Sekunden
setInterval(() => {
  window.simon42RegistryCache.cleanup();
}, 60000);

export default window.simon42RegistryCache;