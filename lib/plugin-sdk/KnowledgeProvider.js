class KnowledgeProvider {
  constructor(name) {
    this.name = name;
    this._providers = {};
  }

  registerProvider(type, provider) {
    if (!this._providers[type]) this._providers[type] = [];
    this._providers[type].push(provider);
  }

  getProviders(type) {
    if (!type) return { ...this._providers };
    return this._providers[type] || [];
  }

  getName() { return this.name; }
}

module.exports = { KnowledgeProvider };
