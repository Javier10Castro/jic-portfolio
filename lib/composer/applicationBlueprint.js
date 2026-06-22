class ApplicationBlueprint {
  constructor() {
    this._blueprints = new Map();
  }

  create(name, version, modules, config = {}) {
    if (!name || !version) {
      throw new Error('name and version are required');
    }
    const blueprint = {
      name,
      version,
      modules: Array.isArray(modules) ? [...modules] : [],
      config: typeof config === 'object' && config !== null ? { ...config } : {},
      stages: [
        { name: 'discovery', order: 0 },
        { name: 'matching', order: 1 },
        { name: 'resolution', order: 2 },
        { name: 'allocation', order: 3 },
        { name: 'composition', order: 4 }
      ],
      createdAt: new Date().toISOString()
    };
    this._blueprints.set(name, blueprint);
    return blueprint;
  }

  get(name) {
    if (!name) return null;
    return this._blueprints.get(name) || null;
  }

  list() {
    return Array.from(this._blueprints.values());
  }

  clear() {
    this._blueprints.clear();
  }
}

module.exports = { ApplicationBlueprint };
