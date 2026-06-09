# Scoring Engine Audit Report

## Executive Summary

**Score 53.75 is a legitimate computed value**, not a hardcoded constant. However, all 9 executions in the production database producing the *identical* score reveals a systemic bottleneck: **the Plan Engine cannot parse JSON-formatted `prompt_maestro`**, causing every project to score against effectively empty plan data.

## Scoring Flow Diagram

```
formData (JSON object)
  │
  ├── promptText = JSON.stringify(formData)  ← [line 281]
  │     │
  │     ├──→ plan.compile(promptText)        ← [line 291]
  │     │     └── parseSections() expects "## N. NAME\n**key:** value"
  │     │           JSON has no "## N." markers → returns {} 
  │     │           → ALL plan IR fields = null/[]
  │     │           → stepResults.plan.project = { identity: {}, structure: {}, ... }
  │     │
  │     └──→ stepResults.plan feeds:
  │             evaluateUX(planIr)     → base 60, nothing to add
  │             evaluateConversion()   → base 50, nothing to add
  │             evaluateClarity()      → base 50, nothing to add
  │             evaluateSEO()          → base 50, nothing to add
  │
  ├── extractBrandingColors(formData)        ← [line 306]
  │     └── Checks formData.branding_colors OR formData.brand_colores (regex)
  │           If neither exists → returns null → buildDesignSystem({primary:null,...})
  │
  ├── ds.buildDesignSystem(colors)           ← [line 308]
  │     └── No primary → computeTheme fallback: bg=#0B0F19, text=#F3F4F6
  │           → sem.primary = '#F3F4F6' (fallback)
  │           → evaluateContrast: base 70 + 15 (high bg/text contrast) + 5 (primary fallback) = 90
  │
  └── preview.generatePreview(planIr, ds)    ← [line 326]
        └── generateWarnings():
              !colors.primary → HIGH severity warning  ← WHEN no color extraction
              !pages.length   → MEDIUM warning
              no biz_name     → LOW warning
              → highWarnings = 1 → penalty: totalScore - 10

SCORING (lines 353-373):
  metrics = {
    contrast:    { score: 90, weight: 0.25 },  // from evaluateContrast
    ux:          { score: 65, weight: 0.25 },  // base 60 + 5 (hero section always present)
    conversion:  { score: 50, weight: 0.20 },  // base 50, nothing parsed
    clarity:     { score: 50, weight: 0.15 },  // base 50, nothing parsed
    seo:         { score: 50, weight: 0.15 },  // base 50, nothing parsed
  }

  totalScore = ∑(score × weight)
             = 90×0.25 + 65×0.25 + 50×0.20 + 50×0.15 + 50×0.15
             = 22.5 + 16.25 + 10.0 + 7.5 + 7.5
             = 63.75
             
  highWarnings.length = 1 (missing primary color)
  totalScore = Math.max(0, 63.75 - 1×10) = 53.75
```

## All Scoring Inputs

| Input | Source | Data Path | Status |
|---|---|---|---|
| `planIr.project.identity` | `plan.compile()` | From `## 1. NEGOCIO` / `## 5. BRANDING` / `## 14. ESENCIA` sections | **BROKEN** — `prompt_maestro` is JSON, not sections format |
| `planIr.project.structure` | `plan.compile()` | From `## 8. ARQUITECTURA` sections | **BROKEN** — same reason |
| `planIr.project.conversion` | `plan.compile()` | From `## 13. CONVERSIÓN` sections | **BROKEN** — same reason |
| `planIr.project.content` | `plan.compile()` | From `## 9. CONTENIDO` / `## 7. PRODUCTOS` sections | **BROKEN** — same reason |
| `planIr.project.seo` | `plan.compile()` | From `## 12. SEO` sections | **BROKEN** — same reason |
| `dsResult.tokens.semantic` | `ds.buildDesignSystem()` | From `extractBrandingColors()` which reads `brand_colores` / `branding_colors` | **PARTIAL** — works when exact key+format match, fails on any other color field |
| `previewResult.warnings` | `preview.generatePreview()` | From `generateWarnings()` which checks DS tokens + plan IR | **DETERMINISTIC** — warnings are a function of inputs |

## Hardcoded Values Found

| Location | Value | Purpose |
|---|---|---|
| `evaluateContrast` base | 70 | Starting score before adjustments |
| `evaluateContrast: cr >= 7` | +15 | High contrast bonus |
| `evaluateContrast: cr >= 4.5` | +5 | Medium contrast bonus |
| `evaluateContrast: cr >= 3` | -10 | Low contrast penalty |
| `evaluateContrast: else` | -25 | Very low contrast penalty |
| `evaluateContrast: primary` | +5 | Having a primary color |
| `evaluateContrast: palette > 6` | -10 | Too many palette colors |
| `evaluateContrast: fallback` | 50 | Returned when no DS tokens |
| `evaluateUX` base | 60 | Starting score |
| `evaluateUX: business_name` | +10 | Having a business name |
| `evaluateUX: tagline/mission` | +5 | Having tagline or mission |
| `evaluateUX: pages` | +min(15, n*3) | Up to +15 for pages |
| `evaluateUX: main_conversion` | +5 | Having main conversion goal |
| `evaluateUX: hero section` | +5 | Preview has hero section |
| `evaluateUX: contact section` | +5 | Preview has contact section |
| `evaluateConversion` base | 50 | Starting score |
| `evaluateConversion: main_cta` | +15 | Having a primary CTA |
| `evaluateConversion: lead_magnet` | +10 | Having lead magnet |
| `evaluateConversion: follow_up` | +5 | Having follow-up |
| `evaluateConversion: main_goal` | +10 | Having main goal |
| `evaluateConversion: structureHasCTA` | +10 | Plan IR has CTA |
| `evaluateClarity` base | 50 | Starting score |
| `evaluateClarity: business_name` | +10 | Having business name |
| `evaluateClarity: tagline` | +10 | Having tagline |
| `evaluateClarity: mission/story` | +10 | Having mission or story |
| `evaluateClarity: service_list/flagship` | +10 | Having services |
| `evaluateClarity: ideal_client` | +5 | Having ideal client |
| `evaluateClarity: values` | +5 | Having values |
| `evaluateSEO` base | 50 | Starting score |
| `evaluateSEO: keywords >=3` | +15 | 3+ SEO keywords |
| `evaluateSEO: keywords >0` | +5 | 1-2 keywords |
| `evaluateSEO: locations` | +10 | Having geo locations |
| `evaluateSEO: content_strategy` | +10 | Having content strategy |
| `evaluateSEO: pages >=3` | +10 | Having 3+ pages |
| `evaluateSEO: kpis` | +5 | Having KPIs |
| `weights` | 0.25, 0.25, 0.20, 0.15, 0.15 | Dimension weights |
| `Math.round(... * 100) / 100` | — | 2-decimal rounding |
| `passed` threshold | >= 50 | Passing score |
| `high warning penalty` | -10 per high warning | Deduction for severe warnings |

**No constant equal to 53.75 exists anywhere in the codebase.** The only occurrence is in `docs/architecture/execution-vs-project-separation.md:91` as an example in a comment.

## Score Variability Test Results

| Test Case | Input Highlights | Score | Passed |
|---|---|---|---|
| Minimal `{colors, cta}` | No `brand_colores`, no sections | **53.75** | true |
| With `brand_colores` | `#529fb3` extracted, no sections | **63.75** | true |
| Full Salmos `test-data.json` | `brand_colores` present, no sections | **63.75** | true |

**Unique scores: 2** — The 10-point gap is entirely the high-warning penalty for missing primary color. The 63.75 from test 2 vs 3 are identical because the plan IR is empty in both cases (JSON input), and both have `brand_colores` present.

## Root Cause Analysis

### Direct Cause of Identical Scores

**`prompt_maestro` stores `JSON.stringify(formData)` instead of compiled Prompt Maestro text.** Line 170:
```javascript
prompt_maestro: formData ? JSON.stringify(formData) : null
```
This stores raw JSON. When `runPipeline` reads it (or when formData is re-stringified on first run, line 281), the Plan Engine receives a JSON string that `parseSections()` cannot parse — it expects `## N. NAME` section markers.

**Result:** All 4 plan-dependent scoring functions (`evaluateUX`, `evaluateConversion`, `evaluateClarity`, `evaluateSEO`) always receive empty/null inputs, returning only their base scores (60, 50, 50, 50). Only `evaluateContrast` (which depends on design system tokens) and warning penalties show variation.

### Why 53.75 Specifically

```
contrast  (90 × 0.25) = 22.50
ux        (65 × 0.25) = 16.25    ← base 60 + 5 (hero section always generated)
conversion(50 × 0.20) = 10.00
clarity   (50 × 0.15) =  7.50
seo       (50 × 0.15) =  7.50
                         -----
Weighted total        = 63.75
High warning penalty  = -10.00   ← missing primary color
                         -----
Final score           = 53.75
```

The `+5` in UX comes from the preview engine always generating a `hero` section type when no pages are defined. This is the ONLY dynamic input affecting plan-dependent scores.

### Why All 9 DB Decisions Show 53.75

1. **Test harness** (`test-runtime-full.js`) passes `formData: { colors, cta }` — no `brand_colores` → no color extraction → high warning → -10 penalty
2. **Seed project** (`scripts/seed-test.js`) creates project with `prompt_maestro: null` → JSON fallback → same empty IR
3. **Re-runs** pass `formData: null` → `project.prompt_maestro` used (JSON) → same empty IR
4. **Salmos test projects** use minified formData without `brand_colores` key → no color extraction → same 53.75

### Architectural Issue

The pipeline stores the *source form data* as `prompt_maestro`, but the Plan Engine expects the *compiled brief* (formatted sections). The `lib/compiler/` module (Unified Brief Compiler) exists to convert formData → compiled sections, but it is never called in the `createProject` → `runPipeline` flow. The prompt text flows directly to `plan.compile()` without preprocessing.

## Scoring Engine Health Assessment

| Metric | Status |
|---|---|
| **Default/fallback values** | Present (all scoring functions return 50 when inputs are null) — healthy |
| **Hardcoded constants** | 20+ constants (weights, base scores, bonuses, penalties) — normal for a heuristic engine |
| **53.75 as a magic number** | ❌ False alarm — it's a computed result, not a constant |
| **Input sensitivity** | ❌ Broken — plan-dependent scoring never sees real data |
| **Determinism** | ✅ Perfect — same input always produces same score |
| **Warning penalty balance** | ✅ Reasonable — -10 for high warnings, proportional to max 100 score |
| **Dimension weight distribution** | ✅ Balanced — contrast+UX (50%) > conversion+clarity+SEO (50%) |

## Summary

**53.75 is a legitimate computed value** — it falls out of the scoring math when plan-derived inputs are all empty/null. The bug is not in the scoring engine itself but in the **data pipeline that feeds it**: `prompt_maestro` stores JSON, the Plan Engine can't parse JSON, so all plan-dependent dimensions always return base scores. Only the contrast dimension and warning penalties show variation based on color extraction.

### Scoring Flow (text)

```
formData (JSON)
  │
  ├── promptText = JSON.stringify(formData)
  │     └── plan.compile() → can't parse JSON → empty plan IR
  │           └── evaluateUX()    → 65  (60 base + 5 hero section)
  │           └── evaluateConversion() → 50
  │           └── evaluateClarity()    → 50
  │           └── evaluateSEO()        → 50
  │
  ├── extractBrandingColors(formData)
  │     └── brand_colores present? → YES → primary=#529fb3 → NO high warning → keep 63.75
  │     └── brand_colores missing? → null → HIGH warning → -10 → 53.75
  │
  └── evaluateContrast(dsResult)
        └── 90 (70 base + 15 high contrast + 5 primary fallback)
              * 0.25 weight = 22.5

Score without penalty:   63.75
Score with -10 penalty:  53.75
```
