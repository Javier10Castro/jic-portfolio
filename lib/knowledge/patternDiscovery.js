class PatternDiscovery {
  constructor() {
    this._patterns = [];
    this._counter = 0;
  }

  discover(name, sourceData, algorithm) {
    if (!name) throw new Error('name is required');
    if (!sourceData) throw new Error('sourceData is required');
    const id = 'pd_' + (++this._counter);
    const pattern = {
      id,
      name,
      sourceData: JSON.parse(JSON.stringify(sourceData)),
      algorithm: algorithm || 'default',
      discoveredAt: new Date().toISOString()
    };
    this._patterns.push(pattern);
    return pattern;
  }

  get(id) {
    if (!id) return null;
    return this._patterns.find(p => p.id === id) || null;
  }

  findByName(name) {
    if (!name) return [];
    return this._patterns.filter(p => p.name === name);
  }

  list() {
    return this._patterns;
  }

  clear() {
    this._patterns = [];
    this._counter = 0;
  }
}

module.exports = { PatternDiscovery };
