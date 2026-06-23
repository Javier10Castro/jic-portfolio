class Operability {
  constructor() {
    this._configs = new Map();
    this._counter = 0;
  }

  configure(architectureId, config) {
    if (!architectureId || !config) {
      throw new Error('architectureId and config are required');
    }
    const id = `oper-${++this._counter}`;
    const entry = { id, architectureId, ...config, configuredAt: new Date().toISOString() };
    this._configs.set(id, entry);
    return entry;
  }

  get(id) {
    if (!id) return null;
    return this._configs.get(id) || null;
  }

  list() {
    return Array.from(this._configs.values());
  }

  clear() {
    this._configs.clear();
    this._counter = 0;
  }
}

module.exports = { Operability };
