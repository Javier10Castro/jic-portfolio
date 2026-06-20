class PlanLimits {
  constructor() {
    this._overrides = {};
  }

  getLimits(plan) {
    if (!plan) return {};
    return {
      projects: plan.projects, teamMembers: plan.teamMembers,
      storage: plan.storage, aiGenerations: plan.aiGenerations,
      bandwidth: plan.bandwidth || null, apiCalls: plan.apiCalls || null,
      seats: plan.seats || plan.teamMembers || null,
      custom: this._overrides[plan.id] || {}
    };
  }

  checkLimit(plan, resource, current, requested) {
    const limits = this.getLimits(plan);
    const limit = limits[resource];
    if (limit === -1 || limit === null) return { allowed: true, limit, remaining: -1 };
    const newTotal = current + requested;
    const allowed = newTotal <= limit;
    return { allowed, limit, current, requested, remaining: Math.max(0, limit - newTotal) };
  }

  setOverride(planId, resource, value) {
    if (!this._overrides[planId]) this._overrides[planId] = {};
    this._overrides[planId][resource] = value;
  }

  clear() { this._overrides = {}; }
}

module.exports = { PlanLimits };
