# Migrations

This folder contains migration scripts that transform configuration from older formats to newer formats.

## How Migrations Work

1. **Migration Runner** (`migration-runner.js`): Centralized system that runs migrations based on version comparison
2. **Individual Migrations**: Each migration is a separate file (e.g., `001-migrate-areas-display.js`)
3. **Version-Based Execution**: Migrations run when the current version is higher than the config version

## Version Tracking

The config stores the current version in `_version` field:
```javascript
{
  _version: '2.1.15'
}
```

Migrations are run automatically when:
- Config has no version (treated as very old, runs all migrations)
- Current version > Config version (runs migrations for versions between config version and current version)
- Current version === Config version (skips migrations)
- Current version < Config version (skips migrations, logs warning - downgrade scenario)

The `_version` field is automatically updated to the current version after migrations complete.

## Creating a New Migration

1. Create a new file following the naming pattern: `XXX-migration-name.js`
2. Export a migration function that takes `config` and returns migrated `config`
3. Register the migration in `migration-runner.js`:

```javascript
import { migrateSomething } from './XXX-migration-name.js';

const MIGRATIONS = [
  // ... existing migrations
  {
    id: 'XXX-migration-name',
    version: '2.1.16',
    description: 'Description of what this migration does',
    migrate: migrateSomething
  }
];
```

## Migration Guidelines

- **Version-Based**: Each migration is associated with a version (e.g., '2.1.15')
- **Idempotent**: Migrations should be safe to run multiple times
- **Backward Compatible**: Old configs should continue to work
- **Non-Destructive**: Preserve all user settings
- **Validated**: Check if migration is needed before running
- **Logged**: Use migration logging for debugging

## Version Format

Versions use semantic versioning (MAJOR.MINOR.PATCH):
- Stable: `2.1.15`
- Dev: `2.1.15-dev` (suffix is ignored for comparison, base version is used)

The migration system compares base versions (without dev/prerelease suffixes) to determine which migrations to run.

## Current Migrations

### 001-migrate-areas-display
- **Version**: 2.1.15
- **Description**: Migrates `areas_display` from array-based format to object-based format
- **Old Format**: `{ hidden: [area1], order: [area2, area1] }`
- **New Format**: `{ area1: { hidden: true, order: 1 }, area2: { hidden: false, order: 0 } }`
