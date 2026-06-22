# Project Templates

## Overview

The Project Templates system provides a registry of reusable project blueprints that can be applied to create new projects or extend existing ones. Templates support 8 built-in categories and plugin-registered custom templates.

## Template Registry

The template registry stores template definitions with:
- Unique template identifier and name
- Category and tags for discoverability
- Project blueprint with pages, sections, components, and design strategy
- Default configuration values and feature flags
- Version information and compatibility metadata

## Built-in Categories

| Category | Description | Use Case |
|---|---|---|
| **starter** | Minimal project with core structure | Quick start for any project type |
| **business** | Professional business site with services, about, contact pages | Service-based businesses |
| **restaurant** | Restaurant and food service site with menus, reservations | Food and hospitality |
| **portfolio** | Creative portfolio with gallery, testimonials, case studies | Designers, artists, agencies |
| **landing** | Single-page landing with hero, features, CTA | Product launches, campaigns |
| **SaaS** | Software-as-a-service site with pricing, features, docs | SaaS products |
| **marketplace** | Multi-vendor marketplace with listings, search, checkout | E-commerce platforms |
| **enterprise** | Large-scale enterprise site with complex navigation, multi-section | Corporate websites |

## Applying Templates

Templates can be applied to:
- **New projects**: Creates a complete project from the template blueprint
- **Existing projects**: Merges template sections into existing project structure with conflict resolution

The application process includes:
1. Template validation against the target project type
2. Blueprint merging with conflict detection
3. Configuration initialization with template defaults
4. Post-application validation and health checks

## Plugin-Registered Templates

Plugins can register custom templates through the Plugin SDK's `ProjectTemplate` extension point. Registered templates appear alongside built-in templates and follow the same application workflow.

## Template Export

Templates can be exported as shareable bundles containing:
- Template definition and metadata
- Project blueprint with all pages, sections, and components
- Default configuration and feature flags
- Design strategy and design tokens
- Sample content and demo data

Export formats: JSON, YAML, and ZIP bundles.
