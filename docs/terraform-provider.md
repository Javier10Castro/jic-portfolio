# Terraform Provider

## Installation

Add the provider to your Terraform configuration:

```hcl
terraform {
  required_providers {
    platform = {
      source  = "platform/terraform-provider-platform"
      version = "~> 4.5.0"
    }
  }
}

provider "platform" {
  api_key = var.platform_api_key
  region  = "us-east"
}
```

## Authentication

The provider authenticates using an API key. Set via:
- Provider config: `api_key = var.platform_api_key`
- Environment variable: `PLATFORM_API_KEY`

## Provider Schema

| Argument | Type | Required | Description |
|---|---|---|---|
| `api_key` | string | yes | Platform API key |
| `base_url` | string | no | API base URL (default: `https://api.platform.io/v1`) |
| `region` | string | no | Default region (default: `us-east`) |

## Resources

### `platform_project`

Manage projects.

```hcl
resource "platform_project" "my_app" {
  name        = "My App"
  description = "Production application"
  region      = "us-east"
}
```

**Attributes**: `id`, `name`, `status`, `created_at`

### `platform_deployment`

Manage deployments.

```hcl
resource "platform_deployment" "prod" {
  project_id = platform_project.my_app.id
  branch     = "main"
  auto_deploy = true
}
```

**Attributes**: `id`, `project_id`, `status`, `url`

### `platform_billing_plan`

Manage billing plans.

```hcl
resource "platform_billing_plan" "team" {
  plan     = "professional"
  amount   = 99
  interval = "monthly"
}
```

**Attributes**: `id`, `plan`, `amount`, `interval`, `status`

### `platform_workspace`

Manage workspaces.

```hcl
resource "platform_workspace" "dev" {
  name    = "Development"
  members = 5
}
```

**Attributes**: `id`, `name`, `members`

### `platform_api_key`

Manage API keys.

```hcl
resource "platform_api_key" "ci" {
  name    = "CI/CD Key"
  scopes  = ["read", "write", "deploy"]
}
```

**Attributes**: `id`, `name`, `key`, `scopes`

### `platform_integration`

Manage integrations.

```hcl
resource "platform_integration" "github" {
  provider = "github"
  config = {
    token = var.github_token
  }
}
```

**Attributes**: `id`, `provider`, `status`

### `platform_plugin`

Manage plugin installations.

```hcl
resource "platform_plugin" "analytics" {
  name    = "analytics-widget"
  version = "1.0.0"
  config = {
    theme = "dark"
  }
}
```

**Attributes**: `id`, `name`, `version`, `enabled`

### `platform_workflow`

Manage workflows.

```hcl
resource "platform_workflow" "deploy" {
  name  = "deploy-workflow"
  steps = 3
  config = {
    triggers = ["push"]
  }
}
```

**Attributes**: `id`, `name`, `steps`, `status`

## Example Project

Complete Terraform configuration:

```hcl
terraform {
  required_providers {
    platform = {
      source  = "platform/terraform-provider-platform"
      version = "~> 4.5.0"
    }
  }
}

variable "platform_api_key" {
  type        = string
  description = "Platform API key"
  sensitive   = true
}

variable "github_token" {
  type        = string
  description = "GitHub personal access token"
  sensitive   = true
}

provider "platform" {
  api_key = var.platform_api_key
  region  = "us-east"
}

# Create project
resource "platform_project" "my_app" {
  name        = "My Application"
  description = "Production application with CI/CD"
  region      = "us-east"
}

# Create deployment
resource "platform_deployment" "prod" {
  project_id  = platform_project.my_app.id
  branch      = "main"
  auto_deploy = true
}

# Create workspace
resource "platform_workspace" "dev" {
  name    = "Development Team"
  members = 10
}

# Create API key for CI/CD
resource "platform_api_key" "ci" {
  name   = "CI/CD Pipeline"
  scopes = ["read", "write", "deploy"]
}

# Connect GitHub integration
resource "platform_integration" "github" {
  provider = "github"
  config = {
    token = var.github_token
  }
}

# Install analytics plugin
resource "platform_plugin" "analytics" {
  name    = "analytics-widget"
  version = "1.0.0"
  config = {
    theme = "dark"
  }
}

# Set billing plan
resource "platform_billing_plan" "team" {
  plan     = "professional"
  amount   = 99
  interval = "monthly"
}

output "project_id" {
  value = platform_project.my_app.id
}

output "deployment_url" {
  value = platform_deployment.prod.url
}

output "api_key_value" {
  value     = platform_api_key.ci.key
  sensitive = true
}
```
