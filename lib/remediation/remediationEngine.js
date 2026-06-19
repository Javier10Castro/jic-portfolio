const { RemediationActions } = require('./remediationActions');
const { RemediationPolicies } = require('./remediationPolicies');
const RemediationStore = require('./remediationStore');

class RemediationEngine {
  constructor(options = {}) {
    this._actions = new RemediationActions(options.actions || {});
    this._policies = new RemediationPolicies(options.policies || {});
    this._store = options.store || new RemediationStore(options.store || {});
    this._enabled = true;
    this._autoExecute = options.autoExecute !== false;
    this._pendingApprovals = new Map();
    this._totalEvaluated = 0;
    this._totalExecuted = 0;
    this._eventBus = options.eventBus || null;
    this._onAction = options.onAction || null;
    this._processingTime = 0;
  }

  get actions() { return this._actions; }
  get policies() { return this._policies; }
  get store() { return this._store; }

  enable() { this._enabled = true; }
  disable() { this._enabled = false; }
  isEnabled() { return this._enabled; }

  async ingest(event) {
    if (!this._enabled) return [];
    const start = Date.now();
    this._totalEvaluated++;

    const matchedPolicies = this._policies.evaluate(event);
    const results = [];

    for (const policy of matchedPolicies) {
      if (this._policies.checkApprovalRequired(policy)) {
        const approvalId = this._createApproval(policy, event);
        results.push({ policyId: policy.id, action: policy.action, status: 'pending_approval', approvalId });
        if (this._eventBus) {
          try {
            this._eventBus.emit('remediation.approval.required', { approvalId, policy, event, timestamp: Date.now() }, { source: 'remediation' });
          } catch (e) {}
        }
        continue;
      }

      const result = await this._executeAction(policy, event);
      results.push(result);
    }

    const elapsed = Date.now() - start;
    this._processingTime += elapsed;

    return results;
  }

  async _executeAction(policy, event) {
    this._policies.markExecuted(policy);
    this._totalExecuted++;

    const params = this._buildActionParams(policy, event);
    const result = await this._actions.execute(policy.action, params, { policy, event });

    const historyEntry = {
      id: result.actionId,
      policyId: policy.id,
      policyName: policy.name,
      action: policy.action,
      params,
      success: result.success,
      simulated: result.simulated,
      message: result.message,
      duration: result.duration,
      timestamp: result.timestamp,
      triggeredBy: event.type,
      eventId: event.id || null,
    };
    this._store.addHistory(historyEntry);

    if (this._onAction) {
      try { this._onAction(historyEntry, event); } catch (e) {}
    }

    if (this._eventBus) {
      try {
        this._eventBus.emit('remediation.action.executed', historyEntry, { source: 'remediation' });
      } catch (e) {}
    }

    return {
      policyId: policy.id,
      action: policy.action,
      status: result.success ? 'executed' : 'failed',
      actionId: result.actionId,
      simulated: result.simulated,
      message: result.message,
      duration: result.duration,
    };
  }

  requestApproval(policyId, event) {
    const policy = this._policies.getPolicy(policyId);
    if (!policy) throw new Error(`Policy '${policyId}' not found`);
    return this._createApproval(policy, event);
  }

  approveAction(approvalId) {
    const pending = this._pendingApprovals.get(approvalId);
    if (!pending) throw new Error(`Approval '${approvalId}' not found or expired`);
    this._pendingApprovals.delete(approvalId);
    return this._executeAction(pending.policy, pending.event);
  }

  rejectAction(approvalId) {
    const pending = this._pendingApprovals.get(approvalId);
    if (!pending) throw new Error(`Approval '${approvalId}' not found or expired`);
    this._pendingApprovals.delete(approvalId);

    const entry = {
      id: 'rejected-' + approvalId,
      policyId: pending.policy.id,
      policyName: pending.policy.name,
      action: pending.policy.action,
      success: false,
      message: 'Action rejected by operator',
      timestamp: Date.now(),
      triggeredBy: pending.event.type,
    };
    this._store.addHistory(entry);

    if (this._eventBus) {
      try {
        this._eventBus.emit('remediation.approval.rejected', entry, { source: 'remediation' });
      } catch (e) {}
    }

    return { status: 'rejected', approvalId };
  }

  getPendingApprovals() {
    return Array.from(this._pendingApprovals.entries()).map(([id, p]) => ({
      approvalId: id,
      policyId: p.policy.id,
      policyName: p.policy.name,
      action: p.policy.action,
      triggeredBy: p.event.type,
      createdAt: p.createdAt,
      age: Date.now() - p.createdAt,
    }));
  }

  getHealth() {
    return {
      enabled: this._enabled,
      autoExecute: this._autoExecute,
      totalEvaluated: this._totalEvaluated,
      totalExecuted: this._totalExecuted,
      pendingApprovals: this._pendingApprovals.size,
      inFlightActions: this._actions.getInFlightCount(),
      historyCount: this._store.getHistory().length,
      policyCount: this._policies.getPolicies().length,
      averageProcessingMs: this._totalEvaluated > 0
        ? Math.round((this._processingTime / this._totalEvaluated) * 100) / 100
        : 0,
    };
  }

  _createApproval(policy, event) {
    const approvalId = 'approval-' + Math.random().toString(36).substring(2, 10);
    this._pendingApprovals.set(approvalId, { policy, event, createdAt: Date.now() });
    return approvalId;
  }

  _buildActionParams(policy, event) {
    let params = { ...(policy.actionParams || {}) };
    if (params.nodeId === ':from_event' && event.detail?.source) {
      params.nodeId = event.detail.source;
    }
    if (params.workerId === ':from_event' && event.detail?.source) {
      params.workerId = event.detail.source;
    }
    if (params.target === ':from_event' && event.detail?.source) {
      params.target = event.detail.source;
    }
    if (params.message === ':from_event' && event.insight) {
      params.message = event.insight;
    }
    return params;
  }

  clear() {
    this._actions.clear();
    this._policies.clear();
    this._store.clear();
    this._pendingApprovals.clear();
    this._totalEvaluated = 0;
    this._totalExecuted = 0;
    this._processingTime = 0;
  }
}

module.exports = RemediationEngine;
