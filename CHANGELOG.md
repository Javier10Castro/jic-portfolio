# Changelog

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
