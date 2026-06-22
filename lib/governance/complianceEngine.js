const complianceScanner = require('./complianceScanner');

class ComplianceEngine {
  constructor() {
    this.scans = new Map();
    this.nextId = 1;
  }

  scan(policies, data) {
    if (!Array.isArray(policies)) return null;
    const results = complianceScanner.runFullScan(policies, data);
    const id = `scan_${this.nextId++}`;
    const compliantCount = results.filter(r => r.compliant).length;
    const score = results.length > 0 ? Math.round((compliantCount / results.length) * 100) : 100;
    const scan = { id, results, score, timestamp: new Date().toISOString(), status: 'completed' };
    this.scans.set(id, scan);
    return scan;
  }

  getScan(scanId) {
    return this.scans.get(scanId) || null;
  }

  listScans(filters) {
    let all = Array.from(this.scans.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (!filters) return all;
    if (filters.status) all = all.filter(s => s.status === filters.status);
    if (filters.type) all = all.filter(s => s.type === filters.type);
    if (filters.limit) all = all.slice(0, filters.limit);
    return all;
  }

  getComplianceScore() {
    const recent = Array.from(this.scans.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    if (recent.length === 0) return 100;
    const total = recent.reduce((sum, s) => sum + s.score, 0);
    return Math.round(total / recent.length);
  }

  getViolations() {
    const violations = [];
    for (const scan of this.scans.values()) {
      for (const result of scan.results) {
        if (!result.compliant) violations.push({ scanId: scan.id, ...result });
      }
    }
    return violations;
  }

  clear() {
    this.scans.clear();
    this.nextId = 1;
  }
}

module.exports = new ComplianceEngine();
