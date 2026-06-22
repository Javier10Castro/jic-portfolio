class ServiceHealth {
  constructor() {
    this._statuses = new Map();
  }

  check(service) {
    if (!service || !service.id) {
      return { id: 'unknown', status: 'down', latency: 0, timestamp: new Date().toISOString() };
    }
    const start = Date.now();
    let status = 'healthy';
    if (!service.host || !service.port) {
      status = 'degraded';
    }
    const latency = Date.now() - start;
    const result = {
      id: service.id,
      status,
      latency,
      timestamp: new Date().toISOString()
    };
    this._statuses.set(service.id, { ...result });
    return result;
  }

  checkAll(services) {
    if (!Array.isArray(services)) return [];
    return services.map(s => this.check(s));
  }

  getStatus(serviceId) {
    if (!serviceId) return null;
    const status = this._statuses.get(serviceId);
    return status ? { ...status } : null;
  }

  getUnhealthy() {
    return Array.from(this._statuses.values())
      .filter(s => s.status !== 'healthy')
      .map(s => ({ ...s }));
  }

  clear() {
    this._statuses.clear();
  }
}

module.exports = { ServiceHealth };
