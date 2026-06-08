# Changelog

## [v1.7.0] - 2026-06-08

### Added
- SaaS Runtime Layer v1 (lib/runtime/index.js) — central runtime orchestrator
- Full pipeline execution: Plan → Design System → Preview → Scoring → Scaffold → Deploy
- State machine enforcement with valid transition checks (draft→processing→preview→approved→deploying→deployed)
- PostgreSQL persistence at every step (executions, project_states, decisions, previews)
- Retry logic with exponential backoff (up to 3 attempts per step)
- Step timeout protection (120s per step)
- Project state rollback on pipeline failure
- 5-dimension scoring engine inline: contrast, UX, conversion, clarity, SEO
- Automatic preview record creation with version tracking
- Decision records with full metrics and warnings
- API v1 (api/v1/) — 7 clean REST endpoints:
  - POST /api/v1/projects/create — create project + trigger pipeline
  - GET /api/v1/projects — list projects per workspace (tenant-safe)
  - GET /api/v1/projects/:id — full project state with ?include=inputs,previews,states,decisions
  - POST /api/v1/projects/:id/run — manually trigger pipeline execution
  - POST /api/v1/projects/:id/approve — approve preview → scaffold → deploy
  - GET /api/v1/projects/:id/preview — preview output (JSON, HTML, or CSS format)
  - GET /api/v1/executions/:id — pipeline logs with AI decisions
- Tenant safety on every API route: workspace_id isolation + user membership validation
- Form data extraction and persistence to project_inputs table on project creation
- Branding color extraction from formData (supports branding_colors object and brand_colores string)
- extractRuntimeState() — unified project state with previews, states, decisions, inputs

### Notes
This is the first runtime release (v1.7.0) that converts the architectural design from v1.6.0 into executable code. Existing engines remain unchanged — the runtime orchestrates them through a unified pipeline.

---

## [v1.6.0] - 2026-06-08

### Added
- Complete multi-tenant SaaS architecture design (ARCHITECTURE-SAAS.md)
- Full PostgreSQL schema with 14 tables: workspaces, users, workspace_members, projects, project_inputs, project_states, previews, deployments, executions, decisions, artifacts, webhook_events, api_keys, form_responses (legacy)
- Row-Level Security (RLS) tenant isolation strategy with workspace-scoped data
- Decision Scoring Engine v2 specification — 5-dimension AI evaluation (contrast 25%, UX 25%, conversion 20%, clarity 15%, SEO 15%)
- Automatic improvement loop with up to 2 regeneration attempts on score < 50
- Project lifecycle state machine: DRAFT → PROCESSING → PREVIEW → APPROVED → DEPLOYING → DEPLOYED (with FAILED and REJECTED branches)
- Workspace model with 4 roles: owner, admin, member, viewer
- Billing plan tiers: Free (3 projects), Starter (15), Pro (50), Enterprise (unlimited)
- GitHub + Vercel integration design — auto-repo creation, auto-commit, preview vs production branches
- Live preview system with Redis TTL caching, design system token injection, approval gating
- Async job queue architecture via Bull/Redis for non-blocking AI pipeline
- Vercel API client specification (lib/deployment/vercel.js)
- Stripe billing adapter specification (lib/billing/)
- Rate limiting middleware with per-plan limits
- SQL migration script (data/migrations/003_saas_schema.sql) — 14 tables + triggers + functions + indexes
- Versioning model with rollback support (deployments store commit SHAs)
- Preview versioning (max 10 per project, auto-cleanup)
- Amplified pipeline flow from user input through GitHub repo creation to Vercel deployment

### Notes
This is a design-phase release (v1.6.0). No engines were modified — the existing system remains fully compatible. All new modules are documented in ARCHITECTURE-SAAS.md and ready for implementation.

---

## [v1.5.0] - 2026-06-08

### Added
- Project Loader Engine v1 (lib/loader/index.js) — read-only project reconstruction from PostgreSQL
- loadProject() — full project data with section-grouped form responses
- rebuildPromptMaestro() — reconstructs Prompt Maestro string from stored data
- getProjectState() — complete pipeline state combining DB + filesystem sources
- listProjects() — enumerates all projects in the database
- SQL migration (data/migrations/002_create_projects_executions.sql) — optional
- Multi-source data reconstruction: form_responses + decisions.json + optional tables
- Spanish/English bilingual Prompt Maestro reconstruction
- 65+ field labels for human-readable key mapping

### Notes
This version adds the final read layer, completing the full CRUD cycle: Compiler → Plan → Scaffold → Persist → Load.

---

## [v1.4.0] - 2026-06-08

### Added
- Form Persistence Layer v1 (lib/db/formResponses.js) — saves all Brief Maestro responses to PostgreSQL
- Database connection module (lib/db/index.js) — Neon PostgreSQL pool with SSL
- SQL migration script (data/migrations/001_create_form_responses.sql)
- form_responses table with project_id, section, field_key, value columns
- Automatic field-to-section mapping by prefix (biz_*, obj_*, brand_*, etc.)
- Array-to-comma-separated conversion for checkboxes and tags
- Non-blocking persistence in api/sendBrief.js (DB failure doesn't block email)
- generateProjectId() for unique project identification
- getResponsesGrouped() for section-grouped queries

### Notes
This version adds the persistence layer before the Orchestrator pipeline, ensuring all user responses are stored in PostgreSQL for analysis and auditing.

---

## [v1.3.0] - 2026-06-08

### Added
- Decision Layer v1 (lib/decision/index.js) — architectural decision recording system
- Deployment Engine v1 (lib/deployment/index.js) — automated Git/GitHub pipeline
- Orchestrator Engine v1 (lib/orchestrator/index.js) — central controller for all modules
- Persistent storage via data/deployments.json (auto-creating)
- initRepository(), commitProject(), createGitHubRepo(), pushToRemote() API
- deployFullPipeline() for end-to-end deployment orchestration
- Graceful degradation when Git or GitHub CLI is unavailable
- Deployment status tracking (deployed/failed/pending)
- Dynamic input type detection (raw_email, structured_prompt, json_brief, existing_project)
- Dynamic pipeline building based on input type
- Session-based state management with step-by-step results
- Automatic Decision Layer logging on module failure

### Notes
This version adds the complete deployment pipeline and central orchestrator, finalizing the Project Factory system.

---

## [v1.2.0] - 2026-06-08

### Added
- Project Scaffold Engine v1 (lib/scaffold/)
- Project Plan Engine v1 (lib/plan/) — semantic compiler
- Deterministic filesystem project generator
- Modular architecture: engine.js, generators/, templates/registry.js
- Template system with html, readme, agents, architecture, changelog, gitignore
- Zero external dependencies (native Node.js only)
- Semantic IR mapping (14 sections → 8 semantic categories)

### Notes
This version adds both the physical (scaffold) and logical (plan) layers for project generation.

---

## [v1.1.0] - 2026-06-08

### Added
- Intelligent Brief Validation Engine
- UX Flow Engine (dynamic user journey optimization)
- SEO Auto-Layer system
- Copy Quality Booster
- Enhanced Agent Pack internal reasoning system

### Improved
- Prompt Maestro output quality
- Site structure consistency
- Conversion-oriented copywriting
- SEO readiness by default

### Notes
This version transforms Agent Pack from a static generator into a structured intelligence system for website creation.

---

## [v1.0.0] - 2026-06-08

### Added
- Initial Agent Pack system
- Prompt Maestro structured system (14 sections)
- AGENTS.md workflow rules system
- ARCHITECTURE.md system design documentation
- Git-based version control integration

### Notes
Initial stable version of AI site generation system.
