class EmbeddingProviders {
  constructor() {
    this._providers = new Map();
  }

  register(name, provider) {
    if (!name || !provider) return null;
    if (typeof provider.embed !== 'function' || typeof provider.embedBatch !== 'function') return null;
    this._providers.set(name, provider);
  }

  get(name) {
    if (name == null) return null;
    return this._providers.get(name) || null;
  }

  list() {
    return Array.from(this._providers.keys());
  }

  clear() {
    this._providers.clear();
  }
}

module.exports = { EmbeddingProviders };
