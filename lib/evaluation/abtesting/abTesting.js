const { TrafficSplitter } = require('./trafficSplitter');
const { ResultAggregator } = require('./resultAggregator');
const { WinnerSelector } = require('./winnerSelector');

class ABTesting {
  constructor() {
    this._tests = new Map();
    this._splitter = new TrafficSplitter();
    this._aggregator = new ResultAggregator();
    this._selector = new WinnerSelector();
  }

  createTest(config) {
    if (!config || !config.name || !Array.isArray(config.variants) || config.variants.length < 2) {
      throw new Error('Test must have a name and at least 2 variants');
    }
    const id = `abtest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const test = {
      id,
      name: config.name,
      description: config.description || '',
      variants: config.variants.map((v, i) => ({ name: v.name, config: v.config || {}, trafficWeight: v.trafficWeight || Math.floor(100 / config.variants.length) })),
      trafficPercent: config.trafficPercent != null ? config.trafficPercent : 100,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this._tests.set(id, test);
    this._splitter.registerTest(id, test.variants);
    return id;
  }

  getTest(id) {
    const test = this._tests.get(id);
    return test ? { ...test } : null;
  }

  listTests(filter = {}) {
    const tests = [...this._tests.values()];
    if (filter.status) return tests.filter(t => t.status === filter.status);
    return tests.map(t => ({ ...t }));
  }

  startTest(id) {
    return this._setStatus(id, 'running');
  }

  stopTest(id) {
    return this._setStatus(id, 'stopped');
  }

  pauseTest(id) {
    return this._setStatus(id, 'paused');
  }

  resumeTest(id) {
    return this._setStatus(id, 'running');
  }

  archiveTest(id) {
    return this._setStatus(id, 'archived');
  }

  _setStatus(id, status) {
    const test = this._tests.get(id);
    if (!test) throw new Error(`Test ${id} not found`);
    test.status = status;
    test.updatedAt = new Date();
    return { ...test };
  }

  deleteTest(id) {
    return this._tests.delete(id);
  }

  recordConversion(testId, variantName, value = 1) {
    this._aggregator.recordResult(testId, variantName, 'conversion', value);
  }

  recordImpression(testId, variantName) {
    this._aggregator.recordResult(testId, variantName, 'impression', 1);
  }

  getResults(testId) {
    return this._aggregator.getResults(testId);
  }

  clear() {
    this._tests.clear();
    this._splitter.clear();
    this._aggregator.clear();
    this._selector.clear();
  }
}

module.exports = { ABTesting };
