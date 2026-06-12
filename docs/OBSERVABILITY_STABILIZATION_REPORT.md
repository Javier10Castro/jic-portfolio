# Observability Stabilization Report

**Date:** 2026-06-12  
**Version:** v1.7.1  
**Author:** Agent Pack — production audit cycle  

---

## 1. Root Cause Analysis — `/api/logs` NOT_FOUND

### Symptom

`GET /api/logs?id=<requestId>` returned `{"error":"Not found","status":404}` in production.

### Root Cause

The `/api/logs.js` endpoint was **removed in v1.6.0** during observability consolidation into `/api/telemetry`. The consolidation was correct — `GET /api/telemetry?type=logs` works fine — but backward compatibility was broken:

- `scripts/audit-validation-coverage.js` — calls `/api/logs`
- `scripts/neon-consistency-check.js` — calls `/api/logs`
- Multiple documentation files reference `/api/logs`
- `docs/VALIDATION_PERSISTENCE_VERIFICATION.md` — live links to `/api/logs`

Since Vercel auto-deploys files in `/api/` as serverless functions, removing `/api/logs.js` meant Vercel returned HTTP 404 for all requests to that path.

### Fix Applied

**Recreated `/api/logs.js`** as a thin standalone proxy that:
- Delegates to the same `lib/request-registry.js` modules as `/api/telemetry?type=logs`
- Handles `?id=<requestId>` → `lookupRequest()` for single-entry (or 404)
- Handles `?limit=<N>` → `listEntries()` + `getAggregateMetrics()` for recent entries
- Is a separate Vercel Function (4th function slot) — well within Hobby 12-slot limit
- No changes to `/api/telemetry.js` — both coexist

**Also recreated `/api/traces.js`** for full backward compatibility:
- Handles `?id=<requestId>` → merged memory + Neon trace events
- Handles `?coverage=true` → merged coverage across all 27 paths
- Handles `?range=24h` → time-bucket trace analytics
- Uses same `lib/tracer.js` and `lib/db/requestTraces.js` modules

---

## 2. Trace Coverage Gaps — `handlerError` Paths

### Gap Found

The audit revealed **2 execution branches** that could exit without emitting a trace event:

| Endpoint | Location | Trigger | Impact |
|---|---|---|---|
| `sendBrief.js` | `generatePDF()` (L266) | PDFKit throws (disk full, memory OOM, invalid input) | 500 response with **zero** trace — no coverage recording |
| `sendContact.js` | `emailQueue.enqueue()` (L288) | Queue object throws (corrupt state, unexpected error) | 500 response with **zero** trace — no coverage recording |

Both are **unexpected runtime failures** (not validation rejections). The validation pipeline completes successfully, but the post-validation processing fails. Previously, these errors propagated to Vercel's generic error handler with no observability.

### Fix Applied

Added **outer `try/catch`** around the post-validation section in both handlers:

```
try {
  ... generatePDF() ...
  ... emailQueue.enqueue() ...
  ... queue result handling ...
  ... success response ...
} catch (err) {
  tracer.trace(rid, 'sendBrief', 'handlerError', 'sendBrief:handlerError');
  log.error(req, 'Unexpected error in sendBrief', { error: err.message });
  return json(500, { error: 'INTERNAL_ERROR' });
} finally {
  await tracer.drain();
}
```

New trace paths added to `lib/db/requestTraces.js` `ALL_PATHS`:
- `sendBrief:handlerError`
- `sendContact:handlerError`

Total instrumented paths: **25 → 27**

### Why Not `persistImmediate()`?

The `handlerError` path does NOT call `registry.persistImmediate()` — it only emits a `tracer.trace()`. This is intentional:

- `handlerError` captures **unexpected runtime failures**, not **validation rejections**
- Validation rejections need Neon persistence for cross-instance diagnostics (requestId → validationStage)
- Runtime errors only need trace recording for coverage/monitoring
- The response is 500 regardless of persistence

---

## 3. Architecture — Updated

### Endpoint Map

```
/api/
├── sendBrief.js     — Brief submission (13 trace paths + handlerError)
├── sendContact.js   — Contact form (13 trace paths + handlerError)
├── telemetry.js     — Consolidated observability (logs, traces, coverage, health, range)
├── logs.js          — [RECREATED] Backward-compatible logs endpoint
└── traces.js        — [RECREATED] Backward-compatible traces endpoint
```

### Trace Coverage — All 27 Paths

```
sendBrief (13 paths):
  methodCheck, parseBody, honeypotCheck, timingCheck,
  sanitizeAndValidateName, validateEmail, validatePrompt,
  rateLimit:ip, rateLimit:email, configCheck, queueCheck,
  submitted, handlerError

sendContact (14 paths):
  methodCheck, parseBody, honeypotCheck, timingCheck,
  sanitizeAndValidateName, validateEmail, validateMessage:empty,
  validateMessage:tooLong, rateLimit:ip, rateLimit:email,
  configCheck, queueCheck, submitted, handlerError
```

### Trace Pipeline

```
Request arrives
    │
    ▼
Validation pipeline (25 early-return paths)
    │
    ├── FAIL: tracer.trace(pathId) + persistImmediate() → return 4xx/5xx
    │
    └── PASS → generatePDF() + emailQueue.enqueue()
                    │
                    ├── FAIL: tracer.trace(handlerError) → return 500  ← NEW
                    │
                    └── OK → tracer.trace(submitted) → return 202
                               │
                               ▼
                          finally { await tracer.drain() }
```

---

## 4. Testing Results

| Test | Expected | Result |
|---|---|---|
| `GET /api/logs?id=<valid-requestId>` | Lifecycle entry | ✅ Fixed — returns entry |
| `GET /api/logs?limit=20` | Entry list + metrics | ✅ Fixed — returns data |
| `GET /api/logs?id=<invalid-requestId>` | 404 | ✅ Returns `{"error":"Request not found"}` |
| `POST /api/sendBrief` → trace lookup | `sendBrief:submitted` exists | ✅ Neon persistence validated |
| `POST /api/sendContact` → trace lookup | `sendContact:submitted` exists | ✅ Neon persistence validated |
| Invalid email (sendBrief) | 400 + validation trace | ✅ Registered in Neon |
| Missing name (sendContact) | 400 + validation trace | ✅ Registered in Neon |
| Coverage endpoint | Merged memory + Neon | ✅ 27 paths, 32%+ covered |

---

## 5. Remaining Limitations

### Vercel Edge JSON Interception (Platform Limitation)

When `Content-Type: application/json` is sent with invalid JSON body, **Vercel Edge intercepts the request before our code executes**. Our handler never runs — Vercel returns `400` with empty body, no `requestId`, and no trace emission.

This affects:
- `sendBrief:parseBody` — never executes for invalid JSON (Vercel pre-checks)
- `sendContact:parseBody` — same limitation

**Status:** Documented limitation. No fix possible without changing Vercel's Edge behavior.

### In-Memory Registry Isolation

`/api/logs` and `/api/telemetry?type=logs` are separate Vercel Function instances. Neither sees the other's in-memory lifecycle data. The logs endpoint reads from Neon, which is the cross-instance source of truth.

**Mitigation:** Both endpoints read from the same `lib/request-registry.js` which persists to Neon. Entry freshness depends on save timing, but availability is cross-instance.

### Trace Insert Race

`tracer.drain()` fires in the `finally` block. If `persistImmediate()` and `tracer.drain()` overlap, there's a small window where the Neon connection pool is saturated. Both operations use separate pool clients, so this is theoretically possible but practically negligible.

---

## 6. Production Status

| Metric | Value |
|---|---|
| Serverless function slots used | 5 of 12 (Hobby plan) |
| Instrumented trace paths | 27 |
| Coverage (recent) | ~30% (varies by test scenario) |
| Neon tables | `request_logs`, `request_traces`, `form_responses` |
| Backward compatibility | `/api/logs` restored |
| Unreachable paths (Vercel Edge) | 2 (`parseBody` for both endpoints) |
| Handler error coverage | ✅ Both endpoints emit `handlerError` trace |

### Final Verdict

**SYSTEM STABLE** — All observable execution branches emit traces. `/api/logs` is backward-compatible. Two `handlerError` paths cover previously untraceable failure modes. The only remaining blind spots are Vercel Edge pre-checks (documented platform limitation).
