# Features

Diese Dokumentation beschreibt alle Features der simon42 Dashboard Strategy im Detail.

## Inhaltsverzeichnis

- [Grafischer Konfigurator](#grafischer-konfigurator)
- [Automatische Raum-Erkennung](#automatische-raum-erkennung)
- [Spezialisierte Views](#spezialisierte-views)
- [Favoriten-System](#favoriten-system)
- [Raum-Pins](#raum-pins)
- [Batch-Aktionen](#batch-aktionen)
- [Floor-basierte Organisation](#floor-basierte-organisation)
- [Performance-Optimierungen](#performance-optimierungen)

## Grafischer Konfigurator

Der Editor ist das Herzstück der simon42 Dashboard Strategy - **keine YAML-Kenntnisse erforderlich!** Alle Konfigurationen können über die intuitive grafische Oberfläche vorgenommen werden.

Siehe [EDITOR.md](EDITOR.md) für eine detaillierte Anleitung zur Verwendung des Editors.

### Hauptmerkmale

- **Intuitive Hierarchie** - Area → Domain → Entity-Struktur
- **Drag & Drop** - Einfache Neuordnung von Bereichen
- **Persistenter State** - Aufgeklappte Bereiche bleiben während der Konfiguration offen
- **Automatisches Speichern** - Änderungen werden sofort in die Config übernommen
- **Intelligente Gruppierung** - Entities werden automatisch nach Domain erkannt
- **Visuelle Hierarchie** - Einrückungen zeigen die Struktur klar

## Automatische Raum-Erkennung

Das Dashboard nutzt die Home Assistant Areas & Devices, um automatisch Räume zu erkennen und Entities zuzuordnen.

### Funktionsweise

1. **Area-basierte Zuordnung** - Entities werden ihren zugeordneten Areas zugewiesen
2. **Device-basierte Zuordnung** - Entities ohne direkte Area-Zuordnung werden über ihre Devices zugeordnet
3. **Automatische Gruppierung** - Entities werden nach Domain (lights, climate, covers, etc.) gruppiert

### Vorteile

- Keine manuelle Konfiguration erforderlich
- Automatische Aktualisierung bei neuen Entities
- Konsistente Struktur über das gesamte Dashboard

## Spezialisierte Views

Das Dashboard generiert automatisch spezialisierte Views für verschiedene Entity-Typen.

Siehe [VIEWS.md](VIEWS.md) für detaillierte Informationen zu allen Views.

### Verfügbare Views

- **Raum-View** - Pro Bereich mit allen relevanten Entities
- **Lichter-Übersicht** - Alle Lichter, gruppiert nach Status (on/off)
- **Rollos & Vorhänge** - Covers gruppiert nach Position (offen/geschlossen)
- **Sicherheit** - Türen, Fenster, Schlösser mit Status-Übersicht
- **Batterie-Status** - Kritische, niedrige und gute Batterien

## Favoriten-System

Markiere wichtige Entitäten, die in der Übersicht als separate Sektion angezeigt werden.

### Verwendung

1. Öffne den Dashboard-Editor
2. Scrolle zur Sektion "Favoriten"
3. Wähle eine Entität aus dem Dropdown
4. Klicke auf "+ Hinzufügen"

### Features

- Favoriten werden als separate Sektion in der Übersicht angezeigt
- Jede Favoriten-Entity wird als Tile-Card mit Bild und Last-Changed-Anzeige dargestellt
- Schneller Zugriff auf häufig genutzte Entitäten

### Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
  favorite_entities:
    - sensor.temperatur_wohnzimmer
    - light.hauptbeleuchtung
    - cover.rollo_wohnzimmer
```

## Raum-Pins

Pinne spezielle Entitäten, die nur in ihren zugeordneten Räumen angezeigt werden sollen.

### Verwendung

1. Öffne den Dashboard-Editor
2. Scrolle zur Sektion "Raum-Pins"
3. Wähle eine Entität aus dem Dropdown (nur Entitäten mit Raum-Zuordnung)
4. Klicke auf "+ Hinzufügen"

### Ideal für

- Wetterstationen mit spezifischen Sensoren
- Admin-Entitäten, die nicht automatisch erkannt werden
- Spezielle Entitäten, die nur in einem bestimmten Raum relevant sind
- Entities mit speziellen Device-Classes

### Verhalten

- Pins erscheinen **nur** im zugeordneten Raum (nicht in der Übersicht)
- Anzeige am **Ende** der Raum-View (nach allen anderen Sections)
- Überschrift: "Raum-Pins" mit Pin-Icon

### Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
  room_pin_entities:
    - sensor.wetterstation_temperatur
    - sensor.wetterstation_luftfeuchtigkeit
    - sensor.admin_sensor
```

## Batch-Aktionen

Alle Gruppen-Views unterstützen Batch-Aktionen über Heading-Badges.

### Beispiel Lichter

```
[💡 Alle ein] [💡 Alle aus]  Eingeschaltete Lichter (5)
├── Wohnzimmer Decke
├── Küche Arbeitsplatte
└── ...
```

### Verfügbar für

- Lichter (Alle ein/aus)
- Rollos (Alle öffnen/schließen)
- Bereiche (Alle Lichter des Raums)

### Funktionsweise

- Heading-Badges werden automatisch generiert
- Klick auf Badge führt Batch-Aktion aus
- Sofortige visuelle Rückmeldung

## Floor-basierte Organisation

Mit `group_by_floors: true` werden Bereiche nach Etagen gruppiert.

### Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
  group_by_floors: true
```

### Ergebnis

```
📍 Erdgeschoss
   ├── Wohnzimmer
   ├── Küche
   └── Gäste-WC

📍 Obergeschoss
   ├── Schlafzimmer
   ├── Bad
   └── Arbeitszimmer

📍 Weitere Bereiche
   └── Garten
```

### Vorteile

- Bessere Übersicht bei vielen Bereichen
- Logische Gruppierung nach physischer Lage
- Separate Sections mit Heading für jede Etage

## Performance-Optimierungen

Das Dashboard ist für maximale Performance optimiert.

### Registry-Caching

- Alle Registry-Daten werden aus dem `hass`-Objekt gelesen
- Keine WebSocket-Calls mehr nötig
- **85% Reduktion** der API-Calls

### Intelligente Filterung

Die Filterung erfolgt in einer optimierten Reihenfolge (von günstig zu teuer):

1. Domain-basierte Filterung (Set-Lookup: O(1))
2. Label-Exklusion (no_dboard)
3. Area-Binding Checks
4. Entity Registry Validierung
5. State Availability Check

### Lazy Loading

- Entities werden erst beim Aufklappen geladen
- Kein unnötiges Laden von versteckten Bereichen
- Reduzierte initiale Ladezeit

### Set-basierte Lookups

- Verwendung von `Set` für O(1) Lookups statt `Array.includes()` für große Collections
- Caching von teuren Berechnungen (wie hidden entities from config)
- Frühe Filterung (Domain-Filter zuerst) zur Reduzierung von Iterationen

Siehe [ADVANCED.md](ADVANCED.md#performance-optimierungen) für weitere technische Details.

