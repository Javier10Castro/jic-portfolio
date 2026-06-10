# Architecture — Vercel API Request Lifecycle

## Request Lifecycle (Text Flow)

```
CLIENT (PowerShell / Browser / Curl)
  │
  ▼
VERCEL EDGE LAYER
  │  • Routes to nearest region
  │  • Rejects invalid JSON before handler runs → empty 400 (no handler headers)
  │  • Pre-parses body for some environments → req.body as object
  │
  ▼
safeBodyParser  ───────────────────────────────┐
  │  Tries 3 paths:                              │
  │  1. req.body is already an object → return   │
  │  2. req.body is a string → JSON.parse it     │
  │  3. Stream fallback → read + JSON.parse      │
  │                                              │
  │  Sets req._bodyParseMethod & _bodyParseOk    │
  │                                              │
  │  null? → 400 INVALID_BODY ──────────────────►│
  │                                              │
  ▼                                              │
log.event('body_parse.ok')                       │
  │                                              │
  ▼                                              │
honeypotCheck  ────────────────────────────────  │
  │  Checks for hidden fields (bot, website,     │
  │  url, hp_name, hp_email). Auto-filled by      │
  │  bots but invisible to humans.                │
  │                                              │
  │  Triggered? → 200 { success: true }          │
  │  (silent success — bot thinks it worked)     │
  │                                              │
  ▼                                              │
timingCheck  ──────────────────────────────────  │
  │  Validates submittedAt:                       │
  │  • Must be a number                           │
  │  • Must be > -2h (not stale)                  │
  │  • Must be < +10s (not future clock skew)    │
  │                                              │
  │  Blocked? → 400 INVALID_REQUEST ────────────►│
  │                                              │
  ▼                                              │
log.event('timing_check.ok')                     │
  │                                              │
  ▼                                              │
VALIDATION                                       │
  │  • name: sanitize → strip HTML, trim,        │
  │    max 150 chars                              │
  │  • email: regex pattern, max 320 chars       │
  │  • message/prompt: required, max length      │
  │  (sendBrief also validates company, phone)    │
  │                                              │
  │  Any fail? → 400 INVALID_REQUEST ───────────►│
  │                                              │
  ▼                                              │
rateLimiter (2 layers)                           │
  │                                              │
  ├─ Layer 1: edgeCheck ──────────────────────── │
  │  • Sliding window log (in-memory Map)         │
  │  • Key: "contact:{instance}:{clientIP}"       │
  │  • Soft limit: 30 req/60s (warns, adds       │
  │    headers, but allows)                       │
  │  • Hard limit: 60 req/60s (429 blocks)       │
  │  • Soft exceeded? → req._edgeSoft = true     │
  │  • Hard blocked? → 429 RATE_LIMITED ───────► │
  │                                              │
  ├─ Layer 2: emailDedup ─────────────────────── │
  │  • Same email within 5 min → 429             │
  │  • Prevents resubmit abuse                   │
  │  • Blocked? → 429 RATE_LIMITED ────────────► │
  │                                              │
  ▼                                              │
log.event('rate_limit.ok')                       │
  │                                              │
  ▼                                              │
SMTP CHECK                                       │
  │  GMAIL_USER + GMAIL_APP_PASSWORD set?        │
  │  No? → 500 "Email service misconfigured" ───►│
  │                                              │
  ▼                                              │
Queue.enqueue  ─────────────────────────────────  │
  │  BackgroundQueue (in-memory FIFO)             │
  │  Depth > 100? → 503 QUEUE_OVERFLOW ─────────►│
  │                                              │
  ▼                                              │
202 ACCEPTED  ◄──────────────────────────────────┘
  │  { success: true, queued: true, position, depth, requestId }
  │  Headers: X-Request-Id, X-Queue-Id, X-Queue-Depth, X-Deploy-SHA
  │  If soft limit hit: X-RateLimit-Soft: 1, Retry-After
  │
  ▼  (background, after HTTP response sent)
Queue worker                                     │
  │                                              │
  ├─ Attempt 1: SMTP send (5s timeout)           │
  │  ├─ Admin email sent (to GMAIL_USER)         │
  │  └─ Client email sent (to [user, GMAIL_USER])│
  │  ✓ Success → done                            │
  │                                              │
  ├─ ✗ Fail? → Retry 2 (after 2s)               │
  ├─ ✗ Fail? → Retry 3 (after 4s)               │
  └─ ✗ Fail? → log.error, give up               │
```

---

## Component Details

### safeBodyParser (`lib/safeBodyParser.js`)

Vercel can deliver the request body in 3 different forms depending on the runtime environment and content type:

| # | Condition | Detection | Behavior |
|---|---|---|---|
| 1 | `req.body` is already a plain object | `typeof === 'object'` | Return as-is. Vercel pre-parsed it. |
| 2 | `req.body` is a string | `typeof === 'string'` | `JSON.parse` it. Vercel provided raw body. |
| 3 | Stream fallback | `for await...of req` | Read all chunks, concat, `JSON.parse`. Requires body bytes. |

If all 3 fail, sets `req._bodyParseOk = false` and returns `null`.

```javascript
// parseBody returns:
//   { name, email, ... }  → success
//   null                   → body missing, empty, or invalid JSON
```

### Rate Limiter (`lib/rate-limit.js`)

Two independent in-memory layers:

**Layer 1 — Edge (IP-based sliding window)**
- Tracks requests per `{prefix}:{instance}:{clientIP}`
- Two windows run simultaneously: soft (30) and hard (60), both over 60s
- Soft limit: request passes but adds `X-RateLimit-Soft: 1` header + `Retry-After`
- Hard limit: returns `429 RATE_LIMITED` with rate limit headers
- Old entries cleaned every 5 minutes via `setInterval(..., 300000).unref()`

**Layer 2 — Email dedup**
- Tracks timestamps per email address
- Window: 5 minutes (configurable via `RL_EMAIL_DEDUP_MS`)
- Blocks repeat submissions from the same email within the window
- Returns `429 RATE_LIMITED` with `Retry-After` header

### Timing Check (`lib/rate-limit.js` — `timingCheck`)

Validates the `submittedAt` timestamp to prevent replay and clock-skew attacks:

```javascript
// submittedAt validation rules
if (typeof body.submittedAt !== 'number')          → blocked: 'INVALID_REQUEST'
if (body.submittedAt > Date.now() + 10_000)        → blocked: 'INVALID_REQUEST' (future)
if (Date.now() - body.submittedAt > 7_200_000)     → blocked: 'INVALID_REQUEST' (stale >2h)
```

The `submittedAt` value is generated by the frontend as `Date.now()` right before sending. This creates a natural time bound:
- A form rendered 2+ hours ago is suspicious (replay attack)
- A timestamp more than 10 seconds in the future means clock skew or a bot

### Queue System (`lib/queue.js`)

In-memory FIFO queue that decouples SMTP delivery from the HTTP response:

```
Client                     Server
  │                          │
  ├── HTTP POST ────────────►├── enqueue()
  │                          │   ├── add to queue array
  │                          │   └── setImmediate(drain)
  │◄── 202 Accepted ────────┤
  │                          │
  │     (async background)   ├── drain()
  │                          │   ├── shift() from queue
  │                          │   ├── active++
  │                          │   └── _process(item)
  │                          │       ├── attempt 1 → SMTP send
  │                          │       ├── success? → done
  │                          │       ├── fail? → retry 2 (2s delay)
  │                          │       ├── fail? → retry 3 (4s delay)
  │                          │       └── fail? → give up
```

Key properties:
- **`MAX_QUEUE_DEPTH = 100`** — prevents unbounded memory growth. Returns `null` → 503 `QUEUE_OVERFLOW`.
- **`maxRetries = 3`** — up to 4 total attempts (initial + 3 retries).
- **Exponential backoff** — 2s, 4s between retries.
- **`maxConcurrency = 1`** — processes one email job at a time (Gmail SMTP rate limiting).
- **Per-instance only** — queue state is lost if the Vercel instance freezes. Acceptable for low traffic.

### SMTP Async Worker

The queue handler sends 2 emails per job (admin + client):

| Email | To | Content |
|---|---|---|
| Admin | `GMAIL_USER` | Visual summary + (brief) PDF attachment |
| Client | `[client, GMAIL_USER]` | Human, conversational confirmation |

- Each email has a **5-second timeout** (`EMAIL_TIMEOUT_MS = 5000`). Timed-out emails are logged but not retried (the job-level retry handles the full pair).
- All timestamps use `America/Tijuana` timezone.
- HTML templates use table-based layout for email client compatibility, with dark mode support via `@media (prefers-color-scheme: dark)`.
- User-provided values are escaped via `escapeHTML()` before rendering.

### Observability Events

Structured JSON events for request lifecycle tracking. Always logged (not gated by `DEBUG_API`):

```javascript
log.event('request.start', req, { ip, method, endpoint })
log.event('body_parse.ok', req, { bodyType, parseMethod })
log.event('body_parse.fail', req, { bodyType, parseMethod })
log.event('honeypot.triggered', req, { field })
log.event('timing_check.ok', req, { elapsedMs })
log.event('timing_check.blocked', req, { reason })
log.event('validation.fail', req, { field, reason })
log.event('rate_limit.ok', req, { edgeRemaining })
log.event('rate_limit.blocked', req, { layer, reason, retryAfter })
log.event('queue.queued', req, { queueId, position, depth, endpoint })
log.event('queue.overflow', req, { ip, endpoint })
log.event('smtp.misconfigured', req, { ip })
```

Each event includes:
```json
{
  "type": "observability",
  "event": "body_parse.ok",
  "timestamp": "2026-06-09T15:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "bodyType": "object",
  "parseMethod": "object"
}
```

### Debug Logging

Controlled by two environment variables:

```
DEBUG_API=true        → enables info(), warn(), logStage(), debugLog() — full verbosity
DEBUG_RATE_LIMIT=true → enables X-Debug-RateLimit and X-Debug-Reason response headers
```

When `DEBUG_API` is `false` (production default), only `event()` and `error()` produce output — keeping logs clean while preserving full request traceability.

---

## requestId Tracing

Every request is assigned a unique ID that follows it through every layer.

### How it works

```javascript
// lib/logger.js
function requestId(req) {
  if (req.requestId) return req.requestId;        // already set — return immediately
  const id = req.headers['x-request-id']           // honor client-provided ID
    || crypto.randomUUID();                        // or generate one
  Object.defineProperty(req, 'requestId', {        // freeze — cannot be overwritten
    value: id,
    writable: false,
    enumerable: true
  });
  return id;
}
```

### Trace example

```
Client sends: X-Request-Id: my-custom-trace-42
                │
                ▼
log.event('request.start', ...)   → requestId: "my-custom-trace-42"
log.event('body_parse.ok', ...)    → requestId: "my-custom-trace-42"
log.event('timing_check.ok', ...)  → requestId: "my-custom-trace-42"
log.event('rate_limit.ok', ...)    → requestId: "my-custom-trace-42"
log.event('queue.queued', ...)     → requestId: "my-custom-trace-42"
                │
Response headers: X-Request-Id: my-custom-trace-42
Response body: { "requestId": "my-custom-trace-42", ... }
```

### Response inclusion

| Where | What |
|---|---|
| HTTP header | `X-Request-Id: <uuid>` on **every** response (200, 202, 400, 405, 429, 500, 503) |
| JSON body | `"requestId": "<uuid>"` on every JSON response body |
| Observability events | `"requestId": "<uuid>"` in every `log.event()` output |

This allows correlating a client-side error with server-side logs by matching the `requestId` across both.

---

## Error Response Contract

Every error response follows the same shape:

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "success": false,
  "error": "INVALID_REQUEST"
}
```

Supported error codes:

| Error | HTTP | When |
|---|---|---|
| `INVALID_BODY` | 400 | Body missing, empty, or unparseable |
| `INVALID_REQUEST` | 400 | Missing `submittedAt`, validation fail, timing check fail |
| `RATE_LIMITED` | 429 | IP burst or email dedup hit |
| `QUEUE_OVERFLOW` | 503 | Queue at max depth (100) |
| `Method Not Allowed` | 405 | Non-POST request |
| `Email service misconfigured` | 500 | Missing `GMAIL_USER` or `GMAIL_APP_PASSWORD` |

---

## Response Headers — Complete Reference

| Header | Always | Only on |
|---|---|---|
| `Content-Type: application/json` | ✓ | — |
| `X-Request-Id` | ✓ | — |
| `X-Deploy-SHA` | ✓ | — |
| `X-Deploy-Env` | ✓ | — |
| `X-Body-Parse-Method` | ✓ | — |
| `X-Queue-Id` | — | 202 |
| `X-Queue-Depth` | — | 202 |
| `X-Queue-Position` | — | 202 |
| `X-Processing-Mode` (`immediate`/`queued`) | — | 202 |
| `X-RateLimit-Soft` | — | 202 (only if soft limit exceeded) |
| `X-RateLimit-Limit` | — | 429 |
| `X-RateLimit-Remaining` | — | 429 |
| `Retry-After` | — | 429 (or 202 with X-RateLimit-Soft) |
| `X-Debug-RateLimit` | — | Only with `DEBUG_RATE_LIMIT=true` |
| `X-Debug-Reason` | — | Only with `DEBUG_RATE_LIMIT=true` |

---

## Dependencies

| Package | Version | Used for |
|---|---|---|
| `nodemailer` | ^8.0.10 | Gmail SMTP transport |
| `pdfkit` | ^0.18.0 | Server-side PDF generation (sendBrief only) |
| `@upstash/redis` | optional | Redis-backed rate limiting (fallback to in-memory) |
| `pg` | optional | Neon PostgreSQL (form persistence) |
| Node.js built-ins | — | `crypto`, `fs`, `path`, `http` |

No frameworks (Express, Fastify, etc.). Each endpoint is a standalone Vercel Function (`module.exports = async (req, res) => ...`).
