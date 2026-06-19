class IntelligenceStore {
  constructor(options = {}) {
    this._store = {
      patterns: [],
      anomalies: [],
      insights: [],
      correlationGraphs: [],
      scores: [],
    };
    this._maxPerType = options.maxPerType || 500;
  }

  push(collection, item) {
    if (!this._store[collection]) return false;
    this._store[collection].push(item);
    if (this._store[collection].length > this._maxPerType) this._store[collection].shift();
    return true;
  }

  get(collection, filter = {}) {
    if (!this._store[collection]) return [];
    let results = this._store[collection];
    if (filter.severity) results = results.filter(r => r.severity === filter.severity);
    if (filter.priority) results = results.filter(r => r.priority === filter.priority);
    if (filter.type && collection !== 'insights') results = results.filter(r =>
      (r.type === filter.type) || (r.pattern === filter.type));
    if (filter.since) results = results.filter(r => r.timestamp >= filter.since);
    if (filter.limit) results = results.slice(-filter.limit);
    return results;
  }

  getAll() {
    return {
      patternCount: this._store.patterns.length,
      anomalyCount: this._store.anomalies.length,
      insightCount: this._store.insights.length,
      graphEdges: this._store.correlationGraphs.length,
      scoreCount: this._store.scores.length,
    };
  }

  clear(collection) {
    if (collection) {
      if (this._store[collection]) this._store[collection] = [];
    } else {
      for (const key of Object.keys(this._store)) this._store[key] = [];
    }
  }

  toJSON() {
    return {
      store: this._store,
      maxPerType: this._maxPerType,
      exportedAt: Date.now(),
    };
  }

  static fromJSON(json) {
    const store = new IntelligenceStore({ maxPerType: json.maxPerType });
    for (const key of Object.keys(json.store || {})) {
      if (store._store[key]) store._store[key] = json.store[key];
    }
    return store;
  }
}

module.exports = IntelligenceStore;
