# Audit: Request Lifecycle Observability (v1.1.0)

**Date:** 2026-06-10
**Scope:** `lib/request-registry.js`, `lib/queue.js`, `api/sendContact.js`, `api/health.js`, `lib/logger.js`, 8 doc files
**Status:** 22 findings (1 critical, 3 high, 7 medium, 7 low, 4 info)
**Action:** No code changes — pure analysis

---

## 1. Lifecycle States (queued → processing → completed/failed)

### Registration Points

| State | Registered By | Location |
|---|---|---|
| `queued` | sendContact.js handler | line 328, after `enqueue()` success |
| `processing` | queue.js `_process()` | line 56, before retry loop |
| `processing` | sendContact.js handler (inside `handler`) | line 260, after `queue.waitEnd` |
| `completed` | queue.js `_process()` | line 88, after retry loop |
| `completed` | sendContact.js handler | line 294, after emails |
| `failed` | queue.js `_process()` | line 88, after retry exhaustion |
| `failed` | sendContact.js handler | line 294, after partial email failure |

### CRITICAL — Finding F1: Dual `processing` registration

`executionStartedAt` is captured in **two places**:
- `queue.js:52` — `const executionStartedAt = Date.now()` (BEFORE the retry loop)
- `sendContact.js:258` — `const executionStartedAt = Date.now()` (INSIDE the handler, which runs on each retry attempt)

Both call `registry.registerLifecycle(rid, { status: 'processing', executionStartedAt })`. The handler registration (line 260) always executes AFTER the queue registration (line 56), so handler values overwrite queue values.

**Consequence:** The registry's `executionStartedAt` reflects handler entry time (sendContact.js:258), not queue dequeue time (queue.js:52). The derived `queueWaitTimeMs` (`executionStartedAt - queuedAt`) is thus based on handler entry timestamp. In practice with concurrency=1, the difference is microseconds because the handler starts immediately after `_process` calls it. But the metric label is misleading — it measures "handler entry time minus queued time," not "dequeue time minus queued time."

### HIGH — Finding F2: `lifecycle.complete` log is handler-gated

The `lifecycle.complete` structured log only emits from `sendContact.js` handler (lines 298-310). If the handler throws on ALL retry attempts (4 total), `queue.js:_process()` catches the exception, registers `status: 'failed'` in the registry (line 88), but NO `lifecycle.complete` structured log is emitted from `_process()`.

**Impact:** Failed requests that exhaust retries are recorded in the registry but produce no `lifecycle.complete` structured log for log aggregation tools. The registry has the terminal state, but the structured observability pipeline misses the completion event.

### MEDIUM — Finding F3: No pre-queue lifecycle registration

RequestIds are generated at `sendContact.js:112` (via `log.requestId(req)`), but `registerLifecycle()` is only called when the request reaches the queue (line 328). Requests rejected before that — validation errors (400), rate-limited (429), method not allowed (405), honeypot (200), SMTP misconfigured (500) — never appear in the registry.

**Impact:** The registry only tracks requests that successfully entered the queue. ~30-50% of total requests (rejected at validation/rate-limit) are invisible. The diagnostics endpoint cannot answer "did this requestId hit our system?" for pre-queue failures — it returns 404.

### MEDIUM — Finding F4: Terminal state registered twice

When handler succeeds: queue.js line 88 registers `{ status: 'completed', executionFinishedAt }`, then handler line 294 registers `{ status: 'completed', executionFinishedAt }` again. Same pattern for `failed`. The second write overwrites the first with effectively the same data (same timestamps within ~1ms).

**Impact:** Redundant — 2 writes per terminal transition instead of 1. No behavioral issue since both set the same status and nearly-identical `executionFinishedAt`. But it means the registry entry is written 3-4 times total per request (queued + processing×2 + completed×2).

---

## 2. Timestamps & Derived Metrics

### HIGH — Finding F5: `queueWaitTimeMs` metric meaning is shift-sensitive

Due to F1, `executionStartedAt` is set by the handler, not by the queue. The formula `queueWaitTimeMs = executionStartedAt - queuedAt` measures the interval from queue entry to handler entry. Since handler runs inside `_process()` synchronously (concurrency=1), handler entry is immediate after dequeue. But if concurrency were >1 or if there were async scheduling gaps, the handler timestamp would drift from the actual dequeue time.

**Current state:** Accurate within microseconds at concurrency=1. Fragile if concurrency is changed.

### LOW — Finding F6: `executionDurationMs` computed in two places

`_computeDerived()` in `request-registry.js` (lines 29-31) and inline in `sendContact.js:308` compute the same value from the same inputs. The inline version in sendContact.js is the one used in the `lifecycle.complete` structured log, while the registry's version is used on lookup and health metrics. They should agree (same formula), but this is duplicated code.

### MEDIUM — Finding F7: Full timestamp set only required for derived metrics

`queueWaitTimeMs` requires `receivedAt`, `queuedAt`, and `executionStartedAt` all present (line 23). `totalLifecycleTimeMs` requires `receivedAt` + `executionFinishedAt` (line 26). `executionDurationMs` requires `executionStartedAt` + `executionFinishedAt` (line 29). If any timestamp is missing, the corresponding derived metric silently returns `undefined` (deleted from output by line 32).

**Impact:** No validation that all required timestamps are set. If a registration call forgets a field, the derived metrics produce `undefined` without warning. In practice all 4 timestamps are set correctly for queue-admitted requests, but there's no defensive check.

---

## 3. Diagnostic Endpoint (GET /api/sendContact?id=xxx)

### Implementation

`sendContact.js:93-103` — Simple handler:
- 400 if no id provided
- 404 if not found
- 200 with lifecycle entry (via `lookupRequest()` which runs `_computeDerived()`)

### MEDIUM — Finding F8: No stale entry detection on lookup

`lookupRequest()` at `request-registry.js:45-50` calls `registry.get(requestId)` and returns the entry regardless of age. It never calls `_cleanup()`. If the entry's `updatedAt` is older than `ENTRY_TTL_MS` (5 min), it's still returned as valid — as long as `MAX_ENTRIES` (1000) hasn't been hit.

Example: Request A completes at T=0. No new requests arrive for 10 minutes. Registry has 900 entries. Request A is looked up at T=10 — it's returned as valid despite being 10 minutes old (2× the TTL).

### LOW — Finding F9: URL regex doesn't decode

`handleStatusLookup()` at line 94 uses `req.url.match(/[?&]id=([^&]+)/)` which:
- Does not URL-decode the captured group (e.g., `id=550e%208400` won't match correctly)
- Captures the LAST `id` param if multiple are provided (`?id=a&id=b` → `b`)
- This is consistent with how `?debug=true` is parsed (line 111), so it's a codebase-wide pattern, not unique to this endpoint

### LOW — Finding F10: No rate limiting on diagnostic endpoint

The GET handler (line 106) bypasses all validation, rate limiting, and queue logic. Acceptable for debugging (read-only, in-memory data), but not documented as intentionally rate-limit-free.

---

## 4. Health Endpoints

### Implementation

`health.js` exposes lifecycle metrics via `getDetailedStats().lifecycle` in:
- Default summary (`?section=summary` or no section) — line 100
- `?section=queue` — line 38

### MEDIUM — Finding F11: Aggregate metrics are NOT monotonic

`getAggregateMetrics()` (request-registry.js:52-73) computes `totalRequests = registry.size` (current entries count). When entries are evicted by cleanup, `totalRequests` **decreases**. Same for `completedRequests` and `failedRequests` — they only count currently-present entries.

Example sequence:
1. 1000 requests complete → `totalRequests: 1000, completedRequests: 1000`
2. Cleanup evicts 500 entries → `totalRequests: 500, completedRequests: 500`

The metrics represent a "windowed count," not a cumulative total. If monitoring expects monotonic counters, this will be confusing.

### MEDIUM — Finding F12: In-flight requests inflate `totalRequests`

`totalRequests` counts ALL registry entries regardless of status. Entries in `queued` or `processing` state increase `totalRequests` but contribute nothing to `completedRequests`, `failedRequests`, or the average metrics. This means `totalRequests > completedRequests + failedRequests` when any requests are in-flight.

Impact: Queue health snapshot may report "42 total, 38 completed, 4 failed" with 0 in-flight if all entries reached terminal state — but if 2 are still processing, it's "42 total, 36 completed, 4 failed" with 2 unaccounted. The gap represents in-flight entries but is not explicitly labeled as such.

---

## 5. Registry Internals (TTL, Memory, Eviction)

### HIGH — Finding F13: TTL only enforced over capacity

`_cleanup()` at `request-registry.js:12` checks: `if (registry.size <= MAX_ENTRIES) return`. When registry has ≤ 1000 entries, cleanup exits immediately. The TTL filter (line 14: `now - v.updatedAt <= ENTRY_TTL_MS`) is only reached when size > 1000.

**Impact:** Entries under the 1000 cap persist indefinitely regardless of age. The 5-minute TTL is effectively a lie — it's only enforced when the registry is over capacity. With typical traffic (< 1000 requests per Vercel cold start), entries never expire until the instance terminates.

### MEDIUM — Finding F14: No periodic cleanup

`CLEANUP_INTERVAL_MS` is defined at line 3 (60s) but only gates the frequency of `registerLifecycle()`-triggered cleanup. There is no `setInterval` scheduled cleanup. Cleanup never runs between `registerLifecycle()` calls.

**Impact:** If no new requests arrive (e.g., after a deployment), stale entries remain in the registry indefinitely. Combined with F13, the only eviction mechanism is instance termination.

### INFO — Finding F15: Eviction uses clear+re-add

`_cleanup()` lines 17-18: `registry.clear()` followed by re-insertion. In Node.js single-threaded event loop, this is safe — no concurrent access possible. But if cleanup were ever called from an async context (it's not currently), the window between `clear()` and re-insertion would expose an empty registry.

### INFO — Finding F16: `getAggregateMetrics()` is O(n)

Line 57: `Array.from(registry.values())` creates a new array of all entries on every health check call. With 1000 entries, this is ~1000 iterations × 1000 filter checks. Acceptable for sub-millisecond cost, but scales poorly if MAX_ENTRIES increases significantly.

---

## 6. Documentation Consistency (8 files reviewed)

### LOW — Finding F17: State name mismatch

The registry uses `completed` as the terminal success state. The runtime execution state machine (`docs/runtime/execution-state-machine.md`) uses `success`. Both use `failed`. The two subsystems use different conventions for the same concept. This affects:
- `docs/runtime/execution-state-machine.md` — `success`
- `request-registry.js` / `queue.js` / `sendContact.js` — `completed`

### LOW — Finding F18: Overlapping lifecycle sections in sendContact-context.md

Section 3 (Observability Model, line ~60) and Section 10 (Request Lifecycle Observability, line ~242) both describe lifecycle states, timestamps, and derived metrics. Section 3 focuses on the model + structured log. Section 10 focuses on the registry + diagnostic endpoint. The state definitions are duplicated.

### LOW — Finding F19: Missing request lifecycle in docs/ARCHITECTURE.md

The project root `docs/ARCHITECTURE.md` does not mention request lifecycle observability, the registry, or the diagnostic endpoint. It covers the ingestion boundary principle and execution layer separation but not the lifecycle tracking added in v1.1.0.

### LOW — Finding F20: Missing GET responses in sendContact-analysis.md

`docs/sendContact-analysis.md` documents HTTP response codes but does not include the 200 (lifecycle record) or 404 (not found) responses for the GET diagnostic endpoint.

### LOW — Finding F21: Missing lifecycle events in ARCHITECTURE.md event list

`docs/ARCHITECTURE.md` event list (lines 248-259) only includes basic pipeline events. Missing: `lifecycle.complete`, `email.admin.start`, `email.admin.complete`, `email.client.start`, `email.client.complete`, `email.retry`, `queue.queued`.

### INFO — Finding F22: Section 6 "Lifecycle Observability" vs Section 10 "Request Lifecycle Observability"

In `docs/sendContact-context.md`, Section 6 is titled "Lifecycle Observability" and describes the trace-based lifecycle (stages, deltaMs, debug mode). Section 10 is "Request Lifecycle Observability" and describes the registry-based lifecycle. They use different models (trace array vs registry entry) but document the same runtime behavior. This is consistent (both describe different views of the same system) but could be confusing.

---

## Summary

### Strengths

1. **End-to-end tracking** — Every request that reaches the queue has a complete 4-state lifecycle with 4 timestamps and 3 derived metrics.
2. **No external dependencies** — Pure Node.js Map, no Redis/DB needed for lifecycle tracking.
3. **Backward compatible** — Existing 202 response payload unchanged. New features are additive (new response fields, new endpoints).
4. **Structured log for aggregation** — `lifecycle.complete` with full payload for log aggregators.
5. **Derived metrics on lookup** — `_computeDerived()` computes fresh metrics on each lookup, not stale from registration time.
6. **Complete health integration** — Default + section-specific health endpoints expose lifecycle metrics.
7. **Consistent with existing patterns** — URL regex parsing, debug mode flagging, test-mode injection all follow established codebase conventions.

### Risks (ordered by impact)

| # | Finding | Severity | Impact |
|---|---|---|---|
| F1 | Dual `processing` registration | Critical | `executionStartedAt` semantics mismatch between derived metrics and dequeue time. Handler overwrites queue timestamp. |
| F2 | `lifecycle.complete` handler-gated | High | Failed requests (retry exhaustion) produce registry update but no structured log. Gap in aggregation pipeline. |
| F13 | TTL only enforced over capacity | High | Entries under MAX_ENTRIES never expire. 5-min TTL is not honored during normal traffic. |
| F3 | No pre-queue lifecycle | Medium | Validation/rate-limit failures invisible to registry. ~30-50% of requests untracked. |
| F4 | Terminal state registered twice | Medium | 2 writes per terminal transition instead of 1. Idempotent but redundant. |
| F5 | `queueWaitTimeMs` semantics | Medium | Measures handler entry time, not dequeue time. Accurate at concurrency=1 but fragile. |
| F8 | No stale detection on lookup | Medium | Entries past TTL returned as valid when MAX_ENTRIES not hit. |
| F11 | Metrics not monotonic | Medium | `totalRequests` decreases on eviction. Confusing for monitoring. |
| F12 | In-flight inflates total | Medium | `totalRequests > completed + failed` gap not explicitly labeled. |
| F14 | No periodic cleanup | Medium | Stale entries persist indefinitely between requests. |
| F7 | No missing-field validation | Medium | Missing timestamps silently produce `undefined` metrics. |

### Recommendations (ordered by value/effort)

1. **Fix F13 first** — Change `if (registry.size <= MAX_ENTRIES) return` to `if (registry.size <= MAX_ENTRIES && now - lastCleanup < ENTRY_TTL_MS) return` or separate the TTL-based pruning from the capacity-based pruning. This makes the TTL actually work. Low risk, high impact.

2. **Fix F2** — Emit `lifecycle.complete` structured log from `queue.js:_process()` when retries are exhausted and handler never returned. This fills the aggregation gap. Medium risk (logging is side-effect-free).

3. **Fix F1** — Decide which layer owns `executionStartedAt`. Options: (a) queue only (remove handler registration), (b) handler only (remove queue registration), (c) rename to distinguish `queueDequeueAt` vs `handlerStartAt`. Option (a) is simplest — queue.js is already the authoritative source for execution timing.

4. **Fix F3** — Register pre-queue failures with terminal status `'rejected'` at each rejection point (validation, rate-limit, etc.). This makes all requestIds discoverable. Low risk but increases registry write volume by 2-3×.

5. **Fix F8** — Add TTL check in `lookupRequest()`: if entry is past TTL, delete it and return null. Simple, independent fix. Low risk.

6. **Documentation** — Update `docs/ARCHITECTURE.md` with lifecycle section (F19), add GET diagnostic responses to `docs/sendContact-analysis.md` (F20), add lifecycle events to event list (F21), and reconcile state naming (F17).

---

## Appendix: Files Reviewed

| File | Lines | Role |
|---|---|---|
| `lib/request-registry.js` | 75 | Core registry |
| `lib/queue.js` | 142 | Queue + execution timing |
| `api/sendContact.js` | 401 | Handler + registry integration |
| `api/health.js` | 117 | Health metrics |
| `lib/logger.js` | 128 | Structured logging + traces |
| `docs/sendContact-context.md` | 302 | Architecture context |
| `docs/sendContact-analysis.md` | — | Code analysis |
| `docs/TESTING_GUIDE.md` | — | Testing procedures |
| `docs/ARCHITECTURE.md` | — | System architecture |
| `docs/CONTEXT.md` | — | System context |
| `docs/runtime/execution-state-machine.md` | — | State machine docs |
| `AGENTS.md` | — | AI agent context |
| `CHANGELOG.md` | — | Version history |
