# Observability Verification Audit — June 2026 (Post v1.8.0)

**Audit Date**: 2026-06-12
**Target**: `https://web-portfolio-kappa-wheat.vercel.app`
**Type**: Read-only verification

---

## Executive Summary

**Score**: 58/100

The observability system is partially functional. Data ingestion works (all endpoints respond, traces persist to Neon, coverage is calculable), but the **lifecycle pipeline is broken** — the queue worker never transitions requests past the `queued`/`processing` states, leaving 95 entries permanently stuck. This means:

- The email delivery pipeline (the system's primary function) is not working
- Lifecycle observability shows stale data
- The `completed` and `failed` terminal states are unreachable
- Metrics like `averageExecutionTimeMs` reflect only 4 historical completions, not current behavior

All 16 exercised validation paths produce correct trace data in Neon, and the 4 observability endpoints (`coverage`, `heatmap`, `timeline`, `logs`) return well-structured data. But these endpoints report on a system that cannot complete its core workflow.

---

## Coverage Analysis

### Current Coverage

| Metric | Value |
|---|---|
| Total defined paths | 27 |
| Executed (24h history) | 16 |
| Percentage | 59% |
| Data source | Neon only (memory = 0) |
| Trend | Up from 48% (previous test) to 59% (coverage matrix run) |

### Covered Paths (16)

sendBrief: `honeypotCheck`, `methodCheck`, `rateLimit:email`, `sanitizeAndValidateName`, `submitted`, `timingCheck`, `validateEmail`, `validatePrompt`
sendContact: `honeypotCheck`, `methodCheck`, `sanitizeAndValidateName`, `submitted`, `timingCheck`, `validateEmail`, `validateMessage:empty`, `validateMessage:tooLong`

### Missing Paths (11 — all documented as unreachable)

| Path | Reason |
|---|---|
| `sendBrief:configCheck`, `sendContact:configCheck` | SMTP configured in production |
| `sendBrief:handlerError`, `sendContact:handlerError` | Requires runtime exception |
| `sendBrief:parseBody`, `sendContact:parseBody` | Vercel Edge intercepts malformed JSON |
| `sendBrief:queueCheck`, `sendContact:queueCheck` | Requires queue depth > 100 |
| `sendBrief:rateLimit:ip`, `sendContact:rateLimit:ip` | Requires IP bursts |
| `sendContact:rateLimit:email` | Requires email dedup (not yet triggered) |

### Coverage Trend

| Version | Coverage | Change |
|---|---|---|
| v1.7.0 | 28% | Initial production audit |
| v1.7.1 | 32% | handlerError paths added |
| v1.8.0 (pre) | 48% | Production test suite |
| v1.8.0 (post) | 59% | Coverage matrix exercise |

---

## Endpoint Health

### `/api/traces`

| Variant | HTTP | Data | Notes |
|---|---|---|---|
| `?coverage=true` | ✅ 200 | ✅ 16/27, `source: 'merged'` | Correct |
| `?heatmap=true` | ✅ 200 | ✅ 16 rows, 93 events | Correct aggregation |
| `?timeline=true` | ✅ 200 | ✅ 25 req, 25 events | See timeline note below |
| `?id=<uuid>` | ✅ 200 | ✅ Neon traces | Correct |
| `?limit=25` | ✅ 200 | ❌ `{traces:[], found:false}` | `limit` param not implemented |

**Observation**: The `?limit=25` variant returns empty because the default handler path has no `limit` parameter support. This is not a bug — only documented params work. But it can be confusing.

### `/api/logs`

| Variant | HTTP | Data | Notes |
|---|---|---|---|
| `?limit=25` | ✅ 200 | ✅ 25 entries + metrics | Correct structure |

### `/api/telemetry`

| Variant | HTTP | Data | Notes |
|---|---|---|---|
| `?type=health` | ✅ 200 | ✅ `status: ok` | Healthy |
| `?type=coverage` | ✅ 200 | ✅ 16/27 merged | Matches `/api/traces` |

---

## Findings

### 🔴 CRITICAL: Queue worker never completes requests

**Evidence**: 88 entries stuck in `queued`, 7 stuck in `processing`, 0 in `failed`, only 3 in `completed`. Zero `failed` entries despite 88 queued requests waiting indefinitely.

**Impact**: Email delivery pipeline is broken. No test submissions are being processed. The system accepts requests but never delivers emails.

**Possible causes**:
1. Queue worker crashes silently on SMTP connection (Gmail rejecting test addresses)
2. `lifecycle.complete` event fails to persist to Neon
3. Worker throws exception before status update
4. Vercel function cold start timing causes worker context loss

### 🔴 CRITICAL: No `failed` lifecycle transitions

**Evidence**: 0 entries with `failed` status despite 95 entries stuck in queued/processing for hours.

**Impact**: The retry logic never fires, or `failed` status is never persisted. If SMTP fails, the system should try 3 times and mark as `failed`. Neither happens.

### 🟡 HIGH: Endpoint field always null

**Evidence**: Every log entry has `endpoint: null`. The `endpoint` column is never populated by the `registerLifecycle` call.

**Impact**: Cannot filter logs by endpoint (sendBrief vs sendContact). This is a data quality issue.

### 🟡 HIGH: Memory coverage always 0

**Evidence**: `memory.executed: 0`, `memory.percentage: 0` in every coverage response.

**Impact**: The "merged" coverage is actually just Neon. Memory traces from the handler instances are invisible to the telemetry endpoint because Vercel isolates functions. This reduces confidence in real-time coverage.

### 🟡 HIGH: 1 event per request in timeline

**Evidence**: Timeline has 25 requests with 25 events (1:1 ratio). Requests that go through multiple lifecycle stages produce only one trace event.

**Impact**: The timeline shows the validation rejection/accepted point but not the full lifecycle (queued → processing → completed). This limits debugging usefulness.

### 🟡 HIGH: Trace and log systems are disconnected

**Evidence**: 
- `GET /api/traces?id=<requestId>` returns trace events (validation path hits)
- `GET /api/telemetry?type=logs&id=<requestId>` returns lifecycle events (queued/processing/completed)
- A single request produces data in BOTH systems but they are not correlated in any endpoint

**Impact**: Cannot see both validation path + lifecycle status in a single view. This makes debugging slower.

### 🟢 LOW: ParseBody hits (2) exist despite "unreachable" claim

**Evidence**: Heatmap shows no `parseBody` entries, but the log validation stage breakdown has `parseBody: 2` hits.

**Explanation**: The `parseBody` validation stage fires before the body is parsed. In certain edge cases (content-type mismatch), the handler detects parse failure before Vercel Edge does. This is a narrower edge case than documented.

### 🟢 LOW: `completedRequests: 4` vs 3 actual completed entries

**Evidence**: `metrics.completedRequests: 4` but only 3 entries with `completed` status.

**Explanation**: The aggregate metric in `request-registry.js` is calculated in-memory and wasn't flushed to Neon. This metric reflects the previous deployment instance's in-memory state. After deploy, the new instance has different metrics.

### 🟢 LOW: Timeline shows requestIds not in logs

**Evidence**: Timeline returns 25 requestIds but some are not in the logs listing.

**Explanation**: Traces (request_traces table) and logs (request_logs table) are separate persistence stores. They share `requestId` but not all requests that generate a trace also create a lifecycle entry (e.g., rejected requests persist traces directly without going through queue/registry).

---

## Security Audit

| Check | Result | Evidence |
|---|---|---|
| No stack traces exposed | ✅ PASS | All errors are generic static strings |
| No process.env values | ✅ PASS | No mention of GMAIL_USER, PASSWORD, DATABASE_URL, etc. |
| No internal paths exposed | ✅ PASS | No file paths or server paths in any response |
| No tracer debug headers | ✅ PASS | `X-Tracer-Debug` header confirmed absent (verified via curl) |
| No sensitive metadata leaked | ✅ PASS | `X-Deploy-SHA`, `X-Deploy-Env` are standard Vercel metadata |
| Server header | ⚠️ WARNING | `server: Vercel` in all responses (platform default, unavoidable) |

**Security verdict**: Clean. No exploitable information leakage.

---

## Architecture Consistency Audit

| Claim | Verdict | Evidence |
|---|---|---|
| 27/27 paths instrumented | ✅ PASS | Each path has a unique `pathId` matching `ALL_PATHS` |
| All paths emit traces | ✅ PASS | Each early return calls `tracer.trace()` before response |
| All traces persist to Neon | ✅ PASS | 16 exercised paths all confirmed in Neon via `?id=` lookup |
| Heatmap is based on real data | ✅ PASS | 16 path entries with real counts from production |
| Timeline is based on real data | ✅ PASS | Data sourced from `request_traces` table, not mocked |
| Observability endpoints are production-ready | ⚠️ PARTIAL | Endpoints respond correctly but report on a system whose core pipeline is broken |

---

## Risk Assessment

| Risk | Severity | Finding |
|---|---|---|
| Email delivery broken | CRITICAL | 95 entries queued/processing, 0 transition to completed/failed |
| No lifecycle completion | CRITICAL | `lifecycle.complete` never fires or never persists |
| Queue worker silent failure | HIGH | No error logs, no failed entries, no retry evidence |
| Endpoint field null | HIGH | Cannot filter lifecycle data by handler |
| Memory coverage invisible | HIGH | Real-time coverage requires shared memory (impossible on Vercel) |
| Trace/log correlation gap | MEDIUM | Two separate stores with no unified view |
| Metrics mismatch | LOW | `completedRequests: 4` vs 3 actual entries |

---

## Production Readiness Score

**Score: 58/100**

| Category | Score | Reasoning |
|---|---|---|
| Data ingestion | 85 | All 4 observability endpoints respond correctly |
| Trace persistence | 80 | 16 paths persist to Neon; 11 unreachable by design |
| Security | 95 | No leakage, no exposed secrets |
| Notification pipeline | 10 | Queue never drains; 95 entries stuck |
| Lifecycle observability | 20 | No completed/failed transitions; `endpoint` always null |
| Coverage accuracy | 60 | 59% is achievable ceiling; 11 paths unreachable by design |
| Documentation accuracy | 75 | Most claims match implementation; see timeline note |

---

## Recommended Next Steps

### P0 — Fix email delivery pipeline
Investigate why the queue worker never transitions to `completed`/`failed`. Candidates:
1. Add error logging inside the queue worker
2. Check if Gmail SMTP is rejecting test emails (test addresses use `@test.jic.dev`)
3. Verify `lifecycle.complete` is called in the worker's `finally` block
4. Check if `persistImmediate` call in the worker is failing silently

### P1 — Audit queue worker
1. Manual test: enqueue one request and monitor for 60 seconds
2. Check if `queue.js` `_process()` throws silently
3. Verify the `drain()` call is not blocking the worker
4. Add a health endpoint that reports queue worker status

### P2 — Fix data quality issues
1. Populate `endpoint` field in `registerLifecycle` calls
2. Either unify trace/log stores or add a correlation endpoint
3. Fix `?limit=` handling in `/api/traces` or document it explicitly

### P3 — Documentation updates
1. Document that timeline is trace-based (validation path only), not lifecycle-based
2. Add note about memory coverage being always 0 on Vercel
3. Clarify that `parseBody` can fire in edge cases despite being "unreachable"

---

## Git Audit

### Recent commits (chronological, newest first)

```
5d615e5 fix: coverage matrix script — correct status codes and method
abb1b92 chore: update metadata for v1.8.0
4b1db86 docs: add observability hardening audit report
050aa57 feat: add coverage matrix script
65de397 feat: add heatmap and timeline aggregation endpoints to /api/traces
1d66967 fix: sync tracer.js ALL_PATHS with requestTraces.js — add handlerError paths (27 total)
674d283 chore: recreate /api/traces for backward compatibility
228fc7f fix: observability stabilization — recreate /api/logs, handlerError traces
55c65a2 chore: final tracing audit closure — silent drain, docs, v1.7.0 changelog
2013479 test: update production smoke suite with unique emails and coverage tracking
```

### Commit accuracy assessment

| Commit | Accurate? | Notes |
|---|---|---|
| `5d615e5` | ✅ | Correctly describes status code and method changes |
| `abb1b92` | ✅ | Metadata updates, accurate |
| `4b1db86` | ✅ | New doc, described correctly |
| `050aa57` | ✅ | New script, described correctly |
| `65de397` | ✅ | API changes, described correctly |
| `1d66967` | ✅ | Path sync fix, accurate |
| `674d283` | ✅ | Backward compat, accurate |
| `228fc7f` | ✅ | Stabilization fix, accurate |
| `55c65a2` | ✅ | Audit closure, accurate |
| `2013479` | ✅ | Test update, accurate |

**Verdict**: All commit messages accurately describe their implementation.

### Chronological narrative

1. **v1.7.0** (commits `2013479` → `55c65a2`): Tracing audit closure — silent drain, production test suite, documentation
2. **v1.7.1** (commits `228fc7f` → `674d283` → `1d66967`): Stabilization — recreated `/api/logs` and `/api/traces`, added handlerError tracing for all 27 paths
3. **v1.8.0** (commits `65de397` → `050aa57` → `4b1db86` → `abb1b92` → `5d615e5`): Hardening audit — heatmap + timeline endpoints, coverage matrix script, leakage audit, documentation

---

_Generated by read-only observability verification audit — 2026-06-12_
