# Project Migration System

## Overview

The Migration System handles structured project migrations across different domains of the platform. It provides a consistent lifecycle for creating, executing, validating, and rolling back migrations with full audit support.

## Migration Types

| Type | Description | Scope |
|---|---|---|
| **schema** | Project schema structure changes | Pages, sections, component definitions |
| **workflow** | Workflow definition and state changes | Workflow steps, triggers, conditions |
| **runtime** | Runtime configuration migration | Feature flags, service configs, policies |
| **plugin** | Plugin installation and configuration changes | Plugin registry, plugin settings |
| **configuration** | Environment and project configuration updates | Environment configs, settings, overrides |

## Migration Lifecycle

```
Pending → Completed → Rolled Back
```

| State | Description |
|---|---|
| `pending` | Migration defined but not yet executed |
| `completed` | Migration successfully applied |
| `rolled_back` | Migration reverted to previous state |

Transitions:
- `pending → completed`: Migration is executed and validated
- `completed → rolled_back`: Migration is rolled back due to validation failure or manual intervention
- `rolled_back → pending`: Rolled-back migration can be re-attempted after fixes

## Validation

Each migration goes through validation at multiple stages:

### Pre-Migration Validation
- Schema compliance — migration definition matches expected schema
- Dependency check — all prerequisites are met
- Conflict detection — no conflicts with existing state
- Dry-run — simulate migration without applying changes

### Post-Migration Validation
- Integrity check — migrated state is consistent
- Compatibility check — migration is compatible with existing systems
- Health check — all affected components are operational

## Rollback

Rollback restores the system to the pre-migration state:

1. **Automatic rollback** on validation failure — if post-migration validation fails, the system automatically reverts
2. **Manual rollback** — administrators can trigger rollback at any time
3. **Rollback dependencies** — if a migration fails, all dependent migrations are also rolled back in reverse order
4. **State preservation** — pre-migration snapshots are preserved for audit and recovery

Each rollback operation records the before/after state, reason, and auditor identity for full traceability.
