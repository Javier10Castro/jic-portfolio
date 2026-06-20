class ThreatDetector {
  constructor(options = {}) {
    this._rules = new Map();
    this._detectedThreats = [];
    this._maxThreats = options.maxThreats || 500;
    this._initDefaultRules();
  }

  _initDefaultRules() {
    this.addRule({
      id: 'brute-force',
      name: 'Brute Force Attack',
      description: 'Multiple failed login attempts from same IP',
      severity: 'high',
      condition: { type: 'failed_logins', threshold: 5, window: 300000 }
    });
    this.addRule({
      id: 'impossible-travel',
      name: 'Impossible Travel',
      description: 'Login from geographically distant locations within short time',
      severity: 'critical',
      condition: { type: 'impossible_travel', threshold: 2, window: 3600000 }
    });
    this.addRule({
      id: 'suspicious-ip',
      name: 'Suspicious IP',
      description: 'Request from known suspicious IP range',
      severity: 'medium',
      condition: { type: 'suspicious_ip', patterns: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'] }
    });
    this.addRule({
      id: 'new-device',
      name: 'New Device Login',
      description: 'Login from previously unseen device',
      severity: 'low',
      condition: { type: 'new_device' }
    });
    this.addRule({
      id: 'token-reuse',
      name: 'Token Reuse Attack',
      description: 'Attempt to reuse revoked or rotated token',
      severity: 'critical',
      condition: { type: 'token_reuse' }
    });
  }

  addRule(rule) {
    this._rules.set(rule.id, { ...rule, createdAt: Date.now() });
  }

  removeRule(id) { return this._rules.delete(id); }

  getRule(id) { return this._rules.get(id) || null; }

  listRules() { return Array.from(this._rules.values()); }

  evaluate(event, context = {}) {
    const threats = [];
    for (const rule of this._rules.values()) {
      const result = this._evaluateRule(rule, event, context);
      if (result) threats.push(result);
    }
    for (const t of threats) {
      this._detectedThreats.push(t);
      if (this._detectedThreats.length > this._maxThreats) this._detectedThreats.shift();
    }
    return threats;
  }

  getDetectedThreats(filter = {}) {
    let results = [...this._detectedThreats];
    if (filter.severity) results = results.filter(t => t.severity === filter.severity);
    if (filter.resolved !== undefined) results = results.filter(t => t.resolved === filter.resolved);
    if (filter.since) results = results.filter(t => t.timestamp >= filter.since);
    return results;
  }

  resolveThreat(threatId) {
    const threat = this._detectedThreats.find(t => t.id === threatId);
    if (!threat) return false;
    threat.resolved = true;
    threat.resolvedAt = Date.now();
    return true;
  }

  getStats() {
    const threats = this._detectedThreats;
    return {
      total: threats.length,
      unresolved: threats.filter(t => !t.resolved).length,
      bySeverity: this._countBy(threats, 'severity'),
      byRule: this._countBy(threats, 'ruleId'),
      last24h: threats.filter(t => t.timestamp > Date.now() - 86400000).length
    };
  }

  _evaluateRule(rule, event, context) {
    const c = rule.condition;
    if (c.type === 'failed_logins' && event.type === 'login_failure') {
      const recent = context.recentFailures?.filter(f => f.timestamp > Date.now() - c.window) || [];
      if (recent.length >= c.threshold) {
        return this._createThreat(rule, { attempts: recent.length, window: c.window });
      }
    }
    if (c.type === 'suspicious_ip' && event.ip) {
      if (this._isPrivateIp(event.ip)) {
        return this._createThreat(rule, { ip: event.ip });
      }
    }
    if (c.type === 'new_device' && event.type === 'new_device_login') {
      return this._createThreat(rule, { deviceId: event.deviceId });
    }
    if (c.type === 'token_reuse' && event.type === 'token_reuse') {
      return this._createThreat(rule, { tokenId: event.tokenId });
    }
    return null;
  }

  _createThreat(rule, details) {
    return {
      id: `threat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ruleId: rule.id, name: rule.name, description: rule.description,
      severity: rule.severity, details, timestamp: Date.now(),
      resolved: false, resolvedAt: null
    };
  }

  _isPrivateIp(ip) {
    if (!ip) return false;
    const parts = ip.split('.').map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 127) return true;
    return false;
  }

  _countBy(items, field) {
    const counts = {};
    for (const item of items) {
      const key = item[field] || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  clear() {
    this._detectedThreats = [];
    this._rules.clear();
    this._initDefaultRules();
  }
}

module.exports = { ThreatDetector };
