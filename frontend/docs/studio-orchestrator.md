# Studio Orchestrator

The `useStudioOrchestrator` hook is the top-level controller for the AI Build Studio. It wraps `useConversation` and adds full pipeline lifecycle management (start, cancel, resume, restart, recover), phase tracking, and integration with SSE events.

## Phase State Machine

```
idle → conversation → building → completed
                    ↘ deploying → completed
                    ↘ failed
                    ↘ cancelled
```

## API

| Method | Description |
|--------|-------------|
| `startConversation(title?)` | Creates a new conversation (phase → `conversation`) |
| `sendMessage(text)` | Sends a user message |
| `answerQuestion(field, value)` | Answers a context-gathering question |
| `runPipeline()` | Executes all pipeline stages sequentially (phase → `building`) |
| `cancelPipeline()` | Cancels the running pipeline (phase → `cancelled`) |
| `resumePipeline()` | Resumes a failed pipeline (phase → `building`) |
| `deploy()` | Triggers deployment (phase → `completed`) |
| `restart()` | Full reset (all stores, phase → `idle`) |
| `recover()` | Restores session from sessionStorage snapshot |
| `getCurrentStageInfo()` | Returns current stage status/progress/error/provider/cost/tokens |

## Returned State

| Property | Type | Description |
|----------|------|-------------|
| `phase` | `OrchestratorPhase` | Current orchestrator phase |
| `activeStage` | `string \| null` | Name of currently running stage |
| `stageResults` | `StageResult[]` | Completed stage results with timing/cost/provider |
| `currentStage` | `string \| null` | Current stage from pipeline store |
| `pipelineStatus` | `string \| null` | Pipeline overall status from store |

All `useConversation` properties (e.g., `messages`, `activeConv`, `isGenerating`) are also spread onto the return value.

## SSE Events Consumed

- `build.started` → phase becomes `building`
- `build.finished` → phase becomes `completed`, triggers preview refresh
- `build.failed` → phase becomes `failed`
- `deployment.started` → phase becomes `deploying`
- `deployment.completed` → phase becomes `completed`
- `deployment.failed` → phase becomes `failed`
- `pipeline.status` → updates `activeStage` from `payload.currentStage`
- `preview.updated`, `generation.completed`, `postprocessing.completed` → triggers preview iframe refresh

## Notifications

The orchestrator uses `studioNotifications` from `lib/sync/notifications.ts` to emit toast messages for:
- Stage completion → `.success()`
- Stage failure → `.error()`
- Pipeline cancellation → `.info()`
- Build complete → `.success()`
- Build failed → `.error()`
- Session restore → `.info()`
- No pipeline to resume → `.warning()`

## Observability

The orchestrator tracks pipeline execution and provider usage:
- `orchestrator.pipeline` — total pipeline duration (startMark/endMark)
- `provider.{name}` — per-provider timing with stage/tokens/cost metadata
