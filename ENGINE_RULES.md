# Engine Rules — AI Pipeline & Behavior Governance

> **Note**: This document defines the behavior rules for the Agent Pack project generation pipeline. The contact/brief email system (`api/sendBrief`, `api/sendContact`) operates independently and is documented in `ARCHITECTURE.md`.

## Pipeline Overview

The Agent Pack pipeline is defined in `ARCHITECTURE.md` (Engine Overview → Pipeline Flow). This file documents the detailed behavior rules for each engine in that pipeline.

## Plan Engine

### Input → Output
- **Input**: Prompt Maestro JSON (14 sections: business, audience, objectives, brand, content, features, tech, SEO, UX, copy, integrations, timeline, budget, extras)
- **Output**: Semantic IR JSON with 8 categories: project_meta, pages, components, data_models, routes, design_tokens, seo_config, deployment_config

### Rules
- All 14 sections must be present in input; missing sections default to empty object
- Section-to-category mapping by prefix: `biz_*` → `project_meta`, `obj_*` → `pages`, `brand_*` → `design_tokens`, etc.
- IR output must be valid JSON; parse failure aborts pipeline with `PLAN_FAILED`
- Language detection: if `lang` field is `"es"`, all generated content uses Spanish; otherwise English

## Design System Engine

### Token Generation
- Extracts `branding_colors` object OR `brand_colores` string from formData
- Generates CSS custom properties: `--primary`, `--secondary`, `--accent`, `--bg`, `--text`, `--font-sans`, `--font-mono`
- Falls back to defaults (`#00D4FF`, `#0a0a0a`, `#ffffff`) when brand colors are missing
- Typography: Inter (sans-serif) + Space Grotesk (headings) from Google Fonts

### Rules
- All generated CSS uses the project's design tokens — no hardcoded colors
- Dark theme is default; light theme is optional via CSS media query
- Responsive breakpoints: 900px (tablet), 600px (mobile), mobile-first

## Preview Engine

### Simulation
- Generates an interactive visual preview combining scaffold output + design tokens
- Preview is available at: `GET /api/v1/projects/:id/preview` with format selection (JSON, HTML, CSS)
- Preview versioning: max 10 versions per project, auto-cleanup on 11th

### Rules
- Preview must be approved before scaffold output can be deployed
- Preview failure (`PREVIEW_FAILED`) blocks the pipeline — requires manual retry
- Preview includes: homepage layout, color scheme, typography samples, component mockups

## Decision Engine

### 5-Dimension Scoring

| Dimension | Weight | Description |
|---|---|---|
| **Contrast** | 25% | Visual hierarchy, color contrast, readability |
| **UX** | 25% | Navigation flow, information architecture, usability |
| **Conversion** | 20% | Call-to-action placement, funnel optimization, lead capture |
| **Clarity** | 15% | Messaging, value proposition, content structure |
| **SEO** | 15% | Meta tags, semantic HTML, heading structure, alt text |

### Scoring Rules
- Each dimension scored 0–100 independently
- Final score = weighted average of all 5 dimensions
- **PASS** (≥75): Pipeline proceeds to next stage
- **WARN** (50–74): Pipeline proceeds but decision record includes improvement notes
- **FAIL** (<50): Pipeline blocks; automatic regeneration triggers (up to 2 retries)

### Regeneration Rules
- On FAIL: engine regenerates the output with scoring feedback injected as context
- Max 2 regeneration attempts per pipeline run
- After 2 FAILs: pipeline transitions to `FAILED` state, admin notification sent
- Regeneration preserves user inputs — only engine output is modified

### Decision Records
- Every scoring event is recorded to `data/decisions.json` with:
  - `projectId`, `executionId`, `timestamp`
  - Per-dimension scores + total
  - `decision` (PASS / WARN / FAIL)
  - `regenerationAttempt` (0, 1, 2)
  - `warnings[]` — array of improvement suggestions

## State Machine

### States & Transitions

```
                    ┌──────────┐
                    │  DRAFT   │
                    └────┬─────┘
                         │ plan
                    ┌────▼─────┐
                    │PROCESSING│
                    └────┬─────┘
                         │ preview
                    ┌────▼─────┐
                    │  PREVIEW │◄──────────────┐
                    └────┬─────┘               │
                         │ approve             │ fail < 50
                    ┌────▼──────┐              │
                    │ APPROVED  │              │
                    └────┬──────┘              │
                         │ deploy              │
                    ┌────▼──────┐              │
                    │ DEPLOYING │──────────────┤
                    └────┬──────┘  fail        │
                         │ success             │
                    ┌────▼─────┐               │
                    │ DEPLOYED │───────────────┘
                    └──────────┘  fail
                         │
                    ┌────▼─────┐
                    │  FAILED  │ (terminal)
                    └──────────┘
                    ┌──────────┐
                    │ REJECTED │ (terminal — manual)
                    └──────────┘
```

### Transition Rules
- Valid transitions: `draft→processing→preview→approved→deploying→deployed`
- FAILED is reachable from any non-terminal state
- REJECTED is manual (admin action) — only from PREVIEW or APPROVED
- Automatic rollback on pipeline failure: reverts to previous stable state
- Rollback preserves decision records and preview versions

## Validation Rules

### AI Output Validation
| Check | Rule | Action on failure |
|---|---|---|
| JSON validity | All IR must be valid JSON | Abort with `PLAN_FAILED` |
| Required fields | Each category must have required fields | Inject defaults, log WARN |
| Color format | All colors must be hex (`#RRGGBB`) | Reject with `DESIGN_INVALID` |
| Token count | Generated HTML must not exceed 500KB | Reject with `SIZE_EXCEEDED` |
| Link validity | All internal links must use relative paths | Rewrite automatically |
| SEO completeness | Title, description, h1 required | Inject defaults, log WARN |

### Business Logic for Approvals
- Approval transitions PREVIEW → APPROVED; triggers Scaffold + Deploy
- Approval requires at least WARN score (≥50) — FAIL score blocks approval
- Approval is idempotent: approving an already-approved project is a no-op
- Admin can force-approve a FAIL-scored project (bypasses scoring gate)

## Pipeline Execution Rules

### Timeouts
- Pipeline step timeout: 120s per step
- Total pipeline timeout: 600s (10 minutes)
- Retry on timeout: up to 2 retries with 5s backoff

### Concurrency
- Pipeline execution is serial per project (no concurrent runs)
- Multiple projects can execute in parallel (no global lock)
- Deployment step has external concurrency limit: 1 simultaneous GitHub push
