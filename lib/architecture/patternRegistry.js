class PatternRegistry {
  constructor() {
    this._patterns = new Map();
    this._counter = 0;
  }

  register(pattern) {
    if (!pattern || !pattern.name) {
      throw new Error('pattern must have a name');
    }
    const id = pattern.id || `pattern-${++this._counter}`;
    this._patterns.set(id, { id, ...pattern, registeredAt: new Date().toISOString() });
    return this._patterns.get(id);
  }

  get(id) {
    if (!id) return null;
    return this._patterns.get(id) || null;
  }

  list() {
    return Array.from(this._patterns.values());
  }

  clear() {
    this._patterns.clear();
    this._counter = 0;
  }
}

module.exports = { PatternRegistry };
