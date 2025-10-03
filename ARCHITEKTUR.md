# 🏗️ Simon42 Dashboard - Architektur

Diese Dokumentation erklärt die Architektur und das Zusammenspiel der verschiedenen Komponenten.

## 📦 Komponenten-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                   Home Assistant Core                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Lovelace Dashboard System                  │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐    │    │
│  │  │   Simon42 Dashboard Strategy V2          │    │    │
│  │  │   (simon42-dashboard-strategy-v2.js)     │    │    │
│  │  │                                           │    │    │
│  │  │  • Lädt Config Manager                   │    │    │
│  │  │  • Generiert Dashboard-Struktur          │    │    │
│  │  │  • Filtert Bereiche & Views              │    │    │
│  │  │  • Erstellt View-Definitionen            │    │    │
│  │  └──────────────────────────────────────────┘    │    │
│  │                      │                            │    │
│  │                      ↓                            │    │
│  │  ┌──────────────────────────────────────────┐    │    │
│  │  │   Simon42 Config Manager                 │    │    │
│  │  │   (simon42-config-manager.js)            │    │    │
│  │  │                                           │    │    │
│  │  │  • Speichert Konfiguration               │    │    │
│  │  │  • Lädt Konfiguration                    │    │    │
│  │  │  • Verwaltet hidden_areas                │    │    │
│  │  │  • Verwaltet hidden_views                │    │    │
│  │  │  • Sortiert Bereiche                     │    │    │
│  │  └──────────────────────────────────────────┘    │    │
│  │                      │                            │    │
│  │                      ↓                            │    │
│  │  ┌──────────────────────────────────────────┐    │    │
│  │  │   Home Assistant Storage API             │    │    │
│  │  │                                           │    │    │
│  │  │  Key: simon42_dashboard_config_{path}    │    │    │
│  │  └──────────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Simon42 Settings Card                              │  │
│  │   (simon42-settings-card.js)                         │  │
│  │                                                       │  │
│  │  • Zeigt Einstellungs-Button                         │  │
│  │  • Öffnet Einstellungs-Dialog                        │  │
│  │  • Toggle für Views                                  │  │
│  │  • Toggle für Bereiche                               │  │
│  │  • Speichert via Config Manager                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   View Strategies                                    │  │
│  │                                                       │  │
│  │  ├─ simon42-view-room.js      (Raum-Ansichten)      │  │
│  │  ├─ simon42-view-lights.js    (Lichter-Übersicht)   │  │
│  │  ├─ simon42-view-covers.js    (Rollos-Übersicht)    │  │
│  │  ├─ simon42-view-security.js  (Sicherheit)          │  │
│  │  └─ simon42-view-batteries.js (Batterien)           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Datenfluss

### 1. Dashboard-Initialisierung

```
Benutzer öffnet Dashboard
        ↓
Loader lädt alle Module
        ↓
Strategy wird initialisiert
        ↓
Config Manager lädt Konfiguration aus Storage
        ↓
Dashboard wird mit gefilterter Struktur generiert
```

### 2. Einstellungen ändern

```
Benutzer klickt auf Einstellungs-Button
        ↓
Settings Card öffnet Dialog
        ↓
Benutzer ändert Sichtbarkeit von View/Bereich
        ↓
Config Manager aktualisiert Konfiguration
        ↓
Konfiguration wird in Storage gespeichert
        ↓
Dashboard wird neu geladen
        ↓
Strategy generiert Dashboard mit neuer Konfiguration
```

## 📂 Dateistruktur

```
/config/www/
│
├── simon42-strategies-loader-v2.js    # Hauptloader
│   └─ Lädt alle anderen Module in der richtigen Reihenfolge
│
├── simon42-config-manager.js          # Konfigurations-Manager
│   ├─ Speichert/Lädt Konfiguration
│   ├─ Filtert Bereiche & Views
│   └─ Sortiert Bereiche
│
├── simon42-dashboard-strategy-v2.js   # Hauptstrategy
│   ├─ Initialisiert Config Manager
│   ├─ Holt Daten von Home Assistant
│   ├─ Generiert View-Struktur
│   └─ Wendet Filter an
│
├── simon42-settings-card.js           # Einstellungs-UI
│   ├─ Zeigt Einstellungs-Button
│   ├─ Erstellt Dialog
│   └─ Verwaltet Toggles
│
└── View Strategies/
    ├── simon42-view-room.js           # Raum-Ansichten
    ├── simon42-view-lights.js         # Lichter
    ├── simon42-view-covers.js         # Rollos
    ├── simon42-view-security.js       # Sicherheit
    └── simon42-view-batteries.js      # Batterien
```

## 🔐 Speicherformat

Die Konfiguration wird im folgenden Format gespeichert:

```json
{
  "hidden_areas": [
    "bad",
    "keller"
  ],
  "hidden_views": [
    "batteries",
    "security"
  ],
  "area_order": [
    "wohnzimmer",
    "kueche",
    "schlafzimmer"
  ],
  "favorites": [
    "light.wohnzimmer_decke",
    "cover.wohnzimmer_rollo"
  ],
  "ui": {
    "compact_mode": false
  }
}
```

## 🎯 Designprinzipien

### 1. Modularität
Jede Komponente hat eine klar definierte Aufgabe und kann unabhängig entwickelt werden.

### 2. Zustandslosigkeit
Die Strategy selbst ist zustandslos - der Zustand wird im Config Manager verwaltet.

### 3. Persistenz
Alle Benutzerkonfigurationen werden persistent gespeichert.

### 4. Dashboard-Isolation
Jedes Dashboard hat seine eigenen Einstellungen (via Dashboard-Path).

### 5. Progressive Enhancement
Das Dashboard funktioniert auch ohne gespeicherte Konfiguration (Standardwerte).

## 🔌 API-Schnittstellen

### Config Manager API

```javascript
// Initialisierung
const configManager = new Simon42ConfigManager(hass);
await configManager.loadConfig();

// Bereiche
configManager.isAreaHidden(areaId)
await configManager.toggleAreaVisibility(areaId)
configManager.sortAreas(areas)
configManager.getAreaOrder()
await configManager.setAreaOrder(order)

// Views
configManager.isViewHidden(viewPath)
await configManager.toggleViewVisibility(viewPath)

// Favoriten
configManager.isFavorite(entityId)
await configManager.toggleFavorite(entityId)
configManager.getFavorites()

// UI-Einstellungen
configManager.getUISettings()
await configManager.updateUISettings(settings)

// Speichern
await configManager.saveConfig()
```

### Strategy API

```javascript
class Simon42DashboardStrategy {
  static async generate(config, hass) {
    // Generiert Dashboard-Konfiguration
    // Returns: { title: string, views: Array }
  }
}
```

## 🚀 Performance-Optimierungen

### 1. Lazy Loading
Views werden erst bei Bedarf geladen.

### 2. Caching
Config Manager hält die Konfiguration im Speicher.

### 3. Batch Updates
Mehrere Änderungen werden zusammengefasst gespeichert.

### 4. Conditional Rendering
Nur sichtbare Komponenten werden gerendert.

## 🧪 Erweiterbarkeit

### Neue View hinzufügen

1. Erstelle neue View-Datei (z.B. `simon42-view-media.js`)
2. Registriere View in der Strategy
3. Füge Toggle im Settings-Dialog hinzu
4. Lade View im Loader

### Neue Konfigurationsoption hinzufügen

1. Erweitere Config-Struktur im Config Manager
2. Füge Getter/Setter hinzu
3. Erweitere Settings-Dialog UI
4. Nutze Option in der Strategy

### Neue Filteroption hinzufügen

1. Erweitere Config Manager um Filter-Logik
2. Wende Filter in Strategy an
3. Füge UI-Element im Settings-Dialog hinzu

## 📊 Abhängigkeiten

```
simon42-strategies-loader-v2.js
    ↓
    ├─→ simon42-config-manager.js (keine Abhängigkeiten)
    ├─→ simon42-settings-card.js
    │       └─→ simon42-config-manager.js
    ├─→ simon42-dashboard-strategy-v2.js
    │       └─→ simon42-config-manager.js
    └─→ View Strategies (keine Abhängigkeiten)
```

## 🔮 Roadmap

### Phase 1 (Aktuell) ✅
- Bereiche ausblenden
- Views ausblenden
- Persistente Speicherung
- Einstellungs-Dialog

### Phase 2 (Geplant)
- Drag & Drop für Bereiche
- Favoriten-Sektion
- Themes
- Responsive Design

### Phase 3 (Zukunft)
- Erweiterte Filter
- Custom Views
- Dashboard-Templates
- Import/Export

---

**Diese Architektur wurde inspiriert von:**
- Home Assistant's eigenem Home Dashboard
- Apple Home Dashboard von nitaybz
- Best Practices aus der Home Assistant Community
