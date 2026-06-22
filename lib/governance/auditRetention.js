const auditTimeline = require('./auditTimeline');

class AuditRetention {
  constructor() {
    this.retentionDays = 365;
    this.lastPurge = null;
  }

  setRetentionPeriod(days) {
    if (typeof days !== 'number' || days <= 0) return;
    this.retentionDays = days;
  }

  getRetentionPeriod() {
    return this.retentionDays;
  }

  applyRetention() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionDays);
    const cutoffStr = cutoff.toISOString();
    const initialCount = auditTimeline.entries.length;
    auditTimeline.entries = auditTimeline.entries.filter(e => e.timestamp >= cutoffStr);
    this.lastPurge = new Date().toISOString();
    return initialCount - auditTimeline.entries.length;
  }

  getRetentionStats() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionDays);
    const cutoffStr = cutoff.toISOString();
    const entriesToPurge = auditTimeline.entries.filter(e => e.timestamp < cutoffStr).length;
    return {
      retentionDays: this.retentionDays,
      totalEntries: auditTimeline.entries.length,
      entriesToPurge,
      lastPurge: this.lastPurge
    };
  }

  clear() {
    this.retentionDays = 365;
    this.lastPurge = null;
  }
}

module.exports = new AuditRetention();
