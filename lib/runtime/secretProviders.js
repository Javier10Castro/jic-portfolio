class SecretProviders {
  constructor() {
    this._providers = new Map();
  }

  register(type, provider) {
    if (!type || !provider) {
      throw new Error('type and provider are required');
    }
    if (this._providers.has(type)) {
      throw new Error(`Provider for type '${type}' already registered`);
    }
    if (typeof provider.getSecret !== 'function' || typeof provider.setSecret !== 'function') {
      throw new Error('provider must have getSecret and setSecret functions');
    }
    this._providers.set(type, {
      name: provider.name || type,
      type,
      getSecret: provider.getSecret,
      setSecret: provider.setSecret
    });
  }

  getProvider(type) {
    if (!type) return null;
    const provider = this._providers.get(type);
    return provider ? { name: provider.name, type: provider.type, getSecret: provider.getSecret, setSecret: provider.setSecret } : null;
  }

  listProviders() {
    return Array.from(this._providers.values()).map(p => ({ name: p.name, type: p.type }));
  }

  clear() {
    this._providers.clear();
  }
}

module.exports = { SecretProviders };
