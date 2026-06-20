const DEFAULT_PLANS = {
  free: { id: 'free', name: 'Free', price: 0, prices: { monthly: 0, yearly: 0 }, currency: 'usd', billing: 'flat', projects: 1, teamMembers: 1, storage: 100, aiGenerations: 10, features: ['basic_analytics', 'email_support'], type: 'flat', yearlyDiscount: 1 },
  starter: { id: 'starter', name: 'Starter', price: 29, prices: { monthly: 29, yearly: 290 }, currency: 'usd', billing: 'flat', projects: 10, teamMembers: 5, storage: 1000, aiGenerations: 100, features: ['basic_analytics', 'email_support', 'api_access', 'custom_domain'], type: 'flat', yearlyDiscount: 0.83 },
  professional: { id: 'professional', name: 'Professional', price: 99, prices: { monthly: 99, yearly: 990 }, currency: 'usd', billing: 'flat', projects: 50, teamMembers: 20, storage: 10000, aiGenerations: 1000, features: ['advanced_analytics', 'priority_support', 'api_access', 'custom_domain', 'team_collaboration', 'export'], type: 'flat', yearlyDiscount: 0.83 },
  business: { id: 'business', name: 'Business', price: 299, prices: { monthly: 299, yearly: 2990 }, currency: 'usd', billing: 'flat', projects: 200, teamMembers: 100, storage: 100000, aiGenerations: 10000, features: ['advanced_analytics', 'dedicated_support', 'api_access', 'custom_domain', 'team_collaboration', 'export', 'sso', 'audit_logs'], type: 'flat', yearlyDiscount: 0.83 },
  enterprise: { id: 'enterprise', name: 'Enterprise', price: 0, prices: { monthly: 0, yearly: 0 }, currency: 'usd', billing: 'custom', projects: -1, teamMembers: -1, storage: -1, aiGenerations: -1, features: ['all'], type: 'custom', yearlyDiscount: 1 }
};

class PlanRegistry {
  constructor() {
    this._plans = {};
    Object.entries(DEFAULT_PLANS).forEach(([id, plan]) => { this._plans[id] = { ...plan }; });
  }

  registerPlan(plan) {
    this._plans[plan.id] = { ...plan, createdAt: Date.now() };
    return this._plans[plan.id];
  }

  getPlan(id) { return this._plans[id] ? { ...this._plans[id] } : null; }
  listPlans(filter) {
    let items = Object.values(this._plans);
    if (filter) Object.entries(filter).forEach(([k, v]) => { items = items.filter(i => i[k] === v); });
    return items;
  }
  updatePlan(id, data) { if (this._plans[id]) { Object.assign(this._plans[id], data, { updatedAt: Date.now() }); return { ...this._plans[id] }; } return null; }
  deletePlan(id) { const p = this._plans[id]; if (p && DEFAULT_PLANS[id]) return null; if (p) delete this._plans[id]; return p || null; }
  clear() { this._plans = {}; Object.entries(DEFAULT_PLANS).forEach(([id, plan]) => { this._plans[id] = { ...plan }; }); }
}

module.exports = { PlanRegistry, DEFAULT_PLANS };
