const EVALUATION_TYPES = {
  QUALITY: 'quality',
  BENCHMARK: 'benchmark',
  EXPERIMENT: 'experiment',
  A_B_TEST: 'ab_test',
  MODEL_COMPARISON: 'model_comparison',
  AGENT_EVAL: 'agent_eval',
  JUDGE: 'judge',
  FEEDBACK: 'feedback',
};

const METRIC_TYPES = {
  ACCURACY: 'accuracy',
  LATENCY: 'latency',
  COST: 'cost',
  QUALITY: 'quality',
  CONSISTENCY: 'consistency',
  HALLUCINATION: 'hallucination',
  RELEVANCE: 'relevance',
  COHERENCE: 'coherence',
  HELPFULNESS: 'helpfulness',
  SAFETY: 'safety',
};

class EvaluationRegistry {
  constructor() {
    this._evaluators = new Map();
    this._metrics = new Map();
    this._benchmarks = new Map();
    this._rubrics = new Map();
    this._datasets = new Map();
  }

  registerEvaluator(type, evaluatorFn) {
    if (!Object.values(EVALUATION_TYPES).includes(type)) {
      throw new Error(`Unknown evaluation type: ${type}`);
    }
    const id = `${type}_${Date.now()}`;
    this._evaluators.set(id, { type, fn: evaluatorFn, registeredAt: Date.now() });
    return id;
  }

  unregisterEvaluator(id) {
    return this._evaluators.delete(id);
  }

  getEvaluator(id) {
    return this._evaluators.get(id) || null;
  }

  listEvaluators(type) {
    const all = Array.from(this._evaluators.entries()).map(([id, e]) => ({ id, ...e }));
    if (type) return all.filter(e => e.type === type);
    return all;
  }

  registerMetric(name, definition) {
    if (this._metrics.has(name)) throw new Error(`Metric already registered: ${name}`);
    this._metrics.set(name, { name, ...definition, registeredAt: Date.now() });
  }

  getMetric(name) {
    return this._metrics.get(name) || null;
  }

  listMetrics() {
    return Array.from(this._metrics.values());
  }

  registerBenchmark(name, suite) {
    this._benchmarks.set(name, { name, ...suite, registeredAt: Date.now() });
  }

  getBenchmark(name) {
    return this._benchmarks.get(name) || null;
  }

  listBenchmarks() {
    return Array.from(this._benchmarks.values());
  }

  registerRubric(name, rubric) {
    this._rubrics.set(name, { name, ...rubric, registeredAt: Date.now() });
  }

  getRubric(name) {
    return this._rubrics.get(name) || null;
  }

  listRubrics() {
    return Array.from(this._rubrics.values());
  }

  registerDataset(name, dataset) {
    this._datasets.set(name, { name, ...dataset, registeredAt: Date.now() });
  }

  getDataset(name) {
    return this._datasets.get(name) || null;
  }

  listDatasets() {
    return Array.from(this._datasets.values());
  }

  clear() {
    this._evaluators.clear();
    this._metrics.clear();
    this._benchmarks.clear();
    this._rubrics.clear();
    this._datasets.clear();
  }
}

module.exports = { EvaluationRegistry, EVALUATION_TYPES, METRIC_TYPES };
