# 🏠 Simon42 Dashboard Strategy

Eine erweiterte Dashboard-Strategy für Home Assistant mit umfangreichen Konfigurationsmöglichkeiten - speziell entwickelt für die Zuschauer des YouTube-Kanals **simon42**.

![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2024%2E7%2B-03a9f4)
![Strategy](https://img.shields.io/badge/Type-Dashboard%20Strategy-596677)

## ✨ Neue Features in V2

- ✅ **Bereiche ausblenden** - Wähle aus, welche Bereiche im Dashboard angezeigt werden
- ✅ **Views ausblenden** - Blende einzelne Ansichten (Lichter, Rollos, etc.) aus
- ✅ **Persistente Speicherung** - Alle Einstellungen werden automatisch gespeichert
- ✅ **Einstellungs-Dialog** - Übersichtliche UI zum Verwalten der Konfiguration
- ✅ **Pro Dashboard** - Jedes Dashboard kann eigene Einstellungen haben

## 🚀 Installation

### Schritt 1: Dateien hochladen

Lade folgende Dateien in deinen `/config/www/` Ordner hoch:

```
/config/www/
├── simon42-strategies-loader-v2.js
├── simon42-config-manager.js
├── simon42-dashboard-strategy-v2.js
├── simon42-settings-card.js
├── simon42-view-room.js
├── simon42-view-lights.js
├── simon42-view-covers.js
├── simon42-view-security.js
└── simon42-view-batteries.js
```

### Schritt 2: Resource hinzufügen

Füge in der `configuration.yaml` folgendes hinzu:

```yaml
lovelace:
  resources:
    - url: /local/simon42-strategies-loader-v2.js
      type: module
```

**Oder** über die UI:
1. Einstellungen → Dashboards → Ressourcen (oben rechts: 3 Punkte)
2. Ressource hinzufügen
3. URL: `/local/simon42-strategies-loader-v2.js`
4. Typ: `JavaScript-Modul`

### Schritt 3: Home Assistant neu starten

Starte Home Assistant neu, damit die neue Ressource geladen wird.

### Schritt 4: Dashboard erstellen

Erstelle ein neues Dashboard oder bearbeite ein bestehendes:

1. Einstellungen → Dashboards → Dashboard hinzufügen
2. Gib einen Namen ein (z.B. "Simon42 Dashboard")
3. Wähle "Bearbeitungsmodus mit YAML aktivieren"
4. Öffne die Roh-Konfiguration und ersetze den Inhalt mit:

```yaml
strategy:
  type: custom:simon42-dashboard
views: []
```

5. Speichern & Fertig! 🎉

## ⚙️ Konfiguration

### Einstellungen öffnen

Sobald das Dashboard geladen ist, siehst du in der Übersicht einen **Einstellungs-Button** (Zahnrad-Symbol).

Klicke darauf, um den Einstellungs-Dialog zu öffnen.

### Ansichten verwalten

Im Dialog kannst du folgende Ansichten ein- oder ausblenden:

- 💡 **Lichter** - Übersicht aller Lichter
- 🪟 **Rollos & Vorhänge** - Übersicht aller Covers
- 🔒 **Sicherheit** - Übersicht aller Security-Entities
- 🔋 **Batterien** - Übersicht aller Batteriestände

Ausgeblendete Ansichten werden:
- Nicht mehr in der Navigation angezeigt
- Nicht mehr in der Übersicht verlinkt

### Bereiche verwalten

Du kannst jeden Bereich (Area) einzeln ausblenden:

- Bereiche werden nach der Konfiguration sortiert
- Ausgeblendete Bereiche verschwinden komplett aus dem Dashboard
- Die Reihenfolge wird automatisch gespeichert

### Speicherung

Alle Änderungen werden **automatisch gespeichert** und bleiben nach einem Neustart erhalten.

Jedes Dashboard hat seine **eigenen Einstellungen** - du kannst also mehrere Dashboards mit unterschiedlichen Konfigurationen haben.

## 🔧 Wie es funktioniert

### Config Manager

Die Klasse `Simon42ConfigManager` verwaltet alle Konfigurationseinstellungen:

```javascript
{
  hidden_areas: [],      // Liste der ausgeblendeten Bereiche
  hidden_views: [],      // Liste der ausgeblendeten Views
  area_order: [],        // Benutzerdefinierte Reihenfolge
  favorites: [],         // Favoriten (für zukünftige Features)
  ui: {
    compact_mode: false  // UI-Einstellungen (für zukünftige Features)
  }
}
```

### Speicher-Mechanismus

Die Konfiguration wird im **Home Assistant Storage** gespeichert:

- Verwendet `lovelace/config/save` API
- Speicher-Key: `simon42_dashboard_config_{dashboard_path}`
- Jedes Dashboard hat einen eigenen Speicher-Key

### Dashboard-Generation

Die Strategy generiert das Dashboard dynamisch:

1. Lädt die gespeicherte Konfiguration
2. Filtert ausgeblendete Bereiche und Views
3. Sortiert Bereiche nach Benutzer-Präferenzen
4. Generiert die Dashboard-Struktur

## 🎨 Anpassung

### Eigene Filtertags

Du kannst Entities mit dem Label `no_dboard` versehen, um sie vom Dashboard auszuschließen:

1. Gehe zu einer Entity
2. Füge das Label `no_dboard` hinzu
3. Die Entity wird nicht mehr im Dashboard angezeigt

### Views anpassen

Die Views (Room, Lights, Covers, etc.) sind in separaten Dateien definiert und können individuell angepasst werden:

- `simon42-view-room.js` - Raum-Ansichten
- `simon42-view-lights.js` - Lichter-Übersicht
- `simon42-view-covers.js` - Rollos-Übersicht
- `simon42-view-security.js` - Sicherheits-Übersicht
- `simon42-view-batteries.js` - Batterie-Übersicht

## 🐛 Fehlerbehebung

### Dashboard lädt nicht

1. Überprüfe, ob alle Dateien im `/config/www/` Ordner sind
2. Überprüfe die Browser-Konsole auf Fehler (F12)
3. Stelle sicher, dass die Ressource korrekt eingebunden ist
4. Starte Home Assistant neu

### Einstellungen werden nicht gespeichert

1. Überprüfe die Browser-Konsole auf Fehler
2. Stelle sicher, dass du Schreibrechte auf das Storage hast
3. Versuche, das Dashboard im Inkognito-Modus zu öffnen

### Bereiche erscheinen nicht

1. Stelle sicher, dass die Bereiche in Home Assistant angelegt sind
2. Überprüfe, ob die Bereiche im Einstellungs-Dialog sichtbar geschaltet sind
3. Überprüfe die Browser-Konsole auf Fehler

## 🔮 Geplante Features

- 🎯 **Favoriten-Sektion** - Markiere wichtige Entities als Favoriten
- 📱 **Responsive Design** - Optimierung für mobile Geräte
- 🎨 **Themes** - Verschiedene Farbschemata
- 🔄 **Drag & Drop** - Bereiche per Drag & Drop sortieren
- 📊 **Statistiken** - Verbrauchs- und Nutzungsstatistiken
- 🔔 **Benachrichtigungen** - Wichtige Events im Dashboard

## 📺 YouTube

Weitere Tutorials und Updates findest du auf dem YouTube-Kanal **simon42**!

## 💬 Support

Bei Fragen oder Problemen:
- Schreibe einen Kommentar unter dem YouTube-Video
- Öffne ein Issue auf GitHub
- Schau in die Home Assistant Community

## 📝 Changelog

### V2.0.0 (Aktuell)
- ✨ Bereiche können ausgeblendet werden
- ✨ Views können ausgeblendet werden
- ✨ Einstellungs-Dialog hinzugefügt
- ✨ Persistente Speicherung implementiert
- ✨ Pro-Dashboard Konfiguration

### V1.0.0
- 🎉 Initiale Version
- Basis-Dashboard mit Areas
- Automatische View-Generierung

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz und kann frei verwendet und angepasst werden.

---

**Viel Spaß mit deinem neuen Dashboard! 🎉**

*Entwickelt für die Community von simon42 auf YouTube*
