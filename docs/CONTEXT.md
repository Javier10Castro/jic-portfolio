# Web Portfolio API — System Context

## Overview

This project is a serverless API deployed on Vercel that powers contact forms and brief submission flows for a portfolio website.

It includes:
- Contact form submission (`/api/sendContact`)
- Brief request system (`/api/sendBrief`)
- Email delivery via SMTP (Nodemailer)
- Queue-based async processing
- Multi-layer rate limiting system

---

## Architecture

### 1. Request Flow

Client → API Route → Body Parser → Validation → Rate Limit → Queue → Email Worker

---

## Ingestion Boundary Principle

Rate limiting is a **pre-admission gate**, not a queue management feature. The boundary between "outside" and "inside" the system is the rate limit check.

### Visual Model

```
Outside System (Pre-Boundary)              Inside System (Post-Boundary)
┌──────────────────────────────┐          ┌────────────────────────────┐
│ HTTP Request arrives         │          │ Queue (FIFO scheduler)    │
│ Body parsed                  │  429     │ Background SMTP worker    │
│ Honeypot + timing checked    │◄────     │ Retry logic               │
│ Fields validated             │          │ Lifecycle tracing         │
│ Rate limit evaluated         │          │ Observability export      │
└──────────────────────────────┘          └────────────────────────────┘
        │                                           ▲
        └──────────── only if ALLOWED ──────────────┘
```

### Core Rules

1. **Rate limit decisions are independent of queue state.** Queue depth does not influence rate limit thresholds. A deep queue does not relax rate limiting.
2. **429 responses are immediate — no queue allocation.** A rate-limited request returns before any queue memory or execution record is created.
3. **Queue metrics only reflect admitted traffic.** Queue depth = filtered throughput, not total request volume. A queue depth of 0 during a traffic spike means the gate is working, not that the system is idle.
4. **The queue does NOT absorb traffic spikes.** Spikes are absorbed by the rate limit gate. The queue only sees the steady-state flow that passed the gate.
5. **Fail-fast loops test the gate, not the queue.** A burst of rapid requests producing 429s is expected gateway behavior — it provides zero data about queue or SMTP performance.

### Testing Guidelines

| Test Type | Delay | What It Tests | Expected Result |
|---|---|---|---|
| **Baseline** | None | Single request end-to-end | 202 with position=0, depth=0 |
| **Controlled throughput** | ≥250ms | Queue stability + FIFO ordering | All 202, depth varies, position increases |
| **Progressive stress** | 100ms → decrease | Rate limit threshold discovery | N×202, then 429 at threshold |
| **Fail-fast (burst)** | None | Gateway limit only | Mostly 429, queue depth near 0 |

### Common Pitfall

> "The queue absorbs traffic spikes so I can fire requests as fast as I want."

**This is incorrect.** The queue only receives requests that pass rate limiting. A burst that triggers rate limiting at the gate never reaches the queue. Testing queue performance requires staying within rate limit bounds — use unique emails per request and ≥250ms spacing.

---

## System Execution Model (Updated Mental Model)

The system operates as a two-stage pipeline:

```
Stage 1 — Network Gate (Rate Limit / Edge Protection)
  ├── IP sliding window (soft 30, hard 60 req/60s)
  ├── Email dedup (1 req/300s per address)
  ├── Honeypot detection
  └── Timing check (submittedAt validation)

Stage 2 — Execution Layer (Internal Queue Scheduler)
  ├── FIFO in-memory queue (max depth 100)
  ├── Background SMTP worker (serial, concurrency=1)
  ├── Retry logic (3 attempts, exponential backoff)
  └── Lifecycle tracing (7+ stages)
```

**Only requests that pass Stage 1 enter Stage 2.**

### Critical Distinction

| Aspect | Network Gate (Stage 1) | Execution Layer (Stage 2) |
|---|---|---|
| Purpose | Protect system from abuse | Deliver emails reliably |
| Response on failure | 429 (immediate, no queue entry) | 503 (queue overflow, rare) |
| State | Per-instance sliding window | Per-instance FIFO queue |
| Observability | `X-RateLimit-*` headers, `/api/health?section=rate-limit` | `X-Queue-*` headers, lifecycle trace, `/api/health?section=queue` |
| What it measures | Request volume per IP/email | Execution throughput and backlog |

### Why This Matters for Testing

- A 429 response is NOT a system failure — it is correct gateway behavior
- Queue depth reflects only successfully admitted requests, not total traffic
- Fail-fast loops (no delay) test rate limit thresholds, not queue performance
- To test queue behavior, use controlled throughput with delays (e.g. 250ms between requests)

---

## Request Lifecycle Observability

Every requestId traces through 5 explicit lifecycle states with 4 timestamps and 3 derived metrics. The registry (`lib/request-registry.js`) enforces a 5-minute TTL via periodic cleanup (60s interval), on-lookup expiry, and on-aggregate expiry. Derived metrics (`executionDurationMs`, `queueWaitTimeMs`, `totalLifecycleTimeMs`) are persisted in the registry Map alongside raw timestamps, enabling accurate aggregate computations.

### States

| State | When | Transition |
|---|---|---|
| `queued` | After queue.assign, before worker | → processing |
| `processing` | Worker dequeues and starts | → completed or failed |
| `completed` | Both emails sent successfully | Terminal |
| `failed` | Email failure after retries | Terminal |
| `rejected` | Pre-queue failure (validation/rate-limit/bad-request) | Terminal |

### Timestamps

- `receivedAt` — HTTP request arrival
- `queuedAt` — queue entry
- `executionStartedAt` — worker starts (single source: `queue.js:52`)
- `executionFinishedAt` — processing ends

### Derived Metrics

`queueWaitTimeMs`, `executionDurationMs`, `totalLifecycleTimeMs`

### Diagnostic Endpoint

`GET /api/sendContact?id=<requestId>` — returns full lifecycle record for recent requests (in-memory, 1,000 entries, 5min TTL enforced). Expired entries return 404.

### Aggregate Metrics (per-instance)

`/api/health?section=queue` exposes a `lifecycle` block with aggregate stats. `/api/health` (default summary) also includes `lifecycle`.

**Note**: These metrics are per-instance only — Vercel isolates `api/sendContact.js` and `api/telemetry.js` into separate serverless functions without shared memory. The health endpoint always shows 0 lifecycle entries for a different function instance. Within the same instance (`GET /api/sendContact?id=X`), derived metrics and aggregates are now accurate, with `averageExecutionTimeMs` and `averageQueueWaitTimeMs` reflecting real averages instead of always 0.

---

## Client Retry & Backoff Strategy

The contact form (`index.html`) implements automatic retry with exponential backoff when the API responds with 429 (Rate Limited).

### Retry Parameters

| Parameter | Value |
|---|---|
| Max retries | 4 total (1 initial + 3 retries) |
| Backoff sequence | 0ms, 1,000ms, 2,000ms, 4,000ms |
| Trigger | HTTP 429 only — other errors surface immediately |
| Timeout | 7s total worst-case (0+1+2+4) |

### Behavior

1. **Attempt 1** fires immediately. If 429, schedules retry with 1s delay.
2. **Attempts 2–4** increase delay exponentially (1s → 2s → 4s).
3. Each retry logs `requestId`, `retryAttempt`, `retryDelayMs` to console.
4. UI shows `"Reintentando envío... (Intento 2 de 4)"` or `"Retrying... (Attempt 2 of 4)"`.
5. If all 4 attempts return 429, shows error state.
6. Non-429 errors (4xx/5xx) surface immediately without retries.

### Compatibility

- Fully compatible with the Ingestion Boundary Principle — the client retry operates on the HTTP response, not on the internal pipeline.
- No changes to backend, rate limiting, or queue logic.
- Retries are transparent to the server (each is a fresh HTTP request that must pass the rate limit gate).

---

## Serverless Memory Isolation (Critical)

This project runs on **Vercel Serverless Functions**. Each file inside `/api` is deployed as an independent function:

- `api/sendContact.js`
- `api/sendBrief.js`
- `api/telemetry.js`

These functions **DO NOT** share:

- memory
- singleton instances
- module state
- in-memory Maps
- queue instances

**Therefore:**

- `request-registry` data is only valid inside the function instance that created it
- health endpoints cannot aggregate `request-registry` data across functions
- in-memory metrics are per-instance only
- cross-instance observability requires shared storage (Redis, PostgreSQL, etc.)

This is a **platform constraint**, not an implementation bug. Code that assumes shared `require()` state between API routes will not work in production.

---

### 2. Body Parsing Layer

All requests go through:
