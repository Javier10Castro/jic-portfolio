class ServiceRegistry {
  constructor() {
    this._services = new Map();
  }

  register(service) {
    if (!service || !service.id || !service.name) {
      throw new Error('service must have id and name');
    }
    if (this._services.has(service.id)) {
      throw new Error(`Service with id '${service.id}' already registered`);
    }
    this._services.set(service.id, {
      id: service.id,
      name: service.name,
      version: service.version || '1.0.0',
      host: service.host || 'localhost',
      port: service.port || 0,
      protocol: service.protocol || 'http',
      healthEndpoint: service.healthEndpoint || '/health',
      metadata: service.metadata && typeof service.metadata === 'object' ? { ...service.metadata } : {},
      registeredAt: new Date().toISOString()
    });
  }

  unregister(id) {
    if (!id) return false;
    return this._services.delete(id);
  }

  get(id) {
    if (!id) return null;
    const service = this._services.get(id);
    return service ? { ...service, metadata: { ...service.metadata } } : null;
  }

  findByName(name) {
    if (!name) return [];
    return Array.from(this._services.values())
      .filter(s => s.name === name)
      .map(s => ({ ...s, metadata: { ...s.metadata } }));
  }

  findByTag(tag) {
    if (!tag) return [];
    return Array.from(this._services.values())
      .filter(s => s.metadata && s.metadata.tags && Array.isArray(s.metadata.tags) && s.metadata.tags.includes(tag))
      .map(s => ({ ...s, metadata: { ...s.metadata } }));
  }

  list() {
    return Array.from(this._services.values()).map(s => ({ ...s, metadata: { ...s.metadata } }));
  }

  clear() {
    this._services.clear();
  }
}

module.exports = { ServiceRegistry };
