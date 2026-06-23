class DecisionLog {
  constructor() {
    this._logs = new Map();
    this._counter = 0;
  }

  log(decisionId, entry) {
    if (!decisionId || !entry) {
      throw new Error('decisionId and entry are required');
    }
    const id = `log-${++this._counter}`;
    const logEntry = { id, decisionId, ...entry, timestamp: new Date().toISOString() };
    this._logs.set(id, logEntry);
    return logEntry;
  }

  get(id) {
    if (!id) return null;
    return this._logs.get(id) || null;
  }

  list() {
    return Array.from(this._logs.values());
  }

  clear() {
    this._logs.clear();
    this._counter = 0;
  }
}

module.exports = { DecisionLog };
