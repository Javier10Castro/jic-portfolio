# Database Migration Architecture

## Overview

The Migration subsystem provides schema versioning, migration lifecycle management, seed data population, and rollback support. Designed for safe, repeatable, and auditable database schema changes across multiple database providers.

## MigrationManager

Central orchestrator managing migration lifecycle, version tracking, and execution.

```
MigrationManager
├── migrate(target) → MigrationResult      # Run pending migrations
├── rollback(steps) → RollbackResult       # Roll back N migrations
├── rollbackTo(version) → RollbackResult   # Roll back to specific version
├── status() → MigrationStatus             # Current migration status
├── list() → Migration[]                   # List all migrations
├── create(name) → MigrationFile           # Scaffold a new migration
└── history(limit) → MigrationHistory[]    # Migration execution history
```

## SchemaManager

Manages schema creation, alteration, inspection, and diff generation.

```
SchemaManager
├── createTable(name, schema) → void
├── alterTable(name, changes) → void
├── dropTable(name) → void
├── renameTable(oldName, newName) → void
├── tableExists(name) → boolean
├── describeTable(name) → Column[]
├── listTables() → string[]
├── addIndex(table, index) → void
├── removeIndex(table, index) → void
├── addConstraint(table, constraint) → void
├── removeConstraint(table, constraint) → void
└── diff(source, target) → SchemaChange[]
```

## SchemaVersioning

Maintains schema version history in a tracking table (`_migrations`).

```
SchemaVersioning
├── getCurrentVersion() → string
├── getVersionHistory() → MigrationRecord[]
├── recordMigration(migration, direction) → void
├── isMigrated(migration) → boolean
├── getPendingMigrations() → Migration[]
└── getRollbackTarget(version) → Migration
```

### Version Tracking Table

```
_migrations
├── id             INTEGER PRIMARY KEY
├── version        VARCHAR(20)      -- e.g., "20260621000001"
├── name           VARCHAR(255)     -- Migration description
├── direction      ENUM('up','down')-- Applied or rolled back
├── checksum       VARCHAR(64)      -- SHA-256 of migration content
├── executed_by    VARCHAR(255)     -- User or script name
├── executed_at    TIMESTAMP        -- When migration ran
└── duration_ms    INTEGER          -- Execution duration
```

## SeedManager

Manages seed data for development, testing, and initial production setup.

```
SeedManager
├── seed(environment, options) → SeedResult
├── listSeeds() → Seed[]
├── createSeed(name, data) → SeedFile
├── runSeed(name) → SeedResult
├── revertSeed(name) → void
└── status() → SeedStatus
```

| Feature | Description |
|---|---|
| Environments | development, test, staging, production |
| Idempotency | Safe to run multiple times |
| Ordering | Dependency-based seed ordering |
| Cleanup | Revert seeds cleanly |
| Data Generation | Realistic fake data |

## Migration Lifecycle

```
1. Create Migration
   │
   ├── MigrationManager.create(name)
   │   → Generates timestamp + name file
   │   → up() and down() function stubs
   │
2. Write Migration
   │
   ├── Implement up(): schema changes
   ├── Implement down(): reverse changes
   │
3. Run Migration (forward)
   │
   ├── MigrationManager.migrate(target)
   │   ├── Read pending migrations (sorted by version)
   │   ├── For each pending:
   │   │   ├── Verify not already applied
   │   │   ├── Execute up() within transaction
   │   │   ├── Record in _migrations table
   │   │   ├── Update schema version
   │   │   └── On error: rollback transaction, abort
   │   └── Return MigrationResult (applied, skipped, failed)
   │
4. Verify
   │
   ├── MigrationManager.status()
   │   → Show applied, pending, latest version
   │
5. Rollback (if needed)
   │
   ├── MigrationManager.rollback(steps=1)
   │   ├── Read last N applied migrations
   │   ├── For each in reverse order:
   │   │   ├── Verify migration checksum
   │   │   ├── Execute down() within transaction
   │   │   ├── Record rollback in _migrations table
   │   │   └── On error: abort, manual intervention needed
   │   └── Return RollbackResult (rolled back, errors)
```

## Rollback Strategy

| Level | Description | Safety |
|---|---|---|
| Single Step | Rollback last N migrations | ✅ Safe for most cases |
| To Version | Rollback to specific version | ⚠️ Requires all intermediate down() |
| Dry Run | Simulate rollback without executing | ✅ No side effects |
| Force | Skip verification checks | ❌ Danger — data loss risk |

### Rollback Safety Rules

1.  **Transactional**: Each migration runs in its own transaction
2.  **Checksum Verification**: Migration content verified before rollback
3.  **Dependency Check**: Cannot rollback if dependent data exists
4.  **Dry Run First**: Recommended before production rollback
5.  **Irreversible Tag**: Migrations marked `irreversible` cannot rollback
