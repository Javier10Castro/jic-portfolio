class RuntimeApprovals {
  constructor() {
    this._requests = {};
    this._idCounter = 0;
  }

  requestApproval(policy, reason, requestedBy) {
    if (!policy || !reason || !requestedBy) {
      return null;
    }
    this._idCounter++;
    const id = `apr-${this._idCounter}-${Date.now()}`;
    const request = {
      id: id,
      policy: policy,
      reason: reason,
      requestedBy: requestedBy,
      status: 'pending',
      createdAt: Date.now(),
      approvedBy: null,
      rejectedBy: null,
      rejectionReason: null,
      decidedAt: null
    };
    this._requests[id] = request;
    return { id: request.id, policy: request.policy, reason: request.reason, requestedBy: request.requestedBy, status: request.status, createdAt: request.createdAt };
  }

  approve(requestId, approvedBy) {
    if (!requestId || !approvedBy) {
      return false;
    }
    const request = this._requests[requestId];
    if (!request) {
      return false;
    }
    if (request.status !== 'pending') {
      return false;
    }
    request.status = 'approved';
    request.approvedBy = approvedBy;
    request.decidedAt = Date.now();
    return true;
  }

  reject(requestId, rejectedBy, reason) {
    if (!requestId || !rejectedBy) {
      return false;
    }
    const request = this._requests[requestId];
    if (!request) {
      return false;
    }
    if (request.status !== 'pending') {
      return false;
    }
    request.status = 'rejected';
    request.rejectedBy = rejectedBy;
    request.rejectionReason = reason || null;
    request.decidedAt = Date.now();
    return true;
  }

  getRequest(requestId) {
    if (!requestId) {
      return null;
    }
    const request = this._requests[requestId];
    if (!request) {
      return null;
    }
    return {
      id: request.id,
      policy: request.policy,
      reason: request.reason,
      requestedBy: request.requestedBy,
      status: request.status,
      createdAt: request.createdAt,
      approvedBy: request.approvedBy,
      rejectedBy: request.rejectedBy,
      rejectionReason: request.rejectionReason,
      decidedAt: request.decidedAt
    };
  }

  listRequests(filters) {
    let list = [];
    for (const id of Object.keys(this._requests)) {
      list.push(this._requests[id]);
    }
    if (filters) {
      if (filters.status) {
        list = list.filter(function(r) { return r.status === filters.status; });
      }
      if (filters.policy) {
        list = list.filter(function(r) { return r.policy === filters.policy; });
      }
    }
    return list.map(function(r) {
      return {
        id: r.id,
        policy: r.policy,
        reason: r.reason,
        requestedBy: r.requestedBy,
        status: r.status,
        createdAt: r.createdAt,
        approvedBy: r.approvedBy,
        rejectedBy: r.rejectedBy,
        rejectionReason: r.rejectionReason,
        decidedAt: r.decidedAt
      };
    });
  }

  getPending() {
    const result = [];
    for (const id of Object.keys(this._requests)) {
      const r = this._requests[id];
      if (r.status === 'pending') {
        result.push({
          id: r.id,
          policy: r.policy,
          reason: r.reason,
          requestedBy: r.requestedBy,
          status: r.status,
          createdAt: r.createdAt
        });
      }
    }
    return result;
  }

  clear() {
    this._requests = {};
    this._idCounter = 0;
  }
}

module.exports = { RuntimeApprovals };
