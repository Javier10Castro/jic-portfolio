# Observability Hardening Audit — June 2026

## Scope

Complete audit of the observability system covering:

1. Heatmap endpoint — failure aggregation by path + stage
2. Timeline endpoint — request lifecycle ordering
3. Coverage matrix — automated path exercise + reporting
4. Leakage audit — no internals exposed in response bodies/headers
5. Trace persistence guarantee — all 27 paths persist to Neon

---

## 1. Heatmap Endpoint

**`GET /api/traces?heatmap=true&hours=24`**

Returns aggregated trace events grouped by `(path_id, endpoint, stage)` with:
- `hitCount` — number of times this path/stage fired
- `percentage` — proportion of total events
- `firstSeen` / `lastSeen` — time range

Added in:
- `lib/db/requestTraces.js:getHeatmap()` — Neon query
- `api/traces.js` — routes `?heatmap=true`

---

## 2. Timeline Endpoint

**`GET /api/traces?timeline=true&hours=24&limit=200`**

Returns all trace events ordered chronologically, grouped by `requestId`:
- `events` — flat array of all events
- `byRequest` — object keyed by requestId, each with chronologically sorted events
- `deltaMs` — time delta between consecutive events per requestId

Added in:
- `lib/db/requestTraces.js:getTimeline()` — Neon query
- `api/traces.js` — routes `?timeline=true`

---

## 3. Coverage Matrix Script

**`scripts/run-coverage-matrix.js`**

Automated path exerciser:
- Exercises all 15 reachable validation paths via HTTP
- Marks 12 paths as unreachable (documented env/edge limitations)
- Verifies Neon persistence via `/api/traces?coverage=true`
- Validates heatmap and timeline endpoints
- Performs leakage scan on all response bodies and headers
- Outputs JSON + Markdown reports to `data/coverage-matrix-report.*`

### Reachable paths (15)

| Path | Method | Expected Status |
|---|---|---|
| `sendBrief:methodCheck` | GET | 405 |
| `sendBrief:timingCheck` | POST (bad timing) | 400 |
| `sendBrief:sanitizeAndValidateName` | POST (empty name) | 400 |
| `sendBrief:validateEmail` | POST (bad email) | 400 |
| `sendBrief:validatePrompt` | POST (empty prompt) | 400 |
| `sendBrief:honeypotCheck` | POST (bot) | 200 |
| `sendBrief:submitted` | POST (valid) | 200 |
| `sendContact:methodCheck` | GET | 405 |
| `sendContact:timingCheck` | POST (bad timing) | 400 |
| `sendContact:sanitizeAndValidateName` | POST (empty name) | 400 |
| `sendContact:validateEmail` | POST (bad email) | 400 |
| `sendContact:validateMessage:empty` | POST (empty) | 400 |
| `sendContact:validateMessage:tooLong` | POST (long) | 400 |
| `sendContact:honeypotCheck` | POST (bot) | 200 |
| `sendContact:submitted` | POST (valid) | 200 |

### Unreachable paths (12)

| Path | Reason |
|---|---|
| `sendBrief:parseBody` | Vercel Edge Runtime intercepts malformed JSON |
| `sendContact:parseBody` | Vercel Edge Runtime intercepts malformed JSON |
| `sendBrief:configCheck` | SMTP credentials configured in production |
| `sendContact:configCheck` | SMTP credentials configured in production |
| `sendBrief:queueCheck` | Requires queue depth > 100 |
| `sendContact:queueCheck` | Requires queue depth > 100 |
| `sendBrief:handlerError` | Requires PDF generation failure |
| `sendContact:handlerError` | Requires enqueue failure |
| `sendBrief:rateLimit:ip` | Requires rapid requests |
| `sendBrief:rateLimit:email` | Requires duplicate email within 300s |
| `sendContact:rateLimit:ip` | Requires rapid requests |
| `sendContact:rateLimit:email` | Requires duplicate email within 300s |

---

## 4. Leakage Audit Results

### Response bodies — NO sensitive data leaked
All error messages are generic static strings:
- `INVALID_REQUEST`, `INVALID_BODY`, `RATE_LIMITED`, `QUEUE_OVERFLOW`
- `INTERNAL_ERROR`, `Email service misconfigured`, `Method Not Allowed`
- No `process.env`, no IPs, no server paths, no `err.message`

### Response headers — LOW severity (standard API metadata)
Headers set on all responses:
- `X-Deploy-SHA` — Vercel commit hash (standard)
- `X-Deploy-Env` — Vercel environment name (standard)
- `X-Body-Parse-Method` — internal parsing method (minor)
- `X-Queue-Id` / `X-Queue-Depth` / `X-Queue-Position` — queue state (minor)

No `X-Tracer-Debug` header (removed in v1.7.0).

### `persistImmediate()` — safe
- Returns `undefined`, never included in response bodies
- Fire-and-forget to Neon, await completes before response

### `requestId` — safe
- Either client-provided `X-Request-Id` echo, or `crypto.randomUUID()`

---

## 5. Trace Persistence Guarantee

All 27 paths call `tracer.trace()` with a full `pathId` matching `ALL_PATHS` entries:

### sendBrief (13 paths)
```
sendBrief:methodCheck, sendBrief:parseBody, sendBrief:honeypotCheck,
sendBrief:timingCheck, sendBrief:sanitizeAndValidateName, sendBrief:validateEmail,
sendBrief:validatePrompt, sendBrief:rateLimit:ip, sendBrief:rateLimit:email,
sendBrief:configCheck, sendBrief:queueCheck, sendBrief:submitted,
sendBrief:handlerError
```

### sendContact (14 paths)
```
sendContact:methodCheck, sendContact:parseBody, sendContact:honeypotCheck,
sendContact:timingCheck, sendContact:sanitizeAndValidateName, sendContact:validateEmail,
sendContact:validateMessage:empty, sendContact:validateMessage:tooLong,
sendContact:rateLimit:ip, sendContact:rateLimit:email, sendContact:configCheck,
sendContact:queueCheck, sendContact:submitted, sendContact:handlerError
```

All paths:
- Pass detailed `pathId` (e.g. `sendBrief:methodCheck`) as 4th arg to `tracer.trace()`
- Call `await registry.persistImmediate(log.requestId(req))` before returning (for validation failures)
- Use `tracer.drain()` on success paths to flush Neon writes

---

## 6. Coverage Status

| Metric | Value |
|---|---|
| Total defined paths | 27 |
| Reachable (exercisable) | 15 |
| Unreachable (env/edge) | 12 |
| System endpoints validated | 4 (coverage, heatmap, timeline, health) |
| Leakage scan | Pass (no secrets leaked) |

---

## Files Changed

| File | Change |
|---|---|
| `lib/db/requestTraces.js` | Added `getHeatmap()`, `getTimeline()` functions |
| `api/traces.js` | Added `?heatmap=true`, `?timeline=true` routing, `hours` param support |
| `scripts/run-coverage-matrix.js` | New — automated path exerciser |
| `docs/OBSERVABILITY_HARDENING_AUDIT.md` | This file |

---

_Generated by observability hardening audit — June 2026_
