class EvaluationExtension {
  constructor(plugin) {
    this._plugin = plugin;
    this._metrics = new Map();
    this._benchmarks = new Map();
    this._rubrics = new Map();
    this._datasets = new Map();
    this._templates = new Map();
  }

  registerMetric(name, metric) {
    if (this._metrics.has(name)) throw new Error(`Metric already registered: ${name}`);
    this._metrics.set(name, metric);
    return this;
  }

  getMetric(name) {
    return this._metrics.get(name) || null;
  }

  listMetrics() {
    return Array.from(this._metrics.keys());
  }

  registerBenchmark(name, benchmark) {
    if (this._benchmarks.has(name)) throw new Error(`Benchmark already registered: ${name}`);
    this._benchmarks.set(name, benchmark);
    return this;
  }

  getBenchmark(name) {
    return this._benchmarks.get(name) || null;
  }

  listBenchmarks() {
    return Array.from(this._benchmarks.keys());
  }

  registerRubric(name, rubric) {
    if (this._rubrics.has(name)) throw new Error(`Rubric already registered: ${name}`);
    this._rubrics.set(name, rubric);
    return this;
  }

  getRubric(name) {
    return this._rubrics.get(name) || null;
  }

  listRubrics() {
    return Array.from(this._rubrics.keys());
  }

  registerDataset(name, dataset) {
    if (this._datasets.has(name)) throw new Error(`Dataset already registered: ${name}`);
    this._datasets.set(name, dataset);
    return this;
  }

  getDataset(name) {
    return this._datasets.get(name) || null;
  }

  listDatasets() {
    return Array.from(this._datasets.keys());
  }

  registerTemplate(name, template) {
    if (this._templates.has(name)) throw new Error(`Template already registered: ${name}`);
    this._templates.set(name, template);
    return this;
  }

  getTemplate(name) {
    return this._templates.get(name) || null;
  }

  listTemplates() {
    return Array.from(this._templates.keys());
  }

  evaluate(name, input, output, expected) {
    const metric = this._metrics.get(name);
    if (!metric) throw new Error(`Unknown metric: ${name}`);
    return metric.evaluate(input, output, expected);
  }

  runBenchmark(name, inputs) {
    const benchmark = this._benchmarks.get(name);
    if (!benchmark) throw new Error(`Unknown benchmark: ${name}`);
    return inputs.map(input => {
      const output = benchmark.run ? benchmark.run(input) : null;
      return { input, output };
    });
  }

  clear() {
    this._metrics.clear();
    this._benchmarks.clear();
    this._rubrics.clear();
    this._datasets.clear();
    this._templates.clear();
  }
}

function createEvaluationExtension(plugin) {
  return new EvaluationExtension(plugin);
}

module.exports = { EvaluationExtension, createEvaluationExtension };
