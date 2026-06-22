const { EmbeddingProviders } = require('./embeddingProviders');

class EmbeddingManager {
  constructor() {
    this._providers = new EmbeddingProviders();
  }

  generate(text, provider) {
    if (!text || !provider) return null;
    const prov = this._providers.get(provider);
    if (!prov) return null;
    return prov.embed(text);
  }

  generateBatch(texts, provider) {
    if (!Array.isArray(texts) || texts.length === 0 || !provider) return [];
    const prov = this._providers.get(provider);
    if (!prov) return [];
    return prov.embedBatch(texts);
  }

  registerProvider(name, provider) {
    return this._providers.register(name, provider);
  }

  getProviders() {
    return this._providers.list();
  }

  clear() {
    this._providers.clear();
  }
}

module.exports = { EmbeddingManager };
