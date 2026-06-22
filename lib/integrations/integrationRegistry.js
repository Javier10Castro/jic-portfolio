class IntegrationRegistry {
  constructor() {
    this._integrations = {};
    this._providers = {};
  }

  register(integration) {
    const provider = integration.provider || integration.name;
    this._integrations[provider] = integration;
    if (integration.type) {
      this._providers[provider] = { type: integration.type, authType: integration.authType, version: integration.version || '1.0.0' };
    }
  }

  unregister(provider) {
    delete this._integrations[provider];
    delete this._providers[provider];
  }

  getIntegration(provider) {
    return this._integrations[provider] || null;
  }

  listIntegrations(filter) {
    let entries = Object.entries(this._integrations);
    if (filter) {
      if (filter.status) {
        entries = entries.filter(([_, v]) => v.status === filter.status);
      }
      if (filter.type) {
        entries = entries.filter(([_, v]) => v.type === filter.type);
      }
      if (filter.provider) {
        entries = entries.filter(([k]) => k === filter.provider);
      }
    }
    return entries.map(([_, integration]) => integration);
  }

  getProviders() {
    return Object.entries(this._providers).map(([id, meta]) => ({
      id,
      name: meta.name || id,
      type: meta.type,
      authType: meta.authType,
      version: meta.version
    }));
  }

  registerProvider(providerDef) {
    this._providers[providerDef.id] = providerDef;
  }

  getProvider(id) {
    return this._providers[id] || null;
  }

  getCount() {
    return Object.keys(this._integrations).length;
  }

  clear() {
    this._integrations = {};
    this._providers = {};
  }
}

module.exports = { IntegrationRegistry };
