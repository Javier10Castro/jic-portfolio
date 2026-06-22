const EventEmitter = require('events');

class ApprovalManager {
  constructor() {
    this.requests = new Map();
    this.emitter = new EventEmitter();
    this.nextId = 1;
  }

  createRequest(policyId, reason, requestedBy) {
    if (!policyId || !requestedBy) return null;
    const id = `req_${this.nextId++}`;
    const request = {
      id, policyId, reason: reason || '', requestedBy,
      status: 'pending', createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), decisions: []
    };
    this.requests.set(id, request);
    this.emitter.emit('request.created', request);
    return request;
  }

  approve(requestId, approvedBy) {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'pending') return null;
    request.status = 'approved';
    request.updatedAt = new Date().toISOString();
    request.decisions.push({ action: 'approved', by: approvedBy, timestamp: new Date().toISOString() });
    this.emitter.emit('request.approved', request);
    return request;
  }

  reject(requestId, rejectedBy, reason) {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'pending') return null;
    request.status = 'rejected';
    request.updatedAt = new Date().toISOString();
    request.decisions.push({ action: 'rejected', by: rejectedBy, reason: reason || '', timestamp: new Date().toISOString() });
    this.emitter.emit('request.rejected', request);
    return request;
  }

  cancel(requestId) {
    const request = this.requests.get(requestId);
    if (!request || request.status === 'approved' || request.status === 'rejected') return null;
    request.status = 'cancelled';
    request.updatedAt = new Date().toISOString();
    this.emitter.emit('request.cancelled', request);
    return request;
  }

  getRequest(requestId) {
    return this.requests.get(requestId) || null;
  }

  listRequests(filters) {
    if (!filters) return Array.from(this.requests.values());
    return Array.from(this.requests.values()).filter(r => {
      if (filters.status && r.status !== filters.status) return false;
      if (filters.policyId && r.policyId !== filters.policyId) return false;
      if (filters.requestedBy && r.requestedBy !== filters.requestedBy) return false;
      return true;
    });
  }

  getStats() {
    const all = Array.from(this.requests.values());
    return {
      total: all.length,
      pending: all.filter(r => r.status === 'pending').length,
      approved: all.filter(r => r.status === 'approved').length,
      rejected: all.filter(r => r.status === 'rejected').length,
      cancelled: all.filter(r => r.status === 'cancelled').length
    };
  }

  clear() {
    this.requests.clear();
    this.emitter.removeAllListeners();
    this.nextId = 1;
  }
}

module.exports = new ApprovalManager();
