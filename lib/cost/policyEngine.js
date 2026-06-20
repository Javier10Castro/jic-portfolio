const DEFAULT_POLICIES = [
  { id: 'default-max-cost', name: 'Maximum Monthly Cost', type: 'maximum_cost', params: { maxMonthly: 5000 }, scope: 'organization', priority: 'high', enabled: true, description: 'Prevent monthly spend from exceeding $5,000', createdAt: 0 },
  { id: 'default-preferred-providers', name: 'Preferred Providers', type: 'preferred_providers', params: { providers: ['openai', 'anthropic'], priorityOrder: true }, scope: 'organization', priority: 'medium', enabled: true, description: 'Prefer OpenAI and Anthropic providers', createdAt: 0 },
  { id: 'default-min-quality', name: 'Minimum Model Quality', type: 'minimum_quality', params: { minContextWindow: 8000, minCapability: 'standard' }, scope: 'organization', priority: 'medium', enabled: true, description: 'Ensure minimum model quality standards', createdAt: 0 },
  { id: 'default-latency-threshold', name: 'Latency Threshold', type: 'latency_threshold', params: { maxLatencyMs: 5000 }, scope: 'organization', priority: 'low', enabled: true, description: 'Reject providers exceeding latency threshold', createdAt: 0 },
  { id: 'default-green-computing', name: 'Green Computing', type: 'green_computing', params: { preferLocalModels: false, offPeakScheduling: false }, scope: 'organization', priority: 'low', enabled: true, description: 'Reduce carbon footprint via efficient model selection', createdAt: 0 },
];

class PolicyEngine {
  constructor(options = {}) {
    this._policies = [];
    this._defaultPolicies = options.defaultPolicies !== false;
    if (this._defaultPolicies) {
      for (const p of DEFAULT_POLICIES) this._policies.push({ ...p, createdAt: Date.now() });
    }
  }

  getPolicies(filter = {}) {
    let results = this._policies;
    if (filter.enabled !== undefined) results = results.filter(p => p.enabled === filter.enabled);
    if (filter.type) results = results.filter(p => p.type === filter.type);
    if (filter.scope) results = results.filter(p => p.scope === filter.scope);
    return [...results];
  }

  getPolicy(id) {
    return this._policies.find(p => p.id === id) || null;
  }

  addPolicy(policy) {
    if (!policy.id) throw new Error('Policy must have an id');
    if (this._policies.find(p => p.id === policy.id)) throw new Error(`Policy '${policy.id}' already exists`);
    const entry = { ...policy, createdAt: Date.now() };
    this._policies.push(entry);
    return entry;
  }

  updatePolicy(id, updates) {
    const idx = this._policies.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Policy '${id}' not found`);
    const disallowed = ['id', 'createdAt'];
    for (const k of disallowed) delete updates[k];
    this._policies[idx] = { ...this._policies[idx], ...updates, updatedAt: Date.now() };
    return this._policies[idx];
  }

  removePolicy(id) {
    const idx = this._policies.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Policy '${id}' not found`);
    this._policies.splice(idx, 1);
    return true;
  }

  evaluateProvider(provider, model, context = {}) {
    const violations = [];
    for (const policy of this._policies) {
      if (!policy.enabled) continue;
      const v = this._checkPolicy(policy, provider, model, context);
      if (v) violations.push(v);
    }
    return { allowed: violations.length === 0, violations, provider, model };
  }

  evaluateCost(cost, context = {}) {
    const violations = [];
    for (const policy of this._policies) {
      if (!policy.enabled) continue;
      if (policy.type === 'maximum_cost' && cost > policy.params.maxMonthly) {
        violations.push({ policyId: policy.id, policyName: policy.name, type: 'maximum_cost_exceeded', message: `Cost $${cost} exceeds maximum $${policy.params.maxMonthly}`, severity: 'critical' });
      }
    }
    return { allowed: violations.length === 0, violations };
  }

  getProviderRanking(providers) {
    const preferred = this._policies.find(p => p.enabled && p.type === 'preferred_providers');
    if (!preferred || !preferred.params.priorityOrder) return providers;
    const prefs = preferred.params.providers || [];
    const ranked = [...providers].sort((a, b) => {
      const ai = prefs.indexOf(a);
      const bi = prefs.indexOf(b);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return ranked;
  }

  getEffectiveMinLatency() {
    const policy = this._policies.find(p => p.enabled && p.type === 'latency_threshold');
    return policy ? policy.params.maxLatencyMs : null;
  }

  getEffectiveMinContext() {
    const policy = this._policies.find(p => p.enabled && p.type === 'minimum_quality');
    return policy ? policy.params.minContextWindow : null;
  }

  clear() {
    this._policies = [];
  }

  reset() {
    this.clear();
    if (this._defaultPolicies) {
      for (const p of DEFAULT_POLICIES) this._policies.push({ ...p, createdAt: Date.now() });
    }
  }

  _checkPolicy(policy, provider, model, context) {
    switch (policy.type) {
      case 'preferred_providers': {
        const prefs = policy.params.providers || [];
        if (prefs.length > 0 && !prefs.includes(provider)) {
          return { policyId: policy.id, policyName: policy.name, type: 'provider_not_preferred', message: `Provider '${provider}' not in preferred list`, severity: 'warning' };
        }
        return null;
      }
      case 'minimum_quality': {
        const modelInfo = context.models?.[provider]?.[model];
        if (modelInfo && policy.params.minContextWindow && (modelInfo.context || 0) < policy.params.minContextWindow) {
          return { policyId: policy.id, policyName: policy.name, type: 'insufficient_context', message: `Model '${model}' context window (${modelInfo.context}) below minimum (${policy.params.minContextWindow})`, severity: 'warning' };
        }
        return null;
      }
      default:
        return null;
    }
  }
}

module.exports = { PolicyEngine, DEFAULT_POLICIES };
