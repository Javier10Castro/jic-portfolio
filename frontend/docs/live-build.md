# Live Build Pipeline

The live build system renders the build pipeline execution in real-time within the Studio chat page. It consists of six visualization components that appear when a pipeline is active.

## Components

### BuildPipeline
Progress bar with stage labels and status indicators. Shows the current stage highlighted, completed stages in green, failed stages in red, and pending stages in gray.

### ActivityFeed
Reverse-chronological list of stage events with agent badges, status dots, and duration. Latest event is highlighted. Supports up to 50 events.

### BuildTimeline
Vertical interactive timeline with color-coded dot nodes. Clicking a stage opens the StageInspector modal for detailed inspection.

### StageInspector
Collapsible JSON viewer showing stage input/output, metrics row (provider, cost, tokens, latency), status badge, error display, and logs section. Opens as a modal when clicked from the timeline.

### CostWidget
Live cost/token/latency grid with a budget progress bar (default budget: $0.50). Updates as each stage completes.

### PipelineAnalytics
Bar chart for stage durations (CSS div-based, no chart library), provider usage table, and failure/retry counts.

### ArtifactViewer
Tabbed viewer per artifact type with scrollable `<pre>` content and download button. Artifacts are created from completed stage outputs.

## Layout Tabs

When a pipeline is running, three tabs appear above the pipeline area:

| Tab | Content |
|-----|---------|
| Pipeline | BuildPipeline + CostWidget + BuildTimeline + ActivityFeed (3-column grid) |
| Analytics | PipelineAnalytics + StageInspector (2-column grid) |
| Artifacts | ArtifactViewer |

## Auto-refresh Preview

The preview iframe auto-refreshes when:
- SSE `preview.updated` event fires → refresh key incremented immediately
- SSE `build.finished` event fires → refresh occurs after 1s delay
- SSE `deployment.completed` event fires → refresh occurs after 500ms delay

Refresh is implemented via a React key state, causing the LivePreview component to unmount and remount.

## Pipeline Execution

Sequential via `PipelineExecutor` (in `services/pipeline-executor.ts`):

1. Call `POST /api/v1/runPipeline` to get a pipeline ID
2. For each of 9 stages (conversation → questions → context → planner → design → content → generation → postprocessing → deployment), call `POST /api/v1/generate` with `{ pipelineId, stage }`
3. On failure of any stage, stop and mark pipeline as failed
4. On cancel, stop mid-execution and mark as cancelled
5. Provider/cost/token/latency data from API responses are tracked per stage
