# Changelog

## [v1.3.0] - 2026-06-08

### Added
- Decision Layer v1 (lib/decision/index.js) — architectural decision recording system
- Persistent storage via data/decisions.json (auto-creating)
- registerDecision(), listDecisions(), getDecision() API
- Duplicate ID detection and rejection
- impact validation (low/medium/high)
- Auto-generated ISO timestamps

### Notes
This version adds a standalone decision recording system for all future architectural changes.
All v1.3.0 decisions will be recorded via the Decision Layer itself.

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
