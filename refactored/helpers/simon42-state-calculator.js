// ====================================================================
// STATE CALCULATOR - Zentrale Status-Berechnungen
// ====================================================================

export class StateCalculator {
  /**
   * Zählt eingeschaltete Lichter
   * @param {Object} states - Home Assistant states
   * @param {Array} excludeList - Entity-IDs zum Ausschließen
   * @returns {Array} Array von eingeschalteten Licht-States
   */
  static getLightsOn(states, excludeList = []) {
    return Object.values(states)
      .filter(state => 
        state.entity_id.startsWith('light.') &&
        !excludeList.includes(state.entity_id) &&
        state.attributes?.entity_category !== 'config' &&
        state.attributes?.entity_category !== 'diagnostic' &&
        state.state === 'on'
      );
  }

  /**
   * Findet offene Cover (Rollos, Jalousien, etc.)
   * @param {Object} states - Home Assistant states
   * @param {Array} excludeList - Entity-IDs zum Ausschließen
   * @param {Array} deviceClasses - Device classes zu prüfen
   * @returns {Array} Array von offenen Cover-States
   */
  static getOpenCovers(states, excludeList = [], deviceClasses = ["awning", "blind", "curtain", "shade", "shutter", "window"]) {
    return Object.values(states)
      .filter(state => 
        state.entity_id.startsWith('cover.') &&
        !excludeList.includes(state.entity_id) &&
        state.attributes?.entity_category !== 'config' &&
        state.attributes?.entity_category !== 'diagnostic'
      )
      .filter(state => {
        const deviceClass = state.attributes?.device_class;
        return !deviceClasses || deviceClasses.length === 0 || deviceClasses.includes(deviceClass);
      })
      .filter(state => state.state === 'open');
  }

  /**
   * Findet unsichere Security-Entitäten
   * @param {Object} states - Home Assistant states
   * @param {Array} excludeList - Entity-IDs zum Ausschließen
   * @returns {Array} Array von Entity-IDs die unsicher sind
   */
  static getUnsecureEntities(states, excludeList = []) {
    const unsecure = [];
    
    // Binäre Sensoren (Türen, Fenster, Bewegung, etc.)
    const binarySensors = Object.values(states)
      .filter(state => 
        state.entity_id.startsWith('binary_sensor.') &&
        !excludeList.includes(state.entity_id) &&
        state.attributes?.entity_category !== 'config' &&
        state.attributes?.entity_category !== 'diagnostic'
      );
    
    // Prüfe verschiedene Security-relevante Device Classes
    const securityClasses = ['door', 'window', 'garage_door', 'motion', 'presence', 'opening'];
    
    binarySensors.forEach(sensor => {
      const deviceClass = sensor.attributes?.device_class;
      if (securityClasses.includes(deviceClass) && sensor.state === 'on') {
        unsecure.push(sensor.entity_id);
      }
    });
    
    // Locks die nicht locked sind
    Object.values(states)
      .filter(state => 
        state.entity_id.startsWith('lock.') &&
        !excludeList.includes(state.entity_id) &&
        state.state !== 'locked'
      )
      .forEach(lock => unsecure.push(lock.entity_id));
    
    // Alarm Control Panels die nicht armed sind
    Object.values(states)
      .filter(state => 
        state.entity_id.startsWith('alarm_control_panel.') &&
        !excludeList.includes(state.entity_id) &&
        !['armed_home', 'armed_away', 'armed_night', 'armed_vacation'].includes(state.state)
      )
      .forEach(alarm => unsecure.push(alarm.entity_id));
    
    return unsecure;
  }

  /**
   * Findet kritische Batterien
   * @param {Object} states - Home Assistant states
   * @param {Array} excludeList - Entity-IDs zum Ausschließen
   * @param {number} threshold - Schwellwert für kritisch (Standard: 20%)
   * @returns {Array} Array von Entity-IDs mit kritischem Batteriestand
   */
  static getCriticalBatteries(states, excludeList = [], threshold = 20) {
    const critical = [];
    
    Object.values(states).forEach(state => {
      // Skip excluded entities
      if (excludeList.includes(state.entity_id)) return;
      if (state.attributes?.entity_category === 'config') return;
      if (state.attributes?.entity_category === 'diagnostic') return;
      
      // Prüfe Batterie-Sensoren
      if (state.entity_id.includes('battery')) {
        const value = parseFloat(state.state);
        if (!isNaN(value) && value <= threshold && value >= 0) {
          critical.push(state.entity_id);
        }
      }
      
      // Prüfe battery_level Attribute
      if (state.attributes?.battery_level !== undefined) {
        const value = parseFloat(state.attributes.battery_level);
        if (!isNaN(value) && value <= threshold && value >= 0) {
          // Füge die Haupt-Entity hinzu, nicht den Batterie-Sensor
          if (!critical.includes(state.entity_id)) {
            critical.push(state.entity_id);
          }
        }
      }
    });
    
    return critical;
  }

  /**
   * Findet eine Wetter-Entität
   * @param {Object} states - Home Assistant states
   * @returns {string|null} Entity-ID der Wetter-Entität oder null
   */
  static findWeatherEntity(states) {
    const weatherEntity = Object.values(states)
      .find(state => state.entity_id.startsWith('weather.'));
    
    return weatherEntity ? weatherEntity.entity_id : null;
  }

  /**
   * Berechnet Energie-Statistiken
   * @param {Object} states - Home Assistant states
   * @param {Array} excludeList - Entity-IDs zum Ausschließen
   * @returns {Object} Energie-Statistiken
   */
  static getEnergyStats(states, excludeList = []) {
    const stats = {
      currentPower: null,
      dailyEnergy: null,
      solarPower: null,
      batteryLevel: null
    };
    
    // Suche nach typischen Energie-Sensoren
    Object.values(states).forEach(state => {
      if (excludeList.includes(state.entity_id)) return;
      
      const entityId = state.entity_id.toLowerCase();
      const deviceClass = state.attributes?.device_class;
      
      // Aktuelle Leistung
      if (deviceClass === 'power' && entityId.includes('total')) {
        stats.currentPower = {
          value: state.state,
          unit: state.attributes?.unit_of_measurement,
          entity_id: state.entity_id
        };
      }
      
      // Tagesverbrauch
      if (deviceClass === 'energy' && entityId.includes('daily')) {
        stats.dailyEnergy = {
          value: state.state,
          unit: state.attributes?.unit_of_measurement,
          entity_id: state.entity_id
        };
      }
      
      // Solar
      if (deviceClass === 'power' && entityId.includes('solar')) {
        stats.solarPower = {
          value: state.state,
          unit: state.attributes?.unit_of_measurement,
          entity_id: state.entity_id
        };
      }
    });
    
    return stats;
  }

  /**
   * Berechnet Klima-Statistiken für einen Bereich
   * @param {Object} states - Home Assistant states
   * @param {Array} areaEntities - Entity-IDs im Bereich
   * @returns {Object} Klima-Statistiken
   */
  static getClimateStats(states, areaEntities) {
    const stats = {
      temperature: null,
      humidity: null,
      climateEntities: []
    };
    
    areaEntities.forEach(entityId => {
      const state = states[entityId];
      if (!state) return;
      
      const deviceClass = state.attributes?.device_class;
      
      // Temperatur
      if (deviceClass === 'temperature' && !stats.temperature) {
        stats.temperature = {
          value: state.state,
          unit: state.attributes?.unit_of_measurement,
          entity_id: state.entity_id
        };
      }
      
      // Luftfeuchtigkeit
      if (deviceClass === 'humidity' && !stats.humidity) {
        stats.humidity = {
          value: state.state,
          unit: state.attributes?.unit_of_measurement,
          entity_id: state.entity_id
        };
      }
      
      // Climate entities (Thermostate)
      if (entityId.startsWith('climate.')) {
        stats.climateEntities.push({
          entity_id: state.entity_id,
          temperature: state.attributes?.temperature,
          target_temperature: state.attributes?.target_temperature,
          hvac_mode: state.state
        });
      }
    });
    
    return stats;
  }

  /**
   * Generiert eine Zusammenfassung für das Dashboard
   * @param {Object} states - Home Assistant states
   * @param {Array} excludeList - Entity-IDs zum Ausschließen
   * @returns {Object} Dashboard-Zusammenfassung
   */
  static getDashboardSummary(states, excludeList = []) {
    return {
      lights: {
        on: this.getLightsOn(states, excludeList).length,
        total: Object.values(states).filter(s => 
          s.entity_id.startsWith('light.') && 
          !excludeList.includes(s.entity_id) &&
          s.attributes?.entity_category !== 'config' &&
          s.attributes?.entity_category !== 'diagnostic'
        ).length
      },
      covers: {
        open: this.getOpenCovers(states, excludeList).length,
        total: Object.values(states).filter(s => 
          s.entity_id.startsWith('cover.') && 
          !excludeList.includes(s.entity_id)
        ).length
      },
      security: {
        issues: this.getUnsecureEntities(states, excludeList).length
      },
      batteries: {
        critical: this.getCriticalBatteries(states, excludeList).length
      },
      persons: {
        home: Object.values(states).filter(s => 
          s.entity_id.startsWith('person.') && 
          !excludeList.includes(s.entity_id) &&
          s.state === 'home'
        ).length,
        total: Object.values(states).filter(s => 
          s.entity_id.startsWith('person.') && 
          !excludeList.includes(s.entity_id)
        ).length
      }
    };
  }
}