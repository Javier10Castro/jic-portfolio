# sendContact Persistence Verification

**Purpose:** Prove or disprove that validation rejects in `sendContact.js` persist to Neon for cross-instance lookup via `/api/logs`.

**Root cause hypothesis:** All 12 reject paths call `registerLifecycle()` which fires `_neonSave()` fire-and-forget (no `await`). On Vercel cold starts, the function may freeze before the async TCP+SSL+query completes. Same pattern as pre-fix `sendBrief.js` (commit 42efb28).

---

## 1. All sendContact.js reject paths

| # | Line | Trigger | Status | `reason` | `persistImmediate`? | Testable via payload? |
|---|---|---|---|---|---|---|
| 1 | 129-130 | Method not POST | 405 | `validation` | No | Yes (PUT) |
| 2 | 140-141 | Body parse fail | 400 | `bad_request` | No | Yes |
| 3 | 153-154 | Honeypot triggered | 200 | `validation` | No | Yes |
| 4 | 163-164 | Timing check fail | 400 | `validation` | No | Yes |
| 5 | 176-177 | Name validation fail | 400 | `validation` | No | Yes |
| 6 | 186-187 | Email validation fail | 400 | `validation` | No | Yes |
| 7 | 195-196 | Message empty | 400 | `validation` | No | Yes |
| 8 | 203-204 | Message too long | 400 | `validation` | No | Yes |
| 9 | 217-219 | Edge rate limit | 429 | `rate_limit` | No | Hard (needs 30+ req/s) |
| 10 | 228-230 | Email dedup | 429 | `rate_limit` | No | Hard (same email window) |
| 11 | 246-247 | Missing SMTP creds | 500 | `bad_request` | No | Requires env change |
| 12 | 318-319 | Queue overflow | 503 | `bad_request` | No | Needs 100+ queue depth |

**Practical scope:** Paths 2-8 (payload-triggered validation rejects).

---

## 2. Exact test payloads

### Path 2 — Body parse fail (400)
```json
NOT VALID JSON
```
Send with `Content-Type: application/json` but body is not valid JSON.

### Path 3 — Honeypot triggered (200 — silent)
```json
{
  "name": "Audit Test",
  "email": "audit@test.com",
  "message": "Test",
  "bot": "spambot_value"
}
```
Any of `{ bot, website, url, hp_name, hp_email }` with truthy value triggers honeypot.

### Path 4 — Timing check fail (400)
```json
{
  "name": "Audit Test",
  "email": "audit@test.com",
  "message": "Test"
}
```
No `submittedAt` field → `submittedAt` is `undefined` (not a number) → blocked.

### Path 5 — Name validation fail (400)
```json
{
  "name": "",
  "email": "audit@test.com",
  "message": "Test",
  "submittedAt": 9999999999999
}
```
Empty name → `cleaned.length < 1` → triggers sanitizeAndValidateName reject.

### Path 6 — Email validation fail (400)
```json
{
  "name": "Audit Test",
  "email": "not-an-email",
  "message": "Test",
  "submittedAt": 9999999999999
}
```
`not-an-email` fails `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` → triggers validateEmail reject.

### Path 7 — Message empty (400)
```json
{
  "name": "Audit Test",
  "email": "audit@test.com",
  "message": "",
  "submittedAt": 9999999999999
}
```
Empty message → `trim().length === 0` → triggers reject.

### Path 8 — Message too long (400)
```json
{
  "name": "Audit Test",
  "email": "audit@test.com",
  "message": "AAA...AAA",
  "submittedAt": 9999999999999
}
```
Message of 100,001+ characters → triggers reject.

---

## 3. Browser console tests

Open `https://web-portfolio-kappa-wheat.vercel.app/` and run each test individually. Capture the `requestId` from the response.

### Test runner
```javascript
const BASE = 'https://web-portfolio-kappa-wheat.vercel.app';

async function testSendContact(label, body) {
  const resp = await fetch(`${BASE}/api/sendContact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await resp.json();
  console.log(`[${label}] status=${resp.status} requestId=${data.requestId}`);
  return { status: resp.status, requestId: data.requestId, data };
}

async function checkLogs(requestId) {
  const resp = await fetch(`${BASE}/api/logs?id=${requestId}`);
  if (resp.status === 404) {
    console.log(`  → /api/logs: 404 NOT FOUND`);
    return null;
  }
  const data = await resp.json();
  console.log(`  → /api/logs:`, JSON.stringify(data, null, 2));
  return data;
}
```

### Test 2 — Body parse fail
```javascript
// Path 2: Send invalid JSON
const resp = await fetch(`${BASE}/api/sendContact`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: 'NOT VALID JSON{{{'
});
const data = await resp.json();
console.log(`[body-parse-fail] status=${resp.status} requestId=${data.requestId}`);
await checkLogs(data.requestId);
```

### Test 3 — Honeypot
```javascript
const r3 = await testSendContact('honeypot', {
  name: 'Audit Test',
  email: 'audit@test.com',
  message: 'Test',
  bot: 'spambot_value'
});
if (r3.requestId) await checkLogs(r3.requestId);
```

### Test 4 — Timing check (no submittedAt)
```javascript
const r4 = await testSendContact('timing-check', {
  name: 'Audit Test',
  email: 'audit@test.com',
  message: 'Test'
});
if (r4.requestId) await checkLogs(r4.requestId);
```

### Test 5 — Empty name
```javascript
const r5 = await testSendContact('empty-name', {
  name: '',
  email: 'audit@test.com',
  message: 'Test',
  submittedAt: 9999999999999
});
if (r5.requestId) await checkLogs(r5.requestId);
```

### Test 6 — Invalid email
```javascript
const r6 = await testSendContact('invalid-email', {
  name: 'Audit Test',
  email: 'not-an-email',
  message: 'Test',
  submittedAt: 9999999999999
});
if (r6.requestId) await checkLogs(r6.requestId);
```

### Test 7 — Empty message
```javascript
const r7 = await testSendContact('empty-message', {
  name: 'Audit Test',
  email: 'audit@test.com',
  message: '',
  submittedAt: 9999999999999
});
if (r7.requestId) await checkLogs(r7.requestId);
```

---

## 4. PowerShell tests

```powershell
$BASE = "https://web-portfolio-kappa-wheat.vercel.app"
$results = @()

function Test-SendContact($label, $body, $invalidJson = $false) {
  Write-Host "`n=== $label ===" -ForegroundColor Cyan

  if ($invalidJson) {
    $resp = Invoke-WebRequest -Uri "$BASE/api/sendContact" `
      -Method POST `
      -ContentType "application/json" `
      -Body 'NOT VALID JSON{{{'
  } else {
    $resp = Invoke-WebRequest -Uri "$BASE/api/sendContact" `
      -Method POST `
      -ContentType "application/json" `
      -Body ($body | ConvertTo-Json)
  }

  $data = $resp.Content | ConvertFrom-Json
  $requestId = $data.requestId
  Write-Host "Response: status=$($resp.StatusCode) requestId=$requestId"

  Start-Sleep -Milliseconds 500

  try {
    $logEntry = Invoke-RestMethod -Uri "$BASE/api/logs?id=$requestId" -ErrorAction Stop
    Write-Host "→ /api/logs: FOUND (status=$($logEntry.status))" -ForegroundColor Green
    return @{ label = $label; requestId = $requestId; persisted = $true; logEntry = $logEntry }
  } catch {
    Write-Host "→ /api/logs: 404 NOT FOUND" -ForegroundColor Red
    return @{ label = $label; requestId = $requestId; persisted = $false; logEntry = $null }
  }
}

# Run all tests sequentially
$results += Test-SendContact -label "body-parse-fail" -invalidJson $true
$results += Test-SendContact -label "honeypot" -body @{ name="Audit Test"; email="audit@test.com"; message="Test"; bot="spambot_value" }
$results += Test-SendContact -label "timing-check" -body @{ name="Audit Test"; email="audit@test.com"; message="Test" }
$results += Test-SendContact -label "empty-name" -body @{ name=""; email="audit@test.com"; message="Test"; submittedAt=9999999999999 }
$results += Test-SendContact -label "invalid-email" -body @{ name="Audit Test"; email="not-an-email"; message="Test"; submittedAt=9999999999999 }
$results += Test-SendContact -label "empty-message" -body @{ name="Audit Test"; email="audit@test.com"; message=""; submittedAt=9999999999999 }

# Summary matrix
Write-Host "`n`n========== RESULTS MATRIX ==========" -ForegroundColor Yellow
Write-Host ("{0,-20} {1,-40} {2,-15} {3,-15}" -f "Path", "RequestId", "Persisted", "Result")
Write-Host ("{0,-20} {1,-40} {2,-15} {3,-15}" -f "----", "---------", "---------", "------")
foreach ($r in $results) {
  $result = if ($r.persisted) { "PASS" } else { "FAIL" }
  Write-Host ("{0,-20} {1,-40} {2,-15} {3,-15}" -f $r.label, $r.requestId, $r.persisted, $result)
}
```

### Also test path 1 (Method not allowed) via PowerShell
```powershell
# Path 1: PUT request (not GET, not POST)
$resp = Invoke-WebRequest -Uri "$BASE/api/sendContact" -Method PUT
$data = $resp.Content | ConvertFrom-Json
$requestId = $data.requestId
Write-Host "method-not-allowed: status=$($resp.StatusCode) requestId=$requestId"

Start-Sleep -Milliseconds 500

try {
  $logEntry = Invoke-RestMethod -Uri "$BASE/api/logs?id=$requestId" -ErrorAction Stop
  Write-Host "→ /api/logs: FOUND (status=$($logEntry.status))" -ForegroundColor Green
} catch {
  Write-Host "→ /api/logs: 404 NOT FOUND" -ForegroundColor Red
}
```

---

## 5. Expected requestId values

Request IDs are generated by `crypto.randomUUID()` (UUID v4) unless the client sends an `x-request-id` header. They follow the format:

```
xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
```

Where `4` is the UUID v4 version and `y` is the variant.

**Examples:**
- `a1b2c3d4-e5f6-4789-abcd-ef0123456789`
- `550e8400-e29b-41d4-a716-446655440000`

The requestId is returned in two places:
1. Response body: `{ requestId: "...", ... }`
2. Response header: `X-Request-Id: ...`

---

## 6. Neon SQL queries

Connect to the Neon database (requires `psql` or a SQL client with `DATABASE_URL`):

```bash
# Using psql with Neon connection string
psql "$DATABASE_URL" -c "
  SELECT
    request_id,
    status,
    endpoint,
    created_at,
    error_reason
  FROM request_logs
  ORDER BY created_at DESC
  LIMIT 20;
"
```

### Single request lookup
```sql
SELECT
  request_id,
  status,
  endpoint,
  error_reason,
  validation_stage,
  validation_field,
  validation_reason,
  created_at,
  received_at,
  queued_at,
  execution_started_at,
  execution_finished_at
FROM request_logs
WHERE request_id = 'REPLACE_WITH_ACTUAL_REQUEST_ID';
```

### Count by status
```sql
SELECT
  status,
  COUNT(*)::int AS count
FROM request_logs
GROUP BY status
ORDER BY count DESC;
```

### Check for missing entries (MISSING = not persisted)
```sql
-- Expected: all test requestIds from the procedure should appear
-- If a requestId is not here, persistence failed for that path
SELECT request_id, status, created_at
FROM request_logs
WHERE request_id IN (
  'id-from-test-1',
  'id-from-test-2',
  'id-from-test-3',
  'id-from-test-4',
  'id-from-test-5',
  'id-from-test-6'
)
ORDER BY created_at DESC;
```

---

## 7. /api/logs lookup URLs

After each test, look up the returned `requestId`:

```
GET https://web-portfolio-kappa-wheat.vercel.app/api/logs?id=<requestId>
```

### Expected response (PASS — persisted)
```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "rejected",
  "errorReason": "validation",
  "receivedAt": 1781216167342,
  "createdAt": "2026-06-11T22:16:08.058Z"
}
```

### Actual response on failure (FAIL — not persisted)
```json
{
  "error": "Request not found"
}
```
Status: 404

---

## 8. Final results matrix

Copy this table and fill it after running all tests.

| # | Path | RequestId | Persisted in Neon | Found in /api/logs | PASS/FAIL |
|---|---|---|---|---|---|
| 1 | Method not allowed (405) | | Y/N | Y/N | |
| 2 | Body parse fail (400) | | Y/N | Y/N | |
| 3 | Honeypot (200) | | Y/N | Y/N | |
| 4 | Timing check (400) | | Y/N | Y/N | |
| 5 | Empty name (400) | | Y/N | Y/N | |
| 6 | Invalid email (400) | | Y/N | Y/N | |
| 7 | Empty message (400) | | Y/N | Y/N | |
| 8 | Message too long (400) | | Y/N | Y/N | |

### PASS criteria
A path passes if:
1. `POST /api/sendContact` returns a response with `requestId`
2. `GET /api/logs?id=<requestId>` returns 200 with the entry (cross-instance)

### FAIL criteria
A path fails if:
1. `POST /api/sendContact` returns a response with `requestId`
2. `GET /api/logs?id=<requestId>` returns 404 (entry was never persisted to Neon)

If **any** path shows FAIL, the theoretical defect is **demonstrated** — the same root cause as the pre-fix sendBrief bug exists in sendContact.

---

## Interpretation

| Pattern | Meaning |
|---|---|
| All paths PASS on first attempt | Fire-and-forget `_neonSave` completes fast enough on this Vercel instance. Run 3x more times to test cold-start variance. |
| Some paths FAIL sporadically | Race condition confirmed — depends on Vercel cold-start timing. Same bug class as sendBrief. |
| Specific paths consistently FAIL | Those paths have additional latency (e.g., body parsing on path 2 takes longer, giving less time for `_neonSave` before freeze). |

If the first run shows all PASS, re-run the battery 3+ times with 60-second gaps between runs (to force Vercel cold starts).
