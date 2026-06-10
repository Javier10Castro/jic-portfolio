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
| `email.sendStart` | SMTP starts | ❌ (background) |
| `email.sendEnd` | SMTP completes | ❌ (background) |

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

# Queue status
Invoke-RestMethod -Uri 'https://web-portfolio-kappa-wheat.vercel.app/api/queue-status'

# Rate limit status
Invoke-RestMethod -Uri 'https://web-portfolio-kappa-wheat.vercel.app/api/rate-limit-status'
```
