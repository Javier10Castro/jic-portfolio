class GovernanceComposer {
  constructor() {
    this._compositions = new Map();
    this._counter = 0;
  }

  compose(appId, governance) {
    if (!appId || !governance) {
      return { composed: false };
    }
    const config = {
      ...governance,
      _id: governance.id || `gov_${++this._counter}`,
      _policies: (governance.policies || []).map((p) => ({
        ...p,
        _id: p.id || `govpol_${++this._counter}`,
      })),
    };
    this._compositions.set(appId, config);
    return { composed: true };
  }

  getComposed(appId) {
    if (!appId) return null;
    return this._compositions.get(appId) || null;
  }

  addPolicy(appId, policy) {
    if (!appId || !policy) return null;
    const existing = this._compositions.get(appId);
    if (!existing) return null;
    const item = {
      ...policy,
      _id: policy.id || `govpol_${++this._counter}`,
    };
    existing._policies = existing._policies || [];
    existing._policies.push(item);
    return item;
  }

  removePolicy(appId, policyId) {
    if (!appId || !policyId) return false;
    const existing = this._compositions.get(appId);
    if (!existing || !existing._policies) return false;
    const filtered = existing._policies.filter((p) => p._id !== policyId);
    if (filtered.length === existing._policies.length) return false;
    existing._policies = filtered;
    return true;
  }

  clear() {
    this._compositions.clear();
    this._counter = 0;
  }
}

module.exports = { GovernanceComposer };
