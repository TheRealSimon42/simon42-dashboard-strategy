# simon42 Dashboard Strategy

Eine modulare Dashboard-Strategy für Home Assistant, die automatisch Views basierend auf Bereichen, Entitäten und deren Zuständen generiert. Wächst mit dem User mit & ist sowohl für Anfänger als auch Fortgeschrittene interessant.

## ✨ Highlights

- 🎨 **Grafischer Konfigurator** - Keine YAML-Kenntnisse erforderlich
- 🏠 **Automatische Raum-Erkennung** - Nutzt Home Assistant Areas & Devices
- 🔧 **Granulare Entity-Kontrolle** - Verstecke einzelne Entities pro Raum und Domain
- 📊 **Intelligente Gruppierung** - Entities nach Domains und Status gruppiert
- 🔄 **Drag & Drop** - Einfache Neuordnung von Bereichen
- 🎯 **Label-System** - Globale Entity-Filterung via Labels
- 📱 **Responsive Design** - Optimiert für Desktop, Tablet und Mobile

## 🏗️ Architektur-Übersicht

```
simon42-strategy/
├── simon42-strategies-loader.js          # Entry Point - lädt alle Module
├── core/
│   ├── simon42-dashboard-strategy.js     # Haupt-Strategy (generiert Dashboard-Struktur)
│   ├── simon42-dashboard-strategy-editor.js  # GUI-Editor für Konfiguration
│   └── editor/
│       ├── simon42-editor-handlers.js    # Event-Handler (Checkboxen, Drag&Drop, Expand)
│       ├── simon42-editor-styles.js      # CSS für Editor (verschachtelte Struktur)
│       └── simon42-editor-template.js    # HTML-Template für Editor (Area → Domain → Entity)
├── utils/
│   ├── simon42-helpers.js                # Helper-Funktionen (Filterung, Sortierung)
│   ├── simon42-data-collectors.js        # Datensammlung (Personen, Lichter, etc.)
│   ├── simon42-badge-builder.js          # Badge-Erstellung
│   ├── simon42-section-builder.js        # Section-Erstellung (Grid-Layouts)
│   └── simon42-view-builder.js           # View-Definitionen
└── views/
    ├── simon42-view-room.js              # Raum-Details (pro Bereich, config-aware)
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
   - Übergibt `groups_options` an View-Strategies
3. **View Strategies** werden für jeden Bereich/View dynamisch ausgeführt
   - Respektieren `groups_options` für Entity-Filterung

## 📁 Datei-Beschreibungen

### Core

**`simon42-dashboard-strategy.js`**
- Haupteinstiegspunkt für Dashboard-Generierung
- `generate()`: Erstellt komplette Dashboard-Struktur
- Orchestriert Data Collection → Section Building → View Building
- Übergibt `areas_options` an Area-Views
- Registriert sich als `ll-strategy-simon42-dashboard`

**`simon42-dashboard-strategy-editor.js`**
- GUI-Konfigurationseditor (Custom Element)
- Verwaltet Config-State: `show_energy`, `show_subviews`, `areas_display`, `areas_options`
- **Persistenter Expand-State** - Bereiche bleiben während Konfiguration aufgeklappt
- **Intelligentes Re-Rendering** - Verhindert unnötige Re-Renders bei Config-Änderungen
- Nutzt modulare Editor-Komponenten aus `editor/`
- Feuert `config-changed` Events bei Änderungen

**`editor/simon42-editor-handlers.js`**
- Event-Handler für Editor-Interaktionen
- **Drag&Drop** für Area-Sortierung (über Drag-Handle)
- **Expand-Button-Listener** für Areas und Domain-Gruppen
- **Checkbox-Listener** auf drei Ebenen:
  - Area-Ebene (kompletter Bereich an/aus)
  - Domain-Gruppen-Ebene (alle Entities einer Domain an/aus)
  - Entity-Ebene (einzelne Entities an/aus)
- **Indeterminate-State-Verwaltung** für teilweise ausgewählte Gruppen
- **Dynamisches Entity-Loading** beim Aufklappen von Areas
- `getAreaGroupedEntities()`: Gruppiert Entities nach Domains (analog zu view-room.js)

**`editor/simon42-editor-styles.js`**
- CSS-Styles für Editor-UI
- **Verschachtelte Struktur**: Area → Domain-Gruppe → Entity
- Drag-Handle mit `cursor: grab/grabbing`
- Expand-Icons mit Rotation-Animation
- Indeterminate-Checkbox-Styling
- Entity-Liste mit Icons und IDs

**`editor/simon42-editor-template.js`**
- HTML-Template-Generierung für Editor
- **Hierarchische Struktur**:
  - Area-Liste mit Drag&Drop-Support
  - Domain-Gruppen (Beleuchtung, Klima, Rollos, etc.)
  - Entity-Liste mit Friendly-Names und IDs
- `renderAreaEntitiesHTML()`: Rendert Entity-Gruppen für einen Bereich

### Utils

**`simon42-helpers.js`**
- `getVisibleAreas()`: Filtert/sortiert Areas basierend auf Config
- `stripAreaName()`: Entfernt Raumnamen aus Entity-Namen
- `isEntityHiddenOrDisabled()`: Prüft Registry-Status
- `sortByLastChanged()`: Sortierung nach letzter Änderung
- `getExcludedLabels()`: Erstellt Liste von `no_dboard` Entities

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
- `createAreaViews()`: Pro Bereich ein View mit `groups_options`

### Views

**`simon42-view-room.js`** ⭐ Config-Aware
- Detailansicht pro Raum
- Filtert Entities nach Area-Zugehörigkeit (direct + device-based)
- Gruppiert nach Domains: lights, covers, climate, media_player, scenes, etc.
- **Respektiert `groups_options`**:
  - Filtert versteckte Entities aus `groups_options[domain].hidden`
  - Sortiert nach `groups_options[domain].order`
- `applyGroupFilter()`: Wendet Config-Filter pro Domain-Gruppe an
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

### Basis-Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
  show_energy: true              # Standard: true
  show_subviews: false           # Standard: false (utility views als subviews)
  areas_display:
    hidden: [area_id1, area_id2] # Versteckte Bereiche
    order: [area_id3, area_id1]  # Custom Sortierung
```

### Erweiterte Konfiguration (Entity-Filterung)

```yaml
strategy:
  type: custom:simon42-dashboard
  show_energy: true
  show_subviews: false
  areas_display:
    hidden: [bad, garage]
    order: [wohnzimmer, kueche, schlafzimmer]
  areas_options:
    wohnzimmer:
      groups_options:
        lights:
          hidden: [light.stehlampe, light.alte_lampe]
          order: [light.decke, light.couch, light.schrank]
        climate:
          hidden: [climate.old_thermostat]
        covers:
          hidden: [cover.rollo_links]
    kueche:
      groups_options:
        lights:
          hidden: [light.dunstabzug]
        switches:
          hidden: [switch.kaffeemaschine]
```

### Config-Struktur

- **`show_energy`** (boolean, Standard: `true`): Zeigt Energie-Dashboard in Übersicht
- **`show_subviews`** (boolean, Standard: `false`): Zeigt Utility-Views in Navigation
- **`areas_display`** (object): Bereich-Verwaltung
  - `hidden` (array): Liste versteckter Area-IDs
  - `order` (array): Sortierung der Areas
- **`areas_options`** (object): Entity-Verwaltung pro Bereich
  - `{area_id}` (object): Optionen für einen Bereich
    - `groups_options` (object): Domain-spezifische Optionen
      - `{domain}` (object): Optionen für eine Domain-Gruppe
        - `hidden` (array): Versteckte Entity-IDs
        - `order` (array): Sortierung der Entities

## 🎨 Grafischer Konfigurator

Der Editor bietet eine intuitive Benutzeroberfläche:

### Bereiche-Verwaltung
- ☰ **Drag-Handle**: Ziehe Bereiche, um die Reihenfolge zu ändern
- ☑️ **Area-Checkbox**: Bereiche ein-/ausblenden
- ▶ **Expand-Button**: Klappt Bereich auf für Entity-Verwaltung

### Domain-Gruppen
Nach dem Aufklappen eines Bereichs:
- ☑️ **Gruppen-Checkbox**: Alle Entities einer Domain ein-/ausblenden
  - ⊟ **Indeterminate-State**: Bei teilweise ausgewählten Entities
- 🔧 **Domain-Icons**: Visuelle Unterscheidung (Beleuchtung, Klima, etc.)
- 📊 **Entity-Count**: Anzahl der Entities in der Gruppe
- ▶ **Expand-Button**: Klappt Entity-Liste auf

### Entity-Liste
- ☑️ **Entity-Checkbox**: Einzelne Entities ein-/ausblenden
- 📝 **Friendly-Name**: Lesbarer Entity-Name
- 🔤 **Entity-ID**: Technische ID (monospace)

### Features
- **Persistenter State**: Aufgeklappte Bereiche bleiben während Konfiguration offen
- **Echtzeit-Updates**: Config wird automatisch gespeichert
- **Intelligente Gruppierung**: Automatische Erkennung von Entity-Domains
- **Visuelle Hierarchie**: Area → Domain → Entity

## 🏷️ Label-System

### Globale Labels

- **`no_dboard`**: Entity wird **überall** im Dashboard ausgeschlossen
  - Wird nicht in Übersichten angezeigt
  - Wird nicht im Konfigurator gelistet
  - Ideal für Hilfs-Entities und Debug-Sensoren
  
- **`show_dboard`**: (reserviert für zukünftige Nutzung)

### Kombinierbarkeit

Labels und `groups_options` ergänzen sich:
1. **`no_dboard` Label**: Globale Exklusion (wird nie gelistet)
2. **`groups_options.hidden`**: Bereich-spezifische Exklusion (via Konfigurator)

**Beispiel:**
```yaml
# Global versteckt (Label):
- light.debug_light (no_dboard)

# Im Wohnzimmer versteckt (Config):
- light.stehlampe (groups_options.lights.hidden)
```

## 🔌 Custom Elements

- `ll-strategy-simon42-dashboard` - Haupt-Strategy
- `simon42-dashboard-strategy-editor` - Config-Editor
- `ll-strategy-simon42-view-room` - Raum-View
- `ll-strategy-simon42-view-lights` - Lichter-View
- `ll-strategy-simon42-view-covers` - Covers-View
- `ll-strategy-simon42-view-security` - Security-View
- `ll-strategy-simon42-view-batteries` - Batterie-View

## 📋 Entity-Filterung

Entities werden in folgender Reihenfolge gefiltert:

1. **Label-Exklusion** (`no_dboard`)
   - Globale Filterung via Labels
   - Wird nirgendwo im Dashboard angezeigt

2. **Area-Zugehörigkeit**
   - Entities mit direkter Area-Zuweisung
   - Entities über Device-Area-Zuweisung

3. **Entity Category** 
   - Keine `config` oder `diagnostic` Entities

4. **Hidden/Disabled Status** (Registry)
   - Versteckte oder deaktivierte Entities

5. **Availability** 
   - Entity muss in `hass.states` existieren

6. **`groups_options.hidden`** ⭐ NEU
   - Bereich-spezifische Filterung via Konfigurator
   - Pro Domain konfigurierbar

## 🎯 Besonderheiten

- **Modulares Design**: Jede Komponente hat klare Verantwortung
- **Dynamic Grouping**: Entities werden nach State/Klasse gruppiert
- **Batch Actions**: Heading-Badges für Gruppen-Aktionen
- **Area Binding**: Entities über direkte Area-ID oder Device-Area-ID
- **Badge Prioritization**: Area-spezifische Sensoren haben Vorrang
- **Name Stripping**: Automatische Entfernung von Raumnamen aus Entity-Namen
- **Config-Aware Views** ⭐: Room-Views respektieren `groups_options`
- **Persistent Editor State** ⭐: Keine Re-Renders während Konfiguration
- **Granulare Kontrolle** ⭐: Entity-Verwaltung auf Domain-Ebene

## 📦 Installation

1. Kopiere alle Dateien nach `/config/www/simon42-strategy/`

2. Füge zu `configuration.yaml` hinzu:
```yaml
lovelace:
  mode: storage
  resources:
    - url: /local/simon42-strategy/simon42-strategies-loader.js
      type: module
```

3. Starte Home Assistant neu

4. Erstelle ein neues Dashboard:
   - Dashboard → ⋮ → Dashboard bearbeiten
   - Strategie-Typ auswählen: `simon42 Dashboard`
   - Konfiguriere über den grafischen Editor

## 🚀 Roadmap

- [ ] Hinzufügen von eigenen Views aus anderen Dashboards
- [ ] Entity-Sortierung per Drag & Drop im Editor
- [ ] Preset-Templates für verschiedene Use-Cases


## 🤝 Beitragen

!!!Maintainers Wanted!!!

Contributions sind willkommen! Bitte erstelle einen Issue oder Pull Request (den du vorher bitte auf Herz & Nieren getestet hast 🫶) auf GitHub.


## 📄 Lizenz

Attribution-NonCommercial-ShareAlike 4.0 International - siehe LICENSE Datei für Details