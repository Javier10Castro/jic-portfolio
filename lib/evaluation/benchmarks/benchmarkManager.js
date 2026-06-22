let _suites = new Map();

function _generateId() {
  return `suite_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

class BenchmarkManager {
  createSuite(config) {
    const id = _generateId();
    const suite = {
      id,
      name: config.name,
      description: config.description || '',
      category: config.category || 'general',
      tests: config.tests || [],
      tags: config.tags || [],
      config: config.config || {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    _suites.set(id, suite);
    return suite;
  }

  getSuite(id) {
    return _suites.get(id) || null;
  }

  updateSuite(id, updates) {
    const suite = _suites.get(id);
    if (!suite) throw new Error(`Suite not found: ${id}`);
    Object.assign(suite, updates, { id: suite.id, createdAt: suite.createdAt, updatedAt: Date.now() });
    return suite;
  }

  listSuites(filter = {}) {
    let results = Array.from(_suites.values());
    if (filter.category) results = results.filter(s => s.category === filter.category);
    if (filter.tags && filter.tags.length) results = results.filter(s => filter.tags.some(t => s.tags.includes(t)));
    return results;
  }

  deleteSuite(id) {
    return _suites.delete(id);
  }

  addTestToSuite(suiteId, test) {
    const suite = _suites.get(suiteId);
    if (!suite) throw new Error(`Suite not found: ${suiteId}`);
    const entry = {
      name: test.name,
      input: test.input,
      expectedOutput: test.expectedOutput,
      scoringMetric: test.scoringMetric || 'accuracy',
      weight: test.weight || 1,
    };
    suite.tests.push(entry);
    suite.updatedAt = Date.now();
    return entry;
  }

  removeTestFromSuite(suiteId, testName) {
    const suite = _suites.get(suiteId);
    if (!suite) throw new Error(`Suite not found: ${suiteId}`);
    const idx = suite.tests.findIndex(t => t.name === testName);
    if (idx === -1) throw new Error(`Test not found: ${testName}`);
    suite.tests.splice(idx, 1);
    suite.updatedAt = Date.now();
    return true;
  }

  getTests(suiteId) {
    const suite = _suites.get(suiteId);
    if (!suite) throw new Error(`Suite not found: ${suiteId}`);
    return [...suite.tests];
  }

  clear() {
    _suites.clear();
  }
}

module.exports = { BenchmarkManager };
