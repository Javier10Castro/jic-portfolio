class ServiceComposer {
  constructor() {
    this._compositions = new Map();
    this._counter = 0;
  }

  compose(compositionId, services = [], topology = null) {
    if (!compositionId) {
      throw new Error('compositionId is required');
    }

    const config = {
      services: services.map(s => ({
        id: s.id,
        name: s.name || '',
        type: s.type || 'service',
        endpoint: s.endpoint || '',
        config: s.config || {}
      })),
      topology: topology ? JSON.parse(JSON.stringify(topology)) : null,
      endpoints: services
        .filter(s => s.endpoint)
        .map(s => ({
          serviceId: s.id,
          name: s.name || '',
          endpoint: s.endpoint
        })),
      composedAt: new Date().toISOString()
    };

    this._compositions.set(compositionId, config);
    return config;
  }

  getComposition(compositionId) {
    if (!compositionId) return null;
    return this._compositions.get(compositionId) || null;
  }

  getServiceEndpoints(compositionId) {
    if (!compositionId) return [];
    const composition = this._compositions.get(compositionId);
    if (!composition) return [];
    return composition.endpoints || [];
  }

  clear() {
    this._compositions.clear();
    this._counter = 0;
  }
}

module.exports = { ServiceComposer };
