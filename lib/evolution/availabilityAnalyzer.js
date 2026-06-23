class AvailabilityAnalyzer {
  constructor() {
    this._analyses = [];
    this._counter = 0;
  }

  analyze(evolutionId, availabilityData) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'avl_an_' + (++this._counter);
    const ad = availabilityData || {};
    const issues = [];
    if (ad.uptime && ad.uptime < 99.9) {
      issues.push({ type: 'low_uptime', value: ad.uptime, threshold: 99.9, severity: 'high' });
    }
    if (ad.recoveryTime && ad.recoveryTime > 60) {
      issues.push({ type: 'slow_recovery', value: ad.recoveryTime, threshold: 60, severity: 'high' });
    }
    if (ad.redundancy === false || ad.redundancy === 0) {
      issues.push({ type: 'no_redundancy', severity: 'critical' });
    }
    if (ad.failover === false) {
      issues.push({ type: 'no_failover', severity: 'critical' });
    }
    if (ad.backupFrequency && ad.backupFrequency > 86400) {
      issues.push({ type: 'infrequent_backup', value: ad.backupFrequency, threshold: 86400, severity: 'medium' });
    }
    const score = issues.length === 0 ? 1 : Math.max(0, 1 - issues.length * 0.2);
    const analysis = {
      id, evolutionId, score, issues,
      timestamp: new Date().toISOString()
    };
    this._analyses.push(analysis);
    return analysis;
  }

  get(id) {
    if (!id) return null;
    return this._analyses.find(a => a.id === id) || null;
  }

  list() {
    return this._analyses;
  }

  clear() {
    this._analyses = [];
    this._counter = 0;
  }
}

module.exports = { AvailabilityAnalyzer };
