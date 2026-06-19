# Observability Platform

## Architecture

The Observability Platform provides comprehensive monitoring, tracing, logging, health checking, alerting, and analytics for every engine in the system. It uses an optional telemetry SDK that engines can instrument without tight coupling.

```
Every Engine (optional SDK)
     ↓
Telemetry Manager
     ├── Metrics Collector → Counters, Gauges, Histograms
     ├── Tracing Engine   → Distributed spans, nested trees
     ├── Logger          → Structured JSON (TRACE → ERROR)
     ├── Health Monitor  → Component health checks
     ├── Alert Manager   → Configurable alert rules
     ├── Analytics       → Daily/weekly/monthly reports
     ├── Diagnostics     → System snapshots, error summaries
     └── Event Bus       → Telemetry event pub/sub
     ↓
Telemetry Storage (in-memory, swappable)
     ↓
Platform API (GET /api/v1/telemetry/*)
     ↓
Observability Dashboard
```

## Directory Structure

```
lib/telemetry/
├── index.js                # Entry point — 8 exported functions + all classes
├── telemetryManager.js     # Central manager, auto-collect, enable/disable
├── telemetryStorage.js     # In-memory persistence for all telemetry data
├── metricsCollector.js     # Counters, gauges, histograms, tag support
├── tracingEngine.js        # Distributed tracing, spans, parent-child trees
├── logger.js               # Structured JSON logging, 5 levels
├── healthMonitor.js        # Component health (healthy/degraded/offline/unknown)
├── diagnostics.js          # System snapshots, error summaries, dependency graph
├── analytics.js            # Daily/weekly/monthly analytics reports
├── alertManager.js         # Configurable rules, severity, acknowledge/resolve
└── eventBus.js             # Event pub/sub with wildcard support
```

## Exported Functions

| Function | Description |
|----------|-------------|
| `recordMetric(name, value, type, tags)` | Record a metric (counter/gauge/histogram) |
| `recordTrace(name, service, options)` | Start a distributed trace |
| `recordEvent(type, data)` | Emit a telemetry event |
| `recordLog(level, message, meta)` | Write a structured log entry |
| `getMetrics(filter)` | Query stored metrics |
| `getTraces(filter)` | Query stored traces |
| `getHealth()` | Get current health status of all components |

## Metrics

### Counter
```js
recordMetric('api.requests', 1, 'counter', { endpoint: '/health' })
// or using the collector directly:
manager.metrics.increment('api.requests', 1, { endpoint: '/health' })
```

### Gauge
```js
manager.metrics.gauge('system.memory.heapUsed', 52428800)
```

### Histogram
```js
manager.metrics.histogram('ai.latency', 250, { provider: 'openai' })
manager.metrics.recordLatency('ai.generate', 250, { provider: 'openai' })
```

### Tags
Tags create separate metric dimensions:
```js
manager.metrics.increment('requests', 1, { path: '/api/v1/health' })
manager.metrics.increment('requests', 1, { path: '/api/v1/projects' })
manager.metrics.getCounter('requests', { path: '/api/v1/health' }) // 1
```

### Token Usage
```js
manager.metrics.recordTokenUsage('openai', 150, 80, { model: 'gpt-4' })
```

## Tracing

```js
// Start a root trace
const root = manager.tracing.startTrace('user.request', 'api');

// Start child spans (with explicit parent)
const wfSpan = manager.tracing.startSpan(root.traceId, 'workflow.exec', 'workflow_engine', {
  parentSpanId: root.spanId
});

// End spans
manager.tracing.endSpan(root.traceId, wfSpan.spanId);
manager.tracing.endTrace(root.traceId);

// Get trace tree
const tree = await manager.tracing.getTraceTree(root.traceId);
// tree[0] = { name: 'user.request', children: [{ name: 'workflow.exec', ... }] }
```

### Trace Example
```json
{
  "traceId": "tr-a1b2c3d4e5f6",
  "spanId": "sp-00112233",
  "parentSpanId": null,
  "name": "user.request",
  "service": "api",
  "startTime": 1718800000000,
  "endTime": 1718800005500,
  "duration": 5500,
  "status": "completed",
  "tags": { "method": "POST", "path": "/api/v1/workflows" }
}
```

## Logging

### Levels
TRACE → DEBUG → INFO → WARN → ERROR

### Example
```json
{
  "level": "INFO",
  "message": "Workflow completed",
  "timestamp": 1718800000000,
  "source": "workflow_engine",
  "traceId": "tr-a1b2c3d4",
  "workflowId": "wf-1-a1b2c3",
  "agent": "architect",
  "provider": "openai",
  "latency": 1234,
  "data": { "status": "success" }
}
```

## Health Monitor

Components monitored: `ai_providers`, `workflow_engine`, `deployment_engine`, `api`, `dashboard`, `storage`, `scheduler`, `agent_system`, `conversation_engine`, `generator`, `planner`

```js
manager.health.registerCheck('ai_providers', async () => ({
  status: 'healthy',  // healthy | degraded | offline | unknown
  message: 'All providers responding',
  latency: 45,
  details: { openai: 'ok', anthropic: 'ok' }
}));
const results = await manager.health.runAll();
```

### Health Report Example
```json
{
  "timestamp": 1718800000000,
  "total": 11,
  "healthy": 9,
  "degraded": 1,
  "offline": 1,
  "overall": "degraded",
  "components": {
    "api": { "status": "healthy", "message": "API running" },
    "ai_providers": { "status": "degraded", "message": "OpenAI latency high" },
    "workflow_engine": { "status": "healthy", "message": "Running normally" }
  }
}
```

## Alerts

### Creating Rules
```js
manager.addAlertRule({
  name: 'High AI Latency',
  severity: 'warning',
  condition: (ctx) => ctx.aiLatency?.openai > 5000 ? 'OpenAI latency exceeded 5s' : null
});

// Factory methods
AlertManager.createLatencyRule('AI Check', 'openai', 5000, 'warning');
AlertManager.createFailureRule('Workflow Failures', 'workflow', 10, 'critical');
```

### Alert Example
```json
{
  "id": "alert-m5n6o7-1",
  "ruleId": "rule-1",
  "name": "High AI Latency - openai latency > 5000ms",
  "severity": "warning",
  "status": "active",
  "message": "Latency 6234ms exceeds 5000ms",
  "createdAt": 1718800000000,
  "resolvedAt": null
}
```

## Analytics

Generate daily, weekly, or monthly reports:
```js
const daily = await manager.generateDailyAnalytics();
// { type: 'daily', totalRequests: 150, avgLatency: 250, successRate: 0.98, ... }
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/telemetry/metrics` | Query metrics (filter by `name`, `source`, `since`) |
| GET | `/api/v1/telemetry/traces` | Query traces (filter by `traceId`, `service`, `since`) |
| GET | `/api/v1/telemetry/logs` | Query logs (filter by `level`, `source`, `traceId`, `since`) |
| GET | `/api/v1/telemetry/health` | Get health summary for all components |
| GET | `/api/v1/telemetry/analytics` | Get analytics history (param: `type`, `limit`) |
| GET | `/api/v1/telemetry/alerts` | List alerts (filter by `severity`, `status`, `since`) |
| POST | `/api/v1/telemetry/alerts` | Create alert rule |
| GET | `/api/v1/telemetry/diagnostics` | Get system snapshot + health + errors |

## Dashboard Pages

The Observability dashboard provides 5 tabs: Overview, Metrics, Health, Alerts, Diagnostics.

## Extension Guide

### Instrument an engine
```js
const telemetry = require('./lib/telemetry');

// In your engine:
telemetry.recordMetric('my_engine.operation', 1, 'counter', { type: 'create' });
telemetry.recordLog('INFO', 'Operation completed', { source: 'my_engine', workflowId });

// Tracing
const span = telemetry.recordTrace('my_engine.process', 'my_engine');
// ... do work ...
telemetry.getTelemetryManager().tracing.endSpan(span.traceId, span.spanId);
```

### Add a health check
```js
const manager = telemetry.getTelemetryManager();
manager.health.registerCheck('custom_my_engine', async () => ({
  status: 'healthy',
  message: 'Engine running'
}));
```

### Replace storage backend
```js
const { TelemetryManager } = require('./lib/telemetry');
const manager = new TelemetryManager({ storage: myCustomStorage });
```
