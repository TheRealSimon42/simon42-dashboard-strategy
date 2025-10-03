# ✅ Simon42 Dashboard V2 - Installations-Checkliste

Eine Schritt-für-Schritt Anleitung für die Installation des Simon42 Dashboards mit allen neuen Features.

---

## 📋 Vor der Installation

- [ ] Home Assistant Version 2024.7 oder höher
- [ ] Zugriff auf den `/config/www/` Ordner
- [ ] Erweiterten Modus in deinem Profil aktiviert
- [ ] Backup deiner aktuellen Dashboard-Konfiguration erstellt

---

## 🔧 Installation

### 1️⃣ Dateien hochladen

Lade folgende **9 Dateien** in `/config/www/` hoch:

- [ ] `simon42-strategies-loader-v2.js` (Hauptloader)
- [ ] `simon42-config-manager.js` (Konfigurations-Manager)
- [ ] `simon42-dashboard-strategy-v2.js` (Dashboard-Strategy)
- [ ] `simon42-settings-card.js` (Einstellungs-UI)
- [ ] `simon42-view-room.js` (Raum-Ansichten)
- [ ] `simon42-view-lights.js` (Lichter-Übersicht)
- [ ] `simon42-view-covers.js` (Rollos-Übersicht)
- [ ] `simon42-view-security.js` (Sicherheits-Übersicht)
- [ ] `simon42-view-batteries.js` (Batterie-Übersicht)

**Pfad prüfen:**
```
/config/www/simon42-strategies-loader-v2.js
/config/www/simon42-config-manager.js
...
```

---

### 2️⃣ Resource hinzufügen

**Option A: Via configuration.yaml**

- [ ] Öffne `/config/configuration.yaml`
- [ ] Füge folgendes hinzu:

```yaml
lovelace:
  resources:
    - url: /local/simon42-strategies-loader-v2.js
      type: module
```

**Option B: Via UI**

- [ ] Gehe zu: Einstellungen → Dashboards
- [ ] Klicke oben rechts auf die **3 Punkte** → Ressourcen
- [ ] Klicke auf **+ Ressource hinzufügen**
- [ ] URL: `/local/simon42-strategies-loader-v2.js`
- [ ] Typ: **JavaScript-Modul**
- [ ] Klicke auf **Erstellen**

---

### 3️⃣ Home Assistant neu starten

- [ ] Gehe zu: Einstellungen → System → Neu starten
- [ ] Warte bis Home Assistant neu gestartet ist
- [ ] Prüfe die Browser-Konsole auf Fehler (F12)
- [ ] Du solltest sehen: "✨ Simon42 Dashboard Strategies V2 erfolgreich geladen!"

---

### 4️⃣ Dashboard erstellen

**Neues Dashboard:**

- [ ] Gehe zu: Einstellungen → Dashboards
- [ ] Klicke auf **+ Dashboard hinzufügen**
- [ ] Name: z.B. "Simon42 Dashboard"
- [ ] URL: z.B. "simon42"
- [ ] Icon: z.B. "mdi:home"
- [ ] Klicke auf **Erstellen**
- [ ] **Wichtig:** Aktiviere "Bearbeitungsmodus mit YAML aktivieren"

**Oder bestehendes Dashboard bearbeiten:**

- [ ] Gehe zu deinem Dashboard
- [ ] Klicke auf die **3 Punkte** → Dashboard bearbeiten
- [ ] Aktiviere "Bearbeitungsmodus mit YAML aktivieren" (falls nötig)

---

### 5️⃣ Dashboard konfigurieren

- [ ] Öffne das Dashboard
- [ ] Klicke auf die **3 Punkte** → Rohe Konfiguration bearbeiten
- [ ] **Lösche den gesamten Inhalt**
- [ ] Füge folgendes ein:

```yaml
strategy:
  type: custom:simon42-dashboard
views: []
```

- [ ] Klicke auf **Speichern**
- [ ] Warte einen Moment
- [ ] Das Dashboard sollte nun automatisch generiert werden

---

## 🎉 Erfolgreich installiert!

Wenn alles geklappt hat, siehst du jetzt:

- [ ] Eine Übersichts-Seite mit Zusammenfassungen
- [ ] Einen Einstellungs-Button (Zahnrad)
- [ ] Bereiche (Areas) als Cards
-
