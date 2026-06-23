class PatternSelector {
  constructor() {
    this._selections = new Map();
    this._counter = 0;
  }

  select(architectureId, patterns) {
    if (!architectureId || !patterns) {
      throw new Error('architectureId and patterns are required');
    }
    const id = `selection-${++this._counter}`;
    const selection = { id, architectureId, patterns, selectedAt: new Date().toISOString() };
    this._selections.set(id, selection);
    return selection;
  }

  get(id) {
    if (!id) return null;
    return this._selections.get(id) || null;
  }

  list() {
    return Array.from(this._selections.values());
  }

  clear() {
    this._selections.clear();
    this._counter = 0;
  }
}

module.exports = { PatternSelector };
