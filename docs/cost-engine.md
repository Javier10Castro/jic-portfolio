# Cost Optimization & Resource Governance — Phase 9.0.0

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Cost Engine                              │
│  ┌───────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐ │
│  │  Cost     │  │  Budget  │  │  Forecast  │  │Recommend│ │
│  │  Analyzer │  │  Manager │  │  Engine    │  │  Engine  │ │
│  └─────┬─────┘  └────┬─────┘  └─────┬──────┘  └────┬─────┘ │
│        │              │              │               │        │
│  ┌─────▼──────────────▼──────────────▼───────────────▼─────┐ │
│  │                    Optimizer                             │ │
│  └──────────────────────────┬──────────────────────────────┘ │
│                             │                                 │
│  ┌──────────────────────────▼──────────────────────────────┐ │
│  │  Quota Manager  │  Policy Engine  │  Pricing Models    │ │
│  │  6 resources    │  5 policies     │  4 providers+custom│ │
│  └──────────────────┴────────────────┴────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Cost Events (8 event types → EventBus integration)     │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Module Responsibilities

| Module | File | Responsibility |
|---|---|---|
| Entry | `lib/cost/index.js` | Exports all classes, `getCostEngine()`, `resetDefaultEngine()`, constants |
| Cost Engine | `lib/cost/costEngine.js` | Central orchestrator — `analyze()`, `optimize()`, `forecast()`, `recommend()`, `getReport()`, `getHealth()` |
| Cost Analyzer | `lib/cost/costAnalyzer.js` | 6 analysis domains — AI token usage, cluster utilization, workflow cost, deployment cost, storage usage, API consumption |
| Pricing Models | `lib/cost/pricingModels.js` | Provider pricing tables — OpenAI, Anthropic, Gemini, Ollama + custom. `calculateCost(provider, model, inputTokens, outputTokens)` returns `{ inputCost, outputCost, totalCost, currency }` |
| Budget Manager | `lib/cost/budgetManager.js` | Scoped budgets (workspace/project/org), daily/monthly periods, soft/hard limits, threshold alerts, getCurrentDailySpend/MonthlySpend |
| Optimizer | `lib/cost/optimizer.js` | 6 recommendation types — provider changes, model changes, batch execution, parallel execution, cache usage, worker allocation. Impact scoring with expected savings |
| Forecast Engine | `lib/cost/forecastEngine.js` | Linear regression trend projection. `predict(snapshots)` → daily, monthly, quarterly, yearly projections with budget exhaustion estimate |
| Recommendation Engine | `lib/cost/recommendationEngine.js` | Scored recommendations by impact/category. `generate(snapshot, alerts, quotaStatus, policies)` → sorted array with expectedSavings, risk, confidence |
| Quota Manager | `lib/cost/quotaManager.js` | 6 tracked resources — tokens, requests, deployments, storage, workflow executions, cluster minutes. Daily/monthly limits, getQuotaStatus(), hasExceededQuota |
| Policy Engine | `lib/cost/policyEngine.js` | 5 default policies — maximum_cost, preferred_providers, minimum_quality, latency_threshold, green_computing. Add/update/get/delete |
| Cost Events | `lib/cost/costEvents.js` | 8 event types — COST_UPDATED, BUDGET_WARNING, QUOTA_WARNING, FORECAST_UPDATED, POLICY_EVALUATED, OPTIMIZATION_RUN, RECOMMENDATION_GENERATED, QUOTA_EXCEEDED. EventBus integration |

## Pricing Model

Per-1M-token rates with `calculateCost(provider, model, inputTokens, outputTokens)`:

| Provider | Model | Input ($/1M) | Output ($/1M) |
|---|---|---|---|
| openai | gpt-4o | 2.50 | 10.00 |
| openai | gpt-4o-mini | 0.15 | 0.60 |
| openai | gpt-3.5-turbo | 0.50 | 1.50 |
| anthropic | claude-3-haiku | 0.25 | 1.25 |
| anthropic | claude-3-sonnet | 3.00 | 15.00 |
| anthropic | claude-3-opus | 15.00 | 75.00 |
| google | gemini-pro | 0.50 | 1.50 |
| google | gemini-ultra | 2.00 | 6.00 |
| ollama | any | 0 | 0 |

Custom provider pricing via `pricingModels.updatePricing(provider, model, { input, output })` or constructor option `customPricing`.

## Cost Analyzer Domains

| Domain | Input | Output Fields |
|---|---|---|
| AI Token Usage | `[{ provider, model, inputTokens, outputTokens }]` | totalTokens, totalCost, breakdown, recordCount |
| Cluster Utilization | `{ workers, hourlyCostPerWorker, queueDepth }` | totalWorkers, healthyWorkers, utilizationRate, estimatedHourly/Daily/MonthlyCost |
| Workflow Cost | `[{ estimatedCost, executionTimeMs, status }]` | totalCost, totalExecutions, byStatus, averageCostPerExecution |
| Deployment Cost | `[{ estimatedCost, type }]` | totalCost, totalDeployments, byType, averageCostPerDeployment |
| Storage Usage | `[{ sizeMb, type }]` | totalMb, totalCost, byType |
| API Consumption | `[{ endpoint, estimatedCost, path }]` | totalRequests, totalCost, byEndpoint, averageCostPerRequest |

## Forecast Algorithm

Linear regression on snapshot history (max 30 snapshots):

```
trend = (n * Σ(xy) - Σx * Σy) / (n * Σ(x²) - (Σx)²)
daily  = lastCost + trend * daysAhead
monthly = daily * 30
quarterly = daily * 90
yearly = daily * 365
```

## Optimization Strategy

Optimizer scores each recommendation type by weighted formula:

```
score = impactWeight (0.3-0.15) × expectedSavings × confidence × (1 - risk)
```

| Recommendation | Impact Weight | Description |
|---|---|---|
| provider_change | 0.25 | Switch to cheaper provider |
| model_change | 0.30 | Use smaller model variant |
| batch_execution | 0.20 | Combine requests into batches |
| parallel_execution | 0.15 | Execute independent tasks in parallel |
| cache_usage | 0.20 | Cache repeated responses |
| worker_allocation | 0.15 | Reduce idle worker count |

## Cost API Endpoints

All routes under `/api/v1/cost/`:

| Method | Path | Description |
|---|---|---|
| GET | `/summary` | Cost summary across all sources |
| GET | `/forecast` | Current forecast data |
| GET | `/recommendations` | Active recommendations |
| GET | `/quotas` | Quota status |
| GET | `/budgets` | All budgets and alerts |
| GET | `/policies` | All policies |
| POST | `/optimize` | Run optimization analysis |
| GET | `/alerts` | Budget and quota alerts |
| GET | `/pricing` | Provider pricing table |
| GET | `/events` | Cost event history |
| GET | `/health` | Engine health status |
| POST | `/policies` | Create/update policy |

## Example Usage

```js
const { CostEngine, getCostEngine } = require('./lib/cost');

const engine = new CostEngine();
const result = engine.analyze({
  ai: [
    { provider: 'openai', model: 'gpt-4o', inputTokens: 10000, outputTokens: 5000 },
    { provider: 'anthropic', model: 'claude-3-haiku', inputTokens: 5000, outputTokens: 2000 }
  ],
  cluster: { workers: [{ status: 'healthy' }, { status: 'healthy' }, { status: 'degraded' }] },
  workflows: [{ id: 'wf-1', status: 'COMPLETED', estimatedCost: 0.05 }],
  deployments: [{ type: 'standard' }],
  storage: [{ type: 'logs', sizeMb: 100 }],
  api: [{ endpoint: '/api/v1/generate', estimatedCost: 0.001 }]
});

console.log(result.totalCost);         // Total cost across all sources
console.log(result.forecast);          // Projected costs
console.log(result.optimization);      // Optimization recommendations
console.log(result.recommendations);   // Scored recommendations
console.log(result.budgetStatus);      // Budget alerts
```

## Integration

The Cost Engine reads from existing systems without modifying them:

- **AI Router** (`lib/ai/`): Token usage and model pricing
- **Cluster** (`lib/cluster/`): Worker count, utilization, queue depth
- **Workflow Engine** (`lib/workflows/`): Execution cost and status
- **Deployment Engine** (`lib/deployment/`): Deployment type and count
- **Telemetry** (`lib/telemetry/`): Storage usage metrics
- **Platform API** (`lib/api/`): API endpoint consumption data

All integrations are read-only — the Cost Engine calls public methods on these engines without modifying any existing code.
