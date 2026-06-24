# Prompt Inspector

The Prompt Inspector provides full visibility into every AI generation, showing the complete context sent to the AI provider.

## Sections

| Section | Content |
|---------|---------|
| **System Prompt** | System-level instructions defining AI behavior |
| **Developer Prompt** | Developer instructions (framework, libraries, constraints) |
| **User Prompt** | The user's original request or message |
| **Context** | Full context object (project info, previous generations, etc.) |
| **Metadata** | Provider, model, temperature, tokens, latency |

## Access

The Prompt Inspector is opened by clicking the prompt icon in the Generation Console or via the Workspace toolbar. It appears as a modal overlay.

## GenerationRecord Interface

```typescript
interface GenerationRecord {
  id: string;
  type: string;
  provider: string;
  model: string;
  systemPrompt?: string;
  userPrompt?: string;
  developerPrompt?: string;
  context?: Record<string, unknown>;
  temperature?: number;
  tokens?: number;
  latency?: number;
  timestamp: string;
}
```

## Generation Console

The Generation Console is a DevTools-like panel with tabbed views:

| Tab | Content |
|-----|---------|
| All | All entries combined |
| Logs | Informational log entries |
| Warnings | Warning entries |
| Errors | Error entries |
| AI Calls | AI generation call records |
| SSE | Server-Sent Event entries |
| Performance | Performance timing entries |

Each entry shows:
- Timestamp
- Type badge
- Message content
- Color-coded by type (green=SSE, purple=AI, red=error, yellow=warn, blue=info)
