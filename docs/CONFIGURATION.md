# Konfiguration

Diese Dokumentation beschreibt alle verfügbaren Konfigurationsoptionen für die simon42 Dashboard Strategy.

## Inhaltsverzeichnis

- [Basis-Konfiguration](#basis-konfiguration)
- [Sprache und Lokalisierung](#sprache-und-lokalisierung)
- [Dashboard-Karten](#dashboard-karten)
- [Views und Navigation](#views-und-navigation)
- [Entity-Filterung](#entity-filterung)
- [Erweiterte Optionen](#erweiterte-optionen)
- [Optionale Integrationen](#optionale-integrationen)

## Basis-Konfiguration

### Minimale Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
```

Das Dashboard funktioniert bereits mit dieser minimalen Konfiguration und verwendet alle Standard-Einstellungen.

### Vollständige Basis-Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
  language: de                  # Sprache: 'de' (Deutsch) oder 'en' (Englisch)
  show_person_badges: true      # Person Badges anzeigen
  show_weather: true             # Wetter-Karte anzeigen
  show_energy: true              # Energie-Dashboard anzeigen
  show_subviews: false           # Utility Views als Subviews
  show_search_card: false        # Optional: Search Card in Overview
  show_clock_card: false         # Optional: Clock Card in Overview
  show_summaries: true           # Zusammenfassungen anzeigen (Master-Toggle)
  show_covers_summary: true      # Rollo-Zusammenfassung anzeigen
  show_security_summary: true    # Alarm-Zusammenfassung anzeigen
  show_light_summary: true       # Licht-Zusammenfassung anzeigen
  show_battery_summary: true     # Batterie-Zusammenfassung anzeigen
  summaries_columns: 2           # Layout: 2 (2x2) oder 4 (1x4)
  group_by_floors: false         # Bereiche nach Etagen gruppieren
  log_level: warn                # Log-Level: 'error', 'warn', 'info', 'debug'
```

## Sprache und Lokalisierung

### Sprachauswahl

Das Dashboard unterstützt Deutsch und Englisch. Die Sprache wird automatisch aus den Benutzereinstellungen von Home Assistant gelesen, kann aber auch manuell gesteuert werden.

```yaml
strategy:
  type: custom:simon42-dashboard
  language: en  # Optional: 'de' für Deutsch oder 'en' für Englisch
```

**Sprachpriorität:**
1. `dashboard_language` Override in der Config (höchste Priorität)
2. Explizite `language`-Einstellung in der Config
3. Spracheinstellung des Benutzers in Home Assistant (`hass.language`)

**Zeitformat-Priorität:**
1. `dashboard_time_format` Override in der Config (höchste Priorität) - Werte: `'12'`, `'24'`, oder `null` (für User-Präferenz)
2. Explizite `time_format`-Einstellung in der Config
3. Zeitformat-Einstellung des Benutzers in Home Assistant (`hass.locale.time_format`)
4. Deutsch als Standard-Sprache (Fallback)

**Verfügbare Sprachen:**
- `de` - Deutsch (Standard)
- `en` - Englisch

Alle Überschriften, Labels und Texte im Dashboard werden automatisch in der gewählten Sprache angezeigt.

## Dashboard-Karten

### Person Badges

```yaml
show_person_badges: true          # Person Badges anzeigen (Standard: true)
```

### Wetter

```yaml
show_weather: true  # Wetter-Karte anzeigen (Standard: true)
```

Die Wetter-Karte wird automatisch angezeigt, wenn eine Weather-Entity vorhanden ist.

### Energie

```yaml
show_energy: true  # Energie-Dashboard anzeigen (Standard: true)
```

### Summary Cards

```yaml
show_covers_summary: true    # Rollo-Zusammenfassung anzeigen (Standard: true)
show_security_summary: true  # Alarm-Zusammenfassung anzeigen (Standard: true)
show_light_summary: true     # Licht-Zusammenfassung anzeigen (Standard: true)
show_battery_summary: true   # Batterie-Zusammenfassung anzeigen (Standard: true)
summaries_columns: 2         # Layout: 2 (2x2 Grid) oder 4 (1x4 Reihe)
```

### Optionale Karten

```yaml
show_search_card: false  # Search Card in Übersicht anzeigen
show_clock_card: false  # Clock Card in Übersicht anzeigen
```

## Views und Navigation

### Subviews

```yaml
show_subviews: false  # Utility Views als Subviews anzeigen (Standard: false)
```

Wenn aktiviert, werden die spezialisierten Views (Lichter, Rollos, Sicherheit, Batterien) als Subviews in der Navigation angezeigt.

### Room Views

```yaml
show_room_views: false  # Raum-Views in Navigation anzeigen (Standard: false)
```

Wenn aktiviert, werden die Raum-Detail-Views in der Navigation angezeigt.

### Summary Views

```yaml
show_summary_views: false  # Summary Views in Navigation anzeigen (Standard: false)
```

Wenn aktiviert, werden die Summary-Views (Lichter, Rollos, Sicherheit, Batterien) in der Navigation angezeigt.

## Entity-Filterung

### Bereich-Verwaltung

```yaml
areas_display:
  hidden: 
    - bad
    - garage
  order:
    - wohnzimmer
    - kueche
    - schlafzimmer
```

### Entity-Filterung pro Bereich

```yaml
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
```

Siehe [ADVANCED.md](ADVANCED.md#entity-filterung) für detaillierte Informationen zur Filterlogik.

### Entity Name Transformation

```yaml
entity_name_patterns:
  - "^.*? - .*? - "  # Entfernt alles vor dem letzten " - "
```

Siehe [ADVANCED.md](ADVANCED.md#entity-name-transformation) für detaillierte Informationen.

### Entity Name Translations

```yaml
entity_name_translations:
  - from: "Bedroom"
    to: "Schlafzimmer"
    from_lang: "en"
    to_lang: "de"
```

Siehe [ADVANCED.md](ADVANCED.md#entity-name-translations) für detaillierte Informationen.

## Erweiterte Optionen

### Floor-basierte Organisation

```yaml
group_by_floors: true  # Bereiche nach Etagen gruppieren (Standard: false)
```

### Favoriten

```yaml
favorite_entities:
  - sensor.temperatur_wohnzimmer
  - light.hauptbeleuchtung
  - cover.rollo_wohnzimmer
```

Siehe [FEATURES.md](FEATURES.md#favoriten-system) für Details.

### Raum-Pins

```yaml
room_pin_entities:
  - sensor.wetterstation_temperatur
  - sensor.wetterstation_luftfeuchtigkeit
```

Siehe [FEATURES.md](FEATURES.md#raum-pins) für Details.

### Logging

```yaml
log_level: warn  # Log-Level: 'error', 'warn', 'info', 'debug' (Standard: 'warn')
```

## Optionale Integrationen

### Better Thermostat

```yaml
show_better_thermostat: true
```

Siehe [INTEGRATIONS.md](INTEGRATIONS.md#better-thermostat-ui-card) für Details.

### Horizon Card

```yaml
show_horizon_card: true
horizon_card_extended: true  # Optional: Erweiterte Informationen
```

Siehe [INTEGRATIONS.md](INTEGRATIONS.md#horizon-card) für Details.

### Clock Weather Card

```yaml
use_clock_weather_card: true
clock_weather_sun_entity: sun.sun  # Optional: Sonnen-Entity
clock_weather_temperature_sensor: sensor.temperatur  # Optional: Temperatur-Sensor
clock_weather_humidity_sensor: sensor.luftfeuchtigkeit  # Optional: Luftfeuchtigkeits-Sensor
clock_weather_icon_type: line  # Optional: 'line' oder 'fill'
```

Siehe [INTEGRATIONS.md](INTEGRATIONS.md#clock-weather-card) für Details.

### Alarm Panel

```yaml
alarm_entity: alarm_control_panel.haus
use_alarmo_card: false  # Optional: Alarmo-Karte verwenden
```

Siehe [INTEGRATIONS.md](INTEGRATIONS.md#alarm-panel) für Details.

### Scheduler Card

```yaml
show_scheduler_card: true
scheduler_entity: switch.scheduler_heating
```

Siehe [INTEGRATIONS.md](INTEGRATIONS.md#scheduler-card) für Details.

### Calendar Card

```yaml
show_calendar_card: true
use_calendar_card_pro: false  # Optional: Calendar Card Pro verwenden
calendar_entities:
  - calendar.home
  - calendar.work
```

Siehe [INTEGRATIONS.md](INTEGRATIONS.md#calendar-card) für Details.

### Öffentlicher Nahverkehr

```yaml
show_public_transport: true
public_transport_integration: hvv  # 'hvv', 'ha-departures', 'kvv' oder 'db_info'
public_transport_card: hvv-card  # 'hvv-card', 'ha-departures-card', 'kvv-departures-card' oder 'flex-table-card'
public_transport_entities:
  - sensor.hvv_departures
```

Siehe [INTEGRATIONS.md](INTEGRATIONS.md#öffentlicher-nahverkehr) für Details.

## Vollständige Konfigurationsreferenz

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| `language` | string | `'de'` | Sprache des Dashboards: `'de'` (Deutsch) oder `'en'` (Englisch) |
| `show_person_badges` | boolean | `true` | Zeige die Person Badges in der Übersicht |
| `show_weather` | boolean | `true` | Zeigt die Wetter-Karte in der Übersicht (falls Weather-Entity vorhanden) |
| `show_energy` | boolean | `true` | Zeigt das Energie-Dashboard in der Übersicht |
| `show_subviews` | boolean | `false` | Zeigt Utility-Views in der Navigation |
| `show_summary_views` | boolean | `false` | Zeigt Summary-Views in der Navigation |
| `show_room_views` | boolean | `false` | Zeigt Raum-Views in der Navigation |
| `show_search_card` | boolean | `false` | Zeigt optional eine Search Card in der Übersicht |
| `show_clock_card` | boolean | `false` | Zeigt optional eine Uhr in der Übersicht an |
| `show_summaries` | boolean | `true` | Master-Toggle: Zeigt die Zusammenfassungskarten in der Übersicht an. Wenn deaktiviert, werden alle Zusammenfassungen ausgeblendet. |
| `show_covers_summary` | boolean | `true` | Zeigt die Rollo-Zusammenfassungskarte in der Übersicht (nur wenn `show_summaries` aktiviert ist) |
| `show_security_summary` | boolean | `true` | Zeigt die Alarm-Zusammenfassungskarte in der Übersicht (nur wenn `show_summaries` aktiviert ist) |
| `show_light_summary` | boolean | `true` | Zeigt die Licht-Zusammenfassungskarte in der Übersicht (nur wenn `show_summaries` aktiviert ist) |
| `show_battery_summary` | boolean | `true` | Zeigt die Batterie-Zusammenfassungskarte in der Übersicht (nur wenn `show_summaries` aktiviert ist) |
| `summaries_columns` | number | `2` | Layout der Zusammenfassungskarten: `2` (2x2 Grid) oder `4` (1x4 Reihe) |
| `group_by_floors` | boolean | `false` | Gruppiert Bereiche nach Etagen/Floors |
| `log_level` | string | `'warn'` | Log-Level: `'error'`, `'warn'`, `'info'`, `'debug'` |
| `favorite_entities` | array | `[]` | Array von Entity-IDs, die als Favoriten in der Übersicht angezeigt werden |
| `room_pin_entities` | array | `[]` | Array von Entity-IDs, die als Raum-Pins angezeigt werden |
| `entity_name_patterns` | array | `[]` | Array von Regex-Patterns zum Transformieren von Entity-Namen |
| `entity_name_translations` | array | `[]` | Array von Übersetzungsobjekten für Entity- und Area-Namen |
| `areas_display` | object | `{}` | Bereich-Verwaltung (hidden, order) |
| `areas_options` | object | `{}` | Entity-Verwaltung pro Bereich |

Für detaillierte Informationen zu den optionalen Integrationen siehe [INTEGRATIONS.md](INTEGRATIONS.md).

