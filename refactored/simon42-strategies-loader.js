// ====================================================================
// SIMON42 DASHBOARD STRATEGIES - LOADER V2.1 (Refactored)
// ====================================================================
// Diese Datei lädt alle Strategy-Module mit der neuen Struktur
// 
// Dateistruktur:
// /config/www/simon42-dashboard/
//   ├── simon42-strategies-loader.js (diese Datei)
//   ├── helpers/
//   │   ├── EntityHelper.js
//   │   ├── StateCalculator.js
//   │   ├── CardGenerator.js (Extended Version)
//   │   └── WebSocketHelper.js
//   └── strategies/
//       ├── simon42-dashboard-strategy.js
//       └── views/
//           ├── simon42-view-room.js
//           ├── simon42-view-lights.js
//           ├── simon42-view-covers.js
//           ├── simon42-view-security.js
//           └── simon42-view-batteries.js
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

console.log('%c📦 Simon42 Dashboard Loading...', 'color: #03a9f4; font-weight: bold;');

// ====== HELPER-MODULE LADEN ======
console.log('%c   Loading helpers...', 'color: #666;');

import './helpers/simon42-entity-helper.js';
console.log('%c   ✓ EntityHelper loaded', 'color: #4caf50;');

import './helpers/simon42-state-calculator.js';
console.log('%c   ✓ StateCalculator loaded', 'color: #4caf50;');

import './helpers/simon42-card-generator.js';
console.log('%c   ✓ CardGenerator loaded', 'color: #4caf50;');

import './helpers/simon42-websocket-helper.js';
console.log('%c   ✓ WebSocketHelper loaded', 'color: #4caf50;');

// ====== HAUPTSTRATEGIE LADEN ======
console.log('%c   Loading main strategy...', 'color: #666;');

import './strategies/simon42-dashboard-strategy.js';
console.log('%c   ✓ Main strategy loaded', 'color: #4caf50;');

// ====== VIEW-STRATEGIES LADEN ======
console.log('%c   Loading view strategies...', 'color: #666;');

import './strategies/views/simon42-view-room.js';
console.log('%c   ✓ Room view loaded', 'color: #4caf50;');

import './strategies/views/simon42-view-lights.js';
console.log('%c   ✓ Lights view loaded', 'color: #4caf50;');

import './strategies/views/simon42-view-covers.js';
console.log('%c   ✓ Covers view loaded', 'color: #4caf50;');

import './strategies/views/simon42-view-security.js';
console.log('%c   ✓ Security view loaded', 'color: #4caf50;');

import './strategies/views/simon42-view-batteries.js';
console.log('%c   ✓ Batteries view loaded', 'color: #4caf50;');

// ====== VERSION & SUCCESS MESSAGE ======
const DASHBOARD_VERSION = '2.1.0';
const DASHBOARD_NAME = 'Simon42 Dashboard Strategies (Refactored)';

console.log(
  `%c🏠 ${DASHBOARD_NAME} v${DASHBOARD_VERSION} loaded successfully!`,
  'background: #03a9f4; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 14px;'
);

// ====== DEBUG-INFO ======
if (window.location.search.includes('simon42-debug')) {
  console.group('📊 Simon42 Dashboard Debug Info');
  console.log('Version:', DASHBOARD_VERSION);
  console.log('Mode:', 'Refactored with Helpers');
  console.table({
    'Helper Modules': ['EntityHelper', 'StateCalculator', 'CardGenerator', 'WebSocketHelper'],
    'Main Strategy': ['simon42-dashboard-strategy'],
    'View Strategies': ['room', 'lights', 'covers', 'security', 'batteries']
  });
  console.log('Custom Elements:', {
    dashboard: 'll-strategy-simon42-dashboard',
    views: [
      'll-strategy-simon42-view-room',
      'll-strategy-simon42-view-lights',
      'll-strategy-simon42-view-covers',
      'll-strategy-simon42-view-security',
      'll-strategy-simon42-view-batteries'
    ]
  });
  console.log('Performance Optimizations:');
  console.log('  ✓ Bundled WebSocket calls');
  console.log('  ✓ Single-pass state calculations');
  console.log('  ✓ Reusable card generators');
  console.log('  ✓ Centralized entity filtering');
  console.groupEnd();
}

// ====== EXPORT FÜR EXTERNE NUTZUNG ======
export const Simon42Dashboard = {
  version: DASHBOARD_VERSION,
  name: DASHBOARD_NAME,
  mode: 'refactored',
  ready: true,
  helpers: {
    entity: 'EntityHelper',
    state: 'StateCalculator',
    card: 'CardGenerator',
    websocket: 'WebSocketHelper'
  },
  strategies: {
    main: 'll-strategy-simon42-dashboard',
    views: {
      room: 'll-strategy-simon42-view-room',
      lights: 'll-strategy-simon42-view-lights',
      covers: 'll-strategy-simon42-view-covers',
      security: 'll-strategy-simon42-view-security',
      batteries: 'll-strategy-simon42-view-batteries'
    }
  }
};

// ====== HEALTH CHECK ======
window.Simon42Dashboard = Simon42Dashboard;
console.log('%c✅ Dashboard available as window.Simon42Dashboard', 'color: #4caf50;');
