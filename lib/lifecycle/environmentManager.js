class EnvironmentManager {
  static ENVIRONMENTS = ['development', 'preview', 'qa', 'staging', 'production'];

  constructor() {
    this._environments = new Map();
  }

  create(name, config) {
    if (!name || typeof name !== 'string') {
      throw new Error('Environment name must be a non-empty string');
    }
    if (this._environments.has(name)) {
      throw new Error(`Environment "${name}" already exists`);
    }
    const type = (config && config.type) || 'development';
    if (!EnvironmentManager.ENVIRONMENTS.includes(type)) {
      throw new Error(`Invalid environment type "${type}". Must be one of: ${EnvironmentManager.ENVIRONMENTS.join(', ')}`);
    }
    const environment = {
      name,
      type,
      config: (config && config.config) || {},
      status: 'active',
      createdAt: new Date().toISOString()
    };
    this._environments.set(name, environment);
    return environment;
  }

  get(name) {
    if (!name) return null;
    return this._environments.get(name) || null;
  }

  list() {
    return Array.from(this._environments.values());
  }

  update(name, config) {
    if (!this._environments.has(name)) {
      throw new Error(`Environment "${name}" not found`);
    }
    const env = this._environments.get(name);
    if (config.type) {
      if (!EnvironmentManager.ENVIRONMENTS.includes(config.type)) {
        throw new Error(`Invalid environment type "${config.type}"`);
      }
      env.type = config.type;
    }
    if (config.config) {
      env.config = { ...env.config, ...config.config };
    }
    return env;
  }

  delete(name) {
    return this._environments.delete(name);
  }

  setStatus(name, status) {
    if (!this._environments.has(name)) {
      throw new Error(`Environment "${name}" not found`);
    }
    const validStatuses = ['active', 'inactive', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`);
    }
    this._environments.get(name).status = status;
  }

  getStatus(name) {
    if (!this._environments.has(name)) return null;
    return this._environments.get(name).status;
  }

  clear() {
    this._environments.clear();
  }
}

module.exports = { EnvironmentManager };
