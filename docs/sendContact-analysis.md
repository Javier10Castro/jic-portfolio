# /api/sendContact — Complete Analysis & Testing Guide

Base URL: `https://web-portfolio-kappa-wheat.vercel.app`

---

## 1. Request Lifecycle (Step by Step)

```
CLIENT (PowerShell / Browser)
  │
  │  POST /api/sendContact
  │  Headers: Content-Type: application/json
  │  Body: { name, email, message, submittedAt }
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│  VERCEL EDGE LAYER                                          │
│  • Routes request to nearest region                         │
│  • If JSON is malformed → returns 400 with EMPTY body       │
│    (Vercel-level rejection, handler never runs)             │
│  • If body is parseable → passes to handler                 │
│    (may pre-parse req.body as object)                       │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: log.event('request.start', req, { ip, method })    │
│  • Generates requestId (immutable, via Object.defineProperty)│
│  • Reads clientIp from x-forwarded-for header               │
│  • Sets req._debugEndpoint = 'sendContact'                  │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: METHOD CHECK                                       │
│  req.method !== 'POST'?                                     │
│  YES → 405 { error: "Method Not Allowed" }                  │
│  NO  → continue                                             │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: safeBodyParser.parseBody(req)                      │
│                                                              │
│  Tries 3 paths (in order):                                  │
│                                                              │
│  1. req.body IS object?                                      │
│     → Return as-is. Vercel pre-parsed it.                    │
│       Sets _bodyParseMethod = 'object'                       │
│                                                              │
│  2. req.body IS string?                                      │
│     → JSON.parse. Sets _bodyParseMethod = 'string'           │
│       FAIL → return null (400 INVALID_BODY)                  │
│                                                              │
│  3. req.body is undefined/null                               │
│     → Read stream via for await...of                         │
│       Empty? → return null (400 INVALID_BODY)                │
│       JSON.parse → return parsed object or null              │
│       Sets _bodyParseMethod = 'stream'                       │
│                                                              │
│  null returned → 400 { error: "INVALID_BODY" }              │
│  object returned → log.event('body_parse.ok')               │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: honeypotCheck(parsed)                               │
│                                                              │
│  Checks for hidden fields: bot, website, url,                │
│  hp_name, hp_email                                           │
│                                                              │
│  Any present? → 200 { success: true }                        │
│  (Silent success — bot thinks it worked)                     │
│  None present → continue                                     │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: timingCheck(parsed)                                 │
│                                                              │
│  Validates submittedAt (must be a Unix ms timestamp):        │
│                                                              │
│  submittedAt type?                                           │
│  NOT a number → 400 { error: "INVALID_REQUEST" }            │
│                                                              │
│  submittedAt > Date.now() + 10s? (future)                    │
│  YES → 400 { error: "INVALID_REQUEST" }                      │
│                                                              │
│  Date.now() - submittedAt > 7_200_000? (stale > 2h)         │
│  YES → 400 { error: "INVALID_REQUEST" }                      │
│                                                              │
│  ALL PASS → log.event('timing_check.ok')                     │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: FIELD VALIDATION                                    │
│                                                              │
│  name:                                                       │
│  • Must be a string                                          │
│  • HTML tags stripped (<...> removed)                        │
│  • Trimmed length must be ≥ 1                                │
│  • Max 150 characters                                        │
│  FAIL → 400 { error: "INVALID_REQUEST" }                     │
│                                                              │
│  email:                                                      │
│  • Must be a string                                          │
│  • Max 320 characters                                        │
│  • Must match /^[^\s@]+@[^\s@]+\.[^\s@]+$/                  │
│  FAIL → 400 { error: "INVALID_REQUEST" }                     │
│  (email is masked in logs via maskEmail())                   │
│                                                              │
│  message:                                                    │
│  • Must be a non-empty string                                │
│  • Trimmed length ≥ 1                                        │
│  • Max 100,000 characters                                    │
│  FAIL → 400 { error: "INVALID_REQUEST" }                     │
│                                                              │
│  company, project, lang:                                     │
│  • Optional — no validation                                  │
│  • lang='es' → email templates in Spanish                   │
│                                                              │
│  ALL PASS → continue                                         │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 7: RATE LIMIT — Layer 1: edgeCheck (IP-based)         │
│                                                              │
│  Key: "contact:{instance_id}:{client_ip}"                    │
│                                                              │
│  Sliding window log (60 seconds):                            │
│  • Soft limit (30 req/60s) →                                 │
│    req._edgeSoft = edge object                               │
│    Request continues normally, but response includes:        │
│    X-RateLimit-Soft: 1                                       │
│    Retry-After: <seconds>                                    │
│                                                              │
│  • Hard limit (60 req/60s) →                                 │
│    429 { error: "RATE_LIMITED" }                             │
│    Headers: X-RateLimit-Limit, X-RateLimit-Remaining        │
│             Retry-After                                      │
│                                                              │
│  PASS → log.event('rate_limit.ok')                           │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 8: RATE LIMIT — Layer 2: emailDedup                   │
│                                                              │
│  Key: email address (lowercase? raw)                         │
│  Window: 5 minutes (300,000 ms)                              │
│                                                              │
│  Same email seen within 5 min?                               │
│  YES → 429 { error: "RATE_LIMITED" }                         │
│         Headers: Retry-After, X-RateLimit-*                 │
│  NO → record timestamp, continue                            │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 9: SMTP CONFIG CHECK                                   │
│                                                              │
│  GMAIL_USER and GMAIL_APP_PASSWORD set?                      │
│  NO → 500 { error: "Email service misconfigured" }           │
│  YES → create nodemailer transporter, continue               │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 10: QUEUE ENQUEUE                                      │
│                                                              │
│  emailQueue.enqueue({ handler, req, label })                 │
│                                                              │
│  Queue depth ≥ 100?                                          │
│  YES → 503 { error: "QUEUE_OVERFLOW" }                       │
│                                                              │
│  NO → push to FIFO queue                                    │
│       setImmediate(() => drain()) — kicks off worker         │
│                                                              │
│  Returns { queueId, position, depth }                        │
│                                                              │
│  Response: 202 { success: true, queued: true,               │
│                 position, depth, requestId }                 │
│  Headers: X-Queue-Id, X-Queue-Depth, X-Queue-Position       │
│           X-Processing-Mode (immediate|queued)               │
│           X-Request-Id, X-Deploy-SHA, X-Deploy-Env          │
│           X-Body-Parse-Method                                │
│           [if soft limit hit: X-RateLimit-Soft, Retry-After] │
└─────────────────────────────────────────────────────────────┘
  │
  ▼  (HTTP response sent — background processing)
┌─────────────────────────────────────────────────────────────┐
│  STEP 11: QUEUE WORKER (async, post-response)               │
│                                                              │
│  drain() → shift item from queue → _process(item)           │
│                                                              │
│  Attempt 1: handler()                                        │
│    ├── SMTP send: admin email (to GMAIL_USER)                │
│    │   • 5-second timeout                                    │
│    │   • Subject: "New message from <name>"                 │
│    │   • Reply-To: client email                              │
│    │                                                         │
│    └── SMTP send: client confirmation                        │
│        • 5-second timeout                                    │
│        • To: [clientEmail, GMAIL_USER] (not CC)             │
│        • Subject: "We received your message ✅"             │
│    ✓ BOTH succeed? → completed++ → done                     │
│                                                              │
│  Retry policy (if handler throws):                           │
│    ├── ✗ Attempt 1 fails → wait 2s (2^1 * 1000)            │
│    ├── Attempt 2 → wait 4s (2^2 * 1000)                    │
│    ├── Attempt 3 → wait 8s (2^3 * 1000)                    │
│    ├── Attempt 4 → final try                                │
│    └── All fail? → failed++, log.error, give up             │
│                                                              │
│  active-- → drain() again (process next queued item)        │
└─────────────────────────────────────────────────────────────┘

---

## Ingestion Boundary Principle

The rate limit layer acts as an **ingestion boundary** — it gates admission before any queue or execution state is allocated.

### The Boundary in the Lifecycle

Steps 1–8 (body.parse → validation → rateLimit) occur **before** the ingestion boundary. Steps 10–11 (queue → worker) occur **after**.

```
 Pre-Boundary (Steps 1–8)           Post-Boundary (Steps 10–11)
 ┌────────────────────────┐         ┌──────────────────────────┐
 │ body.parse             │         │ Queue.enqueue            │
 │ honeypotCheck          │  429    │ FIFO worker              │
 │ timingCheck            │◄────    │ SMTP delivery            │
 │ field validation       │         │ Retry logic              │
 │ rateLimit (edge+dedup) │         │ Lifecycle traces         │
 └────────────────────────┘         └──────────────────────────┘
         │                                    ▲
         └─────── only if ALLOWED ────────────┘
```

### Implications for Testing

- **A 429 response proves the boundary is working** — it is not a system failure
- **Queue depth is always ≤ admitted traffic** — it is not a proxy for total request volume
- **Burst loops (no delay) exclusively test the boundary** — they provide zero data about queue throughput or SMTP performance
- **To observe queue behavior, stay below the rate limit threshold** — use unique emails per request and ≥250ms spacing
```

---

## 2. Rate Limit Behavior

### Layer 1: IP-Based Sliding Window (edgeCheck)

```
Key format:  "contact:{instance_id}:{client_ip}"
Window:      60 seconds
Instance ID: first 8 chars of crypto.randomUUID()
             (unique per Vercel instance cold start)
```

| Threshold | Requests / 60s | Behavior |
|---|---|---|
| Soft | 30 | `X-RateLimit-Soft: 1` header + `Retry-After` in response. Request still succeeds (202). |
| Hard | 60 | `429 RATE_LIMITED`. Request blocked. |

**Key details:**
- The soft window and hard window run independently using the same input timestamps.
- When soft is exceeded but hard is not: response code is still 202, but `X-RateLimit-Soft: 1` warns the client.
- When hard is exceeded: `Retry-After` tells client how many seconds to wait.
- Old entries are cleaned every 5 minutes via `setInterval(... , 300000).unref()`.

**Per-instance behavior:**
- Each Vercel instance maintains its own `ipLog` Map.
- With 2+ instances, effective limits could double (since each instance tracks independently).
- No synchronization between instances (no Redis in current config).

### Layer 2: Email Dedup (emailDedup)

```
Key:    email string (raw, as received)
Window: 5 minutes (300,000 ms, configurable via RL_EMAIL_DEDUP_MS)
Limit:  1 submission per email per window
```

**Behavior:**
- First submission with email `foo@bar.com` → passes, logs timestamp.
- Any subsequent submission with `foo@bar.com` within 5 min → `429 RATE_LIMITED`.
- After 5 min from last submission, the window resets.
- `Retry-After` header tells client remaining seconds.

---

## 3. Validation Rules (Inferred from Backend)

| Field | Required | Type | Rules | Error |
|---|---|---|---|---|
| `submittedAt` | YES | number (ms) | Must be `Date.now()` within [-2h, +10s] window | 400 INVALID_REQUEST |
| `name` | YES | string | HTML stripped, trimmed length ≥ 1, max 150 chars | 400 INVALID_REQUEST |
| `email` | YES | string | Matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, max 320 chars | 400 INVALID_REQUEST |
| `message` | YES | string | Non-empty after trim, max 100,000 chars | 400 INVALID_REQUEST |
| `company` | NO | string | No validation (passed through to email template) | — |
| `project` | NO | string | No validation | — |
| `lang` | NO | string | `'es'` → Spanish email templates; anything else → English | — |

**Validation order:**
1. `submittedAt` type check → range check (future/stale)
2. `name` → sanitize + length
3. `email` → format + length
4. `message` → empty + length

All field failures return the same error code: `INVALID_REQUEST`. The specific failing field is NOT disclosed in the response body (logged server-side only).

---

## 4. Queue System

```
┌─────────────────────────────────────────────────────────┐
│  BackgroundQueue (singleton, in-memory)                  │
│                                                          │
│  Properties:                                             │
│    queue: []           (FIFO array of pending items)     │
│    active: 0           (currently processing count)      │
│    maxConcurrency: 1   (processes one job at a time)     │
│    totalEnqueued: 0    (monotonic counter)               │
│    completed: 0        (successful jobs)                 │
│    failed: 0           (exhausted retries)               │
│    MAX_QUEUE_DEPTH: 100 (hard cap)                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  enqueue({ handler, req, label })                  │   │
│  │  ├── depth ≥ 100? → return null (503 overflow)    │   │
│  │  ├── push to queue array                          │   │
│  │  ├── setImmediate(() => drain())                  │   │
│  │  └── return { queueId, position, depth }          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  drain()                                           │   │
│  │  ├── while active < maxConcurrency && queue > 0   │   │
│  │  │   └── shift() → active++ → _process(item)     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  _process(item)                                   │   │
│  │  ├── for attempt = 1 to 4 (maxRetries=3)         │   │
│  │  │   ├── handler()                                │   │
│  │  │   │   ├── admin email (5s timeout)            │   │
│  │  │   │   └── client email (5s timeout)           │   │
│  │  │   ├── success? → completed++, break            │   │
│  │  │   └── fail? → wait 2^attempt s → retry        │   │
│  │  └── active-- → drain()                          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  STATS: { depth, active, completed, failed }             │
└─────────────────────────────────────────────────────────┘
```

**Important caveats:**
- **In-memory only** — queue state is lost if the Vercel instance terminates.
- **Per-instance** — each cold start creates a fresh queue.
- **Single concurrency** — Gmail SMTP rate limits make parallel sends risky.
- **Backoff timings**: 2s, 4s, 8s between retries (exponential, base 2).
- **Queue depth includes active + pending**: `depth = queue.length + active`.

---

## 5. Request Lifecycle Observability

### Execution States

| State | When | Transition |
|---|---|---|
| `queued` | After queue.assign, HTTP 202 sent | → processing |
| `processing` | Worker dequeues and starts executing handler | → completed or failed |
| `completed` | Both admin and client emails sent successfully | Terminal |
| `failed` | Email timeout or SMTP error after retries | Terminal |

### Timestamps Captured

| Timestamp | Source | Captured at |
|---|---|---|
| `receivedAt` | `req._lifecycle.startTime` | Line 98: `log.initTrace(req)` |
| `queuedAt` | `Date.now()` after `queue.enqueue` | Line 291: `req._lifecycle.queuedAt` |
| `executionStartedAt` | `Date.now()` at `queue.js:52` (dequeue) | Single source of truth |
| `executionFinishedAt` | `Date.now()` after retry loop | `queue.js:87` |

### Derived Metrics

- `queueWaitTimeMs = executionStartedAt - queuedAt` (reflects true queue wait time)
- `executionDurationMs = executionFinishedAt - executionStartedAt`
- `totalLifecycleTimeMs = executionFinishedAt - receivedAt`

### Diagnostic Endpoint

`GET /api/sendContact?id=<requestId>` — returns full lifecycle record (TTL-checked on lookup):

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

Rejected requests return additional `reason` field (`validation`/`rate_limit`/`bad_request`).

Limitations:
- In-memory only (1,000 entries, 5min TTL enforced) — lost on instance termination
- Per-instance — cannot query across Vercel instances
- No persistence — not suitable for audit trails

### Queue Health Metrics

`/api/health?section=queue` now includes `lifecycle`:

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

---

## 6. Expected HTTP Responses

| Status | `error` field | `success` | When | Response Headers |
|---|---|---|---|---|
| **202** | — | `true`, `queued: true` | Valid request, queued for delivery | `X-Request-Id`, `X-Queue-Id`, `X-Queue-Depth`, `X-Queue-Position`, `X-Processing-Mode`, `X-Deploy-SHA`, `X-Deploy-Env`, `X-Body-Parse-Method`; optionally `X-RateLimit-Soft`, `Retry-After` |
| **200** | — | `true` | Honeypot triggered (bot silenced) | Same base headers, plus `X-Debug-RateLimit`, `X-Debug-Reason` if DEBUG mode |
| **400** | `INVALID_BODY` | `false` | Body missing, empty, or unparseable JSON | All base headers |
| **400** | `INVALID_REQUEST` | `false` | Missing/invalid `submittedAt`, or any field validation failure | All base headers |
| **405** | `Method Not Allowed` | `false` | GET/PUT/DELETE/PATCH request | All base headers |
| **429** | `RATE_LIMITED` | `false` | IP burst limit hit or email dedup triggered | All base headers + `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` |
| **500** | `Email service misconfigured` | `false` | `GMAIL_USER` or `GMAIL_APP_PASSWORD` not set | All base headers |
| **503** | `QUEUE_OVERFLOW` | `false` | Queue depth ≥ 100 (too many pending jobs) | All base headers |

**Base headers on ALL responses:**
```
X-Request-Id:      <uuid>
X-Deploy-SHA:      <git-sha>
X-Deploy-Env:      production|preview|local
X-Body-Parse-Method: object|string|stream|unknown
```

**Body shape (success):**
```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "queued": true,
  "position": 0,
  "depth": 0
}
```

**Body shape (error):**
```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "success": false,
  "error": "INVALID_REQUEST"
}
```

---

## 7. Recommended Safe Testing Strategy (PowerShell)

### Helper Function

Create this reusable function for all tests:

```powershell
function Test-SendContact {
  param(
    [hashtable]$Body,
    [string]$Method = "POST"
  )

  $url = "https://web-portfolio-kappa-wheat.vercel.app/api/sendContact"
  $params = @{
    Uri         = $url
    Method      = $Method
    ContentType = "application/json"
  }

  if ($Body) {
    $params["Body"] = ($Body | ConvertTo-Json)
  }

  try {
    $response = Invoke-WebRequest @params
    return @{
      Status  = [int]$response.StatusCode
      Headers = $response.Headers
      Body    = ($response.Content | ConvertFrom-Json)
      Success = $true
    }
  } catch {
    $statusCode = [int]$_.Exception.Response.StatusCode.value__
    if ($_.Exception.Response) {
      $stream = $_.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $bodyText = $reader.ReadToEnd()
      $reader.Close()
    }
    return @{
      Status  = $statusCode
      Headers = $_.Exception.Response.Headers
      Body    = ($bodyText | ConvertFrom-Json)
      Success = $false
    }
  }
}
```

### Test Sequence (Safe Order)

Run these in order. Never reuse the same email within 5 minutes.

```powershell
# 1. VALID SUBMISSION
$result = Test-SendContact -Body @{
  name        = "Test User"
  email       = "test-$(Get-Random -Maximum 99999)@example.com"
  message     = "I would like to discuss a web development project."
  submittedAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
}
Write-Host "Status: $($result.Status)"
Write-Host "RequestId: $($result.Headers['X-Request-Id'])"
Write-Host "Queued: $($result.Body.queued)"

# 2. MISSING SUBMITTEDAT
$result = Test-SendContact -Body @{
  name    = "Test"
  email   = "test@t.com"
  message = "Hi"
}
Write-Host "Status: $($result.Status)"  # 400
Write-Host "Error: $($result.Body.error)"  # INVALID_REQUEST

# 3. INVALID EMAIL
$result = Test-SendContact -Body @{
  name        = "Test"
  email       = "not-an-email"
  message     = "Hi"
  submittedAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
}
Write-Host "Status: $($result.Status)"  # 400
Write-Host "Error: $($result.Body.error)"  # INVALID_REQUEST

# 4. EMPTY NAME
$result = Test-SendContact -Body @{
  name        = ""
  email       = "test@t.com"
  message     = "Hi"
  submittedAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
}
Write-Host "Status: $($result.Status)"  # 400

# 5. GET METHOD
$result = Test-SendContact -Method GET
Write-Host "Status: $($result.Status)"  # 405
Write-Host "Error: $($result.Body.error)"  # Method Not Allowed
```

### Validating Headers (Using Invoke-WebRequest)

```powershell
$body = @{
  name        = "Header Test"
  email       = "headers-$(Get-Random -Maximum 99999)@test.com"
  message     = "Checking headers"
  submittedAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri $url -Method POST -ContentType "application/json" -Body $body
$response.Headers["X-Request-Id"]
$response.Headers["X-Deploy-SHA"]
$response.Headers["X-Body-Parse-Method"]
```

---

## 8. Common Mistakes When Testing in Windows PowerShell

### Mistake 1: Using curl

```powershell
# ❌ WRONG — PowerShell interprets {} before curl sees them
curl -X POST https://... -d "{`"name`":`"Test`"}"
```
```
Error: unmatched brace
```
**Fix:** Use `Invoke-RestMethod` or `Invoke-WebRequest` with a hashtable + `ConvertTo-Json`.

---

### Mistake 2: Invoke-WebRequest throws on non-2xx

```powershell
# ❌ WRONG — throws on 400/429/503
$r = Invoke-WebRequest -Uri $url -Method POST -Body $body
```
```
Error: The remote server returned an error: (429) Too Many Requests.
```
**Fix:** Wrap in `try/catch` and extract `$_.Exception.Response`:
```powershell
try {
  $r = Invoke-WebRequest -Uri $url -Method POST -Body $body
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  $bodyText = $reader.ReadToEnd()
  $reader.Close()
}
```
Or use the `Test-SendContact` helper function from section 6.

---

### Mistake 3: Forgetting submittedAt

```powershell
# ❌ WRONG — returns 400 INVALID_REQUEST
$body = @{ name="Test"; email="test@t.com"; message="Hi" } | ConvertTo-Json

# ✅ CORRECT
$body = @{
  name        = "Test"
  email       = "test@t.com"
  message     = "Hi"
  submittedAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
} | ConvertTo-Json
```

---

### Mistake 4: Using local time instead of UTC

```powershell
# ❌ WRONG — local time varies by timezone
$submittedAt = [DateTime]::Now.Ticks

# ❌ WRONG — [DateTime]::Now is local, not UTC
$submittedAt = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()

# ✅ CORRECT — always UTC
$submittedAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
```
On a machine set to Pacific time (-7h), `[DateTimeOffset]::Now` gives `2026-06-09T08:00:00-07:00`. The server checks `Date.now()` (UTC). Both use epoch ms, so timezone doesn't affect the numeric value — but using `UtcNow` is the correct practice.

---

### Mistake 5: Reusing the same email too fast

```powershell
# ❌ If both run within 5 minutes, second one 429s
$email = "test-fixed@example.com"

Test-SendContact -Body @{ name="A"; email=$email; message="1st"; submittedAt=... }  # 202
Test-SendContact -Body @{ name="B"; email=$email; message="2nd"; submittedAt=... }  # 429
```
**Fix:** Use unique emails per test:
```powershell
$email = "test-$(Get-Random -Maximum 99999)-$(Get-Date -Format yyyyMMddHHmmss)@example.com"
```

---

### Mistake 6: ConvertTo-Json depth issues with nested objects

```powershell
# ❌ WRONG — nested data may be truncated at default depth (2)
$body = @{
  name   = "Test"
  email  = "t@t.com"
  data   = @{ a = @{ b = @{ c = 1 } } }
} | ConvertTo-Json

# ✅ CORRECT — specify depth
$body = @{
  name   = "Test"
  email  = "t@t.com"
  data   = @{ a = @{ b = @{ c = 1 } } }
} | ConvertTo-Json -Depth 10
```

---

### Mistake 7: Confusing `Invoke-RestMethod` vs `Invoke-WebRequest`

```powershell
# Invoke-RestMethod: returns parsed JSON object directly (less info)
$result = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json"
$result.success   # ✅ true/false
$result.requestId  # ✅ uuid
# ❌ Cannot access response headers

# Invoke-WebRequest: returns full response with headers
$response = Invoke-WebRequest -Uri $url -Method POST -Body $body -ContentType "application/json"
$response.Headers["X-Request-Id"]  # ✅ uuid from header
$response.StatusCode               # ✅ numeric code
$parsed = $response.Content | ConvertFrom-Json
$parsed.success                    # ✅ true/false
```

**Rule:** Use `Invoke-WebRequest` when you need headers (rate limit info, queue position). Use `Invoke-RestMethod` when you only need the body.

---

## 9. Safe Load Test Profile (With Delays)

This profile simulates realistic human traffic and stays within rate limits.

### Profile Parameters

| Parameter | Value | Reason |
|---|---|---|
| Requests | 15 total | Stays under hard limit (60 req/min) |
| Initial delay | 2s | Allows server to warm up |
| Between requests | 1.5 - 3s (random) | Simulates human reading/typing |
| Unique emails | Yes | Avoids email dedup |
| submittedAt | Fresh per request | Avoids stale/future rejection |

### Script

```powershell
$url = "https://web-portfolio-kappa-wheat.vercel.app/api/sendContact"
$names = @("Alice", "Bob", "Carol", "Dave", "Eve")
$results = @()

Write-Host "Starting load test (15 requests with delays)..." -ForegroundColor Cyan
Write-Host ""

1..15 | ForEach-Object {
  $email = "loadtest-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())-$_@example.com"
  $body = @{
    name        = $names[($_ % $names.Length)]
    email       = $email
    message     = "Load test message #$_ — discussing a web project."
    submittedAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  } | ConvertTo-Json

  try {
    $response = Invoke-WebRequest -Uri $url -Method POST -ContentType "application/json" -Body $body
    $parsed = $response.Content | ConvertFrom-Json
    $results += @{
      Number    = $_
      Status    = [int]$response.StatusCode
      RequestId = $response.Headers["X-Request-Id"]
      Queued    = $parsed.queued
      Depth     = $parsed.depth
      Success   = $true
    }
    Write-Host "[$_] 202 OK — queued:$($parsed.queued) depth:$($parsed.depth)" -ForegroundColor Green
  } catch {
    $statusCode = [int]$_.Exception.Response.StatusCode.value__
    $results += @{
      Number  = $_
      Status  = $statusCode
      Success = $false
    }
    if ($statusCode -eq 429) {
      Write-Host "[$_] 429 RATE_LIMITED" -ForegroundColor Yellow
    } else {
      Write-Host "[$_] $statusCode ERROR" -ForegroundColor Red
    }
  }

  # Random delay between requests: 1.5 to 3 seconds
  if ($_ -lt 15) {
    $delay = Get-Random -Minimum 1500 -Maximum 3000
    Start-Sleep -Milliseconds $delay
  }
}

Write-Host ""
Write-Host "=== Load Test Results ===" -ForegroundColor Cyan
Write-Host "Total: $($results.Count)"
$passed = ($results | Where-Object { $_.Status -eq 202 }).Count
$rateLimited = ($results | Where-Object { $_.Status -eq 429 }).Count
$errors = ($results | Where-Object { $_.Status -ne 202 -and $_.Status -ne 429 }).Count
Write-Host "202 OK: $passed"
Write-Host "429 Rate Limited: $rateLimited"
Write-Host "Other Errors: $errors"
```

### Expected Behavior

| Scenario | Expected |
|---|---|
| 15 requests with 1.5-3s delays | Most or all return `202 OK` |
| 1-2 may hit soft limit | Still `202`, but with `X-RateLimit-Soft: 1` header |
| None should hit hard limit | 15 req in ~30s is well under 60 req/min |
| No email dedup hits | Each request uses a unique email |
| Depth may increase | As queue processes previous requests (but at 1/sec concurrency, depth should stay low) |

### Aggressive Test (to trigger rate limiting)

If you want to verify rate limiting kicks in:

```powershell
Write-Host "Burst test — 12 requests with NO delay..." -ForegroundColor Yellow

1..12 | ForEach-Object {
  $email = "burst-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())-$_@example.com"
  $body = @{
    name        = "Burst User"
    email       = $email
    message     = "Burst test message #$_"
    submittedAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  } | ConvertTo-Json

  try {
    $response = Invoke-WebRequest -Uri $url -Method POST -ContentType "application/json" -Body $body
    Write-Host "[$_] 202 OK" -ForegroundColor Green
  } catch {
    $code = [int]$_.Exception.Response.StatusCode.value__
    Write-Host "[$_] $code" -ForegroundColor Yellow
  }
  # No delay — fire as fast as possible
}
```

**Expected:** ~1-3 return `202`, the rest return `429 RATE_LIMITED` (hard limit of 60 req/min reached quickly with burst).
