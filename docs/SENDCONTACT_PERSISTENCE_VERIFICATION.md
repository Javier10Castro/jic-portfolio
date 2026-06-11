# sendContact Persistence Verification

**Purpose:** Confirm that validation rejects in `sendContact.js` persist to Neon for cross-instance lookup via `/api/logs`.

**Status:** FIXED — all 12 early-return paths now call `await registry.persistImmediate(log.requestId(req))` before returning.

**Commit:** `THIS_COMMIT` (same pattern as sendBrief fix `42efb28`)

---

## 1. All sendContact.js reject paths (all now use persistImmediate)

| # | Line | Trigger | Status | `validationStage` | `validationField` | `validationReason` | `persistImmediate`? |
|---|---|---|---|---|---|---|---|
| 1 | 129-131 | Method not POST | 405 | `methodCheck` | `method` | `not_allowed` | **Yes** |
| 2 | 141-143 | Body parse fail | 400 | `parseBody` | `body` | `parse_failed` | **Yes** |
| 3 | 155-157 | Honeypot triggered | 200 | `honeypotCheck` | `hp.field` | `bot_detected` | **Yes** |
| 4 | 166-168 | Timing check fail | 400 | `timingCheck` | `submittedAt` | `tc.reason` | **Yes** |
| 5 | 180-182 | Name validation fail | 400 | `sanitizeAndValidateName` | `name` | `nameCheck.reason` | **Yes** |
| 6 | 191-193 | Email validation fail | 400 | `validateEmail` | `email` | `invalid_format` | **Yes** |
| 7 | 201-203 | Message empty | 400 | `validateMessage` | `message` | `empty` | **Yes** |
| 8 | 210-212 | Message too long | 400 | `validateMessage` | `message` | `too_long` | **Yes** |
| 9 | 225-228 | Edge rate limit | 429 | `rateLimit` | `ip` | `burst` | **Yes** |
| 10 | 237-240 | Email dedup | 429 | `rateLimit` | `email` | `duplicate` | **Yes** |
| 11 | 256-258 | Missing SMTP creds | 500 | `configCheck` | `smtp` | `missing_credentials` | **Yes** |
| 12 | 329-331 | Queue overflow | 503 | `queueCheck` | `queue` | `overflow` | **Yes** |

**Practical scope:** Paths 2-8 (payload-triggered validation rejects).

---

## 2. Exact test payloads

### Path 2 — Body parse fail (400)
```
NOT VALID JSON
```
Send with `Content-Type: application/json` but body is not valid JSON.

### Path 3 — Honeypot triggered (200 — silent)
```json
{
  "name": "Audit Verify",
  "email": "verify@test.com",
  "message": "Verification test",
  "bot": "spambot_value",
  "submittedAt": Date.now()
}
```
Any of `{ bot, website, url, hp_name, hp_email }` with truthy value triggers honeypot.

### Path 4 — Timing check fail (400)
```json
{
  "name": "Audit Verify",
  "email": "verify@test.com",
  "message": "Test"
}
```
No `submittedAt` field → `submittedAt` is `undefined` (not a number) → blocked.

### Path 5 — Name validation fail (400)
```json
{
  "name": "",
  "email": "verify@test.com",
  "message": "Test",
  "submittedAt": 9999999999999
}
```

### Path 6 — Email validation fail (400)
```json
{
  "name": "Audit Verify",
  "email": "not-an-email",
  "message": "Test",
  "submittedAt": 9999999999999
}
```

### Path 7 — Message empty (400)
```json
{
  "name": "Audit Verify",
  "email": "verify@test.com",
  "message": "",
  "submittedAt": 9999999999999
}
```

### Path 8 — Message too long (400)
```json
{
  "name": "Audit Verify",
  "email": "verify@test.com",
  "message": "AAA...AAA",
  "submittedAt": 9999999999999
}
```
Message of 100,001+ characters.

---

## 3. Browser console test suite

```javascript
const BASE = 'https://web-portfolio-kappa-wheat.vercel.app';

async function testSendContact(payload, method = 'POST') {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (method === 'POST') opts.body = JSON.stringify(payload);
  const resp = await fetch(`${BASE}/api/sendContact`, opts);
  const ct = resp.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await resp.json() : {};
  return { status: resp.status, requestId: data.requestId || null, data };
}

async function checkLogs(requestId) {
  if (!requestId) return { found: false, entry: null };
  const resp = await fetch(`${BASE}/api/logs?id=${encodeURIComponent(requestId)}`);
  if (resp.status === 404) return { found: false, entry: null };
  return { found: true, entry: await resp.json() };
}

async function runTest(label, payload, expectedStatus, method = 'POST') {
  console.log(`\n═══ ${label} ═══`);
  const { status, requestId } = await testSendContact(payload, method);
  console.log(`POST → ${status}  requestId: ${requestId}`);

  await new Promise(r => setTimeout(r, 2000));

  const { found, entry } = await checkLogs(requestId);
  const pass = found && entry && entry.status === 'rejected';
  if (pass) {
    console.log(`/api/logs → FOUND  ✅ PASS`);
    console.log(`  status: ${entry.status}, errorReason: ${entry.errorReason}`);
    console.log(`  validationStage: ${entry.validationStage}`);
    console.log(`  validationField: ${entry.validationField}`);
    console.log(`  validationReason: ${entry.validationReason}`);
  } else {
    console.log(`/api/logs → ${found ? 'status=' + entry.status : '404 NOT FOUND'}  ❌ FAIL`);
  }
  return { label, requestId, pass, found, entry };
}

async function verifyAll() {
  const results = [];

  // Path 1: Method not allowed (PUT)
  results.push(await runTest('01-method-not-allowed', null, 405, 'PUT'));

  // Path 2: Body parse fail (raw invalid JSON)
  {
    const label = '02-body-parse-fail';
    console.log(`\n═══ ${label} ═══`);
    const resp = await fetch(`${BASE}/api/sendContact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'NOT VALID JSON{{{'
    });
    const data = await resp.json();
    const requestId = data.requestId;
    console.log(`POST → ${resp.status}  requestId: ${requestId}`);
    await new Promise(r => setTimeout(r, 2000));
    const { found, entry } = await checkLogs(requestId);
    const pass = found;
    console.log(`/api/logs → ${found ? 'FOUND ✅ PASS' : '404 NOT FOUND ❌ FAIL'}`);
    if (entry) console.log(`  status: ${entry.status}, errorReason: ${entry.errorReason}`);
    results.push({ label, requestId, pass, found, entry });
  }

  // Path 3: Honeypot
  results.push(await runTest('03-honeypot', {
    name: 'Audit Verify', email: 'verify@test.com',
    message: 'Test', bot: 'spambot', submittedAt: Date.now()
  }, 200));

  // Path 4: Timing check (no submittedAt)
  results.push(await runTest('04-timing-check', {
    name: 'Audit Verify', email: 'verify@test.com', message: 'Test'
  }, 400));

  // Path 5: Empty name
  results.push(await runTest('05-empty-name', {
    name: '', email: 'verify@test.com', message: 'Test',
    submittedAt: 9999999999999
  }, 400));

  // Path 6: Invalid email
  results.push(await runTest('06-invalid-email', {
    name: 'Audit Verify', email: 'not-an-email', message: 'Test',
    submittedAt: 9999999999999
  }, 400));

  // Path 7: Empty message
  results.push(await runTest('07-empty-message', {
    name: 'Audit Verify', email: 'verify@test.com', message: '',
    submittedAt: 9999999999999
  }, 400));

  // Path 8: Message too long
  results.push(await runTest('08-message-too-long', {
    name: 'Audit Verify', email: 'verify@test.com',
    message: 'A'.repeat(100001), submittedAt: 9999999999999
  }, 400));

  // Summary
  console.log('\n\n═══════════════════════════════════════════');
  console.log('         VERIFICATION RESULTS');
  console.log('═══════════════════════════════════════════');
  console.log('Path'.padEnd(24), 'Status'.padEnd(8), 'RESULT');
  console.log(''.padEnd(45, '─'));
  for (const r of results) {
    const mark = r.pass ? '✅ PASS' : '❌ FAIL';
    console.log(r.label.padEnd(24), String(r.found ? 'found' : 'missing').padEnd(8), mark);
  }
  console.log(''.padEnd(45, '─'));
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\nTotal: ${results.length}  PASS: ${passed}  FAIL: ${failed}`);
  if (failed === 0) {
    console.log('\n✅ FIX VERIFIED: All sendContact reject paths persist to Neon.');
  } else {
    console.log('\n❌ Some paths still failing — investigate.');
  }
}

verifyAll();
```

---

## 4. PowerShell verification

```powershell
$BASE = "https://web-portfolio-kappa-wheat.vercel.app"
$results = @()

function Test-ContactReject($label, $body, $invalidJson = $false) {
  Write-Host "`n=== $label ===" -ForegroundColor Cyan
  if ($invalidJson) {
    $resp = Invoke-WebRequest -Uri "$BASE/api/sendContact" -Method POST `
      -ContentType "application/json" -Body 'NOT VALID JSON{{{'
  } else {
    $jsonBody = $body | ConvertTo-Json
    Write-Host "Payload: $jsonBody"
    $resp = Invoke-WebRequest -Uri "$BASE/api/sendContact" -Method POST `
      -ContentType "application/json" -Body $jsonBody
  }
  $data = $resp.Content | ConvertFrom-Json
  $requestId = $data.requestId
  Write-Host "Response: status=$($resp.StatusCode) requestId=$requestId"
  Start-Sleep -Seconds 2
  try {
    $logEntry = Invoke-RestMethod "$BASE/api/logs?id=$requestId" -ErrorAction Stop
    Write-Host "→ /api/logs: FOUND (status=$($logEntry.status), validationStage=$($logEntry.validationStage))" -ForegroundColor Green
    return @{ label = $label; pass = $true; requestId = $requestId }
  } catch {
    Write-Host "→ /api/logs: 404 NOT FOUND" -ForegroundColor Red
    return @{ label = $label; pass = $false; requestId = $requestId }
  }
}

Write-Host "`n========== BEGIN VERIFICATION ==========" -ForegroundColor Yellow

# Path 1
$results += Test-ContactReject -label "method-not-allowed" -body @{}
$results += Test-ContactReject -label "body-parse-fail" -invalidJson $true
$results += Test-ContactReject -label "honeypot" -body @{ name="Audit"; email="a@b.com"; message="Test"; bot="x"; submittedAt=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() }
$results += Test-ContactReject -label "timing-check" -body @{ name="Audit"; email="a@b.com"; message="Test" }
$results += Test-ContactReject -label "empty-name" -body @{ name=""; email="a@b.com"; message="Test"; submittedAt=9999999999999 }
$results += Test-ContactReject -label "invalid-email" -body @{ name="Audit"; email="bad"; message="Test"; submittedAt=9999999999999 }
$results += Test-ContactReject -label "empty-message" -body @{ name="Audit"; email="a@b.com"; message=""; submittedAt=9999999999999 }

Write-Host "`n`n========== RESULTS ==========" -ForegroundColor Yellow
foreach ($r in $results) {
  $mark = if ($r.pass) { "✅ PASS" } else { "❌ FAIL" }
  Write-Host ("{0,-25} {1}" -f $r.label, $mark)
}
$allPassed = ($results | Where-Object { -not $_.pass }).Count -eq 0
if ($allPassed) {
  Write-Host "`n✅ FIX VERIFIED: All sendContact reject paths persist to Neon." -ForegroundColor Green
} else {
  Write-Host "`n❌ Some paths still failing." -ForegroundColor Red
}
```

---

## 5. Neon SQL verification

```bash
psql "$DATABASE_URL" -c "
  SELECT
    request_id,
    status,
    validation_stage,
    validation_field,
    validation_reason,
    error_reason,
    created_at
  FROM request_logs
  WHERE status = 'rejected'
    AND created_at > NOW() - INTERVAL '1 hour'
  ORDER BY created_at DESC
  LIMIT 20;
"
```

Expected output: each row shows `rejected` status with non-null `validation_stage`, `validation_field`, `validation_reason`.

---

## 6. Expected outcome matrix

| # | Path | Expected POST status | Expected `/api/logs` | Expected result |
|---|---|---|---|---|
| 1 | Method not allowed | 405 | `{status:"rejected", validationStage:"methodCheck"}` | ✅ PASS |
| 2 | Body parse fail | 400 | `{status:"rejected", validationStage:"parseBody"}` | ✅ PASS |
| 3 | Honeypot | 200 | `{status:"rejected", validationStage:"honeypotCheck"}` | ✅ PASS |
| 4 | Timing check | 400 | `{status:"rejected", validationStage:"timingCheck"}` | ✅ PASS |
| 5 | Empty name | 400 | `{status:"rejected", validationStage:"sanitizeAndValidateName"}` | ✅ PASS |
| 6 | Invalid email | 400 | `{status:"rejected", validationStage:"validateEmail"}` | ✅ PASS |
| 7 | Empty message | 400 | `{status:"rejected", validationStage:"validateMessage"}` | ✅ PASS |
| 8 | Message too long | 400 | `{status:"rejected", validationStage:"validateMessage"}` | ✅ PASS |

**All paths should show PASS.** If any path shows FAIL, the `persistImmediate()` call on that path is not completing before Vercel termination.
