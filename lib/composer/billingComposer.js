class BillingComposer {
  constructor() {
    this._compositions = new Map();
    this._counter = 0;
  }

  compose(appId, billing) {
    if (!appId || !billing) {
      return { composed: false };
    }
    const config = {
      ...billing,
      _id: billing.id || `billing_${++this._counter}`,
      _plans: (billing.plans || []).map((p) => ({
        ...p,
        _id: p.id || `plan_${++this._counter}`,
      })),
    };
    this._compositions.set(appId, config);
    return { composed: true };
  }

  getComposed(appId) {
    if (!appId) return null;
    return this._compositions.get(appId) || null;
  }

  addPlan(appId, plan) {
    if (!appId || !plan) return null;
    const existing = this._compositions.get(appId);
    if (!existing) return null;
    const item = { ...plan, _id: plan.id || `plan_${++this._counter}` };
    existing._plans = existing._plans || [];
    existing._plans.push(item);
    return item;
  }

  removePlan(appId, planId) {
    if (!appId || !planId) return false;
    const existing = this._compositions.get(appId);
    if (!existing || !existing._plans) return false;
    const filtered = existing._plans.filter((p) => p._id !== planId);
    if (filtered.length === existing._plans.length) return false;
    existing._plans = filtered;
    return true;
  }

  clear() {
    this._compositions.clear();
    this._counter = 0;
  }
}

module.exports = { BillingComposer };
