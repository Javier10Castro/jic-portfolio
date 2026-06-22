class IntegrationHealth {
  constructor() {
    this._health = {};
  }

  recordSuccess(provider, latency) {
    if (!this._health[provider]) {
      this._health[provider] = this._createDefault();
    }
    const h = this._health[provider];
    h.status = 'healthy';
    h.lastSuccess = Date.now();
    h.latency = latency;
    h.failures = 0;
    h.uptime = h.uptime || 0;
  }

  recordFailure(provider, error) {
    if (!this._health[provider]) {
      this._health[provider] = this._createDefault();
    }
    const h = this._health[provider];
    h.status = 'unhealthy';
    h.lastFailure = Date.now();
    h.failures = (h.failures || 0) + 1;
    h.lastError = error;
    h.uptime = h.uptime || 0;
  }

  recordRateLimit(provider, limit, remaining, reset) {
    if (!this._health[provider]) {
      this._health[provider] = this._createDefault();
    }
    const h = this._health[provider];
    h.rateLimits = { limit, remaining, reset, lastChecked: Date.now() };
    h.quotaUsage = limit > 0 ? ((limit - remaining) / limit) * 100 : 0;
  }

  getHealth(provider) {
    if (!this._health[provider]) return null;
    const h = this._health[provider];
    return {
      status: h.status,
      uptime: h.uptime,
      lastSuccess: h.lastSuccess || null,
      lastFailure: h.lastFailure || null,
      latency: h.latency || null,
      failures: h.failures || 0,
      lastError: h.lastError || null,
      rateLimits: h.rateLimits || null,
      quotaUsage: h.quotaUsage || 0
    };
  }

  getAllHealth() {
    const result = {};
    for (const provider of Object.keys(this._health)) {
      result[provider] = this.getHealth(provider);
    }
    return result;
  }

  clear() {
    this._health = {};
  }

  _createDefault() {
    return { status: 'unknown', uptime: 0, failures: 0 };
  }
}

module.exports = { IntegrationHealth };
