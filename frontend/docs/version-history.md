# Version History

Every artifact version is tracked with metadata for auditability and rollback.

## Version Lifecycle

```
Artifact Created (v1)
  │
  ▼
User edits + saves → v2 created
  │
  ▼
AI regeneration → v3 created
  │
  ▼
User restores v1 → v4 created (content = v1)
```

## Version Data

Each version stores:
- `id` — Unique version ID
- `artifactId` — Parent artifact
- `version` — Auto-incrementing version number
- `content` — Full artifact content at this version
- `author` — Who created this version ('ai' or 'user')
- `timestamp` — When the version was created
- `message` — Optional commit message
- `provider` — AI provider if AI-generated
- `tokens` — Token count if AI-generated
- `cost` — Cost if AI-generated

## VersionTimeline Component

Renders a vertical timeline of versions with:
- Colored dot indicators (blue for current, gray for historical)
- Version number, author, relative timestamp
- Optional commit message
- AI provider/tokens/cost metadata
- **Restore** button — creates a new version with the restored content

## DiffViewer

Opens from the WorkspaceToolbar "Compare" button:
- Select "from" and "to" versions via dropdowns
- Line-by-line diff with green (added) and red (removed) highlighting
- Line numbers and +/- indicators
- Accept button — adopts the "after" version
- Reject button — stays with the "before" version
- Addition/removal counts in header
