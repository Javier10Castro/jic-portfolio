class RecommendationEngine {
  constructor() {
    this._recommendations = [];
    this._counter = 0;
  }

  generate(context, type, items) {
    if (!context) throw new Error('context is required');
    if (!type) throw new Error('type is required');
    const id = 'rec_' + (++this._counter);
    const recommendation = {
      id,
      context,
      type,
      items: items || [],
      priority: items && items.length > 5 ? 'high' : items && items.length > 0 ? 'medium' : 'low',
      generatedAt: new Date().toISOString()
    };
    this._recommendations.push(recommendation);
    return recommendation;
  }

  get(id) {
    if (!id) return null;
    return this._recommendations.find(r => r.id === id) || null;
  }

  findByType(type) {
    if (!type) return [];
    return this._recommendations.filter(r => r.type === type);
  }

  findByContext(context) {
    if (!context) return [];
    return this._recommendations.filter(r => r.context === context);
  }

  list() {
    return this._recommendations;
  }

  clear() {
    this._recommendations = [];
    this._counter = 0;
  }
}

module.exports = { RecommendationEngine };
