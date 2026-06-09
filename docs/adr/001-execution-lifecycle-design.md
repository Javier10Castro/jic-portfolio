# ADR-001: Execution Lifecycle Design

**Status:** Accepted  
**Date:** 2026-06-09  
**Deciders:** Javier Ibrahim, Agent Pack v2.0  
**Version:** 2.0.0  
**Tags:** runtime, state-machine, execution, migration

## Context

The Agent Pack SaaS Runtime Layer v1 originally used a single `projects.status` column to track both project milestones and pipeline execution state. The status enum contained 7 values: `draft`, `processing`, `preview`, `completed`, `deploying`, `deployed`, `failed`, `cancelled`.

This design created several structural problems:

- **State machine ambiguity**: The `processing` and `failed` statuses conflated "the project is being processed" with "the pipeline engine is processing." A project stuck in `processing` due to a crashed worker could never be recovered without manual SQL intervention.
- **No re-run capability**: The state machine defined `preview → processing` as the only transition for re-running. This was both semantically incorrect (a preview project is not "processing," it is being re-processed) and blocked by the state machine guard when the project was already in `preview`.
- **Dead state values**: `cancelled` was defined in the CHECK constraint but never written by any code path. `deploying` was used as a transient state during deployment but violated the state machine's own transition rules (self-transition was undefined).
- **Observability gap**: With a single status column, there was no way to differentiate "the project has never been processed" from "the project succeeded and is now in preview." The runtime could not support execution history, per-step diagnostics, or failure rate tracking.

## Decision

We will decouple execution lifecycle from project lifecycle by introducing a separate `executions` table with its own independent state machine.

### Specific Decisions

1. **Project status tracks only milestones**: `draft → preview → approved → deployed`. No runtime states. No `processing`, `failed`, `deploying`, or `cancelled`.

2. **Execution status tracks runtime only**: `queued → processing → success | failed`. No project lifecycle vocabulary. Terminal states are `success` (not `completed`) and `failed` (not `cancelled`).

3. **Execution is the observational unit**: Each pipeline run creates a new execution record with independent status, step diagnostics, and error tracking. The execution table is the source of truth for pipeline health.

4. **Status validation is layered**: Application-level whitelist (`EXECUTION_STATUSES` constant, validated by `assertExecutionStatus()`) and database-level CHECK constraint provide defense in depth.

5. **No state machine coupling**: Project transitions and execution transitions are independent code paths. `transition()` updates `projects.status`. `finalizeExecution()` updates `executions.status`. Neither function calls the other.

6. **Legacy migration**: Existing `completed` values are migrated to `success`. Existing `cancelled` values are migrated to `failed`. The old CHECK constraint is replaced with the new whitelist.

## Consequences

### Positive

- **Re-runs are now safe**: `runPipeline()` on a `preview` project creates a new execution without touching project milestone state. The guard accepts `draft` and `preview` only.
- **Observability is first-class**: Execution history with per-step timing, error aggregation, and status tracking is built into the schema.
- **Recovery is deterministic**: A crashed pipeline leaves the project milestone unchanged. The operator can inspect the failed execution and re-run without manual state correction.
- **State space is minimal**: 4 project states + 4 execution states = 8 total states, down from the original 7 conflated states. The reduced surface area simplifies monitoring, alerting, and dashboard logic.
- **Deployment failures are isolated**: A failed scaffold or deploy step leaves the project in `approved`. A retry can be triggered without violating state machine rules.

### Negative

- **More DB rows**: Each pipeline run creates an execution record. At scale, the `executions` table requires partitioning or retention policies.
- **Cross-table queries**: Dashboards must JOIN `projects` and `executions` to answer questions like "which projects have a recent failure?" This is an acceptable cost for the separation of concerns.
- **Migration requires atomic deployment**: The code change (`completed` → `success`) and the migration (CHECK constraint update) must be deployed together. A code-only deploy without the migration causes DB constraint violations.

## Alternatives Considered

### Alternative A: Keep Single Status Column, Simplify Enum

Reduce the project status enum to `draft`, `preview`, `approved`, `deployed`, `failed` and store execution status in a separate JSONB column on the project row.

**Rejected because:**
- JSONB columns cannot enforce status validation at the DB level.
- Querying "all failed executions" requires scanning the JSONB column across all projects.
- No execution history without complex array manipulation.
- Still conflates project lifecycle with execution lifecycle at the semantic level.

### Alternative B: Keep `completed` and `cancelled`

Rename `completed` to `success` via code only (no DB migration) and keep `cancelled` for future use.

**Rejected because:**
- DB CHECK constraint and application whitelist would diverge, creating a validation gap.
- `cancelled` is dead code with no implementation path. Removing it eliminates maintenance burden.
- The `completed` → `success` rename requires a migration regardless; skipping `cancelled` cleanup adds no complexity savings.

### Alternative C: Soft-Delete Execution Table

Keep the existing schema and add an `executions` table alongside it, leaving `projects.status` dual-purpose.

**Rejected because:**
- Dual-purpose status columns are a known anti-pattern. Maintaining both the old and new systems increases cognitive load.
- The migration is straightforward and data-safe. There is no benefit to retaining the old schema.
- Future engineers would need to understand why both systems exist, adding documentation debt.

## References

- [Execution State Machine](../runtime/execution-state-machine.md)
- [Migration 004: Status Normalization](../migrations/004-execution-status-normalization.md)
- [Execution vs Project Separation](../architecture/execution-vs-project-separation.md)
- `lib/runtime/index.js` — runtime implementation
- `data/migrations/004_normalize_execution_status.sql` — migration script
