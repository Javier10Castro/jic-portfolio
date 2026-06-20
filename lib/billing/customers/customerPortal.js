class CustomerPortal {
  constructor() {
    this._sessions = {};
  }

  createSession(customerId, options = {}) {
    const session = {
      id: `portal-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      customerId, status: 'active', createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
      returnUrl: options.returnUrl || '/',
      metadata: options.metadata || {}
    };
    this._sessions[session.id] = session;
    return session;
  }

  validateSession(sessionId) {
    const session = this._sessions[sessionId];
    if (!session) return { valid: false, reason: 'not_found' };
    if (session.expiresAt < Date.now()) return { valid: false, reason: 'expired' };
    if (session.status !== 'active') return { valid: false, reason: 'inactive' };
    return { valid: true, session };
  }

  expireSession(sessionId) {
    const session = this._sessions[sessionId];
    if (!session) return null;
    session.status = 'expired';
    return session;
  }

  getSession(sessionId) { return this._sessions[sessionId] || null; }
  clear() { this._sessions = {}; }
}

module.exports = { CustomerPortal };
