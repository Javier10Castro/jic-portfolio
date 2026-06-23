class DependencyMap {
  constructor() {
    this._maps = new Map();
  }

  map(solutionId, dependencies) {
    if (!solutionId || !dependencies) {
      throw new Error('solutionId and dependencies are required');
    }
    if (!Array.isArray(dependencies)) {
      throw new Error('dependencies must be an array');
    }
    const entries = dependencies.map(d => ({
      from: d.from || '',
      to: d.to || '',
      type: d.type || 'sync',
      description: d.description || '',
      critical: d.critical === true
    }));
    this._maps.set(solutionId, entries);
    return entries;
  }

  get(solutionId) {
    if (!solutionId) return [];
    return this._maps.get(solutionId) || [];
  }

  addDependency(solutionId, dep) {
    if (!solutionId || !dep) {
      throw new Error('solutionId and dep are required');
    }
    if (!this._maps.has(solutionId)) {
      this._maps.set(solutionId, []);
    }
    const entry = {
      from: dep.from || '',
      to: dep.to || '',
      type: dep.type || 'sync',
      description: dep.description || '',
      critical: dep.critical === true
    };
    this._maps.get(solutionId).push(entry);
    return entry;
  }

  removeDependency(solutionId, depIndex) {
    if (!solutionId || depIndex === undefined || depIndex === null) return false;
    const deps = this._maps.get(solutionId);
    if (!deps) return false;
    if (depIndex < 0 || depIndex >= deps.length) return false;
    deps.splice(depIndex, 1);
    return true;
  }

  getCritical(solutionId) {
    if (!solutionId) return [];
    const deps = this._maps.get(solutionId);
    if (!deps) return [];
    return deps.filter(d => d.critical === true);
  }

  getByType(solutionId, type) {
    if (!solutionId || !type) return [];
    const deps = this._maps.get(solutionId);
    if (!deps) return [];
    return deps.filter(d => d.type === type);
  }

  clear() {
    this._maps.clear();
  }
}

module.exports = { DependencyMap };
