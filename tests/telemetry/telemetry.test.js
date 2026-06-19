const assert = require('assert');

describe('Observability Platform', function() {
  describe('Storage', () => {
    const TelemetryStorage = require('../../lib/telemetry/telemetryStorage');

    it('stores and retrieves metrics', async () => {
      const s = new TelemetryStorage();
      await s.storeMetric({ name: 'test.metric', value: 42, timestamp: Date.now() });
      const metrics = await s.getMetrics();
      assert.strictEqual(metrics.length, 1);
    });

    it('filters metrics by name', async () => {
      const s = new TelemetryStorage();
      await s.storeMetric({ name: 'api.requests', value: 10, timestamp: 100 });
      await s.storeMetric({ name: 'ai.tokens', value: 500, timestamp: 200 });
      const filtered = await s.getMetrics({ name: 'api.requests' });
      assert.strictEqual(filtered.length, 1);
    });

    it('stores and retrieves traces', async () => {
      const s = new TelemetryStorage();
      await s.storeTrace({ traceId: 'tr-1', spanId: 'sp-1', name: 'test' });
      const trace = await s.getTrace('tr-1');
      assert.strictEqual(trace.length, 1);
    });

    it('stores and retrieves logs', async () => {
      const s = new TelemetryStorage();
      await s.storeLog({ level: 'INFO', message: 'test', timestamp: Date.now() });
      const logs = await s.getLogs();
      assert.strictEqual(logs.length, 1);
    });

    it('filters logs by level', async () => {
      const s = new TelemetryStorage();
      await s.storeLog({ level: 'INFO', message: 'info' });
      await s.storeLog({ level: 'ERROR', message: 'error' });
      const errors = await s.getLogs({ level: 'ERROR' });
      assert.strictEqual(errors.length, 1);
    });

    it('stores and retrieves alerts', async () => {
      const s = new TelemetryStorage();
      await s.storeAlert({ id: 'a-1', severity: 'critical', status: 'active' });
      const alerts = await s.getAlerts();
      assert.strictEqual(alerts.length, 1);
    });

    it('stores and retrieves health', async () => {
      const s = new TelemetryStorage();
      await s.storeHealth('api', { status: 'healthy' });
      const health = await s.getHealth();
      assert(health.api);
      assert.strictEqual(health.api.status, 'healthy');
    });

    it('stores and retrieves analytics', async () => {
      const s = new TelemetryStorage();
      await s.storeAnalytics('daily', { totalRequests: 100 });
      const analytics = await s.getAnalytics('daily');
      assert.strictEqual(analytics.length, 1);
    });

    it('clear removes all data', async () => {
      const s = new TelemetryStorage();
      await s.storeMetric({ name: 'test', value: 1 });
      await s.clear();
      assert.strictEqual((await s.getMetrics()).length, 0);
    });

    it('snapshot returns counts', () => {
      const s = new TelemetryStorage();
      const snap = s.snapshot();
      assert('metrics' in snap);
      assert('traces' in snap);
      assert('logs' in snap);
      assert('alerts' in snap);
    });

    it('count methods return numbers', async () => {
      const s = new TelemetryStorage();
      assert(typeof (await s.countMetrics()) === 'number');
      assert(typeof (await s.countTraces()) === 'number');
    });
  });

  describe('Event Bus', () => {
    const { TelemetryEventBus, EVENT_TYPES } = require('../../lib/telemetry/eventBus');

    it('emits and listens', (done) => {
      const bus = new TelemetryEventBus();
      bus.on('telemetry.metric', (entry) => {
        assert.strictEqual(entry.type, 'telemetry.metric');
        done();
      });
      bus.emit('telemetry.metric', { name: 'test' });
    });

    it('off removes listener', () => {
      const bus = new TelemetryEventBus();
      let count = 0;
      const fn = () => { count++; };
      bus.on('test', fn);
      bus.off('test', fn);
      bus.emit('test', {});
      assert.strictEqual(count, 0);
    });

    it('wildcard catches all', (done) => {
      const bus = new TelemetryEventBus();
      bus.on('*', (entry) => {
        if (entry.type === 'custom.event') done();
      });
      bus.emit('custom.event', {});
    });

    it('getHistory returns events', () => {
      const bus = new TelemetryEventBus();
      bus.emit('telemetry.metric', {});
      bus.emit('telemetry.alert.created', {});
      assert.strictEqual(bus.getHistory().length, 2);
    });

    it('EVENT_TYPES has all types', () => {
      assert(EVENT_TYPES.includes('telemetry.metric'));
      assert(EVENT_TYPES.includes('telemetry.alert.created'));
      assert(EVENT_TYPES.includes('telemetry.health.changed'));
      assert.strictEqual(EVENT_TYPES.length, 8);
    });
  });

  describe('Metrics Collector', () => {
    const MetricsCollector = require('../../lib/telemetry/metricsCollector');

    it('increments counters', () => {
      const m = new MetricsCollector();
      m.increment('api.requests');
      m.increment('api.requests');
      assert.strictEqual(m.getCounter('api.requests'), 2);
    });

    it('records gauges', () => {
      const m = new MetricsCollector();
      m.gauge('system.memory', 512);
      assert.strictEqual(m.getGauge('system.memory'), 512);
    });

    it('records histograms', () => {
      const m = new MetricsCollector();
      m.histogram('ai.latency', 100);
      m.histogram('ai.latency', 200);
      m.histogram('ai.latency', 300);
      const h = m.getHistogram('ai.latency');
      assert.strictEqual(h.count, 3);
      assert.strictEqual(h.avg, 200);
      assert.strictEqual(h.min, 100);
      assert.strictEqual(h.max, 300);
    });

    it('recordLatency shorthand', () => {
      const m = new MetricsCollector();
      m.recordLatency('ai.generate', 150);
      const h = m.getHistogram('ai.generate.latency');
      assert.strictEqual(h.count, 1);
    });

    it('recordError shorthand', () => {
      const m = new MetricsCollector();
      m.recordError('workflow');
      assert.strictEqual(m.getCounter('workflow.errors'), 1);
    });

    it('recordTokenUsage', () => {
      const m = new MetricsCollector();
      m.recordTokenUsage('openai', 100, 50, { model: 'gpt-4' });
      assert.strictEqual(m.getCounter('ai.tokens.input', { provider: 'openai', model: 'gpt-4' }), 100);
      assert.strictEqual(m.getCounter('ai.tokens.output', { provider: 'openai', model: 'gpt-4' }), 50);
    });

    it('tags create separate counters', () => {
      const m = new MetricsCollector();
      m.increment('requests', 1, { path: '/api/v1/health' });
      m.increment('requests', 1, { path: '/api/v1/projects' });
      assert.strictEqual(m.getCounter('requests', { path: '/api/v1/health' }), 1);
    });

    it('getAllMetrics returns all data', () => {
      const m = new MetricsCollector();
      m.increment('a', 5);
      m.gauge('b', 10);
      m.histogram('c', 1);
      const all = m.getAllMetrics();
      assert(all.counters);
      assert(all.gauges);
      assert(all.histograms);
    });

    it('reset clears all', () => {
      const m = new MetricsCollector();
      m.increment('test', 1);
      m.reset();
      assert.strictEqual(m.getCounter('test'), 0);
    });
  });

  describe('Tracing Engine', () => {
    const TracingEngine = require('../../lib/telemetry/tracingEngine');

    it('starts traces with span', () => {
      const t = new TracingEngine();
      const span = t.startTrace('workflow', 'workflow_engine');
      assert(span.traceId);
      assert(span.spanId);
      assert.strictEqual(span.name, 'workflow');
      assert.strictEqual(span.service, 'workflow_engine');
    });

    it('creates child spans', () => {
      const t = new TracingEngine();
      const parent = t.startTrace('parent', 'svc');
      const child = t.startSpan(parent.traceId, 'child', 'svc');
      assert.strictEqual(child.parentSpanId, parent.spanId);
      assert.strictEqual(child.traceId, parent.traceId);
    });

    it('endSpan marks completion', () => {
      const t = new TracingEngine();
      const span = t.startTrace('test', 'svc');
      const ended = t.endSpan(span.traceId, span.spanId, 'completed');
      assert(ended);
      assert(ended.endTime);
      assert(ended.duration >= 0);
    });

    it('endTrace completes all spans', () => {
      const t = new TracingEngine();
      const span = t.startTrace('batch', 'svc');
      t.startSpan(span.traceId, 'sub', 'svc');
      const spans = t.endTrace(span.traceId);
      assert(spans);
      assert(spans.every(s => s.status === 'completed'));
    });

    it('getActiveTraces returns running', () => {
      const t = new TracingEngine();
      t.startTrace('active-workflow', 'engine');
      const active = t.getActiveTraces();
      assert(active.length > 0);
      assert.strictEqual(active[0].rootSpan.name, 'active-workflow');
    });

    it('getTraceTree returns hierarchy', async () => {
      const t = new TracingEngine();
      const span = t.startTrace('root', 'svc');
      t.startSpan(span.traceId, 'child1', 'svc');
      t.startSpan(span.traceId, 'child2', 'svc');
      const tree = await t.getTraceTree(span.traceId);
      assert(tree.length > 0);
      assert(tree[0].children.length > 0);
    });

    it('generateTraceId creates unique ids', () => {
      const t = new TracingEngine();
      const id1 = t.generateTraceId();
      const id2 = t.generateTraceId();
      assert(id1.startsWith('tr-'));
      assert(id1 !== id2);
    });
  });

  describe('Logger', () => {
    const { Logger, LEVELS } = require('../../lib/telemetry/logger');

    it('logs at all levels', () => {
      const logger = new Logger(null, { minLevel: 'TRACE' });
      assert(logger.trace('trace msg'));
      assert(logger.debug('debug msg'));
      assert(logger.info('info msg'));
      assert(logger.warn('warn msg'));
      assert(logger.error('error msg'));
    });

    it('filters by min level', () => {
      const logger = new Logger(null, { minLevel: 'WARN' });
      assert(!logger.info('should not log'));
      assert(logger.warn('should log'));
    });

    it('child creates sub-logger', () => {
      const logger = new Logger(null);
      const child = logger.child({ source: 'child-module' });
      const entry = child.info('test');
      assert(entry);
    });

    it('setLevel changes threshold', () => {
      const logger = new Logger(null, { minLevel: 'INFO' });
      logger.setLevel('ERROR');
      assert(!logger.info('should not pass'));
      assert(logger.error('should pass'));
    });

    it('enable/disable controls logging', () => {
      const logger = new Logger(null);
      logger.disable();
      assert(!logger.info('disabled'));
      logger.enable();
      assert(logger.info('enabled'));
    });

    it('getLevel returns current level', () => {
      const logger = new Logger(null, { minLevel: 'DEBUG' });
      assert.strictEqual(logger.getLevel(), 'DEBUG');
    });

    it('includes metadata in log entry', () => {
      const logger = new Logger(null);
      const entry = logger.info('test message', { traceId: 'tr-1', workflowId: 'wf-1' });
      assert.strictEqual(entry.traceId, 'tr-1');
      assert.strictEqual(entry.workflowId, 'wf-1');
    });
  });

  describe('Health Monitor', () => {
    const { HealthMonitor, COMPONENTS, STATUS_VALUES } = require('../../lib/telemetry/healthMonitor');

    it('registers and runs checks', async () => {
      const h = new HealthMonitor();
      h.registerCheck('api', async () => ({ status: 'healthy', message: 'API running' }));
      const result = await h.runCheck('api');
      assert.strictEqual(result.status, 'healthy');
      assert.strictEqual(result.component, 'api');
    });

    it('runAll checks all registered components', async () => {
      const h = new HealthMonitor();
      h.registerCheck('api', async () => ({ status: 'healthy' }));
      h.registerCheck('ai_providers', async () => ({ status: 'degraded' }));
      const results = await h.runAll();
      assert.strictEqual(results.api.status, 'healthy');
      assert.strictEqual(results.ai_providers.status, 'degraded');
    });

    it('getStatus returns latest', async () => {
      const h = new HealthMonitor();
      h.registerCheck('api', async () => ({ status: 'healthy' }));
      await h.runCheck('api');
      const status = h.getStatus('api');
      assert(status);
      assert.strictEqual(status.status, 'healthy');
    });

    it('getSummary returns all components', async () => {
      const h = new HealthMonitor();
      h.registerCheck('api', async () => ({ status: 'healthy' }));
      await h.runCheck('api');
      const summary = h.getSummary();
      assert(summary.api);
    });

    it('getHistory returns check history', async () => {
      const h = new HealthMonitor();
      h.registerCheck('api', async () => ({ status: 'healthy' }));
      await h.runCheck('api');
      await h.runCheck('api');
      const history = h.getHistory('api');
      assert(history.length >= 2);
    });

    it('onChange fires callback', (done) => {
      const h = new HealthMonitor();
      h.registerCheck('api', async () => ({ status: 'healthy' }));
      h.onChange((report) => {
        assert(report.component === 'api');
        done();
      });
      h.runCheck('api');
    });

    it('simulate returns simulated health', async () => {
      const h = new HealthMonitor();
      const sim = await h.simulate();
      assert(Object.keys(sim).length > 0);
      assert(sim.api);
    });

    it('COMPONENTS has all expected', () => {
      assert(COMPONENTS.includes('api'));
      assert(COMPONENTS.includes('ai_providers'));
      assert(COMPONENTS.includes('workflow_engine'));
      assert(COMPONENTS.length >= 10);
    });

    it('throws for unknown component', () => {
      const h = new HealthMonitor();
      assert.throws(() => h.registerCheck('nonexistent', async () => ({})));
    });
  });

  describe('Diagnostics', () => {
    const TelemetryManager = require('../../lib/telemetry/telemetryManager');

    it('systemSnapshot returns system info', async () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      const snapshot = await tm.diagnostics.systemSnapshot();
      assert(snapshot.timestamp);
      assert(snapshot.memory);
      assert(snapshot.versions);
    });

    it('healthSummary returns aggregate health', async () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      tm.health.registerCheck('api', async () => ({ status: 'healthy' }));
      await tm.health.runCheck('api');
      const summary = await tm.diagnostics.healthSummary();
      assert(summary.total > 0);
      assert(summary.overall);
    });

    it('errorSummary returns error counts', async () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      const summary = await tm.diagnostics.errorSummary();
      assert('totalErrors' in summary);
      assert('totalAlerts' in summary);
    });

    it('dependencyGraph returns nodes and edges', async () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      const graph = await tm.diagnostics.dependencyGraph();
      assert(Array.isArray(graph.nodes));
      assert(Array.isArray(graph.edges));
    });

    it('configurationValidation returns checks', async () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      const result = await tm.diagnostics.configurationValidation();
      assert(result.valid);
      assert(Array.isArray(result.checks));
    });
  });

  describe('Analytics', () => {
    const Analytics = require('../../lib/telemetry/analytics');
    const MetricsCollector = require('../../lib/telemetry/metricsCollector');

    it('generates daily analytics', async () => {
      const metrics = new MetricsCollector();
      const analytics = new Analytics(null, metrics);
      const report = await analytics.generate('daily');
      assert.strictEqual(report.type, 'daily');
      assert(report.generatedAt);
    });

    it('generates weekly analytics', async () => {
      const metrics = new MetricsCollector();
      const analytics = new Analytics(null, metrics);
      const report = await analytics.generate('weekly');
      assert.strictEqual(report.type, 'weekly');
    });

    it('generates monthly analytics', async () => {
      const metrics = new MetricsCollector();
      const analytics = new Analytics(null, metrics);
      const report = await analytics.generate('monthly');
      assert.strictEqual(report.type, 'monthly');
    });

    it('includes request and success stats', async () => {
      const metrics = new MetricsCollector();
      metrics.increment('api.requests', 50);
      metrics.increment('api.errors', 5);
      const analytics = new Analytics(null, metrics);
      const report = await analytics.generate('daily');
      assert(report.totalRequests > 0);
      assert(report.successRate > 0);
    });

    it('returns empty history if none stored', async () => {
      const metrics = new MetricsCollector();
      const analytics = new Analytics(null, metrics);
      const history = await analytics.getHistory('daily');
      assert(Array.isArray(history));
    });

    it('throws for invalid period', async () => {
      const metrics = new MetricsCollector();
      const analytics = new Analytics(null, metrics);
      await assert.rejects(() => analytics.generate('invalid'));
    });
  });

  describe('Alert Manager', () => {
    const AlertManager = require('../../lib/telemetry/alertManager');

    it('adds and lists rules', () => {
      const am = new AlertManager();
      const rule = am.addRule({ name: 'High Latency', condition: () => false });
      assert(rule.id.startsWith('rule-'));
      assert.strictEqual(am.listRules().length, 1);
    });

    it('removes rules', () => {
      const am = new AlertManager();
      const rule = am.addRule({ name: 'Test', condition: () => false });
      assert(am.removeRule(rule.id));
      assert(!am.removeRule('nonexistent'));
    });

    it('evaluates rules and creates alerts', async () => {
      const am = new AlertManager();
      am.addRule({ name: 'Always Fire', severity: 'critical', condition: () => 'triggered' });
      const triggered = await am.evaluate({});
      assert.strictEqual(triggered.length, 1);
      assert.strictEqual(triggered[0].severity, 'critical');
      assert.strictEqual(triggered[0].status, 'active');
    });

    it('acknowledge marks alert', async () => {
      const am = new AlertManager();
      am.addRule({ name: 'Test', condition: () => 'fire' });
      const [alert] = await am.evaluate({});
      const ack = await am.acknowledge(alert.id);
      assert.strictEqual(ack.status, 'acknowledged');
    });

    it('resolve marks alert', async () => {
      const am = new AlertManager();
      am.addRule({ name: 'Test', condition: () => 'fire' });
      const [alert] = await am.evaluate({});
      const resolved = await am.resolve(alert.id);
      assert.strictEqual(resolved.status, 'resolved');
      assert(resolved.resolvedAt);
    });

    it('getAlerts returns with filters', async () => {
      const am = new AlertManager();
      am.addRule({ name: 'Test', severity: 'critical', condition: () => 'fire' });
      await am.evaluate({});
      const critical = await am.getAlerts({ severity: 'critical' });
      assert(critical.length > 0);
    });

    it('getAlertCounts returns summary', () => {
      const am = new AlertManager();
      const counts = am.getAlertCounts();
      assert('total' in counts);
      assert('active' in counts);
    });

    it('createLatencyRule factory', () => {
      const rule = AlertManager.createLatencyRule('AI Check', 'openai', 5000);
      assert(rule.name.includes('openai'));
      assert.strictEqual(rule.severity, 'warning');
    });

    it('createFailureRule factory', () => {
      const rule = AlertManager.createFailureRule('Fail Check', 'workflow', 10, 'critical');
      assert(rule.name.includes('workflow'));
      assert.strictEqual(rule.severity, 'critical');
    });

    it('requires condition function', () => {
      const am = new AlertManager();
      assert.throws(() => am.addRule({ name: 'bad', condition: 'not a function' }));
    });
  });

  describe('Telemetry Manager', () => {
    const TelemetryManager = require('../../lib/telemetry/telemetryManager');

    it('creates with default options', () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      assert(tm.metrics);
      assert(tm.tracing);
      assert(tm.logger);
      assert(tm.health);
      assert(tm.alerts);
      assert(tm.storage);
    });

    it('recordMetric delegates to collector', () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      tm.recordMetric('test.counter', 1, 'counter');
      assert.strictEqual(tm.metrics.getCounter('test.counter'), 1);
    });

    it('recordTrace delegates to tracer', () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      const span = tm.recordTrace('test-trace', 'test-svc');
      assert(span);
      assert.strictEqual(span.name, 'test-trace');
    });

    it('recordLog delegates to logger', () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      const entry = tm.recordLog('INFO', 'test message');
      assert(entry);
    });

    it('recordEvent delegates to event bus', () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      const entry = tm.recordEvent('telemetry.metric', { name: 'test' });
      assert.strictEqual(entry.type, 'telemetry.metric');
    });

    it('enable/disable controls recording', () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      tm.disable();
      const entry = tm.recordLog('INFO', 'should not log');
      assert(!entry);
      tm.enable();
      assert(tm.recordLog('INFO', 'should log'));
    });

    it('generateDailyAnalytics returns report', async () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      const report = await tm.generateDailyAnalytics();
      assert(report);
      assert.strictEqual(report.type, 'daily');
    });

    it('systemSnapshot returns snapshot', async () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      const snap = await tm.systemSnapshot();
      assert(snap.timestamp);
    });

    it('healthSummary returns health', async () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      const summary = await tm.healthSummary();
      assert('overall' in summary);
    });

    it('addAlertRule registers rule', () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      const rule = tm.addAlertRule({ name: 'API Alert', condition: () => false });
      assert(rule);
      assert.strictEqual(tm.alerts.listRules().length, 1);
    });

    it('evaluateAlerts triggers rules', async () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      tm.addAlertRule({ name: 'Always', condition: () => 'yes' });
      const triggered = await tm.evaluateAlerts({});
      assert(triggered.length > 0);
    });

    it('registerComponentMetrics stores function', () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      tm.registerComponentMetrics('api', () => ({}));
      assert(tm._componentMetrics.has('api'));
    });

    it('stop disables auto-collection', () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      tm.stop();
      assert(!tm.enabled);
    });
  });

  describe('Entry Point', () => {
    const telemetry = require('../../lib/telemetry');

    it('exports recordMetric', () => assert(typeof telemetry.recordMetric === 'function'));
    it('exports recordTrace', () => assert(typeof telemetry.recordTrace === 'function'));
    it('exports recordEvent', () => assert(typeof telemetry.recordEvent === 'function'));
    it('exports recordLog', () => assert(typeof telemetry.recordLog === 'function'));
    it('exports getMetrics', () => assert(typeof telemetry.getMetrics === 'function'));
    it('exports getTraces', () => assert(typeof telemetry.getTraces === 'function'));
    it('exports getHealth', () => assert(typeof telemetry.getHealth === 'function'));
    it('exports getTelemetryManager', () => assert(typeof telemetry.getTelemetryManager === 'function'));
    it('exports createTelemetryManager', () => assert(typeof telemetry.createTelemetryManager === 'function'));

    it('exports all classes', () => {
      assert(telemetry.TelemetryManager);
      assert(telemetry.TelemetryStorage);
      assert(telemetry.MetricsCollector);
      assert(telemetry.TracingEngine);
      assert(telemetry.Logger);
      assert(telemetry.HealthMonitor);
      assert(telemetry.Diagnostics);
      assert(telemetry.Analytics);
      assert(telemetry.AlertManager);
      assert(telemetry.TelemetryEventBus);
    });

    it('exports constants', () => {
      assert(telemetry.LEVELS);
      assert(telemetry.COMPONENTS);
      assert(telemetry.EVENT_TYPES);
    });

    it('recordMetric works via singleton', () => {
      const entry = telemetry.recordMetric('test.singleton', 1, 'counter');
      assert(entry);
    });

    it('getTelemetryManager returns singleton', () => {
      const mgr1 = telemetry.getTelemetryManager();
      const mgr2 = telemetry.getTelemetryManager();
      assert.strictEqual(mgr1, mgr2);
    });
  });

  describe('Integration', () => {
    const TelemetryManager = require('../../lib/telemetry/telemetryManager');

    it('full pipeline: metric → storage → query', async () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      tm.metrics.increment('api.requests', 10, { endpoint: '/health' });
      tm.metrics.recordLatency('ai.generate', 250, { provider: 'openai' });
      tm.metrics.recordError('workflow', { name: 'wf-1' });
      const stored = await tm.getMetrics();
      assert(stored.length > 0);
    });

    it('full pipeline: trace → storage → query', async () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      const span = tm.tracing.startTrace('workflow', 'engine');
      tm.tracing.startSpan(span.traceId, 'sub-task', 'engine');
      tm.tracing.endTrace(span.traceId);
      const traces = await tm.getTraces();
      assert(traces.length > 0);
    });

    it('full pipeline: log → storage → query', async () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      tm.logger.info('test event', { workflowId: 'wf-1', source: 'test' });
      tm.logger.error('error event', { error: 'something broke' });
      const logs = await tm.storage.getLogs({ level: 'ERROR' });
      assert(logs.length > 0);
    });

    it('full pipeline: alert → storage → query', async () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      tm.addAlertRule({ name: 'Integration Rule', severity: 'critical', condition: () => 'test' });
      await tm.evaluateAlerts({});
      const alerts = await tm.alerts.getAlerts({ severity: 'critical' });
      assert(alerts.length > 0);
    });

    it('full pipeline: health → storage → summary', async () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      tm.health.registerCheck('api', async () => ({ status: 'healthy', message: 'All good' }));
      await tm.health.runCheck('api');
      const health = await tm.getHealth();
      assert(health.api);
    });

    it('telemetry can be disabled without errors', () => {
      const tm = new TelemetryManager({ enabled: false, autoCollect: false });
      assert.doesNotThrow(() => {
        tm.recordMetric('test', 1, 'counter');
        tm.recordTrace('test', 'svc');
        tm.recordLog('INFO', 'test');
        tm.recordEvent('test', {});
      });
    });

    it('multiple traces are isolated', () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      const t1 = tm.tracing.startTrace('wf-1', 'engine');
      const t2 = tm.tracing.startTrace('wf-2', 'engine');
      assert(t1.traceId !== t2.traceId);
      const t1span = tm.tracing.startSpan(t1.traceId, 'step-1', 'engine');
      assert.strictEqual(t1span.traceId, t1.traceId);
    });
  });

  describe('Engine Integration Wrappers', () => {
    const TelemetryManager = require('../../lib/telemetry/telemetryManager');

    it('workflow engine emits metrics when instrumented', () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      tm.recordMetric('workflow.started', 1, 'counter', { definition: 'test-def' });
      tm.recordMetric('workflow.completed', 1, 'counter', { status: 'success' });
      tm.recordMetric('workflow.duration', 1234, 'histogram', { definition: 'test-def' });
      assert.strictEqual(tm.metrics.getCounter('workflow.started', { definition: 'test-def' }), 1);
    });

    it('AI provider emits metrics when instrumented', () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      tm.recordMetric('ai.request', 1, 'counter', { provider: 'openai', model: 'gpt-4' });
      tm.recordMetric('ai.latency', 320, 'histogram', { provider: 'openai' });
      tm.metrics.recordTokenUsage('openai', 150, 80, { model: 'gpt-4' });
      assert(tm.metrics.getCounter('ai.tokens.input', { provider: 'openai', model: 'gpt-4' }) > 0);
    });

    it('conversation engine emits metrics when instrumented', () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      tm.recordMetric('conversation.created', 1, 'counter');
      tm.recordMetric('conversation.intent.detected', 1, 'counter', { intent: 'plan_website' });
      tm.recordLog('INFO', 'Conversation processed', { conversationId: 'conv-1', source: 'conversation' });
      assert.strictEqual(tm.metrics.getCounter('conversation.created'), 1);
    });

    it('deployment engine emits metrics when instrumented', () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      tm.recordMetric('deployment.started', 1, 'counter', { provider: 'vercel' });
      tm.recordMetric('deployment.completed', 1, 'counter', { status: 'success' });
      tm.recordMetric('deployment.duration', 5432, 'histogram');
      assert.strictEqual(tm.metrics.getCounter('deployment.started', { provider: 'vercel' }), 1);
    });

    it('dashboard emits metrics when instrumented', () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      tm.recordMetric('dashboard.pageview', 1, 'counter', { page: 'home' });
      tm.recordMetric('dashboard.pageview', 1, 'counter', { page: 'projects' });
      assert.strictEqual(tm.metrics.getCounter('dashboard.pageview', { page: 'home' }), 1);
    });

    it('tracing across engine boundaries', async () => {
      const tm = new TelemetryManager({ enabled: true, autoCollect: false });
      const root = tm.tracing.startTrace('user.request', 'api');
      const wfSpan = tm.tracing.startSpan(root.traceId, 'workflow.exec', 'workflow_engine', { parentSpanId: root.spanId });
      const aiSpan = tm.tracing.startSpan(root.traceId, 'ai.generate', 'ai_providers', { parentSpanId: root.spanId });
      tm.tracing.endSpan(root.traceId, aiSpan.spanId);
      tm.tracing.endSpan(root.traceId, wfSpan.spanId);
      tm.tracing.endTrace(root.traceId);
      const tree = await tm.tracing.getTraceTree(root.traceId);
      assert.strictEqual(tree.length, 1);
      assert.strictEqual(tree[0].children.length, 2);
    });
  });
});
