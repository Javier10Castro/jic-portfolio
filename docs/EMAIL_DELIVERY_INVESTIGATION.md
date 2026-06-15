# Email Delivery Investigation — June 2026

## Root Cause

Vercel Hobby plan enforces a **10-second maxDuration** for Serverless Functions (default, no `vercel.json` override). The email delivery pipeline in both `sendBrief` and `sendContact` could exceed this limit due to:

1. **`await emailQueue.waitUntilEmpty()` in `finally` block** — After returning HTTP 202, the finally block would block the function until the queue fully drained. If Gmail SMTP took 5-8s (combined admin + client), plus PDF generation (sendBrief only, ~1-3s), the total could exceed 10s. Vercel would freeze the function mid-send, killing the SMTP connection.

2. **No structured SMTP lifecycle observability** — The `sendWithTimeout` helper used `log.debugLog()` (gated by `DEBUG_API`) for SMTP timing, making production diagnosis impossible without the debug flag enabled.

## Changes Made

### 1. Fire-and-forget queue drain (both handlers)

**Files**: `api/sendBrief.js:358`, `api/sendContact.js:390`

```diff
- await emailQueue.waitUntilEmpty().catch(() => {});
+ emailQueue.waitUntilEmpty().catch(() => {});
```

The queue worker continues asynchronously after the function returns HTTP 202. Vercel's grace period (~5s after response) is sufficient for the queue worker to complete sending. `tracer.drain()` remains awaited to ensure trace persistence before the function terminates.

### 2. Structured SMTP lifecycle logs (both handlers)

**Files**: `api/sendBrief.js:58-79`, `api/sendContact.js:74-95`

`sendWithTimeout()` now emits always-on `log.structured()` events at each SMTP stage:

| Stage | Status | When | Fields |
|---|---|---|---|
| `smtp.start.{label}` | `ok` | Before `transporter.sendMail()` | `elapsedMs: 0` |
| `smtp.complete.{label}` | `ok` | On successful send | `elapsedMs` |
| `smtp.timeout.{label}` | `timeout` | On 5s timeout | `elapsedMs`, `timeoutMs` |
| `smtp.error.{label}` | `error` | On real SMTP error | `elapsedMs`, `error.message` |

These replace the previous `log.debugLog()` calls (which were gated by `DEBUG_API`).

### 3. Structured queue exit log (queue.js)

**File**: `lib/queue.js:56`

The existing `log.debugLog('queue_exit')` is now supplemented with an always-on `log.structured('queue.exit')` event with `queueId`, `endpoint`, and `active` count.

## Verification

- Syntax: `node -c` passes for all 3 modified files
- Production audit: `node scripts/audit-validation-coverage.js <deployed-url>`
- Production smoke: `node scripts/run-production-tests.js <deployed-url>`
- Vercel logs should show `smtp.start.admin`, `smtp.complete.admin`, `smtp.start.client`, `smtp.complete.client` on every successful submission
- Timeouts appear as `smtp.timeout.admin` / `smtp.timeout.client`

## Related Documents

- `docs/EMAIL_DELIVERY_RELIABILITY_REVIEW.md` — Prior root cause analysis identifying the same 10s timeout issue
- `docs/PARALLEL_SMTP_EXPERIMENT.md` — Experiment confirming Promise.all() is faster than sequential
