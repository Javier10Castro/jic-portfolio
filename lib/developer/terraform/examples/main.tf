terraform {
  required_providers {
    platform = {
      source = "platform/terraform-provider-platform"
      version = "~> 4.5"
    }
  }
}

provider "platform" {
  api_key = var.platform_api_key
  base_url = "https://api.platform.io/v1"
}

resource "platform_project" "my_app" {
  name = "my-app"
  description = "My application"
}

resource "platform_workspace" "team" {
  name = "engineering"
  members = ["user1@example.com", "user2@example.com"]
}

resource "platform_integration" "github" {
  provider = "github"
  config = {
    auth = {
      type = "oauth2"
      token = var.github_token
    }
  }
}

resource "platform_deployment" "production" {
  project_id = platform_project.my_app.id
  environment = "production"
  branch = "main"
}

resource "platform_plugin" "analytics" {
  name = "analytics-widget"
  version = "1.0.0"
  enabled = true
}

resource "platform_api_key" "ci_key" {
  name = "ci-cd-key"
  scopes = ["read", "write", "deploy"]
}

resource "platform_workflow" "ci" {
  name = "continuous-deployment"
  steps = [
    { name = "build", type = "command", command = "npm run build" },
    { name = "test", type = "command", command = "npm test" },
    { name = "deploy", type = "deploy", environment = "production" }
  ]
}

resource "platform_billing_plan" "enterprise" {
  plan = "enterprise"
  interval = "monthly"
  quantity = 10
}
