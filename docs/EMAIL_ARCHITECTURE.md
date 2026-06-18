# Email Delivery Architecture

## Overview

Email delivery for both `sendContact` and `sendBrief` uses **inline execution** within
the HTTP request lifecycle. All SMTP operations complete before the HTTP response is
sent. No background queues, no fire-and-forget workers.

---

## Why the Queue Was Removed

### Problem

The original architecture used a FIFO in-memory queue:

```
REQUEST → validation → enqueue() → HTTP 202 → queue worker runs SMTP in background
```

Forensic analysis (see `FINAL_EXECUTION_TRACE_REPORT.md`) confirmed that **Vercel
does not guarantee background execution after the HTTP response is sent**. The queue
worker (`lib/queue.js`) would begin executing inside the Vercel function, but the
function could be frozen at any moment after the 202 response was returned.

### Evidence

- `transporter.verify.start` appeared in logs
- `transporter.verify.complete` NEVER appeared
- No SMTP events (`smtp.start.*`, `smtp.complete.*`) ever fired
- `tracer: saveTrace failed` and `Connection terminated due to connection timeout`
  appeared ~33s later (secondary symptoms)
- Average execution time of 13,360ms (near Vercel's 10-15s function timeout)
- Inline execution (all SMTP before HTTP 200) completed in 1.3–1.9s with 100%
  success rate

### Root Cause

**Vercel freezes serverless functions after the HTTP response is sent.** Any code
running in `setTimeout`, `setImmediate`, or `Promise.then()` callbacks after the
response is not guaranteed to execute. The in-memory queue relied on `setImmediate`
to drain, making it unreliable in this environment.

---

## Current Architecture (Inline)

```
REQUEST
  │
  ├─ Validation chain (sync, fast)
  │   ├─ Method check
  │   ├─ Body parse
  │   ├─ Honeypot check
  │   ├─ Timing check
  │   ├─ Name/email/message validation
  │   └─ Rate limit check
  │
  ├─ Config: Nodemailer transporter (Gmail SMTP)
  │   ├─ connectionTimeout: 3000ms
  │   ├─ greetingTimeout: 3000ms
  │   └─ socketTimeout: 5000ms
  │
  ├─ transporter.verify() ← 5s timeout
  │
  ├─ Promise.allSettled([
  │     sendWithTimeout(admin email, 5s),
  │     sendWithTimeout(client email, 5s)
  │   ])
  │
  ├─ registry.persistImmediate() ← 5s timeout (Neon INSERT)
  │
  ├─ tracer.drain() ← 5s timeout (flush Neon traces)
  │
  └─ HTTP 200 response
       { success: true, mode: 'inline', adminOk, clientOk }
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **Inline before HTTP 200** | Vercel must keep function alive until response is sent |
| **5s timeouts on all external calls** | Prevents hanging on Gmail/Neon network issues |
| **Promise.allSettled** | One email failure doesn't block the other |
| **No queue** | Queue is unreliable in Vercel serverless (see above) |
| **No fire-and-forget** | All async work completes before response is returned |

### Timeout Strategy

| Component | Timeout | Behavior on Timeout |
|---|---|---|
| `transporter.verify()` | 5s | Logs `verify.timeout`, returns 500 error |
| `sendWithTimeout()` | 5s | Logs `smtp.timeout.{label}`, returns `false` for that email |
| `persistImmediate()` | 5s | Logs `persist.timeout`, continues (best-effort) |
| `tracer.drain()` | 5s | Logs `drain.timeout`, continues (best-effort) |

### Structured Log Events

```
request.received
validation.ok
verify.before
verify.after               (or verify.timeout / verify.catch)
smtp.start.admin
smtp.start.client
smtp.complete.admin        (or smtp.timeout.admin / smtp.error.admin)
smtp.complete.client       (or smtp.timeout.client / smtp.error.client)
persist.after              (or persist.timeout / persist.catch)
drain.after                (or drain.timeout / drain.catch)
```

---

## Lessons Learned

### Serverless Lifecycle Constraints

1. **Response = deadline.** In serverless platforms like Vercel, sending the HTTP
   response signals that the function's work is complete. Background execution is
   not guaranteed.

2. **No persistent background workers.** In-memory queues, `setTimeout`-based
   schedulers, and `setImmediate` drains are unreliable. They may work in
   development but fail unpredictably under production load.

3. **Always await before responding.** All I/O (SMTP, database, external APIs)
   must complete before the HTTP response is sent.

4. **Use timeouts aggressively.** Network calls to Gmail SMTP, PostgreSQL (Neon),
   or any external service can hang. Always wrap them in `Promise.race` with a
   reasonable timeout.

5. **Promise.allSettled over Promise.all.** When sending multiple independent
   emails, use `allSettled` so one failure doesn't cascade and block the others.

---

## File Structure

```
api/sendContact.js     — Contact form handler (inline SMTP)
api/sendBrief.js       — Brief form handler (inline SMTP + PDF generation)
lib/request-registry.js — Lifecycle persistence (Neon + memory)
lib/tracer.js          — Path tracing system (Neon + memory)

Removed:
lib/queue.js           — Deleted (unreliable in Vercel serverless)
```

## Monitoring

Check delivery success via:
- Response body: `{ adminOk: true, clientOk: true }`
- Telemetry: `GET /api/telemetry?type=logs&id=<requestId>`
- Health: `GET /api/telemetry?type=health` (no queue section — inline only)
