# Execution vs Project Separation

## Problem Statement

The original runtime design coupled execution state (`processing`, `failed`) with project milestone state (`draft`, `preview`, `approved`, `deployed`). A single `projects.status` column served both purposes, creating three systemic issues:

1. **Invalid transitions**: Calling `runPipeline()` on a project in `preview` state triggered `Invalid state transition: preview → processing` because the state machine conflated project milestones with runtime operations.

2. **No re-run capability**: A project could only be processed once. The `processing` state blocked subsequent pipeline invocations even when the pipeline was idle.

3. **State space explosion**: The project state machine grew to 8 states (`draft`, `processing`, `preview`, `approved`, `deploying`, `deployed`, `failed`, `cancelled`), mixing product lifecycle events with infrastructure runtime events.

## Separation

The refactored architecture splits lifecycle into two independent domains:

### Project Lifecycle (Milestones)

```
draft → preview → approved → deployed
```

Tracks the product definition journey. A project starts as a `draft`, moves to `preview` after the first pipeline run, can be `approved` by a user, and finally `deployed` to production.

- States are **milestones**, not statuses.
- Transitions are **human-driven** (run, approve) or **pipeline-triggered** (first run transitions draft → preview).
- A project accumulates executions without changing its milestone.

### Execution Lifecycle (Runtime)

```
queued → processing → success
                      → failed
```

Tracks a single pipeline run. Each invocation of `runPipeline()` or `approveProject()` creates a new execution record with an independent status.

- States are **runtime statuses**, not milestones.
- Transitions are **machine-driven** (step completion, step failure).
- Terminal states (`success`, `failed`) are final and immutable.

## Data Flow

```
Frontend / API
    │
    ├── runPipeline({ project_id, execution_id?, ... })
    │     │
    │     ├── 0. Generate or validate execution_id
    │     │     ├── If omitted → crypto.randomUUID()
    │     │     ├── If provided → normalizeProjectId → isUUID? keep : uuid()
    │     │     └── Insert execution (status: processing, or ON CONFLICT DO NOTHING)
    │     ├── 1. Resolve project (read-only)
    │     ├── 2. Execute pipeline steps
    │     │     ├── plan
    │     │     ├── design_system
    │     │     ├── preview
    │     │     ├── scoring
    │     │     └── scaffold (approve only)
    │     ├── 3. Finalize execution (status: success | failed)
    │     └── 4. Optionally transition project (draft → preview)
    │
    └── approveProject({ project_id, ... })
          │
          ├── 1. Resolve project
          ├── 2. Transition project: preview → approved
          ├── 3. Create execution (status: processing) — always auto-generates ID
          ├── 4. scaffold + deploy steps
          ├── 5. Finalize execution (status: success | failed)
          └── 6. Transition project: approved → deployed (if success)
```

## Execution ID Contract

`execution_id` is **optional** in `runPipeline()`. When omitted, the runtime auto-generates a UUID via `crypto.randomUUID()` and inserts the execution record. When provided, the caller's value is validated and used as the `executions.id` primary key.

| Scenario | Behavior |
|---|---|
| `execution_id` omitted (undefined/null/empty) | `crypto.randomUUID()` generates the ID; execution inserted with `status='processing'` |
| `execution_id` provided as UUID | Used as-is; `ON CONFLICT (id) DO NOTHING` handles pre-existing records |
| `execution_id` provided as non-UUID string | Auto-converted to `crypto.randomUUID()` for DB compatibility |

This contract is possible because `execution_id` maps 1:1 to the `executions.id` primary key (which has `DEFAULT gen_random_uuid()` at the DB level). The application-layer auto-generation ensures the ID value is available before the INSERT statement executes. All callers from before the refactor continue to work unchanged.

### Key Rule

Step 2 (execution) and step 5 (project transition) are independent. An execution reaching `failed` does NOT transition the project. A project in `preview` can accumulate multiple executions:

```
Project: [preview]
  ├── Execution #1: success (score: 53.75)
  ├── Execution #2: success (score: 61.20)   [re-run]
  └── Execution #3: failed  (plan step error) [re-run]
```

The project milestone remains `preview` regardless of execution outcomes until a user calls `approveProject()`.

## Network vs Execution Layer Separation

The sendContact system demonstrates the same separation principle at a different level of the stack.

### Two Independent Layers

```
Network Gate (Rate Limit / Edge Protection)
  ─── operates BEFORE queue admission
  ─── 429 responses never reach the execution layer
  ─── per-instance sliding window (IP + email dedup)

Execution Layer (Internal Queue Scheduler)
  ─── operates AFTER gateway checks pass
  ─── FIFO in-memory queue within the Vercel instance
  ─── background SMTP workers with retry logic
```

### Key Rules

- **These systems are independent.** The queue does NOT influence rate limit decisions. Rate limit failures never reach the execution layer.
- **Queue metrics only represent admitted traffic.** Queue depth is not a proxy for total incoming request rate — it is the filtered rate after rate limiting.
- **429 errors are immediate.** The response returns before any queue state is allocated. No execution record, no queue entry, no background processing.

### Analogy: Airport Security

| Layer | Airport | sendContact |
|---|---|---|
| Gate check | Security checkpoint (documents + screening) | Rate limit (IP + email validation) |
| Execution | Boarding + flight | Queue + SMTP delivery |
| Rejected at gate | Passenger turned away, never boards | 429 returned, never queued |
| Misleading metric | Counting "people turned away at security" as "flight capacity" | Counting 429 responses as "queue pressure" |

## What Problems This Solves

### 1. No State Machine Coupling

Before: The project state machine had to account for every possible execution state. Adding a new pipeline step required updating the state machine. After: The project state machine has 4 states. The execution state machine has 4 states. They are independently maintainable.

### 2. Re-runs Enabled

Before: A project in `preview` could not be re-processed without a state machine violation. After: `runPipeline()` is idempotent on `preview` projects. It creates a new execution without touching the project milestone. The guard only prevents running on projects in `approved` or `deployed` states (where pipeline operations are meaningless).

### 3. Execution Observability

Before: The only way to know if a pipeline was running was to check `project.status === 'processing'`. A crashed pipeline left the project stuck in `processing` permanently.

After: Each execution has independent status tracking:
- `executions.steps` — per-step status, duration, result summary
- `executions.errors` — structured error array with timestamps
- `executions.completed_at` — precise completion timestamp

This enables accurate monitoring: count of failed executions in the last hour, average pipeline duration, per-step failure rates.

### 4. Simplified Caller Contract

`execution_id` is optional in `runPipeline()`. Callers no longer need to pre-generate UUIDs or manage execution identity. The runtime auto-generates the ID and inserts the execution record when omitted. Existing callers that pre-create execution records (e.g., to set `triggered_by` or `status='queued'`) continue to work via `ON CONFLICT (id) DO NOTHING`.

### 5. Deployment Failure Isolation

Before: A failed deployment transitioned the project to `deploying` (self-transition, state machine violation) or `failed`, blocking future deployment attempts.

After: A failed deployment leaves the project in `approved`. The execution record captures the failure. A retry creates a new execution against the same `approved` project milestone.

## Database Schema

```sql
-- Project: milestone state
CREATE TABLE projects (
  id     UUID PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'preview', 'approved', 'deployed')),
  ...
);

-- Execution: runtime state (independent)
CREATE TABLE executions (
  id         UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  status     VARCHAR(20) NOT NULL DEFAULT 'processing'
    CHECK (status IN ('queued', 'processing', 'success', 'failed')),
  steps      JSONB,      -- per-step status array
  errors     JSONB DEFAULT '[]',
  ...
);
```

## Code Architecture

```
lib/runtime/index.js
  ├── STATE_MACHINE          → project transitions only (4 states)
  ├── EXECUTION_STATUSES     → execution enum (4 values)
  ├── transition()           → updates project.status
  ├── finalizeExecution()    → updates execution.status (validated)
  ├── pushExecutionError()   → sets execution.status = 'failed'
  └── runPipeline()          → creates execution, runs steps, finalizes
```

## Related

- [Execution State Machine](../runtime/execution-state-machine.md)
- [Migration 004: Status Normalization](../migrations/004-execution-status-normalization.md)
- [ADR-001: Execution Lifecycle Design](../adr/001-execution-lifecycle-design.md)
