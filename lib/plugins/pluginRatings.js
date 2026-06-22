class PluginRatings {
  constructor() {
    this._ratings = {};
  }

  rate(pluginId, userId, score) {
    if (score < 1 || score > 5) return { success: false, error: 'Score must be between 1 and 5' };
    if (!this._ratings[pluginId]) this._ratings[pluginId] = [];
    const existing = this._ratings[pluginId].find(r => r.userId === userId);
    if (existing) existing.score = score;
    else this._ratings[pluginId].push({ userId, score, timestamp: Date.now() });
    return { success: true, average: this.getAverage(pluginId), count: this._ratings[pluginId].length };
  }

  getAverage(pluginId) {
    const ratings = this._ratings[pluginId];
    if (!ratings || !ratings.length) return 0;
    const sum = ratings.reduce((s, r) => s + r.score, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  }

  getCount(pluginId) { return (this._ratings[pluginId] || []).length; }
  getRatings(pluginId) { return this._ratings[pluginId] ? [...this._ratings[pluginId]] : []; }
  getUserRating(pluginId, userId) {
    const ratings = this._ratings[pluginId];
    if (!ratings) return null;
    const r = ratings.find(r => r.userId === userId);
    return r ? r.score : null;
  }
  clear() { this._ratings = {}; }
}

module.exports = { PluginRatings };
