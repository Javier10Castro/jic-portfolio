# Brief Maestro Frontend — Audit

**Date:** 2026-06-10
**Scope:** `brief-maestro.html` — full frontend submission flow
**Status:** Complete

---

## 1. Architecture Overview

Single-file vanilla HTML/JS app (`brief-maestro.html`, 1719 lines). No frameworks, no build step, no modules. All state is global.

---

## 2. Key Globes and Line Numbers

| Symbol | Type | Line | Purpose |
|---|---|---|---|
| `SECTIONS` | `Array` | 647 | Spanish section definitions (14 sections, ~100 questions) |
| `EN_SECTIONS` | `Array` | 822 | English section definitions |
| `SECTIONS_ORIG` | `Array` | 998 | Frozen copy of Spanish sections (for language toggle) |
| `_tr` | `Object` | 999 | Translation key-value pairs |
| `currentLang` | `string` | 1048 | `'es'` or `'en'` |
| `currentStep` | `number` | 1130 | Wizard step (0-13) |
| `formData` | `Object` | 1131 | **Central state — all form answers** |
| `tagInputs` | `Object` | 1132 | Tag input intermediate state |

---

## 3. Complete Flow Map

```
┌─────────────────────────────────────────────────────────┐
│                    PAGE LOAD                             │
│  load() → restore formData from localStorage             │
│  setLang() → detect browser lang or localStorage         │
│  hide footer                                            │
└──────────────────────┬──────────────────────────────────┘
                       │ click "Empezar mi brief"
                       ▼
┌─────────────────────────────────────────────────────────┐
│  startApp()  [line 1138]                                │
│  • hide #hero                                           │
│  • show #app (classList.add 'active')                    │
│  • buildDots()                                          │
│  • renderStep()                                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼  (14 iterations)
┌─────────────────────────────────────────────────────────┐
│  nextStep() / prevStep()  [lines 1445 / 1452]            │
│  • collectCurrentInputs() → read DOM text/textarea      │
│  • currentStep++/--                                     │
│  • renderStep() → rebuild DOM for current section       │
│                                                        │
│  Field types: text, textarea, url, email, radio,        │
│    checkboxes, scale, tags, color-picker                │
│  Each writes to formData globl on interaction           │
└──────────────────────┬──────────────────────────────────┘
                       │ Step 14: button has onclick="submitForm()"
                       ▼
┌─────────────────────────────────────────────────────────┐
│  submitForm()  [line 1470]                               │
│  • collectCurrentInputs()                                │
│  • hide #app                                             │
│  • show #contact-page                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  User fills contact fields                               │
│  • inp-name (required)                                   │
│  • inp-email (required)                                  │
│  • inp-company (optional)                                │
│  • inp-phone (optional)                                  │
│  • click btn-submit                                      │
└──────────────────────┬──────────────────────────────────┘
                       │ onclick="submitContact()"
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  submitContact()  [line 1664] ★★★ PUNTO EXACTO DEL POST ★★★ │
│                                                             │
│  1. Read DOM fields: name, email, company, phone            │
│  2. Validations:                                            │
│     - name: trim() → truthy check                           │
│     - email: trim() → /^[^\s@]+@[^\s@]+\.[^\s@]+$/         │
│     - company, phone: no validation                         │
│  3. If invalid → show .error on fields, return              │
│  4. btn.loading + btn.disabled = true                       │
│  5. prompt = generatePrompt()  [line 1477]                  │
│     - reads from formData globl                             │
│     - builds 14-section markdown prompt                     │
│  6. payload = { name, email, company, phone, prompt,        │
│                 lang, formData }                            │
│  7. fetch('/api/sendBrief', { method:'POST',                │
│         headers:{'Content-Type':'application/json'},         │
│         body: JSON.stringify(payload) })                    │
│  8. Response:                                               │
│     - OK: show #success-overlay                             │
│     - Error: showToast(error_msg, 'error')                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Submission Function (Exact)

**Function:** `submitContact()` — line 1664

```javascript
function submitContact(){
  const name=document.getElementById('inp-name').value.trim();
  const email=document.getElementById('inp-email').value.trim();
  const company=document.getElementById('inp-company').value.trim();
  const phone=document.getElementById('inp-phone').value.trim();
  const btn=document.getElementById('btn-submit');
  let valid=true;
  ['field-name','field-email'].forEach(id=>document.getElementById(id).classList.remove('error'));
  document.getElementById('err-name').classList.remove('show');
  document.getElementById('err-email').classList.remove('show');
  if(!name){document.getElementById('field-name').classList.add('error');document.getElementById('err-name').classList.add('show');valid=false}
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){document.getElementById('field-email').classList.add('error');document.getElementById('err-email').classList.add('show');valid=false}
  if(!valid)return;
  btn.classList.add('loading');btn.disabled=true;
  const prompt=generatePrompt();
  const payload={name,email,company,phone,prompt,lang:currentLang,formData:JSON.parse(JSON.stringify(formData))};
  fetch('/api/sendBrief',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(r=>{if(!r.ok)throw new Error(r.status);return r.json()})
    .then(()=>{btn.classList.remove('loading');btn.disabled=false;document.getElementById('success-overlay').classList.add('active')})
    .catch(()=>{btn.classList.remove('loading');btn.disabled=false;showToast(t('toast_send_error'),'error')});
}
```

---

## 5. Endpoint

| Property | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/sendBrief` |
| **Content-Type** | `application/json` |

---

## 6. Payload Schema

```json
{
  "name":     "string (required, validated non-empty)",
  "email":    "string (required, validated regex)",
  "company":  "string (optional)",
  "phone":    "string (optional)",
  "prompt":   "string (generated from formData via generatePrompt())",
  "lang":     "string 'es' | 'en'",
  "formData": "object (deep-cloned formData, ~100 fields)"
}
```

---

## 7. Response Handling

| Scenario | Frontend Action |
|---|---|
| `res.ok === true` | Remove loading state, show `#success-overlay` |
| `res.ok === false` | Throw `new Error(r.status)` → catch → `showToast(error_msg, 'error')` |
| Network error | `showToast(error_msg, 'error')` |

**Notable:** The frontend does **NOT** read `requestId`, `queuePosition`, `queueDepth`, or any other response fields. It only checks `res.ok`. All observability data (`requestId`, lifecycle tracking, queue metrics) exists server-side and in the response body but is ignored by the frontend.

---

## 8. Risk Assessment

| Risk | Severity | Description |
|---|---|---|
| `requestId` ignored | Medium | Response body has `requestId` but frontend drops it. Cannot correlate UI event with server lifecycle. |
| No timeout | Low | `fetch()` has no `AbortController` / timeout. Slow gateway could hang indefinitely. |
| Error surface | Low | `showToast()` only. No field-level error mapping (e.g., 429 could show more specific message). |
| `formData` deep clone | Low | `JSON.parse(JSON.stringify(formData))` — adequate for current data shape (no Date, Map, Set). |
| Single-file risk | Medium | All logic in HTML. No module separation. Both wizar and API call in same file. |
| No CSRF/XSRF | Low | Public form. Honeypot in contact form (`input[name="bot"]`) exists in `index.html` but NOT in `brief-maestro.html`. |

---

## 9. E2E Script

File: `scripts/e2e-brief-bypass-wizard.js`

Two modes:
- **Mode 1** (`runBriefE2E(1)`): Populates `formData` global, shows contact page, fills fields, calls `submitContact()` directly. Intercepts `fetch` to capture response.
- **Mode 2** (`runBriefE2E(2)`): Pure API bypass. Builds exact payload, calls `fetch('/api/sendBrief')`, logs `requestId`, `queuePosition`, `queueDepth`, `status`. No DOM interaction.

Usage from DevTools console on `brief-maestro.html`:
```javascript
// Mode 2 — direct API (recommended for testing):
runBriefE2E(2);

// Mode 1 — via submitContact():
runBriefE2E(1);
```

---

## 10. Recommendations

### Immediate
1. **Expose `requestId` in frontend**: Read `body.requestId` from response and log it. Store in a data attribute on the success overlay or console.
2. **Add field-level error mapping** for 429: Check response status and show retry messaging (similar to `index.html` contact form).

### Short-term
3. **Add fetch timeout**: Wrap fetch with `AbortSignal.timeout(30000)` to prevent hanging on slow gateways.
4. **Log `requestId`**: Simple `console.log('requestId:', body.requestId)` after success — enables correlation.

### Long-term
5. **Module extraction**: Extract `submitContact()`, `generatePrompt()`, and `formData` management into separate JS modules for testability.
6. **Add brief-maestro honeypot**: The `input[name="bot"]` honeypot exists in `index.html` but not in `brief-maestro.html` — add it for spam protection parity.
