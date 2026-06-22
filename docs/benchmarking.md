# Benchmarking — Suites & Methodology — Phase 9.6.0

## Overview

The Benchmarking module provides standardized test suites for measuring AI model performance across multiple dimensions. Define benchmark suites, register datasets, run standardized evaluations, and track results over time to monitor regressions and improvements.

## Suite Management

| Method | Description |
|---|---|
| `createSuite(id, config)` | Define a new benchmark suite with name, description, and test list |
| `getSuite(id)` | Retrieve suite configuration and metadata |
| `updateSuite(id, changes)` | Modify suite tests, weights, or configuration |
| `listSuites(filter?)` | List all suites with optional tag/domain filter |
| `deleteSuite(id)` | Remove a suite and its results |
| `addTest(suiteId, test)` | Add a new test case to an existing suite |
| `removeTest(suiteId, testId)` | Remove a test case from a suite |

## Preset Suites

| Suite | ID | Tests | Focus |
|---|---|---|---|
| Accuracy | `benchmark-accuracy` | 50 factual QA pairs | Factual correctness, hallucination rate |
| Reasoning | `benchmark-reasoning` | 30 multi-step logic puzzles | Chain-of-thought, logical deduction |
| Code | `benchmark-code` | 40 coding challenges | Code generation, bug fixing, explanation |
| Summarization | `benchmark-summarization` | 25 document summarization tasks | Conciseness, completeness, fidelity |
| Safety | `benchmark-safety` | 35 adversarial prompts | Content filtering, refusal rate, bias |

### Preset Suite Configuration

```js
{
  id: 'benchmark-accuracy',
  name: 'Accuracy Benchmark',
  description: 'Measures factual correctness across domains',
  tests: [
    { id: 'fact-001', input: 'What is the capital of France?', expected: 'Paris', weight: 1.0 },
    { id: 'fact-002', input: 'What year did WW2 end?', expected: '1945', weight: 1.0 }
  ],
  scoring: {
    method: 'weighted',
    passThreshold: 0.8,
    weights: { factual: 0.6, citation: 0.2, completeness: 0.2 }
  },
  tags: ['accuracy', 'factual']
}
```

## Dataset Management

| Method | Description |
|---|---|
| `registerDataset(id, records, options)` | Register a new dataset with labeled records |
| `splitDataset(id, trainRatio)` | Split into train/test sets (default 80/20) |
| `importCSV(filePath, mapping)` | Import dataset from CSV with column mapping |
| `importJSON(filePath)` | Import dataset from JSON file |
| `exportDataset(id, format)` | Export dataset as CSV or JSON |
| `getDataset(id)` | Retrieve dataset records and metadata |
| `listDatasets()` | List all registered datasets |

### Dataset Record Schema

```json
{
  "id": "rec-001",
  "input": "Explain quantum entanglement in simple terms",
  "expected": "Quantum entanglement is when two particles are linked...",
  "metadata": {
    "difficulty": "medium",
    "category": "science",
    "source": "custom"
  }
}
```

### Dataset Operations Example

```js
const { BenchmarkManager } = require('./lib/evaluation/benchmarks');

const manager = new BenchmarkManager();

// Import dataset
manager.importCSV('./data/qa-dataset.csv', {
  inputColumn: 'question',
  expectedColumn: 'answer',
  idColumn: 'id'
});

// Split into train/test
const { train, test } = manager.splitDataset('qa-v1', 0.8);
// train: 80 records, test: 20 records

// Export results
manager.exportResults('bench-run-001', 'csv');
```

## Results Analysis

| Method | Description |
|---|---|
| `getResults(runId)` | Get detailed results for a specific benchmark run |
| `getTrends(suiteId, period)` | Score trends over time (daily/weekly/monthly) |
| `getHistory(suiteId)` | Full historical run data for a suite |
| `compareSuites(suiteIds)` | Side-by-side comparison across multiple suites |
| `exportRunCSV(runId)` | Export run results as CSV for external analysis |

### Results Format

```json
{
  "runId": "bench-run-001",
  "suiteId": "benchmark-accuracy",
  "timestamp": "2026-06-20T12:00:00.000Z",
  "model": "gpt-4o",
  "results": [
    {
      "testId": "fact-001",
      "passed": true,
      "score": 0.98,
      "output": "Paris",
      "latencyMs": 450
    },
    {
      "testId": "fact-002",
      "passed": true,
      "score": 1.0,
      "output": "1945",
      "latencyMs": 320
    }
  ],
  "aggregate": {
    "passRate": 0.94,
    "averageScore": 0.91,
    "averageLatencyMs": 520,
    "totalCost": 0.045
  }
}
```

## Benchmark Methodology

### Weighted Scoring

```
testScore = correctness * weight
suiteScore = Σ(testScore) / Σ(weights)

passRate = passedTests / totalTests
```

### Pass/Fail Thresholds

| Rating | Pass Rate | Score Range | Action |
|---|---|---|---|
| Excellent | ≥ 95% | 0.90 – 1.00 | Deploy to production |
| Good | ≥ 85% | 0.75 – 0.89 | Review minor failures |
| Acceptable | ≥ 70% | 0.60 – 0.74 | Investigate issues |
| Poor | < 70% | 0.00 – 0.59 | Block deployment |

### Running a Benchmark

```js
const { BenchmarkManager } = require('./lib/evaluation/benchmarks');

const manager = new BenchmarkManager();

// Run a preset suite
const result = manager.runSuite('benchmark-accuracy', {
  model: 'gpt-4o',
  provider: 'openai',
  temperature: 0
});

console.log(`Pass Rate: ${result.aggregate.passRate}`);
console.log(`Avg Score: ${result.aggregate.averageScore}`);

// Compare two models on the same suite
const comparison = manager.compareModels('benchmark-reasoning', {
  models: ['gpt-4o', 'claude-3-opus']
});
```

## API Endpoints

All routes under `/api/v1/benchmarks/`:

| Method | Path | Description |
|---|---|---|
| POST | `/suites` | Create a new benchmark suite |
| GET | `/suites` | List all suites |
| GET | `/suites/:id` | Get suite details |
| PUT | `/suites/:id` | Update suite configuration |
| DELETE | `/suites/:id` | Delete a suite |
| POST | `/suites/:id/tests` | Add test to suite |
| DELETE | `/suites/:id/tests/:testId` | Remove test from suite |
| POST | `/run` | Execute a benchmark suite |
| GET | `/runs` | List benchmark runs |
| GET | `/runs/:id` | Get run results |
| GET | `/runs/:id/export` | Export run results as CSV |
| GET | `/trends/:suiteId` | Get score trends |
| GET | `/compare` | Compare suites or models |
| POST | `/datasets` | Register a dataset |
| POST | `/datasets/import` | Import dataset (CSV/JSON) |
| GET | `/datasets` | List datasets |
