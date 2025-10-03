// ====================================================================
// SIMON42 DASHBOARD STRATEGIES - LOADER V2
// ====================================================================
// Lädt alle Strategy-Module inkl. neuer Konfigurations-Funktionen
// 
// Installation in Home Assistant:
// 1. Alle Dateien in /config/www/ speichern:
//    - simon42-strategies-loader-v2.js (diese Datei)
//    - simon42-config-manager.js
//    - simon42-dashboard-strategy-v2.js
//    - simon42-settings-card.js
//    - simon42-view-room.js
//    - simon42-view-lights.js
//    - simon42-view-covers.js
//    - simon42-view-security.js
//    - simon42-view-batteries.js
//
// 2. In configuration.yaml hinzufügen:
//    lovelace:
//      resources:
//        - url: /local/simon42-strategies-loader-v2.js
//          type: module
//
// 3. Home Assistant neu starten
// 
// Verwendung im Dashboard:
// strategy:
//   type: custom:simon42-dashboard
// ====================================================================

console.log('🚀 Simon42 Dashboard Strategies V2 - Lade Module...');

// Lade Config Manager zuerst
import './simon42-config-manager.js';
console.log('✅ Config Manager geladen');

// Lade Settings Card
import './simon42-settings-card.js';
console.log('✅ Settings Card geladen');

// Lade Dashboard Strategy
import './simon42-dashboard-strategy-v2.js';
console.log('✅ Dashboard Strategy geladen');

// Lade View Strategies
import './simon42-view-room.js';
import './simon42-view-lights.js';
import './simon42-view-covers.js';
import './simon42-view-security.js';
import './simon42-view-batteries.js';
console.log('✅ View Strategies geladen');

console.log('✨ Simon42 Dashboard Strategies V2 erfolgreich geladen!');
console.log('');
console.log('📝 Neue Features:');
console.log('   • Bereiche ein-/ausblenden');
console.log('   • Views ein-/ausblenden');
console.log('   • Einstellungen-Dialog');
console.log('   • Persistente Speicherung');
console.log('');
console.log('🎬 Dashboard mit dieser Strategy in der YAML-Konfiguration verwenden:');
console.log('   strategy:');
console.log('     type: custom
