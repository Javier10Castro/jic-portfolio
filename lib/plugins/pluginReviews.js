class PluginReviews {
  constructor() {
    this._reviews = {};
  }

  addReview(pluginId, userId, data) {
    const review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      pluginId, userId, title: data.title || '',
      body: data.body, rating: data.rating || null,
      createdAt: Date.now(), updatedAt: Date.now()
    };
    if (!this._reviews[pluginId]) this._reviews[pluginId] = [];
    this._reviews[pluginId].push(review);
    return review;
  }

  getReviews(pluginId) { return this._reviews[pluginId] ? [...this._reviews[pluginId]] : []; }
  getReview(id) {
    for (const pid of Object.keys(this._reviews)) {
      const r = this._reviews[pid].find(r => r.id === id);
      if (r) return r;
    }
    return null;
  }

  deleteReview(id) {
    for (const pid of Object.keys(this._reviews)) {
      const idx = this._reviews[pid].findIndex(r => r.id === id);
      if (idx !== -1) return this._reviews[pid].splice(idx, 1)[0];
    }
    return null;
  }

  getCount(pluginId) { return (this._reviews[pluginId] || []).length; }
  clear() { this._reviews = {}; }
}

module.exports = { PluginReviews };
