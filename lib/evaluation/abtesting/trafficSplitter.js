const crypto = require('crypto');

class TrafficSplitter {
  constructor() {
    this._tests = new Map();
  }

  registerTest(testId, variants) {
    const totalWeight = variants.reduce((s, v) => s + (v.trafficWeight || 1), 0);
    const normalized = variants.map(v => ({
      name: v.name,
      weight: totalWeight > 0 ? ((v.trafficWeight || 1) / totalWeight) * 100 : 0,
    }));
    this._tests.set(testId, {
      variants: normalized,
      assignments: new Map(),
    });
  }

  getVariant(testId, seed) {
    const test = this._tests.get(testId);
    if (!test) throw new Error(`Test ${testId} not registered`);

    const hash = crypto.createHash('md5').update(String(seed)).digest('hex');
    const hashInt = parseInt(hash.slice(0, 8), 16);
    const bucket = hashInt % 100;

    let cumulative = 0;
    for (const v of test.variants) {
      cumulative += v.weight;
      if (bucket < cumulative) {
        test.assignments.set(seed, v.name);
        return v.name;
      }
    }
    const last = test.variants[test.variants.length - 1];
    test.assignments.set(seed, last.name);
    return last.name;
  }

  getDistribution(testId) {
    const test = this._tests.get(testId);
    if (!test) throw new Error(`Test ${testId} not registered`);
    const dist = {};
    for (const v of test.variants) {
      dist[v.name] = v.weight;
    }
    return dist;
  }

  setDistribution(testId, weights) {
    const test = this._tests.get(testId);
    if (!test) throw new Error(`Test ${testId} not registered`);
    this.validateDistribution(weights);
    for (const v of test.variants) {
      if (weights[v.name] != null) v.weight = weights[v.name];
    }
  }

  validateDistribution(weights) {
    const values = Object.values(weights);
    const total = values.reduce((s, v) => s + v, 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new Error(`Traffic weights must sum to 100, got ${total}`);
    }
    return true;
  }

  getAssignedUsers(testId) {
    const test = this._tests.get(testId);
    if (!test) throw new Error(`Test ${testId} not registered`);
    const counts = {};
    for (const name of test.assignments.values()) {
      counts[name] = (counts[name] || 0) + 1;
    }
    return counts;
  }

  clear() {
    this._tests.clear();
  }
}

module.exports = { TrafficSplitter };
