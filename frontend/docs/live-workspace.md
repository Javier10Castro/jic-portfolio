# Live AI Workspace

The Live Workspace transforms the Studio into a complete IDE for AI-generated products. It appears after pipeline execution completes and provides full inspection, editing, approval, and export capabilities.

## Architecture

```
Workspace (container)
├── WorkspaceTabs      — Tab navigation (Blueprint, Context, Design, Content, etc.)
├── WorkspaceToolbar   — Edit/Save/Reset/Regenerate/Approve/Reject/Compare/Comment
├── WorkspaceSidebar   — File tree + pending approvals + preview selection
│   └── FileTree       — Directory tree with search, expand/collapse
├── Editor Area        — Active artifact editor (renders based on active tab)
│   ├── BlueprintEditor
│   ├── ContextEditor
│   ├── ContentEditor
│   ├── CodeEditor
│   ├── SeoEditor
│   └── MetadataEditor
├── CommentPanel       — (optional) Comment thread for selected artifact
├── HistoryPanel       — (optional) Version timeline for selected artifact
└── WorkspaceStatus    — Status bar with artifact counts and dirty state
```

## Artifact Lifecycle

```
Pipeline Stage completes
  │
  ▼
Artifact created in workspaceStore
  │
  ▼
Draft → Needs Review → Approved/Rejected
  │                        │
  ▼                        ▼
  Edit & Save           Locked for deployment
  Regenerate
  Compare versions
```

## Key Features

- **10 editor tabs** — Blueprint, Context, Design, Content, Pages, Assets, Code, SEO, Deployment
- **Inline editing** — Toggle edit mode, texarea-based editing with copy support
- **AI Actions** — Regenerate, Improve, Rewrite, Optimize (via existing AI provider)
- **Approval workflow** — Each artifact has Draft → Needs Review → Approved → Rejected
- **Diff viewer** — Side-by-side version comparison with accept/reject
- **Version history** — Timeline view with restore, metadata per version
- **File explorer** — Directory tree with search and file icons
- **Prompt inspector** — Full generation context (system/user/developer prompts, temperature, model, tokens)
- **Generation console** — DevTools-like console with logs/events/AI calls/SSE/performance tabs
- **Export center** — Multi-format export (project, blueprint, markdown, HTML, ZIP, JSON, PDF, OpenAPI, Terraform)
- **Comments** — Per-artifact comment threads with AI suggestions and user notes
- **Preview inspector** — Selected element details from iframe preview

## Store

`workspaceStore` manages all workspace state:
- `artifacts` — Array of generated artifacts with approval status
- `versions` — Version history per artifact
- `comments` — Comment threads
- `diff` — Active diff state
- `editor` — Current editor state (active file, editing mode, dirty flag)
- `console` — Generation console entries
- `promptInspector` — Active prompt inspector record
- `fileTree` — File explorer tree
- `exportConfig` — Export configuration
- `selectedPreviewElement` — Preview inspector selection
