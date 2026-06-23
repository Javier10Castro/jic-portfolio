class Rationale {
  constructor() {
    this._entries = new Map();
    this._counter = 0;
  }

  add(decisionId, text) {
    if (!decisionId || !text) {
      throw new Error('decisionId and text are required');
    }
    const id = `rat-${++this._counter}`;
    const entry = { id, decisionId, text, addedAt: new Date().toISOString() };
    this._entries.set(id, entry);
    return entry;
  }

  get(id) {
    if (!id) return null;
    return this._entries.get(id) || null;
  }

  list() {
    return Array.from(this._entries.values());
  }

  clear() {
    this._entries.clear();
    this._counter = 0;
  }
}

module.exports = { Rationale };
