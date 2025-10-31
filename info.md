# Simon42 Dashboard Strategy

Eine modulare und hochkonfigurierbare Dashboard-Strategy für Home Assistant, die automatisch Views basierend auf Bereichen, Entitäten und deren Zuständen generiert.

## Features

- **Grafischer Konfigurator** - Keine YAML-Kenntnisse erforderlich
- **Automatische Raum-Erkennung** - Nutzt Home Assistant Areas & Devices
- **Dynamische Gruppierung** - Entities nach Status und Typ gruppiert
- **Spezialisierte Views** - Lichter, Rollos, Sicherheit, Batterien
- **Performance-optimiert** - Registry-Caching und Lazy Loading

## Installation

Nach der Installation über HACS:

1. Füge in deiner `configuration.yaml` hinzu:
   ```yaml
   lovelace:
     mode: storage
     resources:
       - url: /local/simon42-strategy/simon42-strategies-loader.js
         type: module
   ```

2. Erstelle ein neues Dashboard mit der Strategy:
   ```yaml
   strategy:
     type: custom:simon42-dashboard
   ```

Für detaillierte Anweisungen siehe das README.