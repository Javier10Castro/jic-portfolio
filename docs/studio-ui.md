# Studio UI Guide

The AI Product Studio provides a browser-based interface for creating, building, previewing, and deploying applications from natural-language prompts.

## Getting Started

1. Navigate to the Studio UI (mounted at `/studio`).
2. Click **+ New Project** or use the **Create** tab.
3. Enter your application description in the text area.
4. Click **Start Building** to begin the 10-stage pipeline.

## Pages

### Dashboard
Shows key metrics (total projects, completed, in-progress, failed, subsystem health) and a list of your projects. Click any project card to view its build pipeline.

### Create
The primary input form. Describe your application in natural language. The more detail you provide, the better the result. You can optionally set a project name.

### Pipeline
Visualizes the build pipeline's 10 stages with status indicators:
- ○ Pending — Waiting to be processed
- ◌ Running — Currently being processed
- ● Completed — Finished successfully
- ✕ Failed — Encountered an error

A progress bar shows overall completion percentage. Polls every 2 seconds for live updates.

### Editor
Two-panel view with a file tree on the left and code viewer on the right. Files appear after the generator stage completes. Click any file in the tree to view its contents.

### Preview
Load a project and view deployment URLs. Use **Deploy Now** to deploy a completed project or **Rollback** to revert.

### Archives
Browse all projects in reverse chronological order. Shows project name, prompt excerpt, status badge, and creation date.

### Templates
Quick-start templates organized by category (all, fullstack, backend, frontend, tool, architecture, data, security). Click a template to pre-fill the create form.

### Settings
Configure studio preferences:
- Auto-deploy on build completion
- Run evaluation after generation
- Notification preferences
- Default output directory

### Analytics
Shows build history and aggregated metrics. Each completed or failed build appears in a timeline view.

## Components

| Component | Purpose |
|-----------|---------|
| StageProgress | Pipeline stage visualization bar |
| ProjectCard | Project summary card with click-to-track |
| BuildStatus | Detailed build status panel |
| FileTree | Hierarchical file explorer |
| CodeViewer | Syntax-highlighted code display |
| PreviewFrame | Iframe-based application preview |
| MetricsPanel | Dashboard metric cards |
| HistoryTimeline | Chronological build history |
| TemplateGallery | Filterable template grid |
| DeployPanel | Deploy/rollback controls |

## Architecture

The UI is built with vanilla JavaScript (IIFE pattern, no framework). Each page is a self-contained module that exposes a `render()` function and attaches to `window.*`. The main `StudioApp` router switches between views.

## Data Flow

```
UI Page → fetch('/api/studio/...') → Studio Controller → Studio Manager → State
                                                                   ↓
                                                            Existing Engines
```

All data is fetched from the Studio API endpoints. The UI does not directly import or require engine modules.
