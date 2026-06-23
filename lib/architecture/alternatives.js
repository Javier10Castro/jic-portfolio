class Alternatives {
  constructor() {
    this._alternatives = new Map();
    this._counter = 0;
  }

  add(decisionId, alternative) {
    if (!decisionId || !alternative) {
      throw new Error('decisionId and alternative are required');
    }
    const id = `alt-${++this._counter}`;
    const entry = { id, decisionId, ...alternative, addedAt: new Date().toISOString() };
    this._alternatives.set(id, entry);
    return entry;
  }

  get(id) {
    if (!id) return null;
    return this._alternatives.get(id) || null;
  }

  list() {
    return Array.from(this._alternatives.values());
  }

  clear() {
    this._alternatives.clear();
    this._counter = 0;
  }
}

module.exports = { Alternatives };
