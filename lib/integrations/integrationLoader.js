class IntegrationLoader {
  constructor() {
    this._loaded = {};
  }

  load(integration) {
    const provider = integration.provider || integration.name;
    this._loaded[provider] = { instance: integration, loadedAt: Date.now() };
    return { success: true, instance: integration };
  }

  unload(provider) {
    delete this._loaded[provider];
  }

  isLoaded(provider) {
    return provider in this._loaded;
  }

  getInstance(provider) {
    return this._loaded[provider] ? this._loaded[provider].instance : null;
  }

  getLoaded() {
    return Object.entries(this._loaded).map(([provider, entry]) => ({
      provider,
      loadedAt: entry.loadedAt
    }));
  }

  getCount() {
    return Object.keys(this._loaded).length;
  }

  clear() {
    this._loaded = {};
  }
}

module.exports = { IntegrationLoader };
