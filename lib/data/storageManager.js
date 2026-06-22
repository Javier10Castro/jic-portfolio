class StorageManager {
  constructor() {
    this._providers = new Map();
    this._data = new Map();
  }

  registerProvider(name, provider) {
    if (!name || !provider) return null;
    this._providers.set(name, provider);
  }

  getProvider(name) {
    if (name == null) return null;
    return this._providers.get(name) || null;
  }

  listProviders() {
    return Array.from(this._providers.keys());
  }

  store(provider, key, data) {
    if (provider == null || key == null) return null;
    if (!this._providers.has(provider)) return null;
    const storeKey = `${provider}:${key}`;
    this._data.set(storeKey, data);
    return true;
  }

  retrieve(provider, key) {
    if (provider == null || key == null) return null;
    const storeKey = `${provider}:${key}`;
    return this._data.has(storeKey) ? this._data.get(storeKey) : null;
  }

  delete(provider, key) {
    if (provider == null || key == null) return false;
    const storeKey = `${provider}:${key}`;
    return this._data.delete(storeKey);
  }

  exists(provider, key) {
    if (provider == null || key == null) return false;
    const storeKey = `${provider}:${key}`;
    return this._data.has(storeKey);
  }

  clear() {
    this._providers.clear();
    this._data.clear();
  }
}

module.exports = { StorageManager };
