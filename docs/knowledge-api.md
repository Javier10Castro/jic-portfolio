# Knowledge API

## Overview

The Knowledge API exposes 8 endpoints at `/api/v1/knowledge` for knowledge ingestion, querying, recommendation, graph exploration, pattern discovery, lessons management, and similarity search.

## Endpoints

### GET /knowledge
Returns the knowledge engine status and recent reports.

### POST /knowledge/ingest
Ingests new knowledge from a source type.

**Body:** `{ "sourceType": "architecture", "data": { ... } }`

### POST /knowledge/query
Queries the knowledge base.

**Body:** `{ "query": "text or type", "type": "graph|pattern|case|lesson", "limit": 10 }`

### POST /knowledge/recommend
Generates recommendations for a given context.

**Body:** `{ "context": "project-id", "type": "architecture|workflow|optimization" }`

### GET /knowledge/graph
Returns the full knowledge graph (nodes, edges, versions).

### GET /knowledge/patterns
Returns discovered patterns, mining results, best practices, and anti-patterns.

### GET /knowledge/lessons
Returns lessons, optionally filtered by `?category=` or `?status=`.

### POST /knowledge/similar-projects
Finds projects similar to the given project.

**Body:** `{ "projectId": "proj-123", "features": { ... } }`

## Response Format

All endpoints return JSON:

```json
{
  "status": 200,
  "data": { ... }
}
```

Errors return:

```json
{
  "status": 400,
  "error": "message"
}
```

## Integration Points

| Platform | Integration |
|----------|-------------|
| Solution Architect | Architecture knowledge capture |
| Evolution Engine | Pattern discovery, recommendations |
| Composer | Case-based reasoning |
| Evaluation Platform | Evaluation knowledge capture |
| Telemetry | Telemetry knowledge capture |
| Lifecycle | Lesson extraction |
| Governance | Governance knowledge |
| Developer Platform | Best practices |
| Workflow Engine | Workflow knowledge |
| AI Platform | Success factor analysis |
| Deployment | Deployment knowledge |
| Runtime | Runtime knowledge |
| Data Platform | Data source integration |
| Plugin Marketplace | Plugin knowledge |
