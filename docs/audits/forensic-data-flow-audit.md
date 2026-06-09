# Forensic Data Flow Audit: formData → prompt_maestro → plan.compile() → IR → Scoring

## 1. Data Flow Diagram

```
BRIEF MAESTRO (browser)
  │
  │  User fills 14 sections
  │  (biz_name, obj_principal, brand_colores, ...)
  │
  ├──→ brief-maestro.html generates:
  │     ## 1. DATOS DEL NEGOCIO
  │     **Empresa:** Salmos Café
  │     **Eslogan/Tagline:** Experiencias memorables
  │     ...
  │     ## 14. LA ESENCIA DE TU MARCA
  │
  │     This compiled text is DISPLAYED in the prompt preview
  │     but is NOT sent to the API
  │
  └──→ API receives formData as JSON object:
        { biz_name: "Salmos Café", biz_tagline: "...", ... }
              │
              ▼
        POST /api/v1/projects/create
              │
              ├──→ runtime.createProject()
              │     └── createProjectRow()
              │           prompt_maestro = JSON.stringify(formData)    ← [lib/runtime/index.js:170]
              │           → stored as: '{"biz_name":"Salmos Café","obj_principal":"...",...}'
              │
              └──→ runtime.runPipeline(project.id, ws_id, execId, formData)
                      │
                      │  promptText = formData ? JSON.stringify(formData)    ← [lib/runtime/index.js:281]
                      │                : project.prompt_maestro || '{}'
                      │
                      │  BOTH paths produce JSON text:
                      │  '{"biz_name":"Salmos Café","obj_principal":"...",...}'
                      │
                      ▼
                    plan.compile(promptText)    ← [lib/runtime/index.js:291]
                      │
                      │  parseSections() looks for:
                      │    ^##\s+(\d+)\.\s+(.+)    ← section headers
                      │    ^\*\*(.+?):\*\*\s*(.*)  ← fields
                      │
                      │  JSON has NO "## N." headers, NO "**key:**" fields
                      │
                      ▼
                    returns { project: { identity: { business_name: null, ... },
                                         structure: { pages: [], ... },
                                         ... } }
                      │
                      │  ALL 52+ fields are null/empty
                      │
                      ▼
                    Scoring engine (lines 353-373):
                      evaluateUX(null IR)     → 65 (base 60 + 5 hero section)
                      evaluateConversion(null) → 50
                      evaluateClarity(null)    → 50
                      evaluateSEO(null)        → 50
                      evaluateContrast(ds)     → 90 (varies by color extraction)
                      ─────────────────────────────────
                      Total: 53.75 (or 63.75 with colors)
```

## 2. Payloads: Actual vs Expected

### ACTUAL Payload (what plan.compile() receives now)

From a real Salmos project in DB (`prompt_maestro`):

```json
{"colors":["#529fb3","#000000","#ffffff"],"cta":"Reserva ahora"}
```

This is a **64-byte JSON string**. No section headers. No field markers.

When `formData` is provided directly (first run), the pipeline does:
```javascript
promptText = JSON.stringify(formData)
```
Which produces:

```json
{"biz_name":"Salmos Caf\u00e9","biz_tagline":"Experiencias memorables","biz_history":"Salmos Caf\u00e9 naci\u00f3 hace cuatro a\u00f1os...","obj_principal":"Generar cotizaciones","brand_colores":"Negro, blanco y azul #529fb3","arq_paginas":["Inicio","Nosotros","Servicios","Galer\u00eda","Men\u00fa","Testimonios","Preguntas Frecuentes","Contacto"],"serv_estrella":"Barra de caf\u00e9 para eventos","seo_keywords":["barra de caf\u00e9 para eventos","coffee bar para bodas","coffee catering tijuana","barra m\u00f3vil de caf\u00e9","caf\u00e9 para eventos en Tijuana"],"seo_geo":["Tijuana","Rosarito","Tecate","Ensenada","Baja California"],"conv_cta":"Cotiza tu evento","...continue..."
```

A **JSON object stringified** — no `##` headers, no `**key:**` markers.

### EXPECTED Payload (what plan.compile() is designed to parse)

```
## 1. DATOS DEL NEGOCIO
**Empresa:** Salmos Café
**Eslogan/Tagline:** Experiencias memorables alrededor de una taza de café
**Historia:** Salmos Café nació hace cuatro años durante un campamento de líderes juveniles...
**Misión:** Llevar lo mejor del café y crear experiencias excepcionales...
**Visión:** Convertirnos en una de las empresas de café para eventos más reconocidas...
**Valores corporativos:** Excelencia, Servicio, Integridad, Hospitalidad, Puntualidad...
**Diferenciadores clave:** Atención personalizada, imagen elegante, inspiración cristiana...
**Personalidad de marca:** Profesional, Elegante, Moderna, Cercana, Creativa...
**Contacto:** Teléfono y WhatsApp: 663 150 8119 | Correo: salmoscafe497@gmail.com
**Redes sociales:** Instagram: @salmos_cafe | Facebook: SalmosCafe

## 2. OBJETIVOS DEL PROYECTO
**Objetivo principal:** Generar cotizaciones y reservas para eventos
**Objetivos secundarios:** Generar confianza, Mostrar portafolio, Incrementar mensajes...
**KPIs de éxito:** Solicitudes de cotización, mensajes por WhatsApp...
**Conversión principal deseada:** Solicitar cotización personalizada
**Plazo para resultados:** 3 a 6 meses

## 3. SITUACIÓN ACTUAL Y COMPETENCIA
...
## 4. PÚBLICO OBJETIVO
...
## 5. BRANDING E IDENTIDAD VISUAL
**Paleta de colores:** Negro, blanco y azul #529fb3
**Estilo visual deseado:** Minimalista, Moderno, Elegante, Premium
...
## 6. ARQUITECTURA DEL SITIO
**Páginas requeridas:** Inicio, Nosotros, Servicios, Galería, Menú, Testimonios, FAQ, Contacto
...
## 7. CONTENIDO DISPONIBLE
...
## 8. PRODUCTOS Y SERVICIOS
**Servicio estrella:** Barra de café para eventos
...
## 9. PRUEBA SOCIAL Y CREDIBILIDAD
...
## 10. FUNCIONALIDADES REQUERIDAS
...
## 11. ESTRATEGIA SEO
**Palabras clave:** barra de café para eventos, coffee bar para bodas, coffee catering tijuana...
**Ubicaciones geográficas:** Tijuana, Rosarito, Tecate, Ensenada, Baja California
...
## 12. REFERENCIAS VISUALES
...
## 13. ESTRATEGIA DE CONVERSIÓN
**CTA principal:** Cotiza tu evento
**Lead magnet:** ...
**Seguimiento post-contacto:** Contactar al prospecto por WhatsApp o llamada en 24 hrs.
...
## 14. LA ESENCIA DE TU MARCA
...
```

## 3. plan.compile() Parser Specification

The Plan Engine (`lib/plan/index.js`) uses two regexes for parsing:

| Element | Regex | Matches | Example Match |
|---|---|---|---|
| Section header | `/^##\s+(\d+)\.\s+(.+)/` | `## N. TITLE` | `## 1. DATOS DEL NEGOCIO` |
| Field | `/^\*\*(.+?):\*\*\s*(.*)/` | `**key:** value` | `**Empresa:** Salmos Café` |

It does NOT match:
- `## TITLE` (missing number)
- `key: value` (missing `**` markers)
- Any JSON format

Section-to-field mapping after parsing:

```
Section (matched by header)        Fields extracted
─────────────────────────────────────────────────────
NEGOCIO (from "DATOS DEL NEGOCIO")  → Empresa, Eslogan/Tagline, Historia, Misión, Visión, Valores corporativos, Diferenciadores clave, Personalidad de marca
BRANDING (from "BRANDING...")       → Estado del logotipo, Paleta de colores, Tipografías, Estilo visual deseado, Emociones a transmitir, Nivel de sofisticación
OBJETIVOS                           → Objetivo principal, Objetivos secundarios, KPIs de éxito
ARQUITECTURA                        → Páginas requeridas, Flujo de usuario ideal
CONTENIDO                           → Textos existentes, Fotografías profesionales
PRODUCTOS                           → Lista de servicios/productos, Servicio estrella
PÚBLICO                             → Cliente ideal, Problemas que resuelve, Motivaciones
ESTRATEGIA SEO                      → Palabras clave, Ubicaciones geográficas
CONVERSIÓN                          → CTA principal, Lead magnet, Seguimiento post-contacto
ESENCIA                             → Personalidad de marca (metáfora), Diferenciador real
```

## 4. Point of Data Loss: EXACT Location

**File:** `lib/runtime/index.js`
**Line:** 281

```javascript
const promptText = formData ? JSON.stringify(formData) : project.prompt_maestro || '{}';
```

**What happens:** `JSON.stringify(formData)` converts the structured form data object into a JSON text string. This JSON string is then passed to `plan.compile()`, which calls `parseSections()`.

The parser's section regex `/^##\s+(\d+)\.\s+(.+)/` requires lines starting with `## N.` — JSON has none. The field regex `/^\*\*(.+?):\*\*\s*(.*)/` requires lines starting with `**` — JSON has none.

**Result:** `parseSections` iterates through every line of JSON, finds zero matches, and returns `{}`. Every downstream extraction (`buildIdentity`, `buildStructure`, `buildSEO`, etc.) returns `null`/`[]`.

**Secondary impact:** `extractBrandingColors(formData)` on line 306 works with the raw `formData` object (not the stringified version), so it CAN extract colors from `formData.brand_colores` or `formData.branding_colors` IF those keys exist. But this only affects the `evaluateContrast` dimension + warning penalty — the other 4 dimensions are already dead from empty plan IR.

## 5. Compilation Proof

| Format | plan.compile() result | business_name | pages | keywords | score variability |
|---|---|---|---|---|---|
| `**Empresa:** Salmos Café` (Brief Maestro output) | **PARSED** ✓ | `Salmos Café` | 8 pages | 5 keywords | YES (differs by input) |
| `{"biz_name":"Salmos Café"}` (current pipeline) | **EMPTY** ✗ | `null` | `[]` | `[]` | NO (always 53.75/63.75) |
| `{\"colors\":[...],\"cta\":\"...\"}` (DB minified) | **EMPTY** ✗ | `null` | `[]` | `[]` | NO (always 53.75) |
| `Empresa: Salmos Café` (no `**`) | **EMPTY** ✗ | `null` | `[]` | `[]` | NO |

## 6. Summary

**Data loss point:** `lib/runtime/index.js:281` — `JSON.stringify(formData)` produces JSON text that `plan.compile()` cannot parse.

**Missing step:** The Brief Maestro generates the correct compiled format (`## N. NAME` + `**key:** value`) in the browser, but this compiled text is **never sent to the API** and **never stored or forwarded to plan.compile()**. Only the raw formData JSON is sent, stored as `prompt_maestro`, and fed to the Plan Engine.

**Architecture fix needed:** Either:
- Store the compiled Prompt Maestro text (what `brief-maestro.html` generates) as `prompt_maestro` instead of `JSON.stringify(formData)`, OR
- Add a preprocessing step in `runPipeline` that converts `formData` → compiled sections before calling `plan.compile()` (using `lib/compiler/` or similar)
