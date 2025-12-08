// ====================================================================
// BADGE BUILDER - Erstellt Badges für Personen
// ====================================================================

/**
 * Erstellt Badges für Personen (zuhause/nicht zuhause)
 * WICHTIG: Nutzt hass.states um nur sichtbare Badges zu erstellen
 * @param {Array} persons - Array von Person-Entitäten
 * @param {Object} hass - Home Assistant Objekt
 * @param {boolean} showPersonBadges - Ob Person-Badges angezeigt werden sollen (Standard: true)
 * @param {boolean} showPersonProfilePicture - Ob Profilbilder angezeigt werden sollen (Standard: false)
 */
export function createPersonBadges(persons, hass, showPersonBadges = true, showPersonProfilePicture = false) {
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
    
    // Badge-Konfiguration
    const badgeConfig = {
      type: "entity",
      show_name: true,
      show_state: true,
      show_icon: !showPersonProfilePicture, // Icon nur anzeigen wenn kein Profilbild
      entity: person.entity_id,
      name: person.name.split(' ')[0] // Nur Vorname
    };
    
    // Profilbild hinzufügen wenn aktiviert
    if (showPersonProfilePicture) {
      // Home Assistant Person entities haben ein 'entity_picture' Attribut
      // Laut Home Assistant Dokumentation kann 'image' verwendet werden, um entity_picture zu überschreiben
      // Siehe: https://www.home-assistant.io/dashboards/entities/
      const entityPicture = state.attributes?.entity_picture;
      if (entityPicture) {
        badgeConfig.image = entityPicture; // Verwende 'image' Property um entity_picture zu überschreiben
      } else {
        // Fallback: Icon anzeigen wenn kein Profilbild verfügbar
        badgeConfig.show_icon = true;
      }
    }
    
    if (!isHome) {
      badgeConfig.color = "accent";
    }
    
    badges.push(badgeConfig);
  });
  
  return badges;
}