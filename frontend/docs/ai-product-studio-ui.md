# AI Product Studio UI — Conversation Experience

## Overview

The AI Product Studio provides a conversational interface for building applications through natural language interaction. Users describe their project, answer AI-generated questions, watch context build in real time, and generate a deployable website — all within a single chat-based workspace.

## Architecture

### Three-Column Layout

```
┌─────────────────┬────────────────────────┬──────────────────┐
│  LEFT (w-80)    │  CENTER (flex-1)       │  RIGHT (w-96)    │
│                 │                        │                  │
│ ConversationList│  ConversationHeader    │  LiveContextPanel│
│   Search        │  ChatWindow            │    Intent        │
│   New Chat btn  │    Messages            │    Entities      │
│   ─────────     │    TypingIndicator     │    Brand         │
│   Conversation1 │  Pipeline (bottom)     │    Pages         │
│   Conversation2 │    BuildPipeline       │    Features      │
│   Conversation3 │  Input (bottom)        │    MissingFields │
│                 │    PromptInput         │    Assets        │
│                 │    SuggestedQuestions  │    Progress      │
│                 │                        │                  │
│  Desktop: shown │  Desktop: flex-1       │  Desktop: shown  │
│  Tablet: toggle │  Tablet: fills         │  Tablet: toggle  │
│  Mobile: toggle │  Mobile: fills         │  Mobile: hidden  │
└─────────────────┴────────────────────────┴──────────────────┘
```

## Component Hierarchy

```
StudioChatLayout
├── ConversationList
│   ├── Search input
│   └── ConversationItem[] (scrollable)
│
├── ChatArea (flex-1)
│   ├── ConversationHeader
│   │   ├── Back button
│   │   ├── Title
│   │   └── ConversationStatus
│   ├── ChatWindow (scrollable)
│   │   ├── ChatMessage[]
│   │   │   ├── AssistantMessage
│   │   │   │   ├── MarkdownRenderer
│   │   │   │   └── StreamingMessage (when streaming)
│   │   │   └── UserMessage
│   │   ├── TypingIndicator (when streaming)
│   │   └── Inline Components
│   │       ├── ProjectSummary
│   │       ├── LivePreview
│   │       └── DeploymentPanel
│   ├── BuildPipeline (when active)
│   │   ├── PipelineStage[] (vertical timeline)
│   │   └── StageLog
│   └── InputArea
│       ├── SuggestedQuestions
│       ├── QuickReplies
│       ├── PromptInput
│       │   ├── AttachmentButton
│       │   └── MessageToolbar
│       └── UploadPreview
│
└── LiveContextPanel
    ├── IntentDisplay
    ├── EntitiesPanel
    ├── BrandPanel
    ├── FeaturesPanel
    ├── MissingFields
    │   └── Dynamic inputs (radio/checkbox/select/text/etc.)
    ├── AssetPanel
    └── Progress bar
```

## Conversation Lifecycle

```
User opens Studio
  │
  ▼
Create Conversation + Greeting
  │
  ▼
User sends message
  │
  ▼
Streaming response (token-by-token)
  │
  ▼
Response complete → Update context
  │
  ▼
Any missing fields?
  ├── Yes → Show questions in context panel → User answers
  └── No  → Show suggested questions
            │
            ▼
    User clicks "Generate Website"
            │
            ▼
    Start Build Pipeline
      │
      ├── Stage 1: Architecture (animate)
      ├── Stage 2: Composer
      ├── Stage 3: Generator
      ├── Stage 4: Evaluation
      ├── Stage 5: Deployment
      └── Stage 6: Workspace → Complete
            │
            ▼
    Show Project Summary
            │
            ▼
    Live Preview
            │
            ▼
    Deploy
            │
            ▼
    Deployment URL
```

## Streaming Lifecycle

```
User sends message
  │
  ├── Add user message to store
  ├── Set isGenerating = true, isStreaming = true
  │
  ▼
Create empty assistant message with streaming: true
  │
  ▼
For each token/word:
  ├── appendToMessage (adds text)
  └── Short delay (30ms simulated)
  │
  ▼
All tokens delivered
  ├── Set streaming: false on message
  ├── Set isStreaming = false
  └── Set isGenerating = false
```

## Pipeline Lifecycle

```
startPipeline(projectId)
  │
  ▼
Initialize all stages as 'pending'
  │
  ▼
For each stage:
  ├── advanceStage(stage) → status = 'running'
  ├── addLog → stage log entry
  ├── Simulate work (1.5s delay)
  ├── completeStage(stage) → status = 'completed', progress = 100
  └── addLog → completion log
  │
  ▼
All stages complete → status = 'completed'
  │
  ▼
Set project summary → show Preview
```

## Context Synchronization

```
User message → Intent heuristic (keyword match)
  │
  ▼
Detect intent type → Update context.intent
  │
  ▼
Extract entities → Update context.entities
  │
  ▼
Extract brand info → Update context.brand
  │
  ▼
Extract pages → Update context.pages
  │
  ▼
Update progress → context.progress
  │
  ▼
Check for missing fields → context.missingFields
  │
  ▼
React re-renders LiveContextPanel
```

## API Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/v1/studio/project` | POST | Start a build | Real |
| `/api/v1/studio/project/:id/build` | GET | Get build status | Real |
| `/api/v1/studio/pipeline/advance` | POST | Advance pipeline | Real |
| `/api/v1/studio/pipeline/complete` | POST | Complete stage | Real |
| `/api/v1/studio/projects` | GET | List studio projects | Real |
| `/api/v1/studio` | GET | Studio health | Real |
| Conversation simulation | — | Local intent + response | Simulated |

The conversation layer uses local simulation (`hooks/use-conversation.ts`) for the chat experience, delegating to real API endpoints for the build pipeline and project management.

## State Management

### Stores

| Store | Key State | Purpose |
|-------|-----------|---------|
| `conversationStore` | conversations[], activeConversationId, isStreaming, isGenerating | Chat messages, context, streaming state |
| `pipelineStore` | pipeline (stages[], status, logs) | Build pipeline state machine |
| `previewStore` | preview (url, html, status, device) | Live preview state |
| `deploymentStore` | deployment (status, url, logs, history) | Deployment lifecycle |
| `summaryStore` | summary, editing | Project summary before generation |

### Data Flow

```
User Input → useConversation hook
  ├── conversationStore (messages, context)
  ├── pipelineStore (build stages)
  ├── previewStore (preview state)
  ├── deploymentStore (deploy state)
  └── summaryStore (project summary)
```

## Performance

- **Virtualized messaging**: Messages rendered as a flat list with efficient re-renders (Zustand selectors)
- **Streaming rendering**: Token-by-token append with React reconciliation
- **Auto-scroll**: Scroll-to-bottom with intersection observer sentinel
- **Lazy loading**: Context panel only renders when conversation is active
- **Memoization**: Component-level React.memo for message components

## Accessibility

- All interactive elements have ARIA labels
- Keyboard navigation for the entire chat interface
- Focus management on message input
- Screen reader support via `role="log"`, `aria-live="polite"`
- Semantic HTML structure (main, nav, aside)
- Focus trap in modals and mobile panels

## Testing Strategy

| Category | Tests | Focus |
|----------|-------|-------|
| Stores | 15+ | Conversation CRUD, pipeline state machine, preview/deployment state |
| Components | 20+ | Chat messages, rendering, streaming, context panel, pipeline visualization |
| Integration | 5+ | Full conversation flow, pipeline lifecycle, deployment flow |
| Accessibility | 5+ | ARIA attributes, keyboard navigation, focus management |
| Streaming | 3+ | Token-by-token append, abort, retry |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `Escape` | Cancel generation |
| `Ctrl+Z` | Undo (future) |
| `Ctrl+Shift+Z` | Redo (future) |
| `Ctrl+K` | Focus search |
| `Ctrl+N` | New conversation |
| `Ctrl+Enter` | Generate website |
