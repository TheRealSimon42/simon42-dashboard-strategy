# Migrations

This folder contains migration scripts that transform configuration from older formats to newer formats.

## How Migrations Work

1. **Migration Runner** (`migration-runner.js`): Centralized system that tracks and runs migrations
2. **Individual Migrations**: Each migration is a separate file (e.g., `001-migrate-areas-display.js`)
3. **One-Time Execution**: Migrations are tracked in `config._migrations` and only run once per config

## Migration State

Migrations are tracked using a `_migrations` object in the config:
```javascript
{
  _migrations: {
    '001-migrate-areas-display': true,
    '002-another-migration': true
  }
}
```

This ensures each migration only runs once, even if the config is loaded multiple times.

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

- **Idempotent**: Migrations should be safe to run multiple times (though they only run once)
- **Backward Compatible**: Old configs should continue to work
- **Non-Destructive**: Preserve all user settings
- **Validated**: Check if migration is needed before running
- **Logged**: Use migration logging for debugging

## Current Migrations

### 001-migrate-areas-display
- **Version**: 2.1.15
- **Description**: Migrates `areas_display` from array-based format to object-based format
- **Old Format**: `{ hidden: [area1], order: [area2, area1] }`
- **New Format**: `{ area1: { hidden: true, order: 1 }, area2: { hidden: false, order: 0 } }`
