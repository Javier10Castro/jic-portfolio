# Continuous Learning — Improvement Loop — Phase 9.6.0

## Overview

The Continuous Learning module closes the AI quality feedback loop. It collects evaluation results and user feedback, identifies patterns and improvement opportunities, generates actionable recommendations, and enables structured improvement planning with progress tracking.

## The Improvement Loop

```
                    ┌─────────────────────────┐
                    │       EVALUATE           │
                    │  Run benchmarks, A/B     │
                    │  tests, judge evaluations │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    COLLECT FEEDBACK      │
                    │  Evaluation results,     │
                    │  user ratings, issues    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │       ANALYZE            │
                    │  Trends, sentiment,      │
                    │  issue frequency,        │
                    │  correlation analysis    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      RECOMMEND           │
                    │  Generate improvement    │
                    │  suggestions with impact │
                    │  scores and confidence   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │        PLAN              │
                    │  Create improvement      │
                    │  plans, assign steps,    │
                    │  set targets             │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      IMPLEMENT           │
                    │  Apply changes to        │
                    │  prompts, configs,       │
                    │  models, or agents       │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     RE-EVALUATE          │
                    │  Run same benchmarks     │
                    │  to measure improvement  │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      LOOP ────►          │
                    └─────────────────────────┘
```

## Feedback Collection

### Sources

| Source | Type | Description |
|---|---|---|
| Evaluation Results | Structured | Benchmark scores, judge evaluations, A/B test results |
| User Feedback | Structured/Unstructured | Thumbs up/down, ratings, free-text comments |
| System Metrics | Numeric | Latency, cost, error rates, token usage |
| Issue Reports | Structured | Bug reports, regression flags, edge cases |

### Collection API

```js
const { LearningManager } = require('./lib/evaluation/learning');

const learning = new LearningManager();

// Collect evaluation feedback
learning.collectFeedback({
  source: 'benchmark',
  sourceId: 'bench-run-001',
  type: 'score',
  value: 0.87,
  metadata: { suiteId: 'benchmark-accuracy', model: 'gpt-4o' }
});

// Collect user feedback
learning.collectFeedback({
  source: 'user',
  sourceId: 'conv-abc-123',
  type: 'rating',
  value: 4,
  metadata: { userId: 'user-001', comment: 'Could be more concise' }
});
```

### Feedback Querying

| Method | Description |
|---|---|
| `getFeedback(filter)` | Query feedback with filters by source, type, date range |
| `getStatistics(source, period)` | Aggregated statistics per source over a time period |
| `getFeedbackTrends(metric, period)` | Trend data for a specific metric over time |

## Feedback Aggregation

| Method | Description |
|---|---|
| `aggregateTrends(metric, period)` | Compute trend direction and magnitude for a metric |
| `analyzeSentiment(comments[])` | Sentiment analysis on free-text feedback |
| `computeIssueFrequency(category)` | Issue frequency analysis by category |
| `findCorrelations(metricA, metricB)` | Correlation analysis between two metrics |

### Aggregation Example

```js
// Get trends
const trends = learning.aggregateTrends('quality', 'weekly');
// [{ date: '2026-06-14', avgScore: 0.82, count: 45 },
//  { date: '2026-06-21', avgScore: 0.87, count: 52 }]

// Analyze sentiment
const sentiment = learning.analyzeSentiment(feedbackComments);
// { positive: 0.65, neutral: 0.22, negative: 0.13, topPhrases: [...] }

// Find correlations
const correlation = learning.findCorrelations('latency', 'quality');
// { coefficient: -0.32, strength: 'moderate', direction: 'negative' }
```

## Recommendation Engine

The recommendation engine analyzes collected feedback and evaluation results to generate prioritized improvement suggestions.

### Recommendation Generation

```js
const recommendations = learning.generateRecommendations();

console.log(recommendations);
// [
//   {
//     id: 'rec-001',
//     type: 'prompt_optimization',
//     title: 'Improve system prompt clarity',
//     description: 'Accuracy scores dropped 12% for multi-step instructions',
//     impact: 0.85,        // Estimated improvement potential (0–1)
//     confidence: 0.78,    // Statistical confidence in recommendation
//     effort: 'medium',    // low | medium | high
//     metrics: ['accuracy', 'consistency'],
//     source: 'benchmark-accuracy',
//     supportingData: { /* trend charts, issue examples */ }
//   }
// ]
```

### Recommendation Types

| Type | Description | Typical Impact |
|---|---|---|
| `prompt_optimization` | Rewrite or restructure prompts | High |
| `model_upgrade` | Switch to a different model | High |
| `temperature_tuning` | Adjust generation parameters | Medium |
| `context_improvement` | Improve context or grounding data | High |
| `guardrail_addition` | Add safety or formatting guardrails | Medium |
| `cost_optimization` | Reduce cost without quality loss | Medium |
| `dataset_improvement` | Improve training or evaluation data | High |

### Apply or Dismiss

```js
// Apply a recommendation
learning.applyRecommendation('rec-001', {
  action: 'update_prompt',
  promptId: 'system-classifier-v2',
  newTemplate: 'Improved template...'
});

// Dismiss with reason
learning.dismissRecommendation('rec-002', {
  reason: 'already_addressed',
  note: 'Fixed in v3 rollout'
});
```

## Improvement Planning

### Create Improvement Plan

```js
const plan = learning.createPlan({
  title: 'Q3 Accuracy Improvement',
  goal: 'Improve accuracy benchmark score from 0.82 to 0.92',
  targetDate: '2026-09-30',
  steps: [
    {
      id: 'step-001',
      title: 'Rewrite system prompt for classifier',
      assignee: 'team-ai',
      status: 'in_progress',
      priority: 'high',
      estimatedImpact: 0.06
    },
    {
      id: 'step-002',
      title: 'Upgrade to gpt-4o-mini for classification tasks',
      assignee: 'team-ml',
      status: 'pending',
      priority: 'medium',
      estimatedImpact: 0.04
    },
    {
      id: 'step-003',
      title: 'Add few-shot examples to prompt',
      assignee: 'team-ai',
      status: 'pending',
      priority: 'high',
      estimatedImpact: 0.03
    }
  ],
  metrics: ['accuracy', 'consistency']
});
```

### Plan Tracking

| Method | Description |
|---|---|
| `getPlan(planId)` | Retrieve plan with step progress |
| `updateStep(planId, stepId, status)` | Update step status (pending, in_progress, completed, blocked) |
| `getPlanProgress(planId)` | Overall completion percentage and impact achieved |
| `measureImpact(planId)` | Compare metrics before and after plan implementation |

### Progress Example

```js
const progress = learning.getPlanProgress('plan-001');
// {
//   planId: 'plan-001',
//   completion: 33,           // percentage of steps completed
//   metricsBefore: { accuracy: 0.82, consistency: 0.78 },
//   metricsAfter: { accuracy: 0.88, consistency: 0.83 },
//   improvement: { accuracy: 0.06, consistency: 0.05 },
//   remainingImpact: 0.04
// }
```

## Full Example

```js
const { LearningManager } = require('./lib/evaluation/learning');

const learning = new LearningManager();

// Phase 1: Collect feedback from multiple sources
learning.collectFeedback({ source: 'benchmark', sourceId: 'run-001', type: 'score', value: 0.79 });
learning.collectFeedback({ source: 'user', sourceId: 'conv-001', type: 'rating', value: 3 });

// Phase 2: Generate recommendations
const recs = learning.generateRecommendations();
const topRec = recs.sort((a, b) => b.impact - a.impact)[0];

// Phase 3: Create improvement plan
const plan = learning.createPlan({
  title: `Address: ${topRec.title}`,
  goal: topRec.description,
  steps: [
    { title: topRec.title, priority: 'high', estimatedImpact: topRec.impact }
  ],
  metrics: topRec.metrics
});

// Phase 4: Track progress
learning.updateStep(plan.id, plan.steps[0].id, 'in_progress');

// Phase 5: After implementation, measure impact
const impact = learning.measureImpact(plan.id);
console.log(`Improvement: ${impact.improvement}`);
```

## API Endpoints

All routes under `/api/v1/learning/`:

| Method | Path | Description |
|---|---|---|
| POST | `/feedback` | Collect feedback |
| GET | `/feedback` | Query collected feedback |
| GET | `/feedback/stats` | Feedback statistics |
| GET | `/feedback/trends` | Feedback trends over time |
| GET | `/recommendations` | Get generated recommendations |
| POST | `/recommendations/generate` | Generate new recommendations |
| POST | `/recommendations/:id/apply` | Apply a recommendation |
| POST | `/recommendations/:id/dismiss` | Dismiss a recommendation |
| POST | `/plans` | Create an improvement plan |
| GET | `/plans` | List improvement plans |
| GET | `/plans/:id` | Get plan details |
| PUT | `/plans/:id/steps/:stepId` | Update step status |
| GET | `/plans/:id/progress` | Get plan progress |
| GET | `/plans/:id/impact` | Measure impact of plan |
