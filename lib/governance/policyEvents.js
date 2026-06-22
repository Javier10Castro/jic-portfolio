class PolicyEvents {
  static get EVENTS() {
    return {
      POLICY_CREATED: 'policy.created',
      POLICY_UPDATED: 'policy.updated',
      POLICY_DELETED: 'policy.deleted',
      POLICY_ENABLED: 'policy.enabled',
      POLICY_DISABLED: 'policy.disabled',
      POLICY_EVALUATED: 'policy.evaluated',
      POLICY_ENFORCED: 'policy.enforced',
      POLICY_VIOLATION: 'policy.violation',
      POLICY_APPROVED: 'policy.approved',
      POLICY_REJECTED: 'policy.rejected',
      POLICY_ROLLED_BACK: 'policy.rolled_back',
      COMPLIANCE_SCAN_STARTED: 'compliance.scan.started',
      COMPLIANCE_SCAN_COMPLETED: 'compliance.scan.completed',
      COMPLIANCE_ISSUE_FOUND: 'compliance.issue.found',
      APPROVAL_REQUESTED: 'approval.requested',
      APPROVAL_GRANTED: 'approval.granted',
      APPROVAL_DENIED: 'approval.denied',
      SIMULATION_STARTED: 'simulation.started',
      SIMULATION_COMPLETED: 'simulation.completed',
      AUDIT_RECORDED: 'audit.recorded'
    };
  }

  constructor() {
    this._handlers = new Map();
  }

  on(event, handler) {
    if (!event || typeof handler !== 'function') return;
    if (!this._handlers.has(event)) this._handlers.set(event, []);
    this._handlers.get(event).push(handler);
  }

  off(event, handler) {
    if (!event || !handler) return;
    const handlers = this._handlers.get(event);
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx !== -1) handlers.splice(idx, 1);
    if (handlers.length === 0) this._handlers.delete(event);
  }

  emit(event, data) {
    const handlers = this._handlers.get(event);
    if (!handlers) return;
    handlers.forEach(h => {
      try { h(data); } catch { }
    });
  }

  listEvents() {
    const result = {};
    for (const [event, handlers] of this._handlers.entries()) {
      result[event] = handlers.length;
    }
    return result;
  }

  clear() {
    this._handlers.clear();
  }
}

module.exports = { PolicyEvents };
