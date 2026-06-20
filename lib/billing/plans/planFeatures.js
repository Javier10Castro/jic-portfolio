class PlanFeatures {
  constructor() {
    this._features = {};
  }

  registerFeature(id, config) {
    this._features[id] = { id, name: config.name, description: config.description || '', category: config.category || 'general', enabled: config.enabled !== false, metadata: config.metadata || {} };
    return this._features[id];
  }

  getPlanFeatures(plan) {
    if (!plan || !plan.features) return [];
    return plan.features.map(fid => {
      if (fid === 'all') return { id: 'all', name: 'All Features', enabled: true, category: 'all' };
      return this._features[fid] || { id: fid, name: fid, enabled: true, category: 'general' };
    });
  }

  checkFeatureAccess(plan, featureId) {
    if (!plan || !plan.features) return false;
    if (plan.features.includes('all')) return true;
    return plan.features.includes(featureId);
  }

  getFeature(id) { return this._features[id] || null; }
  listFeatures() { return Object.values(this._features); }
  clear() { this._features = {}; }
}

module.exports = { PlanFeatures };
