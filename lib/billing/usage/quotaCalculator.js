class QuotaCalculator {
  checkQuota(usage, limits) {
    const results = {};
    Object.entries(limits).forEach(([resource, limit]) => {
      const current = usage[resource] || 0;
      const { allowed, remaining } = this._compare(current, limit);
      results[resource] = { current, limit, allowed, remaining, usagePercent: limit > 0 ? (current / limit) * 100 : 0 };
    });
    return {
      results,
      allAllowed: Object.values(results).every(r => r.allowed),
      exceeded: Object.values(results).filter(r => !r.allowed).map(r => r.resource)
    };
  }

  getUsagePercentage(current, limit) {
    if (limit === -1 || limit === null) return 0;
    if (limit <= 0) return current > 0 ? 100 : 0;
    return (current / limit) * 100;
  }

  _compare(current, limit) {
    if (limit === -1 || limit === null) return { allowed: true, remaining: -1 };
    const remaining = Math.max(0, limit - current);
    return { allowed: current < limit, remaining };
  }
}

module.exports = { QuotaCalculator };
