# simon42 Dashboard Strategy

> **⚠️ Hinweis:** Diese README wird nicht laufend aktualisiert, sondern nur gelegentlich und leider auch viel zu unregelmäßig. Der aktuelle Code ist vermutlich bereits weiter als hier dokumentiert. Im Zweifel: Code ist die Dokumentation! 😅

Eine modulare und hochkonfigurierbare Dashboard-Strategy für Home Assistant, die automatisch Views basierend auf Bereichen, Entitäten und deren Zuständen generiert. Wächst mit dem User mit und ist sowohl für Anfänger als auch Fortgeschrittene interessant.

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=TheRealSimon42&repository=simon42-dashboard-strategy&category=plugin)

---

## 💖 Unterstütze dieses Projekt

Wenn dir die simon42 Dashboard Strategy hilft, unterstütze die Weiterentwicklung:

<p align="center">
  <a href="https://youtube.com/@simon42/join">
    <img src="https://img.shields.io/badge/YouTube-Kanalmitglied_werden-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube Kanalmitglied werden" />
  </a>
  <br/>
  <em>🫶 Bevorzugte Unterstützung: Werde Kanalmitglied auf YouTube!</em>
  <br/><br/>
  <a href="https://www.buymeacoffee.com/simon42official">
    <img src="https://img.shields.io/badge/Buy_Me_A_Coffee-Spende_einen_Kaffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" />
  </a>
</p>

---

## ✨ Features im Überblick

### 🎨 Benutzerfreundlichkeit
- **Grafischer Konfigurator** - Keine YAML-Kenntnisse erforderlich
- **Drag & Drop** - Einfache Neuordnung von Bereichen
- **Intuitive Hierarchie** - Area → Domain → Entity-Struktur
- **Echtzeit-Updates** - Änderungen werden sofort gespeichert
- **Responsive Design** - Optimiert für Desktop, Tablet und Mobile
- **Zweisprachigkeit** - Unterstützung für Deutsch und Englisch

### 🏠 Intelligente Automatisierung
- **Automatische Raum-Erkennung** - Nutzt Home Assistant Areas & Devices
- **Dynamische Gruppierung** - Entities nach Status und Typ gruppiert
- **Floor-basierte Organisation** - Optional: Bereiche nach Etagen gruppieren
- **Batch-Aktionen** - Gruppensteuerung über Heading-Badges
- **Reaktive Updates** - Echtzeit-Aktualisierung der Summary Cards

### 🔧 Granulare Kontrolle
- **Entity-Level-Filterung** - Verstecke einzelne Entities pro Raum und Domain
- **Label-System** - Globale Entity-Filterung via `no_dboard` Label
- **Bereich-spezifische Konfiguration** - Jeder Raum individuell anpassbar
- **Domain-Gruppierung** - Intelligente Zusammenfassung nach Entity-Typen
- **Favoriten-System** - Markiere wichtige Entitäten in der Übersicht
- **Raum-Pins** - Pinne spezielle Entitäten in ihren zugeordneten Räumen
- **Entity Name Transformation** - Transformiere Entity-Namen mit Regex-Patterns (z.B. entferne Präfixe für mobile Ansicht)

### 📊 Spezialisierte Views
- **Lichter-Übersicht** - Alle Lichter, gruppiert nach Status (on/off)
- **Rollos & Vorhänge** - Covers gruppiert nach Position (offen/geschlossen)
- **Sicherheit** - Türen, Fenster, Schlösser mit Status-Übersicht
- **Batterie-Status** - Kritische, niedrige und gute Batterien
- **Raum-Details** - Pro Bereich mit allen relevanten Entities

### ⚡ Performance
- **Registry-Caching** - Reduzierte WebSocket-Calls um 85%
- **Optimierte Filterung** - Domain-Filter vor komplexen Validierungen
- **Set-basierte Lookups** - Schnelle Entity-Suche
- **Lazy Loading** - Entities werden erst bei Bedarf geladen

### 🔌 Optionale Integrationen
- **Search Card Support** - Integration für custom search cards
- **Alarm Panel** - Unterstützung für Alarmanlagen
- **Reolink Kameras** - Erweiterte Kamera-Integration
- **Masonry Layout** - Integration des s42-masonry-view Projekts
- **Better Thermostat** - Ersetzt Standard-Thermostat-Karten durch Better Thermostat UI-Karten
- **Horizon Card** - Zeigt Sonnen- und Mondposition über dem Horizont in der Wetter-Sektion
- **Öffentlicher Nahverkehr** - Unterstützt HVV (Hamburg), ha-departures, KVV (Karlsruhe) und db_info Integrationen

## 📦 Installation

### Option 1: Manuelle Installation (Nicht empfohlen!)

<details>

<summary>Manuelle Installationsschritte</summary>

#### Schritt 1: Dateien kopieren

Kopiere alle Dateien aus dem `dist` Ordner nach:
```
/config/www/simon42-strategy/
```

#### Schritt 2: Resource registrieren

Füge in deiner `configuration.yaml` hinzu:

```yaml
lovelace:
  mode: storage
  resources:
    - url: /local/simon42-strategy/simon42-dashboard-strategy.js
      type: module
```

#### Schritt 3: Home Assistant neu starten

Starte Home Assistant neu, damit die neue Resource geladen wird.

#### Schritt 4: Dashboard erstellen

1. Gehe zu **Einstellungen** → **Dashboards**
2. Klicke auf **Dashboard hinzufügen**
3. Wähle **Neue Ansicht** und dann den **Edit-Modus**
4. Klicke auf die **drei Punkte** (⋮) → **Raw-Konfigurationseditor**
5. Füge die folgende Konfiguration ein:

```yaml
strategy:
  type: custom:simon42-dashboard
```

6. Speichere und schließe - der grafische Editor öffnet sich automatisch!

</details>

### Option 2: Installation über HACS (empfohlen)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=TheRealSimon42&repository=simon42-dashboard-strategy&category=plugin)


<details>

<summary>Alternative zum Button oben 👆</summary>

1. Gehe zu HACS → **Custom repositories**
2. Füge das Repository hinzu: `https://github.com/TheRealSimon42/simon42-dashboard-strategy`
3. Installiere die "Simon42 Dashboard Strategy"
4. Folge den Anweisungen in HACS für die Resource-Registrierung und Dashboard-Erstellung.

</details>

## 🖥️ Benutzung / Dashboard erstellen

1. Gehe zu **Einstellungen** → **Dashboards**
2. Klicke auf **Dashboard hinzufügen**
3. Wähle **Neues Dashboard von Grund auf** und vergebe einen Namen
4. Dann das neue Dashboard aufrufen und den **Edit-Modus** oben rechts aktivieren.
5. Klicke auf die **drei Punkte** (⋮) → **Raw-Konfigurationseditor**
6. Füge die folgende Konfiguration ein:

```yaml
strategy:
  type: custom:simon42-dashboard
```

7. Speichere und schließe - der **grafische Editor öffnet sich automatisch**! 🎉

**Wichtig:** Nach Updates den Browser-Cache leeren:
- **Hard Refresh**: `Ctrl+Shift+R` (Windows) oder `Cmd+Shift+R` (Mac)
- **Chrome DevTools**: F12 → Rechtsklick auf Refresh → "Empty Cache and Hard Reload"

Die aktuelle Version wird in der Browser-Konsole angezeigt. Prüfe `window.Simon42DashboardVersion` für Details.

<details>
<summary><strong>🤖 Projekt-Kontext für KI-Assistenten</strong></summary>

Dieses Projekt ist eine modulare Lovelace Dashboard-Strategy für Home Assistant, entwickelt von Simon42. Es generiert automatisch Views basierend auf HA-Areas, Devices und Entities. Die Codebasis ist in JavaScript (ES6-Module) strukturiert:

- **Entry-Point**: `dist/simon42-dashboard-strategy.js` (lädt den Loader)
- **Loader**: `dist/simon42-strategies-loader.js` (importiert alle Module)
- **Core**: Haupt-Strategy und Editor in `dist/core/`
- **Utils**: Hilfsfunktionen in `dist/utils/`
- **Views**: Spezialisierte View-Strategien in `dist/views/`
- **Cards**: Custom Cards in `dist/cards/`

Für Änderungen: Respektiere die modulare Struktur, nutze ES6-Imports/Exports, teste in HA-Umgebung. HACS-kompatibel seit Version 1.0.2.

</details>

## 🎨 Grafischer Konfigurator (Editor)

Der Editor ist das Herzstück der simon42 Dashboard Strategy - **keine YAML-Kenntnisse erforderlich!** Alle Konfigurationen können über die intuitive grafische Oberfläche vorgenommen werden.

Der Editor bietet eine intuitive dreistufige Hierarchie zur Konfiguration:

### Stufe 1: Bereiche verwalten

```
☰ Drag-Handle        Ziehe Bereiche, um die Reihenfolge zu ändern
☑️ Area-Checkbox      Bereich ein-/ausblenden
▶ Expand-Button       Klappt Domain-Gruppen auf
📊 Entity-Counter     Anzahl der Entities im Bereich
```

**Beispiel:**
```
☰ ☑️ ▶ Wohnzimmer (12)
☰ ☑️ ▶ Küche (8)
☰ ☐ ▶ Garage (5)      ← ausgeblendet
```

### Stufe 2: Domain-Gruppen

Nach dem Aufklappen eines Bereichs siehst du die Entity-Domains:

```
☑️ Gruppen-Checkbox   Alle Entities dieser Domain ein-/ausblenden
⊟ Indeterminate       Bei teilweise ausgewählten Entities
🔧 Domain-Icon        Visuelles Symbol für die Domain
📊 Entity-Count       Anzahl der Entities in dieser Domain
▶ Expand-Button       Klappt Entity-Liste auf
```

**Beispiel:**
```
▼ Wohnzimmer
   ☑️ 💡 Beleuchtung (5)
   ⊟ 🌡️ Klima (2)      ← teilweise ausgewählt
   ☑️ 🪟 Rollos (3)
```

### Stufe 3: Einzelne Entities

In der aufgeklappten Entity-Liste:

```
☑️ Entity-Checkbox    Entity ein-/ausblenden
📝 Friendly-Name      Lesbarer Entity-Name
🔤 Entity-ID          Technische ID (monospace)
```

**Beispiel:**
```
▼ 💡 Beleuchtung (5)
   ☑️ Deckenlampe        (light.wohnzimmer_decke)
   ☑️ Stehlampe          (light.wohnzimmer_stehlampe)
   ☐ Alte Lampe          (light.wohnzimmer_alt) ← ausgeblendet
```

### Editor-Features

- **Persistenter State** - Aufgeklappte Bereiche bleiben während der Konfiguration offen
- **Automatisches Speichern** - Änderungen werden sofort in die Config übernommen
- **Intelligente Gruppierung** - Entities werden automatisch nach Domain erkannt
- **Visuelle Hierarchie** - Einrückungen zeigen die Struktur klar
- **Drag & Drop** - Intuitive Neuordnung per Maus
- **Checkboxen** für alle Optionen (Wetter, Energie, etc.)
- **Dropdown-Menüs** für Auswahlmöglichkeiten (Sprache, Integrationen, etc.)
- **Entity-Auswahl** mit visueller Hierarchie

<details>
<summary><strong>📝 Manuelle YAML-Konfiguration (für Fortgeschrittene)</strong></summary>

Falls du die Konfiguration manuell anpassen möchtest, findest du hier alle verfügbaren Optionen:

### Basis-Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
  language: de                  # Sprache: 'de' (Deutsch) oder 'en' (Englisch)
  show_weather: true             # Wetter-Karte anzeigen
  show_energy: true              # Energie-Dashboard anzeigen
  show_subviews: false           # Utility Views als Subviews
  show_search_card: false        # Optional: Search Card in Overview
  show_covers_summary: true      # Rollo-Zusammenfassung anzeigen
  summaries_columns: 2           # Layout: 2 (2x2) oder 4 (1x4)
  group_by_floors: false         # Bereiche nach Etagen gruppieren
```

### Sprachauswahl

Das Dashboard unterstützt Deutsch und Englisch. Die Sprache wird automatisch aus den Benutzereinstellungen von Home Assistant gelesen, kann aber auch manuell über den Parameter `language` gesteuert werden:

```yaml
strategy:
  type: custom:simon42-dashboard
  language: en  # Optional: 'de' für Deutsch oder 'en' für Englisch
```

**Sprachpriorität:**
1. Explizite `language`-Einstellung in der Config (höchste Priorität)
2. Spracheinstellung des Benutzers in Home Assistant (`hass.language`)
3. Deutsch als Standard-Sprache (Fallback)

**Verfügbare Sprachen:**
- `de` - Deutsch (Standard)
- `en` - Englisch

Alle Überschriften, Labels und Texte im Dashboard werden automatisch in der gewählten Sprache angezeigt. Dies betrifft:
- View-Titel (Übersicht, Lichter, Rollos, etc.)
- Section-Überschriften (Beleuchtung, Klima, Sicherheit, etc.)
- Status-Beschreibungen (Eingeschaltete Lichter, Offene Rollos, etc.)
- Button-Texte (Alle einschalten, Alle schließen, etc.)

**Hinweis:** Wenn keine explizite Sprache in der Config gesetzt ist, verwendet das Dashboard automatisch die Spracheinstellung des aktuellen Benutzers aus Home Assistant. Dies ermöglicht es mehreren Benutzern, das Dashboard in ihrer bevorzugten Sprache zu sehen.

### Erweiterte Konfiguration mit Entity-Filterung

```yaml
strategy:
  type: custom:simon42-dashboard
  show_weather: true
  show_energy: true
  show_subviews: false
  group_by_floors: true
  
  # Bereich-Verwaltung
  areas_display:
    hidden: 
      - bad
      - garage
    order:
      - wohnzimmer
      - kueche
      - schlafzimmer
  
  # Entity-Filterung pro Bereich
  areas_options:
    wohnzimmer:
      groups_options:
        lights:
          hidden: 
            - light.stehlampe
            - light.alte_lampe
          order:
            - light.decke
            - light.couch
            - light.schrank
        climate:
          hidden:
            - climate.old_thermostat
        covers:
          hidden:
            - cover.rollo_links
    
    kueche:
      groups_options:
        lights:
          hidden:
            - light.dunstabzug
        switches:
          hidden:
            - switch.kaffeemaschine
```

### Konfigurations-Parameter

#### Globale Optionen

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| `language` | string | `'de'` | Sprache des Dashboards: `'de'` (Deutsch) oder `'en'` (Englisch) |
| `show_weather` | boolean | `true` | Zeigt die Wetter-Karte in der Übersicht (falls Weather-Entity vorhanden) |
| `show_energy` | boolean | `true` | Zeigt das Energie-Dashboard in der Übersicht |
| `show_subviews` | boolean | `false` | Zeigt Utility-Views in der Navigation |
| `show_search_card` | boolean | `false` | Zeigt optional eine Search Card in der Übersicht |
| `show_covers_summary` | boolean | `true` | Zeigt die Rollo-Zusammenfassungskarte in der Übersicht |
| `summaries_columns` | number | `2` | Layout der Zusammenfassungskarten: `2` (2x2 Grid) oder `4` (1x4 Reihe) |
| `group_by_floors` | boolean | `false` | Gruppiert Bereiche nach Etagen/Floors |
| `show_public_transport` | boolean | `false` | Zeigt Abfahrtszeiten des öffentlichen Nahverkehrs in der Übersicht |
| `public_transport_entities` | array | `[]` | Array von Entity-IDs für Abfahrtszeiten (z.B. `['sensor.hvv_departures']`) |
| `public_transport_integration` | string | `''` | Integration: `'hvv'`, `'ha-departures'`, `'kvv'` oder `'db_info'` |
| `public_transport_card` | string | `''` | Card-Typ: `'hvv-card'`, `'ha-departures-card'`, `'kvv-departures-card'` oder `'flex-table-card'` (für `db_info`) |
| `hvv_max` | number | `10` | Maximale Anzahl der angezeigten Abfahrten (nur für hvv-card) |
| `hvv_show_time` | boolean | `false` | Zeigt die Zeit der Abfahrten an (nur für hvv-card) |
| `hvv_show_title` | boolean | `false` | Zeigt den Titel der Card an (nur für hvv-card) |
| `hvv_title` | string | `'HVV'` | Titel der Public Transport Card (nur für hvv-card) |
| `ha_departures_max` | number | `3` | Maximale Anzahl der angezeigten Abfahrten für ha-departures-card (max. 5) |
| `ha_departures_icon` | string | `'mdi:bus-multiple'` | Icon für ha-departures-card |
| `ha_departures_show_card_header` | boolean | `true` | Zeigt den Card-Header an (nur für ha-departures-card) |
| `ha_departures_show_animation` | boolean | `true` | Zeigt Animationen an (nur für ha-departures-card) |
| `ha_departures_show_transport_icon` | boolean | `false` | Zeigt Transport-Icons an (nur für ha-departures-card) |
| `ha_departures_hide_empty_departures` | boolean | `false` | Versteckt leere Abfahrten (nur für ha-departures-card) |
| `ha_departures_time_style` | string | `'dynamic'` | Zeitformat: `'dynamic'`, `'absolute'` oder `'relative'` (nur für ha-departures-card) |
| `entity_name_patterns` | array | `[]` | Array von Regex-Patterns zum Transformieren von Entity-Namen (siehe unten) |
| `show_better_thermostat` | boolean | `false` | Aktiviert Better Thermostat UI Cards in den Räumen |
| `show_horizon_card` | boolean | `false` | Zeigt die Horizon Card in der Wetter-Sektion an |
| `horizon_card_extended` | boolean | `false` | Zeigt erweiterte Informationen in der Horizon Card an (Azimut, Elevation, etc.) |
| `alarm_entity` | string | `''` | Entity-ID des Alarm-Panels für die Security-View |
| `favorite_entities` | array | `[]` | Array von Entity-IDs, die als Favoriten in der Übersicht angezeigt werden |
| `room_pin_entities` | array | `[]` | Array von Entity-IDs, die als Raum-Pins angezeigt werden (siehe Raum-Pins) |

#### `areas_display` - Bereich-Verwaltung

```yaml
areas_display:
  hidden: [area_id1, area_id2]   # Array: IDs der ausgeblendeten Bereiche
  order: [area_id3, area_id1]    # Array: Custom Sortierung der Bereiche
```

#### `areas_options` - Entity-Verwaltung

```yaml
areas_options:
  {area_id}:                     # ID des Bereichs
    groups_options:              # Domain-spezifische Optionen
      {domain}:                  # Domain-Name (z.B. lights, climate, covers)
        hidden: [entity_id1]     # Array: Ausgeblendete Entity-IDs
        order: [entity_id2]      # Array: Custom Sortierung der Entities
```

**Verfügbare Domains:**
- `lights` - Beleuchtung
- `climate` - Klimageräte (Thermostate, AC)
- `covers` - Rollos, Vorhänge, Jalousien
- `switches` - Schalter
- `sensors` - Sensoren
- `binary_sensors` - Binäre Sensoren
- `cameras` - Kameras
- `media_players` - Media Player
- `locks` - Schlösser
- `vacuum` - Saugroboter
- `fan` - Ventilatoren

#### `entity_name_patterns` - Entity-Namen Transformation

Mit `entity_name_patterns` kannst du Entity-Namen dynamisch transformieren, um längere Namen zu kürzen oder unerwünschte Präfixe/Suffixe zu entfernen. Dies ist besonders nützlich, wenn Entities in Zigbee2MQTT oder anderen Integrations mit strukturierten Namen benannt wurden, die im Dashboard zu lang sind.

**Im Editor:** Die Entity-Name-Transformation kann im Editor unter "Entity Name Patterns" konfiguriert werden.

```yaml
strategy:
  type: custom:simon42-dashboard
  entity_name_patterns:
    - "^.*? - .*? - "  # Entfernt alles vor dem letzten " - " (z.B. "Socket - My Bed - " → entfernt)
```

**Beispiel:**
Wenn deine Entities so benannt sind:
- `Socket - My Bed - Soundcore Wakey`
- `Light - Kitchen - Ceiling Light`

und du nur den letzten Teil anzeigen möchtest, kannst du folgendes Pattern verwenden:

```yaml
entity_name_patterns:
  - "^.*? - .*? - "  # Entfernt "Socket - My Bed - " und "Light - Kitchen - "
```

**Ergebnis:**
- `Soundcore Wakey`
- `Ceiling Light`

**Pattern-Format:**
- Patterns sind reguläre Ausdrücke (Regex)
- Mehrere Patterns können angegeben werden und werden nacheinander angewendet
- Patterns werden nach dem Entfernen des Raumnamens angewendet
- Bei ungültigen Patterns wird eine Warnung geloggt und das Pattern ignoriert

**Häufige Pattern-Beispiele:**

```yaml
# Entfernt Präfixe wie "Socket - ", "Light - ", etc.
entity_name_patterns:
  - "^[^-]+ - "  # Entfernt alles bis zum ersten " - "

# Entfernt mehrere Segmente getrennt durch " - "
entity_name_patterns:
  - "^.*? - .*? - "  # Entfernt die ersten beiden Segmente

# Entfernt spezifische Begriffe am Anfang
entity_name_patterns:
  - "^Socket - "
  - "^Light - "
  - "^Switch - "
```

**Hinweis:** Die Transformation wird nur auf die angezeigten Namen im Dashboard angewendet, nicht auf die tatsächlichen Entity-Namen in Home Assistant.

</details>

## 🏷️ Label-System

Das Dashboard unterstützt Labels für die globale Filterung von Entities. Entities mit dem Label `no_dboard` werden automatisch überall ausgeblendet.

**Verwendung:**
1. Gehe zu **Einstellungen** → **Geräte & Dienste** → **Entities**
2. Wähle die gewünschte Entity aus
3. Klicke auf **Labels** und füge `no_dboard` hinzu

**Ideal für:**
- Debug-Sensoren
- Hilfs-Entities
- Template-Sensoren für Automatisierungen
- Interne Systemwerte

<details>
<summary><strong>📋 Details zum Label-System</strong></summary>

### Globale Labels

| Label | Funktion | Verwendung |
|-------|----------|------------|
| `no_dboard` | **Globale Exklusion** | Entity wird nirgendwo im Dashboard angezeigt, auch nicht im Konfigurator |
| `show_dboard` | *Reserviert* | Für zukünftige Verwendung |

### Kombinierbarkeit

Labels und `groups_options` ergänzen sich perfekt:

```yaml
# Beispiel-Setup:

# Global versteckt (Label):
- light.debug_light (hat Label "no_dboard")
  → Wird nirgendwo im Dashboard angezeigt

# Im Wohnzimmer versteckt (Config):
- light.stehlampe (in groups_options.lights.hidden)
  → Wird nur im Wohnzimmer nicht angezeigt
  → Erscheint aber z.B. in der Lichter-Übersicht
```

**Filterlogik:**
1. ✅ `no_dboard` Label → **Globale Exklusion**
2. ✅ `groups_options.hidden` → **Bereich-spezifische Exklusion**
3. ✅ Entity Registry Status → Disabled/Hidden Entities werden gefiltert
4. ✅ Entity Category → Config/Diagnostic Entities werden gefiltert

</details>

<details>
<summary><strong>🏗️ Projekt-Architektur (Für Entwickler)</strong></summary>

### Verzeichnisstruktur

```
simon42-strategy/
├── simon42-strategies-loader.js          # Entry Point - lädt alle Module
│
├── core/                                 # Kern-Module
│   ├── simon42-dashboard-strategy.js     # Haupt-Strategy, generiert Dashboard-Struktur
│   ├── simon42-dashboard-strategy-editor.js  # GUI-Editor für Konfiguration
│   └── editor/                           # Editor-Komponenten
│       ├── simon42-editor-handlers.js    # Event-Handler (Drag&Drop, Checkboxen)
│       ├── simon42-editor-styles.js      # CSS für Editor (Hierarchie-Styling)
│       └── simon42-editor-template.js    # HTML-Template (Area → Domain → Entity)
│
├── utils/                                # Utility-Module
│   ├── simon42-helpers.js                # Helper-Funktionen (Filterung, Sortierung)
│   ├── simon42-data-collectors.js        # Datensammlung (Lichter, Covers, Security...)
│   ├── simon42-badge-builder.js          # Badge-Erstellung für Views
│   ├── simon42-section-builder.js        # Section-Erstellung (Grid-Layouts)
│   └── simon42-view-builder.js           # View-Definitionen
│
├── views/                                # View-Strategies
│   ├── simon42-view-room.js              # Raum-Details (pro Bereich, config-aware)
│   ├── simon42-view-lights.js            # Lichter-Übersicht (on/off gruppiert)
│   ├── simon42-view-covers.js            # Rollos/Vorhänge (open/closed gruppiert)
│   ├── simon42-view-security.js          # Sicherheit (Türen, Fenster, Schlösser)
│   └── simon42-view-batteries.js         # Batterie-Status (kritisch/niedrig/gut)
│
└── cards/                                # Custom Cards
    └── simon42-summary-card.js           # Reaktive Summary Card mit Echtzeit-Updates
```

### Datenfluss

```
1. Loader (simon42-strategies-loader.js)
   └─> Registriert alle Module als Custom Elements

2. Core Strategy (simon42-dashboard-strategy.js)
   ├─> Liest Home Assistant Registries (Areas, Devices, Entities, Floors)
   ├─> Sammelt Daten via Data Collectors
   ├─> Erstellt Sections via Section Builder
   ├─> Generiert Views via View Builder
   └─> Übergibt Config (areas_options) an View-Strategies

3. View Strategies (z.B. simon42-view-room.js)
   ├─> Empfängt Config und Registries
   ├─> Filtert Entities basierend auf:
   │   ├─> no_dboard Label
   │   ├─> areas_options.groups_options.hidden
   │   ├─> Entity Registry Status
   │   └─> Entity Category
   ├─> Gruppiert Entities nach Domain und Status
   └─> Generiert finale Card-Konfigurationen

4. Editor (simon42-dashboard-strategy-editor.js)
   ├─> Lädt bestehende Config
   ├─> Lädt Entities dynamisch beim Aufklappen
   ├─> Verwaltet Expand-State persistent
   └─> Feuert config-changed Events bei Änderungen
```

### Custom Elements

Das Dashboard registriert folgende Custom Elements:

- `ll-strategy-simon42-dashboard` - Haupt-Dashboard-Strategy
- `simon42-dashboard-strategy-editor` - Grafischer Konfigurations-Editor
- `ll-strategy-simon42-view-room` - Raum-View-Strategy
- `ll-strategy-simon42-view-lights` - Lichter-View-Strategy
- `ll-strategy-simon42-view-covers` - Covers-View-Strategy
- `ll-strategy-simon42-view-security` - Security-View-Strategy
- `ll-strategy-simon42-view-batteries` - Batterie-View-Strategy

</details>

## 📊 Spezialisierte Views

### 🏠 Raum-View (Room)

**Navigation:** Bereiche → [Raumname]

Pro Bereich wird automatisch eine Detail-Ansicht generiert:

**Sections:**
- **Beleuchtung** - Alle Lichter mit Batch-Aktionen (on/off)
- **Klima** - Thermostate, AC-Geräte mit Temperatur-Control
- **Rollos & Vorhänge** - Cover-Entities mit open/close/stop
- **Kameras** - Live-Ansicht (mit Reolink-Support)
- **Sensoren** - Temperatur, Luftfeuchtigkeit, etc.
- **Sonstiges** - Vacuum, Fans, Switches, etc.

**Features:**
- Name-Stripping: Raumnamen werden automatisch aus Entity-Namen entfernt
- Config-Aware: Respektiert `areas_options.groups_options.hidden`
- Batch-Aktionen: Heading-Badges für Gruppensteuerung
- Last Changed: Sortierung nach letzter Aktivität
- Smart Sensor Selection: Verwendet bevorzugt die in der Area-Konfiguration hinterlegten Temperatur- und Luftfeuchtigkeitssensoren (Fallback: automatisch erkannte Sensoren)
- Raum-Pins: Zeige spezielle Entitäten am Ende der Raum-View (ideal für Wetterstationen, Admin-Sensoren, etc.)

### 💡 Lichter-Übersicht

**Navigation:** Lichter

Zeigt alle Lichter im Haus, gruppiert nach Status:

**Gruppen:**
- **Eingeschaltete Lichter** - Sofort sichtbar und steuerbar
- **Ausgeschaltete Lichter** - Collapsible Section

**Features:**
- Batch-Kontrolle über Heading-Badges
- Brightness-Slider für dimmbare Lichter
- Echtzeit-Updates bei Statusänderung

### 🪟 Rollos & Vorhänge

**Navigation:** Rollos

Alle Cover-Entities, gruppiert nach Position:

**Gruppen:**
- **Geöffnete Covers** - Aktuell offen/hochgefahren
- **Geschlossene Covers** - Aktuell geschlossen/heruntergefahren

**Features:**
- Open/Close/Stop Buttons
- Position-Slider für positionierbare Covers
- Name-Stripping: "Rollo", "Vorhang", "Cover" etc. werden entfernt (DE/EN)

### 🔒 Sicherheit

**Navigation:** Sicherheit

Sicherheits-relevante Entities, gruppiert nach Typ:

**Kategorien:**
- **Schlösser** - Locked/Unlocked Status
- **Türen & Tore** - Open/Closed Status
- **Garagen** - Open/Closed/Opening/Closing
- **Fenster & Sensoren** - Open/Closed/Motion

**Features:**
- Farbcodierung nach Status (rot=unsicher, grün=sicher)
- Alarm-Panel Integration (falls vorhanden)
- Device-Class basierte Kategorisierung

### 🔋 Batterie-Status

**Navigation:** Batterien

Alle Batterie-Entities, gruppiert nach Status:

**Gruppen:**
- **Kritisch** (< 20%) - Rot, sofortige Aufmerksamkeit
- **Niedrig** (20-50%) - Gelb, bald wechseln
- **Gut** (> 50%) - Grün, alles okay

**Features:**
- Sortierung nach Batterie-Level
- Last Changed Anzeige
- Visuelle Warnung bei kritischen Batterien

## 🎯 Erweiterte Features

### Favoriten-System

Markiere wichtige Entitäten, die in der Übersicht als separate Sektion angezeigt werden:

**Verwendung:**
1. Öffne den Dashboard-Editor
2. Scrolle zur Sektion "Favoriten"
3. Wähle eine Entität aus dem Dropdown
4. Klicke auf "+ Hinzufügen"

**Features:**
- Favoriten werden als separate Sektion in der Übersicht angezeigt
- Jede Favoriten-Entity wird als Tile-Card mit Bild und Last-Changed-Anzeige dargestellt
- Schneller Zugriff auf häufig genutzte Entitäten

**Config:**
```yaml
strategy:
  type: custom:simon42-dashboard
  favorite_entities:
    - sensor.temperatur_wohnzimmer
    - light.hauptbeleuchtung
    - cover.rollo_wohnzimmer
```

### Raum-Pins

Pinne spezielle Entitäten, die nur in ihren zugeordneten Räumen angezeigt werden sollen:

**Verwendung:**
1. Öffne den Dashboard-Editor
2. Scrolle zur Sektion "Raum-Pins"
3. Wähle eine Entität aus dem Dropdown (nur Entitäten mit Raum-Zuordnung)
4. Klicke auf "+ Hinzufügen"

**Ideal für:**
- Wetterstationen mit spezifischen Sensoren
- Admin-Entitäten, die nicht automatisch erkannt werden
- Spezielle Entitäten, die nur in einem bestimmten Raum relevant sind
- Entities mit speziellen Device-Classes

**Verhalten:**
- Pins erscheinen **nur** im zugeordneten Raum (nicht in der Übersicht)
- Anzeige am **Ende** der Raum-View (nach allen anderen Sections)
- Überschrift: "Raum-Pins" mit Pin-Icon

**Config:**
```yaml
strategy:
  type: custom:simon42-dashboard
  room_pin_entities:
    - sensor.wetterstation_temperatur
    - sensor.wetterstation_luftfeuchtigkeit
    - sensor.admin_sensor
```

### Floor-basierte Organisation

Mit `group_by_floors: true` werden Bereiche nach Etagen gruppiert:

```yaml
strategy:
  type: custom:simon42-dashboard
  group_by_floors: true
```

**Ergebnis:**
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

**Vorteile:**
- Bessere Übersicht bei vielen Bereichen
- Logische Gruppierung nach physischer Lage
- Separate Sections mit Heading für jede Etage

### Performance-Optimierungen

Das Dashboard ist für maximale Performance optimiert:

**Registry-Caching:**
- Alle Registry-Daten werden aus dem `hass`-Objekt gelesen
- Keine WebSocket-Calls mehr nötig
- **85% Reduktion** der API-Calls

**Intelligente Filterung:**
```javascript
// Reihenfolge der Filter (von günstig zu teuer):
1. Domain-basierte Filterung (Set-Lookup: O(1))
2. Label-Exklusion (no_dboard)
3. Area-Binding Checks
4. Entity Registry Validierung
5. State Availability Check
```

**Lazy Loading:**
- Entities werden erst beim Aufklappen geladen
- Kein unnötiges Laden von versteckten Bereichen
- Reduzierte initiale Ladezeit

### Optionale Integrationen

#### Search Card

Aktiviere eine Search Card in der Übersicht:

```yaml
strategy:
  type: custom:simon42-dashboard
  show_search_card: true
```

**Voraussetzung:**
- Custom Search Card muss installiert sein
- Wird automatisch erkannt und eingebunden

#### Alarm Panel

Konfiguriere ein Alarm-Panel für die Security-View:

```yaml
strategy:
  type: custom:simon42-dashboard
  alarm_entity: alarm_control_panel.haus
```

**Features:**
- Integration in Security-View
- Badge in der Übersicht mit aktuellem Status
- Steuerung direkt aus dem Dashboard
- Automatische Erkennung verfügbarer Alarm-Panels im Editor

#### Reolink Kameras

Erweiterte Unterstützung für Reolink-Kameras:
- Automatische Erkennung von Reolink-Entities
- Optimierte Card-Konfiguration
- PTZ-Controls (falls unterstützt)

#### Better Thermostat UI Card

Ersetzt Standard-Thermostat-Karten durch Better Thermostat UI-Karten in den Räumen:

```yaml
strategy:
  type: custom:simon42-dashboard
  show_better_thermostat: true
```

**Features:**
- Automatische Erkennung von Better Thermostat Entities über die Platform in der Entity Registry
- Getrennte Darstellung: Better Thermostat Entities werden mit der `better-thermostat-ui-card` angezeigt, Standard-Thermostate bleiben als Tile-Cards
- Standard-Thermostate können separat ausgeblendet werden (über Editor oder Entity Visibility)

**Voraussetzung:**
- Better Thermostat Integration muss über HACS oder manuell installiert sein
- Better Thermostat UI Card muss als Custom Card installiert sein
- Der Editor prüft automatisch, ob beide Komponenten verfügbar sind

#### Horizon Card

Zeigt die Position der Sonne über dem Horizont in der Wetter-Sektion:

```yaml
strategy:
  type: custom:simon42-dashboard
  show_horizon_card: true
  horizon_card_extended: true  # Optional: Erweiterte Informationen
```

**Features:**
- Basis-Modus: Sonnenaufgang, Sonnenuntergang, Mondaufgang, Monduntergang
- Erweiterter Modus: Zusätzlich Azimut, Elevation, Mittag, Dämmerung und Mondphase
- Automatische Integration in die Wetter-Sektion

**Voraussetzung:**
- `lovelace-horizon-card` muss über HACS installiert sein
- Der Editor prüft automatisch, ob die Card verfügbar ist

#### Öffentlicher Nahverkehr

Zeige Abfahrtszeiten des öffentlichen Nahverkehrs in der Übersicht. Unterstützt mehrere Integrationen:

**HVV (Hamburg):**
```yaml
strategy:
  type: custom:simon42-dashboard
  show_public_transport: true
  public_transport_integration: hvv
  public_transport_card: hvv-card
  public_transport_entities:
    - sensor.hvv_departures
  hvv_max: 10
  hvv_show_time: true
  hvv_show_title: true
  hvv_title: 'HVV'
```

**ha-departures (EFA-basiert, Deutschland):**
```yaml
strategy:
  type: custom:simon42-dashboard
  show_public_transport: true
  public_transport_integration: ha-departures
  public_transport_card: ha-departures-card
  public_transport_entities:
    - sensor.nurnberg_frankenstr_bus_45_ziegelstein_u_mogeldorf
    - sensor.nurnberg_frankenstr_bus_51_k_schwarzenlohe_nord
  ha_departures_max: 3  # Maximal 5 Abfahrten (wird automatisch begrenzt)
  ha_departures_icon: 'mdi:bus-multiple'
  ha_departures_show_card_header: true
  ha_departures_show_animation: true
  ha_departures_show_transport_icon: false
  ha_departures_hide_empty_departures: false
  ha_departures_time_style: 'dynamic'  # 'dynamic', 'absolute' oder 'relative'
```

**Hinweise für ha-departures:**
- Der Editor erkennt automatisch ha-departures Entities anhand ihrer Attribute (`line_name`, `transport`, `planned_departure_time`, `direction`)
- Die ha-departures-card unterstützt maximal 5 Abfahrten pro Entity (wird automatisch begrenzt)
- Entities werden auch erkannt, wenn sie keine "departure" oder "abfahrt" Keywords im Namen haben
- `ha_departures_time_style`: `'dynamic'` zeigt relative Zeit (z.B. "in 5 Min"), `'absolute'` zeigt Uhrzeit, `'relative'` zeigt immer relative Zeit

**KVV (Karlsruher Verkehrsverbund):**
```yaml
strategy:
  type: custom:simon42-dashboard
  show_public_transport: true
  public_transport_integration: kvv
  public_transport_card: kvv-departures-card
  public_transport_entities:
    - sensor.kvv_abfahrten_berghausen_baden_hummelberg
```

**Hinweise für KVV:**
- Der Editor erkennt automatisch KVV Entities anhand ihrer Attribute (`abfahrten` Array mit `line`, `direction`, `countdown`, `realtime`, `dateTime`)
- Die kvv-departures-card verwendet eine einzelne Entity pro Karte
- Entities werden auch erkannt, wenn sie "kvv" oder "abfahrten" im Namen haben

**db_info (Deutsche Bahn):**
```yaml
strategy:
  type: custom:simon42-dashboard
  show_public_transport: true
  public_transport_integration: db_info
  public_transport_card: flex-table-card
  public_transport_entities:
    - sensor.db_info_departures
  hvv_max: 10
  hvv_title: 'Bahn'
```

**Voraussetzungen:**
- Die entsprechende Card muss installiert sein (`hvv-card`, `ha-departures-card`, `kvv-departures-card` oder `flex-table-card` für `db_info`)
- Die entsprechende Integration muss installiert und konfiguriert sein
- Der Editor prüft automatisch, ob die benötigte Card verfügbar ist
- Entities müssen Abfahrtszeiten bereitstellen
- **ha-departures:** Der Editor erkennt Entities automatisch anhand ihrer Attribute (`line_name`, `transport`, `planned_departure_time`, `direction`) - Keywords im Namen sind nicht erforderlich
- **kvv:** Der Editor erkennt Entities automatisch anhand ihrer Attribute (`abfahrten` Array mit `line`, `direction`, `countdown`, `realtime`, `dateTime`)
- **hvv/db_info:** Der Editor filtert automatisch relevante Entities (sensor/button mit Transport-Keywords)

### Batch-Aktionen

Alle Gruppen-Views unterstützen Batch-Aktionen über Heading-Badges:

**Beispiel Lichter:**
```
[💡 Alle ein] [💡 Alle aus]  Eingeschaltete Lichter (5)
├── Wohnzimmer Decke
├── Küche Arbeitsplatte
└── ...
```

**Verfügbar für:**
- Lichter (Alle ein/aus)
- Rollos (Alle öffnen/schließen)
- Bereiche (Alle Lichter des Raums)

<details>
<summary><strong>🔍 Entity-Filterung im Detail (Technische Details)</strong></summary>

### Filterlogik (Reihenfolge)

```
1. Label-Exklusion (no_dboard)
   ├─> Globale Filterung via Labels
   └─> Wird nirgendwo im Dashboard angezeigt

2. Area-Zugehörigkeit
   ├─> Entities mit direkter Area-Zuweisung
   └─> Entities über Device-Area-Zuweisung

3. Entity Category
   └─> Keine config oder diagnostic Entities

4. Hidden/Disabled Status (Registry)
   └─> Versteckte oder deaktivierte Entities

5. Availability
   └─> Entity muss in hass.states existieren

6. groups_options.hidden (Config)
   └─> Bereich-spezifische Filterung via Konfigurator
```

### Beispiel-Szenario

```yaml
# Gegeben:
Area: Wohnzimmer
Entities:
  - light.wohnzimmer_decke
  - light.wohnzimmer_debug (hat Label "no_dboard")
  - light.wohnzimmer_alt (disabled in Registry)
  - light.wohnzimmer_config (Entity Category: config)
  - light.wohnzimmer_stehlampe

Config:
  areas_options:
    wohnzimmer:
      groups_options:
        lights:
          hidden:
            - light.wohnzimmer_stehlampe

# Ergebnis im Wohnzimmer Raum-View:
✅ light.wohnzimmer_decke
❌ light.wohnzimmer_debug (Label)
❌ light.wohnzimmer_alt (Disabled)
❌ light.wohnzimmer_config (Category)
❌ light.wohnzimmer_stehlampe (Config)

# Ergebnis in der Lichter-Übersicht:
✅ light.wohnzimmer_decke
❌ light.wohnzimmer_debug (Label)
❌ light.wohnzimmer_alt (Disabled)
❌ light.wohnzimmer_config (Category)
✅ light.wohnzimmer_stehlampe (nur im Raum-View ausgeblendet!)
```

</details>

## 🤝 Contributing

### Maintainers gesucht! 🔍

Dieses Projekt sucht aktiv nach Maintainern, die bei der Weiterentwicklung helfen möchten!

**Interessiert?**
- Erstelle Issues für Bugs oder Feature-Requests
- Pull Requests sind willkommen
- **Bitte teste PRs gründlich vor dem Einreichen** 🫶

### Pull Request Guidelines

1. **Feature Branch erstellen**
   ```bash
   git checkout -b feature/mein-neues-feature
   ```

2. **Code-Style beachten**
   - Kommentare auf Deutsch oder Englisch
   - JSDoc für Funktionen
   - Aussagekräftige Commit-Messages

3. **Testen**
   - Teste alle Änderungen in einem lokalen HA-Setup
   - Prüfe verschiedene Szenarien (mit/ohne Config, etc.)
   - Validiere die Performance

4. **Pull Request erstellen**
   - Beschreibe die Änderungen ausführlich
   - Füge Screenshots hinzu (bei UI-Änderungen)
   - Referenziere zugehörige Issues

## 📋 Roadmap & Geplante Features

- [x] Entity-Sortierung per Drag & Drop im Editor
- [ ] Preset-Templates für verschiedene Use-Cases
- [ ] Import von Views aus anderen Dashboards
- [x] Erweiterte Favoriten-Funktionen
- [ ] Themes & Custom Styling
- [ ] Export/Import von Konfigurationen
- [x] Mehrsprachigkeit (i18n) - Deutsch und Englisch

## 🐛 Bekannte Probleme & Limitationen

- Editor kann bei sehr vielen Entities (>500) langsam werden
- Drag & Drop funktioniert auf Touch-Geräten nicht optimal
- Einige Custom Cards werden möglicherweise nicht korrekt gerendert
- Performance bei floor-basierten Layouts kann bei >20 Bereichen leiden

**Workarounds siehe GitHub Issues**

## 📄 Lizenz

**Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**

### Du darfst:
- ✅ **Teilen** - Das Material kopieren und weiterverbreiten
- ✅ **Bearbeiten** - Das Material remixen, verändern und darauf aufbauen

### Unter folgenden Bedingungen:
- 📝 **Namensnennung** - Angemessene Urheber-Nennung
- 🚫 **Nicht kommerziell** - Keine kommerzielle Nutzung
- 🔄 **Weitergabe unter gleichen Bedingungen** - Bei Veränderungen unter gleicher Lizenz

### 💼 Kommerzielle Nutzung

Interessiert an kommerzieller Nutzung? Kontaktiere mich für individuelle Lizenzvereinbarungen:

**👉 [Kontaktformular](https://www.simon42.com/contact/)**

**Siehe LICENSE-Datei für vollständige Details**

## 🙏 Credits & Danksagungen

- Home Assistant Community für Inspiration und Feedback
- Alle Contributor und Tester
- Entwickler der genutzten Custom Cards und Integrationen

## 📞 Support & Kontakt

- **[GitHub Issues](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues)**
- **[simon42 Community](https://community.simon42.com/):** Suchfunktion hilft immer 😜 

---

**Entwickelt mit ❤️ für die Home Assistant Community**

*Letzte Aktualisierung: 05.12.2025*
