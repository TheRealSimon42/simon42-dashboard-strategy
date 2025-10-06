// ====================================================================
// BADGE BUILDER - Erstellt Badges für Personen
// ====================================================================

/**
 * Erstellt Badges für Personen (zuhause/nicht zuhause)
 */
export function createPersonBadges(persons) {
  const badges = [];
  
  persons.forEach(person => {
    // Badge wenn Person zuhause ist (grünes Icon)
    badges.push({
      type: "entity",
      show_name: true,
      show_state: true,
      show_icon: true,
      entity: person.entity_id,
      name: person.name.split(' ')[0], // Nur Vorname
      visibility: [
        {
          condition: "state",
          entity: person.entity_id,
          state: "home"
        }
      ]
    });
    
    // Badge wenn Person nicht zuhause ist (oranges Icon)
    badges.push({
      type: "entity",
      show_name: true,
      show_state: true,
      show_icon: true,
      entity: person.entity_id,
      name: person.name.split(' ')[0], // Nur Vorname
      color: "accent",
      visibility: [
        {
          condition: "state",
          entity: person.entity_id,
          state_not: "home"
        }
      ]
    });
  });
  
  return badges;
}