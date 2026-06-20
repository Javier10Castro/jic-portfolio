class CheckoutManager {
  constructor(options = {}) {
    this._storage = options.storage;
    this._events = options.events;
    this._sessions = {};
  }

  createSession(options = {}) {
    const session = {
      id: `cs-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`,
      planId: options.planId, customerId: options.customerId,
      interval: options.interval || 'monthly', successUrl: options.successUrl,
      cancelUrl: options.cancelUrl, coupon: options.coupon || null,
      status: 'open', metadata: options.metadata || {},
      lineItems: options.lineItems || [],
      total: options.total || 0, currency: options.currency || 'usd',
      createdAt: Date.now(), expiresAt: Date.now() + 3600000
    };
    this._sessions[session.id] = session;
    if (this._storage) this._storage.create('checkout_sessions', session.id, session);
    return session;
  }

  completeSession(id) {
    const session = this._sessions[id];
    if (!session) return null;
    session.status = 'completed';
    session.completedAt = Date.now();
    if (this._storage) this._storage.update('checkout_sessions', id, session);
    return session;
  }

  expireSession(id) {
    const session = this._sessions[id];
    if (!session) return null;
    session.status = 'expired';
    if (this._storage) this._storage.update('checkout_sessions', id, session);
    return session;
  }

  getSession(id) { return this._sessions[id] || null; }
  listSessions(filter) {
    let items = Object.values(this._sessions);
    if (filter) Object.entries(filter).forEach(([k, v]) => { items = items.filter(i => i[k] === v); });
    return items;
  }
  clear() { this._sessions = {}; }
}

module.exports = { CheckoutManager };
