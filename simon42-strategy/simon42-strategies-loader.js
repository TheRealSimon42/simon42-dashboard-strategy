// ====================================================================
// SIMON42 DASHBOARD STRATEGIES - LOADER
// ====================================================================
// Diese Datei lädt alle Strategy-Module
// 
// Installation in Home Assistant:
// 1. Alle Dateien in /config/www/simon42-strategy/ speichern
// 2. In configuration.yaml hinzufügen:
//    lovelace:
//      resources:
//        - url: /local/simon42-strategy/simon42-strategies-loader.js
//          type: module
// 3. Home Assistant neu starten
// 
// Verwendung im Dashboard:
// strategy:
//   type: custom:simon42-dashboard
// ====================================================================

// Lade Helper-Funktionen
import './utils/simon42-helpers.js';
import './utils/simon42-data-collectors.js';
import './utils/simon42-badge-builder.js';
import './utils/simon42-section-builder.js';
import './utils/simon42-view-builder.js';

// Lade Custom Cards
import './cards/simon42-summary-card.js';

// Lade Core-Module
import './core/simon42-dashboard-strategy.js';

// Lade View-Module
import './views/simon42-view-room.js';
import './views/simon42-view-lights.js';
import './views/simon42-view-covers.js';
import './views/simon42-view-security.js';
import './views/simon42-view-batteries.js';

console.log('Simon42 Dashboard Strategies loaded successfully!');
