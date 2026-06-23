class CaseRegistry {
  constructor() {
    this._cases = new Map();
    this._counter = 0;
  }

  store(name, problem, solution, outcome) {
    if (!name) throw new Error('name is required');
    if (!problem) throw new Error('problem is required');
    if (!solution) throw new Error('solution is required');
    const id = 'case_' + (++this._counter);
    const entry = {
      id,
      name,
      problem,
      solution,
      outcome: outcome || {},
      storedAt: new Date().toISOString()
    };
    this._cases.set(id, entry);
    return entry;
  }

  get(id) {
    if (!id) return null;
    return this._cases.get(id) || null;
  }

  findByName(name) {
    if (!name) return [];
    return Array.from(this._cases.values()).filter(c => c.name === name);
  }

  list() {
    return Array.from(this._cases.values());
  }

  count() {
    return this._cases.size;
  }

  remove(id) {
    if (!id) return false;
    return this._cases.delete(id);
  }

  clear() {
    this._cases.clear();
    this._counter = 0;
  }
}

module.exports = { CaseRegistry };
