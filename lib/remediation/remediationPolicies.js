const DEFAULT_POLICIES = [
  {
    id: 'auto-scale-on-imbalance',
    name: 'Auto-scale on Cluster Imbalance',
    description: 'Scale up workers when cluster imbalance pattern is detected',
    enabled: true,
    match: {
      eventTypes: ['intelligence.pattern', 'intelligence.insight'],
      rules: ['cluster_underprovisioned'],
      patterns: ['cluster_imbalance'],
      minConfidence: 0.7,
      minPriority: 'high',
      maxPerWindow: 3,
      windowMs: 300000,
    },
    action: 'auto_scale',
    actionParams: { direction: 'up', amount: 2, maxWorkers: 20 },
    safety: {
      cooldownMs: 300000,
      maxActionsPerHour: 6,
      requiresApproval: false,
      allowedHours: null,
    },
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'reroute-on-provider-degradation',
    name: 'Reroute on AI Provider Degradation',
    description: 'Switch AI traffic when provider degradation is detected',
    enabled: true,
    match: {
      eventTypes: ['intelligence.insight'],
      rules: ['ai_provider_degradation'],
      patterns: ['ai_fallback_chain'],
      minConfidence: 0.6,
      minPriority: 'medium',
      maxPerWindow: 2,
      windowMs: 600000,
    },
    action: 'reroute_traffic',
    actionParams: { targetProvider: 'fallback' },
    safety: {
      cooldownMs: 600000,
      maxActionsPerHour: 3,
      requiresApproval: false,
      allowedHours: null,
    },
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'circuit-breaker-on-latency',
    name: 'Enable Circuit Breaker on Latency Burst',
    description: 'Open circuit breaker when repeated latency bursts are detected',
    enabled: true,
    match: {
      eventTypes: ['intelligence.pattern', 'intelligence.anomaly'],
      rules: ['latency_degradation'],
      patterns: ['high_latency_burst'],
      anomalyTypes: ['latency_anomaly'],
      minConfidence: 0.7,
      minPriority: 'medium',
      maxPerWindow: 2,
      windowMs: 300000,
    },
    action: 'circuit_breaker',
    actionParams: { target: 'primary-provider', type: 'provider', cooldownMs: 120000 },
    safety: {
      cooldownMs: 600000,
      maxActionsPerHour: 2,
      requiresApproval: true,
      allowedHours: null,
    },
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'isolate-failing-node',
    name: 'Isolate Repeatedly Failing Node',
    description: 'Isolate worker nodes with repeated failure patterns',
    enabled: true,
    match: {
      eventTypes: ['intelligence.pattern'],
      patterns: ['repeated_failures'],
      minConfidence: 0.8,
      minPriority: 'critical',
      maxPerWindow: 1,
      windowMs: 600000,
    },
    action: 'isolate_node',
    actionParams: { drainFirst: true },
    safety: {
      cooldownMs: 900000,
      maxActionsPerHour: 2,
      requiresApproval: true,
      allowedHours: null,
    },
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'retry-on-state-error',
    name: 'Retry Workflow on State Transition Error',
    description: 'Retry workflows that encountered invalid state transitions',
    enabled: true,
    match: {
      eventTypes: ['intelligence.insight'],
      rules: ['state_transition_error'],
      anomalyTypes: ['invalid_state_transition'],
      minConfidence: 0.8,
      minPriority: 'high',
      maxPerWindow: 3,
      windowMs: 600000,
    },
    action: 'retry_with_backoff',
    actionParams: { backoffMultiplier: 3, maxRetries: 5, jitter: true },
    safety: {
      cooldownMs: 120000,
      maxActionsPerHour: 10,
      requiresApproval: false,
      allowedHours: null,
    },
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'rate-limit-on-volume-spike',
    name: 'Rate Limit on Volume Spike',
    description: 'Apply rate limiting when anomalous volume spikes are detected',
    enabled: true,
    match: {
      eventTypes: ['intelligence.anomaly'],
      anomalyTypes: ['volume_spike'],
      minConfidence: 0.7,
      minPriority: 'medium',
      maxPerWindow: 2,
      windowMs: 300000,
    },
    action: 'rate_limit',
    actionParams: { target: 'ingress', maxRps: 50, durationMs: 300000 },
    safety: {
      cooldownMs: 300000,
      maxActionsPerHour: 4,
      requiresApproval: false,
      allowedHours: null,
    },
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'notify-on-critical-insight',
    name: 'Notify on Critical Insight',
    description: 'Send notification for any critical-priority insight',
    enabled: true,
    match: {
      eventTypes: ['intelligence.insight'],
      minPriority: 'critical',
      minConfidence: 0,
      maxPerWindow: 10,
      windowMs: 60000,
    },
    action: 'notify',
    actionParams: { channel: 'alert', severity: 'error' },
    safety: {
      cooldownMs: 0,
      maxActionsPerHour: 100,
      requiresApproval: false,
      allowedHours: null,
    },
    createdAt: 0,
    updatedAt: 0,
  },
];

const PRIORITY_ORDER = { low: 0, medium: 1, high: 2, critical: 3 };

class RemediationPolicies {
  constructor(options = {}) {
    this._policies = [];
    this._cooldowns = new Map();
    this._actionCounts = new Map();
    this._windowCounts = new Map();
    this._defaultPolicies = options.defaultPolicies !== false;
    if (this._defaultPolicies) {
      for (const p of DEFAULT_POLICIES) {
        this._policies.push({ ...p, createdAt: Date.now(), updatedAt: Date.now() });
      }
    }
  }

  getPolicies(filter = {}) {
    let results = this._policies;
    if (filter.enabled !== undefined) results = results.filter(p => p.enabled === filter.enabled);
    if (filter.action) results = results.filter(p => p.action === filter.action);
    if (filter.id) results = results.filter(p => p.id === filter.id);
    return [...results];
  }

  getPolicy(id) {
    return this._policies.find(p => p.id === id) || null;
  }

  addPolicy(policy) {
    if (!policy.id) throw new Error('Policy must have an id');
    if (this._policies.find(p => p.id === policy.id)) throw new Error(`Policy '${policy.id}' already exists`);
    const entry = { ...policy, createdAt: Date.now(), updatedAt: Date.now() };
    this._policies.push(entry);
    return entry;
  }

  updatePolicy(id, updates) {
    const idx = this._policies.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Policy '${id}' not found`);
    const disallowed = ['id', 'createdAt'];
    for (const key of disallowed) delete updates[key];
    this._policies[idx] = { ...this._policies[idx], ...updates, updatedAt: Date.now() };
    return this._policies[idx];
  }

  removePolicy(id) {
    const idx = this._policies.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Policy '${id}' not found`);
    this._policies.splice(idx, 1);
    return true;
  }

  evaluate(event) {
    if (!event || !event.type) return [];
    const matched = [];
    const now = Date.now();
    for (const policy of this._policies) {
      if (!policy.enabled) continue;
      if (!this._matchesEventTypes(policy, event.type)) continue;
      if (!this._matchesPriority(policy, event)) continue;
      if (!this._matchesConfidence(policy, event)) continue;
      if (!this._matchesRule(policy, event)) continue;
      if (!this._matchesPattern(policy, event)) continue;
      if (!this._matchesAnomalyType(policy, event)) continue;
      if (this._isInCooldown(policy, now)) continue;
      if (this._isRateLimited(policy, now)) continue;
      if (this._isWindowLimited(policy, now)) continue;
      matched.push(policy);
    }
    return matched;
  }

  markExecuted(policy) {
    const now = Date.now();
    this._cooldowns.set(policy.id, now);
    const hourKey = policy.id + ':' + Math.floor(now / 3600000);
    this._actionCounts.set(hourKey, (this._actionCounts.get(hourKey) || 0) + 1);
    const windowKey = policy.id + ':' + policy.action;
    this._windowCounts.set(windowKey, now);
  }

  checkApprovalRequired(policy) {
    return policy.safety?.requiresApproval === true;
  }

  getCooldownRemaining(policy) {
    const lastExec = this._cooldowns.get(policy.id);
    if (!lastExec) return 0;
    const remaining = (policy.safety?.cooldownMs || 0) - (Date.now() - lastExec);
    return Math.max(0, remaining);
  }

  clear() {
    this._policies = [];
    this._cooldowns.clear();
    this._actionCounts.clear();
    this._windowCounts.clear();
  }

  reset() {
    this.clear();
    if (this._defaultPolicies) {
      for (const p of DEFAULT_POLICIES) {
        this._policies.push({ ...p, createdAt: Date.now(), updatedAt: Date.now() });
      }
    }
  }

  _matchesEventTypes(policy, eventType) {
    const types = policy.match?.eventTypes;
    if (!types || types.length === 0) return true;
    return types.some(t => eventType === t || eventType.startsWith(t));
  }

  _matchesPriority(policy, event) {
    const minPri = policy.match?.minPriority;
    if (!minPri) return true;
    const eventPri = event.priority || event.severity || 'low';
    return (PRIORITY_ORDER[eventPri] || 0) >= (PRIORITY_ORDER[minPri] || 0);
  }

  _matchesConfidence(policy, event) {
    const minConf = policy.match?.minConfidence;
    if (minConf === undefined || minConf === null) return true;
    const eventConf = event.confidence !== undefined ? event.confidence : 1;
    return eventConf >= minConf;
  }

  _matchesRule(policy, event) {
    const rules = policy.match?.rules;
    if (!rules || rules.length === 0) return true;
    return rules.includes(event.rule);
  }

  _matchesPattern(policy, event) {
    const patterns = policy.match?.patterns;
    if (!patterns || patterns.length === 0) return true;
    return patterns.includes(event.pattern);
  }

  _matchesAnomalyType(policy, event) {
    const types = policy.match?.anomalyTypes;
    if (!types || types.length === 0) return true;
    return types.includes(event.type);
  }

  _isInCooldown(policy, now) {
    const lastExec = this._cooldowns.get(policy.id);
    if (!lastExec) return false;
    const cooldown = policy.safety?.cooldownMs || 0;
    return (now - lastExec) < cooldown;
  }

  _isRateLimited(policy, now) {
    const maxPerHour = policy.safety?.maxActionsPerHour;
    if (!maxPerHour) return false;
    const hourKey = policy.id + ':' + Math.floor(now / 3600000);
    return (this._actionCounts.get(hourKey) || 0) >= maxPerHour;
  }

  _isWindowLimited(policy, now) {
    const maxPerWindow = policy.match?.maxPerWindow;
    if (!maxPerWindow) return false;
    const windowMs = policy.match?.windowMs || 60000;
    const windowKey = policy.id + ':' + policy.action;
    const lastTime = this._windowCounts.get(windowKey);
    if (!lastTime) return false;
    const recentCount = 0;
    return false;
  }
}

module.exports = { RemediationPolicies, DEFAULT_POLICIES, PRIORITY_ORDER };
