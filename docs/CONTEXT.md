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
