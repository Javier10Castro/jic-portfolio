let _results = new Map();

function _generateRunId() {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

class BenchmarkRunner {
  constructor(manager) {
    this._manager = manager;
  }

  runTest(suiteId, testName, evaluatorFn) {
    const suite = this._manager.getSuite(suiteId);
    if (!suite) throw new Error(`Suite not found: ${suiteId}`);
    const test = suite.tests.find(t => t.name === testName);
    if (!test) throw new Error(`Test not found: ${testName}`);

    const start = Date.now();
    const result = evaluatorFn(test.input, test.expectedOutput);
    const latency = Date.now() - start;

    const entry = {
      runId: _generateRunId(),
      suiteId,
      testName,
      score: result.score,
      passed: result.passed,
      output: result.output,
      latency,
      cost: result.cost || 0,
      timestamp: new Date().toISOString(),
    };

    if (!_results.has(suiteId)) _results.set(suiteId, []);
    _results.get(suiteId).push(entry);
    return entry;
  }

  runSuite(suiteId, evaluatorFn) {
    const suite = this._manager.getSuite(suiteId);
    if (!suite) throw new Error(`Suite not found: ${suiteId}`);

    const results = suite.tests.map(test => this.runTest(suiteId, test.name, evaluatorFn));

    const overallScore = results.reduce((sum, r) => sum + r.score, 0) / (results.length || 1);
    const totalLatency = results.reduce((sum, r) => sum + r.latency, 0);
    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    return { suiteId, results, overallScore, totalLatency, totalCost, passed, failed };
  }

  runSuites(suiteIds, evaluatorFn) {
    return suiteIds.map(id => this.runSuite(id, evaluatorFn));
  }

  getResult(suiteId, runId) {
    const suiteResults = _results.get(suiteId);
    if (!suiteResults) return null;
    return suiteResults.find(r => r.runId === runId) || null;
  }

  getSuiteResults(suiteId) {
    return _results.get(suiteId) || [];
  }

  clear() {
    _results.clear();
  }
}

module.exports = { BenchmarkRunner };
