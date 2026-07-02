# simon42 Dashboard Strategy

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/v/release/TheRealSimon42/simon42-dashboard-strategy?style=for-the-badge&color=green)](https://github.com/TheRealSimon42/simon42-dashboard-strategy/releases)
[![GitHub Stars](https://img.shields.io/github/stars/TheRealSimon42/simon42-dashboard-strategy?style=for-the-badge&color=yellow)](https://github.com/TheRealSimon42/simon42-dashboard-strategy/stargazers)
![AI-Assisted](https://img.shields.io/badge/AI--Assisted-blue?style=for-the-badge)
[![License](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-lightgrey?style=for-the-badge)](LICENSE)

Eine modulare und hochkonfigurierbare Dashboard-Strategy für Home Assistant, die automatisch Views basierend auf Bereichen, Entitäten und deren Zuständen generiert.

<p align="center">
  <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/Screenshot-simon42-strategy.png" alt="simon42 Dashboard Strategy — Übersicht" width="800" />
</p>

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=TheRealSimon42&repository=simon42-dashboard-strategy&category=plugin)

---

## Video-Anleitung

<p align="center">
  <a href="https://youtu.be/XU7DfQrfJ2w">
    <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/video-thumbnail.png" alt="simon42 Dashboard Strategy — Video Tutorial" width="600" />
  </a>
  <br/>
  <em>Schritt-für-Schritt Anleitung auf YouTube ansehen</em>
</p>

---

## Unterstütze dieses Projekt

Wenn dir die simon42 Dashboard Strategy hilft, unterstütze die Weiterentwicklung:

<p align="center">
  <a href="https://youtube.com/@simon42/join">
    <img src="https://img.shields.io/badge/YouTube-Kanalmitglied_werden-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube Kanalmitglied werden" />
  </a>
  <br/>
  <em>Bevorzugte Unterstützung: Werde Kanalmitglied auf YouTube!</em>
  <br/><br/>
  <a href="https://www.buymeacoffee.com/simon42official">
    <img src="https://img.shields.io/badge/Buy_Me_A_Coffee-Spende_einen_Kaffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" />
  </a>
</p>

---

## Features

- **Grafischer Konfigurator** — Keine YAML-Kenntnisse erforderlich, Drag & Drop für Bereiche
- **Automatische Raum-Erkennung** — Nutzt Home Assistant Areas, Devices & Floors
- **Spezialisierte Views** — Lichter, Rollos, Sicherheit, Batterien, Klima — jeweils mit Status-Gruppierung
- **Zusammenfassungskarten** — Einzeln ein-/ausschaltbar für Lichter, Rollos, Sicherheit, Batterien und Klima
- **Etagen-Gruppierung** — Bereiche und Lichter optional nach Etagen gliedern
- **Favoriten** — Beliebige Entitäten als Kacheln auf der Übersicht anpinnen
- **Alarm-Panel** — Optionale Alarmanlage neben der Uhr
- **Granulare Filterung** — Per Label (`no-dboard`), pro Bereich, pro Domain, pro Entity
- **Teiloffene Rollos** — Optionale dritte Gruppe (Offen / Teiloffen / Geschlossen) mit Live-Übergängen
- **Alert-Icons** — Optionale Alert-Badges auf Bereichskarten (Bewegung, Feuchtigkeit, Rauch, Wärme u.a.)
- **Rauch- & Gasmelder** — In der Sicherheits-Übersicht, im Security-Summary-Count und als Badges in Raum-Views
- **Batch-Aktionen** — Heading-Badges für Gruppensteuerung (alle ein/aus, alle öffnen/schließen)
- **Automationen & Skripte in Räumen** — Bereichs-zugeordnete Automationen und Skripte in Raum-Views anzeigen
- **Eigene Karten** — Beliebige Karten via YAML auf der Übersicht einbinden
- **Eigene Badges** — Beliebige Badges via YAML im Header (neben Personen-Chips)
- **Custom Views** — Eigene Dashboard-Views mit beliebigen Cards via YAML
- **Reaktive Updates** — Echtzeit-Aktualisierung via LitElement Custom Cards
- **Mehrsprachig** — Deutsch und Englisch, automatische Erkennung aus HA-Einstellungen, Fallback auf Englisch
- **Performance-optimiert** — Code-Split Bundles, Registry-Caching, Tile-Card-Pooling

## Installation

### HACS (empfohlen)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=TheRealSimon42&repository=simon42-dashboard-strategy&category=plugin)

<details>
<summary>Alternative zum Button</summary>

1. Gehe zu HACS → **Custom repositories**
2. Füge das Repository hinzu: `https://github.com/TheRealSimon42/simon42-dashboard-strategy`
3. Lade die "Simon42 Dashboard Strategy" herunter
4. Klicke nach dem Download in HACS auf die Meldung "Neu laden", um die Installation abzuschließen

</details>

### Manuelle Installation

<details>
<summary>Manuelle Installationsschritte</summary>

1. Kopiere alle Dateien aus `dist/` nach `/config/www/simon42-strategy/`
2. Füge in `configuration.yaml` hinzu:

```yaml
lovelace:
  mode: storage
  resources:
    - url: /local/simon42-strategy/simon42-dashboard-strategy.js
      type: module
```

3. Starte Home Assistant neu

</details>

## Voraussetzungen

Die Strategy generiert das Dashboard automatisch aus deiner Home Assistant Konfiguration. Damit alles korrekt angezeigt wird:

**Bereiche & Etagen einrichten** — Lege in Home Assistant unter **Einstellungen → Bereiche & Zonen** deine Räume an und weise sie optional Etagen zu. Geräte müssen einem Bereich zugeordnet sein, damit sie im Dashboard erscheinen.

<p align="center">
  <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/Etagen-und-Bereiche.gif" alt="Etagen und Bereiche in Home Assistant einrichten" width="800" />
</p>

**Geräte zuweisen** — Weise deine Geräte (Lampen, Sensoren, Rollos etc.) in den HA-Einstellungen einem Bereich zu. Die Strategy erkennt automatisch, welche Entitäten in welchem Raum sind.

**Temperatur & Feuchtigkeit** — Die Bereichskarten auf der Übersicht zeigen Temperatur und Feuchtigkeit nur an, wenn du die Sensoren in den **Home Assistant Bereichseinstellungen** explizit zugewiesen hast (**Einstellungen → Bereiche → Bereich bearbeiten → Temperatur-Sensor / Feuchtigkeits-Sensor**). Diese Einstellung findest du in Home Assistant selbst, nicht im Strategy-Editor. Eine automatische Erkennung würde bei manchen Setups falsche Sensoren anzeigen (z.B. Drucker-Temperatur im Büro). HA's eigene Home Strategy macht es genauso. In den **Raum-Detail-Views** hingegen werden Sensoren automatisch als Badges erkannt — unerwünschte Badges können über das Label `no-dboard` oder den Strategy-Editor ausgeblendet werden.

**Unerwünschte Entitäten ausblenden** — Nicht jede Entität soll im Dashboard auftauchen. Es gibt drei Wege:

- **Entität nicht sichtbar schalten** (empfohlen) — Setze eine Entität in den HA-Einstellungen auf **"Nicht sichtbar"**. Diese Entitäten werden von allen auto-generierten Strategies ausgeblendet — nicht nur von dieser, sondern auch von HA's eigenen Strategies. Das ist der sauberste Weg, um Entitäten aus automatischen Dashboards zu entfernen.

<p align="center">
  <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/Entitaet-auf-nicht-sichtbar-stellen-via-entity-config.gif" alt="Entität auf nicht sichtbar stellen" width="800" />
</p>

- **Label `no-dboard`** — Erstelle in Home Assistant unter **Einstellungen → Labels** ein Label `no-dboard` und weise es Entitäten zu. Die Entität wird aus allen simon42-Strategy-Dashboards global ausgeblendet, bleibt aber in anderen (manuellen) Dashboards sichtbar.

<p align="center">
  <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/no-dboard-label.png" alt="Label no-dboard in Home Assistant erstellen" width="800" />
</p>

- **Im Strategy-Editor ausblenden** — Über das Konfigurationsmenü der Strategy können einzelne Entitäten pro Bereich und Domain individuell ein- und ausgeblendet werden. Das betrifft nur diese eine Strategy-Ansicht.

Mehr zur Filterung findest du im Abschnitt [Entity-Filterung](#entity-filterung).

## Dashboard erstellen

<p align="center">
  <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/simon42-Strategy-Download-DashboardAnlegen-StrategyCodeEinfugen.gif" alt="Dashboard erstellen — Schritt für Schritt" width="800" />
</p>

1. **Einstellungen** → **Dashboards** → **Dashboard hinzufügen**
2. **Neues Dashboard von Grund auf**, Name vergeben
3. Dashboard öffnen → **Edit-Modus** (oben rechts)
4. **Drei Punkte** (⋮) → **Raw-Konfigurationseditor**
5. Einfügen:

```yaml
strategy:
  type: custom:simon42-dashboard

```

6. Speichern (oben rechts)

Nun muss der Raw-Editor verlassen werden. Dafür gibt es zwei Wege:

- **Weg A:** Links in der Seitenleiste auf einen anderen Bereich klicken, danach wieder auf das neu angelegte Dashboard wechseln.
- **Weg B:** Im Editor, 1× auf das **X** oben links klicken → erneut auf das **X** oben links klicken → oben rechts auf **Fertig** klicken.
  > **Wichtig:** Dabei nichts an den Views verändern — einfach nur den Editor verlassen. Änderungen an Views würden die Strategy-Kontrolle aufheben.

Anschließend öffnet sich über das **Stift-Icon** oben rechts in dem Strategy-Dashboard der grafische Editor 🎉


## Konfiguration

Alle Einstellungen lassen sich bequem über den **grafischen Editor** vornehmen (Stift-Icon → Drei Punkte → Dashboard bearbeiten). Die folgenden Abschnitte dokumentieren die verfügbaren Optionen.

<p align="center">
  <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/Editor-oeffnen.gif" alt="Editor öffnen" width="800" />
</p>

### Übersicht

Die Hauptseite des Dashboards zeigt eine Übersicht mit folgenden Bereichen:

**Uhr & Alarm** — Die Uhr wird standardmäßig angezeigt. Optional kann eine Alarmanlage daneben eingeblendet werden.

**Zusammenfassungen** — Kacheln die den Status aller Lichter, Rollos, Sicherheits-Entitäten, Batterien und Klimageräte zusammenfassen. Jede Zusammenfassung kann einzeln ein- oder ausgeschaltet werden. Das Layout ist als 2-Spalten-Grid (Standard) oder 4-Spalten-Reihe konfigurierbar. Für Rollos kann optional eine **Teiloffen-Gruppe** aktiviert werden, die Rollos mit Position zwischen 1-99% separat anzeigt — inkl. Live-Übergängen während des Fahrens.

<p align="center">
  <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/Klima-Zusammenfassung.gif" alt="Klima-Zusammenfassung aktivieren" width="800" />
</p>

**Batterie-Optionen** — Mobile-App-Batterien (Smartphones, Tablets) können ausgeblendet werden. Die Schwellwerte für die Statusgruppen (Kritisch / Niedrig / Gut) sind frei einstellbar. Nicht erreichbare Sensoren werden automatisch als kritisch eingestuft.

<p align="center">
  <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/Batterie-Schwellwerte-und-MobileAppBatt.gif" alt="Batterie-Schwellwerte und Mobile-App-Batterien" width="800" />
</p>

**Info-Karten** — Optionale Wetter- und Energie-Karten auf der Übersicht.

**Favoriten** — Beliebige Entitäten, die als Kacheln unter den Zusammenfassungen erscheinen. Im Editor per Dropdown hinzufügen.

<p align="center">
  <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/Favoriten-entity-hinzufügen.gif" alt="Favoriten hinzufügen" width="800" />
</p>

### Bereiche & Räume

**Etagen-Gruppierung** — Bereiche können nach Etagen gegliedert werden. Jede Etage bekommt eine eigene Section mit Überschrift.

<p align="center">
  <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/Bereiche-nach-Etagen-Gliedern.gif" alt="Bereiche nach Etagen gliedern" width="800" />
</p>

**Alert-Icons** — Optional können Alert-Icons auf den Bereichskarten angezeigt werden. Wenn aktiviert, zeigen die Karten ein oranges Icon, sobald ein relevanter Binärsensor im Bereich aktiv ist (z.B. Bewegung, Feuchtigkeit, Rauch, Wärme).

<p align="center">
  <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/Alert-Icons-Area-Card-Aktivieren.gif" alt="Alert-Icons auf Bereichskarten aktivieren" width="800" />
</p>

**Schlösser in Räumen** — Optional können Schlösser (z.B. Nuki) in den Raum-Views angezeigt werden. Unabhängig davon erscheinen sie immer in der Sicherheits-Übersicht.

**Bereichssortierung** — Wahlweise die Reihenfolge aus Home Assistant verwenden oder im Editor per Drag & Drop festlegen.

<p align="center">
  <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/Home-Assistant-Bereichs-Sortierung-verwenden.gif" alt="HA-Bereichssortierung verwenden" width="800" />
</p>

**Bereichs-Verwaltung** — Bereiche ein-/ausblenden, Reihenfolge anpassen, Entitäten pro Bereich und Domain filtern — alles im Editor.

**Raum-Pins** — Spezielle Entitäten die in ihren zugeordneten Räumen ganz oben erscheinen. Ideal für Entitäten die nicht automatisch erkannt werden (z.B. Wetterstationen).

**Automationen & Skripte** — Optional können dem Bereich zugeordnete Automationen und Skripte in den Raum-Views angezeigt werden. Beide Optionen sind separat aktivierbar und standardmäßig aus.

**Fenster- & Türkontakte** — Optional können Fensterkontakte und Türkontakte als Badges in den Raum-Views angezeigt werden. Zwei getrennte Toggles im Editor, standardmäßig aus. Absolute Luftfeuchtigkeit (z.B. von der Thermal Comfort Integration, `g/m³`) wird automatisch als Badge erkannt.

**Ansichten** — Summary-Views (Lichter, Rollos, etc.) und Raum-Views können optional in der oberen Navigation angezeigt werden.

**Lichter nach Etagen** — In der Lichter-View können Lichter nach Etagen gruppiert werden, mit Ein-/Ausschalt-Button pro Etage.

<p align="center">
  <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/Lichter-nach-Etagen-Gliedern.gif" alt="Lichter nach Etagen gliedern" width="800" />
</p>

### Erweiterte Funktionen

#### Eigene Karten
Beliebige Lovelace-Karten via YAML zur Übersicht hinzufügen. Die Karten erscheinen in einer eigenen Section zwischen den Zusammenfassungen und den Bereichen. Überschrift und Icon der Section sind frei wählbar.

**Tipp:** Erstelle die Karte zuerst in einem normalen Dashboard, kopiere den YAML-Code und füge ihn im Editor ein.

```yaml
# Beispiel: Markdown-Karte
type: markdown
content: "Willkommen zuhause!"
```

<p align="center">
  <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/Eigene-Karten-hinzufugen.gif" alt="Eigene Karten hinzufügen" width="800" />
</p>

#### Eigene Badges

Beliebige Badges via YAML zum Header der Übersicht hinzufügen — sie erscheinen neben den Personen-Chips.

```yaml
# Beispiel: Sonnen-Badge
type: entity
show_name: false
show_state: true
show_icon: true
entity: sun.sun
```

<p align="center">
  <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/Custom-Badges-hinzufugen.gif" alt="Eigene Badges hinzufügen" width="800" />
</p>

#### Wetter & Energie anpassen

Die `weather`- und `energy`-Sections der Übersicht akzeptieren `custom_cards` über `target_section` (siehe Eigene Karten). Standardmäßig erscheinen die eingefügten Karten unterhalb der eingebauten `weather-forecast`- bzw. `energy-distribution`-Karte. Wer die Section komplett selbst gestalten möchte, kann die eingebaute Karte unterdrücken — die Section (Überschrift + Slot für eigene Karten) bleibt erhalten:

```yaml
strategy:
  type: custom:simon42-dashboard
  show_weather: true
  show_weather_forecast_card: false   # eingebaute weather-forecast-Karte ausblenden
  show_energy: true
  show_energy_distribution_card: false  # eingebaute energy-distribution-Karte ausblenden
  custom_cards:
    - target_section: weather
      parsed_config:
        type: custom:clock-weather-card
        entity: weather.openweathermap
```

Für eine kompakte Live-Anzeige eigener Außen-Sensoren (Temperatur, Luftfeuchte, Wind, …) gibt es `weather_sensors`. Die Einträge werden als Icon + Wert + Einheit oben in der Wetter-Section gerendert — ohne zusätzliche Card-Chrome. Ideal als Ergänzung zur Forecast-Karte oder als alleinige Anzeige bei `show_weather_forecast_card: false`.

```yaml
strategy:
  type: custom:simon42-dashboard
  weather_sensors:
    - entity: sensor.outdoor_temperature
      icon: mdi:thermometer
      unit: "°C"
      round: 1
    - entity: sensor.outdoor_humidity
      icon: mdi:water-percent
      unit: "%"
    - entity: sensor.wind_speed
      icon: mdi:weather-windy
      unit: "km/h"
      round: 1
```

Pro Eintrag:
- `entity` — Sensor-Entity-ID (Pflicht; Format `domain.object_id`)
- `icon` — MDI-Icon (Standard: `mdi:gauge`)
- `unit` — angehängte Einheit als Text (z.B. `°C`, `km/h`)
- `round` — Anzahl Nachkommastellen für numerische Werte; weglassen für rohen Zustand

#### Custom Views

Eigene Dashboard-Views mit beliebigen Cards erstellen. Jede Custom View benötigt einen Titel, Pfad und Icon. Der YAML-Code definiert den Inhalt der View.

```yaml
# Beispiel: View mit Sections-Layout
type: sections
sections:
  - type: grid
    cards:
      - type: markdown
        content: "Meine eigene View"
```

<p align="center">
  <img src="https://raw.githubusercontent.com/TheRealSimon42/simon42-dashboard-strategy/main/assets/Custom-View-hinzufugen.gif" alt="Custom View hinzufügen" width="800" />
</p>

### Entity-Filterung

Entitäten können auf mehreren Ebenen gefiltert werden:

| Methode | Ebene | Beschreibung |
|---------|-------|-------------|
| Nicht sichtbar schalten | Global | Entität wird aus allen auto-generierten Strategies ausgeblendet |
| Label `no-dboard` | Global | Entität wird nur aus simon42-Strategy-Dashboards ausgeblendet |
| `groups_options.hidden` | Pro Bereich | Entität nur in bestimmtem Bereich ausblenden |
| Entity Registry | Automatisch | Hidden/Disabled Entities werden ignoriert |
| Entity Category | Automatisch | Config/Diagnostic Entities werden ignoriert |

### Alle Optionen (Referenz)

<details>
<summary>Vollständige Konfigurationsreferenz aufklappen</summary>

| Option | Typ | Standard | Beschreibung |
|--------|-----|----------|-------------|
| `show_clock_card` | boolean | `true` | Uhr auf der Übersicht |
| `alarm_entity` | string | — | Alarm-Panel Entity neben der Uhr |
| `show_search_card` | boolean | `false` | Such-Karte (benötigt custom:search-card) |
| `show_light_summary` | boolean | `true` | Lichter-Zusammenfassung |
| `show_covers_summary` | boolean | `true` | Rollo-Zusammenfassung |
| `show_security_summary` | boolean | `true` | Sicherheits-Zusammenfassung |
| `show_climate_summary` | boolean | `false` | Klima-Zusammenfassung |
| `show_battery_summary` | boolean | `true` | Batterie-Zusammenfassung |
| `summaries_columns` | 2 \| 4 | `2` | Spalten-Layout der Zusammenfassungen |
| `hide_mobile_app_batteries` | boolean | `false` | Mobile-App-Batterien ausblenden |
| `battery_critical_threshold` | number | `20` | Schwellwert für kritische Batterien (%) |
| `battery_low_threshold` | number | `50` | Schwellwert für niedrige Batterien (%) |
| `show_weather` | boolean | `true` | Wetter-Section |
| `show_weather_forecast_card` | boolean | `true` | Eingebaute `weather-forecast`-Karte. Auf `false` für komplett eigene Wetter-Section |
| `weather_sensors` | object[] | `[]` | Inline Icon+Wert-Zeile oben in der Wetter-Section (siehe oben) |
| `show_energy` | boolean | `true` | Energie-Section |
| `show_energy_distribution_card` | boolean | `true` | Eingebaute `energy-distribution`-Karte. Auf `false` für komplett eigene Energie-Section |
| `favorite_entities` | string[] | `[]` | Favoriten-Entitäten auf der Übersicht |
| `group_by_floors` | boolean | `false` | Bereiche nach Etagen gliedern |
| `show_partially_open_covers` | boolean | `false` | Teiloffene Rollos separat anzeigen |
| `show_alerts_on_areas` | boolean | `false` | Alert-Icons auf Bereichskarten |
| `show_locks_in_rooms` | boolean | `false` | Schlösser in Raum-Views |
| `show_automations_in_rooms` | boolean | `false` | Automationen in Raum-Views |
| `show_scripts_in_rooms` | boolean | `false` | Skripte in Raum-Views |
| `show_window_contacts_in_rooms` | boolean | `false` | Fensterkontakte als Badges in Raum-Views |
| `show_door_contacts_in_rooms` | boolean | `false` | Türkontakte als Badges in Raum-Views |
| `use_default_area_sort` | boolean | `false` | HA-Sortierung für Bereiche verwenden |
| `areas_display.hidden` | string[] | `[]` | Ausgeblendete Bereiche |
| `areas_display.order` | string[] | `[]` | Reihenfolge der Bereiche |
| `areas_options` | object | `{}` | Entity-Filterung pro Bereich |
| `room_pin_entities` | string[] | `[]` | Raum-Pin Entitäten |
| `show_summary_views` | boolean | `false` | Summary-Views in Navigation |
| `show_room_views` | boolean | `false` | Raum-Views in Navigation |
| `group_lights_by_floors` | boolean | `false` | Lichter nach Etagen gruppieren |
| `custom_cards` | object[] | `[]` | Eigene Karten via YAML |
| `custom_cards_heading` | string | `"Eigene Karten"` | Überschrift der Custom Cards Section |
| `custom_cards_icon` | string | `"mdi:cards"` | Icon der Custom Cards Section |
| `custom_badges` | object[] | `[]` | Eigene Badges im Header via YAML |
| `custom_views` | object[] | `[]` | Eigene Views via YAML |

</details>

## Fehlerbehebung

| Problem | Lösung |
|---------|---------|
| Dashboard zeigt alte Version | **Hard-Refresh:** `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows) |
| Änderungen werden nicht übernommen | In einem **Incognito-/Privat-Fenster** testen — wenn das Problem dort nicht auftritt, ist es ein Browser-Cache-Problem |
| Welche Version ist installiert? | Browser-Konsole öffnen (F12) → Meldung `Simon42 Dashboard Strategy vX.Y.Z loaded` suchen |
| Strategy-Timeout auf langsamen Verbindungen | Normal bei Slow 4G — HA hat ein festes 5-Sekunden-Limit für Custom Elements. Bei normalen Verbindungen kein Problem |

<details>
<summary>Migration von manueller Installation zu HACS</summary>

Wenn du die Strategy vorher **manuell installiert** hattest (ohne HACS) und jetzt auf HACS umsteigen willst, kann es zu einem Fehler kommen:

> `Error: Failed to execute 'define' on 'CustomElementRegistry': the name "simon42-summary-card" has already been used`

Das passiert, wenn die alte Resource-URL noch registriert ist und die JS-Datei dadurch doppelt geladen wird. So behebst du das:

1. Manuell kopierte Dateien im Ordner `www` löschen (alles inklusive des Ordners `simon42-strategy` kann weg)
2. Alte Resource entfernen: **Einstellungen → Dashboards → Drei Punkte (⋮) → Ressourcen** — die alte URL (ohne `hacsfiles` im Pfad) löschen
3. Home Assistant neu starten
4. HACS-Repo über den Button oben hinzufügen und installieren
5. Home Assistant neu starten
6. Browser-Cache leeren (`Cmd+Shift+R` / `Ctrl+Shift+R`)

</details>

## Sprache / Language

Die Strategy erkennt automatisch die Sprache aus deinen Home Assistant Einstellungen (**Einstellungen → Allgemein → Sprache**). Aktuell unterstützt:

| Sprache | Status |
|---------|--------|
| 🇩🇪 Deutsch | Vollständig |
| 🇬🇧 English | Vollständig |

**Weitere Sprachen hinzufügen:** Erstelle eine neue Datei `src/translations/<code>.json` (z.B. `fr.json`) nach dem Muster der bestehenden Dateien und öffne einen Pull Request. Der Aufwand ist gering — es müssen nur die Strings übersetzt werden, kein Code.

## Contributing

Issues und Pull Requests sind willkommen! Bitte teste PRs gründlich in einem lokalen HA-Setup.

<details>
<summary>Architektur</summary>

### Code-Split Bundles

**TypeScript** (ES2020, strict) → **Webpack** → Code-Split Chunks:

| Chunk | Größe | Inhalt |
|-------|-------|--------|
| main | ~6 KB | Entry Point, Custom Element Registrierung |
| lit | ~15 KB | Lit Framework (shared) |
| core | ~51 KB | Registry, Utils, Translations, Overview, Custom Cards |
| views | ~19 KB | Lichter, Rollos, Sicherheit, Batterien, Klima, Raum-Detail |
| editor | ~110 KB | Konfigurations-UI (nur bei Bedarf geladen) |

### Performance-Design

Die Strategy folgt denselben Patterns wie HA's offizielle Home- und Areas-Strategien:

- **Pre-filtered Area-Controls:** Area-Cards bekommen nur Controls die im Raum tatsächlich existieren, nicht pauschal alle.
- **Pre-resolved Views:** Alle Views werden in `generate()` vollständig aufgelöst statt als Strategy-Stubs zurückgegeben.
- **Eager Chunk Loading:** JS-Chunks werden sofort beim Laden des Entry-Points gestartet, nicht erst wenn `generate()` aufgerufen wird.
- **Reaktive Custom Cards:** LitElement mit `willUpdate()` — nur relevante State-Änderungen lösen Re-Renders aus.
- **Tile-Card-Pooling:** DOM-Elemente werden wiederverwendet statt neu erstellt.

</details>

## Lizenz

**Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**

- **Teilen & Bearbeiten** erlaubt
- **Namensnennung** erforderlich
- **Nicht kommerziell** — Für kommerzielle Nutzung: **[Kontaktformular](https://www.simon42.com/contact/)**
- **Weitergabe unter gleichen Bedingungen**

Siehe LICENSE-Datei für vollständige Details.

## Credits

- Home Assistant Community
- [js-yaml](https://github.com/nodeca/js-yaml) (MIT) — YAML-Parser
- **Claude** (Anthropic) — Co-Entwickler und Nachtschicht-Begleiter

## Support

- **[GitHub Issues](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues)**
- **[simon42 Community](https://community.simon42.com/)**

---

**Entwickelt mit Leidenschaft für die Home Assistant Community**
