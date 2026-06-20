class InvoiceManager {
  constructor(options = {}) {
    this._storage = options.storage;
    this._events = options.events;
    this._invoices = {};
  }

  createInvoice(options = {}) {
    const { customerId, subscriptionId, items, amount, currency = 'usd', dueDate } = options;
    const invoice = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      number: options.number || `INV-${Date.now()}`,
      customerId, subscriptionId: subscriptionId || null,
      items: items || [],
      subtotal: amount || 0, discount: options.discount || 0,
      tax: options.tax || 0, total: (amount || 0) - (options.discount || 0) + (options.tax || 0),
      currency, status: 'draft', dueDate: dueDate || Date.now() + 30 * 86400000,
      paidAt: null, voidAt: null, metadata: options.metadata || {},
      createdAt: Date.now()
    };
    this._invoices[invoice.id] = invoice;
    if (this._storage) this._storage.create('invoices', invoice.id, invoice);
    if (this._events) this._events.emit('invoice.created', invoice);
    return invoice;
  }

  finalizeInvoice(id) {
    const inv = this._invoices[id];
    if (!inv) return null;
    inv.status = 'open';
    inv.finalizedAt = Date.now();
    if (this._storage) this._storage.update('invoices', id, inv);
    return inv;
  }

  payInvoice(id, paymentId) {
    const inv = this._invoices[id];
    if (!inv) return null;
    inv.status = 'paid';
    inv.paidAt = Date.now();
    inv.paymentId = paymentId;
    if (this._storage) this._storage.update('invoices', id, inv);
    if (this._events) this._events.emit('invoice.paid', inv);
    return inv;
  }

  failInvoice(id, reason) {
    const inv = this._invoices[id];
    if (!inv) return null;
    inv.status = 'failed';
    inv.failureReason = reason;
    if (this._storage) this._storage.update('invoices', id, inv);
    if (this._events) this._events.emit('invoice.failed', inv);
    return inv;
  }

  voidInvoice(id) {
    const inv = this._invoices[id];
    if (!inv) return null;
    inv.status = 'void';
    inv.voidAt = Date.now();
    if (this._storage) this._storage.update('invoices', id, inv);
    return inv;
  }

  getInvoice(id) { return this._invoices[id] || null; }
  listInvoices(filter) {
    let items = Object.values(this._invoices);
    if (filter) Object.entries(filter).forEach(([k, v]) => { items = items.filter(i => i[k] === v); });
    return items;
  }
  clear() { this._invoices = {}; }
}

module.exports = { InvoiceManager };
