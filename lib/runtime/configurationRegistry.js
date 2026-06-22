class ConfigurationRegistry {
  constructor() {
    this._configs = new Map();
  }

  register(name, config) {
    if (!name || !config) {
      throw new Error('name and config are required');
    }
    if (this._configs.has(name)) {
      throw new Error(`Configuration '${name}' already registered`);
    }
    this._configs.set(name, {
      name,
      value: config.value,
      type: config.type || typeof config.value,
      source: config.source || 'manual',
      version: config.version || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  get(name) {
    if (!name) return null;
    const config = this._configs.get(name);
    return config ? { ...config } : null;
  }

  update(name, value) {
    if (!name) {
      throw new Error('name is required');
    }
    const config = this._configs.get(name);
    if (!config) {
      throw new Error(`Configuration '${name}' not found`);
    }
    config.value = value;
    config.version = (config.version || 1) + 1;
    config.updatedAt = new Date().toISOString();
  }

  unregister(name) {
    if (!name) return false;
    return this._configs.delete(name);
  }

  list(filters) {
    let result = Array.from(this._configs.values()).map(c => ({ ...c }));
    if (filters) {
      if (filters.type) {
        result = result.filter(c => c.type === filters.type);
      }
      if (filters.source) {
        result = result.filter(c => c.source === filters.source);
      }
    }
    return result;
  }

  clear() {
    this._configs.clear();
  }
}

module.exports = { ConfigurationRegistry };
