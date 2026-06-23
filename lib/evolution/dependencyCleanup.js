class DependencyCleanup {
  constructor() {
    this._cleanups = [];
    this._counter = 0;
  }

  analyze(evolutionId, dependencies) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'depclean_' + (++this._counter);
    const deps = dependencies || [];
    const unused = deps.filter(d => d.usageCount === 0);
    const duplicate = [];
    const seen = new Map();
    for (const d of deps) {
      if (d.name) {
        if (seen.has(d.name)) {
          duplicate.push({ name: d.name, versions: [seen.get(d.name), d.version] });
        }
        seen.set(d.name, d.version);
      }
    }
    const recommendations = [];
    if (unused.length > 0) recommendations.push({ type: 'remove_unused', count: unused.length, names: unused.map(d => d.name || d.id) });
    if (duplicate.length > 0) recommendations.push({ type: 'deduplicate', count: duplicate.length, names: duplicate.map(d => d.name) });
    const analysis = {
      id, evolutionId,
      unusedCount: unused.length,
      duplicateCount: duplicate.length,
      recommendations,
      timestamp: new Date().toISOString()
    };
    this._cleanups.push(analysis);
    return analysis;
  }

  get(id) {
    if (!id) return null;
    return this._cleanups.find(c => c.id === id) || null;
  }

  list() {
    return this._cleanups;
  }

  clear() {
    this._cleanups = [];
    this._counter = 0;
  }
}

module.exports = { DependencyCleanup };
