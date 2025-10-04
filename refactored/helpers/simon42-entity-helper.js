// ====================================================================
// ENTITY HELPER - Zentrale Entity-Verwaltung und Filterung
// ====================================================================

export class EntityHelper {
  /**
   * Filtert Entitäten mit bestimmten Labels aus
   * @param {Array} entities - Array von Entity-Objekten
   * @param {string} excludeLabel - Label zum Ausschließen (z.B. 'no_dboard')
   * @returns {Array} Array von Entity-IDs die das Label haben
   */
  static getEntitiesWithLabel(entities, label) {
    return entities
      .filter(e => e.labels?.includes(label))
      .map(e => e.entity_id);
  }

  /**
   * Filtert Areale die ein bestimmtes Label haben
   * @param {Array} areas - Array von Area-Objekten
   * @param {string} excludeLabel - Label zum Ausschließen
   * @returns {Array} Gefilterte Areale ohne das Label
   */
  static filterAreasByLabel(areas, excludeLabel) {
    const excludedAreaIds = new Set();
    
    for (const area of areas) {
      if (area.labels && Array.isArray(area.labels) && area.labels.includes(excludeLabel)) {
        excludedAreaIds.add(area.area_id);
      }
    }
    
    return areas.filter(area => !excludedAreaIds.has(area.area_id));
  }

  /**
   * Findet alle Entitäten eines bestimmten Domains
   * @param {Object} states - Home Assistant states object
   * @param {string} domain - Domain (z.B. 'light', 'switch')
   * @param {Array} excludeList - Entity-IDs zum Ausschließen
   * @returns {Array} Gefilterte State-Objekte
   */
  static getEntitiesByDomain(states, domain, excludeList = []) {
    return Object.values(states)
      .filter(state => state.entity_id.startsWith(`${domain}.`))
      .filter(state => !excludeList.includes(state.entity_id))
      .filter(state => !this.isConfigOrDiagnostic(state));
  }

  /**
   * Prüft ob eine Entität eine Config- oder Diagnostic-Entität ist
   * @param {Object} state - State-Objekt
   * @returns {boolean}
   */
  static isConfigOrDiagnostic(state) {
    const category = state.attributes?.entity_category;
    return category === 'config' || category === 'diagnostic';
  }

  /**
   * Gruppiert Entitäten nach Area
   * @param {Array} entities - Array von Entity-Objekten
   * @param {Array} devices - Array von Device-Objekten
   * @returns {Map} Map mit area_id als Key und Entity-Arrays als Values
   */
  static groupEntitiesByArea(entities, devices) {
    const areaMap = new Map();
    
    // Erstelle Device-to-Area Mapping
    const deviceAreaMap = new Map();
    devices.forEach(device => {
      if (device.area_id) {
        deviceAreaMap.set(device.id, device.area_id);
      }
    });
    
    // Gruppiere Entities
    entities.forEach(entity => {
      let areaId = entity.area_id;
      
      // Falls Entity keine direkte Area hat, prüfe Device
      if (!areaId && entity.device_id) {
        areaId = deviceAreaMap.get(entity.device_id);
      }
      
      // Fallback auf 'no_area'
      if (!areaId) {
        areaId = 'no_area';
      }
      
      if (!areaMap.has(areaId)) {
        areaMap.set(areaId, []);
      }
      areaMap.get(areaId).push(entity.entity_id);
    });
    
    return areaMap;
  }

  /**
   * Findet Personen-Entitäten
   * @param {Object} states - Home Assistant states
   * @param {Array} excludeList - Entity-IDs zum Ausschließen
   * @returns {Array} Array von Personen-Objekten mit zusätzlichen Infos
   */
  static getPersons(states, excludeList = []) {
    return Object.values(states)
      .filter(state => state.entity_id.startsWith('person.'))
      .filter(state => !excludeList.includes(state.entity_id))
      .map(state => ({
        entity_id: state.entity_id,
        name: state.attributes?.friendly_name || state.entity_id.split('.')[1],
        state: state.state,
        isHome: state.state === 'home',
        picture: state.attributes?.entity_picture
      }));
  }

  /**
   * Findet die erste verfügbare Entität eines Typs (für Dummy-Entitäten)
   * @param {Object} states - Home Assistant states
   * @param {string} domain - Domain zu suchen
   * @param {Array} excludeList - Entity-IDs zum Ausschließen
   * @returns {string|null} Entity-ID oder null
   */
  static findFirstAvailable(states, domain, excludeList = []) {
    const entity = Object.values(states)
      .find(state => 
        state.entity_id.startsWith(`${domain}.`) &&
        !excludeList.includes(state.entity_id) &&
        !this.isConfigOrDiagnostic(state) &&
        state.state !== 'unavailable'
      );
    
    return entity ? entity.entity_id : null;
  }

  /**
   * Filtert Entitäten nach Device Class
   * @param {Object} states - Home Assistant states
   * @param {string} domain - Domain
   * @param {Array} deviceClasses - Array von device_class Werten
   * @param {Array} excludeList - Entity-IDs zum Ausschließen
   * @returns {Array} Gefilterte State-Objekte
   */
  static getEntitiesByDeviceClass(states, domain, deviceClasses, excludeList = []) {
    return this.getEntitiesByDomain(states, domain, excludeList)
      .filter(state => {
        const deviceClass = state.attributes?.device_class;
        return deviceClasses.includes(deviceClass);
      });
  }

  /**
   * Extrahiert relevante Entity-Informationen für Card-Generierung
   * @param {Object} state - State-Objekt
   * @returns {Object} Entity-Info Objekt
   */
  static getEntityInfo(state) {
    return {
      entity_id: state.entity_id,
      name: state.attributes?.friendly_name || state.entity_id.split('.')[1],
      state: state.state,
      domain: state.entity_id.split('.')[0],
      device_class: state.attributes?.device_class,
      unit: state.attributes?.unit_of_measurement,
      icon: state.attributes?.icon,
      unavailable: state.state === 'unavailable',
      attributes: state.attributes
    };
  }

  /**
   * Sortiert Entitäten nach Namen
   * @param {Array} entities - Array von Entity-Objekten oder State-Objekten
   * @returns {Array} Sortiertes Array
   */
  static sortByName(entities) {
    return entities.sort((a, b) => {
      const nameA = a.attributes?.friendly_name || a.name || a.entity_id || '';
      const nameB = b.attributes?.friendly_name || b.name || b.entity_id || '';
      return nameA.localeCompare(nameB);
    });
  }
}