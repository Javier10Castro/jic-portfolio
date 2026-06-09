# Migration 005: Project Status Hardening

## Problem Statement

The database schema (migration 003) allowed 8 values in `projects.status`:

```
'draft', 'processing', 'preview', 'approved',
'deploying', 'deployed', 'failed', 'cancelled'
```

However, the runtime state machine (`STATE_MACHINE` in `lib/runtime/index.js`) only recognizes 4 milestones:

```
'draft', 'preview', 'approved', 'deployed'
```

The runtime never writes `processing`, `deploying`, `failed`, or `cancelled` to `projects.status`. These values existed from an earlier architecture where project and execution state were conflated in a single column. After the execution-vs-project separation (v2.0.0), execution lifecycle is tracked independently in the `executions` table, making the extra project states dead enum values.

This mismatch means raw SQL could set `projects.status` to a value the runtime considers illegal, bypassing the state machine entirely.

## What Changed

### Constraint Before

```sql
status VARCHAR(20) NOT NULL DEFAULT 'draft'
  CHECK (status IN (
    'draft', 'processing', 'preview',
    'approved', 'deploying', 'deployed',
    'failed', 'cancelled'
  )),
```

### Constraint After

```sql
status VARCHAR(20) NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'preview', 'approved', 'deployed')),
```

### SQL

```sql
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

UPDATE projects SET status = 'preview'  WHERE status IN ('processing', 'failed', 'cancelled');
UPDATE projects SET status = 'deployed' WHERE status = 'deploying';

ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('draft', 'preview', 'approved', 'deployed'));
```

## Legacy Status Mapping

| Legacy Value | Maps To | Rationale |
|---|---|---|
| `processing` | `preview` | A project stuck in `processing` was mid-pipeline. After separation, pipeline state is in `executions.status`. The project milestone that corresponds to a "processed project" is `preview`. |
| `deploying` | `deployed` | `deploying` was a transient state during deployment that violated the old state machine (self-transition). The intended terminal milestone is `deployed`. |
| `failed` | `preview` | A "failed project" in the old schema meant the pipeline failed. After separation, pipeline failures are captured in `executions.status`. The project milestone remains `preview` (the last stable state before failure). |
| `cancelled` | `preview` | Legacy cleanup. `cancelled` was never written by any code path. Maps to `preview` as the safest default milestone. |

## Runtime Alignment Rationale

The runtime `STATE_MACHINE` enforces:

```
draft → preview → approved → deployed
```

These 4 states correspond to product lifecycle milestones, not runtime operations:

| State | Meaning |
|---|---|
| `draft` | Project created, no pipeline run yet |
| `preview` | At least one pipeline run completed. Preview available. Re-runs allowed. |
| `approved` | User approved the preview. Pipelines are blocked (no re-runs). Scaffold + deploy allowed. |
| `deployed` | Project deployed to production. Terminal milestone. |

Execution lifecycle (`executions.status`) runs independently:

```
queued → processing → success
                      → failed
```

The DB CHECK constraint now enforces the same 4 values that the runtime state machine recognizes, providing defense-in-depth.

## Rollback Considerations

### Rollback SQL

```sql
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Optional: reverse mapping if original values matter
-- UPDATE projects SET status = 'failed' WHERE ... (no reliable way to reverse)

ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN (
    'draft', 'processing', 'preview',
    'approved', 'deploying', 'deployed',
    'failed', 'cancelled'
  ));
```

### Key Risks

- **Rollback cannot reverse data mapping**: `processing → preview` and `deploying → deployed` are lossy transformations. There is no reliable way to determine whether a current `preview` project was originally `processing` or `preview`. This is acceptable because `preview` is a semantically valid milestone for both cases.
- **Rollback without re-applying old constraint**: If the application is rolled back to pre-v2.0.0 code (which writes `processing` and `failed` to `projects.status`), the new CHECK constraint will reject those values. The rollback procedure MUST include the rollback SQL above.
- **Atomic deployment required**: This migration must be deployed together with the v2.0.0 runtime code. A code-only rollback without reverting the migration causes DB constraint violations.

## Verification

1. Run `node scripts/verify-project-status-constraint.js` — queries `pg_constraint` and prints the current CHECK definition
2. Query `SELECT status, COUNT(*) FROM projects GROUP BY status` — only `draft`, `preview`, `approved`, `deployed` should appear
3. Attempt `INSERT INTO projects (status) VALUES ('processing')` — must be rejected by the CHECK constraint
4. Run `node test-runtime-safe.js` — confirms runtime state machine is intact

## Related

- [Migration 004: Execution Status Normalization](./004-execution-status-normalization.md)
- [ADR-001: Execution Lifecycle Design](../adr/001-execution-lifecycle-design.md)
- [Execution vs Project Separation](../architecture/execution-vs-project-separation.md)
