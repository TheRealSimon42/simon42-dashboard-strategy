# SIMON42 Dashboard Strategy

Eine modulare Dashboard-Strategy für Home Assistant, die automatisch Views basierend auf Bereichen, Entitäten und deren Zuständen generiert.

## 🏗️ Architektur-Übersicht

```
simon42-strategy/
├── simon42-strategies-loader.js          # Entry Point - lädt alle Module
├── core/
│   ├── simon42-dashboard-strategy.js     # Haupt-Strategy (generiert Dashboard-Struktur)
│   ├── simon42-dashboard-strategy-editor.js  # GUI-Editor für Konfiguration
│   └── editor/
│       ├── simon42-editor-handlers.js    # Event-Handler (Checkboxen, Drag&Drop)
│       ├── simon42-editor-styles.js      # CSS für Editor
│       └── simon42-editor-template.js    # HTML-Template für Editor
├── utils/
│   ├── simon42-helpers.js                # Helper-Funktionen (Filterung, Sortierung)
│   ├── simon42-data-collectors.js        # Datensammlung (Personen, Lichter, etc.)
│   ├── simon42-badge-builder.js          # Badge-Erstellung
│   ├── simon42-section-builder.js        # Section-Erstellung (Grid-Layouts)
│   └── simon42-view-builder.js           # View-Definitionen
└── views/
    ├── simon42-view-room.js              # Raum-Details (pro Bereich)
    ├── simon42-view-lights.js            # Lichter-Übersicht
    ├── simon42-view-covers.js            # Rollos/Vorhänge
    ├── simon42-view-security.js          # Sicherheit (Schlösser, Türen, Fenster)
    └── simon42-view-batteries.js         # Batterie-Status
```

## 🔄 Datenfluss

1. **Loader** (`simon42-strategies-loader.js`) registriert alle Module
2. **Core Strategy** (`simon42-dashboard-strategy.js`):
   - Ruft HA-Registries ab (Areas, Devices, Entities)
   - Sammelt Daten via **Data Collectors**
   - Erstellt Sections via **Section Builder**
   - Generiert Views via **View Builder**
3. **View Strategies** werden für jeden Bereich/View dynamisch ausgeführt

## 📁 Datei-Beschreibungen

### Core

**`simon42-dashboard-strategy.js`**
- Haupteinstiegspunkt für Dashboard-Generierung
- `generate()`: Erstellt komplette Dashboard-Struktur
- Orchestriert Data Collection → Section Building → View Building
- Registriert sich als `ll-strategy-simon42-dashboard`

**`simon42-dashboard-strategy-editor.js`**
- GUI-Konfigurationseditor (Custom Element)
- Verwaltet Config-State: `show_energy`, `show_subviews`, `areas_display`
- Nutzt modulare Editor-Komponenten aus `editor/`
- Feuert `config-changed` Events bei Änderungen

**`editor/simon42-editor-handlers.js`**
- Event-Handler für Editor-Interaktionen
- Drag&Drop für Area-Sortierung
- Checkbox-Listener (Energie, Subviews, Area-Sichtbarkeit)

**`editor/simon42-editor-styles.js`**
- CSS-Styles für Editor-UI (Grid, Drag-Handles, Checkboxen)

**`editor/simon42-editor-template.js`**
- HTML-Template-Generierung für Editor
- Rendert Area-Liste mit Drag&Drop-Support

### Utils

**`simon42-helpers.js`**
- `getVisibleAreas()`: Filtert/sortiert Areas basierend auf Config
- `stripAreaName()`: Entfernt Raumnamen aus Entity-Namen
- `isEntityHiddenOrDisabled()`: Prüft Registry-Status
- `sortByLastChanged()`: Sortierung nach letzter Änderung

**`simon42-data-collectors.js`**
- Sammelt spezifische Entity-Typen aus `hass.states`
- `collectPersons()`, `collectLights()`, `collectCovers()`
- `collectSecurityUnsafe()`: Locks, Türen, Fenster (offen/unlocked)
- `collectBatteriesCritical()`: Batterien < 20%
- Berücksichtigt `no_dboard` Label-Filter

**`simon42-badge-builder.js`**
- `createPersonBadges()`: Badges für Personen (home/away)
- Verwendet Visibility-Conditions für dynamische Anzeige

**`simon42-section-builder.js`**
- Erstellt Dashboard-Sections (Grid-Layouts)
- `createOverviewSection()`: Summary-Tiles (Lichter, Covers, Security, Batterien)
- `createAreasSection()`: Area-Cards
- `createWeatherEnergySection()`: Wetter + Energie-Verteilung

**`simon42-view-builder.js`**
- Definiert View-Strukturen
- `createOverviewView()`: Haupt-View mit Badges/Sections
- `createUtilityViews()`: Lichter/Covers/Security/Batterien (mit subview-Flag)
- `createAreaViews()`: Pro Bereich ein View

### Views

**`simon42-view-room.js`**
- Detailansicht pro Raum
- Filtert Entities nach Area-Zugehörigkeit (direct + device-based)
- Gruppiert nach Domains: lights, covers, climate, media_player, scenes, etc.
- Erstellt Sensor-Badges (Temperatur, Luftfeuchtigkeit, PM2.5/10, CO2, VOC, Motion, Occupancy)
- Respektiert `area.temperature_entity_id` und `area.humidity_entity_id` als primäre Sensoren
- Sections: Beleuchtung, Klima, Rollos, Vorhänge, Medien, Szenen, Sonstiges

**`simon42-view-lights.js`**
- Alle Lichter gruppiert nach Status (on/off)
- Batch-Aktionen via Heading-Badges (alle an/aus)
- Tile-Cards mit `light-brightness` Feature

**`simon42-view-covers.js`**
- Covers gefiltert nach `device_classes` (blind, curtain, shutter, etc.)
- Gruppiert nach Status (open/closed)
- Batch-Aktionen für öffnen/schließen

**`simon42-view-security.js`**
- Gruppiert nach: Locks, Doors/Gates, Garages, Windows/Sensors
- Jeweils aufgeteilt in offen/geschlossen bzw. locked/unlocked
- Verwendet `device_class` für Kategorisierung

**`simon42-view-batteries.js`**
- Batterie-Entities gruppiert nach Status:
  - Kritisch (< 20%) - rot
  - Niedrig (20-50%) - gelb
  - Gut (> 50%) - grün
- Zeigt `last_changed` in Tiles

## 🎛️ Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
  show_energy: true              # Standard: true
  show_subviews: false           # Standard: false (utility views als subviews)
  areas_display:
    hidden: [area_id1, area_id2] # Versteckte Bereiche
    order: [area_id3, area_id1]  # Custom Sortierung
```

## 🏷️ Label-System

- **`no_dboard`**: Entity wird überall ausgeschlossen
- **`show_dboard`**: (reserviert für zukünftige Nutzung)

## 🔌 Custom Elements

- `ll-strategy-simon42-dashboard` - Haupt-Strategy
- `simon42-dashboard-strategy-editor` - Config-Editor
- `ll-strategy-simon42-view-room` - Raum-View
- `ll-strategy-simon42-view-lights` - Lichter-View
- `ll-strategy-simon42-view-covers` - Covers-View
- `ll-strategy-simon42-view-security` - Security-View
- `ll-strategy-simon42-view-batteries` - Batterie-View

## 📋 Entity-Filterung

Entities werden gefiltert nach:
1. Label-Exklusion (`no_dboard`)
2. Entity Category (keine `config`/`diagnostic`)
3. Hidden/Disabled Status (Registry)
4. Availability (`hass.states[entity_id]` existiert)

## 🎯 Besonderheiten

- **Modulares Design**: Jede Komponente hat klare Verantwortung
- **Dynamic Grouping**: Entities werden nach State/Klasse gruppiert
- **Batch Actions**: Heading-Badges für Gruppen-Aktionen
- **Area Binding**: Entities über direkte Area-ID oder Device-Area-ID
- **Badge Prioritization**: Area-spezifische Sensoren haben Vorrang
- **Name Stripping**: Automatische Entfernung von Raumnamen aus Entity-Namen