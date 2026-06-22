class CapabilityRegistry {
  constructor() {
    this._capabilities = new Map();
    this._counter = 0;
  }

  register(capability) {
    if (!capability || !capability.id) {
      throw new Error('capability with an id is required');
    }
    if (this._capabilities.has(capability.id)) {
      throw new Error(`capability '${capability.id}' is already registered`);
    }
    const entry = {
      id: capability.id,
      name: capability.name || '',
      type: capability.type || 'generic',
      version: capability.version || '1.0.0',
      description: capability.description || '',
      config: capability.config || {},
      registeredAt: new Date().toISOString()
    };
    this._capabilities.set(capability.id, entry);
    return entry;
  }

  get(id) {
    if (!id) return null;
    return this._capabilities.get(id) || null;
  }

  unregister(id) {
    if (!id) return false;
    return this._capabilities.delete(id);
  }

  list() {
    return Array.from(this._capabilities.values());
  }

  find(query = {}) {
    let results = Array.from(this._capabilities.values());
    if (query.type) {
      results = results.filter(c => c.type === query.type);
    }
    if (query.name) {
      results = results.filter(c => c.name.includes(query.name));
    }
    return results;
  }

  clear() {
    this._capabilities.clear();
    this._counter = 0;
  }
}

module.exports = { CapabilityRegistry };
