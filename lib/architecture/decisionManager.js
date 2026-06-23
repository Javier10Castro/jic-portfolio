class DecisionManager {
  constructor() {
    this._decisions = new Map();
    this._counter = 0;
  }

  make(architectureId, decision) {
    if (!architectureId || !decision) {
      throw new Error('architectureId and decision are required');
    }
    const id = `decision-${++this._counter}`;
    const entry = { id, architectureId, ...decision, madeAt: new Date().toISOString() };
    this._decisions.set(id, entry);
    return entry;
  }

  get(id) {
    if (!id) return null;
    return this._decisions.get(id) || null;
  }

  list() {
    return Array.from(this._decisions.values());
  }

  reject(id, reason) {
    const decision = this._decisions.get(id);
    if (!decision) return null;
    decision.status = 'rejected';
    decision.reason = reason || '';
    decision.rejectedAt = new Date().toISOString();
    return decision;
  }

  clear() {
    this._decisions.clear();
    this._counter = 0;
  }
}

module.exports = { DecisionManager };
