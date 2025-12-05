# Simon42 Dashboard Strategy

Eine modulare und hochkonfigurierbare Dashboard-Strategy für Home Assistant, die automatisch Views basierend auf Bereichen, Entitäten und deren Zuständen generiert. **Keine YAML-Kenntnisse erforderlich** - alles über den grafischen Editor!

## Features

- **Grafischer Konfigurator** - Intuitive Oberfläche ohne YAML
- **Automatische Raum-Erkennung** - Nutzt Home Assistant Areas & Devices
- **Spezialisierte Views** - Lichter, Rollos, Sicherheit, Batterien
- **Optionale Integrationen** - Better Thermostat, Horizon Card, Öffentlicher Nahverkehr
- **Performance-optimiert** - Registry-Caching und Lazy Loading

## Installation

Nach der Installation über HACS:

1. Erstelle ein neues Dashboard und füge im Raw-Konfigurationseditor hinzu:
   ```yaml
   strategy:
     type: custom:simon42-dashboard
   ```

2. Speichere - der grafische Editor öffnet sich automatisch! 🎉

Für detaillierte Anweisungen siehe das [README](README.MD).