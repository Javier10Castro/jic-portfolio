class RiskScorer {
  constructor() {
    this._scores = new Map();
    this._scoreHistory = new Map();
  }

  calculate(entityId, context = {}) {
    let score = 0;
    let factors = [];
    if (context.failedLogins && context.failedLogins > 5) { score += 30; factors.push({ name: 'Multiple failed logins', weight: 30 }); }
    if (context.newDevice) { score += 15; factors.push({ name: 'New device', weight: 15 }); }
    if (context.suspiciousIp) { score += 25; factors.push({ name: 'Suspicious IP', weight: 25 }); }
    if (context.mfaDisabled) { score += 20; factors.push({ name: 'MFA disabled', weight: 20 }); }
    if (context.passwordAge && context.passwordAge > 90) { score += 10; factors.push({ name: 'Password expired', weight: 10 }); }
    if (context.multipleSessions && context.multipleSessions > 10) { score += 10; factors.push({ name: 'Multiple active sessions', weight: 10 }); }
    if (context.recentThreats && context.recentThreats > 2) { score += 25; factors.push({ name: 'Recent threats', weight: 25 }); }
    if (context.sensitiveAction) { score += 5; factors.push({ name: 'Sensitive action', weight: 5 }); }
    if (context.ipMismatch) { score += 20; factors.push({ name: 'IP location mismatch', weight: 20 }); }
    score = Math.min(100, score);
    const level = score >= 70 ? 'critical' : score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low';
    const result = { entityId, score, level, factors, timestamp: Date.now() };
    if (!this._scoreHistory.has(entityId)) this._scoreHistory.set(entityId, []);
    this._scoreHistory.get(entityId).push(result);
    this._scores.set(entityId, result);
    return result;
  }

  getScore(entityId) {
    return this._scores.get(entityId) || { entityId, score: 0, level: 'low', factors: [] };
  }

  getHistory(entityId, limit = 20) {
    const history = this._scoreHistory.get(entityId) || [];
    return history.slice(-limit);
  }

  getEntitiesByRisk(level) {
    return Array.from(this._scores.values()).filter(s => s.level === level);
  }

  getSummary() {
    const all = Array.from(this._scores.values());
    return {
      total: all.length,
      critical: all.filter(s => s.level === 'critical').length,
      high: all.filter(s => s.level === 'high').length,
      medium: all.filter(s => s.level === 'medium').length,
      low: all.filter(s => s.level === 'low').length,
      averageScore: all.length > 0 ? Math.round(all.reduce((sum, s) => sum + s.score, 0) / all.length) : 0
    };
  }

  clear() {
    this._scores.clear();
    this._scoreHistory.clear();
  }
}

module.exports = { RiskScorer };
