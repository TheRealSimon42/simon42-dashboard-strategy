// ====================================================================
// SIMON42 DASHBOARD STRATEGIES - LOADER
// ====================================================================
// Diese Datei lädt alle Strategy-Module
// 
// Installation in Home Assistant:
// 1. Alle Dateien in /config/www/ speichern
// 2. In configuration.yaml hinzufügen:
//    lovelace:
//      resources:
//        - url: /local/simon42-strategies-loader.js
//          type: module
// 3. Home Assistant neu starten
// 
// Verwendung im Dashboard:
// strategy:
//   type: custom:simon42-dashboard
// ====================================================================

// Lade alle Module
import './simon42-dashboard-strategy.js';
import './simon42-view-room.js';
import './simon42-view-lights.js';
import './simon42-view-covers.js';
import './simon42-view-security.js';
import './simon42-view-batteries.js';

console.log('Simon42 Dashboard Strategies loaded successfully!');