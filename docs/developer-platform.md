# Developer Platform — Phase 9.5.0

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         Developer Platform                                                   │
│                                                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │   SDK Registry   │  │  SDK Generator   │  │ Client Generator │  │ OpenAPI Generator│  │Schema Generator│  │
│  │──────────────────│  │──────────────────│  │──────────────────│  │──────────────────│  │───────────────│  │
│  │ register/get     │  │ generate(lang)   │  │ generate(lang)   │  │ generate(ver)    │  │ generate(dom)  │  │
│  │ unregister/list  │  │ getStatus/list   │  │ getStatus/count  │  │ getSpec/versions │  │ getSchema/count│  │
│  │ getCount/clear   │  │ package names    │  │ clear            │  │ clear            │  │ clear          │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘  └───────────────┘  │
│                                                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ DeveloperEvents  │  │ DeveloperStorage │  │DeveloperAnalytics│  │ DeveloperPortal  │                     │
│  │──────────────────│  │──────────────────│  │──────────────────│  │──────────────────│                     │
│  │ on/off/emit      │  │ get/set/delete   │  │ recordCall/stats │  │ render/sections  │                     │
│  │ wildcard '*'     │  │ has/getAll/clear │  │ errorRate/latency│  │ analytics embed  │                     │
│  │ history/clear    │  │                  │  │ topEndpoints     │  │                  │                     │
│  │ 8 event types    │  │                  │  │ filter/clear     │  │                  │                     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘                     │
│                                                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐│
│  │  CLI (15 commands)              SDKs (7 languages)        OpenAPI 3.1      Terraform Provider            ││
│  │  ┌──────────────────────────┐   ┌──────────────────┐   ┌──────────────┐   ┌──────────────────────────┐  ││
│  │  │ init login logout        │   │ JavaScript       │   │ /api/v1/*    │   │ ProjectResource          │  ││
│  │  │ generate deploy status   │   │ TypeScript       │   │ OpenAPI 3.1  │   │ DeploymentResource       │  ││
│  │  │ agents workflows plugins │   │ Python           │   │ Bearer auth  │   │ BillingResource          │  ││
│  │  │ billing integrations     │   │ Go               │   │ JSON schema  │   │ WorkspaceResource        │  ││
│  │  │ config doctor logs update│   │ Java             │   │ Pagination   │   │ ApiKeyResource           │  ││
│  │  └──────────────────────────┘   │ C#               │   │ Rate limits  │   │ IntegrationResource      │  ││
│  │                                 │ PHP              │   └──────────────┘   │ PluginResource            │  ││
│  │  VS Code Extension             └──────────────────┘                       │ WorkflowResource          │  ││
│  │  ┌──────────────────────┐      GitHub Action                             └──────────────────────────┘  ││
│  │  │ login, dashboard,    │      ┌──────────────────┐                                                     ││
│  │  │ deploy, logs,        │      │ deploy, generate │                                                     ││
│  │  │ workflows, AI chat   │      │ run-workflow     │                                                     ││
│  │  └──────────────────────┘      │ manage-agents   │                                                     ││
│  │                                └──────────────────┘                                                     ││
│  └──────────────────────────────────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Module Map

| Module | Directory | Description |
|---|---|---|
| **DeveloperPlatform** | `lib/developer/developerPlatform.js` | Central orchestrator — facade over all sub-modules |
| **SdkRegistry** | `lib/developer/sdkRegistry.js` | SDK language registration and querying |
| **SdkGenerator** | `lib/developer/sdkGenerator.js` | Generates SDK packages per language |
| **ClientGenerator** | `lib/developer/clientGenerator.js` | Generates API client libraries |
| **OpenApiGenerator** | `lib/developer/openApiGenerator.js` | OpenAPI 3.1 specification generator |
| **SchemaGenerator** | `lib/developer/schemaGenerator.js` | JSON Schema generation for domain objects |
| **DeveloperEvents** | `lib/developer/developerEvents.js` | Event pub/sub with wildcard support |
| **DeveloperStorage** | `lib/developer/developerStorage.js` | Simple key-value storage |
| **DeveloperAnalytics** | `lib/developer/developerAnalytics.js` | API call tracking, stats, error rate, latency |
| **DeveloperPortal** | `lib/developer/developerPortal.js` | Developer portal renderer |
| **CLI** | `lib/developer/cli/cli.js` | 15 CLI commands for platform management |
| **JavaScript SDK** | `lib/developer/sdk/javascript/` | JS client with retry, pagination, streaming |
| **TypeScript SDK** | `lib/developer/sdk/typescript/` | TS client with generics, async generators |
| **Python SDK** | `lib/developer/sdk/python/` | Python client with generators, retry |
| **Go SDK** | `lib/developer/sdk/go/` | Go client with retry, typed methods |
| **Java SDK** | `lib/developer/sdk/java/` | Java client with retry, HttpClient |
| **C# SDK** | `lib/developer/sdk/csharp/` | C# client with async/await, retry |
| **PHP SDK** | `lib/developer/sdk/php/` | PHP client with cURL, retry |
| **OpenAPI** | `lib/developer/openApiGenerator.js` | OpenAPI 3.1 spec generation |
| **Terraform Provider** | `lib/developer/terraform/provider/` | 8 resources: project, deployment, billing, workspace, apikey, integration, plugin, workflow |
| **VS Code Extension** | `lib/developer/extensions/vscode/` | 6 commands: login, dashboard, deploy, logs, workflows, AI chat |
| **GitHub Action** | `lib/developer/github-action/` | GitHub Action for CI/CD |
| **Postman Collection** | `lib/developer/postman/` | Postman collection for API testing |

## API Catalog

All routes under `/api/v1/developer/`:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/developer` | Developer Platform API root |
| GET | `/developer/status` | Platform status (SDKs, clients, OpenAPI, schemas, events, analytics) |
| GET | `/developer/portal` | Developer portal sections and analytics |
| GET | `/developer/sdk` | Generate SDK (default: JavaScript) |
| GET | `/developer/openapi` | Generate OpenAPI spec (default: 4.5.0) |
| GET | `/developer/schema` | Get all schemas |
| GET | `/developer/schema/:domain` | Get schema for specific domain |
| GET | `/developer/postman` | Generate Postman collection |
| GET | `/developer/terraform` | Generate Terraform provider config |
| GET | `/developer/github-action` | Generate GitHub Action config |
| GET | `/developer/analytics` | Get analytics stats |
| POST | `/developer/client/generate` | Generate client library (body: `{ language, spec }`) |
| POST | `/developer/sdk/generate` | Generate SDK (body: `{ language, options }`) |

## Developer Portal Sections

| Section | ID | Items |
|---|---|---|
| SDKs | `sdks` | JavaScript, TypeScript, Python, Go, Java, C#, PHP |
| CLI | `cli` | 9 commands: init, login, deploy, status, plugins, workflows, billing, integrations, logs |
| OpenAPI | `openapi` | OpenAPI 3.1 specification for entire platform API |
| Terraform | `terraform` | Official Terraform provider with 8 resources |
| GitHub Action | `github` | Official GitHub Action for CI/CD |
| VS Code | `vscode` | Extension with 6 commands |

## Security Model

- **Authentication**: Bearer JWT token via `X-API-Key` header or `Authorization: Bearer <token>`
- **SDK clients**: All SDKs accept `apiKey` in constructor or `PLATFORM_API_KEY` environment variable
- **Terraform**: Provider uses `api_key` configuration field or `PLATFORM_API_KEY` env var
- **CLI**: Token stored securely after `platform login`
- **VS Code**: API key entered via input box (password masked)
- **GitHub Action**: Secrets passed via `secrets.PLATFORM_API_KEY`

## Integration with Other Phases

- **Phase 7.5.0 (Platform API)**: Developer routes registered at `/api/v1/developer/*`
- **Phase 8.5.0 (Control Plane)**: Developer Center UI page in control plane dashboard
- **Phase 9.0.0 (Cost Optimization)**: Analytics tracking API calls for cost analysis
- **Phase 9.1.0 (Security)**: Authentication integration with security platform
- **Phase 9.2.0 (Billing)**: CLI billing command integration
- **Phase 9.4.0 (Integration Hub)**: SDK integration methods, Terraform integration resource
- **Phase 9.3.0 (Plugin SDK)**: SDK integration for plugin development
- **Workflow Engine**: SDK and CLI workflow management
- **Deployment Engine**: CLI deploy command, Terraform deployment resource, GitHub Action deployment
