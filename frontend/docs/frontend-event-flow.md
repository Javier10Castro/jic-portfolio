# Frontend Event Flow

This document describes how SSE events from the backend flow through the frontend to update stores, the orchestrator, and UI components.

## Event Types

| Event | Source | Subscribers |
|-------|--------|-------------|
| `build.started` | Backend pipeline start | Orchestrator (phase → building) |
| `build.finished` | Backend pipeline complete | Orchestrator (phase → completed, preview refresh) |
| `build.failed` | Backend pipeline failure | Orchestrator (phase → failed) |
| `pipeline.status` | Backend stage transitions | Orchestrator (activeStage), pipelineStore |
| `deployment.started` | Backend deployment start | Orchestrator (phase → deploying), deploymentStore |
| `deployment.completed` | Backend deployment done | Orchestrator (phase → completed), deploymentStore |
| `deployment.failed` | Backend deployment error | Orchestrator (phase → failed), deploymentStore |
| `preview.updated` | Backend preview ready | Preview store + page (refresh key) |
| `generation.completed` | Backend AI generation done | Page (preview refresh) |
| `postprocessing.completed` | Backend post-processing done | Page (preview refresh) |

## Data Flow

```
Backend (SSE)
  │
  ▼
EventSubscriptionService (services/events.ts)
  │  heartbeat, backoff reconnect, dedup, sequence validation
  │
  ├──► Store Adapters (lib/sync/sync-engine/adapters/)
  │     ├── conversationStore ← conversation.updated
  │     ├── pipelineStore     ← pipeline.status, build.*
  │     ├── deploymentStore   ← deployment.*
  │     ├── previewStore      ← preview.updated
  │     └── summaryStore      ← summary.updated
  │
  ├──► useStudioOrchestrator (hooks/use-studio-orchestrator.ts)
  │     └── phase/activeStage/stageResults state updates
  │
  ├──► useStudioChatPage (page.tsx)
  │     └── refreshKey state (preview iframe auto-refresh)
  │
  └──► StudioToast (components/studio/toast/StudioToast.tsx)
        └── via studioNotifications.onNotification()
```

## Toast Notifications

The `NotificationService` singleton in `lib/sync/notifications.ts` decouples notification emission from rendering. Components call:

```ts
studioNotifications.success('Title', 'Message');
studioNotifications.error('Title', 'Message');
studioNotifications.info('Title', 'Message');
studioNotifications.warning('Title', 'Message');
```

The layout subscribes to `.onNotification()` and renders `StudioToast` with auto-dismiss (5s) and max 5 visible.

## Observability

The `ObservabilityService` in `lib/sync/observability.ts` tracks:
- Pipeline duration (`orchestrator.pipeline`)
- Stage timing (`stage.{name}`, `stage.{name}.failed`)
- Provider timing (`provider.{name}`)

Data is available via `.getEntries()`, `.getStats()`, `.getSummary()` for the diagnostics panel.

## Synchronization

The `SyncEngine` handles:
1. **Hydration**: Restores all store states from sessionStorage on page load
2. **Sync**: Pulls latest backend state via store adapters
3. **Persist**: Saves current store states to sessionStorage after build completion
4. **Recovery**: The orchestrator's `recover()` method orchestrates hydrate → sync → phase restoration
