# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │ brief-maestro│  │  index.html  │  │  dashboard-  │  │  E2E    │ │
│  │   .html      │  │  (portfolio) │  │   *.html     │  │ scripts │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────────┘ │
│         │                 │                 │                       │
│         │           dashboard-api.js         │                       │
└─────────┼─────────────────┼─────────────────┼───────────────────────┘
          │                 │                 │
    POST /api/sendBrief   POST /api/       GET /api/telemetry
                          sendContact     ?type=health|logs|traces|coverage|range
          │                 │                 │
          ▼                 ▼                 ▼
┌──────────────────┐ ┌────────────────┐ ┌────────────────────────┐
│  sendBrief.js    │ │ sendContact.js │ │  telemetry.js          │
│  ┌────────────┐  │ │ ┌────────────┐ │ │  ┌──────────────────┐  │
│  │ PDFKit     │  │ │ │ Nodemailer │ │ │  │ type=health      │  │
│  │ (PDF gen)  │  │ │ └────────────┘ │ │  │ type=logs        │  │
│  └────────────┘  │ │                │ │  │ type=traces      │  │
│  ┌────────────┐  │ └────────────────┘ │  │ type=coverage    │  │
│  │Nodemailer  │  │                    │  │ type=range       │  │
│  │ (2 emails) │  │                    │  └──────────────────┘  │
│  └────────────┘  │                    │                         │
└──────┬───────────┘                    └────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│              Shared Libraries                     │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────┐ │
│  │ rate-limit   │ │ request-     │ │  queue    │ │
│  │ (network     │ │ registry     │ │ (SMTP     │ │
│  │  gate)       │ │ (lifecycle)  │ │  worker)  │ │
│  └──────────────┘ └──────────────┘ └───────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────┐ │
│  │ safeBody     │ │ logger       │ │ db/       │ │
│  │ Parser       │ │              │ │ (Neon PG) │ │
│  └──────────────┘ └──────────────┘ └───────────┘ │
└──────────────────────────────────────────────────┘
```

## Deployment Model

- **Vercel** auto-detection (no `vercel.json`)
- All frontend served from `public/` directory
- All API functions auto-detected from `api/` directory
- Production: `git push origin main` → GitHub auto-deploy

## Two-Layer Architecture (sendContact)

### Layer 1: Network Gate (Rate Limit / Edge Protection)
- Pre-queue: IP sliding window (30/60 req/60s), email dedup (1/300s), honeypot, timing
- Failure: 429 RATE_LIMITED — immediate response, no queue allocation
- State: per-instance in-memory Map

### Layer 2: Execution Layer (Internal Queue Scheduler)
- Post-boundary: FIFO queue (max depth 100, concurrency 1)
- SMTP worker with 3 retries (2s/4s/8s exponential backoff)
- Lifecycle tracing: 7+ stages with deltaMs

## Dashboard Modes

| Mode | Condition | Data Sources |
|---|---|---|
| **Demo** | No workspace_id/user_id | `/api/telemetry` |
| **Workspace** | workspace_id + user_id set | (SaaS API — experimental, removed) |

## Logging & Observability

| Endpoint | Purpose |
|---|---|
| `GET /api/telemetry?type=health` | Queue depth, throughput, lifecycle, rate limit, memory |
| `GET /api/telemetry?type=logs&limit=N` | Recent request registry entries + aggregate metrics |
| `GET /api/telemetry?type=traces&id=<requestId>` | Single request trace events (merged memory + Neon) |
| `GET /api/telemetry?type=coverage` | 23-path coverage (memory + Neon merged) |
| `GET /api/telemetry?type=health&section=queue` | Queue-specific metrics + lifecycle aggregates |
| `GET /api/telemetry?type=health&section=rate-limit` | Rate limit state (IP entries, email dedup) |
| `GET /api/telemetry?type=range&hours=24` | Time-bucket trace analytics |
| `GET /api/sendBrief?id=<requestId>` | Single request lifecycle trace |
| `GET /api/sendContact?id=<requestId>` | Single request lifecycle trace |
