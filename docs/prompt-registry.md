# Prompt Registry — Versioning & Management — Phase 9.6.0

## Overview

The Prompt Registry is the central repository for AI prompt templates. It provides version control, variable injection with type validation, snapshot capture/restore, change history with diffs, and programmatic template compilation.

## Registry Operations

| Method | Signature | Description |
|---|---|---|
| `register` | `register(id, template, options)` | Register a new prompt template with initial version |
| `get` | `get(id, version?)` | Get prompt template by ID and optional version (latest if omitted) |
| `update` | `update(id, changes)` | Create a new version with incremented version number |
| `unregister` | `unregister(id)` | Remove a prompt template and all its versions |
| `list` | `list(filter?)` | List all registered prompts with optional type/tag filter |
| `search` | `search(query)` | Search prompts by name, content, or tags |

## Versioning Flow

```
1. CREATE ──► register("my-prompt", "You are a {{role}}...", { variables: [...] })
                     │
2. VERSION ──► version = 1 (auto-incremented on first register)
                     │
3. UPDATE  ──► update("my-prompt", { template: "New {{role}} template..." })
                     │
              version = 2 (auto-incremented, v1 preserved)
                     │
4. DIFF    ──► compare("my-prompt", 1, 2) → { added, removed, changed }
                     │
5. ROLLBACK ──► get("my-prompt", 1) → restore by re-registering as latest
```

### Example

```js
const { PromptRegistry } = require('./lib/evaluation/prompts');

const registry = new PromptRegistry();

// Register
registry.register('system-classifier', {
  template: 'Classify the following text as {{type}}: {{input}}',
  variables: [
    { name: 'type', type: 'select', options: ['positive', 'negative', 'neutral'] },
    { name: 'input', type: 'string' }
  ],
  tags: ['classification', 'sentiment']
});

// Update (creates v2)
registry.update('system-classifier', {
  template: 'Analyze the sentiment of: {{input}}. Return {{type}}.',
  variables: [
    { name: 'type', type: 'select', options: ['positive', 'negative', 'neutral', 'mixed'] },
    { name: 'input', type: 'string' }
  ]
});

// Compare versions
const diff = registry.compare('system-classifier', 1, 2);
// Returns structured diff with additions and changes
```

## Version History

| Version | Template | Variables | Created | Status |
|---|---|---|---|---|
| 1 | `Classify the following text as {{type}}: {{input}}` | type(select), input(string) | 2026-06-20 | archived |
| 2 | `Analyze the sentiment of: {{input}}. Return {{type}}.` | type(select), input(string) | 2026-06-21 | active |
| 3 | `Analyze: {{input}} → {{type}} (confidence: {{confidence}})` | type(select), input(string), confidence(number) | 2026-06-22 | draft |

## Template Compilation

Templates use `{{variable}}` syntax with automatic injection and type validation:

| Syntax | Variable Type | Example |
|---|---|---|
| `{{name}}` | string | `{{name}}` → `"Alice"` |
| `{{count}}` | number | `{{count}}` → `42` |
| `{{enabled}}` | boolean | `{{enabled}}` → `true` |
| `{{category}}` | select | `{{category}}` → `"tech"` (from allowed options) |

### Compilation Example

```js
const compiled = registry.compile('system-classifier', {
  type: 'positive',
  input: 'I love this product!'
});
// Result: "Analyze the sentiment of: I love this product!. Return positive."
```

### Variable Types

| Type | Validation | Default |
|---|---|---|
| `string` | Any string value | `""` |
| `number` | Must be finite number | `0` |
| `boolean` | Must be `true` or `false` | `false` |
| `select` | Must be one of defined `options[]` | First option |

## Snapshot Workflow

Snapshots capture the full state of a prompt at a point in time, including template, variables, metadata, and dependencies.

```
                        ┌──────────────┐
                        │  Snapshot 1   │── capture("prompt-id") on 2026-06-20
                        └──────┬───────┘
                               │
  ┌──────────────┐    restore  ▼
  │  Snapshot 2   │◄──── v3    ┌──────────────┐
  │ (2026-06-22)  │            │  Prompt v4   │
  └──────┬───────┘            │  (current)    │
         │                    └──────────────┘
         ▼
  ┌──────────────┐   compare(snap1, snap2)
  │   Diff view  │   → shows template changes, variable additions, metadata diffs
  └──────────────┘
```

### Snapshot Operations

| Method | Description |
|---|---|
| `capture(id, label?)` | Capture current state as a named snapshot |
| `restore(id, snapshotId)` | Restore prompt to snapshot state (creates new version) |
| `compare(id, snapshotA, snapshotB)` | Diff two snapshots |
| `listSnapshots(id)` | List all snapshots for a prompt |

## Prompt Metadata

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique prompt identifier |
| `name` | string | Human-readable name |
| `template` | string | Prompt template with `{{variable}}` placeholders |
| `version` | int | Current version number |
| `variables` | VariableDef[] | Variable definitions with types and validation |
| `tags` | string[] | Categorization tags |
| `status` | 'draft' | 'active' | 'archived' | Current lifecycle status |
| `createdAt` | ISO date | Creation timestamp |
| `updatedAt` | ISO date | Last update timestamp |
| `snapshots` | Snapshot[] | Captured snapshots |

## Best Practices

| Practice | Recommendation |
|---|---|
| **Semantic IDs** | Use descriptive IDs like `classify-sentiment-v2` or `extract-entities` |
| **Variables** | Always define variables explicitly with types — never use raw string interpolation |
| **Versioning** | Every change creates a new version — never mutate existing versions |
| **Snapshots** | Capture snapshots before major changes for easy rollback |
| **Tags** | Tag prompts by domain, model, or purpose for easier discovery |
| **Testing** | Compile and test templates with sample variable values before registering |
| **Deprecation** | Mark prompts as `archived` instead of deleting to preserve history |
| **Templates** | Keep templates focused — one task per prompt template |

## API Endpoints

All routes under `/api/v1/prompts/`:

| Method | Path | Description |
|---|---|---|
| POST | `/` | Register a new prompt template |
| GET | `/` | List all registered prompts |
| GET | `/:id` | Get prompt (latest version) |
| GET | `/:id/versions/:version` | Get specific version |
| PUT | `/:id` | Create new version |
| DELETE | `/:id` | Unregister prompt |
| POST | `/:id/compile` | Compile template with variables |
| POST | `/:id/snapshots` | Capture snapshot |
| POST | `/:id/snapshots/:snapshotId/restore` | Restore from snapshot |
| GET | `/:id/compare` | Compare prompt versions |
| GET | `/search` | Search prompts by query |
