class ComplianceExporter {
  constructor(auditLogger) {
    this._logger = auditLogger;
    this._reports = new Map();
  }

  exportTimeRange(since, until, format = 'json') {
    if (typeof since === 'string') since = new Date(since).getTime();
    if (typeof until === 'string') until = new Date(until).getTime();
    const entries = this._logger.query({ since, until });
    return this._formatExport(entries, format);
  }

  exportByAction(action, format = 'json') {
    const entries = this._logger.query({ action });
    return this._formatExport(entries, format);
  }

  exportByUser(userId, format = 'json') {
    const entries = this._logger.query({ actor: userId });
    return this._formatExport(entries, format);
  }

  generateComplianceReport(options = {}) {
    const since = options.since || Date.now() - 86400000 * 30;
    const until = options.until || Date.now();
    const entries = this._logger.query({ since, until });
    const report = {
      reportId: `compliance-${Date.now()}`,
      generatedAt: Date.now(),
      period: { since, until },
      totalEvents: entries.length,
      uniqueActors: new Set(entries.map(e => e.actor)).size,
      actions: this._countBy(entries, 'action'),
      severity: this._countBy(entries, 'severity'),
      outcomes: this._countBy(entries, 'outcome'),
      dailyBreakdown: this._dailyBreakdown(entries),
      recommendations: this._generateRecommendations(entries)
    };
    this._reports.set(report.reportId, report);
    return report;
  }

  getReport(reportId) {
    return this._reports.get(reportId) || null;
  }

  listReports() {
    return Array.from(this._reports.values()).map(r => ({ reportId: r.reportId, generatedAt: r.generatedAt, totalEvents: r.totalEvents }));
  }

  _formatExport(entries, format) {
    if (format === 'csv') return this._toCsv(entries);
    return JSON.stringify(entries, null, 2);
  }

  _toCsv(entries) {
    if (entries.length === 0) return '';
    const headers = ['id', 'timestamp', 'action', 'actor', 'resourceType', 'resourceId', 'severity', 'outcome', 'ip'];
    const rows = entries.map(e => headers.map(h => JSON.stringify(e[h] || '')).join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  _countBy(entries, field) {
    const counts = {};
    for (const e of entries) {
      const key = e[field] || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  _dailyBreakdown(entries) {
    const days = {};
    for (const e of entries) {
      const d = new Date(e.timestamp).toISOString().substring(0, 10);
      if (!days[d]) days[d] = { date: d, count: 0, errors: 0 };
      days[d].count++;
      if (e.outcome === 'failure') days[d].errors++;
    }
    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
  }

  _generateRecommendations(entries) {
    const recs = [];
    const failureRate = entries.filter(e => e.outcome === 'failure').length / (entries.length || 1);
    if (failureRate > 0.1) recs.push('High failure rate detected — review authentication policies');
    const severityCounts = this._countBy(entries, 'severity');
    if ((severityCounts['critical'] || 0) > 5) recs.push('Critical events exceed threshold — investigate immediately');
    return recs;
  }
}

module.exports = { ComplianceExporter };
