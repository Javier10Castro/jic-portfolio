# A/B Testing — Experimentation Framework — Phase 9.6.0

## Overview

The A/B Testing framework enables controlled experiments comparing prompts, models, and configurations. It handles deterministic traffic splitting, impression/conversion tracking, statistical winner selection with Bayesian confidence, and multi-variant experiment comparison.

## A/B Test Lifecycle

```
1. CREATE  ──►  Define experiment: variants, metrics, traffic split, sample size
                     │
2. START   ──►  Activate traffic splitting and start recording
                     │
3. SPLIT   ──►  Deterministic assignment via seed — each request → variant A or B
                     │
4. RECORD  ──►  Track impressions (total requests) and conversions (success criteria)
                     │
5. ANALYZE ──►  Calculate conversion rates, confidence intervals, statistical significance
                     │
6. SELECT  ──►  Bayesian winner selection with configurable significance threshold
```

## Traffic Splitting

### Deterministic Assignment

Users are consistently assigned to the same variant via a seeded hash:

```js
const variant = abTest.assign('experiment-001', userId);
// Returns 'A' or 'B' based on deterministic hash of (experimentId + userId + seed)
```

### Weighted Distribution

| Variant | Weight | Description |
|---|---|---|
| A (Control) | 50% | Current prompt / model / configuration |
| B (Treatment) | 50% | New prompt / model / configuration |
| C (optional) | 0–100% | Additional variants with custom weights |

### Assignment API

```js
const { ABTestManager } = require('./lib/evaluation/experiments');

const manager = new ABTestManager();

// Create experiment
const experiment = manager.createExperiment({
  name: 'Prompt style comparison',
  variants: [
    { id: 'A', config: { promptId: 'classify-v1', model: 'gpt-4o' }, weight: 0.5 },
    { id: 'B', config: { promptId: 'classify-v2', model: 'gpt-4o' }, weight: 0.5 }
  ],
  metrics: ['conversion', 'quality', 'latency'],
  seed: 42,
  minSampleSize: 1000
});

// Start experiment
manager.startExperiment('exp-001');

// Assign variant to user
const variant = manager.assign('exp-001', 'user-abc-123');
```

## Result Aggregation

| Metric | Description |
|---|---|
| `impressions` | Total number of requests served per variant |
| `conversions` | Number of successful outcomes per variant |
| `conversionRate` | `conversions / impressions` per variant |
| `totalImpressions` | Combined impressions across all variants |
| `totalConversions` | Combined conversions across all variants |

### Recording Results

```js
// Record an impression + conversion
manager.record('exp-001', {
  variantId: 'A',
  userId: 'user-abc-123',
  converted: true,
  metadata: { latencyMs: 450, qualityScore: 0.92 }
});
```

## Winner Selection

### Bayesian Confidence

The system calculates the probability that one variant outperforms another using a Bayesian framework:

```
P(B > A) = BetaBinomial(conversionsB + 1, impressionsB - conversionsB + 1,
                        conversionsA + 1, impressionsA - conversionsA + 1)
```

### Significance Thresholds

| Threshold | Confidence Required | Use Case |
|---|---|---|
| Standard | 95% | General experimentation |
| Strict | 99% | Production-decision experiments |
| Relaxed | 90% | Exploratory testing |

### Winner Selection Example

```js
const result = manager.selectWinner('exp-001', { confidence: 0.95 });
console.log(result);
// {
//   winner: 'B',
//   confidence: 0.973,
//   uplift: 0.12,
//   controlRate: 0.45,
//   treatmentRate: 0.57,
//   significant: true
// }
```

## Experiment Comparison

| Method | Description |
|---|---|
| `rankVariants(experimentId)` | Rank all variants by conversion rate with confidence intervals |
| `pairwiseCompare(experimentId)` | T-test approximation for each variant pair |
| `generateReport(experimentId)` | Full experiment report with all metrics and statistics |

### T-Test Approximation

```
t = (rateB - rateA) / sqrt(seA² + seB²)
se = sqrt(rate * (1 - rate) / impressions)
p-value = 2 * (1 - CDF(t))
```

Where CDF is the Student's t-distribution cumulative distribution function.

### Report Format

```json
{
  "experimentId": "exp-001",
  "name": "Prompt style comparison",
  "duration": { "start": "2026-06-20T00:00:00Z", "end": "2026-06-21T00:00:00Z" },
  "variants": [
    {
      "id": "A",
      "impressions": 523,
      "conversions": 235,
      "conversionRate": 0.449,
      "confidenceInterval": [0.408, 0.491]
    },
    {
      "id": "B",
      "impressions": 518,
      "conversions": 298,
      "conversionRate": 0.575,
      "confidenceInterval": [0.534, 0.616]
    }
  ],
  "winner": {
    "id": "B",
    "confidence": 0.973,
    "uplift": 0.126,
    "significant": true
  },
  "recommendation": "Deploy variant B — statistically significant improvement at 95% confidence"
}
```

## Full Example

```js
const { ABTestManager } = require('./lib/evaluation/experiments');

const ab = new ABTestManager();

// 1. Create experiment
ab.createExperiment({
  id: 'exp-prompt-tone',
  name: 'Tone: Formal vs Casual',
  variants: [
    { id: 'formal', config: { systemPrompt: 'Respond formally...' }, weight: 0.5 },
    { id: 'casual', config: { systemPrompt: 'Respond casually...' }, weight: 0.5 }
  ],
  metrics: ['conversion'],
  seed: 12345,
  minSampleSize: 500
});

// 2. Start
ab.startExperiment('exp-prompt-tone');

// 3. Simulate traffic assignment
for (const userId of userList) {
  const variant = ab.assign('exp-prompt-tone', userId);
  const response = await callAI(variant.config);
  ab.record('exp-prompt-tone', {
    variantId: variant,
    userId,
    converted: evaluateResponse(response)
  });
}

// 4. Select winner
const winner = ab.selectWinner('exp-prompt-tone', { confidence: 0.95 });
console.log(`Winner: ${winner.winner} with ${(winner.confidence * 100).toFixed(1)}% confidence`);
```

## API Endpoints

All routes under `/api/v1/experiments/`:

| Method | Path | Description |
|---|---|---|
| POST | `/` | Create a new A/B experiment |
| GET | `/` | List all experiments |
| GET | `/:id` | Get experiment details |
| PUT | `/:id` | Update experiment configuration |
| DELETE | `/:id` | Delete an experiment |
| POST | `/:id/start` | Start an experiment |
| POST | `/:id/stop` | Stop an experiment |
| POST | `/:id/record` | Record an impression/conversion |
| GET | `/:id/results` | Get aggregated results |
| GET | `/:id/winner` | Get winner selection |
| GET | `/:id/report` | Generate full experiment report |
| GET | `/:id/compare` | Compare experiment variants |
