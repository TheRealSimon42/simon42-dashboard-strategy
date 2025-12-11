# Spezialisierte Views

Das Dashboard generiert automatisch spezialisierte Views für verschiedene Entity-Typen.

## Inhaltsverzeichnis

- [Raum-View (Room)](#raum-view-room)
- [Lichter-Übersicht](#lichter-übersicht)
- [Rollos & Vorhänge](#rollos--vorhänge)
- [Sicherheit](#sicherheit)
- [Batterie-Status](#batterie-status)

## Raum-View (Room)

**Navigation:** Bereiche → [Raumname]

Pro Bereich wird automatisch eine Detail-Ansicht generiert.

### Sections

- **Beleuchtung** - Alle Lichter mit Batch-Aktionen (on/off)
- **Klima** - Thermostate, AC-Geräte mit Temperatur-Control
- **Rollos & Vorhänge** - Cover-Entities mit open/close/stop
- **Kameras** - Live-Ansicht (mit Reolink-Support)
- **Sensoren** - Temperatur, Luftfeuchtigkeit, etc.
- **Sonstiges** - Vacuum, Fans, Switches, etc.

### Features

- **Name-Stripping**: Raumnamen werden automatisch aus Entity-Namen entfernt
- **Config-Aware**: Respektiert `areas_options.groups_options.hidden`
- **Batch-Aktionen**: Heading-Badges für Gruppensteuerung
- **Last Changed**: Sortierung nach letzter Aktivität
- **Smart Sensor Selection**: Verwendet bevorzugt die in der Area-Konfiguration hinterlegten Temperatur- und Luftfeuchtigkeitssensoren (Fallback: automatisch erkannte Sensoren)
- **Raum-Pins**: Zeige spezielle Entitäten am Ende der Raum-View (ideal für Wetterstationen, Admin-Sensoren, etc.)

### Beispiel

```
🏠 Wohnzimmer

💡 Beleuchtung
[💡 Alle ein] [💡 Alle aus]  Eingeschaltete Lichter (3)
├── Decke
├── Stehlampe
└── Couch

🌡️ Klima
├── Thermostat (21°C)

🪟 Rollos & Vorhänge
[🪟 Alle öffnen] [🪟 Alle schließen]  Geöffnete Rollos (2)
├── Rollo Links
└── Rollo Rechts

📷 Kameras
├── Wohnzimmer Kamera

📊 Sensoren
├── Temperatur: 21.5°C
└── Luftfeuchtigkeit: 45%

📌 Raum-Pins
├── Wetterstation Temperatur
└── Wetterstation Luftfeuchtigkeit
```

## Lichter-Übersicht

**Navigation:** Lichter

Zeigt alle Lichter im Haus, gruppiert nach Status.

### Gruppen

- **Eingeschaltete Lichter** - Sofort sichtbar und steuerbar
- **Ausgeschaltete Lichter** - Collapsible Section

### Features

- **Batch-Kontrolle** über Heading-Badges
- **Brightness-Slider** für dimmbare Lichter
- **Echtzeit-Updates** bei Statusänderung
- **Reaktive Group Cards**: Automatische Aktualisierung bei Statusänderungen

### Beispiel

```
💡 Lichter

[💡 Alle ein] [💡 Alle aus]  Eingeschaltete Lichter (5)
├── Wohnzimmer Decke
├── Küche Arbeitsplatte
├── Schlafzimmer Nachttisch
├── Bad Spiegel
└── Arbeitszimmer Schreibtisch

▼ Ausgeschaltete Lichter (12)
   ├── Wohnzimmer Stehlampe
   ├── Küche Dunstabzug
   └── ...
```

## Rollos & Vorhänge

**Navigation:** Rollos

Alle Cover-Entities, gruppiert nach Position.

### Gruppen

- **Geöffnete Covers** - Aktuell offen/hochgefahren
- **Geschlossene Covers** - Aktuell geschlossen/heruntergefahren

### Features

- **Open/Close/Stop Buttons**
- **Position-Slider** für positionierbare Covers
- **Name-Stripping**: "Rollo", "Vorhang", "Cover" etc. werden entfernt (DE/EN)
- **Reaktive Group Cards**: Automatische Aktualisierung bei Statusänderungen

### Beispiel

```
🪟 Rollos & Vorhänge

[🪟 Alle öffnen] [🪟 Alle schließen]  Geöffnete Rollos (3)
├── Wohnzimmer Links
├── Wohnzimmer Rechts
└── Küche Fenster

▼ Geschlossene Rollos (8)
   ├── Schlafzimmer Links
   ├── Schlafzimmer Rechts
   └── ...
```

## Sicherheit

**Navigation:** Sicherheit

Sicherheits-relevante Entities, gruppiert nach Typ.

### Kategorien

- **Schlösser** - Locked/Unlocked Status
- **Türen & Tore** - Open/Closed Status
- **Garagen** - Open/Closed/Opening/Closing
- **Fenster & Sensoren** - Open/Closed/Motion

### Features

- **Farbcodierung** nach Status (rot=unsicher, grün=sicher)
- **Alarm-Panel Integration** (falls vorhanden)
- **Device-Class basierte Kategorisierung**
- **Badge in Übersicht** mit aktuellem Sicherheitsstatus

### Beispiel

```
🔒 Sicherheit

🔐 Schlösser
├── Haustür (🔒 Verriegelt)
└── Terrassentür (🔒 Verriegelt)

🚪 Türen & Tore
├── Haustür (🟢 Geschlossen)
├── Terrassentür (🟢 Geschlossen)
└── Gartentor (🟢 Geschlossen)

🚗 Garagen
└── Garage (🟢 Geschlossen)

🪟 Fenster & Sensoren
├── Wohnzimmer Fenster (🟢 Geschlossen)
├── Küche Fenster (🟢 Geschlossen)
└── Bewegungsmelder Flur (⚪ Keine Bewegung)

🚨 Alarm Panel
└── Hausalarm (🟢 Bereit)
```

## Batterie-Status

**Navigation:** Batterien

Alle Batterie-Entities, gruppiert nach Status.

### Gruppen

- **Kritisch** (< 20%) - Rot, sofortige Aufmerksamkeit
- **Niedrig** (20-50%) - Gelb, bald wechseln
- **Gut** (> 50%) - Grün, alles okay

### Features

- **Sortierung** nach Batterie-Level
- **Last Changed** Anzeige
- **Visuelle Warnung** bei kritischen Batterien
- **Badge in Übersicht** mit Anzahl kritischer Batterien

### Beispiel

```
🔋 Batterie-Status

🔴 Kritisch (< 20%)
├── Bewegungsmelder Flur (15%)
├── Türsensor Eingang (12%)
└── Fenstersensor Küche (8%)

🟡 Niedrig (20-50%)
├── Bewegungsmelder Wohnzimmer (35%)
├── Türsensor Terrasse (28%)
└── Fenstersensor Schlafzimmer (22%)

🟢 Gut (> 50%)
├── Bewegungsmelder Bad (85%)
├── Türsensor Garage (92%)
└── Fenstersensor Arbeitszimmer (78%)
```

## View-Konfiguration

Views können über die folgenden Konfigurationsoptionen gesteuert werden:

```yaml
strategy:
  type: custom:simon42-dashboard
  show_subviews: false      # Utility Views als Subviews anzeigen
  show_summary_views: false  # Summary Views in Navigation anzeigen
  show_room_views: false    # Room Views in Navigation anzeigen
```

### Subviews

Wenn `show_subviews: true` gesetzt ist, werden die spezialisierten Views (Lichter, Rollos, Sicherheit, Batterien) als Subviews in der Navigation angezeigt.

### Summary Views

Wenn `show_summary_views: true` gesetzt ist, werden die Summary-Views in der Navigation angezeigt.

### Room Views

Wenn `show_room_views: true` gesetzt ist, werden die Raum-Detail-Views in der Navigation angezeigt.

## Entity-Filterung in Views

Alle Views respektieren die Entity-Filterung:

- **Label-System**: Entities mit `no_dboard` Label werden ausgeblendet
- **Bereich-spezifische Filterung**: `areas_options.groups_options.hidden` wird respektiert
- **Entity Registry**: Disabled/Hidden Entities werden gefiltert
- **Entity Category**: Config/Diagnostic Entities werden gefiltert

Siehe [ADVANCED.md](ADVANCED.md#entity-filterung) für detaillierte Informationen zur Filterlogik.

