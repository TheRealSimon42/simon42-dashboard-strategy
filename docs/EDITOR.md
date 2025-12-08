# Grafischer Konfigurator (Editor)

Der Editor ist das Herzstück der simon42 Dashboard Strategy - **keine YAML-Kenntnisse erforderlich!** Alle Konfigurationen können über die intuitive grafische Oberfläche vorgenommen werden.

## Inhaltsverzeichnis

- [Editor öffnen](#editor-öffnen)
- [Editor-Struktur](#editor-struktur)
- [Bereiche verwalten](#bereiche-verwalten)
- [Domain-Gruppen](#domain-gruppen)
- [Einzelne Entities](#einzelne-entities)
- [Editor-Features](#editor-features)
- [Navigation im Editor](#navigation-im-editor)

## Editor öffnen

1. Gehe zu **Einstellungen** → **Dashboards**
2. Öffne dein Dashboard
3. Aktiviere den **Edit-Modus** oben rechts
4. Klicke auf die **drei Punkte** (⋮) → **Raw-Konfigurationseditor**
5. Füge die folgende Konfiguration ein:

```yaml
strategy:
  type: custom:simon42-dashboard
```

6. Speichere und schließe - der **grafische Editor öffnet sich automatisch**! 🎉

## Editor-Struktur

Der Editor bietet eine intuitive dreistufige Hierarchie zur Konfiguration:

### Stufe 1: Bereiche verwalten

```
☰ Drag-Handle        Ziehe Bereiche, um die Reihenfolge zu ändern
☑️ Area-Checkbox      Bereich ein-/ausblenden
▶ Expand-Button       Klappt Domain-Gruppen auf
📊 Entity-Counter     Anzahl der Entities im Bereich
```

**Beispiel:**
```
☰ ☑️ ▶ Wohnzimmer (12)
☰ ☑️ ▶ Küche (8)
☰ ☐ ▶ Garage (5)      ← ausgeblendet
```

### Stufe 2: Domain-Gruppen

Nach dem Aufklappen eines Bereichs siehst du die Entity-Domains:

```
☑️ Gruppen-Checkbox   Alle Entities dieser Domain ein-/ausblenden
⊟ Indeterminate       Bei teilweise ausgewählten Entities
🔧 Domain-Icon        Visuelles Symbol für die Domain
📊 Entity-Count       Anzahl der Entities in dieser Domain
▶ Expand-Button       Klappt Entity-Liste auf
```

**Beispiel:**
```
▼ Wohnzimmer
   ☑️ 💡 Beleuchtung (5)
   ⊟ 🌡️ Klima (2)      ← teilweise ausgewählt
   ☑️ 🪟 Rollos (3)
```

### Stufe 3: Einzelne Entities

In der aufgeklappten Entity-Liste:

```
☑️ Entity-Checkbox    Entity ein-/ausblenden
📝 Friendly-Name      Lesbarer Entity-Name
🔤 Entity-ID          Technische ID (monospace)
```

**Beispiel:**
```
▼ 💡 Beleuchtung (5)
   ☑️ Deckenlampe        (light.wohnzimmer_decke)
   ☑️ Stehlampe          (light.wohnzimmer_stehlampe)
   ☐ Alte Lampe          (light.wohnzimmer_alt) ← ausgeblendet
```

## Bereiche verwalten

### Bereich ein-/ausblenden

- Klicke auf das **Auge-Icon** neben dem Bereichsnamen
- Ausgeblendete Bereiche werden nicht im Dashboard angezeigt
- Ausgeblendete Bereiche können nicht aufgeklappt werden

### Bereichs-Reihenfolge ändern

- Ziehe den Bereich am **Drag-Handle** (☰) nach oben oder unten
- Die Reihenfolge wird automatisch gespeichert
- Die neue Reihenfolge wird sofort im Dashboard übernommen

### Bereich aufklappen

- Klicke auf den **Expand-Button** (▶) um Domain-Gruppen anzuzeigen
- Aufgeklappte Bereiche bleiben während der Konfiguration offen (persistenter State)

## Domain-Gruppen

### Domain ein-/ausblenden

- Klicke auf die **Checkbox** neben dem Domain-Namen
- Alle Entities dieser Domain werden ein-/ausgeblendet
- Bei teilweise ausgewählten Entities zeigt die Checkbox einen **Indeterminate**-Status (⊟)

### Domain aufklappen

- Klicke auf den **Expand-Button** (▶) um die Entity-Liste anzuzeigen
- Entities werden erst beim Aufklappen geladen (Lazy Loading)

## Einzelne Entities

### Entity ein-/ausblenden

- Klicke auf die **Checkbox** neben dem Entity-Namen
- Die Entity wird nur in diesem Bereich ausgeblendet
- Die Entity kann weiterhin in anderen Views (z.B. Lichter-Übersicht) angezeigt werden

### Entity-Informationen

- **Friendly-Name**: Lesbarer Name der Entity (aus Home Assistant)
- **Entity-ID**: Technische ID der Entity (monospace)

## Editor-Features

### Persistenter State

- Aufgeklappte Bereiche bleiben während der Konfiguration offen
- Du kannst mehrere Bereiche gleichzeitig aufklappen
- Der State wird während der Editor-Session gespeichert

### Automatisches Speichern

- Änderungen werden sofort in die Config übernommen
- Kein manuelles Speichern erforderlich
- Änderungen sind sofort im Dashboard sichtbar

### Intelligente Gruppierung

- Entities werden automatisch nach Domain erkannt
- Neue Entities werden automatisch hinzugefügt
- Entities ohne Domain werden in "Sonstiges" gruppiert

### Visuelle Hierarchie

- Einrückungen zeigen die Struktur klar
- Icons für jede Domain
- Farbcodierung für verschiedene Status

### Drag & Drop

- Intuitive Neuordnung per Maus
- Funktioniert für Bereiche und Entities
- Sofortige visuelle Rückmeldung

### Checkboxen

- Alle Optionen können über Checkboxen aktiviert/deaktiviert werden
- Wetter, Energie, Summary Cards, etc.
- Sofortige visuelle Rückmeldung

### Dropdown-Menüs

- Auswahlmöglichkeiten für Sprache, Integrationen, etc.
- Automatische Erkennung verfügbarer Optionen
- Abhängigkeiten werden automatisch geprüft

### Debug-Einstellungen

- Log-Level konfigurierbar (error, warn, info, debug)
- Hilft bei der Fehlersuche
- Standard: warn

## Navigation im Editor

Der Editor bietet eine Navigation mit verschiedenen Sektionen:

### Dashboard Cards

- Wetter
- Energie
- Person Badges
- Search Card
- Clock Card
- Summary Cards (Covers, Security, Lights, Batteries)

### Views

- Summary Views
- Room Views
- Subviews

### Integrationen

- Better Thermostat
- Horizon Card
- Clock Weather Card
- Alarm Panel
- Scheduler Card
- Calendar Card
- Öffentlicher Nahverkehr

### Erweiterte Optionen

- Favoriten
- Raum-Pins
- Entity Name Patterns
- Entity Name Translations
- Floor-basierte Organisation
- Debug-Einstellungen

### Bereiche & Entities

- Bereichs-Verwaltung
- Entity-Filterung pro Bereich
- Drag & Drop für Reihenfolge

## Tipps & Tricks

1. **Mehrere Bereiche gleichzeitig konfigurieren**: Klappe mehrere Bereiche auf, um Entities in verschiedenen Bereichen gleichzeitig zu verwalten
2. **Drag & Drop für schnelle Anpassungen**: Ziehe Bereiche und Entities, um die Reihenfolge schnell anzupassen
3. **Checkboxen für schnelle Änderungen**: Nutze die Checkboxen für schnelle Ein-/Ausblendungen
4. **Debug-Modus für Fehlersuche**: Aktiviere den Debug-Modus, um detaillierte Logs zu sehen

## Bekannte Einschränkungen

- Editor kann bei sehr vielen Entities (>500) langsam werden
- Drag & Drop funktioniert auf Touch-Geräten nicht optimal
- Einige Custom Cards werden möglicherweise nicht korrekt gerendert

**Workarounds siehe GitHub Issues**

