class RecommendationProvider {
  constructor(name) {
    this.name = name;
    this._providers = {};
  }

  registerProvider(type, provider) {
    if (!this._providers[type]) this._providers[type] = [];
    this._providers[type].push(provider);
  }

  recommend(type, context) {
    const providers = this._providers[type] || [];
    return providers.map(fn => {
      try { return fn(context); } catch (e) { return { error: e.message }; }
    });
  }

  getProviders(type) {
    if (!type) return { ...this._providers };
    return this._providers[type] || [];
  }

  getName() { return this.name; }
}

module.exports = { RecommendationProvider };
