// ====================================================================
// MIGRATION RUNNER
// ====================================================================
// Centralized migration system that runs migrations once on config load
// ====================================================================

import { logInfo, logWarn, logDebug } from '../../utils/system/simon42-logger.js';

// Import all migrations
import { migrateAreasDisplay } from './001-migrate-areas-display.js';

/**
 * Migration registry - all migrations must be registered here
 * Format: { id: string, version: string, migrate: function }
 * Migrations are run in order based on their ID (lexicographic)
 */
const MIGRATIONS = [
  {
    id: '001-migrate-areas-display',
    version: '2.1.15',
    description: 'Migrate areas_display from array-based to object-based format',
    migrate: migrateAreasDisplay
  }
  // Add new migrations here following the pattern:
  // {
  //   id: '002-migration-name',
  //   version: '2.1.16',
  //   description: 'Description of what this migration does',
  //   migrate: migrateFunction
  // }
];

/**
 * Gets the migration state from config
 * @param {Object} config - Config object
 * @returns {Object} Migration state object
 */
function getMigrationState(config) {
  if (!config || typeof config !== 'object') {
    return { _migrations: {} };
  }
  
  // Ensure _migrations exists
  if (!config._migrations || typeof config._migrations !== 'object') {
    return { ...config, _migrations: {} };
  }
  
  return config;
}

/**
 * Checks if a migration has already been run
 * @param {Object} config - Config object
 * @param {string} migrationId - Migration ID
 * @returns {boolean} True if migration has been run
 */
function hasMigrationRun(config, migrationId) {
  const state = getMigrationState(config);
  return state._migrations[migrationId] === true;
}

/**
 * Marks a migration as run
 * @param {Object} config - Config object
 * @param {string} migrationId - Migration ID
 * @returns {Object} Updated config
 */
function markMigrationRun(config, migrationId) {
  // Ensure _migrations exists
  const migrations = config._migrations || {};
  
  return {
    ...config,
    _migrations: {
      ...migrations,
      [migrationId]: true
    }
  };
}

/**
 * Runs all pending migrations on a config
 * Migrations are run in order and only once per config
 * @param {Object} config - Config object to migrate
 * @param {Object} options - Migration options
 * @param {boolean} options.logMigration - Whether to log migration details (default: false)
 * @returns {Object} Migrated config
 */
export function runMigrations(config, options = {}) {
  if (!config || typeof config !== 'object') {
    return config || {};
  }

  const { logMigration = false } = options;
  let migratedConfig = { ...config };
  let migrationsRun = 0;

  // Sort migrations by ID to ensure consistent order
  const sortedMigrations = [...MIGRATIONS].sort((a, b) => a.id.localeCompare(b.id));

  for (const migration of sortedMigrations) {
    // Skip if migration already run
    if (hasMigrationRun(migratedConfig, migration.id)) {
      if (logMigration) {
        logDebug(`[Migration] Skipping ${migration.id} (already run)`);
      }
      continue;
    }

    try {
      // Run migration
      if (logMigration) {
        logInfo(`[Migration] Running ${migration.id}: ${migration.description}`);
      }

      const beforeConfig = JSON.stringify(migratedConfig);
      migratedConfig = migration.migrate(migratedConfig);
      const afterConfig = JSON.stringify(migratedConfig);

      // Check if migration actually changed something
      if (beforeConfig !== afterConfig) {
        // Mark migration as run
        migratedConfig = markMigrationRun(migratedConfig, migration.id);
        migrationsRun++;

        if (logMigration) {
          logInfo(`[Migration] Completed ${migration.id} (v${migration.version})`);
        }
      } else {
        // Migration didn't change anything, mark as run anyway
        migratedConfig = markMigrationRun(migratedConfig, migration.id);
        if (logMigration) {
          logDebug(`[Migration] ${migration.id} completed (no changes needed)`);
        }
      }
    } catch (error) {
      logWarn(`[Migration] Error running ${migration.id}:`, error);
      // Continue with other migrations even if one fails
      // Mark as run to prevent retrying failed migrations
      migratedConfig = markMigrationRun(migratedConfig, migration.id);
    }
  }

  if (migrationsRun > 0 && logMigration) {
    logInfo(`[Migration] Completed ${migrationsRun} migration(s)`);
  }

  return migratedConfig;
}

/**
 * Gets migration metadata
 * @returns {Array} Array of migration metadata
 */
export function getMigrationMetadata() {
  return MIGRATIONS.map(m => ({
    id: m.id,
    version: m.version,
    description: m.description
  }));
}
