# Question Generator Engine — Phase 7.3.3

## Overview

The Question Generator Engine detects missing information from user intent and conversation context, then generates intelligent, prioritized follow-up questions. It asks only what is necessary — 2–4 critical gaps — rather than overwhelming the user with a generic form.

> "I already understand your website. I just need to fill 2–4 critical gaps before I build it."

## Architecture

```
User message
    ↓
Intent Detection (Phase 7.3.2)
    ↓
Question Generator (Phase 7.3.3) ← NEW
    ├── questionTemplates.js  → intent → field mappings
    ├── questionMapper.js     → detect missing fields from context
    ├── questionScorer.js     → score by impact/relevance/weight
    ├── questionPrioritizer.js → sort blocking → high-impact → optional
    ├── questionValidator.js  → validate question objects
    └── questionGenerator.js  → orchestrator
    ↓
Conversation Context Update
    ↓
UI renders follow-up questions
```

## Module Responsibilities

| Module | File | Purpose |
|---|---|---|
| **Generator** | `questionGenerator.js` | Orchestrates mapping → scoring → prioritization → output |
| **Prioritizer** | `questionPrioritizer.js` | Sorts by priority level (1→2→3), then by score descending |
| **Templates** | `questionTemplates.js` | 8 intent-specific question maps + generic questions |
| **Mapper** | `questionMapper.js` | Compares context variables + entities against template requirements |
| **Scorer** | `questionScorer.js` | 4-dimension scoring: impact, relevance, dependency, downstream |
| **Validator** | `questionValidator.js` | Validates question object structure, types, options |

## Priority System

| Priority | Label | Score Range | Meaning |
|---|---|---|---|
| 1 | Blocking | 8–10 | Required for generation — cannot proceed without |
| 2 | High Impact | 5–7 | Significantly improves quality |
| 3 | Optional | 1–4 | Nice-to-have enhancement |

## Scoring System

Each question receives a score across 4 dimensions:

| Dimension | Weight | Description |
|---|---|---|
| `impact_on_generation` | 35% | Does this field block the pipeline? |
| `intent_relevance` | 30% | How relevant is this field to the detected intent? |
| `missing_dependency_weight` | 20% | How many downstream modules depend on this? |
| `downstream_importance` | 15% | What pipeline stages consume this field? |

**Formula**: `total = impact * 0.35 + relevance * 0.30 + dependency * 0.20 + downstream * 0.15`

### Field Dependency Weights

| Weight | Fields |
|---|---|
| 10 | business_name, store_name, product_name, blog_name, website_name, your_name |
| 8 | location, service_type, cuisine_type, product_type, core_functionality, profession, topic, target_user |
| 6 | pricing_model, payment_system, booking_system |
| 5 | color_palette, logo_status |
| 2 | dark_mode, social_share, newsletter |

## Intent → Question Mappings

### restaurant_website
**Required**: business_name, location, cuisine_type
**Optional**: reservation_system, menu_style, tone, online_ordering, delivery_available

### ecommerce_store
**Required**: store_name, product_type
**Optional**: payment_system, shipping_regions, inventory_type, currency, reviews_enabled

### saas_platform
**Required**: product_name, core_functionality, target_user
**Optional**: pricing_model, auth_system, integrations, team_collaboration, dark_mode

### portfolio_site
**Required**: your_name, profession
**Optional**: portfolio_type, dark_mode, contact_form, social_links

### blog_website
**Required**: blog_name, topic
**Optional**: newsletter, comments_enabled, categories, social_share

### landing_page
**Required**: product_name
**Optional**: value_proposition, cta_type, video_enabled, testimonials

### service_business
**Required**: business_name, service_type
**Optional**: booking_system, service_area, pricing_tiers, team_members

### default
**Required**: website_name
**Optional**: website_purpose, color_preference, dark_mode

### Generic (applied to all intents)
- color_palette (priority 3)
- logo_status (priority 3)

## Missing Field Detection

The mapper checks these sources for existing data:

1. **contextVariables** — already collected in conversation
2. **detectedEntities** — entities extracted by intent detection
3. **answeredQuestions** — questions the user has already answered
4. **pendingQuestions** — questions already in the queue

Fields present in any source are excluded from generated questions.

## Output Format

```json
{
  "conversationId": "conv-abc123",
  "intentType": "restaurant_website",
  "intentLabel": "Restaurant Website",
  "primaryQuestions": [
    {
      "id": "q1",
      "question": "Where is your business located?",
      "type": "text",
      "priority": 1,
      "required": true,
      "reason": "Needed for location display and local SEO"
    }
  ],
  "optionalQuestions": [
    {
      "id": "q2",
      "question": "Do you want online reservations?",
      "type": "boolean",
      "priority": 3,
      "required": false,
      "reason": "Adds booking widget"
    }
  ],
  "missingFields": ["location", "cuisine_type", "reservation_system"],
  "generatedAt": "2026-06-19T00:00:00.000Z"
}
```

## Question Types

| Type | Description | Options Required |
|---|---|---|
| `text` | Free text input | No |
| `choice` | Single selection | Yes |
| `multi_choice` | Multiple selection | Yes |
| `boolean` | Yes/No toggle | No |
| `scale` | 1–5 rating | No (min/max) |
| `upload` | File upload (placeholder) | No |

## Test Cases

### Case 1: Coffee Shop
**Input**: `"I want a coffee shop called Salmos Café"`
**Context**: `{ business_name: "Salmos Café" }`
**Output**:
- Required: location, cuisine_type
- Optional: menu_style, color_palette, logo_status, reservation_system, tone, online_ordering, delivery_available

### Case 2: SaaS Platform
**Input**: `"Build me a SaaS for project management"`
**Context**: `{}`
**Output**:
- Required: product_name, target_user, core_functionality
- Optional: pricing_model, auth_system, integrations, team_collaboration, dark_mode, color_palette, logo_status

### Case 3: Portfolio
**Input**: `"I want a portfolio site"`
**Context**: `{ your_name: "John Doe" }` + answeredQuestions: ["profession"]
**Output**:
- Required: (none — all blockers satisfied)
- Optional: portfolio_type, dark_mode, contact_form, social_links, color_palette, logo_status

## Integration with Conversation Engine

### Event
The generator emits `conversation.questions.generated`:

```json
{
  "type": "conversation.questions.generated",
  "conversationId": "conv-xxx",
  "data": { "questionsCount": 5, "requiredCount": 2, "intentType": "restaurant_website" }
}
```

### Context Update
The generator integrates with `conversationContext`:
- `recordQuestionHistory()` — stores each generation round
- `pendingQuestions` — populated with generated questions
- `answeredQuestions` — checked during missing-field detection

### Conversation Flow

```
User message
   ↓
Conversation Memory (append)
   ↓
Intent Detection (Phase 7.3.2)
   ↓
Question Generator (Phase 7.3.3) ← this
   ↓
Conversation Context Update
   ↓
UI renders follow-up questions
   ↓
User answers → repeat
```

## Future: Context Builder (Phase 7.3.4)

Once all blocking questions are answered, the Context Builder will:
1. Aggregate all conversation data
2. Generate Plan IR
3. Generate Blueprint
4. Generate Design Strategy
5. Generate Content Strategy

This is where the system becomes a full AI website designer.
