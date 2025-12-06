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

// Lade Logger ZUERST (wird von vielen Modulen benötigt)
import './utils/simon42-logger.js';

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
import './cards/simon42-header-preferences-card.js'; // Header Preferences Card (als Fallback)
import './cards/simon42-toolbar-preferences.js'; // NEU: Toolbar Preferences (injiziert in Toolbar)
// simon42-preferences-card.js wird nicht mehr automatisch geladen, da Toolbar-Präferenzen verwendet werden

// Lade Core-Module
import './core/simon42-dashboard-strategy.js';

// Lade View-Module
import './views/simon42-view-room.js';
import './views/simon42-view-lights.js'; // Nutzt jetzt die reaktiven Group-Cards
import './views/simon42-view-covers.js';
import './views/simon42-view-security.js';
import './views/simon42-view-batteries.js';

// Module loaded successfully - logging removed for production
// Version info available via window.Simon42DashboardVersion if needed
