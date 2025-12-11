# Contributing

Vielen Dank für dein Interesse an der Weiterentwicklung der simon42 Dashboard Strategy!

## Inhaltsverzeichnis

- [Maintainers gesucht](#maintainers-gesucht)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Code-Style](#code-style)
- [Testen](#testen)
- [Roadmap](#roadmap)

## Maintainers gesucht

Dieses Projekt sucht aktiv nach Maintainern, die bei der Weiterentwicklung helfen möchten!

**Interessiert?**
- Erstelle Issues für Bugs oder Feature-Requests
- Pull Requests sind willkommen
- **Bitte teste PRs gründlich vor dem Einreichen** 🫶

## Pull Request Guidelines

### 1. Feature Branch erstellen

```bash
git checkout -b feature/mein-neues-feature
```

### 2. Code-Style beachten

- Kommentare auf Deutsch oder Englisch
- JSDoc für Funktionen
- Aussagekräftige Commit-Messages

### 3. Testen

- Teste alle Änderungen in einem lokalen HA-Setup
- Prüfe verschiedene Szenarien (mit/ohne Config, etc.)
- Validiere die Performance

### 4. Pull Request erstellen

- Beschreibe die Änderungen ausführlich
- Füge Screenshots hinzu (bei UI-Änderungen)
- Referenziere zugehörige Issues

## Code-Style

### Kommentare

- Kommentare können auf Deutsch oder Englisch sein
- Sei konsistent innerhalb einer Datei
- Erkläre "warum", nicht "was" (Code sollte selbsterklärend sein)

### JSDoc

Verwende JSDoc für alle exportierten Funktionen:

```javascript
/**
 * Filtert Entities basierend auf verschiedenen Kriterien
 * @param {Array} entities - Array von Entity-Objekten
 * @param {Object} options - Filter-Optionen
 * @param {string} options.domain - Domain-Filter (z.B. 'light')
 * @param {Set} options.excludeLabels - Set von Entity-IDs mit no_dboard Label
 * @returns {Array} Gefilterte Entities
 */
export function filterEntities(entities, options) {
  // ...
}
```

### Commit-Messages

- Verwende aussagekräftige Commit-Messages
- Erste Zeile sollte eine kurze Zusammenfassung sein (< 50 Zeichen)
- Optional: Detaillierte Beschreibung in weiteren Zeilen

Beispiele:
```
feat: Add support for Clock Weather Card

- Add clock_weather_card option
- Integrate with weather section
- Add dependency check in editor
```

## Testen

### Lokales Setup

1. Kopiere die Dateien nach `/config/www/simon42-strategy/`
2. Starte Home Assistant neu
3. Teste die Änderungen in einem Test-Dashboard

### Test-Szenarien

- **Mit Config**: Teste mit verschiedenen Konfigurationen
- **Ohne Config**: Teste mit minimaler Konfiguration
- **Viele Entities**: Teste mit >100 Entities
- **Verschiedene Domains**: Teste mit verschiedenen Entity-Typen
- **Performance**: Prüfe die Ladezeit und Responsiveness

### Browser-Cache

Nach Änderungen den Browser-Cache leeren:
- **Hard Refresh**: `Ctrl+Shift+R` (Windows) oder `Cmd+Shift+R` (Mac)
- **Chrome DevTools**: F12 → Rechtsklick auf Refresh → "Empty Cache and Hard Reload"

## Roadmap

### Abgeschlossen

- [x] Entity-Sortierung per Drag & Drop im Editor
- [x] Erweiterte Favoriten-Funktionen
- [x] Mehrsprachigkeit (i18n) - Deutsch und Englisch
- [x] Logging-System mit konfigurierbaren Log-Leveln
- [x] Debug-Einstellungen im Editor

### Geplant

- [ ] Preset-Templates für verschiedene Use-Cases
- [ ] Import von Views aus anderen Dashboards
- [ ] Themes & Custom Styling
- [ ] Export/Import von Konfigurationen

## Bekannte Probleme & Limitationen

- Editor kann bei sehr vielen Entities (>500) langsam werden
- Drag & Drop funktioniert auf Touch-Geräten nicht optimal
- Einige Custom Cards werden möglicherweise nicht korrekt gerendert
- Performance bei floor-basierten Layouts kann bei >20 Bereichen leiden

**Workarounds siehe GitHub Issues**

## Fragen?

Bei Fragen oder Problemen:
- **[GitHub Issues](https://github.com/phil-lipp/simon42-dashboard-strategy/issues)**
- **[simon42 Community](https://community.simon42.com/)**

