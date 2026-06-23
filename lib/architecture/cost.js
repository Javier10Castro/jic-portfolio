class Cost {
  constructor() {
    this._estimates = new Map();
    this._counter = 0;
  }

  estimate(architectureId, costs) {
    if (!architectureId || !costs) {
      throw new Error('architectureId and costs are required');
    }
    const id = `cost-${++this._counter}`;
    const entry = { id, architectureId, costs, estimatedAt: new Date().toISOString() };
    this._estimates.set(id, entry);
    return entry;
  }

  get(id) {
    if (!id) return null;
    return this._estimates.get(id) || null;
  }

  list() {
    return Array.from(this._estimates.values());
  }

  clear() {
    this._estimates.clear();
    this._counter = 0;
  }
}

module.exports = { Cost };
