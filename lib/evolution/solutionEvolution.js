class SolutionEvolution {
  constructor() {
    this._evolutions = new Map();
    this._counter = 0;
  }

  create(solutionId, plan) {
    if (!solutionId) throw new Error('solutionId is required');
    if (!plan) throw new Error('plan is required');
    const id = 'ev_' + (++this._counter);
    const entry = {
      id,
      solutionId,
      plan: JSON.parse(JSON.stringify(plan)),
      status: 'proposed',
      stages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this._evolutions.set(id, entry);
    return entry;
  }

  get(id) {
    if (!id) return null;
    return this._evolutions.get(id) || null;
  }

  list(solutionId) {
    if (!solutionId) return Array.from(this._evolutions.values());
    return Array.from(this._evolutions.values()).filter(e => e.solutionId === solutionId);
  }

  update(id, changes) {
    if (!id || !changes) return null;
    const entry = this._evolutions.get(id);
    if (!entry) return null;
    const allowed = ['plan', 'status', 'stages'];
    for (const key of Object.keys(changes)) {
      if (allowed.includes(key)) {
        entry[key] = JSON.parse(JSON.stringify(changes[key]));
      }
    }
    entry.updatedAt = new Date().toISOString();
    return entry;
  }

  remove(id) {
    if (!id) return false;
    return this._evolutions.delete(id);
  }

  clear() {
    this._evolutions.clear();
    this._counter = 0;
  }
}

module.exports = { SolutionEvolution };
