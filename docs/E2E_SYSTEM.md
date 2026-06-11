# E2E Testing System — runBriefE2E / runBriefE2EConsole

## Overview

The E2E testing system is a global JavaScript module that can submit test briefs to `/api/sendBrief` from any page — without requiring the Brief Maestro wizard UI or any DOM state.

It is loaded automatically via `<script defer>` on all three public pages: `index.html`, `brief-maestro.html`, and `dashboard-logs.html`.

## Global Functions

All functions are exposed on `window`:

```js
buildSendBriefPayload(opts)       // Unified payload builder (single source of truth)
runBriefE2E(mode, contactInfo, dataOverride)
runBriefE2EConsole(data)
ensureE2E()
```

---

## buildSendBriefPayload(opts) — Unified Payload Builder

Single source of truth for all `/api/sendBrief` payloads. Used by `submitContact()` (wizard), `runBriefE2E(2)`, and `runBriefE2EConsole()`.

**Source**: `public/scripts/sendBrief-payload.js` — shared utility, production-grade, zero E2E dependencies.

```js
var payload = window.buildSendBriefPayload({
  name, email, company, phone,
  message,        // Used as prompt if prompt is not provided
  prompt,         // Master prompt string (takes precedence over message)
  formData,       // 14-section form data object
  lang,           // 'es' | 'en' (auto-detects currentLang global)
  source          // Label for debug logs: 'wizard', 'direct-api', 'standalone', 'console'
});
```

### Contract

| Field | Behaviour |
|---|---|
| `name` | Normalized to string, defaults to `''` |
| `email` | Normalized to string, defaults to `''` |
| `company` | Normalized to string, defaults to `''` |
| `phone` | Normalized to string, defaults to `''` |
| `prompt` | Used if provided; falls back to `message` |
| `formData` | Deep-copied (no mutation of source), defaults to `{}` |
| `lang` | Falls back to `window.currentLang`, then to `'es'` |
| `submittedAt` | **Always** set to `Date.now()` — never missing |

### Guarantees

- **Always** includes `submittedAt: Date.now()` (passes timing check)
- **Never** mutates the original `formData` object (deep copy)
- **Always** produces identical shape regardless of calling flow
- Emits `[PAYLOAD:SOURCE]` debug log to console for cross-flow comparison

---

## runBriefE2E(mode, contactInfo?, dataOverride?)

Entry point for all E2E brief submissions.

### Mode 1 — Via submitContact() (DOM required)

```js
runBriefE2E(1)
// Requires: brief-maestro.html, global formData, DOM inputs
```

- Fills `formData` with test data
- Shows contact page (activates `.contact-page` view)
- Sets input fields (`inp-name`, `inp-email`, `inp-company`, `inp-phone`)
- Intercepts `window.fetch` to capture the response
- Calls the real `submitContact()` function from brief-maestro.html

**Only works on `brief-maestro.html`**. Will throw if `formData` is not defined globally.

### Mode 2 — Direct API fetch

```js
runBriefE2E(2)
```

Two sub-paths depending on context:

#### Path A: Wizard context (brief-maestro.html)

If `formData` exists globally:

1. Merges `dataOverride` into global `formData`
2. Calls `generatePrompt()` to build the master prompt
3. Calls `buildSendBriefPayload()` to construct the unified payload
4. Sends `POST /api/sendBrief`

#### Path B: Standalone context (any page)

If `formData` does NOT exist globally:

1. Uses `dataOverride` fields directly — no global variables needed
2. Extracts `dataOverride.prompt` as prompt string (or uses default)
3. Extracts `dataOverride.formData` as the form data object (or empty `{}`)
4. Calls `buildSendBriefPayload()` to construct the unified payload
5. Sends `POST /api/sendBrief`

### Parameters

| Param | Type | Default | Description |
|---|---|---|---|
| `mode` | number | `1` | `1` = submitContact (DOM), `2` = direct API |
| `contactInfo` | object | See below | `{ name, email, company?, phone? }` |
| `dataOverride` | object | TEST_DATA (Salmos Cafe) | Form data or `{ prompt, formData }` |

Default contactInfo:

```js
{
  name: 'Javier Ibrahim',
  email: 'contacto@ejemplo.com',
  company: 'Salmos Cafe',
  phone: '+52 663 150 8119'
}
```

Default dataOverride (TEST_DATA):

```js
{
  biz_name: 'Salmos Cafe',
  obj_principal: 'Generar leads calificados',
  ai_metafora: 'Como el aroma de un buen cafe...',
  // ... 95+ form fields
}
```

### Return Value

Mode 2 returns an object:

```js
{
  response: Response,         // Raw fetch Response
  body: { ... },             // Parsed JSON body
  elapsed: number,           // Round-trip time in ms
  validation: {
    passed: boolean,
    statusOk: boolean,
    hasRequestId: boolean,
    hasSuccess: boolean,
    errors: string[]
  }
}
```

Mode 1 returns `undefined` (synchronous call to `submitContact()`).

---

## runBriefE2EConsole(data)

Console-safe wrapper that works on any page without manual script injection.

```js
runBriefE2EConsole({
  name: 'Test User',
  email: 'test@demo.com',
  company: 'Test Co',
  message: 'E2E test via console'
})
```

### Data Parameter

| Field | Required | Default | Maps to |
|---|---|---|---|
| `name` | No | `'Test User'` | `contactInfo.name` |
| `email` | No | `'test@demo.com'` | `contactInfo.email` |
| `company` | No | `'Test Co'` | `contactInfo.company` |
| `phone` | No | `''` | `contactInfo.phone` |
| `message` | No | `'E2E test submission via console'` | Becomes `prompt` (via builder fallback) |
| `prompt` | No | `null` | Takes precedence over `message` |
| `formData` | No | `{}` | Deep-copied into payload |

### Internal Flow

1. Calls `ensureE2E()` to guarantee the script is loaded
2. Calls `buildSendBriefPayload()` directly with all parameters
3. Calls `_sendPayload()` directly — no routing through `runBriefE2E(2)`
4. Fully self-contained: zero dependency on DOM or global `formData`

---

## ensureE2E()

Auto-repair loader. Ensures the E2E script is loaded before any call.

```js
await window.ensureE2E()
```

- Checks if `window.runBriefE2E` is a function
- If not loaded: creates a `<script>` tag pointing to `/scripts/e2e-brief-bypass-wizard.js`
- Returns promise that resolves when script is loaded
- Safe to call multiple times — returns immediately if already loaded

---

## Test Data

The script embeds two complete test fixtures:

### Salmos Cafe (default, ~95 fields)

Coffee catering business. Full 14-section brief with realistic data for a small service business.

```js
// Used automatically as fallback
var TEST_DATA = { biz_name: 'Salmos Cafe', ... }
```

### Inkognita Agency

Branding agency dataset (available via `load-e2e.js` dynamic loader). Different industry (B2B digital agency), different brand personality.

---

## How Scripts Load

The frontend loads two scripts in a specific order to guarantee production independence:

### Layer separation

```
sendBrief-payload.js   (Shared Utility — always loads first)
e2e-brief-bypass-wizard.js  (Testing Layer — loads second, optional for production)
```

### On all pages

```html
<script src="/scripts/sendBrief-payload.js" defer></script>
<script src="/scripts/e2e-brief-bypass-wizard.js" defer></script>
```

Present on:

- `index.html` — portfolio page
- `brief-maestro.html` — brief wizard
- `dashboard-logs.html` — observability dashboard

### Why this order

1. `sendBrief-payload.js` defines `window.buildSendBriefPayload` — the only production dependency.
2. `e2e-brief-bypass-wizard.js` references `window.buildSendBriefPayload` — if it fails to load, production flows (`submitContact()`) continue working because the payload builder is already on `window`.

The `defer` attribute ensures execution after HTML parsing in declaration order. `sendBrief-payload.js` runs first, then `e2e-brief-bypass-wizard.js`.

### Manual (backward compat via load-e2e.js)

The legacy loader at `public/scripts/load-e2e.js` can still be injected from console:

```js
fetch('/scripts/load-e2e.js').then(r => r.text()).then(eval)
```

This exposes additional helpers:

```js
e2eSalmos()       // Submit Salmos Cafe data
e2eInkognita()    // Submit Inkognita Agency data
e2eCustom({...})  // Submit custom data
```

These helpers are deprecated in favor of `runBriefE2EConsole` but remain available for backward compatibility.

---

## Avoiding DOM Dependencies

The system uses three strategies to avoid DOM dependency:

### 1. Feature Detection at Runtime

```js
var hasFormData = (typeof formData !== 'undefined');
```

- Detects presence of brief-maestro's global state
- Selects wizard path vs standalone path automatically

### 2. Separate Code Paths

| Path | Globals Read | DOM Access |
|---|---|---|
| `runViaSubmitContact` (Mode 1) | `formData`, `submitContact` | `getElementById` |
| `runDirectAPI` (Mode 2, wizard) | `formData`, `generatePrompt`, `currentLang` | None |
| `runDirectAPIStandalone` (Mode 2, standalone) | None | None |

The standalone path reads zero global variables and accesses zero DOM nodes.

### 3. Self-Contained Payload Building via buildSendBriefPayload()

All flows now delegate to `buildSendBriefPayload()`:

```js
// In runDirectAPIStandalone
var payload = buildSendBriefPayload({
  name: contactInfo.name,
  email: contactInfo.email,
  prompt: promptText,
  formData: formDataPayload,
  source: 'standalone'
});
```

The builder normalizes fields, deep-copies formData, and always injects `submittedAt: Date.now()`.

---

## Usage Examples

See `docs/TESTING_GUIDE.md` for runnable examples covering all testing scenarios:
console commands, API tests, lifecycle debugging, and failure mode diagnosis.

---

## Diagnosing INVALID_REQUEST

When `runBriefE2EConsole()` or `runBriefE2E(2)` returns `HTTP 400 { error: 'INVALID_REQUEST' }`, use the request registry to identify which validation failed.

### Step 1 — Capture the requestId

`_sendPayload()` logs the `requestId` on every response:

```
[PASS] requestId: 550e8400-e29b-41d4-a716-446655440000
```

or from the `X-Request-Id` response header.

### Step 2 — Query the registry

```js
// In browser console (after receiving 400):
var id = '550e8400-e29b-41d4-a716-446655440000'; // replace with actual id
fetch('/api/logs?id=' + id).then(r => r.json()).then(console.log)
```

Response:

```json
{
  "requestId": "550e8400-...",
  "status": "rejected",
  "reason": "validation",
  "validationStage": "validatePrompt",
  "validationField": "prompt",
  "validationReason": "Prompt cannot be empty",
  "receivedAt": 1718000000000
}
```

### Validation stages

| `validationStage` | `validationField` | Triggered when |
|---|---|---|
| `timingCheck` | `submittedAt` | Missing, future, or stale timestamp |
| `sanitizeAndValidateName` | `name` | Empty, non-string, or XSS |
| `validateEmail` | `email` | Invalid email format |
| `validatePrompt` | `prompt` | Empty, too short, or too long |

### Persistence across Vercel instances

Validation diagnostics (`validationStage`, `validationField`, `validationReason`) are persisted to Neon's `request_logs` table. This is necessary because `sendBrief.js` and `logs.js` run as separate Vercel function instances — they do not share the in-memory registry. The flow:

```
sendBrief (registerLifecycle with validation fields)
  → memory Map (per-instance, 5min TTL)
  → Neon request_logs (async, fire-and-forget)
    → api/logs reads from Neon → returns full entry including validation fields
```

If the Neon write completes before the logs query, the validation details survive the cold start gap. If not, the registry falls back to Redis (if configured) or returns only the in-memory entry (same-instance).

### PowerShell equivalent
  -Method POST -ContentType "application/json" `
  -Body (@{ name="Test"; email="t@t.com" } | ConvertTo-Json)

$requestId = ($response.Content | ConvertFrom-Json).requestId
Write-Host "requestId: $requestId"

$status = Invoke-RestMethod -Uri "https://web-portfolio-kappa-wheat.vercel.app/api/logs?id=$requestId"
$status | ConvertTo-Json -Depth 10
```

---

## Limitations

| Limitation | Detail | Impact |
|---|---|---|---|
| Fire-and-forget Neon | Lifecycle writes are async, not awaited | Brief entry may not appear in `/api/logs` if function terminates too early |
| In-memory only queue state | Queue depth, active workers, retry state all ephemeral | Dashboard queue metrics reset on cold start |
| Single-instance queue | No cross-Vercel-instance queue coordination | Concurrent requests to different instances each have their own queue |
| No WebSocket events | Dashboard uses polling (2s/5s intervals) | ~2-5s delay in UI updates |
| Email-only output | No SMS, webhook, or push notification fallback | If SMTP fails after retries, the admin has no alert |
