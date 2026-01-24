# Optionale Integrationen

Diese Dokumentation beschreibt alle optionalen Integrationen, die mit der simon42 Dashboard Strategy verwendet werden können.

## Inhaltsverzeichnis

- [Search Card](#search-card)
- [Clock Card](#clock-card)
- [Alarm Panel](#alarm-panel)
- [Reolink Kameras](#reolink-kameras)
- [Better Thermostat UI Card](#better-thermostat-ui-card)
- [Horizon Card](#horizon-card)
- [Clock Weather Card](#clock-weather-card)
- [Alarmo Card](#alarmo-card)
- [Scheduler Card](#scheduler-card)
- [Calendar Card](#calendar-card)
- [Todo Swipe Card](#todo-swipe-card)
- [Öffentlicher Nahverkehr](#öffentlicher-nahverkehr)

## Search Card

Aktiviere eine Search Card in der Übersicht. Die Option ist im Editor verfügbar.

### Voraussetzung

- Custom Search Card muss installiert sein
- Wird automatisch erkannt und eingebunden

### Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
  show_search_card: true
```

## Clock Card

Zeigt eine Uhr in der Übersicht an.

### Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
  show_clock_card: true
```

## Alarm Panel

Konfiguriere ein Alarm-Panel für die Security-View. Verfügbar im Editor unter "Alarm Control Panel".

### Features

- Integration in Security-View
- Badge in der Übersicht mit aktuellem Status
- Steuerung direkt aus dem Dashboard
- Automatische Erkennung verfügbarer Alarm-Panels im Editor

### Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
  alarm_entity: alarm_control_panel.haus
```

## Reolink Kameras

Erweiterte Unterstützung für Reolink-Kameras:

- Automatische Erkennung von Reolink-Entities
- Optimierte Card-Konfiguration
- PTZ-Controls (falls unterstützt)

## Better Thermostat UI Card

Ersetzt Standard-Thermostat-Karten durch Better Thermostat UI-Karten in den Räumen. Aktivierbar im Editor.

### Features

- Automatische Erkennung von Better Thermostat Entities über die Platform in der Entity Registry
- Getrennte Darstellung: Better Thermostat Entities werden mit der `better-thermostat-ui-card` angezeigt, Standard-Thermostate bleiben als Tile-Cards
- Standard-Thermostate können separat ausgeblendet werden (über Editor oder Entity Visibility)

### Voraussetzung

- Better Thermostat Integration muss über HACS oder manuell installiert sein
- Better Thermostat UI Card muss als Custom Card installiert sein
- Der Editor prüft automatisch, ob beide Komponenten verfügbar sind

### Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
  show_better_thermostat: true
```

## Horizon Card

Zeigt die Position der Sonne über dem Horizont in der Wetter-Sektion. Konfigurierbar im Editor.

### Features

- Basis-Modus: Sonnenaufgang, Sonnenuntergang, Mondaufgang, Monduntergang
- Erweiterter Modus: Zusätzlich Azimut, Elevation, Mittag, Dämmerung und Mondphase
- Automatische Integration in die Wetter-Sektion

### Voraussetzung

- `lovelace-horizon-card` muss über HACS installiert sein
- Der Editor prüft automatisch, ob die Card verfügbar ist

### Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
  show_horizon_card: true
  horizon_card_extended: true  # Optional: Erweiterte Informationen
```

## Clock Weather Card

Ersetzt die Standard-Wetter-Karte durch die Clock Weather Card, die Uhrzeit, Datum und Wettervorhersage kombiniert. Konfigurierbar im Editor.

### Features

- Kombiniert Uhr, Datum und Wettervorhersage in einer Card
- iOS-inspirierte Wetter-Icons mit Animationen
- Unterstützt tägliche und stündliche Vorhersagen
- Automatische Anpassung an Benutzer-Präferenzen (Sprache, Zeitformat, Locale)
- Kann mit Horizon Card kombiniert werden

### Voraussetzung

- `clock-weather-card` muss über HACS installiert sein
- Der Editor prüft automatisch, ob die Card verfügbar ist
- Eine Weather-Entity muss vorhanden sein

### Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
  use_clock_weather_card: true
```

### Erweiterte Optionen

Die Clock Weather Card unterstützt zusätzliche Optionen:

```yaml
strategy:
  type: custom:simon42-dashboard
  use_clock_weather_card: true
  clock_weather_sun_entity: sun.sun  # Optional: Sonnen-Entity für Tag/Nacht-Icon
  clock_weather_temperature_sensor: sensor.temperatur  # Optional: Temperatur-Sensor
  clock_weather_humidity_sensor: sensor.luftfeuchtigkeit  # Optional: Luftfeuchtigkeits-Sensor
  clock_weather_icon_type: line  # Optional: 'line' oder 'fill' für Icon-Stil
```

Die Card verwendet automatisch die Benutzer-Präferenzen für Sprache, Zeitformat und Locale. Weitere Optionen können direkt in der Card-Konfiguration gesetzt werden (siehe [Clock Weather Card Dokumentation](https://github.com/pkissling/clock-weather-card)).

## Alarmo Card

Ersetzt die Standard-Tile-Karte für Alarm-Entitäten durch die Alarmo-Karte, wenn eine Alarmo-Entität ausgewählt wurde. Konfigurierbar im Editor.

### Features

- Automatische Erkennung von Alarmo-Entities über die Platform in der Entity Registry
- Option wird nur angezeigt, wenn eine Alarmo-Entität als Alarm-Entity ausgewählt wurde
- Verwendet die `alarmo-card` statt der Standard-Tile-Karte

### Voraussetzung

- Alarmo Integration muss installiert sein
- `alarmo-card` muss als Custom Card installiert sein
- Der Editor prüft automatisch, ob die Card verfügbar ist

### Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
  alarm_entity: alarm_control_panel.alarmo
  use_alarmo_card: true
```

## Scheduler Card

Zeigt eine Scheduler-Karte an, um Zeitpläne zu verwalten. Konfigurierbar im Editor.

### Features

- Integration der Scheduler-Karte in die Übersicht
- Zeigt automatisch alle verfügbaren Zeitpläne an
- Keine Entity-Auswahl erforderlich

### Voraussetzung

- Scheduler Component Integration muss installiert sein
- `scheduler-card` muss als Custom Card installiert sein
- Der Editor prüft automatisch, ob beide Komponenten verfügbar sind

### Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
  show_scheduler_card: true
```

Die Scheduler-Karte zeigt automatisch alle verfügbaren Zeitpläne an. Es ist keine Entity-Auswahl mehr erforderlich.

### Links

- [Scheduler Card](https://github.com/nielsfaber/scheduler-card)
- [Scheduler Component](https://github.com/nielsfaber/scheduler-component)

## Calendar Card

Zeigt eine Kalender-Karte mit ausgewählten Kalender-Entitäten an. Konfigurierbar im Editor.

### Features

- Integration der Calendar-Karte in die Übersicht
- Unterstützt mehrere Kalender-Entities
- Automatische Erkennung verfügbarer Kalender-Entities im Editor
- Optionale Verwendung von Calendar Card Pro für erweiterte Funktionen und bessere Performance

### Voraussetzung

- `calendar-card` oder `calendar-card-pro` muss als Custom Card installiert sein
- Der Editor prüft automatisch, ob eine der Cards verfügbar ist
- Kalender-Entities müssen vorhanden sein

### Konfiguration

**Standard Calendar Card:**
```yaml
strategy:
  type: custom:simon42-dashboard
  show_calendar_card: true
  calendar_entities:
    - calendar.home
    - calendar.work
```

**Calendar Card Pro:**
```yaml
strategy:
  type: custom:simon42-dashboard
  show_calendar_card: true
  use_calendar_card_pro: true
  calendar_entities:
    - calendar.home
    - calendar.work
```

### Links

- [Calendar Card](https://github.com/ljmerza/calendar-card)
- [Calendar Card Pro](https://github.com/alexpfau/calendar-card-pro)

## Todo Swipe Card

Zeigt eine Todo Swipe Card mit ausgewählten Todo-Entitäten an. Konfigurierbar im Editor.

### Features

- Integration der Todo Swipe Card in die Übersicht
- Unterstützt mehrere Todo-Entities
- Automatische Erkennung verfügbarer Todo-Entities im Editor
- Swipe-Funktionalität zum Wechseln zwischen Todo-Listen
- Unterstützt alle Optionen der Todo Swipe Card

### Voraussetzung

- `todo-swipe-card` muss als Custom Card installiert sein
- Der Editor prüft automatisch, ob die Card verfügbar ist
- Todo-Entities müssen vorhanden sein

### Konfiguration

```yaml
strategy:
  type: custom:simon42-dashboard
  show_todo_swipe_card: true
  todo_entities:
    - todo.shopping_list
    - todo.home_tasks
    - todo.work_projects
```

### Erweiterte Optionen

Die Todo Swipe Card unterstützt zusätzliche Optionen:

```yaml
strategy:
  type: custom:simon42-dashboard
  show_todo_swipe_card: true
  todo_entities:
    - todo.shopping_list
    - todo.home_tasks
  todo_swipe_card_show_pagination: true
  todo_swipe_card_show_completed: false
  todo_swipe_card_card_spacing: 15
```

Weitere Optionen können direkt in der Card-Konfiguration gesetzt werden (siehe [Todo Swipe Card Dokumentation](https://github.com/nutteloost/todo-swipe-card)).

### Links

- [Todo Swipe Card](https://github.com/nutteloost/todo-swipe-card)

## Öffentlicher Nahverkehr

Zeige Abfahrtszeiten des öffentlichen Nahverkehrs in der Übersicht. Unterstützt mehrere Integrationen: HVV (Hamburg), ha-departures (EFA-basiert), KVV (Karlsruhe) und db_info (Deutsche Bahn).

Alle Einstellungen können im Editor unter "Öffentlicher Nahverkehr" konfiguriert werden. Der Editor erkennt automatisch verfügbare Entities und prüft die benötigten Cards.

### Voraussetzungen

- Die entsprechende Card muss installiert sein (`hvv-card`, `ha-departures-card`, `kvv-departures-card` oder `flex-table-card` für `db_info`)
- Die entsprechende Integration muss installiert und konfiguriert sein
- Der Editor prüft automatisch, ob die benötigte Card verfügbar ist
- Entities müssen Abfahrtszeiten bereitstellen

### HVV (Hamburg)

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

### ha-departures (EFA-basiert, Deutschland)

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

### KVV (Karlsruher Verkehrsverbund)

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

### db_info (Deutsche Bahn)

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

### Weitere Hinweise

- **ha-departures:** Der Editor erkennt Entities automatisch anhand ihrer Attribute (`line_name`, `transport`, `planned_departure_time`, `direction`) - Keywords im Namen sind nicht erforderlich
- **kvv:** Der Editor erkennt Entities automatisch anhand ihrer Attribute (`abfahrten` Array mit `line`, `direction`, `countdown`, `realtime`, `dateTime`)
- **hvv/db_info:** Der Editor filtert automatisch relevante Entities (sensor/button mit Transport-Keywords)

