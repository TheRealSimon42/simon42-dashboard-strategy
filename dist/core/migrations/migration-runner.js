// ====================================================================
// MIGRATION RUNNER
// ====================================================================
// Centralized migration system that runs migrations based on version comparison
// Migrations run when current version is higher than config version
// ====================================================================

import { logInfo, logWarn, logDebug } from '../../utils/system/simon42-logger.js';
import { VERSION, getBaseVersion } from '../../utils/system/simon42-version.js';

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
 * Compares two semantic versions
 * @param {string} v1 - First version (e.g., "2.1.15" or "2.1.15-dev")
 * @param {string} v2 - Second version (e.g., "2.1.14" or "2.1.16-dev")
 * @returns {number} -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
  // Extract base versions (remove dev/prerelease suffixes)
  const baseV1 = v1.split('-')[0];
  const baseV2 = v2.split('-')[0];
  
  const parts1 = baseV1.split('.').map(Number);
  const parts2 = baseV2.split('.').map(Number);
  
  // Ensure both have 3 parts (MAJOR.MINOR.PATCH)
  while (parts1.length < 3) parts1.push(0);
  while (parts2.length < 3) parts2.push(0);
  
  // Compare MAJOR, MINOR, PATCH
  for (let i = 0; i < 3; i++) {
    if (parts1[i] < parts2[i]) return -1;
    if (parts1[i] > parts2[i]) return 1;
  }
  
  return 0;
}

/**
 * Gets the version stored in config
 * @param {Object} config - Config object
 * @returns {string|null} Stored version or null if not set
 */
function getConfigVersion(config) {
  if (!config || typeof config !== 'object') {
    return null;
  }
  
  // Check for _version field (internal tracking)
  return config._version || null;
}

/**
 * Sets the version in config
 * @param {Object} config - Config object
 * @param {string} version - Version to store
 * @returns {Object} Updated config
 */
function setConfigVersion(config, version) {
  return {
    ...config,
    _version: version
  };
}

/**
 * Runs all pending migrations on a config based on version comparison
 * Migrations are run if current version is higher than config version
 * @param {Object} config - Config object to migrate
 * @param {Object} options - Migration options
 * @param {boolean} options.logMigration - Whether to log migration details (default: false)
 * @returns {Object} Migrated config with updated version
 */
export function runMigrations(config, options = {}) {
  if (!config || typeof config !== 'object') {
    // Initialize new config with current version
    return setConfigVersion({}, getBaseVersion());
  }

  const { logMigration = false } = options;
  const currentVersion = getBaseVersion();
  const configVersion = getConfigVersion(config);
  
  // If no version in config, treat as very old version (run all migrations)
  // If versions are equal, skip migrations
  if (configVersion && compareVersions(currentVersion, configVersion) === 0) {
    if (logMigration) {
      logDebug(`[Migration] Skipping migrations - config version (${configVersion}) matches current version (${currentVersion})`);
    }
    return config;
  }
  
  // If current version is lower than config version, something is wrong
  // (downgrade scenario) - skip migrations but log warning
  if (configVersion && compareVersions(currentVersion, configVersion) < 0) {
    logWarn(`[Migration] Current version (${currentVersion}) is lower than config version (${configVersion}). Skipping migrations.`);
    return config;
  }

  if (logMigration) {
    if (configVersion) {
      logInfo(`[Migration] Config version: ${configVersion}, Current version: ${currentVersion} - running migrations`);
    } else {
      logInfo(`[Migration] No version in config, initializing with version ${currentVersion} and running migrations`);
    }
  }

  let migratedConfig = { ...config };
  let migrationsRun = 0;

  // Sort migrations by version, then by ID to ensure correct order
  const sortedMigrations = [...MIGRATIONS].sort((a, b) => {
    const versionCompare = compareVersions(a.version, b.version);
    if (versionCompare !== 0) return versionCompare;
    return a.id.localeCompare(b.id);
  });

  // Only run migrations with version <= current version and > config version
  for (const migration of sortedMigrations) {
    // Skip migrations that are newer than current version
    if (compareVersions(migration.version, currentVersion) > 0) {
      if (logMigration) {
        logDebug(`[Migration] Skipping ${migration.id} - version ${migration.version} is newer than current ${currentVersion}`);
      }
      continue;
    }

    // Skip migrations that are older than or equal to config version
    if (configVersion && compareVersions(migration.version, configVersion) <= 0) {
      if (logMigration) {
        logDebug(`[Migration] Skipping ${migration.id} - version ${migration.version} is not newer than config version ${configVersion}`);
      }
      continue;
    }

    try {
      // Run migration
      if (logMigration) {
        logInfo(`[Migration] Running ${migration.id}: ${migration.description} (v${migration.version})`);
      }

      const beforeConfig = JSON.stringify(migratedConfig);
      migratedConfig = migration.migrate(migratedConfig);
      const afterConfig = JSON.stringify(migratedConfig);

      // Check if migration actually changed something
      if (beforeConfig !== afterConfig) {
        migrationsRun++;
        if (logMigration) {
          logInfo(`[Migration] Completed ${migration.id} (v${migration.version})`);
        }
      } else {
        if (logMigration) {
          logDebug(`[Migration] ${migration.id} completed (no changes needed)`);
        }
      }
    } catch (error) {
      logWarn(`[Migration] Error running ${migration.id}:`, error);
      // Continue with other migrations even if one fails
    }
  }

  // Update config version to current version after migrations
  migratedConfig = setConfigVersion(migratedConfig, currentVersion);

  if (migrationsRun > 0 && logMigration) {
    logInfo(`[Migration] Completed ${migrationsRun} migration(s), config version updated to ${currentVersion}`);
  } else if (logMigration && migrationsRun === 0) {
    logDebug(`[Migration] No migrations needed, config version updated to ${currentVersion}`);
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
