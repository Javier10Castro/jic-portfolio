class RefundManager {
  constructor(options = {}) {
    this._storage = options.storage;
    this._events = options.events;
    this._refunds = {};
  }

  createRefund(paymentId, amount, reason, options = {}) {
    const refund = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      paymentId, amount, reason: reason || 'requested_by_customer',
      status: 'pending', customerId: options.customerId || null,
      invoiceId: options.invoiceId || null,
      metadata: options.metadata || {},
      createdAt: Date.now()
    };
    this._refunds[refund.id] = refund;
    if (this._storage) this._storage.create('refunds', refund.id, refund);
    if (this._events) this._events.emit('refund.issued', refund);
    return refund;
  }

  processRefund(id) {
    const refund = this._refunds[id];
    if (!refund) return null;
    refund.status = 'processed';
    refund.processedAt = Date.now();
    if (this._storage) this._storage.update('refunds', id, refund);
    return refund;
  }

  failRefund(id, error) {
    const refund = this._refunds[id];
    if (!refund) return null;
    refund.status = 'failed';
    refund.error = error;
    refund.failedAt = Date.now();
    if (this._storage) this._storage.update('refunds', id, refund);
    return refund;
  }

  getRefund(id) { return this._refunds[id] || null; }
  listRefunds(filter) {
    let items = Object.values(this._refunds);
    if (filter) Object.entries(filter).forEach(([k, v]) => { items = items.filter(i => i[k] === v); });
    return items;
  }
  clear() { this._refunds = {}; }
}

module.exports = { RefundManager };
