# Composition API

## Overview

The Composition API provides RESTful endpoints at `/api/v1/composer` for managing application compositions. It covers the full composition lifecycle: compose, validate, simulate, export, and manage templates and capabilities.

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/composer` | Get composer status and configuration |
| POST | `/api/v1/composer/compose` | Execute application composition |
| POST | `/api/v1/composer/validate` | Validate composition definition |
| POST | `/api/v1/composer/simulate` | Simulate composition execution |
| POST | `/api/v1/composer/export` | Export composed application |
| GET | `/api/v1/composer/templates` | List available application templates |
| GET | `/api/v1/composer/capabilities` | List registered capabilities |
| GET | `/api/v1/composer/graph` | Get application composition graph |

## Request/Response Examples

### GET /api/v1/composer

Returns composer engine status and registered modules.

**Response:**
```json
{
  "status": "ready",
  "version": "1.0.0",
  "modules": 52,
  "templates": 10,
  "capabilities": 24,
  "uptime": 3600
}
```

### POST /api/v1/composer/compose

Execute a full composition from a template and configuration.

**Request:**
```json
{
  "template": "saas",
  "name": "My SaaS App",
  "config": {
    "auth.provider": "jwt",
    "billing.provider": "stripe"
  },
  "capabilities": ["analytics", "email"],
  "policies": ["max-cost-100"]
}
```

**Response:**
```json
{
  "id": "comp-abc123",
  "status": "composed",
  "application": {
    "manifest": { "version": "1.0.0", "modules": 8 },
    "graph": { "nodes": 12, "edges": 18 }
  },
  "metrics": {
    "duration": 2450,
    "modulesComposed": 8,
    "resources": { "cpu": "2 cores", "memory": "1GB" }
  },
  "report": {
    "summary": "Composition completed successfully",
    "warnings": [],
    "recommendations": ["Consider enabling caching for improved performance"]
  }
}
```

### POST /api/v1/composer/validate

Validate a composition definition without executing it.

**Request:**
```json
{
  "template": "saas",
  "config": {
    "auth.provider": "invalid-provider"
  }
}
```

**Response:**
```json
{
  "valid": false,
  "errors": [
    {
      "field": "config.auth.provider",
      "message": "Invalid auth provider: invalid-provider. Allowed: jwt, oauth, saml"
    }
  ],
  "warnings": []
}
```

### POST /api/v1/composer/simulate

Run a dry-run simulation of the composition.

**Request:**
```json
{
  "template": "saas",
  "config": { "auth.provider": "jwt" }
}
```

**Response:**
```json
{
  "stages": [
    { "stage": "plan", "status": "passed", "duration": 120 },
    { "stage": "resolve", "status": "passed", "duration": 80 },
    { "stage": "allocate", "status": "passed", "duration": 50 },
    { "stage": "compose", "status": "simulated", "duration": 0 },
    { "stage": "validate", "status": "passed", "duration": 60 },
    { "stage": "report", "status": "passed", "duration": 20 }
  ],
  "estimates": {
    "resources": { "cpu": "2 cores", "memory": "1GB", "storage": "5GB" },
    "cost": { "monthly": 150, "setup": 50 }
  },
  "warnings": [],
  "recommendations": []
}
```

### POST /api/v1/composer/export

Export the composed application as a deployment bundle.

**Request:**
```json
{
  "compositionId": "comp-abc123",
  "format": "json"
}
```

**Response:**
```json
{
  "format": "json",
  "manifest": { ... },
  "blueprint": { ... },
  "artifacts": ["manifest.json", "blueprint.json"]
}
```

### GET /api/v1/composer/templates

List all available application templates.

**Response:**
```json
{
  "templates": [
    { "id": "website", "name": "Website", "version": "1.0.0" },
    { "id": "saas", "name": "SaaS Application", "version": "1.0.0" },
    { "id": "crm", "name": "CRM", "version": "1.0.0" },
    { "id": "erp", "name": "ERP", "version": "1.0.0" },
    { "id": "marketplace", "name": "Marketplace", "version": "1.0.0" },
    { "id": "knowledgeBase", "name": "Knowledge Base", "version": "1.0.0" },
    { "id": "automation", "name": "Automation", "version": "1.0.0" },
    { "id": "dashboard", "name": "Dashboard", "version": "1.0.0" },
    { "id": "aiAssistant", "name": "AI Assistant", "version": "1.0.0" },
    { "id": "custom", "name": "Custom", "version": "1.0.0" }
  ]
}
```

### GET /api/v1/composer/capabilities

List all registered capabilities.

**Response:**
```json
{
  "capabilities": [
    { "id": "auth.jwt", "name": "JWT Authentication", "type": "auth", "version": "1.0.0" },
    { "id": "billing.stripe", "name": "Stripe Billing", "type": "billing", "version": "1.0.0" }
  ]
}
```

### GET /api/v1/composer/graph

Get the composition graph for a composed application.

**Response:**
```json
{
  "nodes": [
    { "id": "auth", "type": "module", "name": "Authentication" },
    { "id": "billing", "type": "module", "name": "Billing" },
    { "id": "user-service", "type": "service", "name": "User Service" }
  ],
  "edges": [
    { "source": "user-service", "target": "auth", "type": "depends_on" },
    { "source": "billing", "target": "auth", "type": "depends_on" }
  ]
}
```

## Error Handling

All endpoints return standard error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid composition definition",
    "details": [
      { "field": "config.auth.provider", "message": "Invalid provider" }
    ]
  }
}
```

| HTTP Status | Error Code | Description |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid request payload |
| 400 | `COMPOSITION_ERROR` | Composition execution failed |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Composition conflict (dependencies) |
| 422 | `UNPROCESSABLE_ENTITY` | Policy violation or constraint breach |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
