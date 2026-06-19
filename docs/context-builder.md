# Context Builder Engine — Phase 7.3.4

## Overview

The Context Builder transforms a complete conversation into a canonical **Project Context** object. It merges user answers, inferred information, entities, defaults, conversation history, and assets into one structure that feeds directly into the Planner.

> Nothing downstream should need to inspect raw conversation messages.

## Architecture

```
Conversation (Phase 7.3.1)
    ↓
Intent Detection (Phase 7.3.2)
    ↓
Question Generator (Phase 7.3.3)
    ↓
Context Builder (Phase 7.3.4) ← NEW
    ├── contextHistory.js      → load conversation, extract answers
    ├── contextEntities.js     → regex entity extraction from messages
    ├── contextNormalizer.js   → phone, email, URL, color, currency normalization
    ├── contextInference.js    → infer brand_name, features from patterns
    ├── contextDefaults.js     → 8 intent-specific default profiles
    ├── contextMerger.js       → merge sources: answers > inferences > defaults
    ├── contextAssets.js       → process uploaded asset references
    ├── contextValidator.js    → validate structure, emit ContextValidationError
    ├── contextSerializer.js   → serialize to JSON, convert to Plan IR format
    ├── contextEvents.js       → emit context.built / validation.failed events
    └── contextBuilder.js      → orchestrator (pipeline of all above)
    ↓
Project Context (canonical object)
    ├── project
    ├── pages
    ├── settings
    ├── audience
    ├── entities
    ├── assets
    ├── conversations
    └── metadata
```

## Module Responsibilities

| Module | File | Purpose |
|---|---|---|
| **Builder** | `contextBuilder.js` | Orchestrates the full pipeline: load → extract → normalize → infer → merge defaults → validate → serialize → return |
| **History** | `contextHistory.js` | Loads conversation from `conversationManager`, extracts answers + entities + project info |
| **Entities** | `contextEntities.js` | Regex extraction of emails, phones, URLs, amounts from raw messages |
| **Normalizer** | `contextNormalizer.js` | Normalizes phone numbers (`+1` prefix), emails (lowercase), URLs (`https://`), colors (name→hex), currency, language |
| **Inference** | `contextInference.js` | Infers brand_name, food_ordering, has_catalog, has_dashboard, etc. from known values |
| **Defaults** | `contextDefaults.js` | 8 intent-specific default profiles (restaurant, ecommerce, saas, portfolio, blog, landing, service, generic) |
| **Merger** | `contextMerger.js` | Merges multiple sources with priority: base < inferences < answers < defaults (last wins) |
| **Assets** | `contextAssets.js` | Processes uploaded assets, infers type from extension |
| **Validator** | `contextValidator.js` | Validates structure: intentType, project name, pages, data types — throws `ContextValidationError` |
| **Serializer** | `contextSerializer.js` | JSON serialize/deserialize + `toPlanIR()` conversion to the Planner's input format |
| **Events** | `contextEvents.js` | EventEmitter: `context.built`, `context.normalized`, `context.validation.failed` |
| **Error** | `errors/ContextValidationError.js` | Custom error with details object |

## Pipeline

```
buildContext(conversationId)
    │
    ├── 1. Load conversation (contextHistory.loadConversation)
    │
    ├── 2. Extract answers + entities (contextHistory.extractAnswers)
    │      ├── contextVariables from session
    │      ├── detectedEntities from session
    │      ├── answered/pending questions
    │      └── key-value pairs from messages (email, phone, URL regex)
    │
    ├── 3. Build raw context (contextBuilder)
    │      ├── project section (name, brand_name, tagline, target_user)
    │      ├── pages section (common + intent-specific + feature-derived)
    │      ├── settings section (all answers mapped)
    │      ├── entities section (session + message-extracted, deduplicated)
    │      └── assets section (from options)
    │
    ├── 4. Normalize (contextNormalizer.normalizeContext)
    │      ├── phone → +1XXXXXXXXXX
    │      ├── email → lowercase
    │      ├── URL → https:// prefix
    │      ├── color → #hex
    │      └── whitespace trimmed
    │
    ├── 5. Infer (contextInference.inferValues)
    │      ├── brand_name from business_name/store_name/product_name
    │      ├── food_ordering from cuisine_type (restaurant)
    │      ├── has_catalog from product_type (ecommerce)
    │      └── intent-specific pattern rules
    │
    ├── 6. Apply defaults (contextDefaults.applyDefaults)
    │      ├── Fills missing settings with intent-appropriate values
    │      └── Example: restaurant → tone='casual_warm', menu_style='categorized'
    │
    ├── 7. Validate (contextValidator.validateContext)
    │      ├── Checks intentType, project name, pages
    │      └── Non-strict mode: logs errors but returns context
    │
    ├── 8. Convert to Plan IR (contextSerializer.toPlanIR)
    │      └── Maps context → Plan IR format for the Planner engine
    │
    └── 9. Return result
           ├── success: true/false
           ├── context: canonical Project Context
           ├── planIR: Plan IR format
           ├── serialized: JSON string
           └── validation: { valid, errors }
```

## Output: Project Context Schema

```json
{
  "conversationId": "conv-abc123",
  "intentType": "restaurant_website",
  "project": {
    "name": "Salmos Café",
    "brand_name": "Salmos Café",
    "tagline": "",
    "target_user": "",
    "projectId": "prj-xxx",
    "workspaceId": "ws-yyy"
  },
  "audience": {
    "description": "coffee shop customers in San Diego",
    "target": "local coffee lovers",
    "problems": [],
    "motivations": []
  },
  "pages": [
    { "title": "Home", "type": "home", "priority": 1 },
    { "title": "About", "type": "about", "priority": 2 },
    { "title": "Contact", "type": "contact", "priority": 2 },
    { "title": "Menu", "type": "menu", "priority": 1 }
  ],
  "settings": {
    "tone": "casual_warm",
    "color_palette": "warm_neutrals",
    "dark_mode": false,
    "language": "en",
    "currency": "usd",
    "cuisine_type": "coffee",
    "menu_style": "categorized",
    "online_ordering": true,
    "reservation_system": false,
    "delivery_available": true
  },
  "entities": [
    { "type": "business_name", "value": "Salmos Café", "source": "session" },
    { "type": "location", "value": "San Diego", "source": "session" }
  ],
  "assets": [],
  "conversations": {
    "messageCount": 5,
    "answeredQuestions": 0,
    "pendingQuestions": 0
  },
  "metadata": {
    "builtAt": "2026-06-19T10:00:00.000Z",
    "version": "1.0.0"
  }
}
```

## Page Derivation

Base pages (all intent types): **Home, About, Contact**

Intent-specific additions:

| Intent | Added Pages |
|---|---|
| restaurant_website | Menu |
| ecommerce_store | Shop, Cart, Checkout |
| saas_platform | Features, Pricing |
| portfolio_site | Portfolio |
| blog_website | Blog |
| landing_page | (none) |
| service_business | Services |

Feature-derived additions (based on answers):
- `booking_system = true` → Book page
- `online_ordering = true` → Order page

## Normalization Rules

| Field | Rule | Example |
|---|---|---|
| phone | Strip non-digits, +1 prefix for 10-digit | `(619) 555-1234` → `+16195551234` |
| email | Lowercase trim | `John@Example.COM` → `john@example.com` |
| url | Add https:// if missing | `mysite.com` → `https://mysite.com` |
| color | Name → hex | `red` → `#ef4444`, `navy` → `#1e3a5f` |
| currency | Slug normalize | `dollars` → `usd`, `euros` → `eur` |
| language | IETF tag normalize | `english` → `en`, `spanish` → `es` |

## Inference Rules

| Trigger | Inferred Values |
|---|---|
| `business_name` known | `brand_name = business_name` |
| `store_name` known | `brand_name = store_name` |
| `product_name` known | `brand_name = product_name` |
| `cuisine_type` known (restaurant) | `food_ordering = true` |
| `product_type` known (ecommerce) | `has_catalog = true` |
| `core_functionality` known (saas) | `has_dashboard = true`, `has_auth = true` |
| `profession` + `your_name` known (portfolio) | `brand_name = "John — Developer"` |
| `booking_system = true` (service) | `has_booking = true` |

## Default Profiles

| Intent | tone | dark_mode | currency | color_palette |
|---|---|---|---|---|
| restaurant_website | casual_warm | false | usd | warm_neutrals |
| ecommerce_store | (none) | true | usd | clean_white |
| saas_platform | (none) | true | (none) | modern_blue |
| portfolio_site | (none) | true | (none) | minimal_gray |
| blog_website | (none) | true | (none) | clean_white |
| landing_page | (none) | false | (none) | modern_blue |
| service_business | (none) | true | (none) | professional_navy |

## Event Flow

| Event | Trigger | Payload |
|---|---|---|
| `context.normalized` | After normalization step | `{ conversationId, intentType }` |
| `context.validation.failed` | Validation errors found | `{ conversationId, errors[] }` |
| `context.built` | Successful build | `{ conversationId, intentType, messageCount, pages }` |

## Integration

### With Conversation Engine
- Reads `conversationManager.loadConversation()` to get all messages + session data
- Reads `conversationContext.contextVariables` for structured answers
- Reads `conversationContext.detectedEntities` for known entities

### With Planner (Phase 2)
- Outputs `planIR` in the exact format the Planner expects:
  - `planIR.project` → Planner's project info
  - `planIR.structure.pages` → Planner's page list
  - `planIR.tone` → Planner's design strategy input
  - `planIR.features` → Planner's feature flags
  - `planIR.design` → Planner's design system input

### With Dashboard
- `buildContext(conversationId)` called from a future API endpoint or webhook
- Status events visible via EventEmitter subscription

## Error Handling

`ContextValidationError` (from `errors/ContextValidationError.js`):
- Thrown on: missing intentType, missing project name, invalid pages, type mismatches
- Contains `details` object with field path for precise error location
- Non-strict mode: returns context with `validation.errors` array instead of throwing
