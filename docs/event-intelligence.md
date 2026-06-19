# Event Intelligence Layer — Phase 8.3.0

## Architecture

```
EventBus (on*)
    │
    ▼
IntelligenceEngine.ingest(event)
    │
    ├──► EventScorer          → importance, urgency, systemImpact
    ├──► PatternDetector       → repeated_failures, retry_loops, cluster_imbalance, etc.
    ├──► AnomalyDetector       → error_rate_spikes, volume_spikes, latency anomalies
    ├──► CorrelationEngine     → graph nodes + temporal/causal edges
    └──► InsightGenerator      → actionable recommendations
            │
            ├──► IntelligenceStore (in-memory)
            └──► eventBus.emit('intelligence.insight', ...)
                    │
                    ▼
              Dashboard + API
```

## Detection Models

### Pattern Detection (patternDetector.js)

| Pattern | Trigger | Severity | Affected Systems |
|---------|---------|----------|-----------------|
| `repeated_failures` | 3+ failures in 60s | high → critical | event.source |
| `retry_loop_detected` | 3+ retries of same workflow/task in 120s | high | workflow |
| `cluster_imbalance` | queueDepth > workerCount × 5 | high | cluster, worker |
| `ai_fallback_chain` | 2+ fallback events in 300s | medium | ai, provider |
| `high_latency_burst` | avg latency > 3000ms (3+ samples) | medium | event.source |
| `unexpected_state_transition` | running→completed, failed→running, etc. | medium | workflow |

### Anomaly Detection (anomalyDetector.js)

Uses rolling-window z-score approximation (no external dependencies):

- **error_rate_spike**: z-score of error event rate in 10s sliding window
- **volume_spike**: z-score of total event rate in 5s sliding window
- **latency_anomaly**: z-score of individual latency values against rolling history
- **invalid_state_transition**: blocked transitions (completed→running, cancelled→running)
- **orphaned_correlation**: correlationId with 20+ events but no completion

Default thresholds: windowSize=100, zScoreThreshold=2.5

## Correlation Graph

Graph-based model with nodes and edges:

- **Nodes**: `{type}:{source}` — unique per event-type/source pair
- **Temporal edges**: linked by shared `correlationId`
- **Causal edges**: predefined rules (e.g., `workflow.failure` → `agent.task.failure`)
- **Correlation nodes**: `corr:{correlationId}` aggregates all events in a trace

## Scoring System (eventScorer.js)

Each event scored on 3 dimensions (0–100):

| Dimension | Factors |
|-----------|---------|
| **importance** | severity * weight + source * weight + type keywords + payload errors |
| **urgency** | severity + recency (<30s bonus) + failure count |
| **systemImpact** | severity × 0.6 + source × 0.4 + cascade bonus + worker impact |

Severity weights: critical=100, high=75, medium=50, low=25, info=5

## Insight Generation (insightGenerator.js)

7 rules evaluate patterns + anomalies to produce insights:

| Rule | Condition | Example Insight |
|------|-----------|----------------|
| `retry_backoff_too_aggressive` | 2+ retry_loop patterns | "Increase retry backoff to 2x" (auto-fix) |
| `cluster_underprovisioned` | 2+ cluster_imbalance patterns | "Add 2-3 additional workers" |
| `ai_provider_degradation` | 1+ fallback chain | "Consider circuit breaker" (auto-fix) |
| `error_rate_anomaly` | 1+ error_rate_spike | "Investigate recent deployments" |
| `latency_degradation` | 2+ latency anomalies | "Scale resources" |
| `state_transition_error` | 1+ invalid transition | "Check state machine rules" (auto-fix) |
| `system_stable` | No anomalies or patterns | "System operating normally" |

## API Endpoints

All available via the IntelligenceAPI class:

| Method | Endpoint | Returns |
|--------|----------|---------|
| `GET` | `/api/v1/events/insights` | Recent actionable insights |
| `GET` | `/api/v1/events/patterns` | Detected event patterns |
| `GET` | `/api/v1/events/anomalies` | Detected anomalies |
| `GET` | `/api/v1/events/correlation-graph` | Graph nodes + edges |
| `GET` | `/api/v1/events/health-intelligence` | Combined health + insights + graph |

## Example Insight JSON

```json
{
  "id": "insight-a1b2c3d4",
  "timestamp": 1719000000000,
  "rule": "retry_backoff_too_aggressive",
  "confidence": 0.75,
  "insight": "Workflow retry loop detected across multiple workflows",
  "recommendation": "Increase retry backoff multiplier from 2x to 3x and add jitter",
  "autoFixAvailable": true,
  "priority": "high"
}
```

## Real-World Use Cases

1. **Auto-scaling trigger**: Cluster imbalance pattern → scale workers
2. **Provider failover**: AI fallback chain → switch default provider
3. **Incident detection**: Error rate spike + latency anomalies → page on-call
4. **Cost optimization**: Repeated retries → tune backoff configuration
5. **State machine validation**: Invalid transitions → fix workflow definitions

## Performance

Target: <5ms per event (verified by 100-event and 500-event burst tests)

## Extension Guide

To add a new pattern detector:
```js
class CustomDetector {
  ingest(event) {
    // return array of { pattern, severity, confidence, affectedSystems, detail }
  }
}
```

To add a new insight rule:
```js
const rule = {
  name: 'my_custom_insight',
  condition: (ctx) => ({ match: true, confidence: 0.8 }),
  generate: () => ({ insight, recommendation, autoFixAvailable, priority }),
};
```

Register in `insightGenerator.js` INSIGHT_RULES array.

## Files

```
lib/events/intelligence/
  ├── index.js                  — exports + attachToEventBus helper
  ├── intelligenceEngine.js     — central orchestrator
  ├── patternDetector.js        — real-time pattern detection
  ├── anomalyDetector.js        — z-score based anomaly detection
  ├── correlationEngine.js      — graph-based correlation
  ├── insightGenerator.js       — rule-based insight generation
  ├── eventScorer.js            — importance/urgency/impact scoring
  ├── intelligenceStore.js      — in-memory + JSON serialization
  ├── intelligenceAPI.js        — 5 REST API bindings
  └── eventScorer.js            — event prioritization
```
