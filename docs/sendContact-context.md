# sendContact Context

## 1. Architecture

API Layer:
- api/sendContact.js

Pipeline:

1. request.received
2. body.parse
3. validation
4. rateLimit
5. queue.assign
6. background.start
7. email.sent

---

## 2. Response States

### 200 - processed
Email successfully sent

### 202 - queued
Request accepted into queue (async processing)

Includes:
- queuePosition
- queueDepth

### 400 - invalid_request
Validation failed:
- invalid email format
- empty message
- invalid timestamp

### 429 - rate_limited
Rate limit exceeded

Includes:
- limitType (ip | email)
- currentUsage
- retryAfterMs (if available)
- windowResetTime

---

## 3. Observability Model

Every request includes:

- requestId
- processingStage
- timestamp
- status

Debug mode (?debug=true):

- lifecycle[]
  - step
  - status
  - ms
  - deltaMs

- queue depth visibility
- rateLimit step visibility

### Execution Lifecycle (requestId-based)

Each requestId traces through 5 explicit states:

| State | Meaning | Transition |
|---|---|---|
| `queued` | Request accepted into queue, waiting for worker | After queue.assign, before worker picks up |
| `processing` | Worker actively executing email delivery | At queue.waitEnd, execution started |
| `completed` | Both emails sent successfully | After email.sendEnd (adminOk && clientOk) |
| `failed` | One or both emails failed after retries | After email.sendEnd (partial) or queue retry exhaustion |
| `rejected` | Pre-queue failure (validation/rate-limit/bad-request) | Terminal — never reaches queue |

### Timestamps tracked per requestId

- `receivedAt` — when HTTP request arrived (`req._lifecycle.startTime`)
- `queuedAt` — when request entered the queue
- `executionStartedAt` — when worker started processing (single source: `queue.js:52`)
- `executionFinishedAt` — when processing ended (success or failure)

Derived metrics:
- `queueWaitTimeMs = executionStartedAt - queuedAt`
- `executionDurationMs = executionFinishedAt - executionStartedAt`
- `totalLifecycleTimeMs = executionFinishedAt - receivedAt`

### Structured lifecycle log

On every request completion, a `lifecycle.complete` structured log is emitted from `queue.js:_process()` (single source, covers retry exhaustion):

```json
{
  "timestamp": "2026-06-10T12:00:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "stage": "lifecycle.complete",
  "status": "completed",
  "receivedAt": 1718010000000,
  "queuedAt": 1718010000050,
  "executionStartedAt": 1718010000100,
  "executionFinishedAt": 1718010002500,
  "queuePosition": 0,
  "queueDepth": 0,
  "queueWaitTimeMs": 50,
  "executionDurationMs": 2400,
  "totalLifecycleTimeMs": 2500
}
```

---

## 4. Queue System

Real FIFO queue system (single-instance in-memory, Vercel runtime):

Fields:
- queuePosition
- queueDepth
- processingStage
- totalRequestTimeMs
- queueWaitTimeMs
- processingTimeMs

Behavior:
- real FIFO scheduling (in-memory queue, per Vercel instance)
- active depth tracking (queue depth reported at response time)
- controlled backlog under load (queue backlog grows linearly, no request loss)
- exposed via /api/health?section=queue
- queue admission occurs before rate limit expiration check — a queued request already passed rate limiting at enqueue time

---

## 5. Rate Limiting

Mechanisms:

### 1. IP Sliding Window
- edgeSoftLimit: 30
- edgeHardLimit: 60
- window: 60000ms

### 2. Email Dedup Window
- 300000ms window
- prevents spam submissions

### 3. Hard Cap Protection
- returns 429 when exceeded

Monitoring:
GET /api/health?section=rate-limit

---

## 6. Lifecycle Observability

Stages:

- request.received
- body.parse
- validation
- rateLimit
- queue.assign
- background.start
- email.sent

Each stage includes:
- status
- ms timing
- deltaMs (debug mode only)

---

## 7. Timestamped Change Log

[2026-06-10T06:40:00Z] - Added lifecycle tracing system
Reason: improve async debugging and request visibility
Impact: full request traceability

[2026-06-10T07:05:00Z] - Added queue observability
Reason: monitor backlog under load
Impact: better queue diagnostics

[2026-06-10T07:10:00Z] - Added rate-limit metadata exposure
Reason: improve client retry handling
Impact: better UX under throttling

[2026-06-10T07:15:00Z] - Improved CLI observability validation
Reason: expose real rate-limit behavior under PowerShell testing
Impact: better debugging clarity for 429 responses

---

## 8. CLI Testing Observations (PowerShell)

[2026-06-10T15:54:00Z] - Observed queue scaling under burst load
Reason: validate FIFO behavior in real CLI environment
Impact: confirmed linear queue growth without request loss

[2026-06-10T15:54:30Z] - Observed rate-limit activation (429)
Reason: stress test using PowerShell Invoke-RestMethod
Impact: confirms edgeSoftLimit enforcement working correctly

[2026-06-10T15:55:00Z] - Identified Git path mismatch in documentation update workflow
Reason: incorrect assumption of docs/ path structure
Impact: improved clarity in repo structure handling

[2026-06-10T16:00:00Z] - Observed system operates in queued execution model under burst traffic
Reason: validate production behavior with PowerShell burst sequence
Impact: confirmed queue depth grows linearly under sustained load without message loss or order violation

---

## 9. Rate Limit vs Queue Interaction Model (CRITICAL)

Rate limit operates BEFORE queue admission. Queue only applies AFTER request passes gateway checks.

### Two-Layer Pipeline

```
Network Gate (Rate Limit / Edge Protection)
  → 429: rejected immediately, never reaches queue
  → allowed: passes to execution layer
Execution Layer (Internal Queue Scheduler)
  → queue.assign: request enters FIFO queue
  → queue.waitStart: waits for worker
  → email delivery: background SMTP
```

### Implications

- Burst traffic may result in partial queue starvation — rate limit caps how many requests reach the queue per window
- 429 errors are NOT queued and are rejected immediately — the response returns before any queue interaction
- Queue metrics only represent successfully admitted requests — queue depth does not reflect total incoming traffic, only filtered traffic
- Rate limit decisions and queue state are independent — the queue has no influence on rate limit thresholds

---

## 10. Request Lifecycle Observability

### Request Registry (`lib/request-registry.js`)

In-memory registry that stores full lifecycle data per requestId.

| Property | Value |
|---|---|
| Max entries | 1,000 |
| Entry TTL | 5 minutes (enforced regardless of size) |
| Cleanup interval | 60s (via `setInterval`) |
| Lookup expiry | TTL checked on every `lookupRequest()` call |
| Persistence | None (in-memory only) |

### Diagnostic Endpoint

`GET /api/sendContact?id=<requestId>`

Returns the full lifecycle record for a requestId if it's still in the registry (TTL-checked on lookup):

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "receivedAt": 1718010000000,
  "queuedAt": 1718010000050,
  "executionStartedAt": 1718010000100,
  "executionFinishedAt": 1718010002500,
  "queuePosition": 0,
  "queueDepth": 0,
  "queueWaitTimeMs": 50,
  "executionDurationMs": 2400,
  "totalLifecycleTimeMs": 2500
}
```

If not found: `404 { error: "NOT_FOUND" }`.

### Limitations

- **In-memory only** — all data is lost if the Vercel instance terminates. Acceptable for debugging recent requests within the same cold start.
- **Per-instance** — multiple Vercel instances have independent registries. A request processed by instance A cannot be looked up via instance B.
- **TTL-bound** — entries older than 5 minutes are evicted (enforced regardless of registry size).
- **No history** — the registry does not persist across cold starts. For persistent audit trails, a database-backed store would be required.

### Queue Health Metrics

Exposed via `/api/health?section=queue` under `lifecycle` key:

```json
{
  "lifecycle": {
    "totalRequests": 42,
    "completedRequests": 38,
    "failedRequests": 4,
    "averageExecutionTimeMs": 2450,
    "averageQueueWaitTimeMs": 320
  }
}
```

Metrics cover the lifetime of the current Vercel instance (in-memory registry).