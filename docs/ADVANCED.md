# Erweiterte Themen

Diese Dokumentation beschreibt erweiterte Themen und technische Details der simon42 Dashboard Strategy.

## Inhaltsverzeichnis

- [Entity-Filterung](#entity-filterung)
- [Entity Name Transformation](#entity-name-transformation)
- [Entity Name Translations](#entity-name-translations)
- [Label-System](#label-system)
- [Performance-Optimierungen](#performance-optimierungen)
- [Projekt-Architektur](#projekt-architektur)

## Entity-Filterung

### Filterlogik (Reihenfolge)

Die Entity-Filterung erfolgt in einer optimierten Reihenfolge (von günstig zu teuer):

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

## Entity Name Transformation

Mit `entity_name_patterns` kannst du Entity-Namen dynamisch transformieren, um längere Namen zu kürzen oder unerwünschte Präfixe/Suffixe zu entfernen.

### Verwendung

```yaml
strategy:
  type: custom:simon42-dashboard
  entity_name_patterns:
    - "^.*? - .*? - "  # Entfernt alles vor dem letzten " - "
```

### Beispiel

Wenn deine Entities so benannt sind:
- `Socket - My Bed - Soundcore Wakey`
- `Light - Kitchen - Ceiling Light`

und du nur den letzten Teil anzeigen möchtest:

```yaml
entity_name_patterns:
  - "^.*? - .*? - "  # Entfernt "Socket - My Bed - " und "Light - Kitchen - "
```

**Ergebnis:**
- `Soundcore Wakey`
- `Ceiling Light`

### Pattern-Format

- Patterns sind reguläre Ausdrücke (Regex)
- Mehrere Patterns können angegeben werden und werden nacheinander angewendet
- Patterns werden nach dem Entfernen des Raumnamens angewendet
- Bei ungültigen Patterns wird eine Warnung geloggt und das Pattern ignoriert
- Patterns können als String (für alle Entities) oder als Objekt mit Domain-Restriktion angegeben werden
- **Automatische Bereinigung:** Nach der Pattern-Anwendung werden possessive Präfixe (z.B. "Phillipp's ") automatisch entfernt, falls vorhanden

### Domain-spezifische Patterns

Du kannst Patterns auf bestimmte Entity-Typen beschränken:

```yaml
entity_name_patterns:
  - "^.*? - .*? - "  # Gilt für alle Entities
  - pattern: "^.*?·-·.*?"
    domain: "switch"  # Gilt nur für Switch-Entities
  - pattern: "^Light - "
    domain: "light"  # Gilt nur für Light-Entities
```

### Häufige Pattern-Beispiele

```yaml
# Entfernt Präfixe wie "Socket - ", "Light - ", etc. (für alle Entities)
entity_name_patterns:
  - "^[^-]+ - "  # Entfernt alles bis zum ersten " - "

# Entfernt mehrere Segmente getrennt durch " - " (für alle Entities)
entity_name_patterns:
  - "^.*? - .*? - "  # Entfernt die ersten beiden Segmente

# Extrahiert den letzten Teil nach dem letzten " - " (für alle Entities)
# Automatisch entfernt possessive Präfixe wie "Phillipp's " falls vorhanden
entity_name_patterns:
  - "^.* - "  # Entfernt alles bis zum letzten " - "
  # Beispiel: "Socket - Phillipp's PC" → "PC"
  # Beispiel: "Socket - Phillipp's Bed - Left Charger" → "Left Charger"

# Entfernt spezifische Begriffe am Anfang (für alle Entities)
entity_name_patterns:
  - "^Socket - "
  - "^Light - "
  - "^Switch - "

# Domain-spezifische Patterns: Nur für Schalter
entity_name_patterns:
  - pattern: "^.*?·-·.*?"
    domain: "switch"  # Nur für switch-Entities (z.B. socket.something)
```

### Verfügbare Domains

- `light` - Beleuchtung
- `switch` - Schalter (inkl. Steckdosen)
- `cover` - Rollos, Vorhänge, Jalousien
- `climate` - Klimageräte, Thermostate
- `sensor` - Sensoren
- `binary_sensor` - Binäre Sensoren
- `media_player` - Media Player
- `scene` - Szenen
- `vacuum` - Saugroboter
- `fan` - Ventilatoren
- `camera` - Kameras
- `lock` - Schlösser
- `input_boolean`, `input_number`, `input_select`, `input_text` - Input-Entities

## Entity Name Translations

Mit `entity_name_translations` kannst du Substrings in Entity-Namen und Area-Namen übersetzen.

### Verwendung

```yaml
strategy:
  type: custom:simon42-dashboard
  entity_name_translations:
    - from: "Bedroom"
      to: "Schlafzimmer"
      from_lang: "en"
      to_lang: "de"
    - from: "Kitchen"
      to: "Küche"
      from_lang: "en"
      to_lang: "de"
```

### Beispiel

Wenn deine Entities so benannt sind:
- `Bedroom Light`
- `Kitchen Switch`
- `Bedroom Window`

und du die englischen Begriffe ins Deutsche übersetzen möchtest:

```yaml
entity_name_translations:
  - from: "Bedroom"
    to: "Schlafzimmer"
    from_lang: "en"
    to_lang: "de"
  - from: "Kitchen"
    to: "Küche"
    from_lang: "en"
    to_lang: "de"
```

**Ergebnis (wenn Dashboard-Sprache = Deutsch):**
- `Schlafzimmer Light`
- `Küche Switch`
- `Schlafzimmer Window`

**Ergebnis (wenn Dashboard-Sprache = Englisch):**
- `Bedroom Light` (keine Übersetzung angewendet)
- `Kitchen Switch` (keine Übersetzung angewendet)
- `Bedroom Window` (keine Übersetzung angewendet)

### Übersetzungs-Format

- Übersetzungen werden als Objekte mit `from`, `to`, `from_lang` und `to_lang` angegeben
- `from` ist der zu ersetzende Substring (case-insensitive, ganze Wörter)
- `to` ist der Ersatztext
- `from_lang` ist die Quellsprache (z.B. `"en"` für Englisch)
- `to_lang` ist die Zielsprache (z.B. `"de"` für Deutsch)
- Mehrere Übersetzungen können angegeben werden und werden nacheinander angewendet
- Übersetzungen werden **nach** den Patterns angewendet, damit sie auf die transformierten Namen wirken
- Übersetzungen gelten für **alle** Entities, die im Dashboard angezeigt werden können
- Übersetzungen werden **nur angewendet**, wenn die Dashboard-Sprache mit `to_lang` übereinstimmt

### Verfügbare Sprachen

- `en` - Englisch
- `de` - Deutsch

### Hinweise

- Die Übersetzung wird nur auf die angezeigten Namen im Dashboard angewendet, nicht auf die tatsächlichen Entity-Namen oder Area-Namen in Home Assistant
- Übersetzungen werden als ganze Wörter behandelt (mit Wortgrenzen), sodass "Bedroom" nicht "BedroomLight" ersetzt
- Übersetzungen sind sprachabhängig - sie werden nur angewendet, wenn die Dashboard-Sprache mit der Zielsprache (`to_lang`) übereinstimmt
- Übersetzungen gelten sowohl für Entity-Namen als auch für Area-Namen (z.B. View-Titel)

## Label-System

Das Dashboard unterstützt Labels für die globale Filterung von Entities.

### Globale Labels

| Label | Funktion | Verwendung |
|-------|----------|------------|
| `no_dboard` | **Globale Exklusion** | Entity wird nirgendwo im Dashboard angezeigt, auch nicht im Konfigurator |
| `show_dboard` | *Reserviert* | Für zukünftige Verwendung |

### Verwendung

1. Gehe zu **Einstellungen** → **Geräte & Dienste** → **Entities**
2. Wähle die gewünschte Entity aus
3. Klicke auf **Labels** und füge `no_dboard` hinzu

### Ideal für

- Debug-Sensoren
- Hilfs-Entities
- Template-Sensoren für Automatisierungen
- Interne Systemwerte

## Performance-Optimierungen

### Registry-Caching

- Alle Registry-Daten werden aus dem `hass`-Objekt gelesen
- Keine WebSocket-Calls mehr nötig
- **85% Reduktion** der API-Calls

### Intelligente Filterung

Die Filterung erfolgt in einer optimierten Reihenfolge:

```javascript
// Reihenfolge der Filter (von günstig zu teuer):
1. Domain-basierte Filterung (Set-Lookup: O(1))
2. Label-Exklusion (no_dboard)
3. Area-Binding Checks
4. Entity Registry Validierung
5. State Availability Check
```

### Lazy Loading

- Entities werden erst beim Aufklappen geladen
- Kein unnötiges Laden von versteckten Bereichen
- Reduzierte initiale Ladezeit

### Set-basierte Lookups

- Verwendung von `Set` für O(1) Lookups statt `Array.includes()` für große Collections
- Caching von teuren Berechnungen (wie hidden entities from config)
- Frühe Filterung (Domain-Filter zuerst) zur Reduzierung von Iterationen

## Projekt-Architektur

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

