// ====================================================================
// BADGE BUILDER - Erstellt Badges für Personen
// ====================================================================

/**
 * Erstellt Badges für Personen (zuhause/nicht zuhause)
 * WICHTIG: Nutzt hass.states um nur sichtbare Badges zu erstellen
 * @param {Array} persons - Array von Person-Entitäten
 * @param {Object} hass - Home Assistant Objekt
 * @param {boolean} showPersonBadges - Ob Person-Badges angezeigt werden sollen (Standard: true)
 */
export function createPersonBadges(persons, hass, showPersonBadges = true) {
  const badges = [];
  
  if (!showPersonBadges) {
    return badges; // Leeres Array zurückgeben wenn deaktiviert
  }
  
  persons.forEach(person => {
    const state = hass.states[person.entity_id];
    if (!state) return; // Überspringe wenn keine State vorhanden

    // 2. Registry-Check - DIREKT aus hass.entities (O(1) Lookup)
    const registryEntry = hass.entities?.[person.entity_id];
    if (registryEntry?.hidden === true) return;
    
    const isHome = state.state === 'home';
    
    if (isHome) {
      // Badge wenn Person zuhause ist (grünes Icon)
      badges.push({
        type: "entity",
        show_name: true,
        show_state: true,
        show_icon: true,
        entity: person.entity_id,
        name: person.name.split(' ')[0] // Nur Vorname
      });
    } else {
      // Badge wenn Person nicht zuhause ist (oranges Icon)
      badges.push({
        type: "entity",
        show_name: true,
        show_state: true,
        show_icon: true,
        entity: person.entity_id,
        name: person.name.split(' ')[0], // Nur Vorname
        color: "accent"
      });
    }
  });
  
  return badges;
}