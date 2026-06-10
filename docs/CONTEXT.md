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

### 2. Body Parsing Layer

All requests go through:
