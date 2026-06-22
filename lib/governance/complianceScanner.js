const ruleEngine = require('./ruleEngine');

class ComplianceScanner {
  constructor() {
    this.findings = new Map();
    this.nextId = 1;
  }

  checkPolicy(policy, data) {
    if (!policy) return { policyId: 'unknown', compliant: true, issues: [], score: 100 };
    const issues = [];
    if (policy.rules && policy.rules.length > 0) {
      const result = ruleEngine.evaluate(policy.rules, data);
      if (!result.matched) {
        for (const r of result.results) {
          if (!r.matched) issues.push({ field: r.rule.field, expected: r.rule.value, actual: r.actual, operator: r.rule.operator });
        }
      }
    }
    const severityScore = policy.severity === 'critical' ? 50 : policy.severity === 'high' ? 30 : policy.severity === 'medium' ? 20 : 10;
    const score = issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * severityScore));
    return { policyId: policy.id || policy.name || 'unknown', compliant: issues.length === 0, issues, score };
  }

  checkCategory(policies, data) {
    if (!Array.isArray(policies)) return { category: 'unknown', compliant: true, results: [] };
    const results = policies.map(p => this.checkPolicy(p, data));
    return { category: policies[0] && policies[0].category || 'unknown', compliant: results.every(r => r.compliant), results };
  }

  runFullScan(policies, data) {
    if (!Array.isArray(policies)) return [];
    return policies.map(p => this.checkPolicy(p, data));
  }

  getFindings(scanId) {
    return this.findings.get(scanId) || [];
  }

  clear() {
    this.findings.clear();
    this.nextId = 1;
  }
}

module.exports = new ComplianceScanner();
