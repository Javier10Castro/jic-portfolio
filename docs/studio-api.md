# Studio API Reference

## Base URL

All endpoints are mounted at `/api/studio`.

## Response Format

All endpoints return standard API envelope:

```json
{
  "success": true,
  "data": { ... },
  "errors": null,
  "meta": { "timestamp": "..." },
  "requestId": null
}
```

## Endpoints

---

### GET /api/studio

Returns studio status and all projects.

**Response:**
```json
{
  "status": { "initialized": true, "initializedAt": "...", "submodules": {...} },
  "projects": [ ... ]
}
```

---

### POST /api/studio/project

Creates a new project and starts the build pipeline.

**Request Body:**
```json
{
  "prompt": "Build a customer portal with React...",
  "options": { "name": "Customer Portal" }
}
```

**Response:** `201 Created`
```json
{
  "project": { "id": "proj_1", "name": "...", "status": "building", ... }
}
```

---

### GET /api/studio/project/:projectId

Returns full project details including build status, progress, and workspace.

**Response:**
```json
{
  "project": { ... },
  "build": { "id": "build_1", "status": "running", ... },
  "progress": { "completed": 3, "total": 10, "percent": 30, ... },
  "workspace": { "files": [...], "env": {...} }
}
```

---

### GET /api/studio/project/:projectId/build

Returns only the build pipeline status and progress.

**Response:**
```json
{
  "build": { "id": "build_1", "status": "running", "stages": [...], ... },
  "progress": { "completed": 3, "total": 10, "percent": 30 }
}
```

---

### GET /api/studio/project/:projectId/workspace

Returns the workspace for a project.

**Response:**
```json
{
  "workspace": { "files": [...], "env": {...}, "config": {...} }
}
```

---

### GET /api/studio/projects

Lists all projects, optionally filtered by status.

**Query Parameters:**
- `status` (optional): Filter by project status (`draft`, `building`, `completed`, `failed`)

**Response:**
```json
{
  "projects": [ ... ]
}
```

---

### POST /api/studio/pipeline/advance

Manually advances the pipeline to a stage.

**Request Body:**
```json
{
  "projectId": "proj_1",
  "stage": "architecture",
  "data": { ... }
}
```

---

### POST /api/studio/pipeline/complete

Manually marks a stage as completed.

**Request Body:**
```json
{
  "projectId": "proj_1",
  "stage": "architecture",
  "data": { "architecture": { "components": [...], ... } }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `ApiError` | Generic error with message |
| — | `prompt is required` |
| — | `projectId is required` |
| — | `Project not found` |
| — | `Build not found` |
| — | `projectId and stage are required` |
