const { JwtProvider } = require('./authentication/jwtProvider');
const { ApiKeyProvider } = require('./authentication/apiKeyProvider');
const { OAuthProvider } = require('./authentication/oauthProvider');
const { SamlProvider } = require('./authentication/samlProvider');
const { MfaProvider } = require('./authentication/mfaProvider');
const { PasswordProvider } = require('./authentication/passwordProvider');
const { SessionProvider } = require('./authentication/sessionProvider');
const { RbacEngine } = require('./authorization/rbacEngine');
const { PermissionEngine } = require('./authorization/permissionEngine');
const { PolicyEngine } = require('./authorization/policyEngine');
const { RoleManager } = require('./authorization/roleManager');
const { ResourceAccess } = require('./authorization/resourceAccess');
const { OrganizationManager } = require('./organizations/organizationManager');
const { TenantIsolation } = require('./organizations/tenantIsolation');
const { TeamManager } = require('./organizations/teamManager');
const { MembershipManager } = require('./organizations/membershipManager');
const { InvitationManager } = require('./organizations/invitationManager');
const { AuditLogger } = require('./audit/auditLogger');
const { SecurityEvents, EVENT_TYPES } = require('./audit/securityEvents');
const { AuditSearch } = require('./audit/auditSearch');
const { ComplianceExporter } = require('./audit/complianceExporter');
const { SessionManager } = require('./sessions/sessionManager');
const { DeviceManager } = require('./sessions/deviceManager');
const { TokenRotation } = require('./sessions/tokenRotation');
const { LoginHistory } = require('./sessions/loginHistory');
const { ScimProvider } = require('./directory/scimProvider');
const { LdapProvider } = require('./directory/ldapProvider');
const { ActiveDirectoryProvider } = require('./directory/activeDirectoryProvider');
const { GoogleWorkspaceProvider } = require('./directory/googleWorkspaceProvider');
const { EntraProvider } = require('./directory/entraProvider');
const { SecretManager } = require('./security/secretManager');
const { KeyRotation } = require('./security/keyRotation');
const { EncryptionService } = require('./security/encryptionService');
const { SignatureService } = require('./security/signatureService');
const { ThreatDetector } = require('./threats/threatDetector');
const { RiskScorer } = require('./threats/riskScorer');
const { AnomalyDetector } = require('./threats/anomalyDetector');
const { AccountProtection } = require('./threats/accountProtection');

class IdentityManager {
  constructor(options = {}) {
    this._users = new Map();
    this._jwt = new JwtProvider(options.jwt);
    this._apiKeys = new ApiKeyProvider(options.apiKey);
    this._oauth = new OAuthProvider(options.oauth);
    this._saml = new SamlProvider(options.saml);
    this._mfa = new MfaProvider(options.mfa);
    this._password = new PasswordProvider(options.password);
    this._sessionProvider = new SessionProvider(options.session);
    this._rbac = new RbacEngine();
    this._permissions = new PermissionEngine();
    this._policies = new PolicyEngine();
    this._roles = new RoleManager();
    this._resourceAccess = new ResourceAccess();
    this._organizations = new OrganizationManager();
    this._tenantIsolation = new TenantIsolation();
    this._teams = new TeamManager();
    this._memberships = new MembershipManager();
    this._invitations = new InvitationManager();
    this._audit = new AuditLogger();
    this._securityEvents = new SecurityEvents(options.securityEvents);
    this._auditSearch = new AuditSearch(this._audit);
    this._compliance = new ComplianceExporter(this._audit);
    this._sessionManager = new SessionManager(options.sessionManager);
    this._devices = new DeviceManager();
    this._tokenRotation = new TokenRotation(options.tokenRotation);
    this._loginHistory = new LoginHistory();
    this._scim = new ScimProvider();
    this._ldap = new LdapProvider(options.ldap);
    this._ad = new ActiveDirectoryProvider(options.ad);
    this._googleWorkspace = new GoogleWorkspaceProvider(options.googleWorkspace);
    this._entra = new EntraProvider(options.entra);
    this._secrets = new SecretManager(options.secrets);
    this._keyRotation = new KeyRotation(options.keyRotation);
    this._encryption = new EncryptionService(options.encryption);
    this._signature = new SignatureService(options.signature);
    this._threats = new ThreatDetector(options.threats);
    this._riskScorer = new RiskScorer();
    this._anomalyDetector = new AnomalyDetector();
    this._accountProtection = new AccountProtection(options.accountProtection);
  }

  get jwt() { return this._jwt; }
  get apiKeys() { return this._apiKeys; }
  get oauth() { return this._oauth; }
  get saml() { return this._saml; }
  get mfa() { return this._mfa; }
  get password() { return this._password; }
  get sessionProvider() { return this._sessionProvider; }
  get rbac() { return this._rbac; }
  get permissions() { return this._permissions; }
  get policies() { return this._policies; }
  get roles() { return this._roles; }
  get resourceAccess() { return this._resourceAccess; }
  get organizations() { return this._organizations; }
  get tenantIsolation() { return this._tenantIsolation; }
  get teams() { return this._teams; }
  get memberships() { return this._memberships; }
  get invitations() { return this._invitations; }
  get audit() { return this._audit; }
  get securityEvents() { return this._securityEvents; }
  get auditSearch() { return this._auditSearch; }
  get compliance() { return this._compliance; }
  get sessionManager() { return this._sessionManager; }
  get devices() { return this._devices; }
  get tokenRotation() { return this._tokenRotation; }
  get loginHistory() { return this._loginHistory; }
  get scim() { return this._scim; }
  get ldap() { return this._ldap; }
  get ad() { return this._ad; }
  get googleWorkspace() { return this._googleWorkspace; }
  get entra() { return this._entra; }
  get secrets() { return this._secrets; }
  get keyRotation() { return this._keyRotation; }
  get encryption() { return this._encryption; }
  get signature() { return this._signature; }
  get threats() { return this._threats; }
  get riskScorer() { return this._riskScorer; }
  get anomalyDetector() { return this._anomalyDetector; }
  get accountProtection() { return this._accountProtection; }

  registerUser(user) {
    const id = user.id || `user-${require('crypto').randomUUID().substring(0, 8)}`;
    const entry = {
      id, email: user.email, username: user.username || user.email,
      displayName: user.displayName || user.name || '',
      passwordHash: null, passwordSalt: null,
      mfaEnabled: false, roles: user.roles || [],
      organizations: user.organizations || [],
      status: 'active', createdAt: Date.now(),
      metadata: user.metadata || {}
    };
    if (user.password) {
      const result = this._password.hash(user.password);
      entry.passwordHash = result.hash;
      entry.passwordSalt = result.salt;
    }
    this._users.set(id, entry);
    return entry;
  }

  getUser(id) { return this._users.get(id) || null; }

  getUserByEmail(email) {
    for (const user of this._users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  listUsers(filter = {}) {
    let results = Array.from(this._users.values());
    if (filter.status) results = results.filter(u => u.status === filter.status);
    if (filter.search) results = results.filter(u => u.email?.toLowerCase().includes(filter.search.toLowerCase()) || u.displayName?.toLowerCase().includes(filter.search.toLowerCase()));
    return results;
  }

  updateUser(id, updates) {
    const user = this._users.get(id);
    if (!user) return null;
    if (updates.password) {
      const result = this._password.hash(updates.password);
      updates.passwordHash = result.hash;
      updates.passwordSalt = result.salt;
      delete updates.password;
    }
    Object.assign(user, updates);
    return user;
  }

  deleteUser(id) { return this._users.delete(id); }

  authenticate(credentials) {
    const { method, email, password, token, apiKey, provider, code } = credentials;
    if (method === 'password' && email && password) {
      const user = this.getUserByEmail(email);
      if (!user) return { success: false, error: 'Invalid credentials' };
      if (user.status === 'suspended') return { success: false, error: 'Account suspended' };
      if (this._accountProtection.isLocked(user.id)) {
        this._securityEvents.emitThreatDetected({ userId: user.id, type: 'locked_account_attempt' });
        return { success: false, error: 'Account temporarily locked' };
      }
      const valid = this._password.verify(password, user.passwordHash, user.passwordSalt);
      if (!valid) {
        const lockResult = this._accountProtection.recordFailedAttempt(user.id, { ip: credentials.ip });
        this._loginHistory.record({ userId: user.id, email, success: false, method: 'password', ip: credentials.ip, failureReason: 'Invalid password' });
        return { success: false, error: 'Invalid credentials', attemptsRemaining: lockResult.remaining };
      }
      this._accountProtection.recordSuccessfulLogin(user.id);
      this._loginHistory.record({ userId: user.id, email, success: true, method: 'password', ip: credentials.ip });
      this._securityEvents.emitUserLogin({ userId: user.id, email, method: 'password' });
      const session = this._sessionManager.create(user.id, { ip: credentials.ip, userAgent: credentials.userAgent });
      const accessToken = this._jwt.generateAccessToken({ sub: user.id, email: user.email });
      const refreshToken = this._jwt.generateRefreshToken({ sub: user.id });
      return { success: true, user: { id: user.id, email: user.email, displayName: user.displayName }, accessToken, refreshToken, session: session.id };
    }
    if (method === 'api_key' && apiKey) {
      const result = this._apiKeys.validateKey(apiKey);
      if (!result.valid) return { success: false, error: result.error };
      return { success: true, key: result.key };
    }
    if (method === 'oauth' && provider && code) {
      const result = this._oauth.exchangeCode(provider, code, credentials.redirectUri);
      if (!result.success) return { success: false, error: result.error };
      const user = this._oauth.findOrCreateUser(result.user);
      this._loginHistory.record({ userId: user.id, email: user.email, success: true, method: 'oauth', provider });
      return { success: true, user };
    }
    if (method === 'saml' && provider && code) {
      const assertion = this._saml.processAssertion(code);
      if (!assertion.success) return { success: false, error: 'SAML assertion failed' };
      let user = this.getUserByEmail(assertion.nameId);
      if (!user) user = this.registerUser({ email: assertion.nameId, displayName: assertion.attributes.name });
      return { success: true, user, assertion };
    }
    if (method === 'token') {
      const result = this._jwt.verify(token);
      if (!result.valid) return { success: false, error: result.error };
      const user = this.getUser(result.payload.sub);
      if (!user) return { success: false, error: 'User not found' };
      return { success: true, user, token: result.payload };
    }
    return { success: false, error: 'Unsupported authentication method' };
  }

  authorize(userId, resource, action, context = {}) {
    const user = this.getUser(userId);
    if (!user) return { allowed: false, reason: 'User not found' };
    if (user.status !== 'active') return { allowed: false, reason: 'Account inactive' };
    const effectiveRole = this._rbac.getEffectiveRole(userId, context.scope);
    if (!effectiveRole) return { allowed: false, reason: 'No role assigned' };
    const permCheck = this._permissions.checkAccess(effectiveRole, resource, action);
    if (permCheck.allowed) return { allowed: true, role: effectiveRole };
    const resourceCheck = this._resourceAccess.checkAccess(userId, resource, resource, action);
    if (resourceCheck.allowed) return { allowed: true, source: 'resource_grant' };
    const policyResult = this._policies.evaluate({ id: userId, role: effectiveRole }, { type: resource }, action, context);
    if (!policyResult.allowed) return policyResult;
    return { allowed: false, reason: `Insufficient permissions for ${action}:${resource}` };
  }

  createSession(userId, context) {
    return this._sessionManager.create(userId, context);
  }

  revokeSession(sessionId) {
    return this._sessionManager.revoke(sessionId);
  }

  refreshSession(refreshToken) {
    const result = this._jwt.refresh(refreshToken);
    if (!result.success) return { success: false, error: result.error };
    const decoded = this._jwt.decode(result.accessToken);
    const user = decoded ? this.getUser(decoded.sub) : null;
    if (!user) return { success: false, error: 'User not found' };
    return { success: true, accessToken: result.accessToken, refreshToken: result.refreshToken, user };
  }

  generateSecurityReport() {
    const activeUsers = this.listUsers({ status: 'active' });
    const sessions = this._sessionManager.listAll();
    const orgs = this._organizations.list();
    const loginStats = this._loginHistory.getStats();
    const threats = this._threats.getStats();
    const mfaUsers = Array.from(this._users.values()).filter(u => {
      const status = this._mfa.getStatus(u.id);
      return status.enabled;
    });
    const recommendations = [];
    if (mfaUsers.length < activeUsers.length * 0.5) recommendations.push('Enable MFA for all users');
    if (threats.unresolved > 0) recommendations.push(`Resolve ${threats.unresolved} unresolved threats`);
    if (loginStats.failed24h > 10) recommendations.push('Investigate elevated failed login rate');
    return {
      securityScore: this._calculateSecurityScore({ activeUsers, mfaUsers, threats, loginStats }),
      riskLevel: threats.unresolved > 5 ? 'high' : threats.unresolved > 0 ? 'medium' : 'low',
      activeUsers: activeUsers.length,
      activeSessions: sessions.length,
      organizations: orgs.length,
      failedLogins: loginStats.failed24h || 0,
      mfaCoverage: activeUsers.length > 0 ? Math.round((mfaUsers.length / activeUsers.length) * 100) : 0,
      threats: threats.total || 0,
      recommendations,
      timestamp: Date.now()
    };
  }

  getHealth() {
    return {
      enabled: true,
      users: this._users.size,
      sessions: this._sessionManager.getActiveCount(),
      organizations: this._organizations.list().length,
      threatsDetected: this._threats.getStats().total,
      loginAttempts: this._loginHistory.getStats().total,
      auditEntries: this._audit.getStats().total,
      timestamp: Date.now()
    };
  }

  clear() {
    this._users.clear();
    this._sessionManager.clear();
    this._audit.clear();
    this._securityEvents.clear();
    this._loginHistory.clear();
    this._threats.clear();
    this._riskScorer.clear();
    this._anomalyDetector.clear();
    this._accountProtection.clear();
    this._rbac.clear();
    this._permissions.clear();
    this._policies.clear();
    this._roles.clear();
    this._resourceAccess.clear();
    this._organizations.clear();
    this._teams.clear();
    this._memberships.clear();
    this._invitations.clear();
    this._devices.clear();
    this._tokenRotation.clear();
    this._scim.clear();
    this._ldap.clear();
    this._ad.clear();
    this._googleWorkspace.clear();
    this._entra.clear();
    this._secrets.clear();
    this._keyRotation.clear();
  }

  _calculateSecurityScore({ activeUsers, mfaUsers, threats, loginStats }) {
    let score = 100;
    if (activeUsers.length > 0) score -= (1 - mfaUsers.length / activeUsers.length) * 20;
    score -= threats.unresolved * 5;
    if (loginStats.failed24h > 20) score -= 15;
    else if (loginStats.failed24h > 10) score -= 10;
    else if (loginStats.failed24h > 5) score -= 5;
    return Math.max(0, Math.round(score));
  }
}

module.exports = { IdentityManager };
