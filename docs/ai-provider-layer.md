# AI Provider Routing Layer

## Overview

The AI Provider Routing Layer provides a unified interface for routing all LLM calls across multiple providers. It enables the system to select the optimal model based on cost, latency, quality requirements, and provider availability.

```
Application Code
    ↓
┌─────────────────────────────────────┐
│         AI Router (aiRouter.js)      │
│  - generate()                       │
│  - stream()                         │
│  - selectModel()                    │
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┐
    ▼              ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  OpenAI  │ │ Anthropic│ │  Gemini  │ │  Ollama  │
│  Provider│ │ Provider │ │ Provider │ │ Provider │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

## Architecture

### Directory Structure

```
lib/ai/
├── index.js                          # Entry point — exports all modules
├── providers/
│   ├── index.js                      # Provider registry & health check
│   ├── baseProvider.js               # Abstract base class
│   ├── openaiProvider.js             # OpenAI (GPT-4, GPT-3.5)
│   ├── anthropicProvider.js          # Anthropic (Claude 3 Opus/Sonnet/Haiku)
│   ├── geminiProvider.js             # Google (Gemini 1.5 Pro/Flash, 2.0 Flash)
│   └── ollamaProvider.js             # Local (Llama 3, Mistral, CodeLlama)
├── router/
│   ├── index.js                      # Router exports
│   ├── aiRouter.js                   # Main entry: generate(), stream(), selectModel()
│   ├── modelSelector.js              # Selects model by context + strategy
│   ├── fallbackRouter.js             # Retry + fallback chain execution
│   └── loadBalancer.js               # Round-robin, latency, cost, hybrid
├── normalization/
│   ├── index.js
│   ├── responseNormalizer.js         # Unifies API responses into standard shape
│   ├── promptFormatter.js            # Formats prompts per-provider
│   └── tokenEstimator.js             # Token counting + cost estimation
├── intelligence/
│   ├── index.js
│   ├── intentRouter.js               # Routes by intent type (planning, code, etc.)
│   ├── costOptimizer.js              # Picks cheapest adequate model
│   ├── latencyOptimizer.js           # Picks fastest adequate model
│   └── qualityRouter.js              # Picks highest quality model + context preferences
└── integration/
    ├── index.js
    ├── plannerIntegration.js         # AI-enhanced planner wrappers
    ├── generatorIntegration.js       # AI-enhanced generator wrappers
    └── contentIntegration.js         # AI-enhanced content wrappers
```

## Supported Providers

| Provider | Models | Quality | Cost/1k in | Cost/1k out | Speed |
|---|---|---|---|---|---|
| **OpenAI** | GPT-4 | High | $0.03 | $0.06 | Medium |
| | GPT-4 Turbo | High | $0.01 | $0.03 | Medium |
| | GPT-3.5 Turbo | Medium | $0.001 | $0.002 | Fast |
| **Anthropic** | Claude 3 Opus | Very High | $0.015 | $0.075 | Slow |
| | Claude 3 Sonnet | High | $0.003 | $0.015 | Medium |
| | Claude 3 Haiku | Medium | $0.00025 | $0.00125 | Fast |
| **Gemini** | 1.5 Pro | High | $0.0035 | $0.0105 | Fast |
| | 1.5 Flash | Medium | $0.00035 | $0.00105 | Very Fast |
| | 2.0 Flash | High | $0.0001 | $0.0004 | Very Fast |
| **Ollama** | Llama 3 | Medium | Free | Free | Medium |
| | Mistral | Medium | Free | Free | Medium |
| | CodeLlama | Medium | Free | Free | Medium |

## Routing Flow

```
generate(prompt, options)
    ↓
selectModel(prompt, options)
    ├── Determine context (planning, code, design, content, summarization, fast, chat)
    ├── Choose strategy (quality, cost, latency, hybrid)
    ├── Score available models
    └── Return { provider, model, reason, estimatedCost }
    ↓
executeWithFallback(prompt, selection)
    ├── Attempt primary provider
    ├── On failure → retry (max 3)
    ├── On all retries fail → fallback chain
    └── Return normalized response
```

## Routing Rules

| Context | Preferred Provider | Reason |
|---|---|---|
| `planning` | Claude (Anthropic) | Structured planning, architectural thinking |
| `code` | GPT-4 (OpenAI) | Code generation optimization |
| `design` | Claude (Anthropic) | UI/design reasoning |
| `content` | Claude (Anthropic) | Nuanced copywriting |
| `summarization` | Gemini | Cheap models sufficient |
| `fast` | Gemini Flash | Lowest latency |
| `chat` | GPT (OpenAI) | Balanced conversation |

## Selection Strategies

| Strategy | Behavior |
|---|---|
| `quality` | Prefers highest quality model within budget |
| `cost` | Prefers cheapest model meeting minimum quality |
| `latency` | Prefers fastest model |
| `hybrid` | Quality-first, optimizes cost when quality target met |

## Fallback System

Each provider has a fallback chain:

```
openai    → anthropic → gemini → ollama
anthropic → openai    → gemini → ollama
gemini    → openai    → anthropic → ollama
ollama    → openai    → gemini → anthropic
```

When a provider fails:
1. Retry same provider/model (max 3 attempts)
2. Move to next provider in fallback chain
3. Last resort: lightweight fallback model

Events emitted during fallback:
- `ai.routing.failed` — provider call failed
- `ai.routing.fallback` — switched to secondary provider
- `ai.provider.unavailable` — provider marked unhealthy (30s cooldown)

## Load Balancing

| Strategy | Description |
|---|---|
| `roundRobin` | Cycles through providers evenly |
| `latencyBased` | Selects provider with best historical latency |
| `costBased` | Selects provider with lowest average cost |
| `hybrid` | Composite score: health + cost + fairness |

## Response Format

All providers normalize responses to:

```json
{
  "text": "Generated response text",
  "model": "gpt-4",
  "provider": "openai",
  "usage": {
    "inputTokens": 45,
    "outputTokens": 120
  },
  "latency": 1234,
  "streamed": false,
  "chunks": null,
  "simulated": false
}
```

## Streaming Support

All providers implement `stream(prompt, options)`:

```json
{
  "text": "Full accumulated text",
  "model": "gpt-4",
  "provider": "openai",
  "usage": { "inputTokens": 0, "outputTokens": 0 },
  "latency": 2345,
  "streamed": true,
  "chunks": ["chunk1", "chunk2", "..."]
}
```

## Cost Model

Cost = (inputTokens / 1000) × costPer1kInput + (outputTokens / 1000) × costPer1kOutput

Token estimation uses: `0.25 × characters + 0.25 × words (text)` or `0.75 × characters (code)`.

## Environment Variables

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `OLLAMA_URL` | Ollama server URL (default: http://localhost:11434) |
| `AI_PLANNER` | Set to "off" to disable AI in planner |
| `AI_GENERATOR` | Set to "off" to disable AI in generator |
| `AI_CONTENT` | Set to "off" to disable AI in content engine |

## Simulated Mode

When API keys are not set, all providers return simulated responses prefixed with `[provider-simulated]`. This enables development and testing without real API keys.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/ai/providers` | List available providers and models |
| POST | `/api/v1/ai/generate` | Generate text with AI routing |
| POST | `/api/v1/ai/stream` | Stream AI response |
| GET | `/api/v1/ai/health` | Provider health check |
| GET | `/api/v1/ai/metrics` | Routing metrics |

### POST /api/v1/ai/generate

```json
{
  "prompt": "Build a landing page for a coffee shop",
  "options": {
    "context": "planning",
    "strategy": "quality",
    "systemPrompt": "You are a senior architect"
  }
}
```

### GET /api/v1/ai/providers

```json
{
  "success": true,
  "data": [
    { "name": "openai", "healthy": true, "models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"] },
    { "name": "anthropic", "healthy": true, "models": ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"] }
  ]
}
```

## Integration with Existing Engines

The AI Router is injected into the Planner, Generator, and Content Engine via lightweight wrappers in `lib/ai/integration/`. These wrappers:

- Do NOT modify existing engine code
- Provide AI-enhanced versions as opt-in alternatives
- Maintain full backward compatibility
- Respect `AI_PLANNER`, `AI_GENERATOR`, `AI_CONTENT` env flags

### Planner Integration

```js
const { planProjectWithAI, generatePlanFromPrompt } = require('../ai/integration');
planProjectWithAI(planIR); // falls back to original if AI disabled
```

### Generator Integration

```js
const { generateWebsiteWithAI, enhanceWithAI } = require('../ai/integration');
const result = await enhanceWithAI(website); // AI-improved code
```

### Content Integration

```js
const { generateContentWithAI, enhanceContentWithAI } = require('../ai/integration');
const enhanced = await enhanceContentWithAI(contentPack, { enhanceCopy: true });
```

## Testing

Tests cover:

- Provider mocking (all 4 providers)
- Routing decisions (quality, cost, latency, hybrid)
- Fallback scenarios (primary failure, chain exhaustion)
- Load balancing (round-robin, cost, latency, hybrid)
- Normalization (API responses, strings, streamed chunks)
- Token estimation (text, messages, cost calculation)
- Integration wrappers (function exports)
