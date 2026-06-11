# Audit Report — sendBrief Architecture

**Date:** 2026-06-11
**Scope:** sendBrief → queue → registry → Neon → api/logs → dashboard-logs
**Commits audited:** e2eb4e7, 64f0ffa, 9b327cb, d43a20a, 2808416, b76fe8c, ae71363

---

## 1. Architecture Flow Verification

```
sendBrief.js ──► request-registry.js ──► db/requestLogs.js ──► Neon PostgreSQL
    │                                               ▲
    └── logs.js (separate instance) ────────────────┘
                        │
                dashboard-logs.html (renderRegistryEntry)
```

### Verified — all paths intact

| Hop | File:Line | Status |
|---|---|---|
| Validation registration | `sendBrief.js:150,161,171,180` | ✅ |
| Memory Map store | `request-registry.js:124` | ✅ |
| Neon persistence (async) | `request-registry.js:128` → `requestLogs.js:3` | ✅ |
| SQL INSERT with 3 new columns | `requestLogs.js:10-11,41-43` | ✅ (b76fe8c) |
| SQL read + _rowToApi mapping | `requestLogs.js:48-51,99-101` | ✅ |
| logs.js query (separate instance) | `logs.js:11-13` | ✅ |
| Dashboard render | `dashboard-logs.html:194-199` | ✅ |

### renderRegistryEntry validation rendering — PASS

- Condition: only when `status === 'rejected'` and at least one field present
- All 3 fields rendered: `validationStage`, `validationField`, `validationReason`
- All user values protected via `escapeHTML()`
- Individual field sections conditional on presence
- Backward compatible: old rows with `null` fields don't render the block

### loadRecentRequests data flow — PASS

- Endpoint: `GET /api/logs?limit=30` → `api/logs.js:4-5`
- Response: `{ entries, metrics }` → destructured at `dashboard-logs.html:255-256`
- Each entry → `renderRegistryEntry()` at line 264

---

## 2. Referencias Rotas — PASS

| Category | Check | Result |
|---|---|---|
| `require()` paths (14 modules) | All resolve → actual files on disk | ✅ |
| HTML script src (8 entries) | All resolve → files under `public/` | ✅ |
| API fetch URLs (4 entries) | All match actual Vercel endpoints | ✅ |

**No broken references found.**

---

## 3. Funciones Duplicadas — PASS

| Check | Result |
|---|---|
| Single `window.buildSendBriefPayload` source of truth | ✅ (`sendBrief-payload.js`) |
| `submitContact()` uses `window.buildSendBriefPayload` | ✅ (`brief-maestro.html:1689`) |
| E2E Mode 2 uses `window.buildSendBriefPayload` | ✅ |
| E2E standalone uses `window.buildSendBriefPayload` | ✅ |
| E2E console uses `window.buildSendBriefPayload` | ✅ |

**No duplicated payload builders in active code paths.**

---

## 4. Documentación vs Código Actual

### Hallazgos Críticos

| # | Documento | Afirmación | Código real |
|---|---|---|---|
| C1 | AGENTS.md, AI_CONTEXT_PACK.md, ARCHITECTURE.md | `lib/compiler/`, `lib/orchestrator/`, `lib/loader/` existen como módulos implementados | No existen en disco — directorios nunca creados |
| C2 | API_FLOW.md | sendBrief 202 devuelve `{ queuePosition, queueDepth, status: "queued", estimatedWaitMs }` | Devuelve `{ position, depth }` — sin `status` ni `estimatedWaitMs` |
| C3 | API_FLOW.md | sendBrief payload example no incluye `submittedAt` | `submittedAt` es obligatorio y siempre inyectado por `buildSendBriefPayload()` |
| C4 | AGENTS.md, AI_CONTEXT_PACK.md | Dashboard files listados en raíz (`/`) | Residen en `/public/` (Vercel sirve `/public` como web root) |
| C5 | AGENTS.md, AI_CONTEXT_PACK.md | `api/projects/` listado como "Dashboard API (legacy)" | Directorio no existe |

### Hallazgos Recomendados

| # | Documento | Afirmación | Código real |
|---|---|---|---|
| R1 | AI_CONTEXT_PACK.md | sendBrief 429 devuelve `{ error: "RATE_LIMITED", retryAfterMs }` | No incluye `retryAfterMs` (solo `{ success: false, error: "RATE_LIMITED" }`) |
| R2 | TESTING_GUIDE.md | Headers `X-RateLimit-Limit/Remaining` son "429 only" | Presentes también en respuestas 202 |
| R3 | AI_CONTEXT_PACK.md | sendBrief y sendContact tienen misma familia de respuestas | `resPayload` de sendBrief es más simple (sin `processingStage`, `timestamp`, etc.) |
| R4 | AGENTS.md, AI_CONTEXT_PACK.md | Node.js 22.11.0 | No hay `engines.node` en `package.json` |

### Hallazgos Cosméticos

| # | Documento | Problema |
|---|---|---|
| M1 | AGENTS.md | Sección de estructura de proyecto duplicada (líneas 42-86 y 87-89) |
| M2 | ARCHITECTURE.md (raíz) vs docs/ARCHITECTURE.md | Dos archivos con contenido similar, ambos desactualizados |

---

## 5. Código Muerto / Scripts No Utilizados

| # | Archivo | Líneas | Estado | Detalle |
|---|---|---|---|---|
| D1 | `scripts/e2e-brief-bypass-wizard.js` (raíz) | 306 | **No referenciado** | v1 legacy — contiene `buildSendBriefPayload` privado (duplicado). Ningún HTML lo referencia. Solo accesible si se ejecuta manualmente. |
| D2 | `public/scripts/load-e2e.js` | 318 | **No referenciado** | Solo usable via `fetch(...).then(eval)` manual. Contiene duplicados de test data. |
| D3 | `public/index.html:362-363` | 2 scripts | **Carga innecesaria** | `sendBrief-payload.js` + `e2e-brief-bypass-wizard.js` cargados en portfolio (solo usa `/api/sendContact`) |
| D4 | `public/dashboard-logs.html:81-82` | 2 scripts | **Carga innecesaria** | Mismos scripts cargados en dashboard-logs (no usa `buildSendBriefPayload` ni E2E) |

---

## 6. Código Muerto por Refactors

| # | Archivo | Problema |
|---|---|---|
| X1 | `api/sendBrief.js` | `log.initTrace(req)` nunca llamado — `req._lifecycle` siempre `undefined` en `lifecycle.complete` structured log del queue |
| X2 | `lib/request-registry.js:90` | `delete e.updatedAt` hace que `e.updatedAt` nunca exista en respuestas API — fallback `e.updatedAt` en dashboard es dead code |

---

## 7. Verificación Final: validationStage/Field/Reason

### Cadena de persistencia

```
sendBrief.js:150 ──► registerLifecycle({ validationStage, validationField, validationReason })
    │
    ▼
request-registry.js:124 ──► memory Map (fields preserved via spread)
    │
    ▼
request-registry.js:128 ──► _neonSave(storeEntry) ──► requestLogs.js:41-43
    │                                                     │
    │                                              INSERT $15, $16, $17
    │                                              (validation_stage, validation_field, validation_reason)
    ▼
requestLogs.js:99-101 ──► _rowToApi() ──► { validationStage, validationField, validationReason }
    │
    ▼
logs.js:11 ──► lookupRequest() ──► _computeDerived() ──► preserves fields via spread
    │
    ▼
dashboard-logs.html:194-199 ──► renderRegistryEntry() ──► conditional escapeHTML render
```

**Conclusión: La cadena completa está intacta y correcta.** ✅

### Variante cross-instance (el escenario real)

```
sendBrief (Instance A) ──► Neon $15,$16,$17 ──► logs (Instance B) ──► Neon SELECT
```

Si la escritura async a Neon completa antes de la lectura, los campos sobreviven. Si no, el Map en memoria de Instance A tiene los datos pero Instance B no puede verlos (hasta el próximo write que persista).

---

## Resumen de Hallazgos

| Severidad | Cantidad | Ítems |
|---|---|---|
| **Críticos** | 5 | C1–C5 (discrepancias en documentación) |
| **Recomendados** | 6 | R1–R4 (docs), D1–D4 (dead code), X1 (initTrace faltante) |
| **Cosméticos** | 3 | M1–M2 (docs duplicadas), X2 (updatedAt fallback) |

### Acción requerida

- **Ningún bug funcional demostrado** en el pipeline sendBrief → registry → Neon → logs → dashboard.
- La funcionalidad de validación (validationStage/Field/Reason) persiste y se renderiza correctamente.
- Las discrepancias de documentación son significativas (5 críticas) pero no afectan la ejecución del código.
- Se recomienda priorizar la corrección de documentos (C1–C5) y la limpieza del script legacy (D1).

---

*Audit completed 2026-06-11. See also: ARCHITECTURE_OVERVIEW.md, AI_CONTEXT_PACK.md, docs/audits/* for prior reviews.*
