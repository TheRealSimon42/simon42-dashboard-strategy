# simon42 Dashboard Strategy

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
- **Entity Name Transformation** - Transformiere Entity-Namen mit Regex-Patterns

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

### 🔌 Anpassbar an deine Integrationen
- **Search Card** - Integration für custom search cards
- **Alarm Panel** - Unterstützung für Alarmanlagen
- **Better Thermostat** - Ersetzt Standard-Thermostat-Karten durch Better Thermostat UI-Karten
- **Horizon Card** - Zeigt Sonnen- und Mondposition über dem Horizont
- **Clock Weather Card** - Kombiniert Uhr, Datum und Wettervorhersage
- **Alarmo Card** - Unterstützung für Alarmo-Karten bei Alarm-Entitäten
- **Scheduler Card** - Zeitplan-Verwaltung mit der Scheduler-Karte
- **Calendar Card** - Kalender-Integration mit der Calendar-Karte
- **Todo Swipe Card** - Todo-Listen mit Swipe-Funktionalität
- **Öffentlicher Nahverkehr** - Unterstützt HVV, ha-departures, KVV und db_info Integrationen

**📚 [Vollständige Feature-Liste →](docs/FEATURES.md)**

---

## 📦 Installation

### Option 1: Installation über HACS (empfohlen)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=TheRealSimon42&repository=simon42-dashboard-strategy&category=plugin)

1. Gehe zu HACS → **Custom repositories**
2. Füge das Repository hinzu: `https://github.com/phil-lipp/simon42-dashboard-strategy`
3. Installiere die "Simon42 Dashboard Strategy"
4. Folge den Anweisungen in HACS für die Resource-Registrierung

### Option 2: Manuelle Installation

<details>
<summary>Manuelle Installationsschritte</summary>

1. Kopiere alle Dateien aus dem `dist` Ordner nach `/config/www/simon42-strategy/`
2. Füge in deiner `configuration.yaml` hinzu:
   ```yaml
   lovelace:
     mode: storage
     resources:
       - url: /local/simon42-strategy/simon42-dashboard-strategy.js
         type: module
   ```
3. Starte Home Assistant neu

</details>

---

## 🖥️ Benutzung / Dashboard erstellen

1. Gehe zu **Einstellungen** → **Dashboards**
2. Klicke auf **Dashboard hinzufügen**
3. Wähle **Neues Dashboard von Grund auf** und vergebe einen Namen
4. Öffne das neue Dashboard und aktiviere den **Edit-Modus** oben rechts
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
- **Companion App**: Einstellungen → Companion App → Debugging → Reset frontend cache → pull to refresh dashboard

Die aktuelle Version wird in der Browser-Konsole angezeigt. Prüfe `window.Simon42DashboardVersion` für Details.

**📚 [Detaillierte Editor-Anleitung →](docs/EDITOR.md)**

---

## 📚 Dokumentation

Die vollständige Dokumentation ist in separate Dateien aufgeteilt:

- **[📋 Konfiguration](docs/CONFIGURATION.md)** - Alle verfügbaren Konfigurationsoptionen und YAML-Referenz
- **[✨ Features](docs/FEATURES.md)** - Detaillierte Beschreibung aller Features
- **[🎨 Editor](docs/EDITOR.md)** - Anleitung zur Verwendung des grafischen Konfigurators
- **[📊 Views](docs/VIEWS.md)** - Beschreibung aller spezialisierten Views
- **[🔌 Integrationen](docs/INTEGRATIONS.md)** - Details zu allen optionalen Integrationen
- **[🔧 Erweiterte Themen](docs/ADVANCED.md)** - Entity-Filterung, Performance, Architektur
- **[🤝 Contributing](docs/CONTRIBUTING.md)** - Richtlinien für Beiträge

---

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

**📚 [Mehr Details →](docs/ADVANCED.md#label-system)**

---

## 🎯 Schnellstart-Beispiele

### Minimale Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
```

### Mit Favoriten und Raum-Pins

```yaml
strategy:
  type: custom:simon42-dashboard
  favorite_entities:
    - sensor.temperatur_wohnzimmer
    - light.hauptbeleuchtung
  room_pin_entities:
    - sensor.wetterstation_temperatur
```

### Mit Floor-basierter Organisation

```yaml
strategy:
  type: custom:simon42-dashboard
  group_by_floors: true
```

**📚 [Vollständige Konfigurationsreferenz →](docs/CONFIGURATION.md)**

---

## 🤝 Contributing

Dieses Projekt sucht aktiv nach Maintainern! Pull Requests sind willkommen.

**📚 [Contributing Guidelines →](docs/CONTRIBUTING.md)**

---

## 📋 Roadmap

- [x] Entity-Sortierung per Drag & Drop im Editor
- [x] Erweiterte Favoriten-Funktionen
- [x] Mehrsprachigkeit (i18n) - Deutsch und Englisch
- [x] Logging-System mit konfigurierbaren Log-Leveln
- [ ] Preset-Templates für verschiedene Use-Cases
- [ ] Import von Views aus anderen Dashboards
- [ ] Themes & Custom Styling
- [ ] Export/Import von Konfigurationen

---

## 🐛 Bekannte Probleme & Limitationen

- Editor kann bei sehr vielen Entities (>500) langsam werden
- Drag & Drop funktioniert auf Touch-Geräten nicht optimal
- Einige Custom Cards werden möglicherweise nicht korrekt gerendert
- Performance bei floor-basierten Layouts kann bei >20 Bereichen leiden

**Workarounds siehe [GitHub Issues](https://github.com/phil-lipp/simon42-dashboard-strategy/issues)**

---

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

---

## 🙏 Credits & Danksagungen

- Home Assistant Community für Inspiration und Feedback
- Alle Contributor und Tester
- Entwickler der genutzten Custom Cards und Integrationen

---

## 📞 Support & Kontakt

- **[GitHub Issues](https://github.com/phil-lipp/simon42-dashboard-strategy/issues)**
- **[simon42 Community](https://community.simon42.com/):** Suchfunktion hilft immer 😜

---

**Entwickelt mit ❤️ für die Home Assistant Community**

*Letzte Aktualisierung: 10.12.2025*
