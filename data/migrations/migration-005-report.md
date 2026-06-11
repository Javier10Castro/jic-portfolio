# Migration 005 — Hardening Report

## Summary
Narrowed `projects.status` DB CHECK constraint from 8 legacy states to the 4 runtime-only states (`draft`, `preview`, `approved`, `deployed`), closing the runtime/database mismatch.

## Files Created

| File | Purpose |
|---|---|
| `data/migrations/005_narrow_project_status_check.sql` | DROP old constraint, UPDATE legacy values, ADD new 4-state CHECK |
| `docs/migrations/005-project-status-hardening.md` | Problem statement, mapping table, before/after SQL, rollback procedure, runtime alignment rationale |
| `scripts/verify-project-status-constraint.js` | Queries `pg_constraint`, prints definition, asserts exactly 4 states, exits code 1 on mismatch |

## Legacy Status Mapping

| Legacy | Mapped To | Rationale |
|---|---|---|
| `processing` | `preview` | Stuck mid-pipeline → milestone reset to `preview` |
| `deploying` | `deployed` | Transient deploy state → terminal `deployed` |
| `failed` | `preview` | Pipeline failure → milestone stays at `preview` |
| `cancelled` | `preview` | Never written by code → safe default |

## Constraint Changes

**Before:** `CHECK (status IN ('draft','processing','preview','approved','deploying','deployed','failed','cancelled'))`

**After:** `CHECK (status IN ('draft','preview','approved','deployed'))`

## Changes to Existing Code

**None.** The runtime (`lib/runtime/index.js`) already only writes these 4 states. No state machine, guards, transitions, or execution statuses modified. Only the DB constraint was hardened.

## Stale Docs Check

All 4 documentation files reviewed (`execution-vs-project-separation.md`, `001-execution-lifecycle-design.md`, `004-execution-status-normalization.md`, `execution-state-machine.md`). Stale project states appear only in:
- **Historical problem descriptions** (describing the OLD 8-state system — correct to keep)
- **Execution state context** (describing `executions.status`, not `projects.status` — correct as-is)
- **Rejected alternatives** (ADR line 58, Alternative A — correct as historical context)

No doc updates needed.

## Migration Application

```
5/5 statements applied successfully:
  1. DROP CONSTRAINT IF EXISTS projects_status_check
  2. UPDATE status='preview' WHERE status IN ('processing','failed','cancelled')
  3. UPDATE status='deployed' WHERE status='deploying'
  4. ADD CONSTRAINT projects_status_check CHECK (status IN ('draft','preview','approved','deployed'))
```

## Verification

- `node scripts/verify-project-status-constraint.js` → constraint name, definition printed, 4 states confirmed, exit 0
- Full test suite (54 tests) → all passing
- Export contract (22 checks) → all passing
- `SELECT status, COUNT(*) FROM projects GROUP BY status` → only 4 valid states present
- `INSERT INTO ... VALUES ('processing')` → rejected by CHECK constraint
