# CLI Reference

## Installation

```bash
npm install -g @platform/cli
# or
npx @platform/cli
```

## Commands

### `platform init [name]`
Initialize a new project.
```bash
platform init my-app
# Output: Initialized project 'my-app' with default configuration.
```
| Option | Description |
|---|---|
| `name` | Project name (default: `my-project`) |

### `platform login`
Authenticate with the platform.
```bash
platform login
# Output: Successfully authenticated. Token stored securely.
```

### `platform logout`
Clear stored authentication.
```bash
platform logout
# Output: Successfully logged out. Token removed.
```

### `platform generate [type] [language]`
Generate code, SDKs, or schemas.
```bash
platform generate sdk javascript
# Output: Generated javascript SDK.
platform generate openapi
# Output: Generated OpenAPI 3.1 specification.
platform generate client python
# Output: Generated python client library.
```
| Option | Description |
|---|---|
| `type` | Generation type: `sdk`, `openapi`, `client` (default: `sdk`) |
| `language` | Target language for SDK/client generation |

### `platform deploy [project]`
Deploy a project.
```bash
platform deploy my-app
# Output: Deploying 'my-app'... Deployment complete. URL: https://my-app.platform.io
```
| Option | Description |
|---|---|
| `project` | Project name (default: `current`) |

### `platform status`
Show platform status.
```bash
platform status
# Output: SDKs: 3\nClients: 5\nOpenAPI: 2\nSchemas: 6\nAPI Calls: 1234
```

### `platform agents [subcommand]`
Manage agents.
```bash
platform agents list
# Output: Agents:\n  - code-review (active)\n  - deploy-bot (idle)\n  - monitor (active)
platform agents run my-agent
# Output: Agent 'my-agent' execution completed.
```
| Subcommand | Description |
|---|---|
| `list` | List all agents |
| `run [name]` | Run a specific agent |

### `platform workflows [subcommand]`
Manage workflows.
```bash
platform workflows list
# Output: Workflows:\n  - deploy (enabled)\n  - build (enabled)\n  - review (disabled)
platform workflows run my-workflow
# Output: Workflow 'my-workflow' execution started.
```
| Subcommand | Description |
|---|---|
| `list` | List all workflows |
| `run [name]` | Run a specific workflow |

### `platform plugins [subcommand]`
Manage plugins.
```bash
platform plugins list
# Output: Installed plugins:\n  - analytics-widget v1.0.0 (enabled)\n  - slack-notifier v1.0.0 (enabled)
platform plugins install my-plugin
# Output: Plugin 'my-plugin' installed successfully.
platform plugins remove my-plugin
# Output: Plugin 'my-plugin' removed.
```
| Subcommand | Description |
|---|---|
| `list` | List installed plugins |
| `install [name]` | Install a plugin |
| `remove [name]` | Remove a plugin |

### `platform billing [subcommand]`
View billing information.
```bash
platform billing plan
# Output: Current plan: Professional ($99/mo)\nNext billing: July 20, 2026
platform billing usage
# Output: Current usage:\n  API Calls: 1,234 / 10,000\n  Storage: 2.1 GB / 50 GB\n  Users: 5 / 20
platform billing invoices
# Output: Recent invoices:\n  INV-001 $99.00 (paid)\n  INV-002 $99.00 (pending)
```
| Subcommand | Description |
|---|---|
| `plan` | Show current plan |
| `usage` | Show current usage |
| `invoices` | List recent invoices |

### `platform integrations [subcommand]`
Manage integrations.
```bash
platform integrations list
# Output: Connected integrations:\n  - github (connected)\n  - slack (connected)\n  - vercel (disconnected)
platform integrations connect github
# Output: Connected to 'github'.
platform integrations disconnect github
# Output: Disconnected 'github'.
```
| Subcommand | Description |
|---|---|
| `list` | List connected integrations |
| `connect [provider]` | Connect a provider |
| `disconnect [provider]` | Disconnect a provider |

### `platform config [subcommand] [key] [value]`
Manage configuration.
```bash
platform config list
# Output: Configuration:\n  platform.api-key=***\n  platform.region=us-east\n  platform.default-project=my-app
platform config set region eu-west
# Output: Set region = eu-west
platform config get region
# Output: region = value
```
| Subcommand | Description |
|---|---|
| `list` | List all configuration |
| `set <key> <value>` | Set a configuration value |
| `get <key>` | Get a configuration value |

### `platform doctor`
Run system diagnostics.
```bash
platform doctor
# Output: Platform Diagnostics:\n  Authentication: OK\n  API Connectivity: OK\n  SDK Versions: Up to date\n  Node.js: v22.11.0\n  Platform Version: 4.5.0\n  All systems operational.
```

### `platform logs [level]`
View platform logs.
```bash
platform logs info
# Output: Recent info logs:\n  [2026-06-19T12:00:00Z] INFO  API request completed (200)\n  [2026-06-19T12:00:00Z] INFO  Deployment successful
```
| Option | Description |
|---|---|
| `level` | Log level: `info`, `warn`, `error`, `debug` (default: `info`) |

### `platform update`
Update the CLI to the latest version.
```bash
platform update
# Output: CLI is up to date (v4.5.0).
```

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Unknown command |
| `2` | Command execution error |

## Configuration

CLI configuration is stored in `~/.platform/config.json`:

```json
{
  "apiKey": "plt_...",
  "region": "us-east",
  "defaultProject": "my-app",
  "timeout": 30000
}
```

## Environment Variables

| Variable | Description |
|---|---|
| `PLATFORM_API_KEY` | API key for authentication |
| `PLATFORM_REGION` | Default region (default: `us-east`) |
| `PLATFORM_TIMEOUT` | Request timeout in ms (default: `30000`) |
| `PLATFORM_BASE_URL` | API base URL (default: `https://api.platform.io/v1`) |

## Common Workflows

### Full project lifecycle
```bash
platform init my-app
platform login
platform deploy my-app
platform status
```

### Plugin management
```bash
platform plugins list
platform plugins install my-plugin
platform plugins list
```

### Integration setup
```bash
platform integrations connect github
platform integrations connect slack
platform integrations list
```
