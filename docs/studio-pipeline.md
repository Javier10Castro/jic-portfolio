# Studio Pipeline Reference

The build pipeline is a state machine with 10 stages. Each stage delegates to an existing platform engine.

## State Transitions

```
pending → conversation → questions → context → architecture
  → knowledge → composer → generator → evaluation
  → deployment → workspace → completed
                         ↘ failed (any stage)
```

## BuildPipeline API

### `new BuildPipeline()`
Creates an empty pipeline.

### `start(projectId, prompt, options)`
Initializes a new build with all 10 stages set to `pending`. Returns the build object.

### `advance(buildId, stageName, data)`
Moves the pipeline to the given stage (marks previous stage as `completed`, sets current stage to `running`). Validates ordering — cannot skip ahead or go backward.

### `completeStage(buildId, stageName, data)`
Marks the specified stage as `completed`. If stage is `workspace`, marks the entire build as `completed`.

### `failStage(buildId, stageName, error)`
Marks the specified stage as `failed` and the build as `failed`.

### `getStatus(buildId)`
Returns a summary of the build: `id`, `projectId`, `status`, `currentStage`, `progress`, `stages[]`, `startedAt`, `completedAt`.

### `getProgress(buildId)`
Returns `{ completed, total, percent, currentStage, status }`.

### `list(projectId)`
Lists all builds, optionally filtered by project ID.

### `clear()`
Resets all builds.

## Progress Calculation

Progress is calculated as `(completedStages / totalStages) * 100`. Each stage represents 10% of the total.

## Stage Object

```json
{
  "name": "architecture",
  "status": "running",
  "startedAt": "2026-06-22T20:00:00Z",
  "completedAt": null,
  "data": {}
}
```

## Error Handling

When a stage fails:
1. The stage status is set to `failed`
2. The build status is set to `failed`
3. An error message is recorded on the stage
4. No further stages are executed

## Manual Controls

The pipeline supports manual advancement for testing and debugging:

- `POST /api/studio/pipeline/advance` — Move to the next stage
- `POST /api/studio/pipeline/complete` — Mark the current stage complete

These endpoints accept `{ projectId, stage, data }` in the request body.
