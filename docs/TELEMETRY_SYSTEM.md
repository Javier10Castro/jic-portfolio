# Telemetry System

## Overview

`/api/telemetry.js` is the consolidated observability module that replaces three separate endpoints (`health.js`, `logs.js`, `traces.js`) and 8 experimental SaaS endpoints (`api/v1/`). This consolidation reduced the serverless function count from 12+ to 3, fitting well within Vercel Hobby's 12-function limit.

## Architecture

```
                    /api/telemetry
                          │
              ┌───────────┼───────────┐
              │           │           │
         ?type=logs  ?type=health  ?type=traces
              │           │           │
              ▼           ▼           ▼
   ┌────────────────┐ ┌─────────┐ ┌──────────────┐
   │ request-       │ │ queue   │ │ tracer.js    │
   │ registry       │ │ rate-   │ │ request-     │
   │ (Neon + mem)   │ │ limit   │ │ Traces (Neon)│
   └────────────────┘ └─────────┘ └──────────────┘
```

All handlers share the same serverless instance, so lifecycles, queue state, and trace events are all from the same execution context.

## Query Parameter Reference

| Parameter | Type | Description | Example |
|---|---|---|---|
| `type` | required | `logs`, `traces`, `coverage`, `health`, `range` | `?type=health` |
| `id` | optional | Request ID for single-entry lookup | `?type=logs&id=abc-123` |
| `limit` | optional | Max entries (default 20, max 200) | `?type=logs&limit=50` |
| `section` | optional | Health subsection: `queue`, `rate-limit` | `?type=health&section=queue` |
| `hours` | optional | Range window in hours (default 24) | `?type=range&hours=48` |

## Response Types

### `?type=health` (default summary)
```json
{
  "status": "ok",
  "timestamp": "2026-06-12T...",
  "uptime": 123.456,
  "instance": { "id": "a1b2c3d4", "sha": "...", "env": "production" },
  "queue": { "size": 0, "active": 0, "completed": 42, "failed": 0 },
  "lifecycle": { "totalRequests": 42, "completedRequests": 40, ... },
  "rateLimit": { "ipEntries": 5, "emailEntries": 1, ... },
  "memory": { "rss": "64MB", "heapTotal": "32MB", "heapUsed": "20MB" }
}
```

### `?type=health&section=queue`
```json
{
  "status": "ok",
  "queue": { "depth": 0, "active": 0, "maxDepth": 100, "utilizationPercent": 0 },
  "throughput": { "totalEnqueued": 42, "completed": 40, "failed": 2 },
  "oldestRequest": { "ageMs": 0, "ageSec": 0, "ageMin": 0 },
  "lifecycle": { "totalRequests": 42, ... }
}
```

### `?type=health&section=rate-limit`
```json
{
  "status": "ok",
  "ip": { "currentEntries": 5, "softLimit": 30, "hardLimit": 60 },
  "emailDedup": { "cacheSize": 1, "limit": 1, "windowMs": 300000 },
  "thresholds": { "edgeSoftLimit": 30, "edgeHardLimit": 60, ... }
}
```

### `?type=logs&limit=20`
```json
{
  "entries": [{ "requestId": "abc", "status": "completed", ... }],
  "metrics": { "totalRequests": 42, "completedRequests": 40, ... }
}
```

### `?type=logs&id=abc`
```json
{
  "requestId": "abc",
  "status": "completed",
  "receivedAt": "...",
  "queuedAt": "...",
  "queueWaitTimeMs": 12,
  "executionDurationMs": 345
}
```

### `?type=traces&id=abc`
```json
{
  "traces": [
    { "requestId": "abc", "pathId": "sendContact:rateLimit:ip", "source": "memory", ... },
    { "requestId": "abc", "pathId": "sendContact:queueCheck", "source": "neon", ... }
  ],
  "found": true,
  "sources": { "memory": 5, "neon": 3, "merged": 8 }
}
```

### `?type=coverage`
```json
{
  "coverage": {
    "total": 23,
    "executed": 23,
    "covered": 23,
    "coveredPaths": ["sendBrief:methodCheck", "sendContact:queueCheck", ...],
    "missingPaths": [],
    "percentage": 100,
    "source": "merged",
    "memory": { "executed": 20, "percentage": 87 },
    "neon": { "executed": 23, "percentage": 100, "rangeHours": 24 }
  }
}
```

### `?type=range&hours=24`
```json
{
  "rangeHours": 24,
  "paths": [
    { "pathId": "sendContact:rateLimit:ip", "hitCount": 15, "firstSeen": "...", "lastSeen": "..." }
  ],
  "timeBuckets": [
    { "bucketStart": 1718200000000, "eventCount": 8, "distinctPaths": 4 }
  ]
}
```

## Migration Guide

### If you were using `/api/health`:
- `GET /api/health` → `GET /api/telemetry?type=health`
- `GET /api/health?section=queue` → `GET /api/telemetry?type=health&section=queue`
- `GET /api/health?section=rate-limit` → `GET /api/telemetry?type=health&section=rate-limit`

### If you were using `/api/logs`:
- `GET /api/logs?limit=50` → `GET /api/telemetry?type=logs&limit=50`
- `GET /api/logs?id=abc` → `GET /api/telemetry?type=logs&id=abc`

### If you were using `/api/traces`:
- `GET /api/traces?id=abc` → `GET /api/telemetry?type=traces&id=abc`
- `GET /api/traces?coverage=true` → `GET /api/telemetry?type=coverage`
- `GET /api/traces?range=24h` → `GET /api/telemetry?type=range&hours=24`

## Backward Compatibility

- Old endpoints redirect: No. They return 404. Update all callers to use `/api/telemetry`.
- Response structure: Same fields as before; only the URL and wrapping changed.
- Rate limit headers (`X-RateLimit-*`): Unchanged — set by `lib/rate-limit.js`, independent of telemetry.

## Testing

```bash
# Quick health check
curl -s https://your-site.vercel.app/api/telemetry?type=health | head

# Recent logs
curl -s "https://your-site.vercel.app/api/telemetry?type=logs&limit=5"

# Trace coverage
curl -s https://your-site.vercel.app/api/telemetry?type=coverage

# Inject a test trace event
curl -s -X POST https://your-site.vercel.app/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{"action":"trace","requestId":"test-1","pathId":"test:ping","endpoint":"test","stage":"ping"}'
```
