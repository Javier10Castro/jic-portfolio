# Evolution API

## Overview

The Evolution API provides 8 endpoints at `/api/v1/evolution` for managing continuous architecture improvement.

## Endpoints

### GET /evolution
Returns evolution engine status and history.

### POST /evolution/analyze
Runs analysis using a specified analyzer type.

**Body:** `{ evolutionId, type, data }`

**Analyzer types:** architecture, dependency, complexity, performance, security, cost, maintainability, technicalDebt, scalability, availability

### POST /evolution/plan
Creates an evolution plan.

**Body:** `{ evolutionId, type, actions }`

**Plan types:** improvement, migration, refactor, optimization, upgrade

### POST /evolution/simulate
Simulates an evolution plan to estimate risk and success probability.

**Body:** `{ evolutionId, plan }`

### POST /evolution/validate
Validates an evolution plan against policies and constraints.

**Body:** `{ evolutionId, plan }`

### POST /evolution/export
Exports evolution data including plans and reports. Supports `json` (default) and `yaml` formats.

**Body:** `{ evolutionId, format }`

### GET /evolution/history
Returns evolution report history. Optional `evolutionId` query parameter for filtering.

### GET /evolution/roadmap
Returns all generated roadmaps.

## Response Format

All endpoints return standard API response:
```json
{
  "success": true,
  "data": { ... },
  "errors": null,
  "meta": { "timestamp": "..." },
  "requestId": null
}
```

## Error Responses

Missing required fields return 400 with `success: false`.
Unknown analyzer types return 400 with available types listed.
Server errors return 500 with error message.
