// ====================================================================
// SIMON42 DASHBOARD STRATEGIES - LOADER V2.0
// ====================================================================
// Diese Datei lädt alle Strategy-Module mit der neuen Struktur
// 
// Neue Dateistruktur:
// /config/www/simon42-dashboard/
//   ├── simon42-strategies-loader.js (diese Datei)
//   ├── strategies/
//   │   ├── simon42-dashboard-strategy.js
//   │   └── views/
//   │       ├── simon42-view-room.js
//   │       ├── simon42-view-lights.js
//   │       ├── simon42-view-covers.js
//   │       ├── simon42-view-security.js
//   │       └── simon42-view-batteries.js
//   └── helpers/
//       ├── EntityHelper.js
//       ├── StateCalculator.js
//       ├── CardGenerator.js
//       └── WebSocketHelper.js
//
// Installation in Home Assistant:
// 1. Alle Dateien in /config/www/simon42-dashboard/ speichern
// 2. In configuration.yaml hinzufügen:
//    lovelace:
//      resources:
//        - url: /local/simon42-dashboard/simon42-strategies-loader.js
//          type: module
// 3. Home Assistant neu starten
// 
// Verwendung im Dashboard:
// strategy:
//   type: custom:simon42-dashboard
// ====================================================================

// Helper-Module laden
import './helpers/EntityHelper.js';
import './helpers/StateCalculator.js';
import './helpers/CardGenerator.js';
import './helpers/WebSocketHelper.js';

// Hauptstrategie laden
import './strategies/simon42-dashboard-strategy.js';

// View-Strategies laden
import './strategies/views/simon42-view-room.js';
import './strategies/views/simon42-view-lights.js';
import './strategies/views/simon42-view-covers.js';
import './strategies/views/simon42-view-security.js';
import './strategies/views/simon42-view-batteries.js';

// Version Info
const DASHBOARD_VERSION = '2.0.0';
const DASHBOARD_NAME = 'Simon42 Dashboard Strategies';

// Console Info mit Styling
console.log(
  `%c🏠 ${DASHBOARD_NAME} v${DASHBOARD_VERSION} loaded successfully!`,
  'background: #03a9f4; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
);

// Debug-Info wenn gewünscht
if (window.location.search.includes('debug')) {
  console.group('Simon42 Dashboard Debug Info');
  console.log('Version:', DASHBOARD_VERSION);
  console.log('Modules loaded:', {
    helpers: ['EntityHelper', 'StateCalculator', 'CardGenerator', 'WebSocketHelper'],
    strategies: ['simon42-dashboard-strategy'],
    views: ['room', 'lights', 'covers', 'security', 'batteries']
  });
  console.log('Custom element registered:', 'll-strategy-simon42-dashboard');
  console.groupEnd();
}

// Export für externe Nutzung (optional)
export const Simon42Dashboard = {
  version: DASHBOARD_VERSION,
  name: DASHBOARD_NAME,
  ready: true
};