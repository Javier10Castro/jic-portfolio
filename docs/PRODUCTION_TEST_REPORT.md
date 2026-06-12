# Production Test Report

**Date:** 2026-06-12  
**Deployment:** `web-portfolio-kappa-wheat.vercel.app`  
**Git SHA:** `f9fb5f6`  
**Test Script:** `scripts/run-production-tests.js`  

---

## Summary

| Metric | Result |
|---|---|
| sendBrief (valid) | 202 ✅ |
| sendContact (valid) | 202 ✅ |
| Email dedup (duplicate) | 429 ✅ |
| Invalid email rejection | 400 ✅ |
| Missing name rejection | 400 ✅ |
| Missing message rejection | 400 ✅ |
| Telemetry health | ✅ |
| Trace persistence (Neon) | ✅ |
| Range analytics | ✅ |
| **Coverage** | **28% (7/25 paths)** |

## Paths covered

| Path | Source |
|---|---|
| `sendBrief:submitted` | Neon |
| `sendContact:submitted` | Neon |
| `sendBrief:timingCheck` | Neon |
| `sendBrief:validateEmail` | Neon |
| `sendBrief:sanitizeAndValidateName` | Neon |
| `sendBrief:rateLimit:email` | Neon |
| `sendContact:validateMessage:empty` | Neon |

## Root cause of coverage being stuck at 0%

The `tracer.trace()` system writes trace events to a `request_traces` table in Neon. Three issues were found and fixed:

### 1. Missing table auto-creation (critical)

The `request_traces` table was defined in migration `008_request_traces.sql` but had never been run on the production Neon database. On Vercel cold starts, the table didn't exist, so all `INSERT INTO request_traces` queries silently failed.

**Fix:** Added `_ensureTable()` in `lib/db/requestTraces.js` — runs `CREATE TABLE IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS` on module load. `saveTrace()` awaits this promise before attempting the INSERT.

### 2. Lazy init masked errors (contributing)

`lib/tracer.js` used lazy initialization for the Neon module (`_tryInitNeon()` with a silent catch). If the `require('./db/requestTraces')` failed, `_neonReady` stayed `false` and no error was visible.

**Fix:** Replaced lazy init with eager `require` at module load time. The error is logged if it fails.

### 3. Auto-cleaning Set defeated drain (minor)

The `_pending` Set used `p.finally(() => _pending.delete(p))` to auto-clean promises. When a Promise resolved quickly (before `drain()` ran), it was already removed from the Set, making `drain()` a no-op.

**Fix:** Changed `_pending` to an array with splice-based drain. Promises accumulate until explicitly drained.

## How coverage increases over time

Coverage is computed as: `covered_paths / total_paths * 100` where `total_paths = 25`.

Each validation path is recorded as a trace event in Neon when its corresponding request reaches that code path. Coverage increases organically as different validation scenarios are triggered:

- Valid submissions → `sendBrief:submitted`, `sendContact:submitted`
- Invalid email → `sendBrief:validateEmail`, `sendContact:validateEmail`
- Missing name → `sendBrief:sanitizeAndValidateName`, `sendContact:sanitizeAndValidateName`
- Rate limit → `sendBrief:rateLimit:ip`, `sendBrief:rateLimit:email`
- Honeypot → `:honeypotCheck`
- Missing prompt → `:validatePrompt`, `:validateMessage:empty`

Once all 23 validation + 2 success paths are exercised, coverage reaches 100%.

## Running the test suite

```bash
node scripts/run-production-tests.js
```

The script uses unique emails per run (via a random `RUN_ID` suffix) to avoid dedup interference across separate runs.
