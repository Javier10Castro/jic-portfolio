let _results = new Map();
let _resultIdCounter = 0;

function _generateResultId() {
  return `result_${Date.now()}_${++_resultIdCounter}`;
}

class BenchmarkResults {
  saveResult(result) {
    const id = _generateResultId();
    const entry = { id, ...result, savedAt: new Date().toISOString() };
    _results.set(id, entry);
    return entry;
  }

  getResult(id) {
    return _results.get(id) || null;
  }

  query(filter = {}) {
    let entries = Array.from(_results.values());
    if (filter.suiteId) entries = entries.filter(r => r.suiteId === filter.suiteId);
    if (filter.status) entries = entries.filter(r => r.status === filter.status);
    if (filter.since) entries = entries.filter(r => new Date(r.timestamp) >= new Date(filter.since));
    if (filter.until) entries = entries.filter(r => new Date(r.timestamp) <= new Date(filter.until));
    return entries;
  }

  getHistory(suiteId) {
    return Array.from(_results.values())
      .filter(r => r.suiteId === suiteId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  getTrend(suiteId, metric = 'score') {
    const results = this.getHistory(suiteId);
    if (results.length < 3) return 'stable';

    const recent = results.slice(-5);
    const values = recent.map(r => r.score);
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid).reduce((s, v) => s + v, 0) / mid;
    const secondHalf = values.slice(mid).reduce((s, v) => s + v, 0) / (values.length - mid);
    const diff = secondHalf - firstHalf;
    const threshold = 0.02;

    if (diff > threshold) return 'improving';
    if (diff < -threshold) return 'declining';
    return 'stable';
  }

  compareSuites(suiteIdA, suiteIdB) {
    const resultsA = this.getHistory(suiteIdA);
    const resultsB = this.getHistory(suiteIdB);

    const avgA = resultsA.length ? resultsA.reduce((s, r) => s + r.score, 0) / resultsA.length : 0;
    const avgB = resultsB.length ? resultsB.reduce((s, r) => s + r.score, 0) / resultsB.length : 0;

    return {
      suiteA: { suiteId: suiteIdA, averageScore: avgA, totalRuns: resultsA.length },
      suiteB: { suiteId: suiteIdB, averageScore: avgB, totalRuns: resultsB.length },
      difference: avgA - avgB,
    };
  }

  exportCSV(suiteId) {
    const results = this.getHistory(suiteId);
    const headers = ['id', 'suiteId', 'testName', 'score', 'passed', 'latency', 'cost', 'timestamp', 'savedAt'];
    const rows = results.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  clear() {
    _results.clear();
  }
}

module.exports = { BenchmarkResults };
