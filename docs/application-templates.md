# Application Templates

## Overview

Application Templates provide pre-configured blueprints for common application types. The Composition Engine ships with **10 built-in templates** that define the base structure, capabilities, dependencies, and configuration for each application category.

## Built-in Templates

| Template | Description | Key Modules |
|---|---|---|
| **Website** | Static or dynamic website | Web server, CMS, CDN |
| **SaaS** | Multi-tenant SaaS application | Auth, billing, orgs, RBAC |
| **CRM** | Customer relationship management | Contacts, deals, pipeline, reporting |
| **ERP** | Enterprise resource planning | Inventory, orders, finance, HR |
| **Marketplace** | Multi-vendor marketplace | Products, carts, payments, reviews |
| **KnowledgeBase** | Documentation and knowledge base | Search, categories, versions, feedback |
| **Automation** | Workflow automation platform | Triggers, actions, schedules, logs |
| **Dashboard** | Analytics and monitoring dashboard | Charts, metrics, alerts, data sources |
| **AI Assistant** | AI-powered chatbot and assistant | LLM, memory, tools, context |
| **Custom** | Empty template for custom applications | No pre-configured modules |

## Template Structure

Each template defines:

```json
{
  "id": "saas",
  "name": "SaaS Application",
  "version": "1.0.0",
  "description": "Multi-tenant SaaS application template",
  "modules": [
    { "id": "auth", "required": true },
    { "id": "billing", "required": true },
    { "id": "organizations", "required": true },
    { "id": "rbac", "required": true }
  ],
  "capabilities": {
    "required": ["auth.jwt", "billing.subscriptions"],
    "optional": ["analytics", "email"]
  },
  "dependencies": {
    "auth": ["storage.userDb"],
    "billing": ["auth", "storage.billingDb"]
  },
  "config": {
    "auth.provider": "jwt",
    "billing.provider": "stripe"
  }
}
```

## Applying Templates

Templates are applied through the Composition Engine:

1. Select a template by ID
2. Override default configuration as needed
3. Add optional modules and capabilities
4. Run validation against the composed template
5. Execute composition to create the application

```javascript
const composer = getDefaultComposer();
const application = await composer.compose({
  template: "saas",
  config: {
    "auth.provider": "oauth",
    "billing.tier": "professional"
  },
  capabilities: ["analytics"]
});
```

## Customizing Templates

Templates can be customized at multiple levels:

### Configuration Overrides

Override any default configuration value when applying a template:

- Provider selection (auth, billing, storage)
- Feature toggles
- Scaling parameters
- Integration endpoints

### Module Selection

- **Required modules**: Always included, cannot be removed
- **Optional modules**: Can be added or removed based on needs
- **Custom modules**: Registered modules can be composed alongside template modules

### Extending Templates

New templates can be registered via the plugin SDK:

```javascript
registry.registerTemplate({
  id: "ecommerce",
  name: "E-Commerce Platform",
  modules: [...],
  capabilities: {...},
  dependencies: {...}
});
```
