// ====================================================================
// SIMON42 DASHBOARD STRATEGIES - LOADER (MIT REAKTIVEN GROUP-CARDS)
// ====================================================================
// Diese Datei lädt alle Strategy-Module inklusive der neuen reaktiven
// Lights Group Cards
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
import './cards/simon42-lights-group-card.js'; // NEU: Reaktive Lights Group Card
import './cards/simon42-covers-group-card.js'; // NEU: Reaktive Covers Group Card

// Lade Core-Module
import './core/simon42-dashboard-strategy.js';

// Lade View-Module
import './views/simon42-view-room.js';
import './views/simon42-view-lights.js'; // Nutzt jetzt die reaktiven Group-Cards
import './views/simon42-view-covers.js';
import './views/simon42-view-security.js';
import './views/simon42-view-batteries.js';

console.log('%c✅ Simon42 Dashboard Strategies', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
const features = ['Better Thermostat', 'Public Transport (hvv-card)', 'Reactive Group Cards', 'Bilingual Support (DE/EN)', 'Horizon Card', 'Entity Name Transformation'];
console.log('Features:', features.join(', '));
