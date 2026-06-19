# Conversation Engine — Phase 7.3.1

## Overview

The Conversation Engine provides the foundational infrastructure for the conversational AI system that will eventually replace manual brief creation. It manages conversation lifecycle, message persistence, context tracking, event emission, and deterministic summarization — all without any LLM calls.

This is a pure infrastructure layer. No prompt generation. No website generation changes.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Dashboard UI (Phase 7.2)                       │
│   ui/dashboard/pages/conversations.js                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                      lib/conversation/ (Phase 7.3.1)                │
│                                                                     │
│  ┌────────────────────┐  ┌────────────────────┐  ┌───────────────┐  │
│  │ conversationManager│  │ conversationSession  │  │conversation   │  │
│  │ (Orchestrator)     │──│ (Data Model)         │  │Memory         │  │
│  └─────────┬──────────┘  └────────────────────┘  │(Messages)     │  │
│            │                                      └───────┬───────┘  │
│  ┌─────────▼──────────┐  ┌────────────────────┐           │        │
│  │ conversationStore   │  │ conversationContext │           │        │
│  │ (data/conversations/)│  │ (Intent, Entities) │           │        │
│  └────────────────────┘  └────────────────────┘           │        │
│                                                           │        │
│  ┌────────────────────┐  ┌────────────────────┐  ┌───────▼───────┐  │
│  │conversation        │  │conversation        │  │conversation   │  │
│  │Summarizer          │  │Serializer          │  │Validator      │  │
│  └────────────────────┘  └────────────────────┘  └───────────────┘  │
│                                                           │        │
│  ┌────────────────────────────────────────────────────────▼────┐   │
│  │                    conversationEvents                        │   │
│  │         EventEmitter: created, updated, deleted, summarized  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                  data/conversations/*.json
```

## Module Responsibilities

| Module | File | Purpose |
|---|---|---|
| **Manager** | `conversationManager.js` | Orchestrator — create, load, save, archive, delete, list, validate, summarize |
| **Session** | `conversationSession.js` | Data model factory — session schema with defaults |
| **Store** | `conversationStore.js` | JSON persistence to `data/conversations/{id}.json` — CRUD + list |
| **Memory** | `conversationMemory.js` | Message operations — append, remove, update, getRecent, token estimation |
| **Context** | `conversationContext.js` | Intent tracking, entity detection, pending/answered questions, context variables |
| **Summarizer** | `conversationSummarizer.js` | Deterministic rolling summaries at configurable thresholds (tokens/messages) |
| **Events** | `conversationEvents.js` | Node.js EventEmitter — `conversation.created`, `.updated`, `.deleted`, `.summarized` |
| **Serializer** | `conversationSerializer.js` | Export/Import conversation JSON with optional validation |
| **Validator** | `conversationValidator.js` | Validate message order, timestamps, roles, integrity — throws `ConversationValidationError` |

## Conversation Lifecycle

```
CREATED  ──►  ACTIVE  ──►  COMPLETED
                │
                ▼
            ARCHIVED  ──►  DELETED (permanent)
```

1. **createConversation()** → generates id, session, saves to store, emits `conversation.created`
2. **addMessage()** → appends message via Memory, triggers auto-save, emits `conversation.updated`
3. **summarizeConversation()** → generates rolling summary when tokens > 2000 or messages > 20
4. **archiveConversation()** → sets status to 'archived', emits `conversation.updated`
5. **deleteConversation()** → removes from store, emits `conversation.deleted`

## Storage Model

- **Format**: Single JSON file per conversation in `data/conversations/{id}.json`
- **Directory**: `data/conversations/` (auto-created on first write)
- **Index**: No separate index — `list()` reads directory and parses each file
- **Schema**:

```json
{
  "id": "conv-abc123-def456",
  "session": {
    "id": "conv-abc123-def456",
    "projectId": "prj-xxx",
    "workspaceId": "ws-yyy",
    "createdAt": "2026-06-19T00:00:00.000Z",
    "updatedAt": "2026-06-19T00:00:00.000Z",
    "messages": [],
    "metadata": { "title": "Coffee Shop Website", "tags": [], "source": "manual" },
    "summary": null,
    "context": {
      "currentIntent": null,
      "detectedEntities": [],
      "pendingQuestions": [],
      "answeredQuestions": [],
      "contextVariables": {}
    },
    "status": "active"
  },
  "messages": [
    {
      "id": "msg-xxx",
      "role": "user",
      "content": "I want a website for my coffee shop",
      "timestamp": "2026-06-19T00:00:00.000Z",
      "metadata": {}
    }
  ],
  "createdAt": "2026-06-19T00:00:00.000Z",
  "updatedAt": "2026-06-19T00:00:00.000Z"
}
```

## Event Flow

| Event | Emitted By | Payload |
|---|---|---|
| `conversation.created` | `conversationManager.createConversation()` | `{ conversationId, projectId, workspaceId, metadata }` |
| `conversation.updated` | `conversationManager.saveConversation()` | `{ conversationId, messageCount }` |
| `conversation.deleted` | `conversationManager.deleteConversation()` | `{ conversationId }` |
| `conversation.summarized` | `conversationSummarizer.generateSummary()` | `{ conversationId, type, messageCount, tokensBefore, summaryLength }` |

Events are emitted via a shared Node.js `EventEmitter` instance. Listeners can subscribe to specific event types:

```js
const { conversationEvents } = require('./lib/conversation');
conversationEvents.on('conversation.created', (event) => {
  console.log('New conversation:', event.conversationId);
});
```

## Summarization Strategy

The summarizer uses **deterministic** (rule-based) logic — no external AI calls.

### Thresholds
- **Token threshold**: 2000 tokens (default) — triggers rolling summary
- **Message threshold**: 20 messages (default) — triggers rolling summary

### Summary Content
- Message count (total, user vs assistant)
- First and last message excerpts
- Top 5 topics by word frequency
- Participant count (unique roles)
- Key points (sentences > 20 chars, max 5)

### Placeholder Note
All summaries include: `"This is a deterministic placeholder summary — no LLM call was made."`

This will be replaced with real LLM summarization in a future phase.

## Validation Rules

| Rule | Validator | Error |
|---|---|---|
| Message must be object | `validateMessage()` | `ConversationValidationError` |
| Role must be user/assistant/system/tool | `validateMessage()` | `ConversationValidationError` |
| Content must be string | `validateMessage()` | `ConversationValidationError` |
| Message must have id | `validateMessage()` | `ConversationValidationError` |
| Timestamps must be chronological | `validateTimestamps()` | `ConversationValidationError` |
| Conversation must have id, session, messages | `validateConversation()` | `ConversationValidationError` |
| Full integrity check | `validateIntegrity()` | Returns array of all errors |

## Future Roadmap

| Phase | Feature | Status |
|---|---|---|
| 7.3.1 | Conversation engine infrastructure | ✅ Done |
| 7.3.2 | LLM prompt generation | 🔮 Planned |
| 7.3.3 | Real AI conversation flow | 🔮 Planned |
| 7.3.4 | Replace manual brief creation | 🔮 Planned |

## Integration with SaaS Core

The Conversation Engine stores conversations independently in `data/conversations/`, but references:
- **projectId** — links conversations to projects (via `lib/saas/projectManager.js`)
- **workspaceId** — scopes conversations to workspaces (via `lib/saas/workspaceManager.js`)
- **user context** — future: link conversations to users (via `lib/saas/userManager.js`)

## Integration with Dashboard

The Conversations page (`ui/dashboard/pages/conversations.js`) registers as a new page in the Dashboard:
- **Sidebar link**: "Conversations" added to the Main section
- **Route**: `?page=conversations` with optional `status` and `search` parameters
- **Actions**: Open, Archive, Duplicate, Delete conversations
- **Filter**: By status (active, archived, completed)
- **Search**: By title

## Example: Sample Conversation

```json
{
  "id": "conv-sample-001",
  "session": {
    "id": "conv-sample-001",
    "projectId": "prj-coffee-shop",
    "workspaceId": "ws-personal",
    "createdAt": "2026-06-19T12:00:00.000Z",
    "updatedAt": "2026-06-19T12:05:30.000Z",
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "content": "I want to build a website for my coffee shop in San Diego.",
        "timestamp": "2026-06-19T12:00:00.000Z",
        "metadata": {}
      },
      {
        "id": "msg-2",
        "role": "assistant",
        "content": "Great! A coffee shop website needs a warm, inviting design. What pages do you need?",
        "timestamp": "2026-06-19T12:00:30.000Z",
        "metadata": {}
      },
      {
        "id": "msg-3",
        "role": "user",
        "content": "Menu page, location with map, online ordering, and an About Us page.",
        "timestamp": "2026-06-19T12:01:00.000Z",
        "metadata": {}
      }
    ],
    "metadata": { "title": "Coffee Shop Website", "tags": ["coffee", "ecommerce"], "source": "manual" },
    "summary": {
      "generatedAt": "2026-06-19T12:05:30.000Z",
      "type": "preview",
      "messageCount": 3,
      "totalTokens": 27,
      "summaryText": "Last message: \"Menu page, location with map, online ordering, and an About Us page.\"...",
      "participantCount": 2,
      "topics": ["website", "coffee", "shop", "pages", "menu"],
      "keyPoints": ["I want to build a website for my coffee shop in San Diego"]
    },
    "context": {
      "currentIntent": "website_creation",
      "detectedEntities": [
        { "type": "business_type", "value": "coffee_shop", "detectedAt": "2026-06-19T12:00:00.000Z" },
        { "type": "location", "value": "San Diego", "detectedAt": "2026-06-19T12:00:00.000Z" }
      ],
      "pendingQuestions": ["What style do you prefer?"],
      "answeredQuestions": ["What kind of business?"],
      "contextVariables": { "businessType": "coffee_shop", "location": "San Diego" }
    },
    "status": "active"
  },
  "messages": [],
  "createdAt": "2026-06-19T12:00:00.000Z",
  "updatedAt": "2026-06-19T12:05:30.000Z"
}
```

## Example: Export / Import

### Export
```js
const { conversationSerializer } = require('./lib/conversation');
const json = conversationSerializer.exportConversation(conversation);
// Full export with validation report
```

### Import
```js
const { conversationSerializer } = require('./lib/conversation');
const result = conversationSerializer.importConversation(jsonString);
if (result.success) {
  // result.conversation is ready to save
}
```

### Validation
```js
const { conversationValidator } = require('./lib/conversation');
const errors = conversationValidator.validateIntegrity(myConversation);
if (errors.length) {
  throw errors[0]; // ConversationValidationError
}
```
