class ConfigurationSources {
  constructor() {
    this._sources = new Map();
  }

  addSource(name, source) {
    if (!name || !source) {
      throw new Error('name and source are required');
    }
    if (!source.fetcher || typeof source.fetcher !== 'function') {
      throw new Error('source must have a fetcher function');
    }
    this._sources.set(name, {
      name,
      priority: source.priority || 0,
      fetcher: source.fetcher
    });
  }

  getSource(name) {
    if (!name) return null;
    const src = this._sources.get(name);
    if (!src) return null;
    return { name: src.name, priority: src.priority, fetcher: src.fetcher };
  }

  removeSource(name) {
    if (!name) return false;
    return this._sources.delete(name);
  }

  listSources() {
    return Array.from(this._sources.values())
      .sort((a, b) => a.priority - b.priority)
      .map(s => ({ name: s.name, priority: s.priority }));
  }

  fetchFromSource(name) {
    if (!name) return null;
    const src = this._sources.get(name);
    if (!src) return null;
    return src.fetcher();
  }

  fetchAll() {
    const sources = Array.from(this._sources.values()).sort((a, b) => a.priority - b.priority);
    const results = {};
    for (const src of sources) {
      try {
        const data = src.fetcher();
        if (data && typeof data === 'object') {
          Object.assign(results, data);
        }
      } catch (e) {
        continue;
      }
    }
    return results;
  }

  clear() {
    this._sources.clear();
  }
}

module.exports = { ConfigurationSources };
