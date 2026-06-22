# AI Evaluation & Learning Platform — Phase 9.6.0

## Overview

The Evaluation Platform measures AI quality across all engines. It provides prompt versioning, benchmarking, experiments, A/B testing, LLM-as-a-Judge, model comparison, agent evaluation, and continuous learning.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               Evaluation Manager                                                  │
│  Orchestrates all evaluation workflows — register, run, store, report                             │
│                                                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐  │
│  │ Registry │  │  Runner  │  │ Storage  │  │  Events  │  │ Metrics  │  │Scheduler │  │History│  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──┬───┘  │
│       │              │              │              │              │              │           │      │
│  ┌────▼──────────────▼──────────────▼──────────────▼──────────────▼──────────────▼───────────▼───┐ │
│  │                          Reports & Insights Engine                                            │ │
│  └───────────────────────────────────┬───────────────────────────────────────────────────────────┘ │
│                                      │                                                             │
│  ┌───────────────────────────────────▼───────────────────────────────────────────────────────────┐ │
│  │  Sub-Modules                                                                                  │ │
│  │  ┌────────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │ │
│  │  │  Prompts   │ │Experiments│ │Benchmarks│ │  Models  │ │  Agents  │ │  Judge   │ │Datasets│ │ │
│  │  └────────────┘ └───────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘ │ │
│  │  ┌────────────┐ ┌───────────┐                                                                │ │
│  │  │  Learning  │ │  Reports  │                                                                │ │
│  │  └────────────┘ └───────────┘                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                  │
│  Integration → Plugin SDK | AI Router | Control Plane                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

| Class | Module | Purpose |
|---|---|---|
| `EvaluationManager` | `lib/evaluation/evaluationManager.js` | Central orchestrator — `register()`, `run()`, `getResults()`, `getReport()`, `compare()`, `getHealth()` |
| `RegistryService` | `lib/evaluation/registry/registryService.js` | Register/unregister evaluators, prompt templates, models, and agents |
| `EvaluationRunner` | `lib/evaluation/runner/evaluationRunner.js` | Execute evaluations — single, batch, scheduled, parallel |
| `EvaluationStorage` | `lib/evaluation/storage/evaluationStorage.js` | Persist results, snapshots, and reports to configured backends |
| `MetricsCalculator` | `lib/evaluation/metrics/metricsCalculator.js` | Compute quality, accuracy, consistency, latency, cost, hallucination scores |
| `SchedulerService` | `lib/evaluation/scheduler/schedulerService.js` | Cron-based and event-driven evaluation scheduling |
| `HistoryService` | `lib/evaluation/history/historyService.js` | Result history, trends, regression detection |
| `ReportsEngine` | `lib/evaluation/reports/reportsEngine.js` | Generate structured reports, CSV export, comparison views |
| `EventsService` | `lib/evaluation/events/eventsService.js` | EventBus integration — 12 evaluation event types |

## Sub-Modules

| Sub-Module | Description |
|---|---|
| Prompt Registry | Versioned prompt templates with variable injection, snapshots, rollback |
| Experiments | Parameterized experiment configurations with result tracking |
| Benchmark Suites | Standardized benchmark definitions, preset suites, methodology |
| Model Comparison | Side-by-side model evaluation with statistical scoring |
| Agent Evaluation | Multi-step agent trajectory scoring and tool call assessment |
| LLM-as-a-Judge | AI-powered evaluation with customizable rubrics |
| Dataset Management | Train/test splits, CSV/JSON import/export, versioned datasets |
| Continuous Learning | Feedback loop, recommendations, improvement planning |

## Execution Flow

```
1. REGISTER  ──►  Register evaluators, prompts, models, datasets with RegistryService
                        │
2. CONFIGURE  ──►  Configure experiment parameters, benchmark suites, A/B tests
                        │
3. RUN        ──►  EvaluationRunner executes evaluations (single/batch/scheduled)
                        │
4. RECORD     ──►  MetricsCalculator computes scores across all dimensions
                        │
5. STORE      ──►  EvaluationStorage persists results, history, and snapshots
                        │
6. REPORT     ──►  ReportsEngine generates structured reports with comparisons
                        │
7. LEARN      ──►  Learning module analyzes results, generates recommendations
```

## Scoring Formula

```
overall = quality * 0.30 +
          accuracy * 0.20 +
          consistency * 0.15 +
          latency * 0.15 +
          cost * 0.10 +
          (1 - hallucination) * 0.10
```

| Dimension | Weight | Description | Range |
|---|---|---|---|
| Quality | 0.30 | Relevance, coherence, completeness, clarity | 0.0–1.0 |
| Accuracy | 0.20 | Factual correctness, hallucination-free | 0.0–1.0 |
| Consistency | 0.15 | Response stability across identical inputs | 0.0–1.0 |
| Latency | 0.15 | Normalized response speed (higher = faster) | 0.0–1.0 |
| Cost | 0.10 | Cost efficiency (higher = cheaper per token) | 0.0–1.0 |
| Hallucination | 0.10 | Penalty factor — factual fabrication rate | 0.0–1.0 |

## Report Format

| Field | Type | Description |
|---|---|---|
| `overallScore` | float | Weighted composite score (0.0–1.0) |
| `qualityScore` | float | Quality dimension score |
| `latencyMs` | int | Average response latency in milliseconds |
| `costPerRequest` | float | Average cost per evaluation request |
| `accuracyRate` | float | Percentage of accurate responses |
| `consistencyScore` | float | Response consistency across runs |
| `hallucinationRate` | float | Percentage of hallucinated content |
| `suggestions` | string[] | AI-generated improvement suggestions |

## API Reference

All routes under `/api/v1/evaluation/`:

| Method | Path | Description |
|---|---|---|
| POST | `/evaluators` | Register a new evaluator |
| GET | `/evaluators` | List all registered evaluators |
| GET | `/evaluators/:id` | Get evaluator details |
| PUT | `/evaluators/:id` | Update evaluator configuration |
| DELETE | `/evaluators/:id` | Unregister an evaluator |
| POST | `/run` | Execute an evaluation run |
| GET | `/runs` | List evaluation run history |
| GET | `/runs/:id` | Get evaluation run results |
| GET | `/runs/:id/report` | Generate structured report for a run |
| POST | `/compare` | Compare multiple runs or variants |
| GET | `/metrics` | Get aggregated metrics across runs |
| GET | `/history` | Get historical evaluation trends |
| GET | `/health` | Engine health status |
| POST | `/datasets/import` | Import evaluation dataset (CSV/JSON) |

## Scoring Algorithm Details

```
quality = (relevance + coherence + completeness + clarity) / 4
accuracy = correctResponses / totalResponses
consistency = 1 - variance(responses)  // Lower variance = higher consistency
latency = 1 - (avgLatency - minLatency) / (maxLatency - minLatency)
cost = 1 - (avgCost - minCost) / (maxCost - minCost)
hallucination = detectedHallucinations / totalStatements
```

## Example Usage

```js
const { EvaluationManager } = require('./lib/evaluation');

const manager = new EvaluationManager();

// Register an evaluator
manager.register({
  type: 'prompt',
  promptId: 'prompt-v3',
  model: 'gpt-4o',
  dataset: 'qa-benchmark-v1'
});

// Run evaluation
const result = manager.run({ evaluatorId: 'eval-001' });

// Get report
const report = manager.getReport(result.runId);
console.log(report);
// {
//   overallScore: 0.87,
//   qualityScore: 0.92,
//   latencyMs: 1234,
//   costPerRequest: 0.0032,
//   accuracyRate: 0.95,
//   consistencyScore: 0.88,
//   hallucinationRate: 0.02,
//   suggestions: ["Consider adding system prompt guardrails..."]
// }
```

## Integration Points

| Integration | Mechanism | Purpose |
|---|---|---|
| Plugin SDK | `PluginSDK.evaluate()` | Third-party evaluator plugins |
| AI Router | `AIRouter.evaluate()` | Route evaluation requests to correct model/provider |
| Control Plane | `ControlPlane.report()` | Dashboards, alerts, monitoring |
| EventBus | Event-driven | Notify subscribers of evaluation events |
| Storage Backend | Configurable adapter | Persist results (filesystem, S3, DB) |
