# Platform API

## Overview

The Platform API is the single public HTTP interface to the entire AI Website Generator platform.

All existing engines are accessible through RESTful endpoints under `/api/v1/`.

The API does not duplicate business logic. Every endpoint delegates to the existing modules (SaaS Core, Conversation Engine, Pipeline Orchestrator, Planner, Design Strategy, Content Generator, Website Builder, Deployment Engine).

## Architecture

```
Client → Vercel/Express → Middleware Stack → Router → Controller → Engine
```

### Request Lifecycle

1. CORS headers applied
2. Request ID assigned (from `X-Request-Id` header or auto-generated)
3. Request logged (method, path, status, latency)
4. Body parsed (JSON, URL-encoded)
5. Rate limit checked (per API key, user, or IP)
6. Authentication resolved (API Key header or Bearer token)
7. Authorization checked (role-based: owner, admin, editor, viewer)
8. Validation performed (headers, params, query, body)
9. Controller orchestrates the relevant engine
10. Standardized response returned

### Middleware Stack

| Middleware | Purpose |
|---|---|
| `cors` | Cross-origin headers |
| `requestId` | Unique request tracking |
| `requestLogger` | Structured JSON logging |
| `bodyParser` | JSON + URL-encoded parsing |
| `rateLimiter` | Per-key, per-user, per-IP limiting |
| `authentication` | API Key or Bearer token validation |
| `authorization` | Role-based access control |
| `validation` | Schema-based request validation |
| `errorHandler` | Global error formatting |

### Controller Layer

Each domain has a controller that imports the existing engine module and delegates the call. Controllers handle:
- Input extraction from `req.params`, `req.query`, `req.body`
- Engine invocation (synchronous or promise-based)
- Response formatting via `apiResponse.js`
- Error wrapping via error classes

## Authentication

### API Keys

Header: `X-API-Key: jic_<hex>`

API keys are managed through the SaaS Core `apiKeys` module. Keys can be created, listed, and revoked via the `/api/v1/apikeys` endpoints.

### Bearer Tokens

Header: `Authorization: Bearer <token>`

Session tokens are managed through the SaaS Core `sessionManager` module. Tokens are issued during authentication and have a 7-day TTL with 30-day refresh.

### Unauthenticated Endpoints

- `GET /api/v1/health`
- `GET /api/v1/ready`
- `GET /api/v1/live`
- `GET /api/v1/metrics`

## Authorization

Roles (from SaaS Core authorization module):

| Role | Permissions |
|---|---|
| `owner` | Full access |
| `admin` | Create, read, update, delete for most resources |
| `editor` | Create, read, update |
| `viewer` | Read-only |

Authorization middleware uses `authorize(resource, action)` with resource-permission mappings defined in `lib/saas/authorization.js`.

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... },
  "errors": null,
  "meta": {
    "timestamp": "2026-06-19T10:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "requestId": "req-abc123"
}
```

### Error

```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "ValidationError",
      "message": "Validation failed",
      "details": {
        "fields": [
          { "field": "name", "message": "name is required", "source": "body" }
        ]
      }
    }
  ],
  "meta": {
    "timestamp": "2026-06-19T10:00:00.000Z"
  },
  "requestId": "req-abc123"
}
```

## Endpoint Catalog

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/health` | Service health |
| GET | `/api/v1/ready` | Readiness check |
| GET | `/api/v1/live` | Liveness check |
| GET | `/api/v1/metrics` | Process metrics |

### Conversations

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/conversations` | List conversations |
| POST | `/api/v1/conversations` | Create conversation |
| GET | `/api/v1/conversations/:id` | Get conversation |
| DELETE | `/api/v1/conversations/:id` | Delete conversation |
| POST | `/api/v1/conversations/:id/messages` | Add message |
| POST | `/api/v1/conversations/:id/questions` | Generate questions |
| POST | `/api/v1/conversations/:id/context` | Build context |

### Projects

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/projects` | List projects |
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/projects/:id` | Get project |
| PATCH | `/api/v1/projects/:id` | Update project |
| DELETE | `/api/v1/projects/:id` | Delete project |

### Pipeline

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/pipeline/run` | Run pipeline for conversation |
| POST | `/api/v1/pipeline/project/:id/run` | Run pipeline for project |
| GET | `/api/v1/pipeline/:id` | Get pipeline run |
| GET | `/api/v1/pipeline/:id/status` | Get pipeline status |
| POST | `/api/v1/pipeline/:id/cancel` | Cancel pipeline |
| POST | `/api/v1/pipeline/:id/resume` | Resume pipeline |
| POST | `/api/v1/pipeline/:id/retry` | Retry failed stage |

### Deployment

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/deploy` | Deploy project |
| GET | `/api/v1/deployments` | List deployments |
| GET | `/api/v1/deployments/:id` | Get deployment |
| POST | `/api/v1/deployments/:id/rollback` | Rollback deployment |

### Dashboard

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/dashboard/home` | Dashboard home data |
| GET | `/api/v1/dashboard/stats` | Dashboard stats |
| GET | `/api/v1/dashboard/activity` | Recent activity |

### Workspace

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/workspace` | Get workspace |
| PATCH | `/api/v1/workspace` | Update workspace |

### API Keys

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/apikeys` | List API keys |
| POST | `/api/v1/apikeys` | Create API key |
| POST | `/api/v1/apikeys/:id/revoke` | Revoke API key |

### Generation

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/generate` | Full generation (plan → design → content → website) |
| POST | `/api/v1/generate/html` | Generate HTML only |
| POST | `/api/v1/generate/design` | Generate design strategy |
| POST | `/api/v1/generate/content` | Generate content |

### Context

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/context/:conversationId` | Get conversation context |
| POST | `/api/v1/context/:conversationId/rebuild` | Rebuild context |

### Planner

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/planner/generate` | Generate project plan |

## Pagination

All list endpoints accept `?page=1&limit=20` query parameters.

- `page`: Page number (default: 1, minimum: 1)
- `limit`: Items per page (default: 20, min: 1, max: 100)

Pagination metadata is returned in `meta.pagination`.

## Errors

| HTTP Status | Error Class | Description |
|---|---|---|
| 400 | `ValidationError` | Invalid input |
| 401 | `AuthenticationError` | Missing or invalid credentials |
| 403 | `AuthorizationError` | Insufficient permissions |
| 404 | `NotFoundError` | Resource not found |
| 429 | `RateLimitError` | Rate limit exceeded |
| 500 | `InternalServerError` | Unexpected error |

## Rate Limits

- Default: 100 requests per 60-second window
- Limits tracked per API key, per user, per IP (in priority order)
- Configurable per deployment via rate limiter options
- Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Versioning

The API is versioned via URL path prefix: `/api/v1/`.

Future versions will add `/api/v2/` alongside v1 for backward compatibility during migration.

## OpenAPI Generation

The API is designed to be consumed by OpenAPI generator tools. The route and middleware structure maps directly to OpenAPI schemas. A generator can:

1. Walk the router to discover all endpoints
2. Read validation schemas for request body/query/param shapes
3. Map error classes to response codes
4. Generate `openapi.json` automatically

This is planned as a separate utility in a future phase.

## Swagger UI

When running, the API serves a landing page at `/` with a link to `/api/docs` (Swagger UI, to be added).

## SDK Support

The API is designed for automatic SDK generation:

- **JavaScript/TypeScript**: Generate client from OpenAPI spec with typed interfaces
- **Python**: Generate via `openapi-generator` or similar
- **C#**: Generate via `NSwag` or `AutoRest`

The standardized response format (`{ success, data, errors, meta, requestId }`) ensures consistent client-side handling across all languages.

## Example: Full Generation Flow

```bash
# 1. Create conversation
curl -X POST /api/v1/conversations \
  -H "X-API-Key: jic_..." \
  -H "Content-Type: application/json" \
  -d '{"title": "My Project"}'

# 2. Add messages (iterate)
curl -X POST /api/v1/conversations/:id/messages \
  -H "X-API-Key: jic_..." \
  -d '{"content": "I need a landing page for a coffee shop"}'

# 3. Generate questions
curl -X POST /api/v1/conversations/:id/questions \
  -H "X-API-Key: jic_..."

# 4. Build context
curl -X POST /api/v1/conversations/:id/context \
  -H "X-API-Key: jic_..."

# 5. Run full pipeline
curl -X POST /api/v1/pipeline/run \
  -H "X-API-Key: jic_..." \
  -d '{"conversationId": "conv-..."}'

# 6. Check status
curl -X GET /api/v1/pipeline/:runId/status \
  -H "X-API-Key: jic_..."
```

## Local Development

```bash
# Start standalone server
node lib/api/server.js

# Or programmatically
const { createApp } = require('./lib/api');
const app = createApp();
app.listen(3001);
```

## Vercel Deployment

The API is deployed as a Vercel Serverless Function at `api/platform-api.js`. The Express app is wrapped and exported as a Vercel-compatible handler.
