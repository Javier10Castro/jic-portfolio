class PolicyReporter {
  constructor(registry, events, metrics, simulator) {
    this._registry = registry;
    this._events = events;
    this._metrics = metrics;
    this._simulator = simulator;
    this._reports = new Map();
  }

  generate(filters) {
    const policies = this._registry ? this._registry.getAll() : [];
    const filtered = filters ? this._registry.list(filters) : policies;
    const enabledPolicies = policies.filter(p => p.enabled);
    const violations = this._simulator ? this._simulator.getHistory({ matched: true }).length : 0;
    const approvals = {
      pending: 0,
      approved: 0,
      rejected: 0
    };
    const typeCounts = {};
    const severityCounts = {};
    const enforcementCounts = {};
    for (const p of policies) {
      typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
      severityCounts[p.severity] = (severityCounts[p.severity] || 0) + 1;
      enforcementCounts[p.enforcement] = (enforcementCounts[p.enforcement] || 0) + 1;
    }
    const totalPolicies = policies.length;
    const complianceScore = totalPolicies > 0 ? Math.round(((totalPolicies - violations) / totalPolicies) * 100) : 100;
    const report = {
      id: `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      generatedAt: new Date().toISOString(),
      filters: filters || {},
      summary: {
        totalPolicies,
        enabledPolicies: enabledPolicies.length,
        disabledPolicies: totalPolicies - enabledPolicies.length,
        filteredCount: filtered.length,
        matchCount: filtered.length,
        violations,
        complianceScore
      },
      breakdowns: {
        byType: typeCounts,
        bySeverity: severityCounts,
        byEnforcement: enforcementCounts
      },
      approvals,
      policies: filtered.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        severity: p.severity,
        enforcement: p.enforcement,
        enabled: p.enabled,
        version: p.version
      }))
    };
    this._reports.set(report.id, report);
    return report;
  }

  getReportById(id) {
    if (!id) return null;
    return this._reports.get(id) || null;
  }

  listReports() {
    return Array.from(this._reports.values());
  }

  exportCSV(reportId) {
    const report = this._reports.get(reportId);
    if (!report) return '';
    const rows = [['Policy ID', 'Name', 'Type', 'Severity', 'Enforcement', 'Enabled', 'Version', 'Compliance Score']];
    for (const p of report.policies) {
      rows.push([p.id, p.name, p.type, p.severity, p.enforcement, String(p.enabled), String(p.version), String(report.summary.complianceScore)]);
    }
    return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  clear() {
    this._reports.clear();
  }
}

module.exports = { PolicyReporter };
