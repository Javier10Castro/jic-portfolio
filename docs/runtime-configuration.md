# Runtime Configuration

## Overview

Dynamic configuration system with priority-based resolution hierarchy, environment profiles, and schema validation.

## Components

- **Manager**: Configuration orchestrator
- **Registry**: Config CRUD with versioning
- **Sources**: Source priority management
- **Overrides**: Runtime overrides
- **Profiles**: Environment profiles
- **Validation**: Schema validation

## Configuration Hierarchy

```
override > profile > registry > source > default
```

## Sources with Priority Ordering

1. Environment variables
2. Configuration files
3. Database
4. Default values

Each source has a priority level; higher priority sources override lower ones.

## Profiles for Environment-Specific Configs

- `development`
- `staging`
- `production`
- Custom profiles

Each profile can override specific configuration values for their environment.

## Validation Schemas

- JSON Schema based validation
- Type checking
- Required field enforcement
- Default value application
- Schema versioning
