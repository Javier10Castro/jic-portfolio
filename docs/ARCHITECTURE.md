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
    POST /api/sendBrief   POST /api/       GET /api/v1/*
                          sendContact      GET /api/health
                                           GET /api/logs
          │                 │                 │
          ▼                 ▼                 ▼
┌──────────────────┐ ┌────────────────┐ ┌──────────────────────┐
│  sendBrief.js    │ │ sendContact.js │ │  v1/ (SaaS Runtime)  │
│  ┌────────────┐  │ │ ┌────────────┐ │ │  ┌──────────────┐   │
│  │ PDFKit     │  │ │ │ Nodemailer │ │ │  │/projects/*   │   │
│  │ (PDF gen)  │  │ │ └────────────┘ │ │  │/executions/*  │   │
│  └────────────┘  │ │                │ │  │/events/*      │   │
│  ┌────────────┐  │ └────────────────┘ │  └──────────────┘   │
│  │Nodemailer  │  │                    │                      │
│  │ (2 emails) │  │                    │  ┌──────────────┐   │
│  └────────────┘  │                    │  │  lib/runtime  │   │
└──────┬───────────┘                    │  │  (orchestr.)  │   │
       │                                │  └──────────────┘   │
       ▼                                └──────────────────────┘
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
| **Demo** | No workspace_id/user_id | `/api/health`, `/api/logs` |
| **Workspace** | workspace_id + user_id set | `/api/v1/projects`, `/api/v1/executions` |

## Logging & Observability

| Endpoint | Purpose |
|---|---|
| `/api/health` | Queue depth, throughput, lifecycle, rate limit, memory |
| `/api/logs` | Recent request registry entries + aggregate metrics |
| `GET /api/sendBrief?id=<requestId>` | Single request lifecycle trace |
| `GET /api/health?section=queue` | Queue-specific metrics + lifecycle aggregates |
| `GET /api/health?section=rate-limit` | Rate limit state (IP entries, email dedup) |
