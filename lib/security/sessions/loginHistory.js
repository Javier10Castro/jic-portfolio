class LoginHistory {
  constructor() {
    this._attempts = [];
    this._maxAttempts = 5000;
  }

  record(entry) {
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: Date.now(),
      userId: entry.userId,
      email: entry.email,
      ip: entry.ip || '0.0.0.0',
      userAgent: entry.userAgent || '',
      success: entry.success,
      method: entry.method || 'password',
      failureReason: entry.failureReason || null,
      provider: entry.provider || 'local'
    };
    this._attempts.push(record);
    if (this._attempts.length > this._maxAttempts) this._attempts.shift();
    return record;
  }

  getRecent(limit = 20) {
    return this._attempts.slice(-limit).reverse();
  }

  getByUser(userId, limit = 50) {
    return this._attempts.filter(a => a.userId === userId).slice(-limit).reverse();
  }

  getByEmail(email, limit = 50) {
    return this._attempts.filter(a => a.email === email).slice(-limit).reverse();
  }

  getFailedAttempts(userId, since) {
    const sinceTime = since || Date.now() - 3600000;
    return this._attempts.filter(a => a.userId === userId && !a.success && a.timestamp > sinceTime);
  }

  getRecentLogins(limit = 10) {
    return this._attempts.filter(a => a.success).slice(-limit).reverse();
  }

  getStats() {
    const total = this._attempts.length;
    const successful = this._attempts.filter(a => a.success).length;
    return {
      total,
      successful,
      failed: total - successful,
      successRate: total > 0 ? Math.round((successful / total) * 10000) / 100 : 0,
      last24h: this._attempts.filter(a => a.timestamp > Date.now() - 86400000).length,
      failed24h: this._attempts.filter(a => !a.success && a.timestamp > Date.now() - 86400000).length,
      byMethod: this._countBy('method'),
      byProvider: this._countBy('provider')
    };
  }

  _countBy(field) {
    const counts = {};
    for (const a of this._attempts) {
      const key = a[field] || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  clear() {
    this._attempts = [];
  }
}

module.exports = { LoginHistory };
