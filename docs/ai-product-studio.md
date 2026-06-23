# AI Product Studio

The Studio provides a unified end-user interface that orchestrates every platform engine to transform a single natural-language prompt into a fully deployed application.

## Overview

```
User Prompt → [10-Stage Pipeline] → Deployed Application
```

The Studio is not a new engine — it is an orchestration and presentation layer that coordinates all existing subsystems.

## Pipeline Stages

| # | Stage | Engine | Description |
|---|-------|--------|-------------|
| 1 | Conversation | Conversation Engine | Initial dialogue to refine the user's intent |
| 2 | Questions | Question Generator | Elicit clarifying questions from the user |
| 3 | Context | Context Builder | Build comprehensive requirements context |
| 4 | Architecture | Solution Architect | Design the application architecture |
| 5 | Knowledge | Knowledge Engine | Recommend patterns, libraries, and best practices |
| 6 | Composer | Application Composer | Compose the full application structure |
| 7 | Generator | Generator Engine | Generate all source files |
| 8 | Evaluation | Evaluation Platform | Validate code quality and correctness |
| 9 | Deployment | Deployment Engine | Deploy to target environment |
| 10 | Workspace | Project Lifecycle | Set up workspace, assign preview/live URLs |

## Architecture

```
┌─────────────────────────────────────────────┐
│              Studio UI (Pages)               │
├─────────────────────────────────────────────┤
│              Studio Controller (API)         │
├─────────────────────────────────────────────┤
│         Studio Manager (Orchestrator)        │
├─────────────────────────────────────────────┤
│ BuildPipeline │ ProjectManager │ Workspace   │
├───────────────┴────────────────┴────────────┤
│         ┌─── Existing Engines ───┐          │
│         │ Conversation Engine    │          │
│         │ Question Generator     │          │
│         │ Context Builder        │          │
│         │ Solution Architect     │          │
│         │ Knowledge Engine       │          │
│         │ Application Composer   │          │
│         │ Generator Engine       │          │
│         │ Evaluation Platform    │          │
│         │ Deployment Engine      │          │
│         │ Project Lifecycle      │          │
│         └────────────────────────┘          │
└─────────────────────────────────────────────┘
```

## Key Concepts

- **Project**: A build request created from a user prompt. Tracks status, pipeline progress, and deployment URLs.
- **Build**: The pipeline execution for a project. Has 10 stages with status tracking (pending/running/completed/failed).
- **Workspace**: The generated output files and environment configuration for a project.

## Events

The Studio emits events that other subsystems can observe:

- `studio:build:started` — A new build pipeline begins
- `studio:stage:advanced` — Pipeline moves to a new stage
- `studio:stage:completed` — A stage finishes successfully
- `studio:stage:failed` — A stage encounters an error
- `studio:build:completed` — All stages complete
- `studio:build:failed` — Pipeline terminates with failure
- `studio:project:created` — A new project is registered
- `studio:workspace:updated` — Workspace files change

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/studio` | Studio status and project list |
| POST | `/api/studio/project` | Create a new project (starts build) |
| GET | `/api/studio/project/:id` | Get project details |
| GET | `/api/studio/project/:id/build` | Get build pipeline status |
| GET | `/api/studio/project/:id/workspace` | Get workspace files |
| GET | `/api/studio/projects` | List all projects |
| POST | `/api/studio/pipeline/advance` | Manually advance pipeline stage |
| POST | `/api/studio/pipeline/complete` | Manually complete pipeline stage |

## UI Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `dashboard` | Overview metrics and project list |
| Create | `create` | New project form with prompt input |
| Pipeline | `pipeline` | Build pipeline stage visualization |
| Editor | `editor` | File tree and code viewer |
| Preview | `preview` | Application preview and deploy controls |
| Archives | `archives` | Browse all projects |
| Templates | `templates` | Template gallery for quick starts |
| Settings | `settings` | Studio configuration |
| Analytics | `analytics` | Build history and metrics |

## Metrics

The Studio records build metrics that can be queried by name:

- Build duration per stage
- Success/failure counts
- Project creation rate
- Stage completion latency

## Dependencies

The Studio depends on all existing platform engines but does not duplicate any of their logic. It calls engine APIs through their existing controllers and routes.
