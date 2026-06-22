class DataRetention {
  constructor() { this._policies = {}; }

  setPolicy(datasource, policy) {
    this._policies[datasource] = { ...policy, datasource, updatedAt: Date.now() };
    return { success: true };
  }

  getPolicy(datasource) { return this._policies[datasource] || null; }
  listPolicies() { return Object.values(this._policies); }
  removePolicy(datasource) { delete this._policies[datasource]; }
  count() { return Object.keys(this._policies).length; }
  clear() { this._policies = {}; }
}
module.exports = { DataRetention };
