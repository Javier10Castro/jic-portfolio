const crypto = require('crypto');

class SessionProvider {
  constructor(options = {}) {
    this._sessions = new Map();
    this._defaultMaxLifetime = options.defaultMaxLifetime || 86400000;
    this._defaultIdleTimeout = options.defaultIdleTimeout || 3600000;
  }

  create(userId, context = {}) {
    const id = crypto.randomUUID();
    const now = Date.now();
    const session = {
      id,
      userId,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: now + this._defaultMaxLifetime,
      idleTimeoutAt: now + this._defaultIdleTimeout,
      ip: context.ip || '0.0.0.0',
      userAgent: context.userAgent || 'unknown',
      deviceId: context.deviceId || null,
      metadata: context.metadata || {},
      revoked: false
    };
    this._sessions.set(id, session);
    return session;
  }

  get(id) {
    const session = this._sessions.get(id);
    if (!session) return null;
    if (session.revoked) return null;
    if (Date.now() > session.expiresAt) {
      this._sessions.delete(id);
      return null;
    }
    return session;
  }

  touch(id) {
    const session = this._sessions.get(id);
    if (!session) return null;
    const now = Date.now();
    if (session.revoked) return null;
    if (now > session.expiresAt) { this._sessions.delete(id); return null; }
    if (now > session.idleTimeoutAt) { session.revoked = true; return null; }
    session.lastAccessedAt = now;
    session.idleTimeoutAt = now + this._defaultIdleTimeout;
    return session;
  }

  revoke(id) {
    const session = this._sessions.get(id);
    if (!session) return false;
    session.revoked = true;
    return true;
  }

  revokeAllForUser(userId) {
    let count = 0;
    for (const session of this._sessions.values()) {
      if (session.userId === userId && !session.revoked) {
        session.revoked = true;
        count++;
      }
    }
    return count;
  }

  listByUser(userId) {
    return Array.from(this._sessions.values()).filter(s => s.userId === userId && !s.revoked && Date.now() <= s.expiresAt);
  }

  listAll(filter = {}) {
    let results = Array.from(this._sessions.values()).filter(s => !s.revoked && Date.now() <= s.expiresAt);
    if (filter.userId) results = results.filter(s => s.userId === filter.userId);
    if (filter.deviceId) results = results.filter(s => s.deviceId === filter.deviceId);
    return results;
  }

  cleanup() {
    const now = Date.now();
    let count = 0;
    for (const [id, session] of this._sessions) {
      if (session.revoked || now > session.expiresAt) {
        this._sessions.delete(id);
        count++;
      }
    }
    return count;
  }
}

module.exports = { SessionProvider };
