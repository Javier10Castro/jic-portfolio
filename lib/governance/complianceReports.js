class ComplianceReports {
  constructor() {
    this.reports = new Map();
    this.nextId = 1;
  }

  generate(scanResults) {
    if (!scanResults) return null;
    const findings = (scanResults.results || []).filter(r => !r.compliant);
    const id = `report_${this.nextId++}`;
    const report = {
      id, score: scanResults.score || 0,
      summary: { total: (scanResults.results || []).length, compliant: (scanResults.results || []).filter(r => r.compliant).length, violations: findings.length },
      findings: findings.map(f => ({ policyId: f.policyId, issues: f.issues })),
      timestamp: new Date().toISOString()
    };
    this.reports.set(id, report);
    return report;
  }

  getReport(reportId) {
    return this.reports.get(reportId) || null;
  }

  listReports() {
    return Array.from(this.reports.values());
  }

  exportJSON(reportId) {
    const report = this.reports.get(reportId);
    if (!report) return '{}';
    return JSON.stringify(report, null, 2);
  }

  exportPDF(reportId) {
    const report = this.reports.get(reportId);
    if (!report) return '# Report Not Found';
    let md = `# Compliance Report\n\n**Score:** ${report.score}/100\n**Date:** ${report.timestamp}\n\n## Summary\n- Total Policies: ${report.summary.total}\n- Compliant: ${report.summary.compliant}\n- Violations: ${report.summary.violations}\n\n## Findings\n\n`;
    if (report.findings.length === 0) md += 'No violations found.\n';
    else {
      for (const finding of report.findings) {
        md += `### ${finding.policyId}\n`;
        for (const issue of finding.issues) {
          md += `- Field: ${issue.field}, Expected: ${issue.expected}, Actual: ${issue.actual}\n`;
        }
        md += '\n';
      }
    }
    return md;
  }

  clear() {
    this.reports.clear();
    this.nextId = 1;
  }
}

module.exports = new ComplianceReports();
