class BaseIntegration {
  constructor(config = {}) {
    this.name = this.constructor.name;
    this.config = config;
    this.oauthConfig = config.oauth || {};
    this.connected = false;
    this.connectedAt = null;
  }

  connect() {
    this.connected = true;
    this.connectedAt = new Date().toISOString();
    return { success: true, connectedAt: this.connectedAt };
  }

  disconnect() {
    this.connected = false;
    this.connectedAt = null;
    return { success: true };
  }

  async testConnection() {
    const start = Date.now();
    try {
      await this._request('GET', '/');
      return { success: true, latency: Date.now() - start };
    } catch (err) {
      return { success: false, latency: Date.now() - start, error: err.message };
    }
  }

  getProviderInfo() {
    return {
      name: this.name,
      version: this.version || '1.0.0',
      type: this.type || 'unknown',
      authType: this.authType || 'none',
    };
  }

  getRateLimits() {
    return { limit: 5000, remaining: 4999, reset: Math.floor(Date.now() / 1000) + 3600 };
  }

  handleRateLimit(response) {
    if (!response || !response.headers) return { limited: false };
    const headers = response.headers;
    const remaining = parseInt(headers['x-ratelimit-remaining'], 10);
    if (isNaN(remaining)) return { limited: false };
    return {
      limited: remaining <= 0,
      limit: parseInt(headers['x-ratelimit-limit'], 10),
      remaining,
      reset: parseInt(headers['x-ratelimit-reset'], 10),
    };
  }

  _request(method, path, data) {
    throw new Error('Subclass must implement _request(method, path, data)');
  }
}

module.exports = { BaseIntegration };
