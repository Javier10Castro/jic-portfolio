const EVENT_TYPES = {
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  SESSION_CREATED: 'session.created',
  SESSION_REVOKED: 'session.revoked',
  MFA_ENABLED: 'mfa.enabled',
  MFA_DISABLED: 'mfa.disabled',
  ROLE_CHANGED: 'role.changed',
  PERMISSION_CHANGED: 'permission.changed',
  ORGANIZATION_CREATED: 'organization.created',
  ORGANIZATION_DELETED: 'organization.deleted',
  THREAT_DETECTED: 'threat.detected',
  RISK_UPDATED: 'risk.updated',
  PASSWORD_CHANGED: 'password.changed',
  API_KEY_CREATED: 'api_key.created',
  API_KEY_REVOKED: 'api_key.revoked',
  INVITATION_SENT: 'invitation.sent',
  INVITATION_ACCEPTED: 'invitation.accepted',
  USER_CREATED: 'user.created',
  USER_DELETED: 'user.deleted'
};

class SecurityEvents {
  constructor(options = {}) {
    this._listeners = new Map();
    this._history = [];
    this._maxHistory = options.maxHistory || 500;
  }

  on(event, handler) {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event).push(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const handlers = this._listeners.get(event);
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx >= 0) handlers.splice(idx, 1);
  }

  emit(event, data) {
    const entry = { event, data, timestamp: Date.now() };
    this._history.push(entry);
    if (this._history.length > this._maxHistory) this._history.shift();
    const handlers = this._listeners.get(event) || [];
    const wildcard = this._listeners.get('*') || [];
    for (const h of [...handlers, ...wildcard]) {
      try { h(entry); } catch {}
    }
    return entry;
  }

  getHistory(filter = {}) {
    let results = [...this._history];
    if (filter.event) results = results.filter(e => e.event === filter.event);
    if (filter.since) results = results.filter(e => e.timestamp >= filter.since);
    return results;
  }

  onUserLogin(handler) { return this.on(EVENT_TYPES.USER_LOGIN, handler); }
  onThreatDetected(handler) { return this.on(EVENT_TYPES.THREAT_DETECTED, handler); }
  emitUserLogin(data) { return this.emit(EVENT_TYPES.USER_LOGIN, data); }
  emitUserLogout(data) { return this.emit(EVENT_TYPES.USER_LOGOUT, data); }
  emitSessionCreated(data) { return this.emit(EVENT_TYPES.SESSION_CREATED, data); }
  emitSessionRevoked(data) { return this.emit(EVENT_TYPES.SESSION_REVOKED, data); }
  emitMfaEnabled(data) { return this.emit(EVENT_TYPES.MFA_ENABLED, data); }
  emitMfaDisabled(data) { return this.emit(EVENT_TYPES.MFA_DISABLED, data); }
  emitRoleChanged(data) { return this.emit(EVENT_TYPES.ROLE_CHANGED, data); }
  emitPermissionChanged(data) { return this.emit(EVENT_TYPES.PERMISSION_CHANGED, data); }
  emitOrganizationCreated(data) { return this.emit(EVENT_TYPES.ORGANIZATION_CREATED, data); }
  emitOrganizationDeleted(data) { return this.emit(EVENT_TYPES.ORGANIZATION_DELETED, data); }
  emitThreatDetected(data) { return this.emit(EVENT_TYPES.THREAT_DETECTED, data); }
  emitRiskUpdated(data) { return this.emit(EVENT_TYPES.RISK_UPDATED, data); }
  emitPasswordChanged(data) { return this.emit(EVENT_TYPES.PASSWORD_CHANGED, data); }
  emitApiKeyCreated(data) { return this.emit(EVENT_TYPES.API_KEY_CREATED, data); }
  emitApiKeyRevoked(data) { return this.emit(EVENT_TYPES.API_KEY_REVOKED, data); }
  emitInvitationSent(data) { return this.emit(EVENT_TYPES.INVITATION_SENT, data); }
  emitInvitationAccepted(data) { return this.emit(EVENT_TYPES.INVITATION_ACCEPTED, data); }
  emitUserCreated(data) { return this.emit(EVENT_TYPES.USER_CREATED, data); }
  emitUserDeleted(data) { return this.emit(EVENT_TYPES.USER_DELETED, data); }

  clear() {
    this._listeners.clear();
    this._history = [];
  }
}

module.exports = { SecurityEvents, EVENT_TYPES };
