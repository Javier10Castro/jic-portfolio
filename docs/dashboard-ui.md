# Dashboard UI — Phase 7.2

## Overview

The SaaS Dashboard UI provides a complete, production-ready interface for managing the AI Website Generation Platform. It consumes the SaaS Core modules (Phase 7.1) directly via server-side rendering, with no mocked data or duplicated business logic.

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         Vercel Serverless Functions                 │
│  api/dashboard-saas.js  ←  HTTP request (?page=home)               │
│         │                                                          │
│         ▼                                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              ui/dashboard/dashboard.js                       │  │
│  │              Router → Page renderer → Layout composer        │  │
│  └──────────┬──────────┬──────────┬────────────────────────────┘  │
│             │          │          │                                │
│     ┌───────▼──┐ ┌────▼────┐ ┌───▼────────┐                      │
│     │  Pages   │ │Layouts  │ │ Components  │                      │
│     │  (10)    │ │ (1)     │ │ (15)        │                      │
│     └───────┬──┘ └─────────┘ └────────────┘                      │
│             │                                                     │
│             ▼                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              lib/saas/ (SaaS Core — Phase 7.1)               │  │
│  │  userManager · projectManager · workspaceManager ·           │  │
│  │  organizationManager · sessionManager · apiKeys ·            │  │
│  │  usageTracker · auditLog · settingsManager ·                 │  │
│  │  authorization · authentication · storageManager             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

### Server-Side Rendering Flow

1. HTTP request arrives at `api/dashboard-saas.js` with query parameters (`page`, `workspaceId`, `projectId`, etc.)
2. The handler calls `renderFullPage(params)` from `ui/dashboard/dashboard.js`
3. The dashboard router selects the correct page renderer
4. The page renderer imports SaaS Core modules (`lib/saas/`) for data
5. Component functions compose the data into HTML strings
6. The full HTML page (with inline CSS and JS) is returned

## Folder Tree

```
ui/dashboard/
├── dashboard.js              # Entry point — router, full-page renderer
├── dashboard.css             # Complete stylesheet (~500 lines)
├── components/               # 15 reusable UI components
│   ├── Sidebar.js            # Navigation sidebar  with sections
│   ├── Topbar.js             # Top bar with breadcrumbs + user menu + notifications
│   ├── Breadcrumbs.js        # Breadcrumb navigation
│   ├── ProjectCard.js        # Project card for grid view
│   ├── ProjectTable.js       # Project table with sort/filter/actions
│   ├── DeploymentCard.js     # Timeline deployment item
│   ├── RecentActivity.js     # Activity feed
│   ├── UsageWidget.js        # Usage bars widget
│   ├── StatsCard.js          # Metric stat card
│   ├── EmptyState.js         # Empty state with optional CTA
│   ├── SearchBar.js          # Search input
│   ├── NotificationBell.js   # Notification indicator
│   ├── UserMenu.js           # User avatar + name dropdown trigger
│   ├── WorkspaceSwitcher.js  # Workspace selector
│   └── QuickActions.js       # Quick action grid
├── layouts/
│   └── DashboardLayout.js    # Full page layout (sidebar + topbar + content)
└── pages/                    # 10 page renderers
    ├── home.js               # Dashboard home — stats, quick actions, activity
    ├── projects.js           # Project list — grid/table, search, filter
    ├── projectDetails.js     # Single project — overview, tabs, history
    ├── deployments.js        # Deployment timeline — stats, filter
    ├── workspace.js          # Workspace — info, members, usage
    ├── settings.js           # Settings — general, deployment, AI, branding
    ├── profile.js            # Profile — info, notifications, sessions
    ├── apiKeys.js            # API keys — list, generate, revoke, rotate
    ├── usage.js              # Usage — stats, widgets, charts placeholder
    └── auditLog.js           # Audit log — timeline, filter, search, export
```

## Components Created

| Component | File | Purpose |
|---|---|---|
| **Sidebar** | `components/Sidebar.js` | Navigation with 3 sections (Main, Workspace, Settings), 10 links, active state, logo |
| **Topbar** | `components/Topbar.js` | Top bar with breadcrumbs, notification bell, user avatar |
| **Breadcrumbs** | `components/Breadcrumbs.js` | ARIA-compliant breadcrumb trail with home base |
| **ProjectCard** | `components/ProjectCard.js` | Card with name, type, status badge, deploy count, click handler |
| **ProjectTable** | `components/ProjectTable.js` | Full table with name, status, type, owner, dates, actions |
| **DeploymentCard** | `components/DeploymentCard.js` | Timeline item with status dot, provider, version, duration, rollback/report |
| **RecentActivity** | `components/RecentActivity.js` | Activity feed with action icon, resource, timestamp |
| **UsageWidget** | `components/UsageWidget.js` | Usage bars (6 metrics) with label, value, max, percentage |
| **StatsCard** | `components/StatsCard.js` | Metric display with label, value, optional change %, icon |
| **EmptyState** | `components/EmptyState.js` | Centered state with icon, title, description, optional CTA |
| **SearchBar** | `components/SearchBar.js` | Search input with magnifying glass icon |
| **NotificationBell** | `components/NotificationBell.js` | Bell icon with unread dot indicator |
| **UserMenu** | `components/UserMenu.js` | Avatar + name + chevron dropdown trigger |
| **WorkspaceSwitcher** | `components/WorkspaceSwitcher.js` | Workspace selector with icon, name, chevron |
| **QuickActions** | `components/QuickActions.js` | 6-action grid (new project, deploy, invite, usage, API key, audit) |

## Pages Created

| Page | Route | File | SaaS Core Integration |
|---|---|---|---|
| Home | `?page=home` | `pages/home.js` | `projectManager.listProjects()`, `usageTracker.getSummary()`, `auditLog.getLog()` |
| Projects | `?page=projects` | `pages/projects.js` | `projectManager.listProjects()` with search/filter |
| Project Details | `?page=projectDetails&projectId=X` | `pages/projectDetails.js` | `projectManager.getProject()`, deployment/generation history |
| Deployments | `?page=deployments` | `pages/deployments.js` | Aggregated from all projects' `deploymentHistory` |
| Workspace | `?page=workspace&workspaceId=X` | `pages/workspace.js` | `workspaceManager.getWorkspace()`, `organizationManager.getOrganization()` |
| Settings | `?page=settings` | `pages/settings.js` | `settingsManager.getSettings()` with workspace + org defaults |
| Profile | `?page=profile&userId=X` | `pages/profile.js` | `userManager.getUser()`, `sessionManager.listSessions()` |
| API Keys | `?page=apiKeys&userId=X` | `pages/apiKeys.js` | `apiKeys.listApiKeys()` with UI for generate/revoke/rotate |
| Usage | `?page=usage` | `pages/usage.js` | `usageTracker.getSummary()` with storage/bandwidth breakdown |
| Audit Log | `?page=auditLog` | `pages/auditLog.js` | `auditLog.getLog()` with resource/actor filtering |

## Navigation Map

```
Sidebar
├── Main
│   ├── Dashboard        → ?page=home
│   ├── Projects         → ?page=projects
│   └── Deployments      → ?page=deployments
├── Workspace
│   ├── Workspace        → ?page=workspace&workspaceId=X
│   ├── Usage            → ?page=usage
│   └── Audit Log        → ?page=auditLog
└── Settings
    ├── API Keys         → ?page=apiKeys&userId=X
    ├── Settings         → ?page=settings
    └── Profile          → ?page=profile&userId=X
```

## State Management Strategy

Current approach (Phase 7.2):
- **Server-side state**: Data is fetched from SaaS Core modules at render time
- **URL parameters**: Page state encoded in query parameters (`page`, `workspaceId`, `projectId`, etc.)
- **Client interactivity**: Vanilla JS event delegation for tabs, actions (logged to console — ready for API dispatch)
- **No client-side state**: Each page load is a fresh server-side render

Future (post-REST-API):
- Client-side routing with hash-based navigation
- SPA-like state with fetch/API calls to backend
- React/ Vue migration with the component structure already in place

## Example Data

### Project List (JSON shape consumed by ProjectTable / ProjectCard)
```json
[
  {
    "id": "prj-abc123-def456",
    "name": "Acme Corp Website",
    "owner": "usr-mqkc6re3-jpc2",
    "organization": "org-xyz789",
    "workspaceId": "ws-mqkc6rf8-gjys",
    "type": "website",
    "status": "deployed",
    "deploymentHistory": [{ "id": "dep-001", "status": "success", "provider": "vercel", "createdAt": "2026-06-18T12:00:00Z" }],
    "generationHistory": [],
    "createdAt": "2026-06-18T10:00:00Z",
    "updatedAt": "2026-06-18T12:00:00Z"
  }
]
```

### Deployment Timeline (JSON shape consumed by DeploymentCard)
```json
[
  {
    "id": "dep-001",
    "projectName": "Acme Corp Website",
    "status": "success",
    "provider": "vercel",
    "version": "1.0.0",
    "commit": "abc123def456",
    "durationMs": 45000,
    "createdAt": "2026-06-18T12:00:00Z"
  }
]
```

### Usage Dashboard (JSON shape consumed by UsageWidget / StatsCard)
```json
{
  "projectsCreated": 12,
  "deploymentsExecuted": 45,
  "aiGenerations": 89,
  "storageBytes": 52428800,
  "bandwidthBytes": 107374182,
  "apiCalls": 1234,
  "totalEntries": 1500
}
```

## Responsive Strategy

| Breakpoint | Sidebar | Grid | Layout |
|---|---|---|---|
| >1024px | Full (260px) | 4-col | Sidebar + main content |
| 768–1024px | Full (260px) | 2-col | Sidebar + main content |
| 481–768px | Collapsed (64px, icons only) | 2-col | Collapsed sidebar + main |
| ≤480px | Collapsed (64px) | 1-col | Collapsed sidebar + single column |

- `grid-2`, `grid-3`, `grid-4` classes auto-collapse at breakpoints
- Sidebar navigation labels hidden below 768px
- Filter bar wraps to vertical below 480px
- Search bar expands to full width below 480px
- Cards, tables, and content stack vertically on mobile

## Accessibility Considerations

### Semantic HTML
- `<nav>` with `aria-label` for sidebar navigation
- `<main role="main">` for primary content
- `<header role="banner">` for top bar
- `<table role="table">` with `<thead>`, `<tbody>`, `<th>` scope
- `<article>` for project cards
- `<aside role="navigation">` for sidebar

### ARIA Attributes
- `aria-label="Dashboard navigation"` on sidebar
- `aria-label="Breadcrumb"` on breadcrumbs
- `aria-current="page"` on current breadcrumb
- `aria-label="Notifications"` with unread count in label
- `aria-haspopup="true"` on dropdown triggers
- `aria-label="Search"` on search inputs
- `tabindex="0"` on all interactive elements
- `role="tablist"`, `role="tab"` on tab groups
- `role="button"` on clickable elements

### Focus & Interaction
- All interactive elements keyboard-accessible
- Tab switching via click/keyboard
- Action buttons with `data-action` attributes for event delegation
- Visible focus states on all form inputs

### Color & Contrast
- High-contrast dark theme (black/white base)
- Semantic color system (success=green, error=red, warning=amber, accent=cyan)
- Status badges with distinct colors + text labels (not color-only)
- Status dots combined with text labels for accessibility

### Future React Migration
- Components are pure functions accepting data props
- No direct DOM manipulation (pure HTML string composition)
- State management separated from rendering
- CSS class naming follows BEM-like conventions

## Integration with SaaS Core

| Page | Module(s) Used | Functions Called |
|---|---|---|
| Home | `projectManager`, `usageTracker`, `auditLog` | `listProjects()`, `getSummary()`, `getLog()` |
| Projects | `projectManager` | `listProjects()` with optional status/search filter |
| Project Details | `projectManager` | `getProject()` |
| Deployments | `projectManager` | `listProjects()` → aggregate deploymentHistory |
| Workspace | `workspaceManager`, `organizationManager`, `usageTracker` | `getWorkspace()`, `getOrganization()`, `getSummary()` |
| Settings | `settingsManager` | `getSettings('workspace', id)`, `getSettings('organization', 'default')` |
| Profile | `userManager`, `sessionManager` | `getUser()`, `listSessions()` |
| API Keys | `apiKeys` | `listApiKeys()` |
| Usage | `usageTracker` | `getSummary()` |
| Audit Log | `auditLog` | `getLog()` with resource/actor filter |

## Serving

The dashboard is served via:
- **API endpoint**: `api/dashboard-saas.js` — Vercel Serverless Function
  - `GET /api/dashboard-saas?page=home` — renders full HTML page
  - Query parameters: `page`, `workspaceId`, `userId`, `projectId`, `organizationId`, `status`, `search`, `view`, `resource`, `actor`, `limit`
- **Direct Node.js**: `ui/dashboard/dashboard.renderFullPage(params)` — returns HTML string for embedding or testing
