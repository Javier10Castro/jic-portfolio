const assert = require('assert');
const {
  KnowledgeManager,
  KnowledgeEngine,
  KnowledgeStorage,
  KnowledgeRegistry,
  KnowledgeEvents,
  KnowledgeMetrics,
  KnowledgeReporter,
  KnowledgeGraph,
  EntityRegistry,
  RelationshipManager,
  GraphTraversal,
  GraphQueries,
  GraphVersioning,
  ArchitectureKnowledge,
  WorkflowKnowledge,
  DeploymentKnowledge,
  RuntimeKnowledge,
  SecurityKnowledge,
  BillingKnowledge,
  GovernanceKnowledge,
  EvaluationKnowledge,
  TelemetryKnowledge,
  IncidentKnowledge,
  PluginKnowledge,
  IntegrationKnowledge,
  PatternDiscovery,
  PatternMining,
  BestPracticeExtractor,
  AntiPatternDetector,
  SuccessFactors,
  FailurePatterns,
  RecommendationEngine,
  ContextMatcher,
  SimilarProjectFinder,
  ArchitectureRecommendations,
  WorkflowRecommendations,
  OptimizationRecommendations,
  CaseRegistry,
  CaseRetriever,
  CaseSimilarity,
  CaseRanking,
  LessonManager,
  LessonExtractor,
  LessonValidator,
  LessonPublisher,
  getDefaultKnowledgeManager
} = require('../lib/knowledge');

const { KnowledgeProvider } = require('../lib/plugin-sdk/KnowledgeProvider');
const { KnowledgeExtractor } = require('../lib/plugin-sdk/KnowledgeExtractor');
const { GraphEnricher } = require('../lib/plugin-sdk/GraphEnricher');
const { RecommendationProvider } = require('../lib/plugin-sdk/RecommendationProvider');
const { PatternAnalyzer } = require('../lib/plugin-sdk/PatternAnalyzer');
const { Plugin } = require('../lib/plugin-sdk/Plugin');

describe('Knowledge Core', function() {

  describe('KnowledgeManager', function() {
    it('should create a manager with all sub-modules', function() {
      const km = new KnowledgeManager();
      const status = km.getStatus();
      assert.strictEqual(status.initialized, true);
      assert.strictEqual(Object.keys(status.submodules).length, 44);
    });
    it('should return getDefaultKnowledgeManager', function() {
      const km = getDefaultKnowledgeManager();
      assert(km instanceof KnowledgeManager);
    });
    it('should clear all sub-modules', function() {
      const km = new KnowledgeManager();
      km.clear();
      assert.strictEqual(km.knowledgeGraph.nodeCount(), 0);
    });
    it('should have knowledgeEngine getter', function() {
      const km = new KnowledgeManager();
      assert(km.knowledgeEngine instanceof KnowledgeEngine);
    });
    it('should have knowledgeStorage getter', function() {
      const km = new KnowledgeManager();
      assert(km.knowledgeStorage instanceof KnowledgeStorage);
    });
    it('should have knowledgeRegistry getter', function() {
      const km = new KnowledgeManager();
      assert(km.knowledgeRegistry instanceof KnowledgeRegistry);
    });
    it('should have knowledgeEvents getter', function() {
      const km = new KnowledgeManager();
      assert(km.knowledgeEvents instanceof KnowledgeEvents);
    });
    it('should have knowledgeMetrics getter', function() {
      const km = new KnowledgeManager();
      assert(km.knowledgeMetrics instanceof KnowledgeMetrics);
    });
    it('should have knowledgeReporter getter', function() {
      const km = new KnowledgeManager();
      assert(km.knowledgeReporter instanceof KnowledgeReporter);
    });
    it('should have knowledgeGraph getter', function() {
      const km = new KnowledgeManager();
      assert(km.knowledgeGraph instanceof KnowledgeGraph);
    });
    it('should have entityRegistry getter', function() {
      const km = new KnowledgeManager();
      assert(km.entityRegistry instanceof EntityRegistry);
    });
    it('should have relationshipManager getter', function() {
      const km = new KnowledgeManager();
      assert(km.relationshipManager instanceof RelationshipManager);
    });
    it('should have graphTraversal getter', function() {
      const km = new KnowledgeManager();
      assert(km.graphTraversal instanceof GraphTraversal);
    });
    it('should have graphQueries getter', function() {
      const km = new KnowledgeManager();
      assert(km.graphQueries instanceof GraphQueries);
    });
    it('should have graphVersioning getter', function() {
      const km = new KnowledgeManager();
      assert(km.graphVersioning instanceof GraphVersioning);
    });
    it('should have architectureKnowledge getter', function() {
      const km = new KnowledgeManager();
      assert(km.architectureKnowledge instanceof ArchitectureKnowledge);
    });
    it('should have workflowKnowledge getter', function() {
      const km = new KnowledgeManager();
      assert(km.workflowKnowledge instanceof WorkflowKnowledge);
    });
    it('should have deploymentKnowledge getter', function() {
      const km = new KnowledgeManager();
      assert(km.deploymentKnowledge instanceof DeploymentKnowledge);
    });
    it('should have runtimeKnowledge getter', function() {
      const km = new KnowledgeManager();
      assert(km.runtimeKnowledge instanceof RuntimeKnowledge);
    });
    it('should have securityKnowledge getter', function() {
      const km = new KnowledgeManager();
      assert(km.securityKnowledge instanceof SecurityKnowledge);
    });
    it('should have billingKnowledge getter', function() {
      const km = new KnowledgeManager();
      assert(km.billingKnowledge instanceof BillingKnowledge);
    });
    it('should have governanceKnowledge getter', function() {
      const km = new KnowledgeManager();
      assert(km.governanceKnowledge instanceof GovernanceKnowledge);
    });
    it('should have evaluationKnowledge getter', function() {
      const km = new KnowledgeManager();
      assert(km.evaluationKnowledge instanceof EvaluationKnowledge);
    });
    it('should have telemetryKnowledge getter', function() {
      const km = new KnowledgeManager();
      assert(km.telemetryKnowledge instanceof TelemetryKnowledge);
    });
    it('should have incidentKnowledge getter', function() {
      const km = new KnowledgeManager();
      assert(km.incidentKnowledge instanceof IncidentKnowledge);
    });
    it('should have pluginKnowledge getter', function() {
      const km = new KnowledgeManager();
      assert(km.pluginKnowledge instanceof PluginKnowledge);
    });
    it('should have integrationKnowledge getter', function() {
      const km = new KnowledgeManager();
      assert(km.integrationKnowledge instanceof IntegrationKnowledge);
    });
    it('should have patternDiscovery getter', function() {
      const km = new KnowledgeManager();
      assert(km.patternDiscovery instanceof PatternDiscovery);
    });
    it('should have patternMining getter', function() {
      const km = new KnowledgeManager();
      assert(km.patternMining instanceof PatternMining);
    });
    it('should have bestPracticeExtractor getter', function() {
      const km = new KnowledgeManager();
      assert(km.bestPracticeExtractor instanceof BestPracticeExtractor);
    });
    it('should have antiPatternDetector getter', function() {
      const km = new KnowledgeManager();
      assert(km.antiPatternDetector instanceof AntiPatternDetector);
    });
    it('should have successFactors getter', function() {
      const km = new KnowledgeManager();
      assert(km.successFactors instanceof SuccessFactors);
    });
    it('should have failurePatterns getter', function() {
      const km = new KnowledgeManager();
      assert(km.failurePatterns instanceof FailurePatterns);
    });
    it('should have recommendationEngine getter', function() {
      const km = new KnowledgeManager();
      assert(km.recommendationEngine instanceof RecommendationEngine);
    });
    it('should have contextMatcher getter', function() {
      const km = new KnowledgeManager();
      assert(km.contextMatcher instanceof ContextMatcher);
    });
    it('should have similarProjectFinder getter', function() {
      const km = new KnowledgeManager();
      assert(km.similarProjectFinder instanceof SimilarProjectFinder);
    });
    it('should have architectureRecommendations getter', function() {
      const km = new KnowledgeManager();
      assert(km.architectureRecommendations instanceof ArchitectureRecommendations);
    });
    it('should have workflowRecommendations getter', function() {
      const km = new KnowledgeManager();
      assert(km.workflowRecommendations instanceof WorkflowRecommendations);
    });
    it('should have optimizationRecommendations getter', function() {
      const km = new KnowledgeManager();
      assert(km.optimizationRecommendations instanceof OptimizationRecommendations);
    });
    it('should have caseRegistry getter', function() {
      const km = new KnowledgeManager();
      assert(km.caseRegistry instanceof CaseRegistry);
    });
    it('should have caseRetriever getter', function() {
      const km = new KnowledgeManager();
      assert(km.caseRetriever instanceof CaseRetriever);
    });
    it('should have caseSimilarity getter', function() {
      const km = new KnowledgeManager();
      assert(km.caseSimilarity instanceof CaseSimilarity);
    });
    it('should have caseRanking getter', function() {
      const km = new KnowledgeManager();
      assert(km.caseRanking instanceof CaseRanking);
    });
    it('should have lessonManager getter', function() {
      const km = new KnowledgeManager();
      assert(km.lessonManager instanceof LessonManager);
    });
    it('should have lessonExtractor getter', function() {
      const km = new KnowledgeManager();
      assert(km.lessonExtractor instanceof LessonExtractor);
    });
    it('should have lessonValidator getter', function() {
      const km = new KnowledgeManager();
      assert(km.lessonValidator instanceof LessonValidator);
    });
    it('should have lessonPublisher getter', function() {
      const km = new KnowledgeManager();
      assert(km.lessonPublisher instanceof LessonPublisher);
    });
  });

  describe('KnowledgeEngine', function() {
    it('should ingest knowledge', function() {
      const e = new KnowledgeEngine();
      const r = e.ingest('architecture', { patterns: ['layered'] });
      assert(r.id.startsWith('know_'));
      assert.strictEqual(r.sourceType, 'architecture');
      assert.strictEqual(r.status, 'ingested');
    });
    it('should throw if sourceType is missing', function() {
      const e = new KnowledgeEngine();
      assert.throws(() => e.ingest(), /sourceType is required/);
    });
    it('should throw if data is missing', function() {
      const e = new KnowledgeEngine();
      assert.throws(() => e.ingest('test'), /data is required/);
    });
    it('should process a session', function() {
      const e = new KnowledgeEngine();
      const r = e.ingest('wf', { steps: 5 });
      const p = e.process(r.id);
      assert.strictEqual(p.status, 'processing');
    });
    it('should return null for unknown process', function() {
      const e = new KnowledgeEngine();
      assert.strictEqual(e.process('nonexistent'), null);
    });
    it('should complete a session with result', function() {
      const e = new KnowledgeEngine();
      const r = e.ingest('test', { data: 1 });
      const c = e.complete(r.id, { success: true });
      assert.strictEqual(c.status, 'completed');
      assert.deepStrictEqual(c.result, { success: true });
    });
    it('should fail a session', function() {
      const e = new KnowledgeEngine();
      const r = e.ingest('test', { data: 1 });
      const f = e.fail(r.id, 'error happened');
      assert.strictEqual(f.status, 'failed');
      assert.strictEqual(f.error, 'error happened');
    });
    it('should return null for unknown get', function() {
      const e = new KnowledgeEngine();
      assert.strictEqual(e.get('x'), null);
    });
    it('should return null for null get', function() {
      const e = new KnowledgeEngine();
      assert.strictEqual(e.get(null), null);
    });
    it('should list all sessions', function() {
      const e = new KnowledgeEngine();
      e.ingest('a', { x: 1 });
      e.ingest('b', { y: 2 });
      assert.strictEqual(e.list().length, 2);
    });
    it('should filter list by sourceType', function() {
      const e = new KnowledgeEngine();
      e.ingest('type_a', { x: 1 });
      e.ingest('type_b', { y: 2 });
      assert.strictEqual(e.list('type_a').length, 1);
    });
    it('should process and complete a session', function() {
      const e = new KnowledgeEngine();
      const r = e.ingest('test', { v: 1 });
      e.process(r.id);
      e.complete(r.id, { ok: true });
      const s = e.get(r.id);
      assert.strictEqual(s.status, 'completed');
    });
    it('should fail with default message', function() {
      const e = new KnowledgeEngine();
      const r = e.ingest('test', {});
      const f = e.fail(r.id);
      assert.strictEqual(f.error, 'unknown error');
    });
    it('should clear', function() {
      const e = new KnowledgeEngine();
      e.ingest('t', {});
      e.clear();
      assert.strictEqual(e.list().length, 0);
    });
  });

  describe('KnowledgeStorage', function() {
    it('should set and get values', function() {
      const s = new KnowledgeStorage();
      s.set('k1', { value: 42 });
      assert.deepStrictEqual(s.get('k1'), { value: 42 });
    });
    it('should return null for missing key', function() {
      const s = new KnowledgeStorage();
      assert.strictEqual(s.get('nope'), null);
    });
    it('should return null for null key', function() {
      const s = new KnowledgeStorage();
      assert.strictEqual(s.get(null), null);
    });
    it('should check has', function() {
      const s = new KnowledgeStorage();
      s.set('k', 'v');
      assert.strictEqual(s.has('k'), true);
      assert.strictEqual(s.has('x'), false);
    });
    it('should return false has for null', function() {
      const s = new KnowledgeStorage();
      assert.strictEqual(s.has(null), false);
    });
    it('should delete keys', function() {
      const s = new KnowledgeStorage();
      s.set('k', 'v');
      assert.strictEqual(s.delete('k'), true);
      assert.strictEqual(s.get('k'), null);
    });
    it('should return false delete for missing', function() {
      const s = new KnowledgeStorage();
      assert.strictEqual(s.delete('x'), false);
    });
    it('should return false delete for null', function() {
      const s = new KnowledgeStorage();
      assert.strictEqual(s.delete(null), false);
    });
    it('should getAll', function() {
      const s = new KnowledgeStorage();
      s.set('a', 1);
      s.set('b', 2);
      const all = s.getAll();
      assert.deepStrictEqual(all, { a: 1, b: 2 });
    });
    it('should handle set with null key gracefully', function() {
      const s = new KnowledgeStorage();
      s.set(null, 'val');
      assert.strictEqual(s.get(null), null);
    });
    it('should report size', function() {
      const s = new KnowledgeStorage();
      s.set('a', 1);
      s.set('b', 2);
      assert.strictEqual(s.size(), 2);
    });
    it('should clear', function() {
      const s = new KnowledgeStorage();
      s.set('k', 'v');
      s.clear();
      assert.strictEqual(s.size(), 0);
    });
  });

  describe('KnowledgeRegistry', function() {
    it('should register an entry', function() {
      const r = new KnowledgeRegistry();
      const e = r.register('my-entry', 'pattern', { source: 'test' });
      assert(e.id.startsWith('kreg_'));
      assert.strictEqual(e.name, 'my-entry');
    });
    it('should throw if name is missing', function() {
      const r = new KnowledgeRegistry();
      assert.throws(() => r.register(), /name is required/);
    });
    it('should throw if type is missing', function() {
      const r = new KnowledgeRegistry();
      assert.throws(() => r.register('n'), /type is required/);
    });
    it('should get by id', function() {
      const r = new KnowledgeRegistry();
      const e = r.register('test', 'type');
      assert.strictEqual(r.get(e.id).name, 'test');
    });
    it('should return null for missing id', function() {
      const r = new KnowledgeRegistry();
      assert.strictEqual(r.get('x'), null);
    });
    it('should return null for null id', function() {
      const r = new KnowledgeRegistry();
      assert.strictEqual(r.get(null), null);
    });
    it('should findByName', function() {
      const r = new KnowledgeRegistry();
      r.register('uniq', 'type');
      assert(r.findByName('uniq'));
    });
    it('should return null for missing name', function() {
      const r = new KnowledgeRegistry();
      assert.strictEqual(r.findByName('x'), null);
    });
    it('should findByType', function() {
      const r = new KnowledgeRegistry();
      r.register('a', 'type1');
      r.register('b', 'type1');
      r.register('c', 'type2');
      assert.strictEqual(r.findByType('type1').length, 2);
    });
    it('should return empty array for missing type', function() {
      const r = new KnowledgeRegistry();
      assert.deepStrictEqual(r.findByType('x'), []);
    });
    it('should list all', function() {
      const r = new KnowledgeRegistry();
      r.register('a', 't');
      r.register('b', 't');
      assert.strictEqual(r.list().length, 2);
    });
    it('should count entries', function() {
      const r = new KnowledgeRegistry();
      assert.strictEqual(r.count(), 0);
      r.register('a', 't');
      assert.strictEqual(r.count(), 1);
    });
    it('should clear', function() {
      const r = new KnowledgeRegistry();
      r.register('a', 't');
      r.clear();
      assert.strictEqual(r.count(), 0);
    });
  });

  describe('KnowledgeEvents', function() {
    it('should emit and listen', function() {
      const ev = new KnowledgeEvents();
      let called = false;
      ev.on('test:event', () => called = true);
      ev.emit('test:event');
      assert.strictEqual(called, true);
    });
    it('should pass arguments to listener', function() {
      const ev = new KnowledgeEvents();
      let args = null;
      ev.on('test:args', (...a) => args = a);
      ev.emit('test:args', 1, 2, 3);
      assert.deepStrictEqual(args, [1, 2, 3]);
    });
    it('should not throw if listener throws', function() {
      const ev = new KnowledgeEvents();
      ev.on('err', () => { throw new Error('boom'); });
      ev.emit('err');
    });
    it('should return false emitting unregistered event', function() {
      const ev = new KnowledgeEvents();
      assert.strictEqual(ev.emit('nonexistent'), false);
    });
    it('should throw emitting null event', function() {
      const ev = new KnowledgeEvents();
      assert.throws(() => ev.emit(null), /event must be a non-empty string/);
    });
    it('should throw on null event on', function() {
      const ev = new KnowledgeEvents();
      assert.throws(() => ev.on(null, () => {}), /event must be a non-empty string/);
    });
    it('should throw on non-function listener', function() {
      const ev = new KnowledgeEvents();
      assert.throws(() => ev.on('e', 'notfunc'), /listener must be a function/);
    });
    it('should off a listener', function() {
      const ev = new KnowledgeEvents();
      let count = 0;
      const fn = () => count++;
      ev.on('e', fn);
      ev.emit('e');
      ev.off('e', fn);
      ev.emit('e');
      assert.strictEqual(count, 1);
    });
    it('should list event names', function() {
      const ev = new KnowledgeEvents();
      ev.on('a', () => {});
      ev.on('b', () => {});
      const list = ev.listEvents();
      assert(list.includes('a'));
      assert(list.includes('b'));
    });
    it('should have static event types', function() {
      assert(KnowledgeEvents.EVENTS.KNOWLEDGE_INGESTED);
      assert(KnowledgeEvents.EVENTS.KNOWLEDGE_PROCESSED);
      assert(KnowledgeEvents.EVENTS.PATTERN_DISCOVERED);
      assert(KnowledgeEvents.EVENTS.CASE_STORED);
      assert(KnowledgeEvents.EVENTS.LESSON_EXTRACTED);
    });
    it('should clear', function() {
      const ev = new KnowledgeEvents();
      ev.on('e', () => {});
      ev.clear();
      assert.strictEqual(ev.listEvents().length, 0);
    });
    it('should handle off with null event', function() {
      const ev = new KnowledgeEvents();
      ev.off(null, () => {});
    });
  });

  describe('KnowledgeMetrics', function() {
    it('should record metrics', function() {
      const m = new KnowledgeMetrics();
      const e = m.record('test_metric', 100, { tag: 'a' });
      assert.strictEqual(e.name, 'test_metric');
      assert.strictEqual(e.value, 100);
    });
    it('should throw if name is missing', function() {
      const m = new KnowledgeMetrics();
      assert.throws(() => m.record(), /name is required/);
    });
    it('should throw if value is missing', function() {
      const m = new KnowledgeMetrics();
      assert.throws(() => m.record('n'), /value is required/);
    });
    it('should query by name', function() {
      const m = new KnowledgeMetrics();
      m.record('a', 1);
      m.record('b', 2);
      m.record('a', 3);
      assert.strictEqual(m.query('a').length, 2);
    });
    it('should return empty array for missing query', function() {
      const m = new KnowledgeMetrics();
      assert.deepStrictEqual(m.query('x'), []);
    });
    it('should aggregate values', function() {
      const m = new KnowledgeMetrics();
      m.record('x', 10);
      m.record('x', 20);
      assert.strictEqual(m.aggregate('x'), 30);
    });
    it('should return null aggregating missing name', function() {
      const m = new KnowledgeMetrics();
      assert.strictEqual(m.aggregate('x'), null);
    });
    it('should use custom aggregate function', function() {
      const m = new KnowledgeMetrics();
      m.record('x', 10);
      m.record('x', 20);
      const max = m.aggregate('x', vals => Math.max(...vals));
      assert.strictEqual(max, 20);
    });
    it('should get metric names', function() {
      const m = new KnowledgeMetrics();
      m.record('a', 1);
      m.record('b', 2);
      m.record('a', 3);
      const names = m.getMetricNames();
      assert(names.includes('a'));
      assert(names.includes('b'));
      assert.strictEqual(names.length, 2);
    });
    it('should clear', function() {
      const m = new KnowledgeMetrics();
      m.record('a', 1);
      m.clear();
      assert.strictEqual(m.query('a').length, 0);
    });
  });

  describe('KnowledgeReporter', function() {
    it('should generate a report', function() {
      const r = new KnowledgeReporter();
      const rep = r.generateReport('k1', { findings: [] });
      assert(rep.id.startsWith('krpt_'));
      assert.strictEqual(rep.knowledgeId, 'k1');
    });
    it('should throw if knowledgeId is missing', function() {
      const r = new KnowledgeReporter();
      assert.throws(() => r.generateReport(), /knowledgeId is required/);
    });
    it('should get by id', function() {
      const r = new KnowledgeReporter();
      const rep = r.generateReport('k1');
      assert.strictEqual(r.get(rep.id).knowledgeId, 'k1');
    });
    it('should return null for missing id', function() {
      const r = new KnowledgeReporter();
      assert.strictEqual(r.get('x'), null);
    });
    it('should list all', function() {
      const r = new KnowledgeReporter();
      r.generateReport('a');
      r.generateReport('b');
      assert.strictEqual(r.list().length, 2);
    });
    it('should filter by knowledgeId', function() {
      const r = new KnowledgeReporter();
      r.generateReport('a');
      r.generateReport('a');
      r.generateReport('b');
      assert.strictEqual(r.list('a').length, 2);
    });
    it('should use default empty data', function() {
      const r = new KnowledgeReporter();
      const rep = r.generateReport('k1');
      assert.deepStrictEqual(rep.data, {});
    });
    it('should clear', function() {
      const r = new KnowledgeReporter();
      r.generateReport('a');
      r.clear();
      assert.strictEqual(r.list().length, 0);
    });
  });
});

describe('Knowledge Graph', function() {
  describe('KnowledgeGraph', function() {
    it('should add a node', function() {
      const g = new KnowledgeGraph();
      const n = g.addNode('e1', 'service', { name: 'auth' });
      assert.strictEqual(n.id, 'e1');
      assert.strictEqual(n.type, 'service');
    });
    it('should throw if entityId is missing', function() {
      const g = new KnowledgeGraph();
      assert.throws(() => g.addNode(), /entityId is required/);
    });
    it('should throw if type is missing', function() {
      const g = new KnowledgeGraph();
      assert.throws(() => g.addNode('e'), /type is required/);
    });
    it('should get a node', function() {
      const g = new KnowledgeGraph();
      g.addNode('e1', 'svc');
      assert(g.getNode('e1'));
    });
    it('should return null for missing node', function() {
      const g = new KnowledgeGraph();
      assert.strictEqual(g.getNode('x'), null);
    });
    it('should remove a node and its edges', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 't');
      g.addNode('b', 't');
      g.addEdge('a', 'b', 'depends');
      g.removeNode('a');
      assert.strictEqual(g.getNode('a'), null);
      assert.strictEqual(g.getEdges(null, null, 'depends').length, 0);
    });
    it('should return false removing nonexistent node', function() {
      const g = new KnowledgeGraph();
      assert.strictEqual(g.removeNode('x'), false);
    });
    it('should add an edge', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 't');
      g.addNode('b', 't');
      const e = g.addEdge('a', 'b', 'depends', { weight: 1 });
      assert(e.id.startsWith('edge_'));
      assert.strictEqual(e.from, 'a');
      assert.strictEqual(e.to, 'b');
    });
    it('should throw adding edge without from', function() {
      const g = new KnowledgeGraph();
      assert.throws(() => g.addEdge(), /from, to, and relation are required/);
    });
    it('should remove an edge', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 't');
      g.addNode('b', 't');
      const e = g.addEdge('a', 'b', 'dep');
      assert.strictEqual(g.removeEdge(e.id), true);
      assert.strictEqual(g.getEdges().length, 0);
    });
    it('should return false removing missing edge', function() {
      const g = new KnowledgeGraph();
      assert.strictEqual(g.removeEdge('x'), false);
    });
    it('should get edges filtered', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 't'); g.addNode('b', 't'); g.addNode('c', 't');
      g.addEdge('a', 'b', 'dep');
      g.addEdge('a', 'c', 'dep');
      g.addEdge('b', 'c', 'ref');
      assert.strictEqual(g.getEdges('a', null, 'dep').length, 2);
      assert.strictEqual(g.getEdges('b', null, 'ref').length, 1);
    });
    it('should get nodes by type', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 'svc');
      g.addNode('b', 'svc');
      g.addNode('c', 'wf');
      assert.strictEqual(g.getNodesByType('svc').length, 2);
      assert.strictEqual(g.getNodesByType('wf').length, 1);
    });
    it('should return empty array for missing type', function() {
      const g = new KnowledgeGraph();
      assert.deepStrictEqual(g.getNodesByType('x'), []);
    });
    it('should get all nodes', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 't');
      g.addNode('b', 't');
      assert.strictEqual(g.getAllNodes().length, 2);
    });
    it('should get all edges', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 't'); g.addNode('b', 't');
      g.addEdge('a', 'b', 'r');
      assert.strictEqual(g.getAllEdges().length, 1);
    });
    it('should count nodes', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 't');
      assert.strictEqual(g.nodeCount(), 1);
    });
    it('should count edges', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 't'); g.addNode('b', 't');
      g.addEdge('a', 'b', 'r');
      assert.strictEqual(g.edgeCount(), 1);
    });
    it('should clear', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 't');
      g.clear();
      assert.strictEqual(g.nodeCount(), 0);
      assert.strictEqual(g.edgeCount(), 0);
    });
  });

  describe('EntityRegistry', function() {
    it('should register an entity', function() {
      const r = new EntityRegistry();
      const e = r.register('service', 'auth-service', { port: 3000 });
      assert(e.id.startsWith('ent_'));
      assert.strictEqual(e.name, 'auth-service');
    });
    it('should throw without type', function() {
      const r = new EntityRegistry();
      assert.throws(() => r.register(), /type is required/);
    });
    it('should throw without name', function() {
      const r = new EntityRegistry();
      assert.throws(() => r.register('t'), /name is required/);
    });
    it('should get by id', function() {
      const r = new EntityRegistry();
      const e = r.register('t', 'n');
      assert.strictEqual(r.get(e.id).name, 'n');
    });
    it('should return null for missing id', function() {
      const r = new EntityRegistry();
      assert.strictEqual(r.get('x'), null);
    });
    it('should findByName', function() {
      const r = new EntityRegistry();
      r.register('t', 'unique-name');
      assert.strictEqual(r.findByName('unique-name').length, 1);
    });
    it('should findByType', function() {
      const r = new EntityRegistry();
      r.register('svc', 'a');
      r.register('svc', 'b');
      r.register('wf', 'c');
      assert.strictEqual(r.findByType('svc').length, 2);
    });
    it('should update entity attributes', function() {
      const r = new EntityRegistry();
      const e = r.register('t', 'n', { x: 1 });
      r.update(e.id, { y: 2 });
      assert.strictEqual(r.get(e.id).attributes.y, 2);
      assert.strictEqual(r.get(e.id).attributes.x, 1);
    });
    it('should return null updating missing entity', function() {
      const r = new EntityRegistry();
      assert.strictEqual(r.update('x', {}), null);
    });
    it('should remove entity', function() {
      const r = new EntityRegistry();
      const e = r.register('t', 'n');
      assert.strictEqual(r.remove(e.id), true);
      assert.strictEqual(r.get(e.id), null);
    });
    it('should return false removing missing', function() {
      const r = new EntityRegistry();
      assert.strictEqual(r.remove('x'), false);
    });
    it('should list all', function() {
      const r = new EntityRegistry();
      r.register('a', 'n1');
      r.register('b', 'n2');
      assert.strictEqual(r.list().length, 2);
    });
    it('should count', function() {
      const r = new EntityRegistry();
      r.register('t', 'n');
      assert.strictEqual(r.count(), 1);
    });
    it('should clear', function() {
      const r = new EntityRegistry();
      r.register('t', 'n');
      r.clear();
      assert.strictEqual(r.count(), 0);
    });
  });

  describe('RelationshipManager', function() {
    it('should define a relationship', function() {
      const r = new RelationshipManager();
      const rel = r.define('src1', 'tgt1', 'depends', { weight: 1 });
      assert(rel.id.startsWith('rel_'));
      assert.strictEqual(rel.sourceId, 'src1');
    });
    it('should throw without sourceId', function() {
      const r = new RelationshipManager();
      assert.throws(() => r.define(), /sourceId, targetId, and type are required/);
    });
    it('should get by id', function() {
      const r = new RelationshipManager();
      const rel = r.define('s', 't', 'dep');
      assert.strictEqual(r.get(rel.id).type, 'dep');
    });
    it('should return null for missing id', function() {
      const r = new RelationshipManager();
      assert.strictEqual(r.get('x'), null);
    });
    it('should findBySource', function() {
      const r = new RelationshipManager();
      r.define('s1', 't1', 'dep');
      r.define('s1', 't2', 'dep');
      assert.strictEqual(r.findBySource('s1').length, 2);
    });
    it('should findByTarget', function() {
      const r = new RelationshipManager();
      r.define('s1', 't1', 'dep');
      r.define('s2', 't1', 'dep');
      assert.strictEqual(r.findByTarget('t1').length, 2);
    });
    it('should findByType', function() {
      const r = new RelationshipManager();
      r.define('s', 't', 'type_a');
      r.define('s', 't', 'type_b');
      assert.strictEqual(r.findByType('type_a').length, 1);
    });
    it('should remove', function() {
      const r = new RelationshipManager();
      const rel = r.define('s', 't', 'dep');
      assert.strictEqual(r.remove(rel.id), true);
      assert.strictEqual(r.list().length, 0);
    });
    it('should return false removing missing', function() {
      const r = new RelationshipManager();
      assert.strictEqual(r.remove('x'), false);
    });
    it('should list all', function() {
      const r = new RelationshipManager();
      r.define('a', 'b', 't');
      r.define('c', 'd', 't');
      assert.strictEqual(r.list().length, 2);
    });
    it('should count', function() {
      const r = new RelationshipManager();
      r.define('a', 'b', 't');
      assert.strictEqual(r.count(), 1);
    });
    it('should clear', function() {
      const r = new RelationshipManager();
      r.define('a', 'b', 't');
      r.clear();
      assert.strictEqual(r.count(), 0);
    });
  });

  describe('GraphTraversal', function() {
    it('should perform BFS', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 't'); g.addNode('b', 't'); g.addNode('c', 't');
      g.addEdge('a', 'b', 'r'); g.addEdge('b', 'c', 'r');
      const t = new GraphTraversal();
      t.setGraph(g);
      const r = t.bfs('a', 5);
      assert.strictEqual(r.length, 3);
    });
    it('should return start node when graph is empty', function() {
      const t = new GraphTraversal();
      const r = t.bfs('x', 5);
      assert.strictEqual(r.length, 1);
      assert.strictEqual(r[0].id, 'x');
    });
    it('should perform DFS', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 't'); g.addNode('b', 't');
      g.addEdge('a', 'b', 'r');
      const t = new GraphTraversal();
      t.setGraph(g);
      const r = t.dfs('a', 5);
      assert(r.length >= 1);
    });
    it('should find a path between nodes', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 't'); g.addNode('b', 't'); g.addNode('c', 't');
      g.addEdge('a', 'b', 'r'); g.addEdge('b', 'c', 'r');
      const t = new GraphTraversal();
      t.setGraph(g);
      const path = t.findPath('a', 'c');
      assert(path);
      assert(path.includes('a'));
      assert(path.includes('c'));
    });
    it('should return null path for disconnected nodes', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 't'); g.addNode('z', 't');
      const t = new GraphTraversal();
      t.setGraph(g);
      assert.strictEqual(t.findPath('a', 'z'), null);
    });
    it('should return null for missing path params', function() {
      const t = new GraphTraversal();
      assert.strictEqual(t.findPath(null, 'x'), null);
    });
    it('should get neighbors', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 't'); g.addNode('b', 't');
      g.addEdge('a', 'b', 'dep');
      const t = new GraphTraversal();
      t.setGraph(g);
      const n = t.getNeighbors('a');
      assert.strictEqual(n.length, 1);
      assert.strictEqual(n[0].id, 'b');
    });
    it('should return empty for unknown node neighbors', function() {
      const t = new GraphTraversal();
      assert.deepStrictEqual(t.getNeighbors('x'), []);
    });
    it('should handle empty graph traversal returning start node', function() {
      const t = new GraphTraversal();
      const r = t.bfs('a', 5);
      assert.strictEqual(r.length, 1);
      assert.strictEqual(r[0].id, 'a');
    });
    it('should clear', function() {
      const t = new GraphTraversal();
      t.setGraph(new KnowledgeGraph());
      t.clear();
    });
  });

  describe('GraphQueries', function() {
    it('should find nodes', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 'svc', { name: 'api' });
      g.addNode('b', 'svc', { name: 'db' });
      const q = new GraphQueries();
      q.setGraph(g);
      const r = q.findNodes({ type: 'svc' });
      assert.strictEqual(r.length, 2);
    });
    it('should find node by property', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 'svc', { name: 'api' });
      const q = new GraphQueries();
      q.setGraph(g);
      const r = q.findByProperty('name', 'api');
      assert.strictEqual(r.length, 1);
    });
    it('should find subgraph', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 't'); g.addNode('b', 't');
      g.addEdge('a', 'b', 'r');
      const q = new GraphQueries();
      q.setGraph(g);
      const sg = q.findSubgraph(['a', 'b']);
      assert.strictEqual(sg.nodes.length, 2);
      assert.strictEqual(sg.edges.length, 1);
    });
    it('should get connected components', function() {
      const g = new KnowledgeGraph();
      g.addNode('a', 't'); g.addNode('b', 't');
      g.addEdge('a', 'b', 'r');
      g.addNode('c', 't');
      const q = new GraphQueries();
      q.setGraph(g);
      const comps = q.getConnectedComponents();
      assert(comps.length >= 2);
    });
    it('should return empty for null query', function() {
      const q = new GraphQueries();
      assert.deepStrictEqual(q.findNodes(), []);
    });
    it('should clear', function() {
      const q = new GraphQueries();
      q.setGraph(new KnowledgeGraph());
      q.clear();
    });
  });

  describe('GraphVersioning', function() {
    it('should create a snapshot', function() {
      const v = new GraphVersioning();
      const s = v.snapshot({ nodes: [], edges: [] }, 'v1');
      assert(s.id.startsWith('ver_'));
      assert.strictEqual(s.label, 'v1');
    });
    it('should throw without state', function() {
      const v = new GraphVersioning();
      assert.throws(() => v.snapshot(), /graphState is required/);
    });
    it('should get a version', function() {
      const v = new GraphVersioning();
      const s = v.snapshot({}, 'v1');
      assert.strictEqual(v.get(s.id).label, 'v1');
    });
    it('should return null for missing version', function() {
      const v = new GraphVersioning();
      assert.strictEqual(v.get('x'), null);
    });
    it('should list all versions', function() {
      const v = new GraphVersioning();
      v.snapshot({}, 'v1');
      v.snapshot({}, 'v2');
      assert.strictEqual(v.list().length, 2);
    });
    it('should get latest version', function() {
      const v = new GraphVersioning();
      v.snapshot({}, 'first');
      const last = v.snapshot({}, 'last');
      const latest = v.getLatest();
      assert(latest);
      assert(['first', 'last'].includes(latest.label));
    });
    it('should return null for latest on empty', function() {
      const v = new GraphVersioning();
      assert.strictEqual(v.getLatest(), null);
    });
    it('should diff two versions', function() {
      const v = new GraphVersioning();
      const a = v.snapshot({ nodes: [{ id: 'n1' }], edges: [{ id: 'e1' }] }, 'a');
      const b = v.snapshot({ nodes: [{ id: 'n1' }, { id: 'n2' }], edges: [{ id: 'e1' }] }, 'b');
      const d = v.diff(a.id, b.id);
      assert(d);
      assert(d.nodesAdded.includes('n2'));
    });
    it('should return null diff for missing versions', function() {
      const v = new GraphVersioning();
      assert.strictEqual(v.diff('x', 'y'), null);
    });
    it('should use default label', function() {
      const v = new GraphVersioning();
      const s = v.snapshot({});
      assert(s.label.startsWith('snapshot_'));
    });
    it('should clear', function() {
      const v = new GraphVersioning();
      v.snapshot({});
      v.clear();
      assert.strictEqual(v.list().length, 0);
    });
  });
});

describe('Knowledge Sources', function() {
  describe('ArchitectureKnowledge', function() {
    it('should capture architecture knowledge', function() {
      const a = new ArchitectureKnowledge();
      const e = a.capture('proj1', { patterns: ['layered'], decisions: ['use-postgres'] });
      assert(e.id.startsWith('arch_k_'));
      assert.strictEqual(e.projectId, 'proj1');
    });
    it('should throw without projectId', function() {
      const a = new ArchitectureKnowledge();
      assert.throws(() => a.capture(), /projectId is required/);
    });
    it('should get by id', function() {
      const a = new ArchitectureKnowledge();
      const e = a.capture('p1');
      assert.strictEqual(a.get(e.id).projectId, 'p1');
    });
    it('should return null for missing id', function() {
      const a = new ArchitectureKnowledge();
      assert.strictEqual(a.get('x'), null);
    });
    it('should findByProject', function() {
      const a = new ArchitectureKnowledge();
      a.capture('p1');
      a.capture('p1');
      a.capture('p2');
      assert.strictEqual(a.findByProject('p1').length, 2);
    });
    it('should list all', function() {
      const a = new ArchitectureKnowledge();
      a.capture('p1');
      a.capture('p2');
      assert.strictEqual(a.list().length, 2);
    });
    it('should use default empty data', function() {
      const a = new ArchitectureKnowledge();
      const e = a.capture('p1');
      assert.deepStrictEqual(e.patterns, []);
      assert.deepStrictEqual(e.decisions, []);
    });
    it('should clear', function() {
      const a = new ArchitectureKnowledge();
      a.capture('p1');
      a.clear();
      assert.strictEqual(a.list().length, 0);
    });
  });

  describe('WorkflowKnowledge', function() {
    it('should capture workflow knowledge', function() {
      const w = new WorkflowKnowledge();
      const e = w.capture('p1', { steps: ['build', 'deploy'] });
      assert(e.id.startsWith('wf_k_'));
    });
    it('should throw without projectId', function() {
      const w = new WorkflowKnowledge();
      assert.throws(() => w.capture(), /projectId is required/);
    });
    it('should get by id', function() {
      const w = new WorkflowKnowledge();
      const e = w.capture('p1');
      assert(w.get(e.id));
    });
    it('should findByProject', function() {
      const w = new WorkflowKnowledge();
      w.capture('p1');
      assert.strictEqual(w.findByProject('p1').length, 1);
    });
    it('should list all', function() {
      const w = new WorkflowKnowledge();
      w.capture('p1');
      w.capture('p2');
      assert.strictEqual(w.list().length, 2);
    });
    it('should clear', function() {
      const w = new WorkflowKnowledge();
      w.capture('p1');
      w.clear();
      assert.strictEqual(w.list().length, 0);
    });
  });

  describe('DeploymentKnowledge', function() {
    it('should capture deployment knowledge', function() {
      const d = new DeploymentKnowledge();
      const e = d.capture('p1', { environments: ['staging', 'prod'] });
      assert(e.id.startsWith('dep_k_'));
    });
    it('should throw without projectId', function() {
      const d = new DeploymentKnowledge();
      assert.throws(() => d.capture(), /projectId is required/);
    });
    it('should get/return null', function() {
      const d = new DeploymentKnowledge();
      assert.strictEqual(d.get('x'), null);
    });
    it('should clear', function() {
      const d = new DeploymentKnowledge();
      d.capture('p1');
      d.clear();
      assert.strictEqual(d.list().length, 0);
    });
  });

  describe('RuntimeKnowledge', function() {
    it('should capture runtime knowledge', function() {
      const r = new RuntimeKnowledge();
      const e = r.capture('p1', { incidents: ['outage-1'] });
      assert(e.id.startsWith('rt_k_'));
    });
    it('should throw without projectId', function() {
      const r = new RuntimeKnowledge();
      assert.throws(() => r.capture(), /projectId is required/);
    });
    it('should return null for missing get', function() {
      const r = new RuntimeKnowledge();
      assert.strictEqual(r.get('x'), null);
    });
    it('should clear', function() {
      const r = new RuntimeKnowledge();
      r.capture('p1');
      r.clear();
      assert.strictEqual(r.list().length, 0);
    });
  });

  describe('SecurityKnowledge', function() {
    it('should capture security knowledge', function() {
      const s = new SecurityKnowledge();
      const e = s.capture('p1', { findings: ['CVE-123'] });
      assert(e.id.startsWith('sec_k_'));
    });
    it('should findByProject', function() {
      const s = new SecurityKnowledge();
      s.capture('p1');
      assert.strictEqual(s.findByProject('p1').length, 1);
    });
    it('should clear', function() {
      const s = new SecurityKnowledge();
      s.capture('p1');
      s.clear();
      assert.strictEqual(s.list().length, 0);
    });
  });

  describe('BillingKnowledge', function() {
    it('should capture billing knowledge', function() {
      const b = new BillingKnowledge();
      const e = b.capture('p1', { costs: [{ service: 'compute', amount: 100 }] });
      assert(e.id.startsWith('bill_k_'));
    });
    it('should clear', function() {
      const b = new BillingKnowledge();
      b.capture('p1');
      b.clear();
      assert.strictEqual(b.list().length, 0);
    });
  });

  describe('GovernanceKnowledge', function() {
    it('should capture governance knowledge', function() {
      const g = new GovernanceKnowledge();
      const e = g.capture('p1', { policies: ['data-retention'] });
      assert(e.id.startsWith('gov_k_'));
    });
    it('should clear', function() {
      const g = new GovernanceKnowledge();
      g.capture('p1');
      g.clear();
      assert.strictEqual(g.list().length, 0);
    });
  });

  describe('EvaluationKnowledge', function() {
    it('should capture evaluation knowledge', function() {
      const e = new EvaluationKnowledge();
      const entry = e.capture('p1', { metrics: [{ name: 'accuracy', value: 0.95 }] });
      assert(entry.id.startsWith('eval_k_'));
    });
    it('should clear', function() {
      const e = new EvaluationKnowledge();
      e.capture('p1');
      e.clear();
      assert.strictEqual(e.list().length, 0);
    });
  });

  describe('TelemetryKnowledge', function() {
    it('should capture telemetry knowledge', function() {
      const t = new TelemetryKnowledge();
      const e = t.capture('p1', { metrics: [{ name: 'latency', value: 200 }] });
      assert(e.id.startsWith('tel_k_'));
    });
    it('should clear', function() {
      const t = new TelemetryKnowledge();
      t.capture('p1');
      t.clear();
      assert.strictEqual(t.list().length, 0);
    });
  });

  describe('IncidentKnowledge', function() {
    it('should capture incident knowledge', function() {
      const i = new IncidentKnowledge();
      const e = i.capture('p1', { incidents: [{ id: 'inc-1', severity: 'high' }] });
      assert(e.id.startsWith('inc_k_'));
    });
    it('should findByProject', function() {
      const i = new IncidentKnowledge();
      i.capture('p1');
      assert.strictEqual(i.findByProject('p1').length, 1);
    });
    it('should clear', function() {
      const i = new IncidentKnowledge();
      i.capture('p1');
      i.clear();
      assert.strictEqual(i.list().length, 0);
    });
  });

  describe('PluginKnowledge', function() {
    it('should capture plugin knowledge', function() {
      const p = new PluginKnowledge();
      const e = p.capture('p1', { plugins: ['auth-plugin'] });
      assert(e.id.startsWith('plug_k_'));
    });
    it('should clear', function() {
      const p = new PluginKnowledge();
      p.capture('p1');
      p.clear();
      assert.strictEqual(p.list().length, 0);
    });
  });

  describe('IntegrationKnowledge', function() {
    it('should capture integration knowledge', function() {
      const i = new IntegrationKnowledge();
      const e = i.capture('p1', { endpoints: ['/api/users'] });
      assert(e.id.startsWith('int_k_'));
    });
    it('should clear', function() {
      const i = new IntegrationKnowledge();
      i.capture('p1');
      i.clear();
      assert.strictEqual(i.list().length, 0);
    });
  });
});

describe('Pattern Discovery', function() {
  describe('PatternDiscovery', function() {
    it('should discover a pattern', function() {
      const p = new PatternDiscovery();
      const d = p.discover('microservices', { services: 5 }, 'default');
      assert(d.id.startsWith('pd_'));
      assert.strictEqual(d.name, 'microservices');
    });
    it('should throw without name', function() {
      const p = new PatternDiscovery();
      assert.throws(() => p.discover(), /name is required/);
    });
    it('should throw without sourceData', function() {
      const p = new PatternDiscovery();
      assert.throws(() => p.discover('n'), /sourceData is required/);
    });
    it('should get by id', function() {
      const p = new PatternDiscovery();
      const d = p.discover('n', {});
      assert.strictEqual(p.get(d.id).name, 'n');
    });
    it('should return null for missing id', function() {
      const p = new PatternDiscovery();
      assert.strictEqual(p.get('x'), null);
    });
    it('should findByName', function() {
      const p = new PatternDiscovery();
      p.discover('my-pattern', {});
      assert.strictEqual(p.findByName('my-pattern').length, 1);
    });
    it('should list all', function() {
      const p = new PatternDiscovery();
      p.discover('a', {});
      p.discover('b', {});
      assert.strictEqual(p.list().length, 2);
    });
    it('should clear', function() {
      const p = new PatternDiscovery();
      p.discover('a', {});
      p.clear();
      assert.strictEqual(p.list().length, 0);
    });
  });

  describe('PatternMining', function() {
    it('should mine patterns from array', function() {
      const m = new PatternMining();
      const r = m.mine(['a', 'b', 'a', 'c', 'a'], {});
      assert(r.id.startsWith('pm_'));
      assert(r.patterns.length > 0);
    });
    it('should throw without source', function() {
      const m = new PatternMining();
      assert.throws(() => m.mine(), /source is required/);
    });
    it('should get by id', function() {
      const m = new PatternMining();
      const r = m.mine([], {});
      assert(m.get(r.id));
    });
    it('should return null for missing id', function() {
      const m = new PatternMining();
      assert.strictEqual(m.get('x'), null);
    });
    it('should handle empty source', function() {
      const m = new PatternMining();
      const r = m.mine([], {});
      assert.strictEqual(r.patterns.length, 0);
    });
    it('should list all', function() {
      const m = new PatternMining();
      m.mine([1]);
      m.mine([2]);
      assert.strictEqual(m.list().length, 2);
    });
    it('should clear', function() {
      const m = new PatternMining();
      m.mine([1]);
      m.clear();
      assert.strictEqual(m.list().length, 0);
    });
  });

  describe('BestPracticeExtractor', function() {
    it('should extract a best practice', function() {
      const b = new BestPracticeExtractor();
      const p = b.extract('use-circuit-breakers', 'production-runbook', ['reduced outages']);
      assert(p.id.startsWith('bp_'));
      assert(p.confidence > 0);
    });
    it('should throw without name', function() {
      const b = new BestPracticeExtractor();
      assert.throws(() => b.extract(), /name is required/);
    });
    it('should throw without source', function() {
      const b = new BestPracticeExtractor();
      assert.throws(() => b.extract('n'), /source is required/);
    });
    it('should get by id', function() {
      const b = new BestPracticeExtractor();
      const p = b.extract('n', 's', ['e1']);
      assert.strictEqual(b.get(p.id).name, 'n');
    });
    it('should return null for missing id', function() {
      const b = new BestPracticeExtractor();
      assert.strictEqual(b.get('x'), null);
    });
    it('should findByName', function() {
      const b = new BestPracticeExtractor();
      b.extract('my-practice', 'src', ['ev']);
      assert.strictEqual(b.findByName('my-practice').length, 1);
    });
    it('should list all', function() {
      const b = new BestPracticeExtractor();
      b.extract('a', 's', []);
      b.extract('b', 's', []);
      assert.strictEqual(b.list().length, 2);
    });
    it('should clear', function() {
      const b = new BestPracticeExtractor();
      b.extract('a', 's', []);
      b.clear();
      assert.strictEqual(b.list().length, 0);
    });
  });

  describe('AntiPatternDetector', function() {
    it('should detect an anti-pattern', function() {
      const a = new AntiPatternDetector();
      const d = a.detect('god-object', { methods: 50 }, ['low-cohesion', 'many-deps', 'hard-to-test']);
      assert(d.id.startsWith('ap_'));
      assert.strictEqual(d.severity, 'medium');
    });
    it('should throw without name', function() {
      const a = new AntiPatternDetector();
      assert.throws(() => a.detect(), /name is required/);
    });
    it('should throw without sourceData', function() {
      const a = new AntiPatternDetector();
      assert.throws(() => a.detect('n'), /sourceData is required/);
    });
    it('should set severity to low for no indicators', function() {
      const a = new AntiPatternDetector();
      const d = a.detect('test', {});
      assert.strictEqual(d.severity, 'low');
    });
    it('should get by id', function() {
      const a = new AntiPatternDetector();
      const d = a.detect('n', {});
      assert(a.get(d.id));
    });
    it('should findBySeverity', function() {
      const a = new AntiPatternDetector();
      a.detect('n1', {}, ['i1', 'i2']);
      a.detect('n2', {});
      assert.strictEqual(a.findBySeverity('medium').length, 1);
    });
    it('should list all', function() {
      const a = new AntiPatternDetector();
      a.detect('a', {});
      a.detect('b', {});
      assert.strictEqual(a.list().length, 2);
    });
    it('should clear', function() {
      const a = new AntiPatternDetector();
      a.detect('a', {});
      a.clear();
      assert.strictEqual(a.list().length, 0);
    });
  });

  describe('SuccessFactors', function() {
    it('should identify success factors', function() {
      const s = new SuccessFactors();
      const e = s.identify('p1', ['good-testing', 'ci-cd'], { successRate: 0.9 });
      assert(e.id.startsWith('sf_'));
      assert.strictEqual(e.projectId, 'p1');
    });
    it('should throw without projectId', function() {
      const s = new SuccessFactors();
      assert.throws(() => s.identify(), /projectId is required/);
    });
    it('should throw without factors', function() {
      const s = new SuccessFactors();
      assert.throws(() => s.identify('p'), /factors is required/);
    });
    it('should get by id', function() {
      const s = new SuccessFactors();
      const e = s.identify('p1', ['f1']);
      assert(s.get(e.id));
    });
    it('should findByProject', function() {
      const s = new SuccessFactors();
      s.identify('p1', ['f1']);
      assert.strictEqual(s.findByProject('p1').length, 1);
    });
    it('should return top factors', function() {
      const s = new SuccessFactors();
      s.identify('p1', ['f1'], { successRate: 0.5 });
      s.identify('p2', ['f2'], { successRate: 0.9 });
      const top = s.topFactors(1);
      assert.strictEqual(top.length, 1);
      assert.strictEqual(top[0].score, 0.9);
    });
    it('should list all', function() {
      const s = new SuccessFactors();
      s.identify('p1', ['f']);
      s.identify('p2', ['f']);
      assert.strictEqual(s.list().length, 2);
    });
    it('should clear', function() {
      const s = new SuccessFactors();
      s.identify('p1', ['f']);
      s.clear();
      assert.strictEqual(s.list().length, 0);
    });
  });

  describe('FailurePatterns', function() {
    it('should record a failure pattern', function() {
      const f = new FailurePatterns();
      const e = f.record('p1', 'timeout-on-external-api', { severity: 'high', downtime: 30 });
      assert(e.id.startsWith('fp_'));
      assert.strictEqual(e.severity, 'high');
    });
    it('should throw without projectId', function() {
      const f = new FailurePatterns();
      assert.throws(() => f.record(), /projectId is required/);
    });
    it('should throw without failure', function() {
      const f = new FailurePatterns();
      assert.throws(() => f.record('p'), /failure is required/);
    });
    it('should use default medium severity', function() {
      const f = new FailurePatterns();
      const e = f.record('p1', 'err');
      assert.strictEqual(e.severity, 'medium');
    });
    it('should get by id', function() {
      const f = new FailurePatterns();
      const e = f.record('p1', 'err');
      assert(f.get(e.id));
    });
    it('should findBySeverity', function() {
      const f = new FailurePatterns();
      f.record('p1', 'e', { severity: 'high' });
      f.record('p2', 'e', { severity: 'low' });
      assert.strictEqual(f.findBySeverity('high').length, 1);
    });
    it('should find common patterns', function() {
      const f = new FailurePatterns();
      f.record('p1', 'db-connection-failure');
      f.record('p2', 'db-connection-failure');
      f.record('p3', 'timeout');
      const common = f.commonPatterns(5);
      assert.strictEqual(common.length, 2);
      assert(common.find(c => c.failure === 'db-connection-failure'));
    });
    it('should list all', function() {
      const f = new FailurePatterns();
      f.record('p1', 'e');
      f.record('p2', 'e');
      assert.strictEqual(f.list().length, 2);
    });
    it('should clear', function() {
      const f = new FailurePatterns();
      f.record('p1', 'e');
      f.clear();
      assert.strictEqual(f.list().length, 0);
    });
  });
});

describe('Recommendation Engine', function() {
  describe('RecommendationEngine', function() {
    it('should generate recommendations', function() {
      const r = new RecommendationEngine();
      const rec = r.generate('proj-1', 'architecture', ['use-cqrs']);
      assert(rec.id.startsWith('rec_'));
      assert.strictEqual(rec.context, 'proj-1');
    });
    it('should throw without context', function() {
      const r = new RecommendationEngine();
      assert.throws(() => r.generate(), /context is required/);
    });
    it('should throw without type', function() {
      const r = new RecommendationEngine();
      assert.throws(() => r.generate('c'), /type is required/);
    });
    it('should set priority based on item count', function() {
      const r = new RecommendationEngine();
      const rec = r.generate('c', 't', [1, 2, 3, 4, 5, 6]);
      assert.strictEqual(rec.priority, 'high');
    });
    it('should get by id', function() {
      const r = new RecommendationEngine();
      const rec = r.generate('c', 't');
      assert(r.get(rec.id));
    });
    it('should findByType', function() {
      const r = new RecommendationEngine();
      r.generate('c', 'type-a');
      r.generate('c', 'type-b');
      assert.strictEqual(r.findByType('type-a').length, 1);
    });
    it('should findByContext', function() {
      const r = new RecommendationEngine();
      r.generate('ctx-1', 't');
      r.generate('ctx-2', 't');
      assert.strictEqual(r.findByContext('ctx-1').length, 1);
    });
    it('should list all', function() {
      const r = new RecommendationEngine();
      r.generate('a', 't');
      r.generate('b', 't');
      assert.strictEqual(r.list().length, 2);
    });
    it('should clear', function() {
      const r = new RecommendationEngine();
      r.generate('a', 't');
      r.clear();
      assert.strictEqual(r.list().length, 0);
    });
  });

  describe('ContextMatcher', function() {
    it('should register a context', function() {
      const c = new ContextMatcher();
      c.register('ctx1', { type: 'microservices', scale: 'large' });
    });
    it('should throw without id and data', function() {
      const c = new ContextMatcher();
      assert.throws(() => c.register(), /id and contextData are required/);
    });
    it('should match by text similarity', function() {
      const c = new ContextMatcher();
      c.register('ctx1', 'microservices architecture');
      const r = c.match('microservices', 0.3);
      assert(r.length >= 1);
    });
    it('should match by object similarity', function() {
      const c = new ContextMatcher();
      c.register('ctx1', { type: 'microservices', lang: 'node' });
      const r = c.match({ type: 'microservices', lang: 'node' }, 0.5);
      assert(r.length >= 1);
    });
    it('should return empty for no match', function() {
      const c = new ContextMatcher();
      c.register('ctx1', 'aaa');
      const r = c.match('zzz', 0.9);
      assert.strictEqual(r.length, 0);
    });
    it('should remove context', function() {
      const c = new ContextMatcher();
      c.register('id1', 'data');
      assert.strictEqual(c.remove('id1'), true);
      assert.strictEqual(c.remove('x'), false);
    });
    it('should list all', function() {
      const c = new ContextMatcher();
      c.register('a', 'data1');
      c.register('b', 'data2');
      assert.strictEqual(c.list().length, 2);
    });
    it('should clear', function() {
      const c = new ContextMatcher();
      c.register('a', 'data');
      c.clear();
      assert.strictEqual(c.list().length, 0);
    });
  });

  describe('SimilarProjectFinder', function() {
    it('should index a project', function() {
      const s = new SimilarProjectFinder();
      s.index('proj-1', { tech: 'node', scale: 'medium' });
    });
    it('should throw without projectId', function() {
      const s = new SimilarProjectFinder();
      assert.throws(() => s.index(), /projectId is required/);
    });
    it('should throw without features', function() {
      const s = new SimilarProjectFinder();
      assert.throws(() => s.index('p'), /features is required/);
    });
    it('should find similar projects', function() {
      const s = new SimilarProjectFinder();
      s.index('p1', { tech: 'node', type: 'api' });
      s.index('p2', { tech: 'node', type: 'api' });
      s.index('p3', { tech: 'python', type: 'ml' });
      const r = s.findSimilar({ tech: 'node', type: 'api' }, 5);
      assert(r.length >= 2);
    });
    it('should return empty for null query', function() {
      const s = new SimilarProjectFinder();
      assert.deepStrictEqual(s.findSimilar(), []);
    });
    it('should get project by id', function() {
      const s = new SimilarProjectFinder();
      s.index('p1', { x: 1 });
      assert(s.get('p1'));
    });
    it('should return null for missing project', function() {
      const s = new SimilarProjectFinder();
      assert.strictEqual(s.get('x'), null);
    });
    it('should remove project', function() {
      const s = new SimilarProjectFinder();
      s.index('p1', {});
      assert.strictEqual(s.remove('p1'), true);
    });
    it('should list all', function() {
      const s = new SimilarProjectFinder();
      s.index('p1', {});
      s.index('p2', {});
      assert.strictEqual(s.list().length, 2);
    });
    it('should clear', function() {
      const s = new SimilarProjectFinder();
      s.index('p1', {});
      s.clear();
      assert.strictEqual(s.list().length, 0);
    });
  });

  describe('ArchitectureRecommendations', function() {
    it('should generate recommendations', function() {
      const a = new ArchitectureRecommendations();
      const r = a.generate('p1', { complexity: 'high' }, ['split-module']);
      assert(r.id.startsWith('ar_'));
      assert.strictEqual(r.projectId, 'p1');
    });
    it('should throw without projectId', function() {
      const a = new ArchitectureRecommendations();
      assert.throws(() => a.generate(), /projectId is required/);
    });
    it('should throw without analysis', function() {
      const a = new ArchitectureRecommendations();
      assert.throws(() => a.generate('p'), /analysis is required/);
    });
    it('should get by id', function() {
      const a = new ArchitectureRecommendations();
      const r = a.generate('p1', {});
      assert(a.get(r.id));
    });
    it('should findByProject', function() {
      const a = new ArchitectureRecommendations();
      a.generate('p1', {});
      a.generate('p1', {});
      assert.strictEqual(a.findByProject('p1').length, 2);
    });
    it('should list all', function() {
      const a = new ArchitectureRecommendations();
      a.generate('p1', {});
      a.generate('p2', {});
      assert.strictEqual(a.list().length, 2);
    });
    it('should clear', function() {
      const a = new ArchitectureRecommendations();
      a.generate('p1', {});
      a.clear();
      assert.strictEqual(a.list().length, 0);
    });
  });

  describe('WorkflowRecommendations', function() {
    it('should generate workflow recommendations', function() {
      const w = new WorkflowRecommendations();
      const r = w.generate('p1', { bottlenecks: ['step-3'] }, ['parallelize']);
      assert(r.id.startsWith('wr_'));
    });
    it('should throw without projectId', function() {
      const w = new WorkflowRecommendations();
      assert.throws(() => w.generate(), /projectId is required/);
    });
    it('should findByProject', function() {
      const w = new WorkflowRecommendations();
      w.generate('p1', {});
      assert.strictEqual(w.findByProject('p1').length, 1);
    });
    it('should clear', function() {
      const w = new WorkflowRecommendations();
      w.generate('p1', {});
      w.clear();
      assert.strictEqual(w.list().length, 0);
    });
  });

  describe('OptimizationRecommendations', function() {
    it('should generate optimization recommendations', function() {
      const o = new OptimizationRecommendations();
      const r = o.generate('p1', { latency: 200 }, ['cache-results']);
      assert(r.id.startsWith('or_'));
      assert(r.expectedImprovement > 0);
    });
    it('should throw without projectId', function() {
      const o = new OptimizationRecommendations();
      assert.throws(() => o.generate(), /projectId is required/);
    });
    it('should throw without metrics', function() {
      const o = new OptimizationRecommendations();
      assert.throws(() => o.generate('p'), /metrics is required/);
    });
    it('should findByProject', function() {
      const o = new OptimizationRecommendations();
      o.generate('p1', {});
      assert.strictEqual(o.findByProject('p1').length, 1);
    });
    it('should clear', function() {
      const o = new OptimizationRecommendations();
      o.generate('p1', {});
      o.clear();
      assert.strictEqual(o.list().length, 0);
    });
  });
});

describe('Case-Based Reasoning', function() {
  describe('CaseRegistry', function() {
    it('should store a case', function() {
      const c = new CaseRegistry();
      const entry = c.store('db-pooling', 'high-connection-churn', 'implement-pool', { success: true });
      assert(entry.id.startsWith('case_'));
      assert.strictEqual(entry.name, 'db-pooling');
    });
    it('should throw without name', function() {
      const c = new CaseRegistry();
      assert.throws(() => c.store(), /name is required/);
    });
    it('should throw without problem', function() {
      const c = new CaseRegistry();
      assert.throws(() => c.store('n'), /problem is required/);
    });
    it('should throw without solution', function() {
      const c = new CaseRegistry();
      assert.throws(() => c.store('n', 'p'), /solution is required/);
    });
    it('should get by id', function() {
      const c = new CaseRegistry();
      const e = c.store('n', 'p', 's');
      assert(c.get(e.id));
    });
    it('should return null for missing id', function() {
      const c = new CaseRegistry();
      assert.strictEqual(c.get('x'), null);
    });
    it('should findByName', function() {
      const c = new CaseRegistry();
      c.store('unique-name', 'p', 's');
      assert.strictEqual(c.findByName('unique-name').length, 1);
    });
    it('should list all', function() {
      const c = new CaseRegistry();
      c.store('a', 'p', 's');
      c.store('b', 'p', 's');
      assert.strictEqual(c.list().length, 2);
    });
    it('should count', function() {
      const c = new CaseRegistry();
      c.store('a', 'p', 's');
      assert.strictEqual(c.count(), 1);
    });
    it('should remove', function() {
      const c = new CaseRegistry();
      const e = c.store('a', 'p', 's');
      assert.strictEqual(c.remove(e.id), true);
      assert.strictEqual(c.count(), 0);
    });
    it('should return false removing missing', function() {
      const c = new CaseRegistry();
      assert.strictEqual(c.remove('x'), false);
    });
    it('should clear', function() {
      const c = new CaseRegistry();
      c.store('a', 'p', 's');
      c.clear();
      assert.strictEqual(c.count(), 0);
    });
  });

  describe('CaseRetriever', function() {
    it('should retrieve cases by text query', function() {
      const c = new CaseRegistry();
      c.store('pooling', 'database connection churn', 'implement pooling', { success: true });
      const r = new CaseRetriever();
      r.setSource(c.list());
      const results = r.retrieve('database', 5);
      assert(results.length > 0);
    });
    it('should retrieve by object query', function() {
      const c = new CaseRegistry();
      c.store('test', 'database connection timeout', 'add retry logic', {});
      const r = new CaseRetriever();
      r.setSource(c.list());
      const results = r.retrieve({ problem: 'connection timeout' }, 5);
      assert(results.length > 0);
    });
    it('should return empty for null query', function() {
      const r = new CaseRetriever();
      assert.deepStrictEqual(r.retrieve(null), []);
    });
    it('should clear source', function() {
      const r = new CaseRetriever();
      r.setSource([{ id: '1' }]);
      r.clear();
      assert.deepStrictEqual(r.retrieve('test'), []);
    });
  });

  describe('CaseSimilarity', function() {
    it('should compare two cases', function() {
      const s = new CaseSimilarity();
      const score = s.compare(
        { name: 'a', problem: 'db connection', solution: 'add pool', outcome: { success: true } },
        { name: 'b', problem: 'db connection', solution: 'add pool', outcome: { success: true } }
      );
      assert(score > 0.5);
    });
    it('should return 0 for null cases', function() {
      const s = new CaseSimilarity();
      assert.strictEqual(s.compare(null, null), 0);
    });
    it('should set custom weights', function() {
      const s = new CaseSimilarity();
      s.setWeights({ problem: 1, solution: 0, outcome: 0, name: 0 });
      const score = s.compare(
        { name: 'x', problem: 'same problem', solution: 'diff' },
        { name: 'y', problem: 'same problem', solution: 'other' }
      );
      assert(score > 0);
    });
    it('should clear', function() {
      const s = new CaseSimilarity();
      s.setWeights({ problem: 1, solution: 0, outcome: 0, name: 0 });
      s.clear();
      assert.strictEqual(s._weights.problem, 0.4);
    });
  });

  describe('CaseRanking', function() {
    it('should rank cases', function() {
      const r = new CaseRanking();
      const cases = [
        { case: { storedAt: new Date().toISOString(), outcome: { success: true, score: 90 } }, score: 0.8 },
        { case: { storedAt: '2020-01-01', outcome: { success: false } }, score: 0.3 }
      ];
      const ranked = r.rank(cases);
      assert(ranked.length === 2);
      assert(ranked[0].rankScore >= ranked[1].rankScore);
    });
    it('should return empty for no cases', function() {
      const r = new CaseRanking();
      assert.deepStrictEqual(r.rank([]), []);
    });
    it('should return empty for null', function() {
      const r = new CaseRanking();
      assert.deepStrictEqual(r.rank(null), []);
    });
    it('should get rankings', function() {
      const r = new CaseRanking();
      r.rank([{ case: { storedAt: new Date().toISOString() }, score: 1 }]);
      assert.strictEqual(r.getRankings().length, 1);
    });
    it('should clear', function() {
      const r = new CaseRanking();
      r.rank([{ case: { storedAt: new Date().toISOString() }, score: 1 }]);
      r.clear();
      assert.strictEqual(r.getRankings().length, 0);
    });
  });
});

describe('Lessons Learned', function() {
  describe('LessonManager', function() {
    it('should create a lesson', function() {
      const l = new LessonManager();
      const lesson = l.create('Use Circuit Breakers', 'Always use circuit breakers for external API calls', 'architecture');
      assert(lesson.id.startsWith('lesson_'));
      assert.strictEqual(lesson.status, 'draft');
    });
    it('should throw without title', function() {
      const l = new LessonManager();
      assert.throws(() => l.create(), /title is required/);
    });
    it('should throw without content', function() {
      const l = new LessonManager();
      assert.throws(() => l.create('t'), /content is required/);
    });
    it('should get by id', function() {
      const l = new LessonManager();
      const lesson = l.create('t', 'c');
      assert(l.get(lesson.id));
    });
    it('should return null for missing id', function() {
      const l = new LessonManager();
      assert.strictEqual(l.get('x'), null);
    });
    it('should update a lesson', function() {
      const l = new LessonManager();
      const lesson = l.create('t', 'c');
      l.update(lesson.id, { status: 'published' });
      assert.strictEqual(l.get(lesson.id).status, 'published');
    });
    it('should return null updating missing lesson', function() {
      const l = new LessonManager();
      assert.strictEqual(l.update('x', {}), null);
    });
    it('should findByCategory', function() {
      const l = new LessonManager();
      l.create('a', 'c1', 'arch');
      l.create('b', 'c2', 'arch');
      l.create('c', 'c3', 'sec');
      assert.strictEqual(l.findByCategory('arch').length, 2);
    });
    it('should findByStatus', function() {
      const l = new LessonManager();
      const lesson = l.create('t', 'c');
      l.update(lesson.id, { status: 'published' });
      assert.strictEqual(l.findByStatus('published').length, 1);
    });
    it('should list all', function() {
      const l = new LessonManager();
      l.create('a', 'c');
      l.create('b', 'c');
      assert.strictEqual(l.list().length, 2);
    });
    it('should count', function() {
      const l = new LessonManager();
      l.create('a', 'c');
      assert.strictEqual(l.count(), 1);
    });
    it('should remove', function() {
      const l = new LessonManager();
      const lesson = l.create('a', 'c');
      assert.strictEqual(l.remove(lesson.id), true);
      assert.strictEqual(l.count(), 0);
    });
    it('should return false removing missing', function() {
      const l = new LessonManager();
      assert.strictEqual(l.remove('x'), false);
    });
    it('should clear', function() {
      const l = new LessonManager();
      l.create('a', 'c');
      l.clear();
      assert.strictEqual(l.count(), 0);
    });
  });

  describe('LessonExtractor', function() {
    it('should extract lessons from text', function() {
      const e = new LessonExtractor();
      const r = e.extract('We learned that caching improves performance significantly.', 'postmortem');
      assert(r.id.startsWith('lext_'));
      assert(r.lessons.length > 0);
    });
    it('should throw without source', function() {
      const e = new LessonExtractor();
      assert.throws(() => e.extract(), /source is required/);
    });
    it('should throw without sourceType', function() {
      const e = new LessonExtractor();
      assert.throws(() => e.extract('s'), /sourceType is required/);
    });
    it('should handle text with no patterns', function() {
      const e = new LessonExtractor();
      const r = e.extract('This is just a normal text.', 'general');
      assert.strictEqual(r.lessons.length, 0);
    });
    it('should get by id', function() {
      const e = new LessonExtractor();
      const r = e.extract('text', 'type');
      assert(e.get(r.id));
    });
    it('should return null for missing id', function() {
      const e = new LessonExtractor();
      assert.strictEqual(e.get('x'), null);
    });
    it('should list all', function() {
      const e = new LessonExtractor();
      e.extract('t1', 'a');
      e.extract('t2', 'b');
      assert.strictEqual(e.list().length, 2);
    });
    it('should clear', function() {
      const e = new LessonExtractor();
      e.extract('t', 'a');
      e.clear();
      assert.strictEqual(e.list().length, 0);
    });
  });

  describe('LessonValidator', function() {
    it('should validate a valid lesson', function() {
      const v = new LessonValidator();
      const r = v.validate('l1', { title: 'Valid Title', content: 'This is sufficiently long content for a lesson.' });
      assert(r.valid);
      assert.strictEqual(r.issues.length, 0);
    });
    it('should validate an invalid lesson (short title)', function() {
      const v = new LessonValidator();
      const r = v.validate('l1', { title: 'AB', content: 'Long enough content here to pass.' });
      assert(!r.valid);
      assert(r.issues.some(i => i.field === 'title'));
    });
    it('should throw without lessonId', function() {
      const v = new LessonValidator();
      assert.throws(() => v.validate(), /lessonId is required/);
    });
    it('should throw without lesson', function() {
      const v = new LessonValidator();
      assert.throws(() => v.validate('l'), /lesson is required/);
    });
    it('should get by id', function() {
      const v = new LessonValidator();
      const r = v.validate('l1', { title: 'Valid', content: 'Long content that is definitely long enough.' });
      assert(v.get(r.id));
    });
    it('should list all', function() {
      const v = new LessonValidator();
      v.validate('l1', { title: 'Valid', content: 'Long enough content here.' });
      v.validate('l2', { title: 'Ok', content: 'Also long enough content here.' });
      assert.strictEqual(v.list().length, 2);
    });
    it('should clear', function() {
      const v = new LessonValidator();
      v.validate('l1', { title: 'Valid', content: 'Long enough content.' });
      v.clear();
      assert.strictEqual(v.list().length, 0);
    });
  });

  describe('LessonPublisher', function() {
    it('should publish a lesson', function() {
      const p = new LessonPublisher();
      const pub = p.publish('l1', { title: 'Test', content: 'Content', category: 'arch' }, 'internal');
      assert(pub.id.startsWith('lpub_'));
      assert.strictEqual(pub.channel, 'internal');
    });
    it('should throw without lessonId', function() {
      const p = new LessonPublisher();
      assert.throws(() => p.publish(), /lessonId is required/);
    });
    it('should throw without lesson', function() {
      const p = new LessonPublisher();
      assert.throws(() => p.publish('l'), /lesson is required/);
    });
    it('should get by id', function() {
      const p = new LessonPublisher();
      const pub = p.publish('l1', { title: 't', content: 'c' });
      assert(p.get(pub.id));
    });
    it('should findByChannel', function() {
      const p = new LessonPublisher();
      p.publish('l1', { title: 't', content: 'c' }, 'internal');
      p.publish('l2', { title: 't', content: 'c' }, 'slack');
      assert.strictEqual(p.findByChannel('internal').length, 1);
    });
    it('should list all', function() {
      const p = new LessonPublisher();
      p.publish('l1', { title: 't', content: 'c' });
      p.publish('l2', { title: 't', content: 'c' });
      assert.strictEqual(p.list().length, 2);
    });
    it('should clear', function() {
      const p = new LessonPublisher();
      p.publish('l1', { title: 't', content: 'c' });
      p.clear();
      assert.strictEqual(p.list().length, 0);
    });
  });
});

describe('Knowledge Plugin SDK', function() {
  describe('KnowledgeProvider', function() {
    it('should create a provider', function() {
      const p = new KnowledgeProvider('test-provider');
      assert.strictEqual(p.getName(), 'test-provider');
    });
    it('should register providers', function() {
      const p = new KnowledgeProvider('p');
      p.registerProvider('architecture', () => {});
      p.registerProvider('architecture', () => {});
      assert.strictEqual(p.getProviders('architecture').length, 2);
    });
    it('should return all providers', function() {
      const p = new KnowledgeProvider('p');
      p.registerProvider('a', () => {});
      const all = p.getProviders();
      assert(all.a);
    });
  });

  describe('KnowledgeExtractor', function() {
    it('should register extractors', function() {
      const e = new KnowledgeExtractor('ext');
      e.registerExtractor('text', (s) => s.toUpperCase());
      const results = e.extract('text', 'hello');
      assert.strictEqual(results.length, 1);
    });
    it('should handle extractor errors', function() {
      const e = new KnowledgeExtractor('ext');
      e.registerExtractor('text', () => { throw new Error('fail'); });
      const results = e.extract('text', 'data');
      assert(results[0].error);
    });
    it('should get extractors by type', function() {
      const e = new KnowledgeExtractor('ext');
      e.registerExtractor('a', () => {});
      assert.strictEqual(e.getExtractors('a').length, 1);
    });
  });

  describe('GraphEnricher', function() {
    it('should register and run enrichers', function() {
      const g = new GraphEnricher('enricher');
      g.registerEnricher((state) => ({ enriched: true, nodes: state.nodes.length }));
      const results = g.enrich({ nodes: [{ id: 'a' }] });
      assert.strictEqual(results.length, 1);
      assert(results[0].enriched);
    });
    it('should handle enricher errors', function() {
      const g = new GraphEnricher('enricher');
      g.registerEnricher(() => { throw new Error('fail'); });
      const results = g.enrich({});
      assert(results[0].error);
    });
    it('should get enrichers', function() {
      const g = new GraphEnricher('e');
      g.registerEnricher(() => {});
      assert.strictEqual(g.getEnrichers().length, 1);
    });
  });

  describe('RecommendationProvider', function() {
    it('should register and run providers', function() {
      const r = new RecommendationProvider('rec');
      r.registerProvider('architecture', (ctx) => ({ recommendation: 'use-event-driven', context: ctx }));
      const results = r.recommend('architecture', 'project-1');
      assert.strictEqual(results.length, 1);
    });
    it('should handle errors', function() {
      const r = new RecommendationProvider('rec');
      r.registerProvider('test', () => { throw new Error('fail'); });
      const results = r.recommend('test', {});
      assert(results[0].error);
    });
    it('should get providers', function() {
      const r = new RecommendationProvider('r');
      r.registerProvider('a', () => {});
      assert.strictEqual(r.getProviders('a').length, 1);
    });
  });

  describe('PatternAnalyzer', function() {
    it('should register and run analyzers', function() {
      const p = new PatternAnalyzer('analyzer');
      p.registerAnalyzer((data) => ({ pattern: 'common', count: data.length }));
      const results = p.analyze(['a', 'b', 'a']);
      assert.strictEqual(results.length, 1);
    });
    it('should handle errors', function() {
      const p = new PatternAnalyzer('a');
      p.registerAnalyzer(() => { throw new Error('fail'); });
      const results = p.analyze([]);
      assert(results[0].error);
    });
    it('should get analyzers', function() {
      const p = new PatternAnalyzer('a');
      p.registerAnalyzer(() => {});
      assert.strictEqual(p.getAnalyzers().length, 1);
    });
  });

  describe('Plugin registration methods', function() {
    it('should register KnowledgeProvider on Plugin', function() {
      const p = new Plugin({ id: 'test', name: 'Test', version: '1.0.0' });
      const kp = p.registerKnowledgeProvider('my-provider');
      assert(kp);
      const providers = p.getKnowledgeProviders();
      assert(providers.providers);
      assert.strictEqual(providers.providers.length, 1);
    });
    it('should register KnowledgeExtractor on Plugin', function() {
      const p = new Plugin({ id: 'test', name: 'Test', version: '1.0.0' });
      const ke = p.registerKnowledgeExtractor('my-extractor');
      assert(ke);
      const providers = p.getKnowledgeProviders();
      assert(providers.extractors);
      assert.strictEqual(providers.extractors.length, 1);
    });
    it('should register GraphEnricher on Plugin', function() {
      const p = new Plugin({ id: 'test', name: 'Test', version: '1.0.0' });
      const ge = p.registerGraphEnricher('my-enricher');
      assert(ge);
      const providers = p.getKnowledgeProviders();
      assert(providers.enrichers);
      assert.strictEqual(providers.enrichers.length, 1);
    });
    it('should register RecommendationProvider on Plugin', function() {
      const p = new Plugin({ id: 'test', name: 'Test', version: '1.0.0' });
      const rp = p.registerRecommendationProvider('my-rec');
      assert(rp);
      const providers = p.getKnowledgeProviders();
      assert(providers.recommendations);
      assert.strictEqual(providers.recommendations.length, 1);
    });
    it('should register PatternAnalyzer on Plugin', function() {
      const p = new Plugin({ id: 'test', name: 'Test', version: '1.0.0' });
      const pa = p.registerPatternAnalyzer('my-analyzer');
      assert(pa);
      const providers = p.getKnowledgeProviders();
      assert(providers.analyzers);
      assert.strictEqual(providers.analyzers.length, 1);
    });
    it('should return empty object when no knowledge providers', function() {
      const p = new Plugin({ id: 'test', name: 'Test', version: '1.0.0' });
      assert.deepStrictEqual(p.getKnowledgeProviders(), {});
    });
  });
});

describe('Knowledge Index', function() {
  it('should export KnowledgeManager', function() {
    const km = require('../lib/knowledge');
    assert(km.KnowledgeManager);
    assert(km.getDefaultKnowledgeManager);
  });
  it('should export all core classes', function() {
    const km = require('../lib/knowledge');
    assert(km.KnowledgeEngine);
    assert(km.KnowledgeStorage);
    assert(km.KnowledgeRegistry);
    assert(km.KnowledgeEvents);
    assert(km.KnowledgeMetrics);
    assert(km.KnowledgeReporter);
  });
  it('should export all graph classes', function() {
    const km = require('../lib/knowledge');
    assert(km.KnowledgeGraph);
    assert(km.EntityRegistry);
    assert(km.RelationshipManager);
    assert(km.GraphTraversal);
    assert(km.GraphQueries);
    assert(km.GraphVersioning);
  });
  it('should export all source classes', function() {
    const km = require('../lib/knowledge');
    assert(km.ArchitectureKnowledge);
    assert(km.WorkflowKnowledge);
    assert(km.DeploymentKnowledge);
    assert(km.RuntimeKnowledge);
    assert(km.SecurityKnowledge);
    assert(km.BillingKnowledge);
    assert(km.GovernanceKnowledge);
    assert(km.EvaluationKnowledge);
    assert(km.TelemetryKnowledge);
    assert(km.IncidentKnowledge);
    assert(km.PluginKnowledge);
    assert(km.IntegrationKnowledge);
  });
  it('should export all pattern classes', function() {
    const km = require('../lib/knowledge');
    assert(km.PatternDiscovery);
    assert(km.PatternMining);
    assert(km.BestPracticeExtractor);
    assert(km.AntiPatternDetector);
    assert(km.SuccessFactors);
    assert(km.FailurePatterns);
  });
  it('should export all recommendation classes', function() {
    const km = require('../lib/knowledge');
    assert(km.RecommendationEngine);
    assert(km.ContextMatcher);
    assert(km.SimilarProjectFinder);
    assert(km.ArchitectureRecommendations);
    assert(km.WorkflowRecommendations);
    assert(km.OptimizationRecommendations);
  });
  it('should export all CBR classes', function() {
    const km = require('../lib/knowledge');
    assert(km.CaseRegistry);
    assert(km.CaseRetriever);
    assert(km.CaseSimilarity);
    assert(km.CaseRanking);
  });
  it('should export all lesson classes', function() {
    const km = require('../lib/knowledge');
    assert(km.LessonManager);
    assert(km.LessonExtractor);
    assert(km.LessonValidator);
    assert(km.LessonPublisher);
  });
    it('should have 46 exports total', function() {
      const km = require('../lib/knowledge');
      const exports = Object.keys(km);
      assert.strictEqual(exports.length, 46);
    });
  it('should call getDefaultKnowledgeManager', function() {
    const km = require('../lib/knowledge');
    const mgr = km.getDefaultKnowledgeManager();
    assert(mgr instanceof KnowledgeManager);
  });
});

describe('Knowledge API Controller', function() {
  let controller;
  before(function() {
    controller = require('../lib/api/controllers/knowledgeController');
  });
  it('should export getController', function() {
    assert(controller.getController);
  });
  it('should return controller with 8 methods', function() {
    const c = controller.getController();
    assert(c.getKnowledge);
    assert(c.ingest);
    assert(c.query);
    assert(c.recommend);
    assert(c.getGraph);
    assert(c.getPatterns);
    assert(c.getLessons);
    assert(c.getSimilarProjects);
  });
    it('getKnowledge should return status', function() {
      const c = controller.getController();
      const req = { body: {}, query: {} };
      let resData = null;
      const res = { json: (d) => { resData = d; }, status: () => ({ json: (d) => { resData = d; } }) };
      c.getKnowledge(req, res);
      assert(resData);
    });
    it('ingest should return error without sourceType', function() {
      const c = controller.getController();
      const req = { body: {} };
      let resData = null;
      const res = { json: (d) => { resData = d; }, status: (s) => { return { json: (d) => { resData = d; } }; } };
      c.ingest(req, res);
      assert(resData);
      assert(resData.errors);
    });
    it('ingest should return error without data', function() {
      const c = controller.getController();
      const req = { body: { sourceType: 'test' } };
      let resData = null;
      const res = { json: (d) => { resData = d; }, status: (s) => { return { json: (d) => { resData = d; } }; } };
      c.ingest(req, res);
      assert(resData);
      assert(resData.errors);
    });
    it('ingest should succeed with valid data', function() {
      const c = controller.getController();
      const req = { body: { sourceType: 'architecture', data: { pattern: 'layered' } } };
      let resData = null;
      const res = { json: (d) => { resData = d; }, status: () => ({ json: (d) => { resData = d; } }) };
      c.ingest(req, res);
      assert(resData);
    });
    it('query should return error without query', function() {
      const c = controller.getController();
      const req = { body: {} };
      let resData = null;
      const res = { json: (d) => { resData = d; }, status: (s) => { return { json: (d) => { resData = d; } }; } };
      c.query(req, res);
      assert(resData.errors);
    });
    it('query should work with query param', function() {
      const c = controller.getController();
      const req = { body: { query: 'microservices' } };
      let resData = null;
      const res = { json: (d) => { resData = d; }, status: () => ({ json: (d) => { resData = d; } }) };
      c.query(req, res);
      assert(resData);
    });
    it('recommend should return error without context', function() {
      const c = controller.getController();
      const req = { body: {} };
      let resData = null;
      const res = { json: (d) => { resData = d; }, status: (s) => { return { json: (d) => { resData = d; } }; } };
      c.recommend(req, res);
      assert(resData.errors);
    });
    it('recommend should return error without type', function() {
      const c = controller.getController();
      const req = { body: { context: 'proj-1' } };
      let resData = null;
      const res = { json: (d) => { resData = d; }, status: (s) => { return { json: (d) => { resData = d; } }; } };
      c.recommend(req, res);
      assert(resData.errors);
    });
    it('recommend should work with valid data', function() {
      const c = controller.getController();
      const req = { body: { context: 'proj-1', type: 'architecture' } };
      let resData = null;
      const res = { json: (d) => { resData = d; }, status: () => ({ json: (d) => { resData = d; } }) };
      c.recommend(req, res);
      assert(resData);
    });
    it('getGraph should return graph data', function() {
      const c = controller.getController();
      const req = {};
      let resData = null;
      const res = { json: (d) => { resData = d; }, status: () => ({ json: (d) => { resData = d; } }) };
      c.getGraph(req, res);
      assert(resData);
    });
    it('getPatterns should return patterns', function() {
      const c = controller.getController();
      const req = {};
      let resData = null;
      const res = { json: (d) => { resData = d; }, status: () => ({ json: (d) => { resData = d; } }) };
      c.getPatterns(req, res);
      assert(resData);
    });
    it('getLessons should return lessons', function() {
      const c = controller.getController();
      const req = { query: {} };
      let resData = null;
      const res = { json: (d) => { resData = d; }, status: () => ({ json: (d) => { resData = d; } }) };
      c.getLessons(req, res);
      assert(resData);
    });
    it('getSimilarProjects should return error without projectId', function() {
      const c = controller.getController();
      const req = { body: {} };
      let resData = null;
      const res = { json: (d) => { resData = d; }, status: (s) => { return { json: (d) => { resData = d; } }; } };
      c.getSimilarProjects(req, res);
      assert(resData.errors);
    });
    it('getSimilarProjects should work with projectId', function() {
      const c = controller.getController();
      const req = { body: { projectId: 'proj-1' } };
      let resData = null;
      const res = { json: (d) => { resData = d; }, status: () => ({ json: (d) => { resData = d; } }) };
      c.getSimilarProjects(req, res);
      assert(resData);
    });
  it('should handle errors in getKnowledge', function() {
    const c = controller.getController();
    const req = {};
    const res = { json: (d) => {}, status: (s) => { return { json: (d) => {} }; } };
    c.getKnowledge(req, res);
  });
});
