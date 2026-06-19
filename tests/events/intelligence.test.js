const assert = require('assert');

describe('Event Intelligence Layer', function() {

  describe('EventScorer', () => {
    const EventScorer = require('../../lib/events/intelligence/eventScorer');

    it('scores a normal event with defaults', () => {
      const sc = new EventScorer();
      const result = sc.score({ type: 'test.event', severity: 'info', source: 'api', timestamp: Date.now() });
      assert.ok(result.importance >= 0);
      assert.ok(result.importance <= 100);
      assert.ok(result.urgency >= 0);
      assert.ok(result.systemImpact >= 0);
    });

    it('scores critical severity higher than info', () => {
      const sc = new EventScorer();
      const info = sc.score({ type: 'test', severity: 'info', source: 'api', timestamp: Date.now() });
      const crit = sc.score({ type: 'test', severity: 'critical', source: 'api', timestamp: Date.now() });
      assert.ok(crit.importance > info.importance);
    });

    it('scores failure events higher', () => {
      const sc = new EventScorer();
      const normal = sc.score({ type: 'test', severity: 'low', source: 'system', timestamp: Date.now() });
      const failed = sc.score({ type: 'test.failure', severity: 'low', source: 'system', timestamp: Date.now() });
      assert.ok(failed.importance > normal.importance);
    });

    it('scores events with error payload higher', () => {
      const sc = new EventScorer();
      const normal = sc.score({ type: 'test', severity: 'medium', source: 'workflow', timestamp: Date.now(), payload: {} });
      const error = sc.score({ type: 'test', severity: 'medium', source: 'workflow', timestamp: Date.now(), payload: { error: 'fail' } });
      assert.ok(error.importance > normal.importance);
    });

    it('scores events with high retryCount higher', () => {
      const sc = new EventScorer();
      const noRetry = sc.score({ type: 'test', severity: 'medium', source: 'cluster', timestamp: Date.now(), payload: {} });
      const withRetry = sc.score({ type: 'test', severity: 'medium', source: 'cluster', timestamp: Date.now(), payload: { retryCount: 5 } });
      assert.ok(withRetry.importance > noRetry.importance);
    });

    it('returns all three dimensions', () => {
      const sc = new EventScorer();
      const result = sc.score({ type: 'test', severity: 'high', source: 'cluster', timestamp: Date.now() });
      assert.ok('importance' in result);
      assert.ok('urgency' in result);
      assert.ok('systemImpact' in result);
    });

    it('caps importance at 100', () => {
      const sc = new EventScorer();
      const result = sc.score({ type: 'critical.failure.error.overload', severity: 'critical', source: 'system', timestamp: Date.now(), payload: { error: 'big', retryCount: 10 } });
      assert.ok(result.importance <= 100);
    });
  });

  describe('PatternDetector', () => {
    const PatternDetector = require('../../lib/events/intelligence/patternDetector');

    it('detects repeated failures after 3+ events', () => {
      const pd = new PatternDetector();
      for (let i = 0; i < 3; i++) {
        pd.ingest({ id: `e-${i}`, type: 'workflow.failure', severity: 'error', source: 'workflow', payload: {} });
      }
      const patterns = pd.getPatterns();
      assert.ok(patterns.some(p => p.pattern === 'repeated_failures'));
    });

    it('detects critical repeated failures after 5+ events', () => {
      const pd = new PatternDetector();
      for (let i = 0; i < 5; i++) {
        pd.ingest({ id: `e-${i}`, type: 'workflow.failure', severity: 'error', source: 'workflow', payload: {} });
      }
      const patterns = pd.getPatterns({ severity: 'critical' });
      assert.ok(patterns.length > 0);
    });

    it('detects retry loops', () => {
      const pd = new PatternDetector();
      for (let i = 0; i < 3; i++) {
        pd.ingest({ id: `e-${i}`, type: 'workflow.retry', source: 'workflow', payload: { retryCount: 3, workflowId: 'wf-1' } });
      }
      const patterns = pd.getPatterns();
      assert.ok(patterns.some(p => p.pattern === 'retry_loop_detected'));
    });

    it('detects cluster imbalance', () => {
      const pd = new PatternDetector();
      pd.ingest({ id: 'e-1', type: 'cluster.status', source: 'cluster', payload: { workerCount: 2, queueDepth: 20 } });
      const patterns = pd.getPatterns();
      assert.ok(patterns.some(p => p.pattern === 'cluster_imbalance'));
    });

    it('detects AI fallback chains', () => {
      const pd = new PatternDetector();
      for (let i = 0; i < 2; i++) {
        pd.ingest({ id: `e-${i}`, type: 'ai.fallback', source: 'ai', payload: {}, correlationId: 'corr-1' });
      }
      const patterns = pd.getPatterns();
      assert.ok(patterns.some(p => p.pattern === 'ai_fallback_chain'));
    });

    it('detects high latency bursts', () => {
      const pd = new PatternDetector();
      for (let i = 0; i < 3; i++) {
        pd.ingest({ id: `e-${i}`, type: 'ai.completed', source: 'ai', payload: { latency: 4000 } });
      }
      const patterns = pd.getPatterns();
      assert.ok(patterns.some(p => p.pattern === 'high_latency_burst'));
    });

    it('detects unexpected state transitions', () => {
      const pd = new PatternDetector();
      pd.ingest({ id: 'e-1', type: 'workflow.transition', source: 'workflow', payload: { from: 'running', to: 'completed' } });
      const patterns = pd.getPatterns();
      assert.ok(patterns.some(p => p.pattern === 'unexpected_state_transition'));
    });

    it('filters by severity', () => {
      const pd = new PatternDetector();
      for (let i = 0; i < 3; i++) {
        pd.ingest({ id: `e-${i}`, type: 'workflow.failure', severity: 'error', source: 'workflow', payload: {} });
      }
      const high = pd.getPatterns({ severity: 'high' });
      const info = pd.getPatterns({ severity: 'info' });
      assert.ok(high.length > 0);
      assert.strictEqual(info.length, 0);
    });

    it('clear removes all patterns', () => {
      const pd = new PatternDetector();
      for (let i = 0; i < 3; i++) {
        pd.ingest({ id: `e-${i}`, type: 'workflow.failure', severity: 'error', source: 'workflow', payload: {} });
      }
      pd.clear();
      assert.strictEqual(pd.getPatterns().length, 0);
    });

    it('returns confidence between 0 and 1', () => {
      const pd = new PatternDetector();
      for (let i = 0; i < 3; i++) {
        pd.ingest({ id: `e-${i}`, type: 'workflow.failure', severity: 'error', source: 'workflow', payload: {} });
      }
      for (const p of pd.getPatterns()) {
        assert.ok(p.confidence > 0 && p.confidence <= 1);
      }
    });

    it('includes affected systems', () => {
      const pd = new PatternDetector();
      for (let i = 0; i < 3; i++) {
        pd.ingest({ id: `e-${i}`, type: 'workflow.failure', severity: 'error', source: 'workflow', payload: {} });
      }
      for (const p of pd.getPatterns()) {
        assert.ok(Array.isArray(p.affectedSystems));
      }
    });
  });

  describe('AnomalyDetector', () => {
    const AnomalyDetector = require('../../lib/events/intelligence/anomalyDetector');

    it('detects error rate spike via z-score', () => {
      const ad = new AnomalyDetector({ windowSize: 50, zScoreThreshold: 1.5 });
      for (let i = 0; i < 30; i++) {
        ad.ingest({ id: `e-${i}`, type: 'normal.event', source: 'api', payload: {} });
      }
      for (let i = 0; i < 20; i++) {
        ad.ingest({ id: `err-${i}`, type: 'workflow.failure', source: 'workflow', payload: {} });
      }
      const anomalies = ad.getAnomalies();
      const spikes = anomalies.filter(a => a.type === 'error_rate_spike');
      assert.ok(spikes.length > 0);
    });

    it('detects invalid state transitions', () => {
      const ad = new AnomalyDetector();
      ad.ingest({ id: 'e-1', type: 'workflow.transition', source: 'workflow', payload: { from: 'completed', to: 'running' } });
      const anomalies = ad.getAnomalies();
      assert.ok(anomalies.some(a => a.type === 'invalid_state_transition'));
    });

    it('detects latency anomalies', () => {
      const ad = new AnomalyDetector({ windowSize: 20, zScoreThreshold: 1.5 });
      for (let i = 0; i < 10; i++) {
        ad.ingest({ id: `e-${i}`, type: 'ai.completed', source: 'ai', payload: { latency: 100 } });
      }
      ad.ingest({ id: 'spike', type: 'ai.completed', source: 'ai', payload: { latency: 5000 } });
      const anomalies = ad.getAnomalies();
      const latencyAnoms = anomalies.filter(a => a.type === 'latency_anomaly');
      assert.ok(latencyAnoms.length > 0);
    });

    it('detects orphaned correlation IDs', () => {
      const ad = new AnomalyDetector();
      for (let i = 0; i < 25; i++) {
        ad.ingest({ id: `e-${i}`, type: 'workflow.started', source: 'workflow', payload: {}, correlationId: 'orphan-1' });
      }
      const anomalies = ad.getAnomalies();
      assert.ok(anomalies.some(a => a.type === 'orphaned_correlation'));
    });

    it('returns empty for normal events', () => {
      const ad = new AnomalyDetector();
      for (let i = 0; i < 10; i++) {
        ad.ingest({ id: `e-${i}`, type: 'health.check', source: 'system', payload: { ok: true } });
      }
      assert.strictEqual(ad.getAnomalies().length, 0);
    });

    it('filter by type', () => {
      const ad = new AnomalyDetector({ windowSize: 50, zScoreThreshold: 1.5 });
      for (let i = 0; i < 30; i++) {
        ad.ingest({ id: `e-${i}`, type: 'normal', source: 'api', payload: {} });
      }
      for (let i = 0; i < 20; i++) {
        ad.ingest({ id: `err-${i}`, type: 'failure', source: 'workflow', payload: {} });
      }
      const filtered = ad.getAnomalies({ type: 'error_rate_spike' });
      assert.ok(filtered.length > 0);
      assert.ok(filtered.every(a => a.type === 'error_rate_spike'));
    });

    it('clear removes all anomalies', () => {
      const ad = new AnomalyDetector({ windowSize: 10, zScoreThreshold: 1.0 });
      for (let i = 0; i < 5; i++) {
        ad.ingest({ id: `e-${i}`, type: 'normal', source: 'api', payload: {} });
      }
      for (let i = 0; i < 5; i++) {
        ad.ingest({ id: `err-${i}`, type: 'failure', source: 'workflow', payload: {} });
      }
      ad.clear();
      assert.strictEqual(ad.getAnomalies().length, 0);
    });

    it('generates confidence between 0 and 1', () => {
      const ad = new AnomalyDetector({ windowSize: 10, zScoreThreshold: 1.0 });
      for (let i = 0; i < 5; i++) {
        ad.ingest({ id: `e-${i}`, type: 'normal', source: 'api', payload: {} });
      }
      for (let i = 0; i < 5; i++) {
        ad.ingest({ id: `err-${i}`, type: 'failure', source: 'workflow', payload: {} });
      }
      for (const a of ad.getAnomalies()) {
        assert.ok(a.confidence > 0 && a.confidence <= 1);
      }
    });

    it('includes sourceEventId in anomalies', () => {
      const ad = new AnomalyDetector({ windowSize: 10, zScoreThreshold: 1.0 });
      for (let i = 0; i < 5; i++) {
        ad.ingest({ id: `normal-${i}`, type: 'normal', source: 'api', payload: {} });
      }
      ad.ingest({ id: 'last-err', type: 'completed', source: 'workflow', payload: { from: 'completed', to: 'running' }, severity: 'error' });
      for (const a of ad.getAnomalies()) {
        assert.ok(a.sourceEventId);
      }
    });
  });

  describe('CorrelationEngine', () => {
    const CorrelationEngine = require('../../lib/events/intelligence/correlationEngine');

    it('builds graph nodes from events', () => {
      const ce = new CorrelationEngine();
      ce.ingest({ id: 'e-1', type: 'workflow.started', source: 'workflow', payload: {} });
      const graph = ce.getGraph();
      assert.ok(graph.nodes.length > 0);
    });

    it('links events by correlationId', () => {
      const ce = new CorrelationEngine();
      ce.ingest({ id: 'e-1', type: 'api.request', source: 'api', payload: {}, correlationId: 'corr-1' });
      ce.ingest({ id: 'e-2', type: 'workflow.started', source: 'workflow', payload: {}, correlationId: 'corr-1' });
      const graph = ce.getGraph();
      const corrNode = graph.nodes.find(n => n.id === 'corr:corr-1');
      assert.ok(corrNode);
      assert.ok(corrNode.eventCount >= 2);
    });

    it('generates causal edges', () => {
      const ce = new CorrelationEngine();
      ce.ingest({ id: 'e-1', type: 'workflow.failure', source: 'workflow', payload: {} });
      ce.ingest({ id: 'e-2', type: 'ai.fallback', source: 'ai', payload: {} });
      const graph = ce.getGraph();
      assert.ok(graph.edges.length > 0);
    });

    it('getNode returns node by id', () => {
      const ce = new CorrelationEngine();
      ce.ingest({ id: 'e-1', type: 'test.event', source: 'api', payload: {} });
      const node = ce.getNode('test.event:api');
      assert.ok(node);
      assert.strictEqual(node.type, 'test.event');
    });

    it('getNode returns null for unknown', () => {
      const ce = new CorrelationEngine();
      assert.strictEqual(ce.getNode('nonexistent'), null);
    });

    it('clear removes all nodes and edges', () => {
      const ce = new CorrelationEngine();
      ce.ingest({ id: 'e-1', type: 'test.event', source: 'api', payload: {} });
      ce.clear();
      const graph = ce.getGraph();
      assert.strictEqual(graph.nodes.length, 0);
      assert.strictEqual(graph.edges.length, 0);
    });

    it('tracks event count per node', () => {
      const ce = new CorrelationEngine();
      for (let i = 0; i < 5; i++) {
        ce.ingest({ id: `e-${i}`, type: 'test.event', source: 'api', payload: {} });
      }
      const node = ce.getNode('test.event:api');
      assert.strictEqual(node.eventCount, 5);
    });
  });

  describe('InsightGenerator', () => {
    const InsightGenerator = require('../../lib/events/intelligence/insightGenerator');

    it('generates stable system insight when no anomalies', () => {
      const ig = new InsightGenerator();
      const insights = ig.evaluate([], []);
      assert.ok(insights.some(i => i.rule === 'system_stable'));
    });

    it('generates retry backoff insight from retry patterns', () => {
      const ig = new InsightGenerator();
      const patterns = [
        { pattern: 'retry_loop_detected', severity: 'high', timestamp: Date.now() },
        { pattern: 'retry_loop_detected', severity: 'high', timestamp: Date.now() },
      ];
      const insights = ig.evaluate([], patterns);
      assert.ok(insights.some(i => i.rule === 'retry_backoff_too_aggressive'));
    });

    it('generates cluster underprovisioned insight', () => {
      const ig = new InsightGenerator();
      const patterns = [
        { pattern: 'cluster_imbalance', severity: 'high', timestamp: Date.now() },
        { pattern: 'cluster_imbalance', severity: 'high', timestamp: Date.now() },
      ];
      const insights = ig.evaluate([], patterns);
      assert.ok(insights.some(i => i.rule === 'cluster_underprovisioned'));
    });

    it('generates error rate anomaly insight', () => {
      const ig = new InsightGenerator();
      const anomalies = [{ type: 'error_rate_spike', severity: 'high', timestamp: Date.now(), detail: { source: 'api', zScore: 3.5 } }];
      const insights = ig.evaluate(anomalies, []);
      assert.ok(insights.some(i => i.rule === 'error_rate_anomaly'));
    });

    it('generates latency degradation insight', () => {
      const ig = new InsightGenerator();
      const anomalies = [
        { type: 'latency_anomaly', severity: 'medium', timestamp: Date.now(), detail: { latency: 3000 } },
        { type: 'latency_anomaly', severity: 'medium', timestamp: Date.now(), detail: { latency: 4000 } },
      ];
      const insights = ig.evaluate(anomalies, []);
      assert.ok(insights.some(i => i.rule === 'latency_degradation'));
    });

    it('insight has all required fields', () => {
      const ig = new InsightGenerator();
      const insights = ig.evaluate([], []);
      for (const i of insights) {
        assert.ok(i.id);
        assert.ok(i.insight);
        assert.ok(i.recommendation);
        assert.ok(i.priority);
        assert.ok(i.confidence);
        assert.ok(i.timestamp);
      }
    });

    it('filters insights by priority', () => {
      const ig = new InsightGenerator();
      ig.evaluate([], []);
      const low = ig.getInsights({ priority: 'low' });
      assert.ok(low.length > 0);
      assert.ok(low.every(i => i.priority === 'low'));
    });

    it('clear removes all insights', () => {
      const ig = new InsightGenerator();
      ig.evaluate([], []);
      ig.clear();
      assert.strictEqual(ig.getInsights().length, 0);
    });
  });

  describe('IntelligenceStore', () => {
    const IntelligenceStore = require('../../lib/events/intelligence/intelligenceStore');

    it('stores and retrieves patterns', () => {
      const store = new IntelligenceStore();
      store.push('patterns', { pattern: 'test', timestamp: Date.now() });
      assert.strictEqual(store.get('patterns').length, 1);
    });

    it('stores and retrieves anomalies', () => {
      const store = new IntelligenceStore();
      store.push('anomalies', { type: 'test', timestamp: Date.now() });
      assert.strictEqual(store.get('anomalies').length, 1);
    });

    it('stores and retrieves insights', () => {
      const store = new IntelligenceStore();
      store.push('insights', { insight: 'test', timestamp: Date.now() });
      assert.strictEqual(store.get('insights').length, 1);
    });

    it('returns empty for unknown collection', () => {
      const store = new IntelligenceStore();
      assert.deepStrictEqual(store.get('unknown'), []);
    });

    it('push returns false for unknown collection', () => {
      const store = new IntelligenceStore();
      assert.strictEqual(store.push('unknown', {}), false);
    });

    it('filters by severity', () => {
      const store = new IntelligenceStore();
      store.push('anomalies', { type: 'test', severity: 'high', timestamp: Date.now() });
      store.push('anomalies', { type: 'test', severity: 'low', timestamp: Date.now() });
      const filtered = store.get('anomalies', { severity: 'high' });
      assert.strictEqual(filtered.length, 1);
    });

    it('filters by priority', () => {
      const store = new IntelligenceStore();
      store.push('insights', { insight: 'a', priority: 'high', timestamp: Date.now() });
      store.push('insights', { insight: 'b', priority: 'low', timestamp: Date.now() });
      const filtered = store.get('insights', { priority: 'low' });
      assert.strictEqual(filtered.length, 1);
    });

    it('getAll returns summary counts', () => {
      const store = new IntelligenceStore();
      store.push('patterns', { pattern: 'p1', timestamp: Date.now() });
      store.push('anomalies', { type: 'a1', timestamp: Date.now() });
      store.push('insights', { insight: 'i1', timestamp: Date.now() });
      const all = store.getAll();
      assert.strictEqual(all.patternCount, 1);
      assert.strictEqual(all.anomalyCount, 1);
      assert.strictEqual(all.insightCount, 1);
    });

    it('clear removes all data', () => {
      const store = new IntelligenceStore();
      store.push('patterns', { pattern: 'p1', timestamp: Date.now() });
      store.clear();
      assert.strictEqual(store.get('patterns').length, 0);
    });

    it('clear removes single collection', () => {
      const store = new IntelligenceStore();
      store.push('patterns', { pattern: 'p1', timestamp: Date.now() });
      store.push('anomalies', { type: 'a1', timestamp: Date.now() });
      store.clear('patterns');
      assert.strictEqual(store.get('patterns').length, 0);
      assert.strictEqual(store.get('anomalies').length, 1);
    });

    it('toJSON and fromJSON serialize correctly', () => {
      const store = new IntelligenceStore({ maxPerType: 100 });
      store.push('patterns', { pattern: 'test', timestamp: 1000 });
      const json = store.toJSON();
      const restored = IntelligenceStore.fromJSON(json);
      assert.strictEqual(restored.get('patterns').length, 1);
      assert.strictEqual(restored.get('patterns')[0].pattern, 'test');
    });
  });

  describe('IntelligenceEngine', () => {
    const IntelligenceEngine = require('../../lib/events/intelligence/intelligenceEngine');
    const EventBus = require('../../lib/events/eventBus');

    it('ingest processes an event and returns result', () => {
      const engine = new IntelligenceEngine();
      const result = engine.ingest({ id: 'e-1', type: 'test.event', source: 'api', severity: 'info', payload: {}, timestamp: Date.now() });
      assert.ok(result.score);
      assert.ok(Array.isArray(result.patterns));
      assert.ok(Array.isArray(result.anomalies));
      assert.ok(Array.isArray(result.insights));
      assert.ok(result.processingMs !== undefined);
    });

    it('ingest stores patterns in the store', () => {
      const engine = new IntelligenceEngine();
      for (let i = 0; i < 3; i++) {
        engine.ingest({ id: `e-${i}`, type: 'workflow.failure', source: 'workflow', severity: 'error', payload: {}, timestamp: Date.now() });
      }
      assert.ok(engine.store.get('patterns').length > 0);
    });

    it('ingest stores anomalies', () => {
      const engine = new IntelligenceEngine({ anomaly: { windowSize: 20, zScoreThreshold: 1.5 } });
      for (let i = 0; i < 10; i++) {
        engine.ingest({ id: `n-${i}`, type: 'normal', source: 'api', severity: 'info', payload: {}, timestamp: Date.now() });
      }
      for (let i = 0; i < 10; i++) {
        engine.ingest({ id: `f-${i}`, type: 'failure', source: 'workflow', severity: 'error', payload: {}, timestamp: Date.now() });
      }
      assert.ok(engine.store.get('anomalies').length > 0);
    });

    it('onInsight callback fires on new insights', () => {
      let insightFired = false;
      const engine = new IntelligenceEngine({
        onInsight: (insight) => { insightFired = true; },
      });
      engine.ingest({ id: 'e-1', type: 'test', source: 'api', severity: 'info', payload: {}, timestamp: Date.now() });
      assert.ok(insightFired);
    });

    it('emits intelligence.insight events to eventBus', (done) => {
      const bus = new EventBus();
      const engine = new IntelligenceEngine({ eventBus: bus });
      bus.on('intelligence.insight', (insight) => {
        assert.ok(insight);
        done();
      });
      engine.ingest({ id: 'e-1', type: 'test', source: 'api', severity: 'info', payload: {}, timestamp: Date.now() });
    });

    it('enable/disable controls processing', () => {
      const engine = new IntelligenceEngine();
      engine.disable();
      const result = engine.ingest({ id: 'e-1', type: 'test', source: 'api', severity: 'info', payload: {}, timestamp: Date.now() });
      assert.strictEqual(result, null);
      engine.enable();
      assert.ok(engine.isEnabled());
    });

    it('getHealth returns stats', () => {
      const engine = new IntelligenceEngine();
      engine.ingest({ id: 'e-1', type: 'test', source: 'api', severity: 'info', payload: {}, timestamp: Date.now() });
      const health = engine.getHealth();
      assert.ok(health.enabled);
      assert.ok(health.totalProcessed >= 1);
      assert.ok(health.averageProcessingMs >= 0);
    });

    it('clear resets all state', () => {
      const engine = new IntelligenceEngine();
      engine.ingest({ id: 'e-1', type: 'test', source: 'api', severity: 'info', payload: {}, timestamp: Date.now() });
      engine.clear();
      const health = engine.getHealth();
      assert.strictEqual(health.totalProcessed, 0);
    });
  });

  describe('IntelligenceAPI', () => {
    const IntelligenceEngine = require('../../lib/events/intelligence/intelligenceEngine');
    const IntelligenceAPI = require('../../lib/events/intelligence/intelligenceAPI');

    beforeEach(() => {
      // Fresh engine per test
    });

    it('getInsights returns stored insights', () => {
      const engine = new IntelligenceEngine();
      engine.ingest({ id: 'e-1', type: 'test', source: 'api', severity: 'info', payload: {}, timestamp: Date.now() });
      const api = new IntelligenceAPI(engine);
      const insights = api.getInsights();
      assert.ok(insights.length > 0);
    });

    it('getPatterns returns stored patterns', () => {
      const engine = new IntelligenceEngine();
      for (let i = 0; i < 3; i++) {
        engine.ingest({ id: `e-${i}`, type: 'workflow.failure', source: 'workflow', severity: 'error', payload: {}, timestamp: Date.now() });
      }
      const api = new IntelligenceAPI(engine);
      const patterns = api.getPatterns();
      assert.ok(patterns.length > 0);
    });

    it('getAnomalies returns stored anomalies', () => {
      const engine = new IntelligenceEngine({ anomaly: { windowSize: 10, zScoreThreshold: 1.5 } });
      for (let i = 0; i < 5; i++) {
        engine.ingest({ id: `n-${i}`, type: 'normal', source: 'api', severity: 'info', payload: {}, timestamp: Date.now() });
      }
      const api = new IntelligenceAPI(engine);
      const anomalies = api.getAnomalies();
      assert.ok(Array.isArray(anomalies));
    });

    it('getCorrelationGraph returns graph data', () => {
      const engine = new IntelligenceEngine();
      engine.ingest({ id: 'e-1', type: 'test.event', source: 'api', severity: 'info', payload: {}, timestamp: Date.now() });
      const api = new IntelligenceAPI(engine);
      const graph = api.getCorrelationGraph();
      assert.ok(graph.nodes);
      assert.ok(graph.edges);
    });

    it('getHealthIntelligence returns combined health + insights + graph', () => {
      const engine = new IntelligenceEngine();
      engine.ingest({ id: 'e-1', type: 'test', source: 'api', severity: 'info', payload: {}, timestamp: Date.now() });
      const api = new IntelligenceAPI(engine);
      const hi = api.getHealthIntelligence();
      assert.ok(hi.health);
      assert.ok(hi.topInsights);
      assert.ok(hi.graph);
    });

    it('filters insights by filter', () => {
      const engine = new IntelligenceEngine();
      engine.ingest({ id: 'e-1', type: 'test', source: 'api', severity: 'info', payload: {}, timestamp: Date.now() });
      const api = new IntelligenceAPI(engine);
      const withFilter = api.getInsights({ priority: 'high' });
      const noMatch = api.getInsights({ priority: 'nonexistent' });
      assert.ok(Array.isArray(withFilter));
      assert.strictEqual(noMatch.length, 0);
    });
  });

  describe('Integration — Intelligence with EventBus', () => {
    const EventBus = require('../../lib/events/eventBus');
    const { attachToEventBus, getIntelligenceEngine, resetDefaultEngine } = require('../../lib/events/intelligence');
    const IntelligenceEngine = require('../../lib/events/intelligence/intelligenceEngine');

    beforeEach(() => {
      resetDefaultEngine();
    });

    it('attachToEventBus processes events via wildcard', (done) => {
      const bus = new EventBus();
      const engine = getIntelligenceEngine();
      engine._onInsight = () => {
        assert.ok(engine.getHealth().totalProcessed >= 1);
        detach();
        done();
      };
      const detach = attachToEventBus(bus, engine);
      bus.emit('test.event', { key: 'val' }, { source: 'api' });
    });

    it('detach stops processing', () => {
      const bus = new EventBus();
      const engine = getIntelligenceEngine();
      const detach = attachToEventBus(bus, engine);
      detach();
      bus.emit('test.event', { key: 'val' }, { source: 'api' });
      assert.strictEqual(engine.getHealth().totalProcessed, 0);
    });

    it('intelligence.insight event is emitted to the bus by the engine', async () => {
      const bus = new EventBus();
      const engine = new IntelligenceEngine({ eventBus: bus });
      const insightPromise = new Promise((resolve) => {
        bus.on('intelligence.insight', (event) => resolve(event));
      });
      engine.ingest({ id: 'e-1', type: 'test', source: 'api', severity: 'info', payload: {}, timestamp: Date.now() });
      const event = await insightPromise;
      assert.strictEqual(event.type, 'intelligence.insight');
      assert.ok(event.payload.insight);
    });

    it('engine stores insights after ingest', () => {
      const engine = new IntelligenceEngine();
      const result = engine.ingest({ id: 'e-1', type: 'test', source: 'api', severity: 'info', payload: {}, timestamp: Date.now() });
      assert.ok(result.insights.length > 0);
      assert.ok(result.insights[0].insight);
    });
  });

  describe('Entry Point — index.js exports', () => {
    const events = require('../../lib/events');

    it('exports IntelligenceEngine', () => {
      assert.strictEqual(typeof events.IntelligenceEngine, 'function');
    });

    it('exports PatternDetector', () => {
      assert.strictEqual(typeof events.PatternDetector, 'function');
    });

    it('exports AnomalyDetector', () => {
      assert.strictEqual(typeof events.AnomalyDetector, 'function');
    });

    it('exports CorrelationEngine', () => {
      assert.strictEqual(typeof events.CorrelationEngine, 'function');
    });

    it('exports InsightGenerator', () => {
      assert.strictEqual(typeof events.InsightGenerator, 'function');
    });

    it('exports EventScorer', () => {
      assert.strictEqual(typeof events.EventScorer, 'function');
    });

    it('exports IntelligenceStore', () => {
      assert.strictEqual(typeof events.IntelligenceStore, 'function');
    });

    it('exports IntelligenceAPI', () => {
      assert.strictEqual(typeof events.IntelligenceAPI, 'function');
    });

    it('exports getIntelligenceEngine', () => {
      assert.strictEqual(typeof events.getIntelligenceEngine, 'function');
    });

    it('exports createIntelligenceEngine', () => {
      assert.strictEqual(typeof events.createIntelligenceEngine, 'function');
    });

    it('exports attachToEventBus', () => {
      assert.strictEqual(typeof events.attachToEventBus, 'function');
    });

    it('getIntelligenceEngine returns singleton', () => {
      const a = events.getIntelligenceEngine();
      const b = events.getIntelligenceEngine();
      assert.strictEqual(a, b);
    });
  });

  describe('Performance — <5ms per event', () => {
    const IntelligenceEngine = require('../../lib/events/intelligence/intelligenceEngine');

    it('processes events under 5ms average', function() {
      this.timeout(10000);
      const engine = new IntelligenceEngine();
      const count = 100;
      let total = 0;
      for (let i = 0; i < count; i++) {
        const start = Date.now();
        engine.ingest({
          id: `e-${i}`,
          type: i % 2 === 0 ? 'workflow.failure' : 'api.request',
          source: i % 2 === 0 ? 'workflow' : 'api',
          severity: i % 2 === 0 ? 'error' : 'info',
          payload: { retryCount: i % 3, latency: i * 10 },
          timestamp: Date.now(),
          correlationId: `corr-${i % 5}`,
        });
        total += Date.now() - start;
      }
      const avg = total / count;
      assert.ok(avg < 5, `Average processing time: ${avg}ms`);
    });

    it('handles burst of 500 events rapidly', function() {
      this.timeout(10000);
      const engine = new IntelligenceEngine();
      const start = Date.now();
      for (let i = 0; i < 500; i++) {
        engine.ingest({
          id: `e-${i}`,
          type: 'test.event',
          source: 'api',
          severity: 'info',
          payload: {},
          timestamp: Date.now(),
        });
      }
      const elapsed = Date.now() - start;
      const avg = elapsed / 500;
      assert.ok(avg < 5, `Average: ${avg}ms, Total: ${elapsed}ms`);
    });
  });

  describe('Event Hooks — Intelligence Integration', () => {
    const { installEventHooks, isInstalled, resetHooks } = require('../../lib/events/eventHooks');
    const { getIntelligenceEngine, resetDefaultEngine } = require('../../lib/events/intelligence');

    beforeEach(() => {
      resetHooks();
      resetDefaultEngine();
    });

    it('installs intelligence hook without errors', () => {
      const result = installEventHooks({ workflow: false, telemetry: false, cluster: false, ai: false, agent: false, intelligence: true });
      assert.ok(result);
    });

    it('intelligence engine processes events after hooks installed', (done) => {
      const { getEventBus } = require('../../lib/events');
      installEventHooks({ workflow: false, telemetry: false, cluster: false, ai: false, agent: false, intelligence: true });
      const engine = getIntelligenceEngine();
      const bus = getEventBus();
      const off = bus.on('intelligence.insight', () => {
        off();
        assert.ok(engine.getHealth().totalProcessed > 0);
        done();
      });
      bus.emit('test.trigger', { value: 42 }, { source: 'api' });
    });
  });
});
