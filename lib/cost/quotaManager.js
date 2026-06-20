const DEFAULT_QUOTA_LIMITS = {
  tokens: { daily: 10_000_000, monthly: 300_000_000, description: 'Total AI tokens (input + output)' },
  requests: { daily: 100_000, monthly: 3_000_000, description: 'Total API requests' },
  deployments: { daily: 50, monthly: 1500, description: 'Total deployments' },
  storage: { daily: 1000, monthly: 30000, description: 'Storage in MB' },
  workflowExecutions: { daily: 5000, monthly: 150_000, description: 'Total workflow executions' },
  clusterMinutes: { daily: 1440, monthly: 43200, description: 'Total cluster compute minutes' },
};

class QuotaManager {
  constructor(options = {}) {
    this._limits = { ...DEFAULT_QUOTA_LIMITS, ...options.limits };
    this._usage = new Map();
    this._maxHistory = options.maxHistory || 1000;
  }

  getLimits() {
    return { ...this._limits };
  }

  updateLimit(key, limits) {
    if (!this._limits[key]) throw new Error(`Unknown quota: ${key}`);
    this._limits[key] = { ...this._limits[key], ...limits };
  }

  trackUsage(key, amount, metadata = {}) {
    if (!this._limits[key]) throw new Error(`Unknown quota: ${key}`);
    const now = Date.now();
    const dayKey = `daily:${key}:${this._dateKey(now)}`;
    const monthKey = `monthly:${key}:${this._monthKey(now)}`;
    this._increment(dayKey, amount, metadata);
    this._increment(monthKey, amount, metadata);
    return this._checkQuota(key, now);
  }

  getUsage(key, period, date = Date.now()) {
    const pkey = period === 'daily' ? `daily:${key}:${this._dateKey(date)}` : `monthly:${key}:${this._monthKey(date)}`;
    return this._usage.get(pkey) || { key, period, used: 0, limit: this._limits[key]?.[period] || 0, remaining: this._limits[key]?.[period] || 0, pct: 0 };
  }

  getAllUsage(period, date = Date.now()) {
    const results = [];
    for (const key of Object.keys(this._limits)) {
      results.push(this.getUsage(key, period, date));
    }
    return results;
  }

  getQuotaStatus() {
    const daily = this.getAllUsage('daily');
    const monthly = this.getAllUsage('monthly');
    const dailyExceeded = daily.filter(u => u.pct >= 100);
    const monthlyExceeded = monthly.filter(u => u.pct >= 100);
    return { daily, monthly, dailyExceeded, monthlyExceeded, hasExceededQuota: dailyExceeded.length > 0 || monthlyExceeded.length > 0 };
  }

  clear() {
    this._usage.clear();
  }

  _increment(pkey, amount, metadata) {
    if (!this._usage.has(pkey)) {
      const parts = pkey.split(':');
      const key = parts[1];
      const period = parts[0];
      const limit = this._limits[key]?.[period] || 0;
      this._usage.set(pkey, { key, period, used: 0, limit, remaining: limit, pct: 0, metadata: [] });
    }
    const entry = this._usage.get(pkey);
    entry.used += amount;
    entry.remaining = Math.max(0, entry.limit - entry.used);
    entry.pct = entry.limit > 0 ? Math.round((entry.used / entry.limit) * 10000) / 100 : 0;
    if (metadata && Object.keys(metadata).length > 0) {
      entry.metadata.push({ ...metadata, timestamp: Date.now() });
      if (entry.metadata.length > 100) entry.metadata.shift();
    }
  }

  _checkQuota(key, now) {
    const daily = this.getUsage(key, 'daily', now);
    const monthly = this.getUsage(key, 'monthly', now);
    return { key, daily: { used: daily.used, limit: daily.limit, pct: daily.pct, exceeded: daily.pct >= 100 }, monthly: { used: monthly.used, limit: monthly.limit, pct: monthly.pct, exceeded: monthly.pct >= 100 }, exceeded: daily.pct >= 100 || monthly.pct >= 100 };
  }

  _dateKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  _monthKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}

module.exports = { QuotaManager, DEFAULT_QUOTA_LIMITS };
