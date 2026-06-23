# Architecture API — Phase 10.2.0

## Overview

The Architecture API provides RESTful endpoints at `/api/v1/architecture` for solution architecture planning, design, validation, analysis, export, and topology visualization.

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/architecture` | Get architect engine status and configuration |
| POST | `/api/v1/architecture/design` | Design architecture solution from context |
| POST | `/api/v1/architecture/validate` | Validate architecture design |
| POST | `/api/v1/architecture/analyze` | Analyze requirements, constraints, risks, tradeoffs, quality |
| POST | `/api/v1/architecture/export` | Export architecture blueprint |
| GET | `/api/v1/architecture/patterns` | List available architecture patterns |
| GET | `/api/v1/architecture/decisions` | List architecture decision records |
| GET | `/api/v1/architecture/graph` | Get topology graph data |

## Request/Response Examples

### GET /api/v1/architecture

Returns architect engine status and registered capabilities.

**Response:**
```json
{
  "status": "ready",
  "version": "1.0.0",
  "patterns": 8,
  "qualityAttributes": 7,
  "adrCount": 12,
  "uptime": 7200
}
```

### POST /api/v1/architecture/design

Design an architecture solution from a project context.

**Request:**
```json
{
  "contextId": "ctx-abc123",
  "requirements": {
    "functional": ["order management", "payment processing", "user notifications"],
    "nonFunctional": {
      "availability": "99.9%",
      "responseTime": "< 200ms",
      "scalability": "100k concurrent users"
    }
  },
  "constraints": {
    "budget": "$10k/month",
    "timeline": "3 months",
    "teamSize": 5,
    "compliance": ["GDPR"]
  },
  "preferences": {
    "pattern": "auto",
    "complexity": "balanced"
  }
}
```

**Response:**
```json
{
  "id": "arch-abc123",
  "status": "designed",
  "patterns": [
    { "pattern": "hexagonal", "score": 7.8, "rationale": "Best fit for domain-driven requirements" }
  ],
  "topology": {
    "component": { "nodes": 12, "edges": 18 },
    "service": { "nodes": 6, "edges": 9 }
  },
  "decisions": [
    {
      "id": "adr-001",
      "title": "Use Hexagonal Architecture for Order Service",
      "status": "accepted"
    }
  ],
  "quality": {
    "average": 7.5,
    "attributes": { "availability": 8.5, "security": 7.2, "performance": 6.8 }
  },
  "tradeoffs": [
    { "attributeA": "availability", "attributeB": "cost", "impact": "Multi-region adds 40% cost" }
  ]
}
```

### POST /api/v1/architecture/validate

Validate an architecture design against rules and policies.

**Request:**
```json
{
  "architectureId": "arch-abc123",
  "rules": ["pattern-compatibility", "dependency-cycles", "layer-violations"]
}
```

**Response:**
```json
{
  "valid": true,
  "checks": [
    { "rule": "pattern-compatibility", "status": "passed" },
    { "rule": "dependency-cycles", "status": "passed" },
    { "rule": "layer-violations", "status": "warning", "message": "Order service accesses infrastructure layer directly" }
  ],
  "warnings": [
    { "code": "LAYER_VIOLATION", "message": "Order service bypasses domain layer for DB access" }
  ]
}
```

### POST /api/v1/architecture/analyze

Perform a full analysis. Supports filtering by analysis type.

**Request:**
```json
{
  "architectureId": "arch-abc123",
  "types": ["requirements", "constraints", "risks", "tradeoffs", "quality"],
  "options": {
    "riskThreshold": "medium",
    "qualityWeights": { "availability": 0.2, "security": 0.2, "cost": 0.15 }
  }
}
```

**Response:**
```json
{
  "architectureId": "arch-abc123",
  "requirements": {
    "functionalCoverage": 92,
    "nfrAlignment": 85,
    "gaps": ["Real-time analytics"]
  },
  "constraints": {
    "blocking": 0,
    "high": 1,
    "medium": 2,
    "low": 3
  },
  "risks": {
    "critical": 0,
    "high": 1,
    "medium": 2,
    "low": 5,
    "topRisk": { "description": "Third-party payment API rate limiting", "score": 6 }
  },
  "tradeoffs": {
    "options": [
      { "option": "Hexagonal + Event-Driven", "totalWeighted": 7.1 },
      { "option": "Microservices + CQRS", "totalWeighted": 6.8 }
    ],
    "recommendation": "Hexagonal + Event-Driven"
  },
  "quality": {
    "average": 7.5,
    "radar": { "availability": 8.5, "security": 7.2, "performance": 6.8, "scalability": 8.0, "maintainability": 7.5, "cost": 6.0, "operability": 8.2 }
  }
}
```

### POST /api/v1/architecture/export

Export the architecture design as a deployable blueprint.

**Request:**
```json
{
  "architectureId": "arch-abc123",
  "format": "blueprint",
  "include": ["patterns", "topology", "decisions", "quality"]
}
```

**Response:**
```json
{
  "format": "blueprint",
  "architecture": {
    "patterns": [ ... ],
    "topology": { ... },
    "decisions": [ ... ],
    "quality": { ... }
  },
  "composerInput": {
    "modules": ["order-service", "payment-gateway", "notification-service"],
    "dependencies": { "order-service": ["payment-gateway"] },
    "policies": ["max-cost-100"]
  },
  "exportedAt": "2026-06-22T00:00:00.000Z"
}
```

### GET /api/v1/architecture/patterns

List all registered architecture patterns.

**Response:**
```json
{
  "patterns": [
    { "id": "layered", "name": "Layered Architecture", "type": "structural", "version": "1.0.0" },
    { "id": "hexagonal", "name": "Hexagonal Architecture", "type": "structural", "version": "1.0.0" },
    { "id": "event-driven", "name": "Event Driven Architecture", "type": "messaging", "version": "1.0.0" },
    { "id": "microservices", "name": "Microservices", "type": "distribution", "version": "1.0.0" },
    { "id": "modular-monolith", "name": "Modular Monolith", "type": "structural", "version": "1.0.0" },
    { "id": "serverless", "name": "Serverless", "type": "deployment", "version": "1.0.0" },
    { "id": "pipeline", "name": "Pipeline Architecture", "type": "processing", "version": "1.0.0" },
    { "id": "ai-native", "name": "AI Native Architecture", "type": "ai-systems", "version": "1.0.0" }
  ],
  "count": 8
}
```

### GET /api/v1/architecture/decisions

List architecture decision records with optional filters.

**Request (query params):** `?status=accepted&tag=hexagonal&limit=10&offset=0`

**Response:**
```json
{
  "decisions": [
    {
      "id": "adr-001",
      "title": "Use Hexagonal Architecture for Order Service",
      "status": "accepted",
      "context": "Order service requires high testability and domain isolation",
      "decision": "Adopt hexagonal architecture with ports and adapters",
      "alternatives": [
        { "option": "Layered architecture", "pros": ["Simplicity"], "cons": ["Tight coupling"] }
      ],
      "createdAt": "2026-06-22T00:00:00.000Z",
      "tags": ["hexagonal", "order-service"]
    }
  ],
  "total": 12,
  "limit": 10,
  "offset": 0
}
```

### GET /api/v1/architecture/graph

Get topology graph data. Supports query parameters for graph type.

**Request (query params):** `?architectureId=arch-abc123&type=component&format=json`

**Response:**
```json
{
  "architectureId": "arch-abc123",
  "type": "component",
  "nodes": [
    { "id": "order-service", "type": "service", "name": "Order Service", "layer": "application" }
  ],
  "edges": [
    { "source": "order-service", "target": "payment-gateway", "type": "calls", "protocol": "gRPC" }
  ],
  "metadata": {
    "generatedAt": "2026-06-22T00:00:00.000Z",
    "graphType": "component",
    "nodeCount": 12,
    "edgeCount": 18
  }
}
```

## Error Handling

All endpoints return standard error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid architecture request",
    "details": [
      { "field": "requirements.nonFunctional.availability", "message": "Invalid availability target. Format: NN.N%" }
    ]
  }
}
```

| HTTP Status | Error Code | Description |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid request payload |
| 400 | `DESIGN_ERROR` | Architecture design failed |
| 404 | `NOT_FOUND` | Architecture, context, or ADR not found |
| 409 | `CONFLICT` | Pattern conflict or incompatible combination |
| 422 | `UNPROCESSABLE_ENTITY` | Constraint violation or policy breach |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
