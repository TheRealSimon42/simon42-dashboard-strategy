// ====================================================================
// EDITOR INTEGRATION FILTERS
// ====================================================================
// Filters entities based on public transport integration type
// ====================================================================

/**
 * Filtert Entities basierend auf der ausgewählten Integration
 * @param {Array} allEntities - Alle verfügbaren Entities
 * @param {string} integration - Die ausgewählte Integration ('hvv', 'ha-departures', 'db_info', 'kvv')
 * @param {Object} hass - Home Assistant Objekt (optional, für Attribute-Checks)
 * @returns {Array} Gefilterte Entities
 */
export function filterEntitiesByIntegration(allEntities, integration, hass = null) {
  if (!integration || !allEntities) {
    return [];
  }

  return allEntities.filter(entity => {
    const entityId = entity.entity_id.toLowerCase();
    const name = (entity.name || '').toLowerCase();
    
    // Filter für relevante Domains
    if (!entityId.startsWith('sensor.') && !entityId.startsWith('button.')) {
      return false;
    }
    
    // Integration-spezifische Filter basierend auf Attribut-Struktur
    switch (integration) {
      case 'hvv':
        return filterHvvEntity(entity, entityId, name, hass);
      
      case 'ha-departures':
        return filterHaDeparturesEntity(entity, entityId, name, hass);
      
      case 'db_info':
        return filterDbInfoEntity(entity, entityId, name, hass);
      
      case 'kvv':
        return filterKvvEntity(entity, entityId, name, hass);
      
      default:
        return filterDefaultTransportEntity(entityId, name);
    }
  });
}

function filterHvvEntity(entity, entityId, name, hass) {
  // HVV-Entities haben charakteristische Attribute:
  // - 'next' Array mit departure-Objekten
  // - 'attribution' mit "hvv.de"
  // - 'device_class: timestamp'
  // - Top-level: 'line', 'origin', 'direction', 'type', 'id'
  
  // Exclude KVV entities - check friendly_name for "KVV"
  if (hass && hass.states && hass.states[entity.entity_id]) {
    const state = hass.states[entity.entity_id];
    const attrs = state.attributes || {};
    const friendlyName = (attrs.friendly_name || name || '').toUpperCase();
    
    // Exclude if friendly_name contains "KVV"
    if (friendlyName.includes('KVV')) {
      return false;
    }
  } else {
    // Also check name/entityId for KVV exclusion
    if (name.toUpperCase().includes('KVV') || entityId.toUpperCase().includes('KVV')) {
      return false;
    }
  }
  
  if (hass && hass.states && hass.states[entity.entity_id]) {
    const state = hass.states[entity.entity_id];
    const attrs = state.attributes || {};
    
    // Prüfe auf HVV-spezifische Attribute-Struktur
    const hasNextArray = Array.isArray(attrs.next);
    const hasHvvAttribution = attrs.attribution && 
                             (attrs.attribution.includes('hvv.de') || 
                              attrs.attribution.includes('hvv'));
    const hasDeviceClassTimestamp = attrs.device_class === 'timestamp';
    const hasHvvTopLevelAttrs = attrs.line !== undefined && 
                               attrs.origin !== undefined && 
                               attrs.direction !== undefined &&
                               attrs.type !== undefined &&
                               attrs.id !== undefined;
    
    // HVV-Entity wenn: next-Array vorhanden ODER (attribution mit hvv.de UND device_class timestamp)
    if (hasNextArray || (hasHvvAttribution && hasDeviceClassTimestamp)) {
      return true;
    }
    
    // Auch wenn top-level HVV-Attribute vorhanden sind (aber kein next-Array)
    if (hasHvvTopLevelAttrs && !attrs.line_name) {
      // line_name würde auf ha-departures hinweisen
      return true;
    }
  }
  
  // Fallback: Keyword-basierte Erkennung (aber nicht KVV)
  if (name.toUpperCase().includes('KVV') || entityId.toUpperCase().includes('KVV')) {
    return false;
  }
  
  return entityId.includes('hvv') || 
         name.includes('hvv') ||
         entityId.includes('departure') || 
         entityId.includes('abfahrt') ||
         name.includes('departure') || 
         name.includes('abfahrt');
}

function filterHaDeparturesEntity(entity, entityId, name, hass) {
  // ha-departures-Entities haben charakteristische Attribute:
  // - 'line_name' (nicht 'line')
  // - 'line_id' (nicht 'id')
  // - 'transport' (nicht 'type')
  // - 'data_provider'
  // - 'planned_departure_time' und 'estimated_departure_time' (nicht in 'next' Array)
  // - 'latitude', 'longitude'
  // KEIN 'next' Array, KEIN 'attribution' mit hvv.de
  
  // Exclude KVV entities - check friendly_name for "KVV"
  if (hass && hass.states && hass.states[entity.entity_id]) {
    const state = hass.states[entity.entity_id];
    const attrs = state.attributes || {};
    const friendlyName = (attrs.friendly_name || name || '').toUpperCase();
    
    // Exclude if friendly_name contains "KVV"
    if (friendlyName.includes('KVV')) {
      return false;
    }
  } else {
    // Also check name/entityId for KVV exclusion
    if (name.toUpperCase().includes('KVV') || entityId.toUpperCase().includes('KVV')) {
      return false;
    }
  }
  
  if (hass && hass.states && hass.states[entity.entity_id]) {
    const state = hass.states[entity.entity_id];
    const attrs = state.attributes || {};
    
    // Explizit HVV ausschließen: Hat 'next' Array oder hvv.de attribution
    const hasNextArray = Array.isArray(attrs.next);
    const hasHvvAttribution = attrs.attribution && 
                             (attrs.attribution.includes('hvv.de') || 
                              attrs.attribution.includes('hvv'));
    
    if (hasNextArray || hasHvvAttribution) {
      return false;
    }
    
    // Explizit db_info ausschließen: Hat Attribute mit Leerzeichen im Namen
    const hasDbInfoAttrs = attrs['Departure Time'] !== undefined || 
                          attrs['Arrival Time'] !== undefined ||
                          attrs['Departure Time Real'] !== undefined;
    
    if (hasDbInfoAttrs) {
      return false;
    }
    
    // Prüfe auf ha-departures-spezifische Attribute-Struktur
    const hasLineName = attrs.line_name !== undefined;
    const hasLineId = attrs.line_id !== undefined;
    const hasTransport = attrs.transport !== undefined;
    const hasDataProvider = attrs.data_provider !== undefined;
    const hasPlannedDepartureTime = attrs.planned_departure_time !== undefined;
    const hasLatitude = attrs.latitude !== undefined;
    const hasLongitude = attrs.longitude !== undefined;
    
    // ha-departures: Hat line_name UND (line_id ODER transport) UND planned_departure_time
    // ODER: Hat data_provider UND planned_departure_time
    if (hasLineName && hasPlannedDepartureTime && (hasLineId || hasTransport || hasDataProvider)) {
      return true;
    }
    
    // Auch wenn latitude/longitude vorhanden sind (typisch für ha-departures)
    if (hasLatitude && hasLongitude && hasPlannedDepartureTime && !hasNextArray) {
      return true;
    }
  }
  
  // Fallback: Keyword-basierte Erkennung, aber nur wenn nicht HVV oder KVV
  if (entityId.includes('hvv') || name.includes('hvv')) {
    return false;
  }
  
  if (name.toUpperCase().includes('KVV') || entityId.toUpperCase().includes('KVV')) {
    return false;
  }
  
  return (entityId.includes('departure') || 
          entityId.includes('abfahrt') ||
          name.includes('departure') || 
          name.includes('abfahrt'));
}

function filterDbInfoEntity(entity, entityId, name, hass) {
  // db_info-Entities haben charakteristische Attribute:
  // - Attribute mit Leerzeichen im Namen: 'Departure Time', 'Arrival Time', etc.
  // - 'Departure', 'Arrival', 'Duration', 'Name', 'Transfers', 'Problems'
  // - Friendly name enthält "→" und "Verbindung"
  
  if (hass && hass.states && hass.states[entity.entity_id]) {
    const state = hass.states[entity.entity_id];
    const attrs = state.attributes || {};
    
    // Prüfe auf db_info-spezifische Attribute-Struktur (Attribute mit Leerzeichen)
    const hasDbInfoAttrs = attrs['Departure Time'] !== undefined || 
                          attrs['Arrival Time'] !== undefined ||
                          attrs['Departure Time Real'] !== undefined ||
                          attrs['Arrival Time Real'] !== undefined ||
                          attrs['Departure'] !== undefined ||
                          attrs['Arrival'] !== undefined ||
                          attrs['Duration'] !== undefined ||
                          attrs['Name'] !== undefined ||
                          attrs['Transfers'] !== undefined;
    
    if (hasDbInfoAttrs) {
      return true;
    }
    
    // Prüfe friendly_name für "→" und "Verbindung"
    const friendlyName = attrs.friendly_name || name || '';
    if (friendlyName.includes('→') && friendlyName.includes('Verbindung')) {
      return true;
    }
  }
  
  // Exclude network/router connections (Fritz!Box, etc.)
  const dbInfoNetworkKeywords = [
    'fritz', 'router', 'network', 'netzwerk',
    'wifi', 'wlan',
    'ethernet',
    'download', 'herunterladen',
    'upload', 'hochladen',
    'throughput', 'bandweite', 'datenrate',
    'wan', 'lan',
    'connection type', 'connectiontype', 'verbindungstyp', 'verbindungsart'
  ];
  const hasDbInfoNetworkKeyword = dbInfoNetworkKeywords.some(keyword => 
    entityId.includes(keyword) || name.includes(keyword)
  );
  
  if (hasDbInfoNetworkKeyword) {
    return false;
  }
  
  // db_info entities typically have 'db_info' in the entity_id or 'db info' in the name
  if (entityId.includes('db_info') || name.includes('db info')) {
    return true;
  }
  
  // db_info creates sensors with 'verbindung' in the entity_id (e.g., sensor.*_verbindung_*)
  // Check for verbindung/connection keywords but exclude network-related ones
  const hasDbInfoConnectionKeyword = entityId.includes('verbindung') ||
                                   name.includes('verbindung') ||
                                   entityId.includes('connection') ||
                                   name.includes('connection');
  
  // If it has verbindung/connection keyword and doesn't have network keywords, include it
  return hasDbInfoConnectionKeyword;
}

function filterKvvEntity(entity, entityId, name, hass) {
  // KVV Departure Monitor entities have characteristic attributes:
  // - 'abfahrten' array with departure objects
  // - Each departure has: 'line', 'direction', 'countdown', 'realtime', 'dateTime'
  // - Entity ID typically contains 'kvv' and 'abfahrten'
  
  if (hass && hass.states && hass.states[entity.entity_id]) {
    const state = hass.states[entity.entity_id];
    const attrs = state.attributes || {};
    
    // Check for KVV-specific attribute structure
    const hasAbfahrtenArray = Array.isArray(attrs.abfahrten);
    
    if (hasAbfahrtenArray) {
      // Verify it's actually KVV format (check first departure object structure)
      if (attrs.abfahrten.length > 0) {
        const firstDeparture = attrs.abfahrten[0];
        const hasKvvStructure = firstDeparture.line !== undefined &&
                               firstDeparture.direction !== undefined &&
                               (firstDeparture.countdown !== undefined || firstDeparture.dateTime !== undefined);
        
        if (hasKvvStructure) {
          return true;
        }
      } else {
        // Empty array is still valid KVV entity
        return true;
      }
    }
  }
  
  // Fallback: Keyword-based detection
  return entityId.includes('kvv') || 
         name.includes('kvv') ||
         (entityId.includes('abfahrten') && !entityId.includes('hvv')) ||
         (name.includes('abfahrten') && !name.includes('hvv'));
}

function filterDefaultTransportEntity(entityId, name) {
  // Fallback: allgemeine Transport-Keywords
  const transportKeywords = [
    'departure', 'departures', 'abfahrt', 'abfahrten',
    'public_transport', 'public-transport', 'publictransport',
    'transport', 'verkehr', 'nahverkehr',
    'bus', 'bahn', 'train', 'u-bahn', 'ubahn', 's-bahn', 'sbahn',
    'haltestelle', 'stop'
  ];
  const wholeWordKeywords = ['station'];
  
  const hasTransportKeyword = transportKeywords.some(keyword => 
    entityId.includes(keyword) || name.includes(keyword)
  );
  const hasWholeWordKeyword = wholeWordKeywords.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(entityId) || regex.test(name);
  });
  
  return hasTransportKeyword || hasWholeWordKeyword;
}

