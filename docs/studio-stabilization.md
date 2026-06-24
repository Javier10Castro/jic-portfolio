# Studio Stabilization — v6.3.0

## Synchronization Architecture

```
┌─────────────────────────────────────────────────────┐
│                   SyncManager                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐│
│  │Convers.  │  │Pipeline  │  │Deploy    │  │...   ││
│  │Adapter   │  │Adapter   │  │Adapter   │  │Adapter││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──┬───┘│
│       │             │             │           │     │
│  ┌────┴─────────────┴─────────────┴───────────┴──┐  │
│  │           PersistentCache (sessionStorage)     │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │           EventSubscriptionService (SSE)        │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         │                      ▲
         ▼                      │
   Backend API          Zustand Stores
   (source of truth)    (UI state)
```

**Principles:**
- Backend is the single source of truth
- Local state reflects backend state via SSE events
- Sync engine reconciles on reconnect, refresh, and periodically
- sessionStorage provides fast hydration on page reload
- UI-only fields (isStreaming, isGenerating, editing) preserved locally

## Recovery Flow

```
Page Load
  │
  ├── useStudioRecovery() called from layout
  │
  ├── 1. Register sync adapters (once)
  │
  ├── 2. Load RecoverySnapshot from sessionStorage
  │     │
  │     ├── Snapshot exists & < 1hr old
  │     │   ├── hydrate() → restore all stores from cache
  │     │   ├── If pipeline/deployment active → sync() with backend
  │     │   └── Restore active conversation ID
  │     │
  │     └── No snapshot → save initial snapshot
  │
  ├── 3. Connect SSE (eventService.connect(token))
  │
  └── 4. Register offline listener
        └── On reconnect → eventService.reconnect() + syncEngine.sync()

Page Unload
  └── Save RecoverySnapshot
      └── activeConversationId, pipelineActive, deploymentActive, etc.
```

## State Reconciliation

```
syncEngine.reconcile(name)
  │
  ├── Get backend state from API
  ├── Get local state from store
  ├── Compare with JSON.stringify
  │     │
  │     ├── Equal → nothing to do
  │     │
  │     └── Different → merge
  │           ├── Always prefer backend (source of truth)
  │           └── Preserve UI-only fields per whitelist
  │                 ├── conversation: isStreaming, isGenerating
  │                 └── summary: editing
  │
  ├── Validate merged state
  │     ├── Duplicate entity IDs
  │     ├── Orphaned references
  │     ├── Invalid status transitions
  │     └── Missing required fields
  │
  └── Apply to store + persist to cache
```

## Event Lifecycle

```
Server Event
  │
  ├── 1. Parse JSON
  │
  ├── 2. Duplicate check (event.id)
  │     ├── Already processed → REJECT
  │     └── New → track in processedIds Set (cap 1000)
  │
  ├── 3. Staleness check (event.timestamp)
  │     ├── Older than 60s → REJECT
  │     └── Recent → continue
  │
  ├── 4. Sequence check (event.sequence + event.source)
  │     ├── Sequence < last known → REJECT (out of order)
  │     ├── Sequence > last + 1 → WARN (gap detected)
  │     └── Monotonic → continue
  │
  ├── 5. Dispatch to listeners
  │     ├── event.type specific listeners
  │     └── '*' wildcard listeners
  │
  └── 6. Update metadata
        ├── lastEventTime = Date.now()
        ├── lastEventId = event.id
        └── totalEvents++
```

## Recovery Scenarios

### Scenario 1: Full Flow
1. User opens Studio → `useStudioRecovery` initializes state from sessionStorage
2. `startNewConversation()` → `POST /conversations` → creates conversation in backend
3. User messages → `POST /conversations/:id/messages` → AI responds
4. Answer questions → `POST /conversations/:id/questions` → missing fields update
5. Generate → `POST /pipeline/run` → pipeline starts, SSE streams events
6. Pipeline completes → summary available
7. Deploy → `POST /deploy` → SSE deployment events → preview URL

### Scenario 2: Refresh During Generation
1. Browser refreshes mid-generation
2. `useStudioRecovery()` loads `RecoverySnapshot` from sessionStorage
3. `syncEngine.hydrate()` restores conversation state from cache
4. Pipeline state restored via `setPipelineFromApi`
5. `syncEngine.sync()` pulls latest backend state
6. SSE reconnects → continues receiving pipeline events
7. UI resumes without data loss

### Scenario 3: SSE Disconnect
1. Network drops → `EventSource.onerror` fires
2. `scheduleReconnect()` called with exponential backoff (1s, 2s, 4s, 8s... max 30s)
3. Status transitions: connected → reconnecting → error → connected
4. On reconnect, `lastEventId` sent to server → server replays missed events
5. Duplicate events prevented by `processedIds` set
6. Out-of-order events detected and rejected by sequence tracker
7. UI shows connection status indicator (degraded/reconnecting)

### Scenario 4: Deployment Failure + Retry
1. `POST /deploy` → server returns error
2. Deployment store status: idle → deploying → failed
3. `addLog('error', message)` records failure details
4. Error displayed in DeploymentPanel
5. User clicks "Retry" → `deployProject()` called again
6. `POST /deploy` → success → status: failed → deploying → deployed
7. Preview URL loaded in LivePreview

### Scenario 5: Browser Close + Resume
1. User closes browser mid-session
2. Cleanup saves `RecoverySnapshot` to sessionStorage
3. User returns later → same browser sessionStorage persists
4. `loadRecoverySnapshot()` finds saved state (< 1hr old)
5. `syncEngine.hydrate()` restores all stores from cache
6. `syncEngine.sync()` refreshes from backend
7. SSE reconnects → pipeline continues
8. User sees same state as before close

## Performance Optimizations

- **Event batching**: SSE events dispatched synchronously, but store updates are batched by Zustand
- **Store subscriptions**: Components subscribe to only the fields they need (e.g., `useConversationStore((s) => s.conversations)`)
- **Memoization**: All hook callbacks wrapped in `useCallback` with correct deps
- **iframe reloads**: Refresh button uses React `key` to force clean iframe reload
- **Scroll behavior**: Chat window auto-scrolls via ref, no reflow on every message
- **Pipeline rendering**: Virtualized stage list, only visible stages render
- **Auto-sync interval**: 30s to balance freshness vs. API load

## Testing Strategy

- **Unit tests**: Individual stores, actions, and reducers
- **Integration tests**: Full scenario flows across stores and sync engine
- **Recovery tests**: Session resume, refresh, disconnect scenarios
- **TypeScript**: Strict mode, no `any` in production code

### Test Scenarios
| # | Scenario | Coverage |
|---|----------|----------|
| 1 | Full flow | Conversation → Pipeline → Deploy |
| 2 | Refresh resume | sessionStorage → hydrate → sync |
| 3 | SSE reconnect | disconnect → backoff → resume |
| 4 | Deployment retry | failure → retry → success |
| 5 | Browser resume | close → reopen → restore |

## Developer Diagnostics

Access via the **DX button** (bottom-right of Studio, dev only).

Tabs:
- **stores**: All 5 store states, sync status, validation errors
- **sse**: Event count, reconnect count, last event, connection status
- **perf**: Performance timings for key operations
- **sync**: Manual sync/reconnect/persist/hydrate buttons

## Failure Matrix

| Failure | Detection | Recovery | User Impact |
|---------|-----------|----------|-------------|
| Network disconnect | SSE `onerror` + offline event | Exponential backoff + full sync on reconnect | Status indicator, auto-resume within seconds |
| API timeout | Axios interceptor (30s) | Retry up to 3x with delay | Brief spinner, fallback message if permanent |
| SSE disconnect | Heartbeat miss (45s) + `onerror` | Reconnect with `Last-Event-ID` replay | Status indicator, no data loss |
| Pipeline failure | SSE `pipeline.status: failed` | Manual retry via error UI | Error message + retry button |
| Deployment failure | API error + SSE `deployment.status: failed` | Manual retry | Error log + retry button |
| Server restart | All connections drop + auth fails | Token refresh → SSE reconnect → full sync | Single reconnect cycle |
| Browser refresh | `pagehide` event | sessionStorage snapshot → hydrate on load | Seamless, no visible interruption |
| Browser close | `pagehide` event | Same as refresh | Seamless on next visit |
| Hydration failure | Validation errors on cache load | Skip cache, use fresh backend state | Slight delay on first load |

## Production Readiness Checklist

- [x] Build compiles with 0 TypeScript errors
- [x] All 17 routes generated successfully
- [x] SSE auto-reconnect with exponential backoff
- [x] State persisted to sessionStorage on every change
- [x] State restored on page reload
- [x] Duplicate event prevention
- [x] Out-of-order event detection
- [x] Stale event rejection
- [x] Offline detection and auto-recovery
- [x] Performance timing (observability service)
- [x] Developer diagnostics panel (dev only)
- [x] Store validation (duplicate IDs, orphaned refs, status transitions)
- [x] Error handling in all hook callbacks
- [x] Graceful degradation when backend unreachable

## Known Limitations

- sessionStorage is per-tab; opening Studio in a new tab starts fresh
- Recovery snapshot expires after 1 hour
- Event ID dedup set capped at 1000 entries (older IDs may replay on reconnect)
- No WebSocket fallback for SSE (EventSource only)
- Pipeline stages rendered in sequence view only (no parallel stage visualization)
