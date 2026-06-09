# Migration 004: Execution Status Normalization

## Summary

Replaced ambiguous execution status vocabulary (`completed`, `cancelled`) with a strict finite state machine (`success`, `failed`). The new enum is enforced at both the application layer (runtime validator) and the database layer (CHECK constraint).

## What Changed

### Schema

```sql
-- Before
status VARCHAR(20) NOT NULL DEFAULT 'processing'
  CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled'));

-- After
status VARCHAR(20) NOT NULL DEFAULT 'processing'
  CHECK (status IN ('queued', 'processing', 'success', 'failed'));
```

### Data Migration

```sql
ALTER TABLE executions DROP CONSTRAINT IF EXISTS executions_status_check;

UPDATE executions SET status = 'success' WHERE status = 'completed';
UPDATE executions SET status = 'failed'  WHERE status = 'cancelled';

ALTER TABLE executions ADD CONSTRAINT executions_status_check
  CHECK (status IN ('queued', 'processing', 'success', 'failed'));
```

The constraint is dropped before the UPDATE to allow the new status values, then re-added with the whitelist.

## Mapping Table

| Legacy Value | Migrated To | Reason |
|---|---|---|
| `completed` | `success` | Semantic alignment: a pipeline that finishes without errors succeeded, it did not merely "complete". |
| `cancelled` | `failed` | Legacy cleanup only — `cancelled` was defined in the original CHECK constraint but never written by any code path. All existing rows (zero expected) are mapped to `failed` for safety. |

## Reason for Migration

### 1. Ambiguous Vocabulary

The term "completed" conflated two distinct concepts:
- **Technical completion**: the execution finished running (processing stopped)
- **Successful completion**: the execution finished with all steps passing

Using `success` removes this ambiguity. An execution can only be `success` if all pipeline steps completed without unhandled errors.

### 2. Inconsistent State Space

The original enum mixed execution-level states (`queued`, `processing`, `completed`, `failed`) with a non-standard cancellation state (`cancelled`). The cancellation path was never implemented, creating dead enum values that increased cognitive load without providing value.

### 3. Production-Grade Observability

A strict, minimal state space enables:
- Accurate SLI/SLO tracking (success vs failure counting)
- Cleaner monitoring alerts (only two terminal states to track)
- Predictable dashboard rendering

## Risks

### Medium Risk — Existing Rows with `completed`

The UPDATE handles all existing rows. However, any running application instances that attempt to write `completed` after the migration will fail with a CHECK constraint violation.

**Mitigation**: The runtime code was updated atomically with the migration. All `finalizeExecution()` calls now write `success` instead of `completed`. The `assertExecutionStatus()` validator at `lib/runtime/index.js:27` rejects `completed` with `INVALID_INPUT`.

### Low Risk — Third-Party Consumers

Any external system reading `executions.status` will see `success` instead of `completed`. This is a breaking change for consumers that string-match on `completed`.

**Mitigation**: No known external consumers. The status badge CSS in the dashboard was updated to recognize `success` while keeping the old `.completed` class for backward compatibility during deployment rollback.

### Low Risk — Rollback

Rolling back the application code without reverting the migration will cause writes of `success` to be rejected by the `completed`-era CHECK constraint.

**Mitigation**: Rollback procedure must include re-running the original constraint:

```sql
ALTER TABLE executions DROP CONSTRAINT IF EXISTS executions_status_check;
UPDATE executions SET status = 'completed' WHERE status = 'success';
ALTER TABLE executions ADD CONSTRAINT executions_status_check
  CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled'));
```

## Backward Compatibility Notes

- The CSS class `.status-badge.completed` is preserved in `dashboard-logs.html` for deployment rollback scenarios.
- The `EXECUTION_STATUSES` constant in the runtime is the single source of truth. Any code that needs to check execution status should reference this constant rather than using string literals.
- The `executions` table CHECK constraint acts as a defense-in-depth layer. The application-layer validator catches invalid statuses before they reach the database.

## Files Changed

| File | Change |
|---|---|
| `lib/runtime/index.js` | Added `EXECUTION_STATUSES` constant, `assertExecutionStatus()` validator, updated `finalizeExecution()` to validate, replaced `'completed'` → `'success'` (3 calls) |
| `data/migrations/004_normalize_execution_status.sql` | New migration (this file) |
| `dashboard-logs.html` | Added `.status-badge.success` CSS class |

## Verification

1. Run `node test-runtime-safe.js` — validates that `assertExecutionStatus` rejects invalid statuses
2. Run full pipeline — confirms `executions.status` is set to `success` (not `completed`)
3. Query `SELECT status, COUNT(*) FROM executions GROUP BY status` — only `queued`, `processing`, `success`, `failed` should appear
4. Attempt `INSERT INTO executions (status) VALUES ('completed')` — must be rejected by CHECK constraint

## Related

- [Execution State Machine](../runtime/execution-state-machine.md)
- [ADR-001: Execution Lifecycle Design](../adr/001-execution-lifecycle-design.md)
