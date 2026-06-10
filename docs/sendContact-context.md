# sendContact Context

## Overview

`POST /api/sendContact` — Portfolio contact form handler with queue-based async SMTP, multi-layer rate limiting, lifecycle tracing, and test-aware instrumentation.

## Architecture

```
Client → Vercel Function → safeBodyParser → honeypot + timing checks
  → rate-limit (edge IP + email dedup) → queue → SMTP (admin + client emails)
```

## Rate Limiting

| Layer | Scope | Window | Limit | Response |
|---|---|---|---|---|
| Edge Soft | IP (per instance) | 60s | 30 | `X-RateLimit-Soft: 1` + warning headers |
| Edge Hard | IP (per instance) | 60s | 60 | 429 `RATE_LIMITED`, `limitType: 'ip'` |
| Email Dedup | Email address | 300s | 1 | 429 `RATE_LIMITED`, `limitType: 'email'` |

## Queue System

| Property | Value |
|---|---|
| Max depth | 100 |
| Concurrency | 1 (serial) |
| Retries | 3 (exponential backoff: 2s, 4s, 8s) |
| Timeout per send | 5000ms |

## Lifecycle Stages

| Stage | When | Visible in debug |
|---|---|---|
| `request.received` | Request arrives | ✅ |
| `body.parse` | JSON parsed | ✅ |
| `validation` | Fields validated | ✅ |
| `rateLimit` | IP + email checked | ✅ |
| `queue.assign` | Enqueued | ✅ |
| `queue.waitStart` | Entered queue | ✅ |
| `queue.waitEnd` | Worker picked up | ❌ (background) |
| `email.admin.start` | Admin notification SMTP begins | ❌ (background) |
| `email.admin.complete` | Admin notification sent/timeout | ❌ (background) |
| `email.client.start` | Client confirmation SMTP begins | ❌ (background) |
| `email.client.complete` | Client confirmation sent/timeout | ❌ (background) |
| `email.sendEnd` | Both emails finished (ok or partial) | ❌ (background) |
| `email.retry` | SMTP retry attempt (N of 3) | ❌ (background) |

## Response Headers (202)

| Header | Value | Purpose |
|---|---|---|
| `X-Queue-Id` | numeric ID | Queue entry identifier for trace correlation |
| `X-Queue-Depth` | number | Total items in queue (including this one) |
| `X-Queue-Position` | number | This item's position in queue (0 = immediate) |
| `X-Processing-Mode` | `queued` or `immediate` | Whether request waits or processes right away |
| `X-RateLimit-Limit` | number | IP rate limit hard threshold (60) |
| `X-RateLimit-Remaining` | number | Remaining requests in current window |
| `X-RateLimit-Soft` | `1` | Present only when soft limit reached (warning) |

## Debug Mode

Append `?debug=true` to include:

- `lifecycle` array with per-stage `ms` and `deltaMs`
- `testMode` if `x-test-mode` header was sent

## Test Mode Classifier

`x-test-mode` header (optional, case-insensitive):

| Value | Purpose | Expected behavior |
|---|---|---|
| `validation` | Test field validation | Send invalid fields → expect 400 |
| `rate-limit` | Test throttling | Send rapidly → expect 429 after limit |
| `queue` | Test queue behavior | Send with `?debug=true` → inspect lifecycle |
| `load` | Test sustained traffic | Send continuously → monitor queue depth |

---

## Testing Strategy

### Test Types

#### Validation Tests → 400 expected
- Missing name, invalid email, empty message
- Stale/future `submittedAt` timestamps
- Honeypot fields triggered
- `x-test-mode: validation` to tag in logs

#### Rate Limit Tests → controlled throttling
- Fire requests rapidly from same IP → observe 429 after hard limit (60 req/60s)
- Same email within 5 min → 429 with `limitType: 'email'`
- Use `x-test-mode: rate-limit` to tag in logs
- Check `GET /api/rate-limit-status` between bursts to confirm window state

#### Queue Tests → debug mode analysis
- Send with `?debug=true` → verify lifecycle trace has all stages up to `queue.waitStart`
- Use `x-test-mode: queue` to tag in logs
- Check `GET /api/queue-status` to confirm depth and oldest request age

#### Load Tests → sustained traffic simulation
- Sustained traffic at controlled rate (e.g. 5 req/s for 30s)
- Never mix validation, rate limit, and load testing in the same execution loop
- Monitor `GET /api/queue-status` for backlog growth
- Monitor `GET /api/rate-limit-status` for window saturation

### Golden Rule

> **Never mix validation, rate limit, and load testing in the same execution loop.**

**Why this matters:**
- Prevents false 429 interpretation (was it rate-limited or validation-rejected?)
- Preserves queue visibility (validation rejects never reach queue)
- Avoids masking real performance issues (load + validation errors in same loop inflates failure rate)

### PowerShell Quick Reference

```powershell
# Validation test
$req = @{ name=''; email='bad'; message=''; submittedAt=([DateTimeOffset]::Now.ToUnixTimeMilliseconds()) } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'https://web-portfolio-kappa-wheat.vercel.app/api/sendContact' -Body $req -ContentType 'application/json'

# Rate limit test with classifier
$body = @{ name='Test'; email='test@example.com'; message='load test'; submittedAt=([DateTimeOffset]::Now.ToUnixTimeMilliseconds()) } | ConvertTo-Json
1..10 | ForEach-Object { Invoke-RestMethod -Method Post -Uri 'https://web-portfolio-kappa-wheat.vercel.app/api/sendContact' -Body $body -ContentType 'application/json' -Headers @{ 'x-test-mode' = 'rate-limit' } }

# Queue status (consolidated into health endpoint)
Invoke-RestMethod -Uri 'https://web-portfolio-kappa-wheat.vercel.app/api/health?section=queue'

# Rate limit status (consolidated into health endpoint)
Invoke-RestMethod -Uri 'https://web-portfolio-kappa-wheat.vercel.app/api/health?section=rate-limit'
```

---

## Changelog

[2026-06-10T07:10:00Z] - Split `email.sendStart`/`email.sendEnd` into per-email progress stages
Reason: long-running SMTP sends for admin + client emails had no intermediate progress indicators — failures in one email masked the other's status
Impact: four new lifecycle stages (`email.admin.start`, `email.admin.complete`, `email.client.start`, `email.client.complete`) with per-email ok/timeout status

[2026-06-10T07:10:00Z] - Added `email.sendEnd` status distinction (`ok` vs `partial`)
Reason: if only one of two emails succeeds, `email.sendEnd: partial` signals the issue without losing the successful delivery
Impact: `email.sendEnd` now reports `ok` (both succeeded) or `partial` (at least one timed out)

[2026-06-10T07:10:00Z] - Added `email.retry` lifecycle traces on SMTP failure
Reason: retries were logged via `log.warn` but invisible in lifecycle traces — structured logs now capture each retry attempt with attempt number, delay, and error
Impact: `email.retry` lifecycle stage with `attempt_1|2|3`, `success_attempt_N`, `fail_attempt_N`, `failover_attempt_N` statuses

[2026-06-10T07:10:00Z] - Added `X-RateLimit-Remaining` and `X-RateLimit-Limit` headers on 202 success responses
Reason: clients need to know their remaining rate limit budget after a successful submission, not just after a 429 block
Impact: every 202 response now includes `X-RateLimit-Limit: 60` and `X-RateLimit-Remaining: <N>` headers (backward-compatible, additive)
```
