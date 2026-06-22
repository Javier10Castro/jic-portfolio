class RetentionPolicies {
  constructor() {
    this._policies = {};
  }

  setPolicy(name, policy) {
    if (!name) return null;
    this._policies[name] = {
      period: policy && policy.period || 30,
      maxBackups: policy && policy.maxBackups || 10,
      minBackups: policy && policy.minBackups || 1,
      schedule: policy && policy.schedule || '0 0 * * *',
      createdAt: Date.now()
    };
    return { name, ...this._policies[name] };
  }

  getPolicy(name) {
    return this._policies[name] ? { name, ...this._policies[name] } : null;
  }

  listPolicies() {
    return Object.entries(this._policies).map(([name, p]) => ({ name, ...p }));
  }

  applyRetention(backups) {
    if (!Array.isArray(backups) || backups.length === 0) return { kept: [], removed: [] };
    const sorted = [...backups].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const policies = Object.values(this._policies);
    const maxBackups = policies.length > 0 ? Math.max(...policies.map(p => p.maxBackups)) : Infinity;
    const minBackups = policies.length > 0 ? Math.min(...policies.map(p => p.minBackups)) : 0;
    const period = policies.length > 0 ? Math.min(...policies.map(p => p.period)) : 0;
    const cutoff = period > 0 ? Date.now() - period * 86400000 : 0;
    const kept = [];
    const removed = [];
    sorted.forEach((b, i) => {
      if (i < minBackups || (b.createdAt >= cutoff && kept.length < maxBackups)) {
        kept.push(b);
      } else {
        removed.push(b);
      }
    });
    return { kept, removed };
  }

  getRetentionSchedule() {
    return Object.entries(this._policies).map(([name, p]) => ({
      name,
      schedule: p.schedule,
      period: p.period,
      maxBackups: p.maxBackups
    }));
  }

  clear() {
    this._policies = {};
  }
}

module.exports = { RetentionPolicies };
