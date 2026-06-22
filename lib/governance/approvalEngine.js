const EventEmitter = require('events');

class ApprovalEngine {
  constructor() {
    this.approvals = new Map();
    this.emitter = new EventEmitter();
    this.nextId = 1;
  }

  createApproval(request) {
    if (!request) return null;
    const id = `appr_${this.nextId++}`;
    const approval = {
      id, policyId: request.policyId, reason: request.reason,
      requestedBy: request.requestedBy, approvers: request.approvers || [],
      workflow: request.workflow || 'default',
      expiresAt: request.expiresAt || null,
      status: 'pending', createdAt: new Date().toISOString(),
      decisions: []
    };
    this.approvals.set(id, approval);
    this.emitter.emit('approval.created', approval);
    return approval;
  }

  processApproval(approvalId, decision, actor, reason) {
    const approval = this.approvals.get(approvalId);
    if (!approval || approval.status !== 'pending') return null;
    if (decision !== 'approved' && decision !== 'rejected') return null;
    approval.status = decision;
    approval.decisions.push({ decision, actor, reason, timestamp: new Date().toISOString() });
    this.emitter.emit(`approval.${decision}`, approval);
    return approval;
  }

  getApproval(approvalId) {
    return this.approvals.get(approvalId) || null;
  }

  listApprovals(filters) {
    if (!filters) return Array.from(this.approvals.values());
    return Array.from(this.approvals.values()).filter(a => {
      if (filters.status && a.status !== filters.status) return false;
      if (filters.policyId && a.policyId !== filters.policyId) return false;
      if (filters.requestedBy && a.requestedBy !== filters.requestedBy) return false;
      return true;
    });
  }

  getPendingApprovals() {
    return Array.from(this.approvals.values()).filter(a => a.status === 'pending');
  }

  checkApprovalRequired(policy, context) {
    if (!policy || !context) return false;
    if (policy.requiresApproval) return true;
    if (policy.approvalThreshold !== undefined) {
      const value = context.value || 0;
      if (value > policy.approvalThreshold) return true;
    }
    return false;
  }

  clear() {
    this.approvals.clear();
    this.emitter.removeAllListeners();
    this.nextId = 1;
  }
}

module.exports = new ApprovalEngine();
