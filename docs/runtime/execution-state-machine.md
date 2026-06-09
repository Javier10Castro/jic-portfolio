# Execution State Machine

## Overview

The execution state machine governs the lifecycle of individual pipeline runs. Each invocation of `runPipeline()` or `approveProject()` creates an execution record that tracks progress independently of the parent project's milestone state.

An execution represents a single, immutable runtime instance. Once an execution reaches a terminal state (`success` or `failed`), its status never changes. New pipeline runs create new execution records.

## State Definitions

| State | Type | Description |
|---|---|---|
| `queued` | Initial | Execution created and awaiting resource allocation. Set by API endpoints before dispatch, or by API callers that pre-create the execution record. |
| `processing` | Active | Pipeline steps actively executing (plan, design_system, preview, scoring, scaffold, deploy). |
| `success` | Terminal | All pipeline steps completed without unhandled errors. The pipeline output (preview, score) is available. |
| `failed` | Terminal | One or more pipeline steps threw an unrecoverable error. Execution errors array contains diagnostic details. |

## Allowed Transitions

```
queued ───→ processing ───→ success
                │
                └───→ failed

processing ───→ failed (any step)
queued ───→ failed (dispatch failure)
```

### Transition Matrix

| From \ To | queued | processing | success | failed |
|---|---|---|---|---|
| queued | — | ✓ | — | ✓ |
| processing | — | — | ✓ | ✓ |
| success | — | — | — | — |
| failed | — | — | — | — |

## Rules

### 1. Execution ≠ Project State

Project state (`draft → preview → approved → deployed`) and execution state (`queued → processing → success/failed`) are independent lifecycles. An execution reaching `failed` does not change the project's milestone state. A project in `preview` can accumulate multiple successful and failed executions.

### 2. Immutable Per Run

An execution ID maps to exactly one pipeline attempt. Once an execution enters `success` or `failed`, no further transitions occur. The status column is updated only via `finalizeExecution()` (guarded by `assertExecutionStatus`) or `pushExecutionError()` (hardcodes `failed`).

### 3. Final State Only

`finalizeExecution()` accepts any valid status. `pushExecutionError()` always sets the execution to `failed` and records the error payload. No other code path modifies execution status.

### 4. Concurrent Execution Prevention

A project cannot have two active executions simultaneously. The runtime does not enforce this at the DB level; callers must check for active executions (`WHERE status = 'processing'`) before dispatching.

## Validation

The runtime enforces a status whitelist at the application layer:

```js
const EXECUTION_STATUSES = Object.freeze({
  QUEUED: 'queued',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
});
```

`finalizeExecution()` calls `assertExecutionStatus()` before issuing any UPDATE. Invalid status values throw `INVALID_INPUT` before reaching the database.

The database enforces the same whitelist via a CHECK constraint:

```sql
CHECK (status IN ('queued', 'processing', 'success', 'failed'))
```

## Example Lifecycle

```
Project: draft
  │
  ├── runPipeline({ project_id: "abc", ... })
  │     └── Execution: queued → processing → success
  │         └── Project: draft → preview
  │
  ├── runPipeline({ project_id: "abc", ... })   [re-run]
  │     └── Execution: queued → processing → success
  │         └── Project: preview (unchanged)
  │
  ├── runPipeline({ project_id: "abc", ... })   [error]
  │     └── Execution: processing → failed
  │         └── Project: preview (unchanged)
  │
  └── approveProject({ project_id: "abc", ... })
        └── Execution: processing → success
            └── Project: preview → approved → deployed
```

## Execution ID Contract

`execution_id` is **optional** in `runPipeline()`. When omitted:

- The runtime generates a UUID via `crypto.randomUUID()`
- An execution record is inserted with `status='processing'` and `triggered_by=NULL`
- The generated ID is used as the `executions.id` primary key

When provided:

- Must be a non-empty string (validated by `normalizeProjectId`)
- Non-UUID values are auto-converted to UUID via `crypto.randomUUID()`
- The caller is responsible for ensuring the ID is unique in the `executions` table
- Existing API callers that pre-create execution records continue to work via `ON CONFLICT (id) DO NOTHING`

### Resolution Priority

```
executionId provided?
  ├── Yes → normalizeProjectId → isUUID? keep : uuid()
  └── No  → uuid() (auto-generate)
```

## Code Reference

| Function | File | Role |
|---|---|---|
| `finalizeExecution()` | `lib/runtime/index.js:135` | Updates execution status with validation |
| `pushExecutionError()` | `lib/runtime/index.js:130` | Sets status to `failed` with error payload |
| `assertExecutionStatus()` | `lib/runtime/index.js:27` | Validates status against whitelist |
| `EXECUTION_STATUSES` | `lib/runtime/index.js:18` | Status enum constant |

## Related

- [Execution vs Project Separation](../architecture/execution-vs-project-separation.md)
- [Migration 004: Status Normalization](../migrations/004-execution-status-normalization.md)
- [ADR-001: Execution Lifecycle Design](../adr/001-execution-lifecycle-design.md)
