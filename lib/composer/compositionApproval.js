class CompositionApproval {
  constructor() {
    this._approvals = new Map();
    this._counter = 0;
  }

  requestApproval(compositionId, approver) {
    if (!compositionId || !approver) return null;
    const id = `approval_${++this._counter}`;
    const entry = {
      id,
      compositionId,
      approver,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this._approvals.set(compositionId, entry);
    return entry;
  }

  approve(compositionId, approver) {
    if (!compositionId || !approver) return null;
    const entry = this._approvals.get(compositionId);
    if (!entry) return null;
    if (entry.status !== 'pending') return null;
    entry.status = 'approved';
    entry.approver = approver;
    entry.updatedAt = Date.now();
    return entry;
  }

  reject(compositionId, approver, reason) {
    if (!compositionId || !approver) return null;
    const entry = this._approvals.get(compositionId);
    if (!entry) return null;
    if (entry.status !== 'pending') return null;
    entry.status = 'rejected';
    entry.approver = approver;
    entry.reason = reason || 'No reason provided';
    entry.updatedAt = Date.now();
    return entry;
  }

  getApprovalStatus(compositionId) {
    if (!compositionId) return null;
    return this._approvals.get(compositionId) || null;
  }

  listPending() {
    return Array.from(this._approvals.values()).filter(
      (a) => a.status === 'pending'
    );
  }

  clear() {
    this._approvals.clear();
    this._counter = 0;
  }
}

module.exports = { CompositionApproval };
