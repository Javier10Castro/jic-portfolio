class ApplicationDependencies {
  constructor() {
    this._dependencies = new Map();
  }

  addDependency(appId, dependency) {
    if (!appId || !dependency) {
      throw new Error('appId and dependency are required');
    }
    if (!dependency.id) {
      throw new Error('dependency must have an id');
    }
    if (!this._dependencies.has(appId)) {
      this._dependencies.set(appId, new Map());
    }
    const entry = {
      id: dependency.id,
      name: dependency.name || '',
      type: dependency.type || '',
      version: dependency.version || '',
      optional: dependency.optional === true
    };
    this._dependencies.get(appId).set(dependency.id, entry);
    return entry;
  }

  getDependencies(appId) {
    if (!appId) return [];
    const deps = this._dependencies.get(appId);
    return deps ? Array.from(deps.values()) : [];
  }

  removeDependency(appId, depId) {
    if (!appId || !depId) return false;
    const deps = this._dependencies.get(appId);
    if (!deps) return false;
    return deps.delete(depId);
  }

  resolve(appId) {
    if (!appId) {
      return { resolved: false, dependencies: [] };
    }
    const deps = this._dependencies.get(appId);
    const list = deps ? Array.from(deps.values()) : [];
    return {
      resolved: true,
      dependencies: list
    };
  }

  clear() {
    this._dependencies.clear();
  }
}

module.exports = { ApplicationDependencies };
