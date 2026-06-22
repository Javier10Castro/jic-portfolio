class ApplicationDefinition {
  constructor() {
    this._definitions = new Map();
  }

  create(id, name, version, blueprint) {
    if (!id || !name) {
      throw new Error('id and name are required');
    }
    const definition = {
      id,
      name,
      version: version || '1.0.0',
      blueprint: blueprint || null,
      capabilities: [],
      dependencies: [],
      status: 'draft',
      createdAt: new Date().toISOString()
    };
    this._definitions.set(id, definition);
    return definition;
  }

  get(id) {
    if (!id) return null;
    return this._definitions.get(id) || null;
  }

  update(id, changes) {
    if (!id || !changes) {
      throw new Error('id and changes are required');
    }
    const definition = this._definitions.get(id);
    if (!definition) return null;

    const allowed = ['name', 'version', 'blueprint', 'capabilities', 'dependencies', 'status'];
    for (const key of Object.keys(changes)) {
      if (allowed.includes(key)) {
        definition[key] = changes[key];
      }
    }
    return definition;
  }

  list() {
    return Array.from(this._definitions.values());
  }

  clear() {
    this._definitions.clear();
  }
}

module.exports = { ApplicationDefinition };
