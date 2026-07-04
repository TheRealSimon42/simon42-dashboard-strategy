# Simon42 Dashboard Strategy

Eine modulare und hochkonfigurierbare Dashboard-Strategy für Home Assistant, die automatisch Views basierend auf Bereichen, Entitäten und deren Zuständen generiert.

## Features

- **Grafischer Konfigurator** — Keine YAML-Kenntnisse erforderlich
- **Automatische Raum-Erkennung** — Nutzt Home Assistant Areas, Devices & Floors
- **Spezialisierte Views** — Lichter, Rollos, Sicherheit, Batterien, Klima
- **Zusätzliche Sections** — Pflanzen, Agenda, To-dos, Personen, Staubsauger, Wartung (alle opt-in)
- **Header-Badges** — Stromverbrauch, Updates, Now Playing u.v.m. (alle opt-in)
- **Eigene Karten, Badges & Views** — via YAML frei erweiterbar
- **Mehrsprachig** — Deutsch, Englisch, Russisch
- **Performance-optimiert** — Code-Split Bundles, Registry-Caching, reaktive Karten

## Erste Schritte

HACS registriert die Ressource automatisch — keine manuelle `configuration.yaml`-Änderung nötig.

Erstelle ein neues Dashboard (**Einstellungen → Dashboards → Dashboard hinzufügen**), öffne den Raw-Konfigurationseditor und füge ein:

```yaml
strategy:
  type: custom:simon42-dashboard
```

Danach lässt sich alles über den grafischen Editor konfigurieren (Stift-Icon oben rechts).

Die Schritt-für-Schritt-Anleitung mit Video und die vollständige Konfigurationsreferenz stehen im [README](https://github.com/TheRealSimon42/simon42-dashboard-strategy#readme).
