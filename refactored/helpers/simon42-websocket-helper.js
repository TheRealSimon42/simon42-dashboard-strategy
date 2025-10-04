// ====================================================================
// WEBSOCKET HELPER - Zentrale WebSocket-Kommunikation
// ====================================================================

export class WebSocketHelper {
  /**
   * Lädt alle benötigten Daten in einem Batch
   * @param {Object} hass - Home Assistant Objekt
   * @returns {Object} Alle geladenen Daten
   */
  static async fetchAllData(hass) {
    try {
      const [areas, devices, entities, floors] = await Promise.all([
        hass.callWS({ type: "config/area_registry/list" }),
        hass.callWS({ type: "config/device_registry/list" }),
        hass.callWS({ type: "config/entity_registry/list" }),
        this.fetchFloors(hass) // Floors sind optional
      ]);
      
      return { 
        areas: areas || [], 
        devices: devices || [], 
        entities: entities || [],
        floors: floors || []
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      // Fallback auf leere Arrays
      return {
        areas: [],
        devices: [],
        entities: [],
        floors: []
      };
    }
  }

  /**
   * Lädt Floor-Daten (falls verfügbar)
   * @param {Object} hass - Home Assistant Objekt
   * @returns {Array} Floor-Daten oder leeres Array
   */
  static async fetchFloors(hass) {
    try {
      return await hass.callWS({ type: "config/floor_registry/list" });
    } catch (error) {
      // Floors sind optional, kein Fehler wenn nicht verfügbar
      return [];
    }
  }

  /**
   * Lädt Label-Daten
   * @param {Object} hass - Home Assistant Objekt
   * @returns {Array} Label-Daten
   */
  static async fetchLabels(hass) {
    try {
      return await hass.callWS({ type: "config/label_registry/list" });
    } catch (error) {
      console.warn("Labels not available:", error);
      return [];
    }
  }

  /**
   * Lädt Benutzer-Daten
   * @param {Object} hass - Home Assistant Objekt
   * @returns {Array} User-Daten
   */
  static async fetchUsers(hass) {
    try {
      return await hass.callWS({ type: "config/user/list" });
    } catch (error) {
      console.warn("Users not available:", error);
      return [];
    }
  }

  /**
   * Lädt Automatisierungen
   * @param {Object} hass - Home Assistant Objekt
   * @returns {Array} Automatisierungen
   */
  static async fetchAutomations(hass) {
    try {
      return await hass.callWS({ type: "automation/list" });
    } catch (error) {
      console.warn("Automations not available:", error);
      return [];
    }
  }

  /**
   * Lädt Szenen
   * @param {Object} hass - Home Assistant Objekt
   * @returns {Array} Szenen
   */
  static async fetchScenes(hass) {
    try {
      return await hass.callWS({ type: "scene/list" });
    } catch (error) {
      console.warn("Scenes not available:", error);
      return [];
    }
  }

  /**
   * Lädt Scripts
   * @param {Object} hass - Home Assistant Objekt
   * @returns {Array} Scripts
   */
  static async fetchScripts(hass) {
    try {
      return await hass.callWS({ type: "script/list" });
    } catch (error) {
      console.warn("Scripts not available:", error);
      return [];
    }
  }

  /**
   * Service-Call über WebSocket
   * @param {Object} hass - Home Assistant Objekt
   * @param {string} domain - Service-Domain
   * @param {string} service - Service-Name
   * @param {Object} data - Service-Daten
   * @returns {Promise} Service-Call Promise
   */
  static async callService(hass, domain, service, data = {}) {
    return hass.callService(domain, service, data);
  }

  /**
   * Lädt History-Daten für eine Entity
   * @param {Object} hass - Home Assistant Objekt
   * @param {string} entityId - Entity ID
   * @param {Date} startTime - Start-Zeit
   * @param {Date} endTime - End-Zeit
   * @returns {Array} History-Daten
   */
  static async fetchHistory(hass, entityId, startTime, endTime) {
    try {
      return await hass.callWS({
        type: "history/history_during_period",
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        entity_ids: [entityId],
        minimal_response: true
      });
    } catch (error) {
      console.warn("History not available:", error);
      return [];
    }
  }

  /**
   * Lädt Statistik-Daten für eine Entity
   * @param {Object} hass - Home Assistant Objekt
   * @param {string} entityId - Entity ID
   * @param {string} period - Periode (hour, day, month)
   * @returns {Object} Statistik-Daten
   */
  static async fetchStatistics(hass, entityId, period = "day") {
    try {
      const endTime = new Date();
      const startTime = new Date();
      
      switch(period) {
        case "hour":
          startTime.setHours(startTime.getHours() - 24);
          break;
        case "day":
          startTime.setDate(startTime.getDate() - 7);
          break;
        case "month":
          startTime.setMonth(startTime.getMonth() - 1);
          break;
      }
      
      return await hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        statistic_ids: [entityId],
        period: period
      });
    } catch (error) {
      console.warn("Statistics not available:", error);
      return {};
    }
  }

  /**
   * Cached Data-Fetching mit TTL
   * @param {Object} hass - Home Assistant Objekt
   * @param {string} cacheKey - Cache-Schlüssel
   * @param {Function} fetchFunction - Funktion zum Daten holen
   * @param {number} ttl - Time-to-live in Millisekunden
   * @returns {any} Gecachte oder frische Daten
   */
  static async fetchWithCache(hass, cacheKey, fetchFunction, ttl = 5000) {
    // Cache im hass-Objekt speichern
    if (!hass._wsCache) {
      hass._wsCache = {};
    }
    
    const now = Date.now();
    const cached = hass._wsCache[cacheKey];
    
    // Prüfe ob Cache noch gültig
    if (cached && cached.timestamp + ttl > now) {
      return cached.data;
    }
    
    // Neue Daten holen
    const data = await fetchFunction();
    
    // Cache aktualisieren
    hass._wsCache[cacheKey] = {
      data: data,
      timestamp: now
    };
    
    return data;
  }

  /**
   * Batch-Update für mehrere Entities
   * @param {Object} hass - Home Assistant Objekt
   * @param {Array} updates - Array von {entity_id, state, attributes}
   * @returns {Promise} Update Promise
   */
  static async batchUpdateEntities(hass, updates) {
    const promises = updates.map(update => {
      return hass.callService('homeassistant', 'update_entity', {
        entity_id: update.entity_id
      });
    });
    
    return Promise.all(promises);
  }
}