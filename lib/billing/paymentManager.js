class PaymentManager {
  constructor(options = {}) {
    this._storage = options.storage;
    this._events = options.events;
    this._payments = {};
    this._providers = {};
  }

  registerProvider(name, provider) { this._providers[name] = provider; }

  processPayment(options = {}) {
    const { amount, currency = 'usd', customerId, provider: providerName = 'mock', method, description, metadata } = options;
    const provider = this._providers[providerName];
    let result;
    if (provider) {
      result = provider.charge({ amount, currency, customerId, method, description, metadata });
      if (result.error) return { success: false, error: result.error };
    }
    const payment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      amount, currency, customerId, provider: providerName,
      method: method || 'card', status: result && result.status ? result.status : 'succeeded',
      description: description || '', metadata: metadata || {},
      providerTransactionId: result ? result.transactionId : `mock-${Date.now()}`,
      createdAt: Date.now()
    };
    this._payments[payment.id] = payment;
    if (this._storage) this._storage.create('payments', payment.id, payment);
    if (this._events) this._events.emit(payment.status === 'succeeded' ? 'payment.received' : 'payment.failed', payment);
    return { success: true, payment };
  }

  getPayment(id) { return this._payments[id] || null; }
  listPayments(filter) {
    let items = Object.values(this._payments);
    if (filter) Object.entries(filter).forEach(([k, v]) => { items = items.filter(i => i[k] === v); });
    return items;
  }
  clear() { this._payments = {}; }
}

module.exports = { PaymentManager };
