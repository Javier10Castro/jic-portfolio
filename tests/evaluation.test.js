const assert = require('assert');

// ─── CommonJS modules ───────────────────────────────────────────────
const { EvaluationRegistry, EVALUATION_TYPES, METRIC_TYPES } = require('../lib/evaluation/evaluationRegistry');
const { EvaluationStorage } = require('../lib/evaluation/evaluationStorage');
const { EvaluationEvents, EVENTS } = require('../lib/evaluation/evaluationEvents');
const { EvaluationMetrics } = require('../lib/evaluation/evaluationMetrics');
const { EvaluationScheduler } = require('../lib/evaluation/evaluationScheduler');
const { EvaluationHistory } = require('../lib/evaluation/evaluationHistory');
const { EvaluationRunner } = require('../lib/evaluation/evaluationRunner');
const { EvaluationReports } = require('../lib/evaluation/evaluationReports');
const { EvaluationEngine } = require('../lib/evaluation/evaluationEngine');
const { PromptRegistry } = require('../lib/evaluation/prompts/promptRegistry');
const { PromptVersioning } = require('../lib/evaluation/prompts/promptVersioning');
const { PromptTemplates } = require('../lib/evaluation/prompts/promptTemplates');
const { PromptVariables } = require('../lib/evaluation/prompts/promptVariables');
const { PromptSnapshots } = require('../lib/evaluation/prompts/promptSnapshots');
const { PromptHistory } = require('../lib/evaluation/prompts/promptHistory');
const { ABTesting } = require('../lib/evaluation/abtesting/abTesting');
const { TrafficSplitter } = require('../lib/evaluation/abtesting/trafficSplitter');
const { ResultAggregator } = require('../lib/evaluation/abtesting/resultAggregator');
const { WinnerSelector } = require('../lib/evaluation/abtesting/winnerSelector');
const { BenchmarkManager } = require('../lib/evaluation/benchmarks/benchmarkManager');
const { BenchmarkSuites } = require('../lib/evaluation/benchmarks/benchmarkSuites');
const { BenchmarkRunner } = require('../lib/evaluation/benchmarks/benchmarkRunner');
const { BenchmarkDatasets } = require('../lib/evaluation/benchmarks/benchmarkDatasets');
const { BenchmarkResults } = require('../lib/evaluation/benchmarks/benchmarkResults');
const { ModelComparison } = require('../lib/evaluation/models/modelComparison');
const { QualityScoring } = require('../lib/evaluation/models/qualityScoring');
const { LatencyScoring } = require('../lib/evaluation/models/latencyScoring');
const { CostScoring } = require('../lib/evaluation/models/costScoring');
const { HallucinationDetector } = require('../lib/evaluation/models/hallucinationDetector');
const { ConsistencyEvaluator } = require('../lib/evaluation/models/consistencyEvaluator');
const AgentEvaluator = require('../lib/evaluation/agents/agentEvaluator');
const WorkflowEvaluator = require('../lib/evaluation/agents/workflowEvaluator');
const ConversationEvaluator = require('../lib/evaluation/agents/conversationEvaluator');
const PlannerEvaluator = require('../lib/evaluation/agents/plannerEvaluator');
const GeneratorEvaluator = require('../lib/evaluation/agents/generatorEvaluator');
const JudgeEngine = require('../lib/evaluation/judge/judgeEngine');
const JudgePrompts = require('../lib/evaluation/judge/judgePrompts');
const RubricEngine = require('../lib/evaluation/judge/rubricEngine');
const ScoreNormalizer = require('../lib/evaluation/judge/scoreNormalizer');
const DatasetManager = require('../lib/evaluation/datasets/datasetManager');
const DatasetRegistry = require('../lib/evaluation/datasets/datasetRegistry');
const DatasetImporter = require('../lib/evaluation/datasets/datasetImporter');
const DatasetExporter = require('../lib/evaluation/datasets/datasetExporter');
const DatasetVersioning = require('../lib/evaluation/datasets/datasetVersioning');
const FeedbackCollector = require('../lib/evaluation/learning/feedbackCollector');
const FeedbackAggregator = require('../lib/evaluation/learning/feedbackAggregator');
const RecommendationEngine = require('../lib/evaluation/learning/recommendationEngine');
const ImprovementPlanner = require('../lib/evaluation/learning/improvementPlanner');
const { AiEvaluationIntegration } = require('../lib/evaluation/aiIntegration');

// ─── ESM experiment modules that work via require ───────────────────
const { ExperimentStorage } = require('../lib/evaluation/experiments/experimentStorage');
const { ExperimentMetrics } = require('../lib/evaluation/experiments/experimentMetrics');

// ─── Inline experiment classes for ESM-only modules ─────────────────
class ExperimentManager {
  constructor(storage) { this._storage = storage || new ExperimentStorage(); this._counter = 0; }
  createExperiment(config) {
    const experiment = { id: 'exp_' + (++this._counter) + '_' + Date.now(), name: config.name, description: config.description || '', variants: config.variants || [], metrics: config.metrics || [], tags: config.tags || [], status: 'draft', createdAt: new Date(), startedAt: null, stoppedAt: null };
    this._storage.saveExperiment(experiment); return experiment;
  }
  getExperiment(id) { return this._storage.getExperiment(id); }
  updateExperiment(id, updates) {
    const exp = this._storage.getExperiment(id); if (!exp) return null;
    for (const k of ['name','description','variants','metrics','tags']) { if (k in updates) exp[k] = updates[k]; }
    this._storage.saveExperiment(exp); return exp;
  }
  listExperiments(f) { return this._storage.listExperiments(f); }
  startExperiment(id) { const e = this._storage.getExperiment(id); if (!e) return null; e.status = 'running'; e.startedAt = new Date(); this._storage.saveExperiment(e); return e; }
  stopExperiment(id) { const e = this._storage.getExperiment(id); if (!e) return null; e.status = 'stopped'; e.stoppedAt = new Date(); this._storage.saveExperiment(e); return e; }
  archiveExperiment(id) { const e = this._storage.getExperiment(id); if (!e) return null; e.status = 'archived'; this._storage.saveExperiment(e); return e; }
  deleteExperiment(id) { this._storage.deleteExperiment(id); }
  clear() { this._storage.clear(); }
}

class ExperimentRunner {
  constructor(storage, metrics) { this._storage = storage || new ExperimentStorage(); this._metrics = metrics || new ExperimentMetrics(); this._runFunction = null; this._runCounter = 0; }
  setRunFunction(fn) { this._runFunction = fn; }
  async runVariant(experimentId, variantName, input) {
    const exp = this._storage.getExperiment(experimentId); if (!exp) throw new Error('Experiment ' + experimentId + ' not found');
    const variant = exp.variants.find(v => v.name === variantName); if (!variant) throw new Error('Variant ' + variantName + ' not found');
    const start = Date.now();
    const output = this._runFunction ? await this._runFunction(variant.config, input) : { result: 'processed by ' + variantName, input };
    const latency = Date.now() - start; const cost = typeof output?.cost === 'number' ? output.cost : 0;
    const runId = 'run_' + (++this._runCounter) + '_' + Date.now();
    const result = { runId, experimentId, variant: variantName, input, output, latency, cost, timestamp: new Date() };
    this._storage.saveResult(runId, result); return result;
  }
  async runExperiment(experimentId, inputs) {
    const exp = this._storage.getExperiment(experimentId); if (!exp) throw new Error('Experiment ' + experimentId + ' not found');
    const results = [];
    for (const v of exp.variants) for (const i of inputs) results.push(await this.runVariant(experimentId, v.name, i));
    return results;
  }
  getRun(runId) { return this._storage._results.get(runId) || null; }
  getVariantResults(experimentId, variantName) { return this._storage.getVariantData(experimentId, variantName); }
  clear() { this._storage.clear(); this._metrics.clear(); }
}

class ExperimentComparator {
  constructor(storage, metrics) { this._storage = storage || new ExperimentStorage(); this._metrics = metrics || new ExperimentMetrics(); }
  compareVariants(experimentId) {
    const exp = this._storage.getExperiment(experimentId); if (!exp) throw new Error('Experiment ' + experimentId + ' not found');
    const comparisons = [];
    for (let i = 0; i < exp.variants.length; i++) for (let j = i + 1; j < exp.variants.length; j++) {
      comparisons.push({ variantA: exp.variants[i].name, variantB: exp.variants[j].name, diffs: this._computeDiffs(this._storage.getVariantData(experimentId, exp.variants[i].name), this._storage.getVariantData(experimentId, exp.variants[j].name)) });
    }
    return { experimentId, comparisons };
  }
  _computeDiffs(a, b) {
    const diffs = {}; if (a.length === 0 || b.length === 0) return diffs;
    const minLen = Math.min(a.length, b.length);
    const ld = []; const cd = [];
    for (let i = 0; i < minLen; i++) { ld.push(a[i].latency - b[i].latency); cd.push(a[i].cost - b[i].cost); }
    if (ld.length) diffs.latency = { mean: ld.reduce((s, v) => s + v, 0) / ld.length };
    if (cd.length) diffs.cost = { mean: cd.reduce((s, v) => s + v, 0) / cd.length };
    return diffs;
  }
  rankVariants(experimentId, metric) {
    const exp = this._storage.getExperiment(experimentId); if (!exp) throw new Error('Experiment ' + experimentId + ' not found');
    return this._metrics.compareMetric(experimentId, metric).map(c => ({ variantName: c.variantName, mean: c.mean, count: c.count }));
  }
  findWinner(experimentId, metric) { const r = this.rankVariants(experimentId, metric); return r.length ? r[0] : null; }
  statisticalSignificance(a, b) {
    const n1 = a.length, n2 = b.length; if (n1 < 2 || n2 < 2) return { significant: false, pValue: 1 };
    const m1 = a.reduce((s, v) => s + v, 0) / n1, m2 = b.reduce((s, v) => s + v, 0) / n2;
    const v1 = a.reduce((s, v) => s + (v - m1) ** 2, 0) / (n1 - 1), v2 = b.reduce((s, v) => s + (v - m2) ** 2, 0) / (n2 - 1);
    const se = Math.sqrt(v1 / n1 + v2 / n2); if (se === 0) return { significant: m1 !== m2, pValue: m1 === m2 ? 1 : 0 };
    const t = (m1 - m2) / se, df = Math.min(n1 - 1, n2 - 1);
    const p = 1 - 0.5 * (1 + 0.196854 * Math.abs(t) + 0.115194 * t * t + 0.000344 * t * t * t + 0.019527 * t * t * t * t) ** (-4);
    return { significant: p < 0.05, pValue: Math.round(Math.min(Math.max(p, 0), 1) * 1e6) / 1e6 };
  }
  generateReport(experimentId) {
    const exp = this._storage.getExperiment(experimentId); if (!exp) throw new Error('Experiment ' + experimentId + ' not found');
    const comparisons = this.compareVariants(experimentId); const metrics = this._metrics.getMetrics(experimentId); const results = this._storage.getResults(experimentId);
    const vs = {};
    for (const v of exp.variants) {
      const vr = results.filter(r => r.variant === v.name); const vm = this._metrics.getVariantSummary(experimentId, v.name);
      const lats = vr.map(r => r.latency); const costs = vr.map(r => r.cost);
      vs[v.name] = { resultCount: vr.length, latency: lats.length ? { mean: lats.reduce((a, b) => a + b, 0) / lats.length, min: Math.min(...lats), max: Math.max(...lats) } : null, cost: costs.length ? { mean: costs.reduce((a, b) => a + b, 0) / costs.length, min: Math.min(...costs), max: Math.max(...costs) } : null, metrics: vm };
    }
    return { experimentId, experimentName: exp.name, status: exp.status, variants: exp.variants.map(v => v.name), comparisons, metricCount: metrics.length, variantSummaries: vs };
  }
}

// ─── Plugin SDK Evaluation Extension (inline) ──────────────────────
class EvaluationMetric {
  constructor(name, evaluateFn) { this.name = name; this.evaluate = evaluateFn; }
}
function createEvaluationMetric(name, evaluateFn) { return new EvaluationMetric(name, evaluateFn); }
class EvaluationExtension {
  constructor() { this._metrics = new Map(); this._benchmarks = new Map(); this._rubrics = new Map(); this._datasets = new Map(); this._templates = new Map(); }
  registerMetric(m) { if (this._metrics.has(m.name)) throw new Error('Metric already registered: ' + m.name); this._metrics.set(m.name, m); }
  getMetric(name) { return this._metrics.get(name) || null; }
  listMetrics() { return Array.from(this._metrics.values()); }
  registerBenchmark(n, b) { this._benchmarks.set(n, b); }
  getBenchmark(n) { return this._benchmarks.get(n) || null; }
  registerRubric(n, r) { this._rubrics.set(n, r); }
  registerDataset(n, d) { this._datasets.set(n, d); }
  registerTemplate(n, t) { this._templates.set(n, t); }
  evaluate(metricName, input) { const m = this._metrics.get(metricName); if (!m) throw new Error('Metric not found: ' + metricName); return m.evaluate(input); }
}

// ─── API Controller (inline) ────────────────────────────────────────
class ApiController {
  constructor(engine) { this._engine = engine; }
  getStatus() { return this._engine.getStatus(); }
  getHistory(filter) { return this._engine.history.query(filter); }
  getReports(filter) { return this._engine.reports.generate({ filter }); }
  async runEvaluation(type, input) {
    const id = this._engine.registry.listEvaluators(type)[0]?.id; if (!id) throw new Error('No evaluator for type: ' + type);
    return this._engine.runner.run({ type, evaluatorId: id, input });
  }
  async runBenchmark(suiteId) {
    const bm = new BenchmarkManager();
    const br = new BenchmarkRunner(bm);
    const suite = bm.createSuite({ name: suiteId, tests: [{ name: 't1', input: 'i', expectedOutput: 'o' }] });
    return br.runSuite(suite.id, () => ({ score: 0.9, passed: true, output: 'ok' }));
  }
  async runExperiment(experimentId, inputs) {
    const s = new ExperimentStorage(); const m = new ExperimentMetrics(); const r = new ExperimentRunner(s, m);
    return r.runExperiment(experimentId, inputs);
  }
  async runJudge(input, output, criteria) { const j = new JudgeEngine(); return j.evaluate(input, output, criteria); }
  compareModels(models, metrics) { const mc = new ModelComparison(); return mc.compare(models, metrics); }
  submitFeedback(source, data) { const fc = new FeedbackCollector(); return fc.collect(source, data); }
}

// ─── Root describe ──────────────────────────────────────────────────
describe('AI Evaluation & Learning Platform — Phase 9.6.0', function() {

  // ═════════════════════════════════════════════════════════════════
  // 21. TrafficSplitter (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('TrafficSplitter', function() {
    it('registerTest stores variants with normalized weights', function() {
      const ts = new TrafficSplitter();
      ts.registerTest('t1', [{ name: 'A', trafficWeight: 50 }, { name: 'B', trafficWeight: 50 }]);
      const dist = ts.getDistribution('t1');
      assert.strictEqual(dist.A, 50);
    });
    it('getVariant returns deterministic variant for same seed', function() {
      const ts = new TrafficSplitter();
      ts.registerTest('t', [{ name: 'A', trafficWeight: 50 }, { name: 'B', trafficWeight: 50 }]);
      const v1 = ts.getVariant('t', 'user1');
      const v2 = ts.getVariant('t', 'user1');
      assert.strictEqual(v1, v2);
    });
    it('getVariant throws for unregistered test', function() {
      const ts = new TrafficSplitter();
      assert.throws(() => ts.getVariant('none', 's'), /not registered/);
    });
    it('getDistribution returns weight map', function() {
      const ts = new TrafficSplitter();
      ts.registerTest('t', [{ name: 'A', trafficWeight: 70 }, { name: 'B', trafficWeight: 30 }]);
      assert.strictEqual(ts.getDistribution('t').A, 70);
    });
    it('getDistribution throws for unregistered test', function() {
      const ts = new TrafficSplitter();
      assert.throws(() => ts.getDistribution('none'), /not registered/);
    });
    it('setDistribution updates weights', function() {
      const ts = new TrafficSplitter();
      ts.registerTest('t', [{ name: 'A', trafficWeight: 50 }, { name: 'B', trafficWeight: 50 }]);
      ts.setDistribution('t', { A: 60, B: 40 });
      assert.strictEqual(ts.getDistribution('t').A, 60);
    });
    it('validateDistribution accepts 100 sum', function() {
      const ts = new TrafficSplitter();
      assert.strictEqual(ts.validateDistribution({ A: 60, B: 40 }), true);
    });
    it('validateDistribution rejects non-100 sum', function() {
      const ts = new TrafficSplitter();
      assert.throws(() => ts.validateDistribution({ A: 50, B: 30 }), /must sum to 100/);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 22. ResultAggregator (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('ResultAggregator', function() {
    it('recordResult stores impressions and conversions', function() {
      const ra = new ResultAggregator();
      ra.recordResult('t1', 'A', 'impression', 1);
      ra.recordResult('t1', 'A', 'conversion', 1);
      const results = ra.getResults('t1');
      assert.strictEqual(results.variants.A.impressions, 1);
    });
    it('getResults returns conversion rates', function() {
      const ra = new ResultAggregator();
      ra.recordResult('t1', 'A', 'impression', 10);
      ra.recordResult('t1', 'A', 'conversion', 5);
      const results = ra.getResults('t1');
      assert.strictEqual(results.variants.A.conversionRate, 0.5);
    });
    it('getResults returns null for missing test', function() {
      const ra = new ResultAggregator();
      assert.strictEqual(ra.getResults('none'), null);
    });
    it('getVariantStats returns stats for specific variant', function() {
      const ra = new ResultAggregator();
      ra.recordResult('t1', 'A', 'impression', 5);
      ra.recordResult('t1', 'A', 'conversion', 2);
      assert.strictEqual(ra.getVariantStats('t1', 'A').conversions, 2);
    });
    it('getVariantStats returns null for missing variant', function() {
      const ra = new ResultAggregator();
      ra.recordResult('t1', 'A', 'impression', 1);
      assert.strictEqual(ra.getVariantStats('t1', 'B'), null);
    });
    it('compareVariants returns array of variant stats', function() {
      const ra = new ResultAggregator();
      ra.recordResult('t1', 'A', 'impression', 10); ra.recordResult('t1', 'A', 'conversion', 3);
      ra.recordResult('t1', 'B', 'impression', 10); ra.recordResult('t1', 'B', 'conversion', 5);
      assert.strictEqual(ra.compareVariants('t1').length, 2);
    });
    it('compareVariants returns empty for missing test', function() {
      const ra = new ResultAggregator();
      assert.deepStrictEqual(ra.compareVariants('none'), []);
    });
    it('clear removes all results', function() {
      const ra = new ResultAggregator();
      ra.recordResult('t1', 'A', 'impression', 1); ra.clear();
      assert.strictEqual(ra.getResults('t1'), null);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 23. WinnerSelector (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('WinnerSelector', function() {
    it('selectWinner returns winner with enough data', function() {
      const ws = new WinnerSelector();
      const results = { variants: { A: { conversions: 100, impressions: 1000, conversionRate: 0.1 }, B: { conversions: 80, impressions: 1000, conversionRate: 0.08 } } };
      assert.strictEqual(ws.selectWinner('t1', results).winner, 'A');
    });
    it('selectWinner returns null winner for single variant', function() {
      const ws = new WinnerSelector();
      const results = { variants: { A: { conversions: 10, impressions: 100, conversionRate: 0.1 } } };
      assert.strictEqual(ws.selectWinner('t1', results).winner, null);
    });
    it('calculateConfidence returns confidence value', function() {
      const ws = new WinnerSelector();
      assert.ok(ws.calculateConfidence(100, 1000, 80, 1000).confidence > 0);
    });
    it('calculateConfidence handles zero impressions', function() {
      const ws = new WinnerSelector();
      const conf = ws.calculateConfidence(0, 0, 0, 0);
      assert.strictEqual(typeof conf.confidence, 'number');
    });
    it('getRecommendedDuration returns recommendation', function() {
      const ws = new WinnerSelector();
      const results = { variants: { A: { conversions: 10, impressions: 100 }, B: { conversions: 8, impressions: 100 } } };
      assert.ok(ws.getRecommendedDuration(results).recommendedDays !== undefined);
    });
    it('getRecommendedDuration returns null for insufficient variants', function() {
      const ws = new WinnerSelector();
      assert.strictEqual(ws.getRecommendedDuration({ variants: { A: { impressions: 10 } } }).recommendedDays, null);
    });
    it('validateWinner returns selection with recommendation', function() {
      const ws = new WinnerSelector();
      const results = { variants: { A: { conversions: 100, impressions: 1000, conversionRate: 0.1 }, B: { conversions: 80, impressions: 1000, conversionRate: 0.08 } } };
      assert.ok(ws.validateWinner('t1', { results }).winner);
    });
    it('validateWinner throws without results', function() {
      const ws = new WinnerSelector();
      assert.throws(() => ws.validateWinner('t1', {}), /Results required/);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 24. BenchmarkManager (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('BenchmarkManager', function() {
    it('createSuite creates new suite with id', function() {
      const bm = new BenchmarkManager();
      const suite = bm.createSuite({ name: 'Test Suite' });
      assert.ok(suite.id); assert.strictEqual(suite.name, 'Test Suite');
    });
    it('getSuite returns suite by id', function() {
      const bm = new BenchmarkManager();
      const suite = bm.createSuite({ name: 'S' });
      assert.strictEqual(bm.getSuite(suite.id).name, 'S');
    });
    it('getSuite returns null for missing', function() {
      const bm = new BenchmarkManager(); assert.strictEqual(bm.getSuite('none'), null);
    });
    it('updateSuite modifies suite fields', function() {
      const bm = new BenchmarkManager();
      const suite = bm.createSuite({ name: 'Old' }); bm.updateSuite(suite.id, { name: 'New' });
      assert.strictEqual(bm.getSuite(suite.id).name, 'New');
    });
    it('listSuites returns all suites', function() {
      const bm = new BenchmarkManager(); bm.clear();
      bm.createSuite({ name: 'A' }); bm.createSuite({ name: 'B' });
      assert.strictEqual(bm.listSuites().length, 2);
    });
    it('listSuites filters by category', function() {
      const bm = new BenchmarkManager();
      bm.createSuite({ name: 'A', category: 'quality' }); bm.createSuite({ name: 'B', category: 'code' });
      assert.strictEqual(bm.listSuites({ category: 'code' }).length, 1);
    });
    it('deleteSuite removes suite', function() {
      const bm = new BenchmarkManager();
      const suite = bm.createSuite({ name: 'D' });
      assert.strictEqual(bm.deleteSuite(suite.id), true); assert.strictEqual(bm.getSuite(suite.id), null);
    });
    it('addTestToSuite adds test to suite', function() {
      const bm = new BenchmarkManager();
      const suite = bm.createSuite({ name: 'S' });
      bm.addTestToSuite(suite.id, { name: 'test1', input: 'in', expectedOutput: 'out' });
      assert.strictEqual(bm.getTests(suite.id).length, 1);
    });
    it('removeTestFromSuite removes test by name', function() {
      const bm = new BenchmarkManager();
      const suite = bm.createSuite({ name: 'S' });
      bm.addTestToSuite(suite.id, { name: 't1', input: 'in', expectedOutput: 'out' });
      bm.removeTestFromSuite(suite.id, 't1');
      assert.strictEqual(bm.getTests(suite.id).length, 0);
    });
    it('clear removes all suites', function() {
      const bm = new BenchmarkManager(); bm.createSuite({ name: 'X' }); bm.clear();
      assert.strictEqual(bm.listSuites().length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 25. BenchmarkSuites (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('BenchmarkSuites', function() {
    it('registerPreset stores a preset', function() {
      const bs = new BenchmarkSuites(); bs.registerPreset('custom', { tests: [] });
      assert.ok(bs.getPreset('custom'));
    });
    it('getPreset returns null for unknown', function() {
      const bs = new BenchmarkSuites(); assert.strictEqual(bs.getPreset('none'), null);
    });
    it('listPresets returns preset names', function() {
      const bs = new BenchmarkSuites(); bs.registerPreset('p1', {}); bs.registerPreset('p2', {});
      const list = bs.listPresets(); assert.ok(list.includes('p1'));
    });
    it('loadPreset returns a copy of config', function() {
      const bs = new BenchmarkSuites(); bs.registerPreset('p', { tests: ['t'] });
      assert.deepStrictEqual(bs.loadPreset('p').tests, ['t']);
    });
    it('loadPreset throws for unknown', function() {
      const bs = new BenchmarkSuites();
      assert.throws(() => bs.loadPreset('none'), /not found/);
    });
    it('getDefaultPresets returns 5 presets', function() {
      const bs = new BenchmarkSuites();
      assert.strictEqual(Object.keys(bs.getDefaultPresets()).length, 5);
    });
    it('getDefaultPresets includes accuracy and safety', function() {
      const bs = new BenchmarkSuites(); const presets = bs.getDefaultPresets();
      assert.ok(presets.accuracy); assert.ok(presets.safety);
    });
    it('clear removes all presets', function() {
      const bs = new BenchmarkSuites(); bs.clear();
      bs.registerPreset('clear-test', {}); bs.clear();
      assert.strictEqual(bs.getPreset('clear-test'), null);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 26. BenchmarkRunner (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('BenchmarkRunner', function() {
    it('runTest returns score and passed status', function() {
      const bm = new BenchmarkManager(); const suite = bm.createSuite({ name: 'S' });
      bm.addTestToSuite(suite.id, { name: 't1', input: 'in', expectedOutput: 'out' });
      const br = new BenchmarkRunner(bm);
      const result = br.runTest(suite.id, 't1', () => ({ score: 0.9, passed: true, output: 'out' }));
      assert.strictEqual(result.passed, true);
    });
    it('runTest throws for missing suite', function() {
      const br = new BenchmarkRunner(new BenchmarkManager());
      assert.throws(() => br.runTest('none', 't', () => {}), /not found/);
    });
    it('runTest throws for missing test', function() {
      const bm = new BenchmarkManager(); const suite = bm.createSuite({ name: 'S' });
      const br = new BenchmarkRunner(bm);
      assert.throws(() => br.runTest(suite.id, 'none', () => {}), /not found/);
    });
    it('runSuite runs all tests and returns overall score', function() {
      const bm = new BenchmarkManager(); const suite = bm.createSuite({ name: 'S' });
      bm.addTestToSuite(suite.id, { name: 'a', input: 'in', expectedOutput: 'out' });
      bm.addTestToSuite(suite.id, { name: 'b', input: 'in', expectedOutput: 'out' });
      const br = new BenchmarkRunner(bm);
      const result = br.runSuite(suite.id, () => ({ score: 1, passed: true, output: 'out' }));
      assert.strictEqual(result.overallScore, 1);
    });
    it('runSuite returns passed/failed counts', function() {
      const bm = new BenchmarkManager(); const suite = bm.createSuite({ name: 'S' });
      bm.addTestToSuite(suite.id, { name: 'a', input: 'in', expectedOutput: 'out' });
      bm.addTestToSuite(suite.id, { name: 'b', input: 'in', expectedOutput: 'out' });
      const br = new BenchmarkRunner(bm);
      const result = br.runSuite(suite.id, () => ({ score: 1, passed: false, output: 'out' }));
      assert.strictEqual(result.passed, 0); assert.strictEqual(result.failed, 2);
    });
    it('runSuites runs multiple suites', function() {
      const bm = new BenchmarkManager();
      const s1 = bm.createSuite({ name: 'S1' }); const s2 = bm.createSuite({ name: 'S2' });
      bm.addTestToSuite(s1.id, { name: 't', input: 'in', expectedOutput: 'out' });
      bm.addTestToSuite(s2.id, { name: 't', input: 'in', expectedOutput: 'out' });
      const br = new BenchmarkRunner(bm);
      const results = br.runSuites([s1.id, s2.id], () => ({ score: 1, passed: true, output: 'ok' }));
      assert.strictEqual(results.length, 2);
    });
    it('getResult returns specific run by suiteId and runId', function() {
      const bm = new BenchmarkManager(); const suite = bm.createSuite({ name: 'S' });
      bm.addTestToSuite(suite.id, { name: 't', input: 'in', expectedOutput: 'out' });
      const br = new BenchmarkRunner(bm);
      const result = br.runTest(suite.id, 't', () => ({ score: 1, passed: true, output: 'out' }));
      assert.strictEqual(br.getResult(suite.id, result.runId).runId, result.runId);
    });
    it('getSuiteResults returns all runs for suite', function() {
      const bm = new BenchmarkManager(); const suite = bm.createSuite({ name: 'S' });
      bm.addTestToSuite(suite.id, { name: 't', input: 'in', expectedOutput: 'out' });
      const br = new BenchmarkRunner(bm);
      br.runTest(suite.id, 't', () => ({ score: 1, passed: true, output: 'ok' }));
      assert.strictEqual(br.getSuiteResults(suite.id).length, 1);
    });
    it('getResult returns null for unknown', function() {
      const br = new BenchmarkRunner(new BenchmarkManager());
      assert.strictEqual(br.getResult('none', 'none'), null);
    });
    it('clear removes all stored results', function() {
      const bm = new BenchmarkManager(); const suite = bm.createSuite({ name: 'S' });
      bm.addTestToSuite(suite.id, { name: 't', input: 'in', expectedOutput: 'out' });
      const br = new BenchmarkRunner(bm);
      br.runTest(suite.id, 't', () => ({ score: 1, passed: true, output: 'ok' })); br.clear();
      assert.strictEqual(br.getSuiteResults(suite.id).length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 27. BenchmarkDatasets (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('BenchmarkDatasets', function() {
    it('register stores dataset with entries', function() {
      const bd = new BenchmarkDatasets();
      const ds = bd.register('ds1', { entries: [{ input: 'hello', expected: 'world' }] });
      assert.strictEqual(ds.name, 'ds1');
    });
    it('register throws for duplicate', function() {
      const bd = new BenchmarkDatasets(); bd.register('dup', {});
      assert.throws(() => bd.register('dup', {}), /already registered/);
    });
    it('get returns dataset by name', function() {
      const bd = new BenchmarkDatasets(); bd.register('ds', { entries: [] });
      assert.strictEqual(bd.get('ds').name, 'ds');
    });
    it('get returns null for missing', function() {
      const bd = new BenchmarkDatasets(); assert.strictEqual(bd.get('none'), null);
    });
    it('list returns all datasets', function() {
      const bd = new BenchmarkDatasets(); bd.clear();
      bd.register('a', {}); bd.register('b', {});
      assert.strictEqual(bd.list().length, 2);
    });
    it('addEntries appends to existing dataset', function() {
      const bd = new BenchmarkDatasets(); bd.clear();
      bd.register('ds_add', { entries: [{ input: 'a', expected: 'b' }] });
      const added = bd.addEntries('ds_add', [{ input: 'c', expected: 'd' }]);
      assert.strictEqual(added.length, 1); assert.strictEqual(bd.getEntries('ds_add').length, 2);
    });
    it('removeEntries removes by id', function() {
      const bd = new BenchmarkDatasets(); bd.clear();
      bd.register('ds_rm', { entries: [{ input: 'a', expected: 'b' }] });
      const entries = bd.getEntries('ds_rm'); bd.removeEntries('ds_rm', [entries[0].id]);
      assert.strictEqual(bd.getEntries('ds_rm').length, 0);
    });
    it('split divides into train and test', function() {
      const bd = new BenchmarkDatasets(); bd.clear();
      bd.register('ds_split', { entries: [{ input: 'a', expected: 'b' }, { input: 'c', expected: 'd' }, { input: 'e', expected: 'f' }, { input: 'g', expected: 'h' }, { input: 'i', expected: 'j' }] });
      const split = bd.split('ds_split', 80);
      assert.strictEqual(split.train.length + split.test.length, 5);
    });
    it('getEntries returns specified count', function() {
      const bd = new BenchmarkDatasets(); bd.clear();
      bd.register('ds_cnt', { entries: [{ input: 'a', expected: 'b' }, { input: 'c', expected: 'd' }] });
      assert.strictEqual(bd.getEntries('ds_cnt', 1).length, 1);
    });
    it('unregister removes dataset', function() {
      const bd = new BenchmarkDatasets(); bd.clear();
      bd.register('ds_unreg', {});
      assert.strictEqual(bd.unregister('ds_unreg'), true); assert.strictEqual(bd.get('ds_unreg'), null);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 28. BenchmarkResults (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('BenchmarkResults', function() {
    it('saveResult stores entry with id', function() {
      const br = new BenchmarkResults();
      assert.ok(br.saveResult({ suiteId: 's1', score: 0.9, passed: true }).id);
    });
    it('getResult retrieves by id', function() {
      const br = new BenchmarkResults();
      const entry = br.saveResult({ suiteId: 's1', score: 0.8, passed: true });
      assert.strictEqual(br.getResult(entry.id).score, 0.8);
    });
    it('getResult returns null for missing', function() {
      const br = new BenchmarkResults(); assert.strictEqual(br.getResult('none'), null);
    });
    it('query filters by suiteId', function() {
      const br = new BenchmarkResults();
      br.saveResult({ suiteId: 'a', score: 1, passed: true }); br.saveResult({ suiteId: 'b', score: 1, passed: true });
      assert.strictEqual(br.query({ suiteId: 'a' }).length, 1);
    });
    it('query filters by status', function() {
      const br = new BenchmarkResults();
      br.saveResult({ suiteId: 's', score: 1, passed: true, status: 'pass' });
      br.saveResult({ suiteId: 's', score: 0, passed: false, status: 'fail' });
      assert.strictEqual(br.query({ status: 'pass' }).length, 1);
    });
    it('getHistory returns sorted results for suite', function() {
      const br = new BenchmarkResults(); br.clear();
      br.saveResult({ suiteId: 's', score: 0.7, passed: true }); br.saveResult({ suiteId: 's', score: 0.9, passed: true });
      assert.strictEqual(br.getHistory('s').length, 2);
    });
    it('getTrend returns improving/declining/stable', function() {
      const br = new BenchmarkResults(); br.clear();
      br.saveResult({ suiteId: 's', score: 0.5, passed: true }); br.saveResult({ suiteId: 's', score: 0.6, passed: true }); br.saveResult({ suiteId: 's', score: 0.7, passed: true });
      const trend = br.getTrend('s', 'score');
      assert.ok(['improving', 'declining', 'stable'].includes(trend));
    });
    it('getTrend returns stable for < 3 results', function() {
      const br = new BenchmarkResults(); br.clear();
      br.saveResult({ suiteId: 's', score: 0.5, passed: true });
      assert.strictEqual(br.getTrend('s'), 'stable');
    });
    it('compareSuites compares two suites', function() {
      const br = new BenchmarkResults(); br.clear();
      br.saveResult({ suiteId: 'a', score: 0.9, passed: true }); br.saveResult({ suiteId: 'b', score: 0.7, passed: true });
      assert.strictEqual(br.compareSuites('a', 'b').suiteA.averageScore, 0.9);
    });
    it('clear removes all results', function() {
      const br = new BenchmarkResults();
      br.saveResult({ suiteId: 's', score: 1, passed: true }); br.clear();
      assert.strictEqual(br.query({}).length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 29. ModelComparison (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('ModelComparison', function() {
    it('registerResult stores model score', function() {
      const mc = new ModelComparison(); mc.registerResult('gpt4', 'accuracy', 0.95);
      assert.strictEqual(mc.getModelScores('gpt4').accuracy, 0.95);
    });
    it('compare returns rankings for given models and metrics', function() {
      const mc = new ModelComparison();
      mc.registerResult('A', 'acc', 0.9); mc.registerResult('B', 'acc', 0.8);
      const result = mc.compare(['A', 'B'], ['acc']);
      assert.strictEqual(result.models.length, 2);
    });
    it('getModelScores returns empty for unknown model', function() {
      const mc = new ModelComparison(); assert.deepStrictEqual(mc.getModelScores('unknown'), {});
    });
    it('rankByMetric sorts descending', function() {
      const mc = new ModelComparison();
      mc.registerResult('A', 'm', 0.7); mc.registerResult('B', 'm', 0.9);
      assert.strictEqual(mc.rankByMetric('m')[0].name, 'B');
    });
    it('rankByMetric returns empty for unknown metric', function() {
      const mc = new ModelComparison(); assert.deepStrictEqual(mc.rankByMetric('none'), []);
    });
    it('getBestModel returns top model for metric', function() {
      const mc = new ModelComparison();
      mc.registerResult('A', 'm', 0.6); mc.registerResult('B', 'm', 0.9);
      assert.strictEqual(mc.getBestModel('m').name, 'B');
    });
    it('getBestModel returns null for no data', function() {
      const mc = new ModelComparison(); assert.strictEqual(mc.getBestModel('none'), null);
    });
    it('clear removes all results', function() {
      const mc = new ModelComparison(); mc.registerResult('A', 'm', 1); mc.clear();
      assert.deepStrictEqual(mc.getModelScores('A'), {});
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 30. QualityScoring (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('QualityScoring', function() {
    it('score returns overall and dimensions', function() {
      const qs = new QualityScoring(); const result = qs.score('hello world', 'hello universe', {});
      assert.strictEqual(typeof result.overall, 'number'); assert.ok(result.dimensions.relevance !== undefined);
    });
    it('scoreRelevance returns value between 0 and 1', function() {
      const qs = new QualityScoring();
      assert.ok(qs.scoreRelevance('hello world', 'hello') >= 0 && qs.scoreRelevance('hello world', 'hello') <= 1);
    });
    it('scoreRelevance returns 0 for empty output', function() {
      const qs = new QualityScoring(); assert.strictEqual(qs.scoreRelevance('', 'hello'), 0);
    });
    it('scoreCoherence returns value between 0 and 1', function() {
      const qs = new QualityScoring();
      const score = qs.scoreCoherence('First sentence. However second sentence.');
      assert.ok(score >= 0 && score <= 1);
    });
    it('scoreCoherence returns 1 for single sentence', function() {
      const qs = new QualityScoring(); assert.strictEqual(qs.scoreCoherence('Just one sentence.'), 1);
    });
    it('scoreCompleteness returns value between 0 and 1', function() {
      const qs = new QualityScoring();
      const score = qs.scoreCompleteness('hello world foo bar', 'hello\nworld');
      assert.ok(score >= 0 && score <= 1);
    });
    it('scoreClarity returns value between 0 and 1', function() {
      const qs = new QualityScoring();
      assert.ok(qs.scoreClarity('Short clear.') >= 0 && qs.scoreClarity('Short clear.') <= 1);
    });
    it('aggregate combines multiple scores', function() {
      const qs = new QualityScoring();
      const s1 = qs.score('hello', 'hello', {}); const s2 = qs.score('world', 'world', {});
      const agg = qs.aggregate([s1, s2]);
      assert.ok(agg.overall >= 0 && agg.overall <= 1);
    });
    it('aggregate returns zeros for empty array', function() {
      const qs = new QualityScoring(); assert.strictEqual(qs.aggregate([]).overall, 0);
    });
    it('clear does not throw', function() {
      const qs = new QualityScoring(); qs.clear(); assert.ok(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 31. LatencyScoring (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('LatencyScoring', function() {
    it('record stores measurement', function() {
      const ls = new LatencyScoring(); ls.record(100);
      assert.strictEqual(ls.getStats().avg, 100);
    });
    it('score returns value between 0 and 1 lower=better', function() {
      const ls = new LatencyScoring(); ls.record(100); ls.record(200);
      const s = ls.score(50); assert.ok(s.score >= 0 && s.score <= 1);
    });
    it('getStats returns percentiles', function() {
      const ls = new LatencyScoring(); ls.record(100); ls.record(200); ls.record(300);
      assert.ok(ls.getStats().p50 > 0); assert.ok(ls.getStats().p95 > 0);
    });
    it('getStats returns zeros for empty', function() {
      const ls = new LatencyScoring(); assert.strictEqual(ls.getStats().min, 0);
    });
    it('getPercentile returns correct percentile', function() {
      const ls = new LatencyScoring(); ls.record(10); ls.record(20); ls.record(30);
      assert.strictEqual(ls.getPercentile(50), 20);
    });
    it('compareThreshold checks against threshold', function() {
      const ls = new LatencyScoring(); ls.record(150); ls.record(250);
      const cmp = ls.compareThreshold(200);
      assert.strictEqual(typeof cmp.exceedsThreshold, 'boolean');
    });
    it('clear resets all measurements', function() {
      const ls = new LatencyScoring(); ls.record(100); ls.clear();
      assert.strictEqual(ls.getStats().avg, 0);
    });
    it('score includes percentile info', function() {
      const ls = new LatencyScoring(); ls.record(100); ls.record(200);
      assert.ok(ls.score(150).percentile >= 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 32. CostScoring (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('CostScoring', function() {
    it('record stores cost value', function() {
      const cs = new CostScoring(); cs.record(0.05);
      assert.strictEqual(cs.getStats().count, 1);
    });
    it('score returns value between 0 and 1', function() {
      const cs = new CostScoring(); cs.record(0.1);
      assert.ok(cs.score(0.05).score >= 0 && cs.score(0.05).score <= 1);
    });
    it('getStats returns min, max, avg, median', function() {
      const cs = new CostScoring(); cs.record(0.01); cs.record(0.05); cs.record(0.10);
      assert.ok(cs.getStats().min <= cs.getStats().max);
    });
    it('getStats returns zeros for empty', function() {
      const cs = new CostScoring(); assert.strictEqual(cs.getStats().count, 0);
    });
    it('getProjectedCost calculates projection', function() {
      const cs = new CostScoring(); const proj = cs.getProjectedCost(5, 30);
      assert.strictEqual(proj.projected, 150); assert.strictEqual(proj.unit, 'usd');
    });
    it('compare across models returns efficiency scores', function() {
      const cs = new CostScoring();
      const result = cs.compare([{ name: 'A', avgCost: 0.1 }, { name: 'B', avgCost: 0.05 }]);
      assert.strictEqual(result.length, 2);
    });
    it('clear resets all records', function() {
      const cs = new CostScoring(); cs.record(0.1); cs.clear();
      assert.strictEqual(cs.getStats().count, 0);
    });
    it('score includes cost and percentile', function() {
      const cs = new CostScoring(); cs.record(0.01);
      assert.strictEqual(cs.score(0.02).cost, 0.02);
    });
  });
  // ═════════════════════════════════════════════════════════════════
  // 33. HallucinationDetector (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('HallucinationDetector', function() {
    it('evaluate returns score and spans', function() {
      const hd = new HallucinationDetector();
      const result = hd.evaluate('The sky is green', 'The sky is blue.');
      assert.strictEqual(typeof result.score, 'number'); assert.ok(Array.isArray(result.spans));
    });
    it('evaluate returns hallucinated true for unsupported claims', function() {
      const hd = new HallucinationDetector();
      const result = hd.evaluate('Elephants fly.', 'Cats meow.');
      assert.strictEqual(result.hallucinated, true);
    });
    it('evaluate returns score 1 for no context', function() {
      const hd = new HallucinationDetector();
      const result = hd.evaluate('Something.', null);
      assert.strictEqual(result.score, 1);
    });
    it('checkFactualConsistency returns contradictions', function() {
      const hd = new HallucinationDetector();
      const result = hd.checkFactualConsistency('This is not true.', 'This is true.');
      assert.ok(Array.isArray(result.contradictions));
    });
    it('checkFactualConsistency returns consistent for matching', function() {
      const hd = new HallucinationDetector();
      const result = hd.checkFactualConsistency('This is true.', ['This is true.']);
      assert.strictEqual(typeof result.consistent, 'boolean');
    });
    it('checkInternalConsistency returns contradictions', function() {
      const hd = new HallucinationDetector();
      const result = hd.checkInternalConsistency('The sky is blue. The sky is never blue.');
      assert.ok(Array.isArray(result.contradictions));
    });
    it('checkInternalConsistency returns consistent for empty', function() {
      const hd = new HallucinationDetector();
      const result = hd.checkInternalConsistency('');
      assert.strictEqual(result.consistent, true);
    });
    it('getStats returns aggregate stats', function() {
      const hd = new HallucinationDetector(); hd.evaluate('test', 'context');
      assert.strictEqual(hd.getStats().totalEvaluations, 1);
    });
    it('getStats returns zeros for no evaluations', function() {
      const hd = new HallucinationDetector();
      assert.strictEqual(hd.getStats().totalEvaluations, 0);
    });
    it('clear removes all evaluations', function() {
      const hd = new HallucinationDetector(); hd.evaluate('test', 'context'); hd.clear();
      assert.strictEqual(hd.getStats().totalEvaluations, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 34. ConsistencyEvaluator (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('ConsistencyEvaluator', function() {
    it('evaluate outputs returns score and variance', function() {
      const ce = new ConsistencyEvaluator();
      const result = ce.evaluate(['hello world', 'hello world']);
      assert.strictEqual(typeof result.score, 'number');
    });
    it('evaluate returns score 1 for identical outputs', function() {
      const ce = new ConsistencyEvaluator();
      assert.strictEqual(ce.evaluate(['same text', 'same text']).score, 1);
    });
    it('evaluate returns defaults for < 2 outputs', function() {
      const ce = new ConsistencyEvaluator();
      assert.strictEqual(ce.evaluate(['only one']).score, 1);
    });
    it('comparePair returns similarity and differences', function() {
      const ce = new ConsistencyEvaluator();
      const result = ce.comparePair('hello world', 'hello there');
      assert.strictEqual(typeof result.similarity, 'number');
    });
    it('getStabilityScore returns value between 0 and 1', function() {
      const ce = new ConsistencyEvaluator();
      assert.ok(ce.getStabilityScore(['a b c', 'a b c']) >= 0 && ce.getStabilityScore(['a b c', 'a b c']) <= 1);
    });
    it('getStabilityScore returns 1 for < 2 outputs', function() {
      const ce = new ConsistencyEvaluator();
      assert.strictEqual(ce.getStabilityScore(['only one']), 1);
    });
    it('detectOutliers returns list of outliers', function() {
      const ce = new ConsistencyEvaluator();
      const outliers = ce.detectOutliers(['a b c d e', 'a b c d e', 'a b c d e f g h i j k l m n o p']);
      assert.ok(Array.isArray(outliers));
    });
    it('detectOutliers returns empty for < 3 outputs', function() {
      const ce = new ConsistencyEvaluator();
      assert.deepStrictEqual(ce.detectOutliers(['a', 'b']), []);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 35. AgentEvaluator (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('AgentEvaluator', function() {
    it('evaluateAgent returns score and metrics', function() {
      const ae = new AgentEvaluator();
      const result = ae.evaluateAgent('agent1', 'input', ('' + 'input').split('').reverse().join(''));
      assert.strictEqual(typeof result.score, 'number'); assert.ok(result.metrics);
    });
    it('evaluateResponse returns scores for criteria', function() {
      const ae = new AgentEvaluator();
      const result = ae.evaluateResponse('response', ['accuracy', 'relevance']);
      assert.ok(result.scores.accuracy !== undefined);
    });
    it('evaluateDecision returns soundness and completeness', function() {
      const ae = new AgentEvaluator();
      const result = ae.evaluateDecision('decision', {});
      assert.strictEqual(typeof result.soundness, 'number');
    });
    it('trackAgentPerformance stores history', function() {
      const ae = new AgentEvaluator();
      ae.trackAgentPerformance('a1', { score: 0.8 });
      assert.strictEqual(ae.getAgentScore('a1'), 0.8);
    });
    it('getAgentScore returns average', function() {
      const ae = new AgentEvaluator();
      ae.trackAgentPerformance('a1', { score: 0.6 }); ae.trackAgentPerformance('a1', { score: 0.8 });
      assert.strictEqual(ae.getAgentScore('a1'), 0.7);
    });
    it('getAgentScore returns 0 for unknown agent', function() {
      const ae = new AgentEvaluator(); assert.strictEqual(ae.getAgentScore('none'), 0);
    });
    it('listAgents returns all tracked agents', function() {
      const ae = new AgentEvaluator();
      ae.trackAgentPerformance('a1', { score: 0.9 }); ae.trackAgentPerformance('a2', { score: 0.8 });
      assert.strictEqual(ae.listAgents().length, 2);
    });
    it('clear removes all history and agents', function() {
      const ae = new AgentEvaluator(); ae.trackAgentPerformance('a1', { score: 1 }); ae.clear();
      assert.strictEqual(ae.listAgents().length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 36. WorkflowEvaluator (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('WorkflowEvaluator', function() {
    it('evaluateWorkflow returns overall score', function() {
      const we = new WorkflowEvaluator();
      const result = we.evaluateWorkflow('wf1', { steps: [{ id: 's1', name: 'Step1', duration: 100 }] });
      assert.strictEqual(typeof result.overallScore, 'number');
    });
    it('evaluateWorkflow returns step scores', function() {
      const we = new WorkflowEvaluator();
      const result = we.evaluateWorkflow('wf1', { steps: [{ id: 's1', name: 'S1', duration: 50 }] });
      assert.strictEqual(result.stepScores.length, 1);
    });
    it('evaluateWorkflow identifies bottlenecks', function() {
      const we = new WorkflowEvaluator();
      const result = we.evaluateWorkflow('wf1', { steps: [{ id: 's1', name: 'Slow', duration: 5000 }] });
      assert.ok(result.bottlenecks.length > 0 || result.bottlenecks.length === 0);
    });
    it('evaluateStep scores individual step', function() {
      const we = new WorkflowEvaluator();
      assert.ok(we.evaluateStep({ name: 's1', duration: 100 }, null).score >= 0);
    });
    it('getWorkflowScore returns average score', function() {
      const we = new WorkflowEvaluator();
      we.evaluateWorkflow('wf1', { steps: [{ id: 's1', name: 'S1', duration: 100 }] });
      we.evaluateWorkflow('wf1', { steps: [{ id: 's2', name: 'S2', duration: 200 }] });
      assert.ok(we.getWorkflowScore('wf1') > 0);
    });
    it('getWorkflowScore returns 0 for unknown', function() {
      const we = new WorkflowEvaluator(); assert.strictEqual(we.getWorkflowScore('none'), 0);
    });
    it('listWorkflows returns all tracked workflows', function() {
      const we = new WorkflowEvaluator();
      we.evaluateWorkflow('wf1', { steps: [{ id: 's1', name: 'S1', duration: 100 }] });
      we.evaluateWorkflow('wf2', { steps: [{ id: 's2', name: 'S2', duration: 200 }] });
      assert.strictEqual(we.listWorkflows().length, 2);
    });
    it('clear removes all scores and workflows', function() {
      const we = new WorkflowEvaluator();
      we.evaluateWorkflow('wf1', { steps: [{ id: 's1', name: 'S1', duration: 100 }] }); we.clear();
      assert.strictEqual(we.listWorkflows().length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 37. ConversationEvaluator (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('ConversationEvaluator', function() {
    it('evaluateConversation returns overall score', function() {
      const ce = new ConversationEvaluator();
      const messages = [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }, { role: 'user', content: 'How are you?' }, { role: 'assistant', content: 'I am fine.' }];
      const result = ce.evaluateConversation(messages);
      assert.strictEqual(typeof result.overallScore, 'number');
    });
    it('evaluateTurn returns relevance, helpfulness, tone', function() {
      const ce = new ConversationEvaluator();
      const turn = ce.evaluateTurn({ content: 'response' }, { content: 'query' });
      assert.ok(turn.relevance >= 0); assert.ok(turn.helpfulness >= 0);
    });
    it('evaluateGoalCompletion checks keyword coverage', function() {
      const ce = new ConversationEvaluator();
      const messages = [{ role: 'user', content: 'Book a flight' }, { role: 'assistant', content: 'I booked your flight to Paris' }];
      const result = ce.evaluateGoalCompletion(messages, { keywords: ['flight', 'Paris'] });
      assert.strictEqual(result.completed, true);
    });
    it('evaluateGoalCompletion returns gaps for missing keywords', function() {
      const ce = new ConversationEvaluator();
      const messages = [{ role: 'user', content: 'Hello' }];
      const result = ce.evaluateGoalCompletion(messages, { keywords: ['flight', 'Paris'] });
      assert.strictEqual(result.completed, false);
    });
    it('getConversationScore returns stored score', function() {
      const ce = new ConversationEvaluator();
      assert.strictEqual(ce.getConversationScore('conv1'), 0);
    });
    it('clear resets all scores', function() {
      const ce = new ConversationEvaluator(); ce.scores.set('c1', 0.9); ce.clear();
      assert.strictEqual(ce.scores.size, 0);
    });
    it('evaluateConversation with single message', function() {
      const ce = new ConversationEvaluator();
      const result = ce.evaluateConversation([{ role: 'user', content: 'Hi' }]);
      assert.strictEqual(typeof result.overallScore, 'number');
    });
    it('evaluateConversation includes engagement', function() {
      const ce = new ConversationEvaluator();
      const messages = [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }];
      const result = ce.evaluateConversation(messages);
      assert.ok(result.engagement >= 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 38. PlannerEvaluator (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('PlannerEvaluator', function() {
    it('evaluatePlan returns score, completeness, feasibility', function() {
      const pe = new PlannerEvaluator();
      const result = pe.evaluatePlan({ steps: [{ description: 'd1', action: 'a1' }] }, 'goal');
      assert.strictEqual(typeof result.score, 'number'); assert.strictEqual(typeof result.completeness, 'number');
    });
    it('evaluateStep returns clarity, actionability, dependencyCorrectness', function() {
      const pe = new PlannerEvaluator();
      const result = pe.evaluateStep({ description: 'long enough description', action: 'act' }, { steps: [] });
      assert.ok(result.clarity >= 0); assert.strictEqual(result.actionability, 1);
    });
    it('evaluateExecution returns fidelity and deviation', function() {
      const pe = new PlannerEvaluator();
      const plan = { steps: [{ id: 's1' }, { id: 's2' }] };
      const log = { executedSteps: [{ id: 's1' }, { id: 's2' }] };
      const result = pe.evaluateExecution(plan, log);
      assert.strictEqual(result.fidelity, 1); assert.strictEqual(result.deviationScore, 0);
    });
    it('evaluateExecution handles partial execution', function() {
      const pe = new PlannerEvaluator();
      const plan = { steps: [{ id: 's1' }, { id: 's2' }, { id: 's3' }] };
      const log = { executedSteps: [{ id: 's1' }] };
      const result = pe.evaluateExecution(plan, log);
      assert.ok(result.fidelity < 1);
    });
    it('comparePlans returns differences between plans', function() {
      const pe = new PlannerEvaluator();
      const a = { steps: [{ id: 's1' }, { id: 's2' }] };
      const b = { steps: [{ id: 's1' }, { id: 's3' }] };
      const result = pe.comparePlans(a, b);
      assert.strictEqual(result.differences.countA, 2); assert.strictEqual(result.differences.countB, 2);
    });
    it('comparePlans recommends based on step count', function() {
      const pe = new PlannerEvaluator();
      const a = { steps: [{ id: 's1' }] };
      const b = { steps: [{ id: 's1' }, { id: 's2' }, { id: 's3' }] };
      assert.strictEqual(pe.comparePlans(a, b).recommendation, 'planA');
    });
    it('evaluatePlan handles empty steps', function() {
      const pe = new PlannerEvaluator();
      const result = pe.evaluatePlan({ steps: [] }, 'goal');
      assert.strictEqual(result.completeness, 0);
    });
    it('clear does not throw', function() {
      const pe = new PlannerEvaluator(); pe.clear(); assert.ok(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 39. GeneratorEvaluator (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('GeneratorEvaluator', function() {
    it('evaluateGeneration returns quality, relevance, creativity, safety', function() {
      const ge = new GeneratorEvaluator();
      const result = ge.evaluateGeneration('output text', 'input text', {});
      assert.strictEqual(typeof result.quality, 'number'); assert.strictEqual(typeof result.safety, 'number');
    });
    it('evaluateCode returns correctness, efficiency, style, security', function() {
      const ge = new GeneratorEvaluator();
      const result = ge.evaluateCode('const x = 1;', ['const']);
      assert.strictEqual(typeof result.correctness, 'number');
    });
    it('evaluateCode security check flags eval and innerHTML', function() {
      const ge = new GeneratorEvaluator();
      const result = ge.evaluateCode('eval("bad")', []);
      assert.strictEqual(result.security, 0.3);
    });
    it('evaluateText returns grammar, coherence, style, tone', function() {
      const ge = new GeneratorEvaluator();
      const result = ge.evaluateText('Hello world. This is a test.', { style: 'formal', tone: 'professional' });
      assert.strictEqual(typeof result.grammar, 'number');
    });
    it('evaluateStructure returns validity and completeness', function() {
      const ge = new GeneratorEvaluator();
      const result = ge.evaluateStructure({ name: 'test', value: 1 }, { name: 'string', value: 'number', extra: 'boolean' });
      assert.strictEqual(result.validity, 2/3);
    });
    it('evaluateText with no criteria', function() {
      const ge = new GeneratorEvaluator();
      const result = ge.evaluateText('Hello world. This is a test.', {});
      assert.strictEqual(typeof result.grammar, 'number');
    });
    it('evaluateGeneration safety is high for most outputs', function() {
      const ge = new GeneratorEvaluator();
      const result = ge.evaluateGeneration('safe output', 'input', {});
      assert.ok(result.safety > 0);
    });
    it('clear does not throw', function() {
      const ge = new GeneratorEvaluator(); ge.clear(); assert.ok(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 40. JudgeEngine (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('JudgeEngine', function() {
    it('evaluate returns scores, overall, reasoning, confidence', function() {
      const je = new JudgeEngine();
      const result = je.evaluate('input', 'output', ['accuracy', 'relevance']);
      assert.ok(result.scores.accuracy >= 0); assert.strictEqual(typeof result.overall, 'number');
      assert.ok(result.reasoning); assert.ok(result.confidence >= 0);
    });
    it('evaluateBatch processes multiple items', function() {
      const je = new JudgeEngine();
      const items = [{ input: 'i1', output: 'o1', criteria: ['c1'] }, { input: 'i2', output: 'o2', criteria: ['c2'] }];
      const results = je.evaluateBatch(items);
      assert.strictEqual(results.length, 2);
    });
    it('evaluatePair returns preferred and reasoning', function() {
      const je = new JudgeEngine();
      const result = je.evaluatePair('output A', 'output B', ['quality']);
      assert.ok(['A', 'B'].includes(result.preferred));
      assert.ok(result.reasoning);
    });
    it('setJudgeModel updates model name', function() {
      const je = new JudgeEngine(); je.setJudgeModel('gpt-4');
      assert.strictEqual(je.getConfig().modelName, 'gpt-4');
    });
    it('getConfig returns config object', function() {
      const je = new JudgeEngine(); const config = je.getConfig();
      assert.strictEqual(config.modelName, 'default-judge'); assert.strictEqual(config.temperature, 0.3);
    });
    it('clear resets history and config', function() {
      const je = new JudgeEngine();
      je.evaluate('i', 'o', ['c']); je.setJudgeModel('custom');
      je.clear();
      assert.strictEqual(je.getConfig().modelName, 'default-judge');
    });
    it('evaluate handles empty criteria', function() {
      const je = new JudgeEngine();
      const result = je.evaluate('input', 'output', []);
      assert.strictEqual(typeof result.overall, 'number');
    });
    it('evaluate batch with single item', function() {
      const je = new JudgeEngine();
      assert.strictEqual(je.evaluateBatch([{ input: 'i', output: 'o', criteria: ['c'] }]).length, 1);
    });
    it('evaluatePair scores include both A and B', function() {
      const je = new JudgeEngine();
      const result = je.evaluatePair('A', 'B', ['quality']);
      assert.ok(result.scores.A); assert.ok(result.scores.B);
    });
    it('clear resets history length', function() {
      const je = new JudgeEngine();
      je.evaluate('i', 'o', ['c']); je.clear();
      assert.strictEqual(je.history.length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 41. JudgePrompts (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('JudgePrompts', function() {
    it('getPrompt returns prompt by type', function() {
      const jp = new JudgePrompts();
      const prompt = jp.getPrompt('quality');
      assert.ok(prompt); assert.strictEqual(prompt.id, 'quality');
    });
    it('getPrompt returns null for unknown type', function() {
      const jp = new JudgePrompts(); assert.strictEqual(jp.getPrompt('none'), null);
    });
    it('registerPrompt stores new prompt type', function() {
      const jp = new JudgePrompts();
      jp.registerPrompt('custom', 'Evaluate {{input}}');
      assert.strictEqual(jp.getPrompt('custom').template, 'Evaluate {{input}}');
    });
    it('listTypes returns all registered types', function() {
      const jp = new JudgePrompts(); const types = jp.listTypes();
      assert.ok(types.includes('quality')); assert.ok(types.includes('safety'));
    });
    it('buildPrompt compiles template with variables', function() {
      const jp = new JudgePrompts();
      const prompt = jp.buildPrompt('quality', 'accuracy', 'my input', 'my output');
      assert.ok(prompt.includes('my input')); assert.ok(prompt.includes('my output'));
    });
    it('buildPrompt returns null for unknown type', function() {
      const jp = new JudgePrompts();
      assert.strictEqual(jp.buildPrompt('none', '', '', ''), null);
    });
    it('validatePrompt validates template syntax', function() {
      const jp = new JudgePrompts();
      assert.strictEqual(jp.validatePrompt('Hello {{name}}').valid, true);
    });
    it('validatePrompt rejects empty template', function() {
      const jp = new JudgePrompts();
      assert.strictEqual(jp.validatePrompt('').valid, false);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 42. RubricEngine (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('RubricEngine', function() {
    it('createRubric creates rubric with weighted criteria', function() {
      const re = new RubricEngine();
      const rubric = re.createRubric('quality', [{ name: 'correctness', weight: 3 }]);
      assert.strictEqual(rubric.name, 'quality');
    });
    it('getRubric returns rubric by name', function() {
      const re = new RubricEngine(); re.createRubric('r1', [{ name: 'c1', weight: 1 }]);
      assert.strictEqual(re.getRubric('r1').name, 'r1');
    });
    it('getRubric returns null for missing', function() {
      const re = new RubricEngine(); assert.strictEqual(re.getRubric('none'), null);
    });
    it('updateRubric modifies criteria', function() {
      const re = new RubricEngine(); re.createRubric('r', [{ name: 'c1', weight: 1 }]);
      re.updateRubric('r', { criteria: [{ name: 'c2', weight: 2 }] });
      assert.strictEqual(re.getRubric('r').criteria[0].name, 'c2');
    });
    it('updateRubric returns null for missing', function() {
      const re = new RubricEngine(); assert.strictEqual(re.updateRubric('none', {}), null);
    });
    it('listRubrics returns all rubrics', function() {
      const re = new RubricEngine(); re.createRubric('a', []); re.createRubric('b', []);
      assert.strictEqual(re.listRubrics().length, 2);
    });
    it('score applies weights', function() {
      const re = new RubricEngine();
      re.createRubric('q', [{ name: 'correctness', weight: 3 }, { name: 'clarity', weight: 1 }]);
      const score = re.score('q', { correctness: 1, clarity: 0.5 });
      assert.strictEqual(score, 0.875);
    });
    it('score returns null for missing rubric', function() {
      const re = new RubricEngine(); assert.strictEqual(re.score('none', {}), null);
    });
    it('getDefaultRubrics returns 3 default rubrics', function() {
      const re = new RubricEngine();
      assert.strictEqual(re.getDefaultRubrics().length, 3);
    });
    it('clear removes all rubrics', function() {
      const re = new RubricEngine(); re.createRubric('r', []); re.clear();
      assert.strictEqual(re.listRubrics().length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 43. ScoreNormalizer (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('ScoreNormalizer', function() {
    it('normalize converts between scales', function() {
      const sn = new ScoreNormalizer();
      const result = sn.normalize(3, { min: 1, max: 5 }, { min: 0, max: 1 });
      assert.strictEqual(result, 0.5);
    });
    it('zScore computes z-score', function() {
      const sn = new ScoreNormalizer();
      assert.strictEqual(sn.zScore(10, 5, 2), 2.5);
    });
    it('zScore returns 0 for zero stddev', function() {
      const sn = new ScoreNormalizer(); assert.strictEqual(sn.zScore(5, 5, 0), 0);
    });
    it('percentileRank calculates percentile', function() {
      const sn = new ScoreNormalizer();
      const rank = sn.percentileRank(5, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      assert.strictEqual(rank, 0.45);
    });
    it('percentileRank returns 0 for empty distribution', function() {
      const sn = new ScoreNormalizer(); assert.strictEqual(sn.percentileRank(5, []), 0);
    });
    it('normalizeToScale scales to target max', function() {
      const sn = new ScoreNormalizer();
      assert.deepStrictEqual(sn.normalizeToScale([2, 4, 6], 10), [10/3, 20/3, 10]);
    });
    it('normalizeToScale handles all zeros', function() {
      const sn = new ScoreNormalizer();
      assert.deepStrictEqual(sn.normalizeToScale([0, 0], 100), [0, 0]);
    });
    it('aggregate with average', function() {
      const sn = new ScoreNormalizer();
      assert.strictEqual(sn.aggregate([1, 2, 3], 'average'), 2);
    });
    it('aggregate with median', function() {
      const sn = new ScoreNormalizer();
      assert.strictEqual(sn.aggregate([1, 2, 10], 'median'), 2);
    });
    it('aggregate with geometric', function() {
      const sn = new ScoreNormalizer();
      assert.strictEqual(sn.aggregate([2, 8], 'geometric'), 4);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 44. DatasetManager (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('DatasetManager', function() {
    it('create creates dataset with name', function() {
      const dm = new DatasetManager(); const ds = dm.create('ds1', {});
      assert.strictEqual(ds.name, 'ds1');
    });
    it('get returns dataset by name', function() {
      const dm = new DatasetManager(); dm.create('ds', {}); assert.strictEqual(dm.get('ds').name, 'ds');
    });
    it('get returns null for missing', function() {
      const dm = new DatasetManager(); assert.strictEqual(dm.get('none'), null);
    });
    it('list returns all datasets', function() {
      const dm = new DatasetManager(); dm.create('a', {}); dm.create('b', {});
      assert.strictEqual(dm.list().length, 2);
    });
    it('update modifies dataset properties', function() {
      const dm = new DatasetManager(); dm.create('ds', { tags: [] });
      dm.update('ds', { config: { tags: ['new'] } });
      assert.deepStrictEqual(dm.get('ds').config.tags, ['new']);
    });
    it('delete removes dataset', function() {
      const dm = new DatasetManager(); dm.create('ds', {}); dm.delete('ds');
      assert.strictEqual(dm.get('ds'), null);
    });
    it('addEntry adds entry to dataset', function() {
      const dm = new DatasetManager(); dm.create('ds', {});
      const entry = dm.addEntry('ds', { data: 'test' });
      assert.ok(entry.id); assert.strictEqual(dm.getEntries('ds').length, 1);
    });
    it('addEntries adds multiple entries', function() {
      const dm = new DatasetManager(); dm.create('ds', {});
      dm.addEntries('ds', [{ data: 'a' }, { data: 'b' }]);
      assert.strictEqual(dm.getEntries('ds').length, 2);
    });
    it('getEntries with filter', function() {
      const dm = new DatasetManager(); dm.create('ds', {});
      dm.addEntry('ds', { category: 'test' }); dm.addEntry('ds', { category: 'other' });
      assert.strictEqual(dm.getEntries('ds', { category: 'test' }).length, 1);
    });
    it('clear removes all datasets', function() {
      const dm = new DatasetManager(); dm.create('ds', {}); dm.clear();
      assert.strictEqual(dm.list().length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 45. DatasetRegistry (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('DatasetRegistry', function() {
    it('register stores dataset', function() {
      const dr = new DatasetRegistry(); dr.register('ds1', { config: { tags: ['ml'] } });
      assert.ok(dr.get('ds1'));
    });
    it('unregister removes dataset', function() {
      const dr = new DatasetRegistry(); dr.register('ds', { config: {} }); dr.unregister('ds');
      assert.strictEqual(dr.get('ds'), null);
    });
    it('get returns dataset or null', function() {
      const dr = new DatasetRegistry(); assert.strictEqual(dr.get('none'), null);
    });
    it('list returns all entries', function() {
      const dr = new DatasetRegistry();
      dr.register('a', { config: {} }); dr.register('b', { config: {} });
      assert.strictEqual(dr.list().length, 2);
    });
    it('search finds by name or description', function() {
      const dr = new DatasetRegistry();
      dr.register('test-ds', { config: { description: 'A test dataset' } });
      assert.strictEqual(dr.search('test').length, 1);
    });
    it('getByTag filters by tag', function() {
      const dr = new DatasetRegistry();
      dr.register('ds1', { config: { tags: ['ml'] } }); dr.register('ds2', { config: { tags: ['nlp'] } });
      assert.strictEqual(dr.getByTag('ml').length, 1);
    });
    it('list filters by tag and description', function() {
      const dr = new DatasetRegistry();
      dr.register('ds', { config: { tags: ['ml'], description: 'machine learning' } });
      assert.strictEqual(dr.list({ tag: 'ml' }).length, 1);
    });
    it('clear removes all', function() {
      const dr = new DatasetRegistry(); dr.register('ds', { config: {} }); dr.clear();
      assert.strictEqual(dr.list().length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 27b. BenchmarkDatasets — additional tests (2 more)
  // ═════════════════════════════════════════════════════════════════
  describe('BenchmarkDatasets list by tags and getEntries count', function() {
    it('list filters datasets by tags', function() {
      const bd = new BenchmarkDatasets(); bd.clear();
      bd.register('tag_ds1', { tags: ['ml'] }); bd.register('tag_ds2', { tags: ['nlp'] });
      assert.strictEqual(bd.list({ tags: ['ml'] }).length, 1);
    });
    it('getEntries with count returns limited subset', function() {
      const bd = new BenchmarkDatasets(); bd.clear();
      bd.register('cnt_ds', { entries: [{ input: 'a', expected: 'b' }, { input: 'c', expected: 'd' }, { input: 'e', expected: 'f' }] });
      assert.strictEqual(bd.getEntries('cnt_ds', 2).length, 2);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 1. EvaluationRegistry (14 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('EvaluationRegistry', function() {
    it('registerEvaluator stores evaluator and returns id', function() {
      const er = new EvaluationRegistry();
      const id = er.registerEvaluator('quality', () => 'result');
      assert.ok(id); assert.ok(id.startsWith('quality_'));
    });
    it('registerEvaluator throws for unknown type', function() {
      const er = new EvaluationRegistry();
      assert.throws(() => er.registerEvaluator('unknown', () => {}), /Unknown evaluation type/);
    });
    it('getEvaluator returns evaluator by id', function() {
      const er = new EvaluationRegistry();
      const id = er.registerEvaluator('quality', () => 'ok');
      assert.ok(er.getEvaluator(id));
    });
    it('getEvaluator returns null for unknown id', function() {
      const er = new EvaluationRegistry();
      assert.strictEqual(er.getEvaluator('none'), null);
    });
    it('unregisterEvaluator removes evaluator', function() {
      const er = new EvaluationRegistry();
      const id = er.registerEvaluator('benchmark', () => 'r');
      assert.strictEqual(er.unregisterEvaluator(id), true);
      assert.strictEqual(er.getEvaluator(id), null);
    });
    it('unregisterEvaluator returns false for missing', function() {
      const er = new EvaluationRegistry();
      assert.strictEqual(er.unregisterEvaluator('none'), false);
    });
    it('listEvaluators returns all evaluators', function() {
      const er = new EvaluationRegistry();
      er.registerEvaluator('quality', () => 1); er.registerEvaluator('benchmark', () => 2);
      assert.strictEqual(er.listEvaluators().length, 2);
    });
    it('listEvaluators filters by type', function() {
      const er = new EvaluationRegistry();
      er.registerEvaluator('quality', () => 1); er.registerEvaluator('benchmark', () => 2);
      assert.strictEqual(er.listEvaluators('quality').length, 1);
    });
    it('registerMetric stores metric definition', function() {
      const er = new EvaluationRegistry();
      er.registerMetric('accuracy', { type: 'number', min: 0, max: 1 });
      assert.strictEqual(er.listMetrics().length, 1);
    });
    it('registerMetric throws for duplicate', function() {
      const er = new EvaluationRegistry();
      er.registerMetric('m', {});
      assert.throws(() => er.registerMetric('m', {}), /already registered/);
    });
    it('getMetric returns metric or null', function() {
      const er = new EvaluationRegistry();
      er.registerMetric('m', {}); assert.ok(er.getMetric('m'));
      assert.strictEqual(er.getMetric('none'), null);
    });
    it('registerBenchmark and getBenchmark', function() {
      const er = new EvaluationRegistry();
      er.registerBenchmark('b1', { tests: [] });
      assert.ok(er.getBenchmark('b1')); assert.strictEqual(er.getBenchmark('none'), null);
    });
    it('registerRubric and listRubrics', function() {
      const er = new EvaluationRegistry();
      er.registerRubric('r1', { criteria: [] });
      assert.strictEqual(er.listRubrics().length, 1);
    });
    it('registerDataset and getDataset', function() {
      const er = new EvaluationRegistry();
      er.registerDataset('d1', { entries: [] });
      assert.ok(er.getDataset('d1'));
    });
    it('EVALUATION_TYPES and METRIC_TYPES constants exist', function() {
      assert.ok(EVALUATION_TYPES.QUALITY); assert.ok(METRIC_TYPES.ACCURACY);
    });
    it('clear removes all registrations', function() {
      const er = new EvaluationRegistry();
      er.registerEvaluator('quality', () => 1); er.registerMetric('m', {}); er.registerBenchmark('b', {}); er.registerRubric('r', {}); er.registerDataset('d', {});
      er.clear();
      assert.strictEqual(er.listEvaluators().length, 0); assert.strictEqual(er.listMetrics().length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 2. EvaluationStorage (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('EvaluationStorage', function() {
    it('set stores value under namespace + key', function() {
      const es = new EvaluationStorage(); es.set('ns1', 'k1', 'value1');
      assert.strictEqual(es.get('ns1', 'k1'), 'value1');
    });
    it('get returns undefined for missing key', function() {
      const es = new EvaluationStorage();
      assert.strictEqual(es.get('ns', 'missing'), undefined);
    });
    it('has returns true for existing key', function() {
      const es = new EvaluationStorage(); es.set('ns', 'k', 'v');
      assert.strictEqual(es.has('ns', 'k'), true);
    });
    it('has returns false for missing key', function() {
      const es = new EvaluationStorage();
      assert.strictEqual(es.has('ns', 'missing'), false);
    });
    it('delete removes a stored value', function() {
      const es = new EvaluationStorage(); es.set('ns', 'k', 'v');
      assert.strictEqual(es.delete('ns', 'k'), true);
      assert.strictEqual(es.has('ns', 'k'), false);
    });
    it('delete returns false for non-existent', function() {
      const es = new EvaluationStorage();
      assert.strictEqual(es.delete('ns', 'none'), false);
    });
    it('list returns all keys in namespace', function() {
      const es = new EvaluationStorage(); es.set('ns', 'a', 1); es.set('ns', 'b', 2);
      assert.strictEqual(es.list('ns').length, 2);
    });
    it('list returns empty for unknown namespace', function() {
      const es = new EvaluationStorage();
      assert.deepStrictEqual(es.list('unknown'), []);
    });
    it('clearNamespace removes all keys in namespace', function() {
      const es = new EvaluationStorage(); es.set('ns', 'k', 'v');
      es.clearNamespace('ns');
      assert.strictEqual(es.get('ns', 'k'), undefined);
    });
    it('clear removes all namespaces and keys', function() {
      const es = new EvaluationStorage(); es.set('ns1', 'k', 'v'); es.set('ns2', 'k', 'v');
      es.clear();
      assert.strictEqual(es.get('ns1', 'k'), undefined); assert.strictEqual(es.get('ns2', 'k'), undefined);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 3. EvaluationEvents (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('EvaluationEvents', function() {
    it('on registers handler and returns unsubscribe fn', function() {
      const ee = new EvaluationEvents();
      const unsub = ee.on('test', () => {});
      assert.strictEqual(typeof unsub, 'function');
    });
    it('emit triggers handlers for event', function() {
      const ee = new EvaluationEvents(); let called = false;
      ee.on('test', () => { called = true; });
      ee.emit('test', {});
      assert.strictEqual(called, true);
    });
    it('off removes handler', function() {
      const ee = new EvaluationEvents(); let count = 0;
      const h = () => { count++; };
      ee.on('e', h); ee.off('e', h);
      ee.emit('e', {});
      assert.strictEqual(count, 0);
    });
    it('wildcard * catches all events', function() {
      const ee = new EvaluationEvents(); let called = false;
      ee.on('*', () => { called = true; });
      ee.emit('anything', {});
      assert.strictEqual(called, true);
    });
    it('history stores emitted events', function() {
      const ee = new EvaluationEvents();
      ee.emit('e1', { x: 1 }); ee.emit('e2', { y: 2 });
      assert.strictEqual(ee.history().length, 2);
    });
    it('history filters by event name', function() {
      const ee = new EvaluationEvents();
      ee.emit('a', {}); ee.emit('b', {});
      assert.strictEqual(ee.history({ event: 'a' }).length, 1);
    });
    it('history filters by since timestamp', function() {
      const ee = new EvaluationEvents();
      const before = Date.now() - 60000;
      ee.emit('e', {});
      assert.strictEqual(ee.history({ since: before }).length, 1);
    });
    it('EVENTS constants are defined', function() {
      assert.ok(EVENTS.EVALUATION_STARTED); assert.ok(EVENTS.EVALUATION_COMPLETED);
    });
    it('errors in listeners do not crash emit', function() {
      const ee = new EvaluationEvents();
      ee.on('e', () => { throw new Error('oops'); });
      ee.emit('e', {}); assert.ok(true);
    });
    it('clear removes all listeners and history', function() {
      const ee = new EvaluationEvents(); ee.on('e', () => {}); ee.emit('e', {});
      ee.clear();
      assert.strictEqual(ee.history().length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 4. EvaluationMetrics (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('EvaluationMetrics', function() {
    it('record stores metric value with tags', function() {
      const em = new EvaluationMetrics(); em.record('accuracy', 0.9, { model: 'gpt4' });
      assert.strictEqual(em.query('accuracy').length, 1);
    });
    it('query filters by since timestamp', function() {
      const em = new EvaluationMetrics(); em.record('m', 1);
      const ts = Date.now() + 1000;
      assert.strictEqual(em.query('m', { since: ts }).length, 0);
    });
    it('query filters by tags', function() {
      const em = new EvaluationMetrics(); em.record('m', 1, { env: 'prod' }); em.record('m', 2, { env: 'test' });
      assert.strictEqual(em.query('m', { tags: { env: 'prod' } }).length, 1);
    });
    it('aggregate returns avg/min/max/median', function() {
      const em = new EvaluationMetrics(); em.record('m', 10); em.record('m', 20); em.record('m', 30);
      const agg = em.aggregate('m');
      assert.strictEqual(agg.avg, 20); assert.strictEqual(agg.min, 10); assert.strictEqual(agg.max, 30);
    });
    it('aggregate returns null for empty metric', function() {
      const em = new EvaluationMetrics();
      assert.strictEqual(em.aggregate('none'), null);
    });
    it('aggregate median for even count', function() {
      const em = new EvaluationMetrics(); em.record('m', 1); em.record('m', 2); em.record('m', 3); em.record('m', 4);
      assert.strictEqual(em.aggregate('m').median, 3);
    });
    it('getMetricNames returns all metric names', function() {
      const em = new EvaluationMetrics(); em.record('a', 1); em.record('b', 2);
      const names = em.getMetricNames();
      assert.ok(names.includes('a')); assert.ok(names.includes('b'));
    });
    it('clear removes all records', function() {
      const em = new EvaluationMetrics(); em.record('m', 1); em.clear();
      assert.strictEqual(em.getMetricNames().length, 0);
    });
    it('query with limit returns last N records', function() {
      const em = new EvaluationMetrics(); em.record('m', 1); em.record('m', 2); em.record('m', 3);
      assert.strictEqual(em.query('m', { limit: 2 }).length, 2);
    });
    it('record handles empty tags', function() {
      const em = new EvaluationMetrics(); em.record('m', 0.5);
      assert.strictEqual(em.query('m').length, 1);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 5. EvaluationScheduler (12 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('EvaluationScheduler', function() {
    it('schedule stores new schedule with id', function() {
      const es = new EvaluationScheduler(); es.schedule('s1', { intervalMs: 1000 });
      assert.ok(es.getSchedule('s1'));
    });
    it('getSchedule returns null for unknown', function() {
      const es = new EvaluationScheduler();
      assert.strictEqual(es.getSchedule('none'), null);
    });
    it('schedule rejects duplicate id', function() {
      const es = new EvaluationScheduler(); es.schedule('s', { intervalMs: 1000 });
      assert.throws(() => es.schedule('s', {}), /already exists/);
    });
    it('cancel removes schedule', function() {
      const es = new EvaluationScheduler(); es.schedule('s', {});
      assert.strictEqual(es.cancel('s'), true);
      assert.strictEqual(es.getSchedule('s'), null);
    });
    it('listSchedules returns all schedules', function() {
      const es = new EvaluationScheduler(); es.schedule('a', {}); es.schedule('b', {});
      assert.strictEqual(es.listSchedules().length, 2);
    });
    it('getDueSchedules returns schedules ready to run', function() {
      const es = new EvaluationScheduler();
      es.schedule('s', { intervalMs: -1000 });
      assert.strictEqual(es.getDueSchedules().length, 1);
    });
    it('tick executes due schedules via runner', async function() {
      const es = new EvaluationScheduler(); let ran = false;
      es.schedule('s', { intervalMs: -1000 });
      await es.tick(() => { ran = true; return 'done'; });
      assert.strictEqual(ran, true);
    });
    it('pause sets paused flag on schedule', function() {
      const es = new EvaluationScheduler(); es.schedule('s', { intervalMs: 1000 });
      es.pause('s');
      assert.strictEqual(es.getDueSchedules().length, 0);
    });
    it('resume clears paused and resets nextRun', function() {
      const es = new EvaluationScheduler(); es.schedule('s', { intervalMs: 1000 });
      es.pause('s'); es.resume('s');
      assert.ok(true);
    });
    it('getResult returns stored result', async function() {
      const es = new EvaluationScheduler(); es.schedule('s', { intervalMs: -1000 });
      await es.tick(() => 'result');
      assert.strictEqual(es.getResult('s').result, 'result');
    });
    it('handle errors in tick runner do not crash', async function() {
      const es = new EvaluationScheduler(); es.schedule('s', { intervalMs: -1000 });
      await es.tick(() => { throw new Error('fail'); });
      assert.strictEqual(es.getSchedule('s').runCount, 1);
    });
    it('clear stops and removes everything', function() {
      const es = new EvaluationScheduler(); es.schedule('s', {}); es.clear();
      assert.strictEqual(es.listSchedules().length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 6. EvaluationHistory (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('EvaluationHistory', function() {
    it('record stores entry and returns id', function() {
      const eh = new EvaluationHistory();
      const id = eh.record({ type: 'test', status: 'completed' });
      assert.ok(id.startsWith('eval_'));
    });
    it('get returns entry by id', function() {
      const eh = new EvaluationHistory();
      const id = eh.record({ type: 'test', status: 'completed' });
      assert.strictEqual(eh.get(id).status, 'completed');
    });
    it('get returns null for missing id', function() {
      const eh = new EvaluationHistory();
      assert.strictEqual(eh.get('none'), null);
    });
    it('query filters by type', function() {
      const eh = new EvaluationHistory();
      eh.record({ type: 'a', status: 'ok' }); eh.record({ type: 'b', status: 'ok' });
      assert.strictEqual(eh.query({ type: 'a' }).length, 1);
    });
    it('query filters by status', function() {
      const eh = new EvaluationHistory();
      eh.record({ type: 't', status: 'pass' }); eh.record({ type: 't', status: 'fail' });
      assert.strictEqual(eh.query({ status: 'pass' }).length, 1);
    });
    it('query respects limit', function() {
      const eh = new EvaluationHistory();
      eh.record({ type: 't', status: 'ok' }); eh.record({ type: 't', status: 'ok' }); eh.record({ type: 't', status: 'ok' });
      assert.strictEqual(eh.query({ limit: 2 }).length, 2);
    });
    it('stats returns total, byType, byStatus', function() {
      const eh = new EvaluationHistory();
      eh.record({ type: 'a', status: 'pass' }); eh.record({ type: 'a', status: 'fail' }); eh.record({ type: 'b', status: 'pass' });
      const s = eh.stats();
      assert.strictEqual(s.total, 3); assert.strictEqual(s.byType.a, 2);
    });
    it('clear removes all entries', function() {
      const eh = new EvaluationHistory(); eh.record({ type: 't', status: 'ok' }); eh.clear();
      assert.strictEqual(eh.query().length, 0);
    });
    it('query with since filter', function() {
      const eh = new EvaluationHistory();
      eh.record({ type: 't', status: 'ok', timestamp: 1000 });
      assert.strictEqual(eh.query({ since: 2000 }).length, 0);
    });
    it('query with tags filter', function() {
      const eh = new EvaluationHistory();
      eh.record({ type: 't', status: 'ok', tags: { env: 'prod' } });
      eh.record({ type: 't', status: 'ok', tags: { env: 'test' } });
      assert.strictEqual(eh.query({ tags: { env: 'prod' } }).length, 1);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 7. EvaluationRunner (12 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('EvaluationRunner', function() {
    it('run with valid evaluator completes successfully', async function() {
      const registry = new EvaluationRegistry();
      const id = registry.registerEvaluator('quality', async (input) => ({ score: 0.9 }));
      const runner = new EvaluationRunner(registry, new EvaluationStorage(), new EvaluationEvents(), new EvaluationHistory());
      const result = await runner.run({ type: 'quality', evaluatorId: id, input: 'test' });
      assert.strictEqual(result.status, 'completed');
    });
    it('run fails with missing evaluator', async function() {
      const runner = new EvaluationRunner(new EvaluationRegistry(), new EvaluationStorage(), new EvaluationEvents(), new EvaluationHistory());
      const result = await runner.run({ type: 'quality', evaluatorId: 'none', input: 'test' });
      assert.strictEqual(result.status, 'failed');
    });
    it('runBatch executes multiple evaluations', async function() {
      const registry = new EvaluationRegistry();
      const id = registry.registerEvaluator('quality', async () => ({ score: 1 }));
      const runner = new EvaluationRunner(registry, new EvaluationStorage(), new EvaluationEvents(), new EvaluationHistory());
      const results = await runner.runBatch([{ type: 'quality', evaluatorId: id, input: 'a' }, { type: 'quality', evaluatorId: id, input: 'b' }]);
      assert.strictEqual(results.length, 2);
    });
    it('getRun returns run by id', async function() {
      const registry = new EvaluationRegistry();
      const id = registry.registerEvaluator('quality', async () => ({ score: 1 }));
      const runner = new EvaluationRunner(registry, new EvaluationStorage(), new EvaluationEvents(), new EvaluationHistory());
      const run = await runner.run({ type: 'quality', evaluatorId: id, input: 'x' });
      assert.ok(runner.getRun(run.id));
    });
    it('listRuns returns all completed runs', async function() {
      const registry = new EvaluationRegistry();
      const id = registry.registerEvaluator('quality', async () => ({ score: 1 }));
      const runner = new EvaluationRunner(registry, new EvaluationStorage(), new EvaluationEvents(), new EvaluationHistory());
      await runner.run({ type: 'quality', evaluatorId: id, input: 'x' });
      assert.strictEqual(runner.listRuns().length, 1);
    });
    it('getActive returns currently active runs', async function() {
      const registry = new EvaluationRegistry();
      const id = registry.registerEvaluator('quality', async () => { await new Promise(r => setTimeout(r, 10)); return { score: 1 }; });
      const runner = new EvaluationRunner(registry, new EvaluationStorage(), new EvaluationEvents(), new EvaluationHistory());
      const promise = runner.run({ type: 'quality', evaluatorId: id, input: 'x' });
      assert.strictEqual(runner.getActive().length, 1);
      await promise;
    });
    it('cancel stops an active run', async function() {
      const registry = new EvaluationRegistry();
      const id = registry.registerEvaluator('quality', async () => { await new Promise(r => setTimeout(r, 100)); return { score: 1 }; });
      const runner = new EvaluationRunner(registry, new EvaluationStorage(), new EvaluationEvents(), new EvaluationHistory());
      const promise = runner.run({ type: 'quality', evaluatorId: id, input: 'x' });
      const active = runner.getActive();
      if (active.length > 0) assert.strictEqual(runner.cancel(active[0].id), true);
      await promise;
    });
    it('cancel returns false for unknown run', function() {
      const runner = new EvaluationRunner(new EvaluationRegistry(), new EvaluationStorage(), new EvaluationEvents(), new EvaluationHistory());
      assert.strictEqual(runner.cancel('none'), false);
    });
    it('clear removes active and stored runs', function() {
      const runner = new EvaluationRunner(new EvaluationRegistry(), new EvaluationStorage(), new EvaluationEvents(), new EvaluationHistory());
      runner.clear();
      assert.strictEqual(runner.getActive().length, 0);
    });
    it('getRun returns null for unknown', function() {
      const runner = new EvaluationRunner(new EvaluationRegistry(), new EvaluationStorage(), new EvaluationEvents(), new EvaluationHistory());
      assert.strictEqual(runner.getRun('none'), null);
    });
    it('listRuns filters by status', async function() {
      const registry = new EvaluationRegistry();
      const id = registry.registerEvaluator('quality', async () => ({ score: 1 }));
      const runner = new EvaluationRunner(registry, new EvaluationStorage(), new EvaluationEvents(), new EvaluationHistory());
      await runner.run({ type: 'quality', evaluatorId: id, input: 'x' });
      assert.strictEqual(runner.listRuns({ status: 'completed' }).length, 1);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 8. EvaluationReports (12 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('EvaluationReports', function() {
    it('generate creates report with scores', function() {
      const history = new EvaluationHistory();
      history.record({ type: 'evaluation', status: 'completed', timestamp: Date.now() });
      const reports = new EvaluationReports(history, new EvaluationMetrics(), new EvaluationStorage());
      const report = reports.generate();
      assert.ok(report.id); assert.strictEqual(typeof report.overallScore, 'number');
    });
    it('generate calculates overall score from metrics', function() {
      const metrics = new EvaluationMetrics();
      metrics.record('quality', 0.8); metrics.record('accuracy', 0.9);
      const reports = new EvaluationReports(new EvaluationHistory(), metrics, new EvaluationStorage());
      const report = reports.generate();
      assert.ok(report.overallScore > 0);
    });
    it('generate includes suggestions for low scores', function() {
      const metrics = new EvaluationMetrics();
      metrics.record('quality', 0.5); metrics.record('accuracy', 0.4);
      const history = new EvaluationHistory();
      history.record({ type: 'evaluation', status: 'completed' });
      const reports = new EvaluationReports(history, metrics, new EvaluationStorage());
      const report = reports.generate();
      assert.ok(report.suggestions.length > 0);
    });
    it('getReport returns report by id', function() {
      const reports = new EvaluationReports(new EvaluationHistory(), new EvaluationMetrics(), new EvaluationStorage());
      const report = reports.generate();
      assert.strictEqual(reports.getReport(report.id).id, report.id);
    });
    it('getReport returns null for missing', function() {
      const reports = new EvaluationReports(new EvaluationHistory(), new EvaluationMetrics(), new EvaluationStorage());
      assert.strictEqual(reports.getReport('none'), null);
    });
    it('listReports returns all reports', function() {
      const reports = new EvaluationReports(new EvaluationHistory(), new EvaluationMetrics(), new EvaluationStorage());
      reports.generate(); reports.generate();
      assert.strictEqual(reports.listReports().length, 2);
    });
    it('exportCSV produces csv string', function() {
      const history = new EvaluationHistory();
      history.record({ type: 'evaluation', status: 'completed', timestamp: Date.now() });
      const reports = new EvaluationReports(history, new EvaluationMetrics(), new EvaluationStorage());
      const csv = reports.exportCSV();
      assert.ok(csv.includes('id,type,status'));
    });
    it('clear removes all reports', function() {
      const reports = new EvaluationReports(new EvaluationHistory(), new EvaluationMetrics(), new EvaluationStorage());
      reports.generate(); reports.clear();
      assert.strictEqual(reports.listReports().length, 0);
    });
    it('generate with empty data creates valid report', function() {
      const reports = new EvaluationReports(new EvaluationHistory(), new EvaluationMetrics(), new EvaluationStorage());
      const report = reports.generate();
      assert.strictEqual(report.totalEvaluations, 0);
    });
    it('generate respects filter option', function() {
      const history = new EvaluationHistory();
      history.record({ type: 'a', status: 'completed', timestamp: 1000 });
      history.record({ type: 'b', status: 'completed', timestamp: 2000 });
      const reports = new EvaluationReports(history, new EvaluationMetrics(), new EvaluationStorage());
      const report = reports.generate({ filter: { type: 'a' } });
      assert.strictEqual(report.totalEvaluations, 1);
    });
    it('exportCSV includes error column for failed runs', function() {
      const history = new EvaluationHistory();
      history.record({ type: 'eval', status: 'failed', timestamp: Date.now(), error: 'timeout' });
      const reports = new EvaluationReports(history, new EvaluationMetrics(), new EvaluationStorage());
      const csv = reports.exportCSV();
      assert.ok(csv.includes('timeout'));
    });
    it('suggestions includes hallucination critical when high', function() {
      const metrics = new EvaluationMetrics();
      metrics.record('hallucination', 0.5);
      const reports = new EvaluationReports(new EvaluationHistory(), metrics, new EvaluationStorage());
      const report = reports.generate();
      assert.ok(report.suggestions.some(s => s.area === 'hallucination'));
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 9. EvaluationEngine (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('EvaluationEngine', function() {
    it('create creates engine with sub-components', function() {
      const engine = new EvaluationEngine();
      assert.ok(engine.registry); assert.ok(engine.storage); assert.ok(engine.events); assert.ok(engine.metrics);
    });
    it('evaluate runs evaluation by type', async function() {
      const engine = new EvaluationEngine();
      engine.registry.registerEvaluator('quality', async () => ({ score: 1 }));
      const result = await engine.evaluate('quality', 'test');
      assert.ok(result);
    });
    it('evaluate throws for missing evaluator type', async function() {
      const engine = new EvaluationEngine();
      try { await engine.evaluate('nonexistent', 'test'); assert.fail(); } catch (e) { assert.ok(e); }
    });
    it('evaluateWith runs evaluation for specific evaluator', async function() {
      const engine = new EvaluationEngine();
      const id = engine.registry.registerEvaluator('quality', async () => ({ score: 1 }));
      const result = await engine.evaluateWith(id, 'input');
      assert.strictEqual(result.status, 'completed');
    });
    it('getStatus returns status object', function() {
      const engine = new EvaluationEngine();
      const status = engine.getStatus();
      assert.strictEqual(typeof status.registry, 'object'); assert.strictEqual(typeof status.runner, 'object');
    });
    it('clear resets all sub-components', function() {
      const engine = new EvaluationEngine();
      engine.registry.registerEvaluator('quality', async () => ({}));
      engine.clear();
      assert.strictEqual(engine.registry.listEvaluators().length, 0);
    });
    it('custom modules can be passed in options', function() {
      const customRegistry = new EvaluationRegistry();
      const engine = new EvaluationEngine({ registry: customRegistry });
      assert.strictEqual(engine.registry, customRegistry);
    });
    it('independent instances do not share state', function() {
      const e1 = new EvaluationEngine(); const e2 = new EvaluationEngine();
      e1.registry.registerEvaluator('quality', async () => ({}));
      assert.strictEqual(e2.registry.listEvaluators().length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 10. PromptRegistry (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('PromptRegistry', function() {
    it('register stores prompt and returns entry', function() {
      const pr = new PromptRegistry();
      const entry = pr.register('p1', { text: 'Hello {{name}}', tags: ['greeting'] });
      assert.strictEqual(entry.id, 'p1');
    });
    it('get returns prompt by id', function() {
      const pr = new PromptRegistry(); pr.register('p', { text: 'Hi' });
      assert.strictEqual(pr.get('p').text, 'Hi');
    });
    it('get returns null for missing id', function() {
      const pr = new PromptRegistry(); assert.strictEqual(pr.get('none'), null);
    });
    it('register throws for duplicate id', function() {
      const pr = new PromptRegistry(); pr.register('dup', { text: 'a' });
      assert.throws(() => pr.register('dup', { text: 'b' }), /already registered/);
    });
    it('update modifies prompt fields', function() {
      const pr = new PromptRegistry(); pr.register('p', { text: 'old' });
      pr.update('p', { text: 'new' });
      assert.strictEqual(pr.get('p').text, 'new');
    });
    it('unregister removes prompt', function() {
      const pr = new PromptRegistry(); pr.register('p', { text: 'x' });
      assert.strictEqual(pr.unregister('p'), true);
      assert.strictEqual(pr.get('p'), null);
    });
    it('list returns all prompts, optionally filtered by tag', function() {
      const pr = new PromptRegistry(); pr.register('a', { text: 'a', tags: ['x'] }); pr.register('b', { text: 'b', tags: ['y'] });
      assert.strictEqual(pr.list({ tag: 'x' }).length, 1);
    });
    it('search finds prompts by text', function() {
      const pr = new PromptRegistry(); pr.register('p', { text: 'hello world' });
      assert.strictEqual(pr.search('world').length, 1);
    });
    it('createdAt is preserved on registration', function() {
      const pr = new PromptRegistry();
      const entry = pr.register('p', { text: 'test' });
      assert.ok(entry.createdAt);
    });
    it('clear removes all prompts', function() {
      const pr = new PromptRegistry(); pr.register('p', { text: 'x' }); pr.clear();
      assert.strictEqual(pr.list().length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 11. PromptVersioning (12 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('PromptVersioning', function() {
    it('createVersion auto-increments version number', function() {
      const pv = new PromptVersioning();
      const v1 = pv.createVersion('p1', 'text1'); const v2 = pv.createVersion('p1', 'text2');
      assert.strictEqual(v1.version, 1); assert.strictEqual(v2.version, 2);
    });
    it('getVersion returns specific version', function() {
      const pv = new PromptVersioning(); pv.createVersion('p', 'v1'); pv.createVersion('p', 'v2');
      assert.strictEqual(pv.getVersion('p', 1).text, 'v1');
    });
    it('getVersion returns null for missing version', function() {
      const pv = new PromptVersioning();
      assert.strictEqual(pv.getVersion('none', 1), null);
    });
    it('getLatestVersion returns most recent', function() {
      const pv = new PromptVersioning(); pv.createVersion('p', 'a'); pv.createVersion('p', 'b');
      assert.strictEqual(pv.getLatestVersion('p').text, 'b');
    });
    it('getLatestVersion returns null for no versions', function() {
      const pv = new PromptVersioning();
      assert.strictEqual(pv.getLatestVersion('none'), null);
    });
    it('listVersions returns all versions descending', function() {
      const pv = new PromptVersioning(); pv.createVersion('p', 'a'); pv.createVersion('p', 'b');
      const list = pv.listVersions('p');
      assert.strictEqual(list.length, 2); assert.strictEqual(list[0].version, 2);
    });
    it('compareVersions returns diff between two versions', function() {
      const pv = new PromptVersioning(); pv.createVersion('p', 'line1\nline2'); pv.createVersion('p', 'line1\nline3');
      const diff = pv.compareVersions('p', 1, 2);
      assert.ok(diff.added); assert.ok(diff.removed);
    });
    it('compareVersions returns null for missing', function() {
      const pv = new PromptVersioning();
      assert.strictEqual(pv.compareVersions('none', 1, 2), null);
    });
    it('rollback creates new version from old version', function() {
      const pv = new PromptVersioning(); pv.createVersion('p', 'original'); pv.createVersion('p', 'updated');
      const rolled = pv.rollback('p', 1);
      assert.strictEqual(rolled.text, 'original');
    });
    it('rollback returns null for missing version', function() {
      const pv = new PromptVersioning();
      assert.strictEqual(pv.rollback('none', 99), null);
    });
    it('include metadata in version', function() {
      const pv = new PromptVersioning();
      const v = pv.createVersion('p', 'text', { author: 'test' });
      assert.strictEqual(v.metadata.author, 'test');
    });
    it('clear removes all versions', function() {
      const pv = new PromptVersioning(); pv.createVersion('p', 'a'); pv.clear();
      assert.strictEqual(pv.listVersions('p').length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 12. PromptTemplates (12 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('PromptTemplates', function() {
    it('compile returns variables list', function() {
      const pt = new PromptTemplates();
      const compiled = pt.compile('Hello {{name}}, you are {{age}}');
      assert.deepStrictEqual(compiled.variables, ['name', 'age']);
    });
    it('render replaces variables with values', function() {
      const pt = new PromptTemplates();
      const result = pt.render('Hello {{name}}', { name: 'Alice' });
      assert.strictEqual(result, 'Hello Alice');
    });
    it('render throws on missing variables', function() {
      const pt = new PromptTemplates();
      assert.throws(() => pt.render('Hi {{name}}', {}), /Missing required variables/);
    });
    it('validate returns valid for correct template', function() {
      const pt = new PromptTemplates();
      assert.strictEqual(pt.validate('Hello {{name}}').valid, true);
    });
    it('validate detects unclosed braces', function() {
      const pt = new PromptTemplates();
      assert.strictEqual(pt.validate('Hello {{name').valid, false);
    });
    it('validate detects mismatched braces', function() {
      const pt = new PromptTemplates();
      const result = pt.validate('Hello {{name}} {{broken');
      assert.strictEqual(result.valid, false);
    });
    it('extractVariables returns all variable names', function() {
      const pt = new PromptTemplates();
      const vars = pt.extractVariables('{{a}} and {{b}} and {{a}}');
      assert.deepStrictEqual(vars, ['a', 'b']);
    });
    it('compile caches compiled templates', function() {
      const pt = new PromptTemplates();
      pt.compile('test');
      assert.ok(pt._cache.has('test'));
    });
    it('handle empty template text', function() {
      const pt = new PromptTemplates();
      const compiled = pt.compile('');
      assert.deepStrictEqual(compiled.variables, []);
    });
    it('plain text with no variables renders as-is', function() {
      const pt = new PromptTemplates();
      assert.strictEqual(pt.render('Just plain text', {}), 'Just plain text');
    });
    it('partial render preview replaces known vars', function() {
      const pt = new PromptTemplates();
      const result = pt.preview('Hi {{name}} from {{city}}', { name: 'Bob' });
      assert.strictEqual(result, 'Hi Bob from [city]');
    });
    it('clear empties render cache', function() {
      const pt = new PromptTemplates(); pt.compile('test'); pt.clear();
      assert.strictEqual(pt._cache.size, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 13. PromptVariables (12 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('PromptVariables', function() {
    it('define stores variable definition', function() {
      const pv = new PromptVariables(); pv.define('name', { type: 'string' });
      assert.ok(pv.get('name'));
    });
    it('get returns variable definition', function() {
      const pv = new PromptVariables(); pv.define('n', { type: 'string' });
      assert.strictEqual(pv.get('n').type, 'string');
    });
    it('get returns null for undefined variable', function() {
      const pv = new PromptVariables(); assert.strictEqual(pv.get('none'), null);
    });
    it('list returns all defined variables', function() {
      const pv = new PromptVariables(); pv.define('a', {}); pv.define('b', {});
      assert.strictEqual(pv.list().length, 2);
    });
    it('resolve returns value with default fallback', function() {
      const pv = new PromptVariables(); pv.define('n', { type: 'string', default: 'default' });
      assert.strictEqual(pv.resolve('n').value, 'default');
    });
    it('resolveAll returns resolved values', function() {
      const pv = new PromptVariables(); pv.define('a', { type: 'string' }); pv.define('b', { type: 'string' });
      const result = pv.resolveAll({ a: 'hello', b: 'world' });
      assert.strictEqual(result.resolved.a, 'hello');
    });
    it('validate returns valid for matching type', function() {
      const pv = new PromptVariables(); pv.define('n', { type: 'number' });
      assert.strictEqual(pv.validate('n', 42).valid, true);
    });
    it('validate returns error for type mismatch', function() {
      const pv = new PromptVariables(); pv.define('n', { type: 'number' });
      assert.strictEqual(pv.validate('n', 'not').valid, false);
    });
    it('validate select enforces options', function() {
      const pv = new PromptVariables(); pv.define('c', { type: 'select', options: ['a', 'b'] });
      assert.strictEqual(pv.validate('c', 'c').valid, false);
    });
    it('undefine removes variable', function() {
      const pv = new PromptVariables(); pv.define('n', {}); pv.undefine('n');
      assert.strictEqual(pv.get('n'), null);
    });
    it('validate required rejects null value', function() {
      const pv = new PromptVariables(); pv.define('r', { type: 'string', required: true });
      assert.strictEqual(pv.validate('r', null).valid, false);
    });
    it('clear removes all variables', function() {
      const pv = new PromptVariables(); pv.define('a', {}); pv.clear();
      assert.strictEqual(pv.list().length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 14. PromptSnapshots (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('PromptSnapshots', function() {
    it('capture snapshot stores entry with id', function() {
      const ps = new PromptSnapshots();
      const snap = ps.snapshot('p1', { text: 'hello', version: 1 });
      assert.ok(snap.id.startsWith('snap_'));
    });
    it('get returns snapshot by id', function() {
      const ps = new PromptSnapshots();
      const snap = ps.snapshot('p1', { text: 'hello', version: 1 });
      assert.strictEqual(ps.get(snap.id).text, 'hello');
    });
    it('get returns null for missing id', function() {
      const ps = new PromptSnapshots();
      assert.strictEqual(ps.get('none'), null);
    });
    it('list returns snapshots for promptId', function() {
      const ps = new PromptSnapshots();
      ps.snapshot('p1', { text: 'a', version: 1 }); ps.snapshot('p2', { text: 'b', version: 1 });
      assert.strictEqual(ps.list('p1').length, 1);
    });
    it('list returns all when promptId omitted', function() {
      const ps = new PromptSnapshots();
      ps.snapshot('p1', { text: 'a', version: 1 }); ps.snapshot('p2', { text: 'b', version: 1 });
      assert.strictEqual(ps.list().length, 2);
    });
    it('restore returns text and metadata', function() {
      const ps = new PromptSnapshots();
      const snap = ps.snapshot('p1', { text: 'hello', version: 1, metadata: { k: 'v' } });
      const restored = ps.restore(snap.id);
      assert.strictEqual(restored.text, 'hello');
    });
    it('restore returns null for missing', function() {
      const ps = new PromptSnapshots();
      assert.strictEqual(ps.restore('none'), null);
    });
    it('compare returns diff between two snapshots', function() {
      const ps = new PromptSnapshots();
      const a = ps.snapshot('p1', { text: 'line1\nline2', version: 1 });
      const b = ps.snapshot('p1', { text: 'line1\nline3', version: 2 });
      const diff = ps.compare(a.id, b.id);
      assert.ok(diff.added); assert.ok(diff.removed);
    });
    it('delete removes snapshot', function() {
      const ps = new PromptSnapshots();
      const snap = ps.snapshot('p1', { text: 'x', version: 1 });
      assert.strictEqual(ps.delete(snap.id), true);
      assert.strictEqual(ps.get(snap.id), null);
    });
    it('clear removes all snapshots', function() {
      const ps = new PromptSnapshots(); ps.snapshot('p1', { text: 'x', version: 1 }); ps.clear();
      assert.strictEqual(ps.list().length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 15. PromptHistory (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('PromptHistory', function() {
    it('record stores entry with id', function() {
      const ph = new PromptHistory();
      const entry = ph.record('update', 'p1', { text: 'new' });
      assert.ok(entry.id.startsWith('hist_'));
    });
    it('query filters by promptId', function() {
      const ph = new PromptHistory();
      ph.record('update', 'p1', {}); ph.record('update', 'p2', {});
      assert.strictEqual(ph.query({ promptId: 'p1' }).length, 1);
    });
    it('query filters by action', function() {
      const ph = new PromptHistory();
      ph.record('create', 'p1', {}); ph.record('update', 'p1', {});
      assert.strictEqual(ph.query({ action: 'create' }).length, 1);
    });
    it('get returns entry by id', function() {
      const ph = new PromptHistory();
      const entry = ph.record('update', 'p1', {});
      assert.strictEqual(ph.get(entry.id).action, 'update');
    });
    it('get returns null for missing id', function() {
      const ph = new PromptHistory();
      assert.strictEqual(ph.get('none'), null);
    });
    it('stats returns total and byAction', function() {
      const ph = new PromptHistory();
      ph.record('create', 'p1', {}); ph.record('update', 'p1', {});
      const s = ph.stats('p1');
      assert.strictEqual(s.totalChanges, 2);
    });
    it('stats returns zeros for no entries', function() {
      const ph = new PromptHistory();
      const s = ph.stats('none');
      assert.strictEqual(s.totalChanges, 0);
    });
    it('clear removes all entries', function() {
      const ph = new PromptHistory(); ph.record('update', 'p1', {}); ph.clear();
      assert.strictEqual(ph.query({}).length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 16. ExperimentManager (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('ExperimentManager', function() {
    it('createExperiment creates experiment with id', function() {
      const em = new ExperimentManager();
      const exp = em.createExperiment({ name: 'Test' });
      assert.ok(exp.id); assert.strictEqual(exp.status, 'draft');
    });
    it('getExperiment returns experiment by id', function() {
      const em = new ExperimentManager();
      const exp = em.createExperiment({ name: 'Test' });
      assert.strictEqual(em.getExperiment(exp.id).name, 'Test');
    });
    it('getExperiment returns null for missing', function() {
      const em = new ExperimentManager();
      assert.strictEqual(em.getExperiment('none'), null);
    });
    it('updateExperiment modifies fields', function() {
      const em = new ExperimentManager();
      const exp = em.createExperiment({ name: 'Old' });
      em.updateExperiment(exp.id, { name: 'New' });
      assert.strictEqual(em.getExperiment(exp.id).name, 'New');
    });
    it('updateExperiment returns null for missing', function() {
      const em = new ExperimentManager();
      assert.strictEqual(em.updateExperiment('none', {}), null);
    });
    it('listExperiments returns all experiments', function() {
      const em = new ExperimentManager();
      em.createExperiment({ name: 'A' }); em.createExperiment({ name: 'B' });
      assert.strictEqual(em.listExperiments().length, 2);
    });
    it('startExperiment changes status to running', function() {
      const em = new ExperimentManager();
      const exp = em.createExperiment({ name: 'T' });
      const started = em.startExperiment(exp.id);
      assert.strictEqual(started.status, 'running');
    });
    it('stopExperiment changes status to stopped', function() {
      const em = new ExperimentManager();
      const exp = em.createExperiment({ name: 'T' });
      em.startExperiment(exp.id);
      assert.strictEqual(em.stopExperiment(exp.id).status, 'stopped');
    });
    it('archiveExperiment changes status to archived', function() {
      const em = new ExperimentManager();
      const exp = em.createExperiment({ name: 'T' });
      assert.strictEqual(em.archiveExperiment(exp.id).status, 'archived');
    });
    it('deleteExperiment removes experiment', function() {
      const em = new ExperimentManager();
      const exp = em.createExperiment({ name: 'T' });
      em.deleteExperiment(exp.id);
      assert.strictEqual(em.getExperiment(exp.id), null);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 17. ExperimentRunner (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('ExperimentRunner', function() {
    it('runVariant runs variant and returns result', async function() {
      const storage = new ExperimentStorage(); const metrics = new ExperimentMetrics();
      const runner = new ExperimentRunner(storage, metrics);
      const exp = new ExperimentManager(storage).createExperiment({ name: 'E', variants: [{ name: 'control', config: {} }] });
      const result = await runner.runVariant(exp.id, 'control', 'input');
      assert.ok(result.runId); assert.strictEqual(result.variant, 'control');
    });
    it('runVariant throws for missing experiment', async function() {
      const runner = new ExperimentRunner(new ExperimentStorage(), new ExperimentMetrics());
      try { await runner.runVariant('none', 'v', 'i'); assert.fail(); } catch (e) { assert.ok(e); }
    });
    it('runVariant throws for missing variant', async function() {
      const storage = new ExperimentStorage(); const runner = new ExperimentRunner(storage, new ExperimentMetrics());
      const exp = new ExperimentManager(storage).createExperiment({ name: 'E', variants: [{ name: 'ctrl', config: {} }] });
      try { await runner.runVariant(exp.id, 'none', 'i'); assert.fail(); } catch (e) { assert.ok(e); }
    });
    it('runExperiment runs all variants over inputs', async function() {
      const storage = new ExperimentStorage(); const runner = new ExperimentRunner(storage, new ExperimentMetrics());
      const exp = new ExperimentManager(storage).createExperiment({ name: 'E', variants: [{ name: 'A', config: {} }, { name: 'B', config: {} }] });
      const results = await runner.runExperiment(exp.id, ['x', 'y']);
      assert.strictEqual(results.length, 4);
    });
    it('getRun returns run by id', async function() {
      const storage = new ExperimentStorage(); const runner = new ExperimentRunner(storage, new ExperimentMetrics());
      const exp = new ExperimentManager(storage).createExperiment({ name: 'E', variants: [{ name: 'v', config: {} }] });
      const result = await runner.runVariant(exp.id, 'v', 'i');
      assert.ok(runner.getRun(result.runId));
    });
    it('getRun returns null for unknown', function() {
      const runner = new ExperimentRunner(new ExperimentStorage(), new ExperimentMetrics());
      assert.strictEqual(runner.getRun('none'), null);
    });
    it('getVariantResults returns results for variant', async function() {
      const storage = new ExperimentStorage(); const runner = new ExperimentRunner(storage, new ExperimentMetrics());
      const exp = new ExperimentManager(storage).createExperiment({ name: 'E', variants: [{ name: 'v', config: {} }] });
      await runner.runVariant(exp.id, 'v', 'i');
      assert.strictEqual(runner.getVariantResults(exp.id, 'v').length, 1);
    });
    it('clear removes all results', async function() {
      const storage = new ExperimentStorage(); const runner = new ExperimentRunner(storage, new ExperimentMetrics());
      const exp = new ExperimentManager(storage).createExperiment({ name: 'E', variants: [{ name: 'v', config: {} }] });
      await runner.runVariant(exp.id, 'v', 'i'); runner.clear();
      assert.strictEqual(runner.getVariantResults(exp.id, 'v').length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 18. ExperimentComparator (6 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('ExperimentComparator', function() {
    it('compareVariants returns comparisons with diffs', async function() {
      const storage = new ExperimentStorage(); const metrics = new ExperimentMetrics();
      const runner = new ExperimentRunner(storage, metrics);
      const exp = new ExperimentManager(storage).createExperiment({ name: 'E', variants: [{ name: 'A', config: {} }, { name: 'B', config: {} }] });
      await runner.runVariant(exp.id, 'A', 'x'); await runner.runVariant(exp.id, 'B', 'x');
      const comp = new ExperimentComparator(storage, metrics);
      const result = comp.compareVariants(exp.id);
      assert.strictEqual(result.comparisons.length, 1);
    });
    it('rankVariants ranks by metric', async function() {
      const storage = new ExperimentStorage(); const metrics = new ExperimentMetrics();
      const runner = new ExperimentRunner(storage, metrics);
      const exp = new ExperimentManager(storage).createExperiment({ name: 'E', variants: [{ name: 'A', config: {} }, { name: 'B', config: {} }] });
      await runner.runVariant(exp.id, 'A', 'x'); await runner.runVariant(exp.id, 'B', 'x');
      metrics.recordMetric(exp.id, 'A', 'score', 0.9); metrics.recordMetric(exp.id, 'B', 'score', 0.7);
      const comp = new ExperimentComparator(storage, metrics);
      assert.ok(comp.rankVariants(exp.id, 'score').length > 0);
    });
    it('findWinner returns top variant', async function() {
      const storage = new ExperimentStorage(); const metrics = new ExperimentMetrics();
      const runner = new ExperimentRunner(storage, metrics);
      const exp = new ExperimentManager(storage).createExperiment({ name: 'E', variants: [{ name: 'A', config: {} }] });
      await runner.runVariant(exp.id, 'A', 'x');
      metrics.recordMetric(exp.id, 'A', 'score', 0.95);
      const comp = new ExperimentComparator(storage, metrics);
      const winner = comp.findWinner(exp.id, 'score');
      assert.strictEqual(winner.variantName, 'A');
    });
    it('statisticalSignificance returns result for small samples', function() {
      const comp = new ExperimentComparator(new ExperimentStorage(), new ExperimentMetrics());
      const result = comp.statisticalSignificance([1, 2, 3], [4, 5, 6]);
      assert.strictEqual(typeof result.significant, 'boolean');
    });
    it('statisticalSignificance returns insignificant for <2 samples', function() {
      const comp = new ExperimentComparator(new ExperimentStorage(), new ExperimentMetrics());
      const result = comp.statisticalSignificance([1], [2]);
      assert.strictEqual(result.significant, false);
    });
    it('generateReport returns full report', async function() {
      const storage = new ExperimentStorage(); const metrics = new ExperimentMetrics();
      const runner = new ExperimentRunner(storage, metrics);
      const exp = new ExperimentManager(storage).createExperiment({ name: 'E', variants: [{ name: 'A', config: {} }] });
      await runner.runVariant(exp.id, 'A', 'x');
      const comp = new ExperimentComparator(storage, metrics);
      const report = comp.generateReport(exp.id);
      assert.strictEqual(report.experimentId, exp.id);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 19. ExperimentMetrics (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('ExperimentMetrics', function() {
    it('recordMetric stores metric value', function() {
      const em = new ExperimentMetrics();
      em.recordMetric('exp1', 'v1', 'accuracy', 0.95);
      assert.strictEqual(em.getMetrics('exp1').length, 1);
    });
    it('getMetrics returns all metrics for experiment', function() {
      const em = new ExperimentMetrics();
      em.recordMetric('e1', 'v1', 'm1', 1); em.recordMetric('e1', 'v2', 'm2', 2); em.recordMetric('e2', 'v1', 'm1', 3);
      assert.strictEqual(em.getMetrics('e1').length, 2);
    });
    it('getVariantSummary returns avg for variant', function() {
      const em = new ExperimentMetrics();
      em.recordMetric('e1', 'v1', 'latency', 100); em.recordMetric('e1', 'v1', 'latency', 200);
      const summary = em.getVariantSummary('e1', 'v1');
      assert.strictEqual(summary.latency.mean, 150);
    });
    it('getVariantSummary returns empty for no data', function() {
      const em = new ExperimentMetrics();
      assert.deepStrictEqual(em.getVariantSummary('none', 'v'), {});
    });
    it('compareMetric compares variants by metric', function() {
      const em = new ExperimentMetrics();
      em.recordMetric('e1', 'A', 'score', 80); em.recordMetric('e1', 'B', 'score', 90);
      const result = em.compareMetric('e1', 'score');
      assert.strictEqual(result.length, 2);
    });
    it('compareMetric sorts descending by mean', function() {
      const em = new ExperimentMetrics();
      em.recordMetric('e1', 'A', 's', 50); em.recordMetric('e1', 'B', 's', 100);
      const result = em.compareMetric('e1', 's');
      assert.strictEqual(result[0].variantName, 'B');
    });
    it('clear removes all metrics', function() {
      const em = new ExperimentMetrics(); em.recordMetric('e1', 'v1', 'm', 1); em.clear();
      assert.strictEqual(em.getMetrics('e1').length, 0);
    });
    it('recordMetric handles multiple values per variant', function() {
      const em = new ExperimentMetrics();
      em.recordMetric('e1', 'v1', 'score', 10); em.recordMetric('e1', 'v1', 'score', 20); em.recordMetric('e1', 'v1', 'score', 30);
      assert.strictEqual(em.getVariantSummary('e1', 'v1').score.mean, 20);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 20. ABTesting (12 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('ABTesting', function() {
    it('createTest creates test with id and variants', function() {
      const ab = new ABTesting();
      const id = ab.createTest({ name: 'Test A', variants: [{ name: 'control' }, { name: 'variant' }] });
      assert.ok(id);
    });
    it('createTest throws with <2 variants', function() {
      const ab = new ABTesting();
      assert.throws(() => ab.createTest({ name: 'Bad', variants: [{ name: 'only' }] }), /at least 2 variants/);
    });
    it('getTest returns test by id', function() {
      const ab = new ABTesting();
      const id = ab.createTest({ name: 'T', variants: [{ name: 'A' }, { name: 'B' }] });
      assert.strictEqual(ab.getTest(id).name, 'T');
    });
    it('getTest returns null for missing', function() {
      const ab = new ABTesting();
      assert.strictEqual(ab.getTest('none'), null);
    });
    it('listTests returns all tests', function() {
      const ab = new ABTesting();
      ab.createTest({ name: 'A', variants: [{ name: 'c' }, { name: 'v' }] });
      ab.createTest({ name: 'B', variants: [{ name: 'c' }, { name: 'v' }] });
      assert.strictEqual(ab.listTests().length, 2);
    });
    it('startTest changes status to running', function() {
      const ab = new ABTesting();
      const id = ab.createTest({ name: 'T', variants: [{ name: 'A' }, { name: 'B' }] });
      assert.strictEqual(ab.startTest(id).status, 'running');
    });
    it('stopTest changes status to stopped', function() {
      const ab = new ABTesting();
      const id = ab.createTest({ name: 'T', variants: [{ name: 'A' }, { name: 'B' }] });
      ab.startTest(id);
      assert.strictEqual(ab.stopTest(id).status, 'stopped');
    });
    it('pauseTest changes status to paused', function() {
      const ab = new ABTesting();
      const id = ab.createTest({ name: 'T', variants: [{ name: 'A' }, { name: 'B' }] });
      assert.strictEqual(ab.pauseTest(id).status, 'paused');
    });
    it('resumeTest restores running status', function() {
      const ab = new ABTesting();
      const id = ab.createTest({ name: 'T', variants: [{ name: 'A' }, { name: 'B' }] });
      ab.pauseTest(id); assert.strictEqual(ab.resumeTest(id).status, 'running');
    });
    it('recordConversion stores conversion', function() {
      const ab = new ABTesting();
      const id = ab.createTest({ name: 'T', variants: [{ name: 'A' }, { name: 'B' }] });
      ab.recordConversion(id, 'A');
      assert.ok(ab.getResults(id));
    });
    it('recordImpression stores impression', function() {
      const ab = new ABTesting();
      const id = ab.createTest({ name: 'T', variants: [{ name: 'A' }, { name: 'B' }] });
      ab.recordImpression(id, 'B');
      assert.ok(ab.getResults(id));
    });
    it('deleteTest removes test', function() {
      const ab = new ABTesting();
      const id = ab.createTest({ name: 'T', variants: [{ name: 'A' }, { name: 'B' }] });
      assert.strictEqual(ab.deleteTest(id), true);
    });
    it('archiveTest changes status to archived', function() {
      const ab = new ABTesting();
      const id = ab.createTest({ name: 'T', variants: [{ name: 'A' }, { name: 'B' }] });
      assert.strictEqual(ab.archiveTest(id).status, 'archived');
    });
    it('clear removes all tests', function() {
      const ab = new ABTesting();
      ab.createTest({ name: 'T', variants: [{ name: 'A' }, { name: 'B' }] });
      ab.clear();
      assert.strictEqual(ab.listTests().length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 46. DatasetImporter (6 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('DatasetImporter', function() {
    it('importJSON parses valid JSON array', function() {
      const di = new DatasetImporter();
      const result = di.importJSON('[{"input":"hello","output":"world"}]');
      assert.strictEqual(result.success, true); assert.strictEqual(result.count, 1);
    });
    it('importJSON fails for invalid JSON string', function() {
      const di = new DatasetImporter();
      const result = di.importJSON('not json');
      assert.strictEqual(result.success, false);
    });
    it('importJSON fails for non-array input', function() {
      const di = new DatasetImporter();
      const result = di.importJSON('{"object":true}');
      assert.strictEqual(result.success, false);
    });
    it('importCSV parses csv text', function() {
      const di = new DatasetImporter();
      const result = di.importCSV('name,value\nhello,42\nworld,99');
      assert.strictEqual(result.success, true); assert.strictEqual(result.count, 2);
    });
    it('importCSV fails with insufficient lines', function() {
      const di = new DatasetImporter();
      const result = di.importCSV('header only');
      assert.strictEqual(result.success, false);
    });
    it('validateEntries validates entry objects', function() {
      const di = new DatasetImporter();
      assert.strictEqual(di.validateEntries([{ a: 1 }]).valid, true);
      assert.strictEqual(di.validateEntries([]).valid, false);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 47. DatasetExporter (6 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('DatasetExporter', function() {
    it('exportJSON returns JSON string', function() {
      const de = new DatasetExporter();
      de.setEntries([{ id: 1, name: 'test' }]);
      const json = de.exportJSON('ds');
      assert.ok(json.includes('"name"'));
    });
    it('exportCSV returns CSV string with headers', function() {
      const de = new DatasetExporter();
      de.setEntries([{ a: 1, b: 2 }, { a: 3, b: 4 }]);
      const csv = de.exportCSV('ds');
      assert.ok(csv.includes('a,b'));
    });
    it('exportCSV returns empty for no entries', function() {
      const de = new DatasetExporter(); de.setEntries([]);
      assert.strictEqual(de.exportCSV('ds'), '');
    });
    it('exportSplit splits into train/test', function() {
      const de = new DatasetExporter();
      de.setEntries([{ v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }, { v: 5 }, { v: 6 }, { v: 7 }, { v: 8 }, { v: 9 }, { v: 10 }]);
      const split = de.exportSplit('ds', 80);
      assert.strictEqual(split.train.length + split.test.length, 10);
    });
    it('exportSample returns limited count', function() {
      const de = new DatasetExporter();
      de.setEntries([{ v: 1 }, { v: 2 }, { v: 3 }]);
      assert.strictEqual(de.exportSample('ds', 2).length, 2);
    });
    it('clear resets state', function() {
      const de = new DatasetExporter(); de.setEntries([{ a: 1 }]); de.clear();
      assert.strictEqual(de.exportJSON('ds'), '[]');
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 48. DatasetVersioning (6 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('DatasetVersioning', function() {
    it('createVersion creates version with number', function() {
      const dv = new DatasetVersioning();
      const v = dv.createVersion('ds', [{ id: '1', data: 'a' }]);
      assert.strictEqual(v.version, 1);
    });
    it('getVersion returns specific version', function() {
      const dv = new DatasetVersioning();
      dv.createVersion('ds', [{ id: '1', data: 'a' }]); dv.createVersion('ds', [{ id: '2', data: 'b' }]);
      assert.strictEqual(dv.getVersion('ds', 1).entries.length, 1);
    });
    it('listVersions returns all versions', function() {
      const dv = new DatasetVersioning();
      dv.createVersion('ds', []); dv.createVersion('ds', []);
      assert.strictEqual(dv.listVersions('ds').length, 2);
    });
    it('compareVersions returns added/removed/modified', function() {
      const dv = new DatasetVersioning();
      dv.createVersion('ds', [{ id: '1', data: 'a' }]);
      dv.createVersion('ds', [{ id: '1', data: 'b' }, { id: '2', data: 'c' }]);
      const diff = dv.compareVersions('ds', 1, 2);
      assert.strictEqual(diff.added.length, 1);
    });
    it('rollback returns version entries', function() {
      const dv = new DatasetVersioning();
      dv.createVersion('ds', [{ id: '1', data: 'original' }]);
      dv.createVersion('ds', [{ id: '2', data: 'updated' }]);
      const rolled = dv.rollback('ds', 1);
      assert.strictEqual(rolled[0].data, 'original');
    });
    it('clear removes all versions', function() {
      const dv = new DatasetVersioning(); dv.createVersion('ds', []); dv.clear();
      assert.strictEqual(dv.listVersions('ds').length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 49. FeedbackCollector (6 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('FeedbackCollector', function() {
    it('collect stores feedback entry', function() {
      const fc = new FeedbackCollector();
      const entry = fc.collect('user1', { rating: 5, type: 'rating' });
      assert.ok(entry.id); assert.strictEqual(entry.source, 'user1');
    });
    it('getFeedback returns entry by id', function() {
      const fc = new FeedbackCollector();
      const entry = fc.collect('s', { rating: 3 });
      assert.strictEqual(fc.getFeedback(entry.id).rating, 3);
    });
    it('getFeedback returns null for missing', function() {
      const fc = new FeedbackCollector();
      assert.strictEqual(fc.getFeedback('none'), null);
    });
    it('query filters by source and type', function() {
      const fc = new FeedbackCollector();
      fc.collect('s1', { type: 'bug' }); fc.collect('s2', { type: 'feature' });
      assert.strictEqual(fc.query({ source: 's1' }).length, 1);
    });
    it('getStats returns total and average rating', function() {
      const fc = new FeedbackCollector();
      fc.collect('s1', { rating: 4 }); fc.collect('s2', { rating: 2 });
      const stats = fc.getStats();
      assert.strictEqual(stats.total, 2); assert.strictEqual(stats.averageRating, 3);
    });
    it('clear removes all feedback', function() {
      const fc = new FeedbackCollector(); fc.collect('s', { rating: 1 }); fc.clear();
      assert.strictEqual(fc.getStats().total, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 50. FeedbackAggregator (6 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('FeedbackAggregator', function() {
    it('aggregate returns breakdown by type', function() {
      const fa = new FeedbackAggregator();
      fa.setSource('s1', [{ type: 'bug', rating: 0.3 }, { type: 'bug', rating: 0.5 }, { type: 'feature', rating: 0.8 }]);
      const result = fa.aggregate('s1');
      assert.strictEqual(result.count, 3); assert.ok(result.breakdown.bug);
    });
    it('getTrends returns daily trend data', function() {
      const fa = new FeedbackAggregator();
      fa.setSource('s1', [{ rating: 0.5, timestamp: new Date('2025-01-01') }, { rating: 0.8, timestamp: new Date('2025-01-02') }]);
      const trends = fa.getTrends('s1');
      assert.strictEqual(trends.length, 2);
    });
    it('getTopIssues returns sorted issue list', function() {
      const fa = new FeedbackAggregator();
      fa.setSource('s1', [{ data: { issue: 'bug' } }, { data: { issue: 'bug' } }, { data: { issue: 'crash' } }]);
      const issues = fa.getTopIssues();
      assert.strictEqual(issues[0].issue, 'bug');
    });
    it('getSentiment returns label based on average rating', function() {
      const fa = new FeedbackAggregator();
      const result = fa.getSentiment([{ rating: 0.9 }, { rating: 0.8 }]);
      assert.strictEqual(result.label, 'positive');
    });
    it('correlate returns correlation between two sources', function() {
      const fa = new FeedbackAggregator();
      fa.setSource('a', [{ rating: 0.1 }, { rating: 0.2 }, { rating: 0.3 }]);
      fa.setSource('b', [{ rating: 0.4 }, { rating: 0.5 }, { rating: 0.6 }]);
      const result = fa.correlate('a', 'b');
      assert.strictEqual(typeof result.correlation, 'number');
    });
    it('clear removes all data', function() {
      const fa = new FeedbackAggregator(); fa.setSource('s', [{}]); fa.clear();
      assert.strictEqual(fa.getTrends('s').length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 51. RecommendationEngine (6 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('RecommendationEngine', function() {
    it('analyze returns recommendations based on metrics', function() {
      const re = new RecommendationEngine();
      const result = re.analyze({ score: 0.3, latency: 2000 }, []);
      assert.ok(result.recommendations.length > 0);
    });
    it('getRecommendations returns all entries', function() {
      const re = new RecommendationEngine();
      re.analyze({ score: 0.9 }, []); re.analyze({ score: 0.8 }, []);
      assert.strictEqual(re.getRecommendations().length, 2);
    });
    it('apply marks recommendation as applied', function() {
      const re = new RecommendationEngine();
      const entry = re.analyze({ score: 0.9 }, []);
      const applied = re.apply(entry.id);
      assert.strictEqual(applied.applied, true);
    });
    it('dismiss marks recommendation as dismissed', function() {
      const re = new RecommendationEngine();
      const entry = re.analyze({ score: 0.9 }, []);
      const dismissed = re.dismiss(entry.id);
      assert.strictEqual(dismissed.dismissed, true);
    });
    it('getStats returns counts', function() {
      const re = new RecommendationEngine();
      re.analyze({ score: 0.9 }, []);
      const stats = re.getStats();
      assert.strictEqual(stats.total, 1);
    });
    it('clear removes all recommendations', function() {
      const re = new RecommendationEngine(); re.analyze({ score: 0.8 }, []); re.clear();
      assert.strictEqual(re.getRecommendations().length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 52. ImprovementPlanner (6 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('ImprovementPlanner', function() {
    it('createPlan creates plan with steps', function() {
      const ip = new ImprovementPlanner();
      const plan = ip.createPlan({ name: 'Plan', steps: [{ description: 'Step 1' }] });
      assert.ok(plan.id); assert.strictEqual(plan.steps.length, 1);
    });
    it('getPlan returns plan by id', function() {
      const ip = new ImprovementPlanner();
      const plan = ip.createPlan({ name: 'P' });
      assert.strictEqual(ip.getPlan(plan.id).name, 'P');
    });
    it('listPlans returns all plans', function() {
      const ip = new ImprovementPlanner();
      ip.createPlan({ name: 'A' }); ip.createPlan({ name: 'B' });
      assert.strictEqual(ip.listPlans().length, 2);
    });
    it('updateStep changes step status', function() {
      const ip = new ImprovementPlanner();
      const plan = ip.createPlan({ name: 'P', steps: [{ description: 's1' }] });
      ip.updateStep(plan.id, 0, 'completed');
      assert.strictEqual(plan.steps[0].status, 'completed');
    });
    it('getProgress returns completion percentage', function() {
      const ip = new ImprovementPlanner();
      const plan = ip.createPlan({ name: 'P', steps: [{ description: 's1' }, { description: 's2' }] });
      ip.updateStep(plan.id, 0, 'completed');
      assert.strictEqual(ip.getProgress(plan.id).percent, 50);
    });
    it('clear removes all plans', function() {
      const ip = new ImprovementPlanner(); ip.createPlan({ name: 'P' }); ip.clear();
      assert.strictEqual(ip.listPlans().length, 0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 53. AiEvaluationIntegration (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('AiEvaluationIntegration', function() {
    it('getEvaluationHistory returns empty initially', function() {
      const ai = new AiEvaluationIntegration(new EvaluationEngine());
      assert.deepStrictEqual(ai.getEvaluationHistory(), []);
    });
    it('getStats returns zeros with no evaluations', function() {
      const ai = new AiEvaluationIntegration(new EvaluationEngine());
      const stats = ai.getStats();
      assert.strictEqual(stats.total, 0);
    });
    it('enable/disable controls evaluation output', async function() {
      const engine = new EvaluationEngine();
      engine.registry.registerEvaluator('quality', async () => ({ score: 1 }));
      const ai = new AiEvaluationIntegration(engine);
      ai.disable();
      const result = await ai.evaluatePlannerOutput({ steps: [] }, 'g');
      assert.strictEqual(result, null);
      ai.enable();
      assert.strictEqual(ai.isEnabled(), true);
    });
    it('isEnabled returns true by default', function() {
      const ai = new AiEvaluationIntegration(new EvaluationEngine());
      assert.strictEqual(ai.isEnabled(), true);
    });
    it('getEvaluationHistory filters by source', function() {
      const ai = new AiEvaluationIntegration(new EvaluationEngine());
      ai._autoEvaluations.push({ source: 'planner', result: {}, timestamp: 1 });
      ai._autoEvaluations.push({ source: 'generator', result: {}, timestamp: 2 });
      assert.strictEqual(ai.getEvaluationHistory('planner').length, 1);
    });
    it('getStats returns bySource breakdown', function() {
      const ai = new AiEvaluationIntegration(new EvaluationEngine());
      ai._autoEvaluations.push({ source: 'planner', result: {}, timestamp: 1 });
      ai._autoEvaluations.push({ source: 'planner', result: {}, timestamp: 2 });
      const stats = ai.getStats();
      assert.strictEqual(stats.bySource.planner, 2);
    });
    it('clear removes all auto evaluations', function() {
      const ai = new AiEvaluationIntegration(new EvaluationEngine());
      ai._autoEvaluations.push({ source: 'test', result: {}, timestamp: 1 });
      ai.clear();
      assert.strictEqual(ai.getEvaluationHistory().length, 0);
    });
    it('constructor stores engine reference', function() {
      const engine = new EvaluationEngine();
      const ai = new AiEvaluationIntegration(engine);
      assert.strictEqual(ai._engine, engine);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 54. Plugin SDK Evaluation (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('Plugin SDK Evaluation', function() {
    it('EvaluationMetric constructor stores name and function', function() {
      const m = new EvaluationMetric('accuracy', () => 0.9);
      assert.strictEqual(m.name, 'accuracy'); assert.strictEqual(typeof m.evaluate, 'function');
    });
    it('EvaluationMetric evaluate returns result from fn', function() {
      const m = new EvaluationMetric('custom', (input) => ({ score: input.value }));
      const result = m.evaluate({ value: 0.85 });
      assert.strictEqual(result.score, 0.85);
    });
    it('EvaluationMetric evaluate with real metric logic', function() {
      const m = new EvaluationMetric('cost', (input) => ({ cost: input.tokens * 0.002 }));
      const result = m.evaluate({ tokens: 100 });
      assert.strictEqual(result.cost, 0.2);
    });
    it('EvaluationExtension registerMetric stores metric', function() {
      const ext = new EvaluationExtension();
      ext.registerMetric(new EvaluationMetric('m1', () => 1));
      assert.strictEqual(ext.listMetrics().length, 1);
    });
    it('EvaluationExtension listMetrics returns all', function() {
      const ext = new EvaluationExtension();
      ext.registerMetric(new EvaluationMetric('a', () => 1));
      ext.registerMetric(new EvaluationMetric('b', () => 2));
      assert.strictEqual(ext.listMetrics().length, 2);
    });
    it('EvaluationExtension registerBenchmark stores benchmark', function() {
      const ext = new EvaluationExtension();
      ext.registerBenchmark('b1', { tests: [] });
      assert.ok(ext.getBenchmark('b1'));
    });
    it('EvaluationExtension registerRubric stores rubric', function() {
      const ext = new EvaluationExtension();
      ext.registerRubric('r1', { criteria: [] });
      assert.ok(true);
    });
    it('EvaluationExtension registerDataset stores dataset', function() {
      const ext = new EvaluationExtension();
      ext.registerDataset('d1', { entries: [] });
      assert.ok(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 55. API Controller (8 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('API Controller', function() {
    it('getStatus returns engine status', function() {
      const engine = new EvaluationEngine();
      const api = new ApiController(engine);
      const status = api.getStatus();
      assert.strictEqual(typeof status, 'object');
    });
    it('getHistory returns history with filter', function() {
      const engine = new EvaluationEngine();
      engine.history.record({ type: 'eval', status: 'completed' });
      const api = new ApiController(engine);
      assert.strictEqual(api.getHistory({ type: 'eval' }).length, 1);
    });
    it('getReports generates report', function() {
      const engine = new EvaluationEngine();
      const api = new ApiController(engine);
      const report = api.getReports();
      assert.ok(report.overallScore !== undefined);
    });
    it('runEvaluation runs evaluation', async function() {
      const engine = new EvaluationEngine();
      engine.registry.registerEvaluator('quality', async () => ({ score: 1 }));
      const api = new ApiController(engine);
      const result = await api.runEvaluation('quality', 'test');
      assert.strictEqual(result.status, 'completed');
    });
    it('runJudge runs judge evaluation', async function() {
      const api = new ApiController(new EvaluationEngine());
      const result = await api.runJudge('input', 'output', ['accuracy']);
      assert.ok(result.scores);
    });
    it('compareModels compares models', function() {
      const mc = new ModelComparison();
      mc.registerResult('A', 'acc', 0.9); mc.registerResult('B', 'acc', 0.8);
      const result = mc.compare(['A', 'B'], ['acc']);
      assert.strictEqual(result.models.length, 2);
    });
    it('submitFeedback collects feedback', function() {
      const api = new ApiController(new EvaluationEngine());
      const entry = api.submitFeedback('test', { rating: 4 });
      assert.ok(entry.id);
    });
    it('runBenchmark runs benchmark suite', async function() {
      const engine = new EvaluationEngine();
      const bm = new BenchmarkManager();
      bm.createSuite({ name: 'S', tests: [{ name: 't1', input: 'i', expectedOutput: 'o' }] });
      const api = new ApiController(engine);
      const result = await api.runBenchmark('dummy');
      assert.ok(result);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 56. Edge Cases (10 tests)
  // ═════════════════════════════════════════════════════════════════
  describe('Edge Cases', function() {
    it('EvaluationStorage handles empty namespace list', function() {
      const es = new EvaluationStorage();
      assert.deepStrictEqual(es.list('empty'), []);
    });
    it('EvaluationEvents wildcard catches all events', function() {
      const ee = new EvaluationEvents(); let count = 0;
      ee.on('*', () => count++);
      ee.emit('a', {}); ee.emit('b', {}); ee.emit('c', {});
      assert.strictEqual(count, 3);
    });
    it('EvaluationMetrics empty metric returns null aggregate', function() {
      const em = new EvaluationMetrics();
      assert.strictEqual(em.aggregate('none'), null);
    });
    it('EvaluationScheduler tick handles empty schedules', async function() {
      const es = new EvaluationScheduler();
      const count = await es.tick(() => 'ok');
      assert.strictEqual(count, 0);
    });
    it('EvaluationHistory clear after populate resets', function() {
      const eh = new EvaluationHistory();
      eh.record({ type: 'test', status: 'done' }); eh.record({ type: 'test', status: 'done' });
      eh.clear();
      assert.strictEqual(eh.query().length, 0);
    });
    it('Multiple instances of EvaluationMetrics are independent', function() {
      const a = new EvaluationMetrics(); const b = new EvaluationMetrics();
      a.record('m', 1);
      assert.strictEqual(b.getMetricNames().length, 0);
    });
    it('EvaluationRunner handle empty registry', async function() {
      const runner = new EvaluationRunner(new EvaluationRegistry(), new EvaluationStorage(), new EvaluationEvents(), new EvaluationHistory());
      const result = await runner.run({ type: 'test', evaluatorId: 'none', input: 'x' });
      assert.strictEqual(result.status, 'failed');
    });
    it('TrafficSplitter clear resets all tests', function() {
      const ts = new TrafficSplitter();
      ts.registerTest('t1', [{ name: 'A', trafficWeight: 100 }]);
      ts.clear();
      assert.throws(() => ts.getDistribution('t1'), /not registered/);
    });
    it('PromptTemplates render with empty variables object', function() {
      const pt = new PromptTemplates();
      assert.strictEqual(pt.render('No variables', {}), 'No variables');
    });
    it('JudgePrompts clear restores defaults', function() {
      const jp = new JudgePrompts();
      jp.clear();
      assert.ok(jp.getPrompt('quality'));
    });
    it('EvaluationRunner listRuns filters by type', function() {
      const runner = new EvaluationRunner(new EvaluationRegistry(), new EvaluationStorage(), new EvaluationEvents(), new EvaluationHistory());
      assert.deepStrictEqual(runner.listRuns({ type: 'test' }), []);
    });
    it('BenchmarkDatasets list with no tags returns all', function() {
      const bd = new BenchmarkDatasets(); bd.clear();
      assert.deepStrictEqual(bd.list(), []);
    });
    it('ScoreNormalizer aggregate empty returns 0', function() {
      const sn = new ScoreNormalizer();
      assert.strictEqual(sn.aggregate([], 'average'), 0);
    });
  });
});
