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
- **Abschnitts-Reihenfolge** — Sections der Übersicht per Drag & Drop sortieren *(ab v1.3.5)*
- **Zusätzliche Sections** — Pflanzen, Agenda, To-dos, Personen, Staubsauger, Wartung — alle opt-in, mit Auto-Hide *(ab v1.4.0)*
- **Bedingte Sichtbarkeit** — Sections und Raum-Views nur bei bestimmtem Entity-Zustand anzeigen (z.B. Agenda nur an Werktagen) *(ab v1.4.0)*
- **Header-Badges** — Optionale Live-Badges: Stromverbrauch, nicht verfügbare Entitäten, Now Playing, Sonnenstand, anstehende Updates *(ab v1.4.0)*
- **Etagen-Gruppierung** — Bereiche, Lichter und Rollos optional nach Etagen gliedern
- **Favoriten** — Beliebige Entitäten als Kacheln auf der Übersicht anpinnen
- **Alarm-Panel** — Optionale Alarmanlage neben der Uhr
- **Granulare Filterung** — Per Label (`no-dboard`), pro Bereich, pro Domain, pro Entity
- **Teiloffene Rollos** — Optionale dritte Gruppe (Offen / Teiloffen / Geschlossen) mit Live-Übergängen
- **Alert-Icons** — Optionale Alert-Badges auf Bereichskarten (Bewegung, Feuchtigkeit, Rauch, Wärme u.a.)
- **Rauch-, Gas- & Hitzemelder** — In der Sicherheits-Übersicht, im Security-Summary-Count und als Badges in Raum-Views
- **Wetter flexibel** — Wetter-Entität wählbar, Darstellung umschaltbar (Forecast täglich/stündlich, Tile, eigene Karte), eigene Außensensoren als Inline-Zeile *(ab v1.4.0)*
- **Batch-Aktionen** — Heading-Badges für Gruppensteuerung (alle ein/aus, alle öffnen/schließen)
- **Automationen & Skripte in Räumen** — Bereichs-zugeordnete Automationen und Skripte in Raum-Views anzeigen
- **Eigene Karten** — Beliebige Karten via YAML auf der Übersicht einbinden, Ziel-Section frei wählbar
- **Eigene Sections** — Komplette eigene Section-Blöcke auf der Übersicht deklarieren, frei positionierbar *(ab v1.4.0)*
- **Eigene Badges** — Beliebige Badges via YAML im Header (neben Personen-Chips)
- **Custom Views** — Eigene Dashboard-Views mit beliebigen Cards via YAML
- **Reaktive Updates** — Echtzeit-Aktualisierung via LitElement Custom Cards
- **Mehrsprachig** — Deutsch, Englisch und Russisch, automatische Erkennung aus HA-Einstellungen, Fallback auf Englisch
- **Performance-optimiert** — Code-Split Bundles, Registry-Caching, Tile-Card-Pooling

> **Versions-Hinweis:** Features ohne Vermerk sind seit v1.3.x oder länger enthalten. Neuere Features tragen ein *(ab vX.Y)* — die vollständige Zuordnung aller Optionen steht in der [Konfigurationsreferenz](#alle-optionen-referenz).

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

**Abschnitts-Reihenfolge** *(ab v1.3.5)* — Alle Sections der Übersicht lassen sich im Editor per Drag & Drop sortieren. Abschaltbare Sections haben direkt im Panel einen Ein/Aus-Toggle. Leere Sections werden automatisch ausgeblendet.

**Zusätzliche Sections** *(ab v1.4.0)* — Sechs optionale Sections für die Übersicht, alle standardmäßig aus und mit Auto-Hide (erscheinen nur, wenn passende Entitäten existieren):

| Section | Inhalt |
|---------|--------|
| Pflanzen | Alle `plant.*`-Entitäten als Kacheln |
| Agenda | Anstehende Kalender-Termine (Kalender wählbar) |
| To-dos | Einträge aus `todo.*`-Listen (Listen wählbar) |
| Personen | Personen-Karten mit Anwesenheit |
| Staubsauger | Saugroboter & Mähroboter mit Status |
| Wartung | Anstehende Updates & niedrige Batterien auf einen Blick |

**Bedingte Sichtbarkeit** *(ab v1.4.0)* — Jede Section (und jede Raum-View) kann an einen Entity-Zustand geknüpft werden. Beispiel: Agenda nur an Werktagen anzeigen:

```yaml
strategy:
  type: custom:simon42-dashboard
  section_visibility:
    agenda:
      entity: binary_sensor.workday_sensor
      state: "on"
```

**Header-Badges** *(ab v1.4.0)* — Optionale Live-Badges neben den Personen-Chips: aktueller Stromverbrauch (Sensor wählbar), Anzahl nicht verfügbarer Entitäten, gerade spielende Medien, Sonnenauf-/-untergang und anstehende Updates. Alle standardmäßig aus, alle mit Auto-Hide. Die Personen-Chips selbst sind konfigurierbar (Layout mit/ohne Status und Zeitangabe) oder komplett abschaltbar — z.B. um sie durch eigene Badges zu ersetzen.

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

**Eigene Sections in Räumen** *(ab v1.4.0)* — Analog zu den eigenen Sections auf der Übersicht lassen sich auch in jeder Raum-Ansicht eigene Section-Blöcke einfügen: im Editor beim jeweiligen Bereich („Eigene Sections in diesem Raum"), mit Überschrift, Icon, YAML-Karten und wählbarer Position — **oberhalb** oder **unterhalb** der automatisch erzeugten Sections. Damit lassen sich z.B. spezielle Karten aus HACS (Versatile Thermostat, Saugroboter-Karten, …) direkt im Raum unterbringen. Tipp: Wer die Standard-Kachel einer Entität ersetzen will, blendet sie in der Domain-Gruppe des Raums aus und fügt die eigene Karte als Section hinzu.

**Automationen & Skripte** — Optional können dem Bereich zugeordnete Automationen und Skripte in den Raum-Views angezeigt werden. Beide Optionen sind separat aktivierbar und standardmäßig aus.

**Fenster- & Türkontakte** — Fensterkontakte und Türkontakte erscheinen als Badges in den Raum-Views (standardmäßig an, per zwei getrennten Toggles im Editor abschaltbar). Absolute Luftfeuchtigkeit (z.B. von der Thermal Comfort Integration, `g/m³`) wird automatisch als Badge erkannt.

**Kameras in Räumen** *(ab v1.4.0)* — Kamera-Streams in den Raum-Views sind standardmäßig an und können per Toggle deaktiviert werden.

**Raum-Sichtbarkeit** *(ab v1.4.0)* — Einzelne Raum-Views (inkl. Navigations-Tab) können an einen Entity-Zustand geknüpft werden (`room_visibility`) — z.B. Gästezimmer nur bei aktiviertem Gäste-Modus. Die Bereichskarte auf der Übersicht bleibt davon unberührt.

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

#### Eigene Sections *(ab v1.4.0)*

Komplette eigene Section-Blöcke auf der Übersicht — die Lücke zwischen „Karte in bestehende Section einfügen" (Eigene Karten) und „ganze View anlegen" (Custom Views). Jede eigene Section hat einen Key, eine Überschrift, optional ein Icon und eine YAML-Liste von Karten:

```yaml
strategy:
  type: custom:simon42-dashboard
  custom_sections:
    - key: my_morgenroutine
      heading: "Guten Morgen"
      icon: mdi:weather-sunrise
      # Karten als YAML im Editor eintragen; einzelne Karte oder Liste
```

Der `key` verhält sich wie eine eingebaute Section:

- **Positionierbar** — erscheint im Abschnitts-Reihenfolge-Panel (Drag & Drop) bzw. in `sections_order`
- **Ziel für eigene Karten** — als `target_section` wählbar (Dropdown im Editor)
- **Bedingte Sichtbarkeit** — funktioniert in `section_visibility` (z.B. Routine-Section nur an Werktagen)
- **Auto-Hide** — ohne Karten wird die Section nicht gerendert

**Key-Regeln:** Keys, die mit eingebauten Sections kollidieren (`overview`, `areas`, `weather`, …), werden verworfen; bei doppelten Keys gewinnt der erste Eintrag. Empfehlung: ein persönliches Präfix wie `my_` verwenden — sollte eine spätere Version eine gleichnamige eingebaute Section einführen, behält deine eigene Section Vorrang (Config-Stabilität geht vor neuem Feature).

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

#### Wetter & Energie anpassen *(ab v1.4.0)*

**Wetter-Entität & Darstellung** — Im Editor (unterhalb der Wetter-Section im Reihenfolge-Panel) lässt sich die Wetter-Entität explizit auswählen (Standard: automatische Erkennung) und die Darstellung umschalten: Forecast täglich (Standard), stündlich, zweimal täglich, kompakte Tile-Karte oder „keine eingebaute Karte" für komplett eigene Gestaltung.

Die `weather`- und `energy`-Sections der Übersicht akzeptieren `custom_cards` über `target_section` (siehe Eigene Karten). Standardmäßig erscheinen die eingefügten Karten unterhalb der eingebauten Karte. Wer die Section komplett selbst gestalten möchte, unterdrückt die eingebaute Karte — die Section (Überschrift + Slot für eigene Karten) bleibt erhalten. So lässt sich z.B. die Energie-Karte durch eine eigene ersetzen (power-flow-card-plus & Co.):

```yaml
strategy:
  type: custom:simon42-dashboard
  weather_presentation: none            # keine eingebaute Wetter-Karte
  show_energy_distribution_card: false  # eingebaute energy-distribution-Karte ausblenden
  custom_cards:
    - target_section: weather
      parsed_config:
        type: custom:clock-weather-card
        entity: weather.openweathermap
    - target_section: energy
      parsed_config:
        type: custom:power-flow-card-plus
        # ... deine Energiekarten-Konfiguration
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

Die Spalte **Seit** gibt an, ab welcher Version die Option verfügbar ist. „—" bedeutet: seit v1.3.x oder länger.

<details>
<summary>Vollständige Konfigurationsreferenz aufklappen</summary>

**Übersicht & Zusammenfassungen**

| Option | Typ | Standard | Seit | Beschreibung |
|--------|-----|----------|------|-------------|
| `show_clock_card` | boolean | `true` | — | Uhr auf der Übersicht |
| `alarm_entity` | string | — | — | Alarm-Panel Entity neben der Uhr |
| `show_search_card` | boolean | `false` | — | Such-Karte auf der Übersicht |
| `search_card_variant` | `custom` \| `tip` | `custom` | v1.4.0 | `custom` benötigt custom:search-card aus HACS; `tip` ist ein HA-nativer Hinweis auf die globale Suche |
| `show_light_summary` | boolean | `true` | — | Lichter-Zusammenfassung |
| `show_covers_summary` | boolean | `true` | — | Rollo-Zusammenfassung |
| `show_partially_open_covers` | boolean | `false` | — | Teiloffene Rollos separat anzeigen |
| `show_security_summary` | boolean | `true` | — | Sicherheits-Zusammenfassung |
| `show_climate_summary` | boolean | `false` | — | Klima-Zusammenfassung |
| `show_battery_summary` | boolean | `true` | — | Batterie-Zusammenfassung |
| `summaries_columns` | 2 \| 4 | `2` | — | Spalten-Layout der Zusammenfassungen |
| `favorite_entities` | string[] | `[]` | — | Favoriten-Entitäten auf der Übersicht |
| `favorites_show_state` | boolean | `false` | — | Zustand auf Favoriten-Kacheln anzeigen |
| `favorites_hide_last_changed` | boolean | `false` | — | „Zuletzt geändert" auf Favoriten ausblenden |
| `light_favorite_entities` | string[] | `[]` | v1.4.0 | Schnellzugriffs-Reihe für Lieblingslampen auf der Übersicht |

**Sections & Reihenfolge**

| Option | Typ | Standard | Seit | Beschreibung |
|--------|-----|----------|------|-------------|
| `sections_order` | string[] | Standard-Reihenfolge | v1.3.5 | Reihenfolge der Übersichts-Sections (im Editor per Drag & Drop) |
| `hidden_section_headings` | string[] | `[]` | v1.4.0 | Überschriften einzelner Sections ausblenden |
| `section_visibility` | object | `{}` | v1.4.0 | Sections nur bei bestimmtem Entity-Zustand anzeigen (siehe oben) |
| `show_weather` | boolean | `true` | — | Wetter-Section |
| `weather_entity` | string | auto | v1.4.0 | Explizite Wetter-Entität (Standard: automatische Erkennung) |
| `weather_presentation` | string | `forecast_daily` | v1.4.0 | Darstellung: `forecast_daily`, `forecast_hourly`, `forecast_twice_daily`, `tile`, `none` |
| `show_weather_forecast_card` | boolean | `true` | v1.4.0 | Legacy — durch `weather_presentation` abgelöst, wird weiter berücksichtigt |
| `weather_sensors` | object[] | `[]` | v1.4.0 | Inline Icon+Wert-Zeile oben in der Wetter-Section (siehe oben) |
| `show_energy` | boolean | `true` | — | Energie-Section |
| `show_energy_distribution_card` | boolean | `true` | v1.4.0 | Eingebaute `energy-distribution`-Karte. Auf `false` für komplett eigene Energie-Section |
| `energy_link_dashboard` | boolean | `true` | v1.3.5 | Energie-Karte verlinkt auf das HA-Energie-Dashboard |
| `show_plants_section` | boolean | `false` | v1.4.0 | Pflanzen-Section (Auto-Hide ohne `plant.*`-Entitäten) |
| `show_agenda_section` | boolean | `false` | v1.4.0 | Agenda-Section mit Kalender-Terminen |
| `agenda_calendar_entities` | string[] | alle | v1.4.0 | Kalender für die Agenda einschränken |
| `show_todos_section` | boolean | `false` | v1.4.0 | To-do-Section |
| `todos_entities` | string[] | alle | v1.4.0 | To-do-Listen einschränken |
| `show_persons_section` | boolean | `false` | v1.4.0 | Personen-Section |
| `show_vacuums_section` | boolean | `false` | v1.4.0 | Staubsauger-/Mähroboter-Section |
| `show_maintenance_section` | boolean | `false` | v1.4.0 | Wartungs-Section (Updates + niedrige Batterien) |

**Header-Badges**

| Option | Typ | Standard | Seit | Beschreibung |
|--------|-----|----------|------|-------------|
| `show_person_badges` | boolean | `true` | v1.4.0 | Personen-Chips im Header (auf `false` z.B. für eigene Badges) |
| `person_badge_layout` | string | `with_state` | v1.4.0 | `minimal`, `with_state` oder `with_state_and_time` |
| `power_badge_entity` | string | — | v1.4.0 | Live-Badge mit aktuellem Stromverbrauch (Sensor wählbar) |
| `show_unavailable_alert_badge` | boolean | `false` | v1.4.0 | Badge mit Anzahl nicht verfügbarer Entitäten (Auto-Hide bei 0) |
| `show_now_playing_badge` | boolean | `false` | v1.4.0 | Badge für gerade spielende Medien (Auto-Hide) |
| `show_sun_badge` | boolean | `false` | v1.4.0 | Sonnenauf-/-untergangs-Badge (benötigt `sun.sun`) |
| `show_updates_badge` | boolean | `false` | v1.4.0 | Badge mit Anzahl anstehender Updates (Auto-Hide bei 0) |
| `custom_badges` | object[] | `[]` | — | Eigene Badges im Header via YAML |

**Batterien**

| Option | Typ | Standard | Seit | Beschreibung |
|--------|-----|----------|------|-------------|
| `hide_mobile_app_batteries` | boolean | `false` | — | Mobile-App-Batterien ausblenden |
| `hide_battery_notes_entities` | boolean | `false` | v1.4.0 | Hilfs-Entitäten der Battery-Notes-Integration ausblenden |
| `battery_critical_threshold` | number | `20` | — | Schwellwert für kritische Batterien (%) |
| `battery_low_threshold` | number | `50` | — | Schwellwert für niedrige Batterien (%) |
| `show_area_in_battery_view` | boolean | `false` | v1.4.0 | Bereichsnamen in der Batterie-View anzeigen |
| `unavailable_batteries_bucket` | `critical` \| `good` | `good` | v1.4.0 | Einordnung nicht erreichbarer Batterie-Sensoren |

**Bereiche & Räume**

| Option | Typ | Standard | Seit | Beschreibung |
|--------|-----|----------|------|-------------|
| `group_by_floors` | boolean | `false` | — | Bereiche nach Etagen gliedern |
| `show_alerts_on_areas` | boolean | `false` | — | Alert-Icons auf Bereichskarten |
| `show_window_alerts_on_areas` | boolean | `false` | v1.4.0 | Offene Fenster als Alert-Icon auf Bereichskarten |
| `show_switches_on_areas` | boolean | `false` | — | Schalter-Control auf Bereichskarten |
| `use_default_area_sort` | boolean | `false` | — | HA-Sortierung für Bereiche verwenden |
| `areas_display.hidden` | string[] | `[]` | — | Ausgeblendete Bereiche |
| `areas_display.order` | string[] | `[]` | — | Reihenfolge der Bereiche |
| `areas_options` | object | `{}` | — | Entity-Filterung pro Bereich |
| `areas_options.{id}.custom_sections` | object[] | `[]` | v1.4.0 | Eigene Section-Blöcke in der Raum-Ansicht (`position: top\|bottom`, siehe oben) |
| `room_pin_entities` | string[] | `[]` | — | Raum-Pin Entitäten |
| `room_pins_first` | boolean | `false` | v1.3.5 | Raum-Pins ganz oben statt unten im Raum anzeigen |
| `room_pins_show_state` | boolean | `false` | — | Zustand auf Raum-Pin-Kacheln anzeigen |
| `room_pins_hide_last_changed` | boolean | `false` | — | „Zuletzt geändert" auf Raum-Pins ausblenden |
| `show_locks_in_rooms` | boolean | `false` | — | Schlösser in Raum-Views |
| `show_automations_in_rooms` | boolean | `false` | — | Automationen in Raum-Views |
| `show_scripts_in_rooms` | boolean | `false` | — | Skripte in Raum-Views |
| `show_cameras_in_rooms` | boolean | `true` | v1.4.0 | Kamera-Streams in Raum-Views |
| `show_window_contacts_in_rooms` | boolean | `true` | v1.3.5 | Fensterkontakte als Badges in Raum-Views |
| `show_door_contacts_in_rooms` | boolean | `true` | v1.3.5 | Türkontakte als Badges in Raum-Views |
| `hide_unavailable_in_rooms` | boolean | `true` | v1.4.0 | Nicht verfügbare Entitäten in Raum-Views ausblenden |
| `room_visibility` | object | `{}` | v1.4.0 | Raum-Views nur bei bestimmtem Entity-Zustand anzeigen |
| `security_extra_entities` | string[] | `[]` | v1.4.0 | Zusätzliche Entitäten für die Sicherheits-View (z.B. Backofen) |

**Views & Navigation**

| Option | Typ | Standard | Seit | Beschreibung |
|--------|-----|----------|------|-------------|
| `show_summary_views` | boolean | `false` | — | Summary-Views in Navigation |
| `show_room_views` | boolean | `false` | — | Raum-Views in Navigation |
| `group_lights_by_floors` | boolean | `false` | — | Lichter nach Etagen gruppieren |
| `nested_light_groups` | boolean | `false` | v1.3.5 | Verschachtelte Lichtgruppen aufklappbar rendern |
| `group_covers_by_floors` | boolean | `false` | v1.4.0 | Rollos nach Etagen gruppieren |

**Eigene Inhalte**

| Option | Typ | Standard | Seit | Beschreibung |
|--------|-----|----------|------|-------------|
| `custom_cards` | object[] | `[]` | — | Eigene Karten via YAML; `target_section` wählt die Ziel-Section (Dropdown im Editor ab v1.4.0) |
| `custom_cards_heading` | string | `"Eigene Karten"` | — | Überschrift der Custom Cards Section |
| `custom_cards_icon` | string | `"mdi:cards"` | — | Icon der Custom Cards Section |
| `custom_sections` | object[] | `[]` | v1.4.0 | Eigene Section-Blöcke auf der Übersicht (Key, Überschrift, Icon, Karten — siehe oben) |
| `custom_views` | object[] | `[]` | — | Eigene Views via YAML |

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
| 🇷🇺 Русский | Vollständig *(ab v1.3.5)* |

**Weitere Sprachen hinzufügen:** Erstelle eine neue Datei `src/translations/<code>.json` (z.B. `fr.json`) nach dem Muster der bestehenden Dateien und öffne einen Pull Request. Der Aufwand ist gering — es müssen nur die Strings übersetzt werden, kein Code.

## Contributing

Issues und Pull Requests sind willkommen! Bitte teste PRs gründlich in einem lokalen HA-Setup.

**Neue Übersichts-Section beisteuern?** Seit v1.4.0 sind die Sections registry-getrieben: Builder-Datei in `src/sections/` anlegen, einen Eintrag in `src/sections/section-registry.ts` ergänzen, den Builder in `views/OverviewViewStrategy.ts` verdrahten, Übersetzungen ergänzen — Editor-Panel, Toggle, Dropdown und Sortierung kommen automatisch. Das vollständige Rezept steht in der [CLAUDE.md](CLAUDE.md#adding-a-new-overview-section).

<details>
<summary>Architektur</summary>

### Code-Split Bundles

**TypeScript** (ES2020, strict) → **Webpack** → Code-Split Chunks:

| Chunk | Größe | Inhalt |
|-------|-------|--------|
| main | ~6 KB | Entry Point, Custom Element Registrierung |
| lit | ~16 KB | Lit Framework (shared) |
| core | ~125 KB | Registry, Utils, Translations, Overview, Custom Cards |
| views | ~24 KB | Lichter, Rollos, Sicherheit, Batterien, Klima, Raum-Detail |
| editor | ~145 KB | Konfigurations-UI (nur bei Bedarf geladen) |

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
