# Snapshot System

## Overview

The Snapshot System provides point-in-time capture and restoration of project state across multiple domains. Snapshots enable safe rollback, environment recovery, and audit trails for all project operations.

## Snapshot Types

| Type | Description | Use Case |
|---|---|---|
| **project** | Full project state including metadata, configuration, and resources | Complete project recovery |
| **workflow** | Workflow execution state and history | Resume or rollback workflow executions |
| **config** | Environment and project configuration | Revert configuration changes |
| **runtime** | Runtime state including feature flags, service registrations | Recover runtime state after failures |
| **knowledge** | Knowledge base state with versioning | Restore knowledge base to previous state |
| **plugin** | Plugin installation and configuration state | Recover from plugin failures |
| **rollback** | Auto-generated snapshot before destructive operations | Quick undo for any operation |

## Create / Restore / Delete Lifecycle

### Create
Snapshots are created on demand or automatically before destructive operations (promotions, deployments, configuration changes). Each snapshot captures the full state of the target domain at the moment of creation.

### Restore
Restoring a snapshot reverts the target domain to the captured state. Restoration supports:
- Full restore — reverts entire domain
- Selective restore — reverts specific components
- Dry-run restore — previews changes without applying them

### Delete
Snapshots can be deleted individually or through retention policies. The system supports soft-delete with configurable retention periods before permanent deletion.

## Snapshot Versioning

Each snapshot is assigned a unique version identifier based on the semantic version of the project at creation time. Snapshots maintain a parent-child lineage enabling navigation through the snapshot history tree.

## Rollback Strategy

The rollback strategy follows a layered approach:
1. **Pre-operation snapshots** are automatically created before any destructive operation
2. **Rollback restores** the most recent pre-operation snapshot
3. **Chain rollbacks** allow sequential undo through the snapshot history
4. **Validation** runs after rollback to verify consistent state
5. **Audit trail** records all rollback operations with before/after state comparison
