const { PolicyRegistry } = require('./policyRegistry');
const { PolicyCompiler } = require('./policyCompiler');
const { PolicyEvaluator } = require('./policyEvaluator');
const { PolicyExecutor } = require('./policyExecutor');
const { PolicyStorage } = require('./policyStorage');
const { PolicyEvents } = require('./policyEvents');
const { PolicyMetrics } = require('./policyMetrics');
const { PolicyScheduler } = require('./policyScheduler');
const { PolicySimulator } = require('./policySimulator');
const { PolicyReporter } = require('./policyReporter');

class GovernanceManager {
  constructor() {
    this._registry = new PolicyRegistry();
    this._compiler = new PolicyCompiler();
    this._evaluator = new PolicyEvaluator();
    this._executor = new PolicyExecutor();
    this._storage = new PolicyStorage();
    this._events = new PolicyEvents();
    this._metrics = new PolicyMetrics();
    this._scheduler = new PolicyScheduler();
    this._simulator = new PolicySimulator();
    this._reporter = new PolicyReporter(this._registry, this._events, this._metrics, this._simulator);
    this._uptime = Date.now();
    this._approvals = new Map();
    this._activeScans = new Set();
  }

  get registry() { return this._registry; }
  get compiler() { return this._compiler; }
  get evaluator() { return this._evaluator; }
  get executor() { return this._executor; }
  get storage() { return this._storage; }
  get events() { return this._events; }
  get metrics() { return this._metrics; }
  get scheduler() { return this._scheduler; }
  get simulator() { return this._simulator; }
  get reporter() { return this._reporter; }

  getStatus() {
    const allPolicies = this._registry.getAll();
    return {
      version: '1.0.0',
      policyCount: allPolicies.length,
      enabledCount: allPolicies.filter(p => p.enabled).length,
      activeComplianceScans: this._activeScans.size,
      pendingApprovals: Array.from(this._approvals.values()).filter(a => a.status === 'pending').length,
      totalViolations: this._metrics ? (this._metrics.aggregate('violation', 'count') || 0) : 0,
      uptime: Date.now() - this._uptime
    };
  }

  createPolicy(policy) {
    const registered = this._registry.register(policy);
    this._compiler.compile(registered);
    this._events.emit(this._events.constructor.EVENTS.POLICY_CREATED, { policy: registered });
    this._metrics.record('policy.created', 1, { type: policy.type });
    return registered;
  }

  evaluatePolicy(policyId, data) {
    const compiled = this._compiler.getCompiled(policyId);
    if (!compiled) throw new Error(`Policy '${policyId}' not compiled`);
    const evaluation = this._evaluator.evaluate(compiled, data);
    const canExec = this._executor.canExecute(compiled, {});
    let execution = null;
    if (evaluation.matched && canExec) {
      execution = this._executor.execute(compiled, evaluation, { data });
    } else if (evaluation.matched && !canExec) {
      execution = { policyId, matched: true, actions: [] };
    } else {
      execution = { policyId, matched: false, actions: [] };
    }
    this._events.emit(this._events.constructor.EVENTS.POLICY_EVALUATED, { policyId, evaluation, execution });
    if (evaluation.matched) {
      this._metrics.record('violation', 1, { policyId, type: compiled.type });
      this._events.emit(this._events.constructor.EVENTS.POLICY_VIOLATION, { policyId, evaluation, execution });
    }
    this._metrics.record('policy.evaluated', 1, { policyId });
    return { policyId, matched: evaluation.matched, evaluation, execution };
  }

  evaluateAll(data) {
    const allPolicies = this._registry.list({ enabled: true });
    const results = allPolicies.map(p => {
      const compiled = this._compiler.getCompiled(p.id);
      if (!compiled) return { policyId: p.id, matched: false, evaluation: null, execution: null };
      return this.evaluatePolicy(p.id, data);
    });
    const matched = results.filter(r => r.matched);
    const blocked = matched.filter(r => r.execution && r.execution.actions.some(a => a.type === 'deny' || a.type === 'block'));
    const warnings = matched.filter(r => r.execution && r.execution.actions.some(a => a.type === 'warn'));
    return { results, matched: matched.length, blocked: blocked.length, warnings: warnings.length, timestamp: new Date().toISOString() };
  }

  simulate(policyId, data) {
    const policy = this._registry.get(policyId);
    if (!policy) throw new Error(`Policy '${policyId}' not found`);
    this._events.emit(this._events.constructor.EVENTS.SIMULATION_STARTED, { policyId });
    const result = this._simulator.simulate(policy, data);
    this._events.emit(this._events.constructor.EVENTS.SIMULATION_COMPLETED, { policyId, result });
    return result;
  }

  simulateAll(data) {
    const allPolicies = this._registry.getAll();
    this._events.emit(this._events.constructor.EVENTS.SIMULATION_STARTED, { all: true });
    const results = this._simulator.simulateAll(allPolicies, data);
    this._events.emit(this._events.constructor.EVENTS.SIMULATION_COMPLETED, { all: true, count: results.length });
    return results;
  }

  runComplianceScan(opts) {
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this._activeScans.add(scanId);
    this._events.emit(this._events.constructor.EVENTS.COMPLIANCE_SCAN_STARTED, { scanId, opts });
    const policies = opts && opts.policyIds ? opts.policyIds.map(id => this._registry.get(id)).filter(Boolean) : this._registry.getAll();
    const data = opts && opts.data ? opts.data : {};
    const issues = [];
    for (const p of policies) {
      const result = this._evaluator.evaluate(p, data);
      if (result.matched) {
        issues.push({ policyId: p.id, policyName: p.name, severity: p.severity, details: result.results });
        this._events.emit(this._events.constructor.EVENTS.COMPLIANCE_ISSUE_FOUND, { policyId: p.id, result });
      }
    }
    this._activeScans.delete(scanId);
    const scanResult = { scanId, issues, totalPolicies: policies.length, issuesFound: issues.length, timestamp: new Date().toISOString() };
    this._events.emit(this._events.constructor.EVENTS.COMPLIANCE_SCAN_COMPLETED, scanResult);
    return scanResult;
  }

  requestApproval(policyId, reason, requestedBy) {
    const policy = this._registry.get(policyId);
    if (!policy) throw new Error(`Policy '${policyId}' not found`);
    const approval = {
      id: `appr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      policyId,
      reason: reason || '',
      requestedBy: requestedBy || 'unknown',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this._approvals.set(approval.id, approval);
    this._events.emit(this._events.constructor.EVENTS.APPROVAL_REQUESTED, approval);
    return approval;
  }

  approve(approvalId, approvedBy) {
    const approval = this._approvals.get(approvalId);
    if (!approval) throw new Error(`Approval '${approvalId}' not found`);
    approval.status = 'approved';
    approval.approvedBy = approvedBy || 'unknown';
    approval.approvedAt = new Date().toISOString();
    this._events.emit(this._events.constructor.EVENTS.APPROVAL_GRANTED, approval);
    this._events.emit(this._events.constructor.EVENTS.POLICY_APPROVED, approval);
    return approval;
  }

  reject(approvalId, rejectedBy, reason) {
    const approval = this._approvals.get(approvalId);
    if (!approval) throw new Error(`Approval '${approvalId}' not found`);
    approval.status = 'rejected';
    approval.rejectedBy = rejectedBy || 'unknown';
    approval.rejectionReason = reason || '';
    approval.rejectedAt = new Date().toISOString();
    this._events.emit(this._events.constructor.EVENTS.APPROVAL_DENIED, approval);
    this._events.emit(this._events.constructor.EVENTS.POLICY_REJECTED, approval);
    return approval;
  }

  rollback(policyId, version) {
    const policy = this._registry.get(policyId);
    if (!policy) throw new Error(`Policy '${policyId}' not found`);
    const oldVersion = policy.version;
    const rolledBack = {
      ...policy,
      version: version || 1,
      updatedAt: new Date().toISOString()
    };
    this._registry.unregister(policyId);
    this._registry.register(rolledBack);
    this._compiler.compile(rolledBack);
    this._events.emit(this._events.constructor.EVENTS.POLICY_ROLLED_BACK, { policyId, fromVersion: oldVersion, toVersion: rolledBack.version });
    this._metrics.record('policy.rolled_back', 1, { policyId });
    return rolledBack;
  }

  clear() {
    this._registry.clear();
    this._compiler.clear();
    this._evaluator.clear();
    this._executor.clear();
    this._storage.clear();
    this._events.clear();
    this._metrics.clear();
    this._scheduler.clear();
    this._simulator.clear();
    this._reporter.clear();
    this._approvals.clear();
    this._activeScans.clear();
    this._uptime = Date.now();
  }
}

module.exports = { GovernanceManager };
