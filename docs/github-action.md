# GitHub Action

## Setup and Configuration

Add the Platform Action to your workflow:

```yaml
name: Deploy to Platform
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: platform/github-action@v4.5.0
        with:
          api_key: ${{ secrets.PLATFORM_API_KEY }}
          command: deploy
          project: my-app
```

## Inputs Reference

| Input | Required | Default | Description |
|---|---|---|---|
| `api_key` | yes | — | Platform API key |
| `command` | yes | `deploy` | Action command: `deploy`, `generate`, `run-workflow`, `manage-agents` |
| `project` | no | `current` | Project name or ID |
| `language` | no | `javascript` | Language for SDK generation |
| `workflow` | no | — | Workflow ID or name to run |
| `agent` | no | — | Agent ID or name to manage |
| `version` | no | `4.5.0` | Platform version |
| `timeout` | no | `300` | Timeout in seconds |

## Usage Examples

### Deploy a Project
```yaml
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: platform/github-action@v4.5.0
        with:
          api_key: ${{ secrets.PLATFORM_API_KEY }}
          command: deploy
          project: my-app
```

### Generate SDK
```yaml
name: Generate SDK
on:
  workflow_dispatch:
    inputs:
      language:
        description: 'SDK language'
        required: true
        default: 'typescript'
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: platform/github-action@v4.5.0
        with:
          api_key: ${{ secrets.PLATFORM_API_KEY }}
          command: generate
          language: ${{ github.event.inputs.language }}
```

### Run Workflow
```yaml
name: Run Workflow
on:
  schedule:
    - cron: '0 */6 * * *'
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: platform/github-action@v4.5.0
        with:
          api_key: ${{ secrets.PLATFORM_API_KEY }}
          command: run-workflow
          workflow: nightly-build
```

### Manage Agents
```yaml
name: Manage Agents
on:
  workflow_dispatch:
jobs:
  agents:
    runs-on: ubuntu-latest
    steps:
      - uses: platform/github-action@v4.5.0
        with:
          api_key: ${{ secrets.PLATFORM_API_KEY }}
          command: manage-agents
          agent: code-review
```

## Workflow Examples

### CI/CD Pipeline
```yaml
name: Full CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: platform/github-action@v4.5.0
        with:
          api_key: ${{ secrets.PLATFORM_API_KEY }}
          command: deploy
          project: my-app-staging

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: platform/github-action@v4.5.0
        with:
          api_key: ${{ secrets.PLATFORM_API_KEY }}
          command: deploy
          project: my-app

  notify:
    needs: [deploy-staging, deploy-production]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deployment completed"
```

### Generated SDK Commit
```yaml
name: Generate and Commit SDK
on:
  schedule:
    - cron: '0 0 * * 1'
jobs:
  generate-sdk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: platform/github-action@v4.5.0
        with:
          api_key: ${{ secrets.PLATFORM_API_KEY }}
          command: generate
          language: typescript
      - name: Commit SDK
        run: |
          git config user.name "Platform Bot"
          git config user.email "bot@platform.io"
          git add .
          git commit -m "Update TypeScript SDK" || true
          git push
```

## Secrets Management

Store your Platform API key as a GitHub secret:

1. Go to your repository **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `PLATFORM_API_KEY`
4. Value: Your Platform API key

The action accesses it via `${{ secrets.PLATFORM_API_KEY }}`.
