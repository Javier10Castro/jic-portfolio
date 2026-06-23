class SolutionDefinition {
  constructor() {
    this._definitions = new Map();
  }

  create(id, name, version, description, domain) {
    if (!id || !name) {
      throw new Error('id and name are required');
    }
    const definition = {
      id,
      name,
      version: version || '1.0.0',
      description: description || '',
      domain: domain || '',
      patterns: [],
      decisions: [],
      components: [],
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
    const allowed = ['name', 'version', 'description', 'domain', 'patterns', 'decisions', 'components', 'status'];
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

module.exports = { SolutionDefinition };
