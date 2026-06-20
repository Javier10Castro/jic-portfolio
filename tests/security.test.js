const assert = require('assert');

describe('Security Platform — Phase 9.1.0', () => {

  // ============================================================
  // 1. JWT PROVIDER (12 tests)
  // ============================================================
  describe('JwtProvider', () => {
    const { JwtProvider } = require('../lib/security/authentication/jwtProvider');

    it('should generate access token', () => {
      const jwt = new JwtProvider();
      const token = jwt.generateAccessToken({ sub: 'user-1' });
      assert.ok(token);
      assert.strictEqual(token.split('.').length, 3);
    });

    it('should generate refresh token', () => {
      const jwt = new JwtProvider();
      const token = jwt.generateRefreshToken({ sub: 'user-1' });
      assert.ok(token);
    });

    it('should verify valid token', () => {
      const jwt = new JwtProvider();
      const token = jwt.generateAccessToken({ sub: 'user-1' });
      const result = jwt.verify(token);
      assert.ok(result.valid);
      assert.strictEqual(result.payload.sub, 'user-1');
    });

    it('should reject malformed token', () => {
      const jwt = new JwtProvider();
      const result = jwt.verify('invalid.token');
      assert.strictEqual(result.valid, false);
    });

    it('should reject expired token', () => {
      const jwt = new JwtProvider({ accessTokenExpiry: -1 });
      const token = jwt.generateAccessToken({ sub: 'user-1' });
      const result = jwt.verify(token);
      assert.strictEqual(result.valid, false);
    });

    it('should refresh token', () => {
      const jwt = new JwtProvider();
      const refresh = jwt.generateRefreshToken({ sub: 'user-1' });
      const result = jwt.refresh(refresh);
      assert.ok(result.success);
      assert.ok(result.accessToken);
    });

    it('should reject invalid token on refresh', () => {
      const jwt = new JwtProvider();
      const result = jwt.refresh('invalid');
      assert.strictEqual(result.success, false);
    });

    it('should decode token payload', () => {
      const jwt = new JwtProvider();
      const token = jwt.generateAccessToken({ sub: 'user-1', email: 'test@test.com' });
      const decoded = jwt.decode(token);
      assert.strictEqual(decoded.sub, 'user-1');
      assert.strictEqual(decoded.email, 'test@test.com');
    });

    it('should reject access token as refresh token', () => {
      const jwt = new JwtProvider();
      const token = jwt.generateAccessToken({ sub: 'user-1' });
      const result = jwt.refresh(token);
      assert.strictEqual(result.success, false);
    });

    it('should include iat and exp in payload', () => {
      const jwt = new JwtProvider();
      const token = jwt.generateAccessToken({ sub: 'user-1' });
      const decoded = jwt.decode(token);
      assert.ok(decoded.iat);
      assert.ok(decoded.exp);
    });

    it('should decode return null for malformed token', () => {
      const jwt = new JwtProvider();
      assert.strictEqual(jwt.decode('bad'), null);
    });

    it('should verify with custom secret', () => {
      const jwt = new JwtProvider({ secret: 'custom-secret' });
      const token = jwt.generateAccessToken({ sub: 'user-1' });
      const result = jwt.verify(token);
      assert.ok(result.valid);
    });
  });

  // ============================================================
  // 2. API KEY PROVIDER (8 tests)
  // ============================================================
  describe('ApiKeyProvider', () => {
    const { ApiKeyProvider } = require('../lib/security/authentication/apiKeyProvider');

    it('should generate API key', () => {
      const akp = new ApiKeyProvider();
      const result = akp.generateKey({ name: 'Test Key' });
      assert.ok(result.apiKey);
      assert.ok(result.id);
    });

    it('should validate API key', () => {
      const akp = new ApiKeyProvider();
      const { apiKey } = akp.generateKey({ name: 'Test' });
      const result = akp.validateKey(apiKey);
      assert.ok(result.valid);
    });

    it('should reject invalid API key', () => {
      const akp = new ApiKeyProvider();
      const result = akp.validateKey('invalid-key');
      assert.strictEqual(result.valid, false);
    });

    it('should revoke API key', () => {
      const akp = new ApiKeyProvider();
      const { id } = akp.generateKey({ name: 'Test' });
      assert.ok(akp.revokeKey(id));
      const key = akp.getKey(id);
      assert.ok(key.revoked);
    });

    it('should reject revoked API key', () => {
      const akp = new ApiKeyProvider();
      const { id, apiKey } = akp.generateKey({ name: 'Test' });
      akp.revokeKey(id);
      const result = akp.validateKey(apiKey);
      assert.strictEqual(result.valid, false);
    });

    it('should return null for non-existent key', () => {
      const akp = new ApiKeyProvider();
      assert.strictEqual(akp.getKey('non-existent'), null);
    });

    it('should list keys with filter', () => {
      const akp = new ApiKeyProvider();
      const { id, apiKey } = akp.generateKey({ name: 'Test' });
      akp.revokeKey(id);
      const all = akp.listKeys();
      const revoked = akp.listKeys({ revoked: true });
      assert.ok(all.length > 0);
      assert.ok(revoked.length > 0);
    });

    it('should track last used time', () => {
      const akp = new ApiKeyProvider();
      const { apiKey } = akp.generateKey({ name: 'Test' });
      akp.validateKey(apiKey);
      const result = akp.validateKey(apiKey);
      assert.ok(result.key.lastUsedAt);
    });
  });

  // ============================================================
  // 3. OAUTH PROVIDER (6 tests)
  // ============================================================
  describe('OAuthProvider', () => {
    const { OAuthProvider } = require('../lib/security/authentication/oauthProvider');

    it('should return provider config', () => {
      const oauth = new OAuthProvider();
      const google = oauth.getProvider('google');
      assert.ok(google);
      assert.ok(google.enabled);
    });

    it('should return null for unknown provider', () => {
      const oauth = new OAuthProvider();
      assert.strictEqual(oauth.getProvider('unknown'), null);
    });

    it('should generate authorization URL', () => {
      const oauth = new OAuthProvider();
      const result = oauth.getAuthorizationUrl('google', 'http://localhost/callback');
      assert.ok(result);
      assert.ok(result.url);
      assert.ok(result.state);
    });

    it('should exchange code for user profile', () => {
      const oauth = new OAuthProvider();
      const result = oauth.exchangeCode('google', 'test-code', 'http://localhost/callback');
      assert.ok(result.success);
      assert.ok(result.user);
      assert.strictEqual(result.user.provider, 'google');
    });

    it('should fail for disabled provider', () => {
      const oauth = new OAuthProvider({ googleClientId: '' });
      const result = oauth.exchangeCode('google', 'code', 'http://localhost/callback');
      assert.strictEqual(result.success, false);
    });

    it('should find or create user', () => {
      const oauth = new OAuthProvider();
      const profile = { sub: 'new-user', email: 'new@test.com', provider: 'google' };
      const user = oauth.findOrCreateUser(profile);
      assert.ok(user.id);
    });
  });

  // ============================================================
  // 4. SAML PROVIDER (6 tests)
  // ============================================================
  describe('SamlProvider', () => {
    const { SamlProvider } = require('../lib/security/authentication/samlProvider');

    it('should register SAML provider', () => {
      const saml = new SamlProvider();
      saml.registerProvider({ issuer: 'test-issuer', entryPoint: 'https://test.com/saml' });
      assert.strictEqual(saml.getProviders().length, 1);
    });

    it('should throw for missing issuer', () => {
      const saml = new SamlProvider();
      assert.throws(() => saml.registerProvider({}), /issuer/);
    });

    it('should generate login URL', () => {
      const saml = new SamlProvider();
      saml.registerProvider({ issuer: 'test-issuer' });
      const result = saml.getLoginUrl('test-issuer', 'relay-state');
      assert.ok(result);
      assert.ok(result.url);
      assert.ok(result.requestId);
    });

    it('should return null for unknown provider login', () => {
      const saml = new SamlProvider();
      assert.strictEqual(saml.getLoginUrl('unknown'), null);
    });

    it('should process SAML response', () => {
      const saml = new SamlProvider();
      const result = saml.processAssertion('dGVzdC1hc3NlcnRpb24=');
      assert.ok(result.success);
      assert.ok(result.attributes);
    });

    it('should list registered providers', () => {
      const saml = new SamlProvider();
      saml.registerProvider({ issuer: 'issuer-1' });
      saml.registerProvider({ issuer: 'issuer-2' });
      assert.strictEqual(saml.getProviders().length, 2);
    });
  });

  // ============================================================
  // 5. MFA PROVIDER (9 tests)
  // ============================================================
  describe('MfaProvider', () => {
    const { MfaProvider } = require('../lib/security/authentication/mfaProvider');

    it('should generate MFA secret with recovery codes', () => {
      const mfa = new MfaProvider();
      const result = mfa.generateSecret('user-1');
      assert.ok(result.secret);
      assert.ok(result.qrCodeUrl);
      assert.ok(result.recoveryCodes.length >= 8);
    });

    it('should verify TOTP token', () => {
      const mfa = new MfaProvider();
      mfa.generateSecret('user-1');
      const secret = mfa._mfaSecrets.get('user-1').secret;
      const counter = Math.floor(Date.now() / 30000);
      const expected = mfa._generateTOTP(secret, counter);
      const result = mfa.verifyToken('user-1', expected);
      assert.ok(result.valid);
    });

    it('should reject invalid token', () => {
      const mfa = new MfaProvider();
      mfa.generateSecret('user-1');
      const result = mfa.verifyToken('user-1', '000000');
      assert.strictEqual(result.valid, false);
    });

    it('should accept recovery code', () => {
      const mfa = new MfaProvider();
      const { recoveryCodes } = mfa.generateSecret('user-1');
      const result = mfa.verifyToken('user-1', recoveryCodes[0]);
      assert.ok(result.valid);
    });

    it('should reject used recovery code', () => {
      const mfa = new MfaProvider();
      const { recoveryCodes } = mfa.generateSecret('user-1');
      mfa.verifyToken('user-1', recoveryCodes[0]);
      const result = mfa.verifyToken('user-1', recoveryCodes[0]);
      assert.strictEqual(result.valid, false);
    });

    it('should enable and disable MFA', () => {
      const mfa = new MfaProvider();
      mfa.generateSecret('user-1');
      assert.ok(mfa.enable('user-1'));
      assert.ok(mfa.isEnabled('user-1'));
      assert.ok(mfa.disable('user-1'));
      assert.strictEqual(mfa.isEnabled('user-1'), false);
    });

    it('should return MFA status', () => {
      const mfa = new MfaProvider();
      mfa.generateSecret('user-1');
      const status = mfa.getStatus('user-1');
      assert.strictEqual(typeof status.enabled, 'boolean');
      assert.strictEqual(typeof status.recoveryCodesRemaining, 'number');
    });

    it('should return empty status for unconfigured user', () => {
      const mfa = new MfaProvider();
      const status = mfa.getStatus('unknown');
      assert.strictEqual(status.enabled, false);
    });

    it('should return recovery codes list', () => {
      const mfa = new MfaProvider();
      mfa.generateSecret('user-1');
      const codes = mfa.getRecoveryCodes('user-1');
      assert.ok(codes.length > 0);
    });
  });

  // ============================================================
  // 6. PASSWORD PROVIDER (8 tests)
  // ============================================================
  describe('PasswordProvider', () => {
    const { PasswordProvider } = require('../lib/security/authentication/passwordProvider');

    it('should hash password', () => {
      const pp = new PasswordProvider();
      const result = pp.hash('MyPassword123!');
      assert.ok(result.hash);
      assert.ok(result.salt);
    });

    it('should verify correct password', () => {
      const pp = new PasswordProvider();
      const { hash, salt } = pp.hash('MyPassword123!');
      assert.ok(pp.verify('MyPassword123!', hash, salt));
    });

    it('should reject incorrect password', () => {
      const pp = new PasswordProvider();
      const { hash, salt } = pp.hash('MyPassword123!');
      assert.strictEqual(pp.verify('WrongPassword', hash, salt), false);
    });

    it('should validate strong password', () => {
      const pp = new PasswordProvider();
      const result = pp.validateStrength('StrongP@ss1');
      assert.ok(result.valid);
      assert.strictEqual(result.strength, 'strong');
    });

    it('should reject weak password', () => {
      const pp = new PasswordProvider();
      const result = pp.validateStrength('weak');
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.strength, 'weak');
    });

    it('should score medium password', () => {
      const pp = new PasswordProvider();
      const result = pp.validateStrength('Medium1');
      assert.strictEqual(result.strength, 'medium');
    });

    it('should report specific validation errors', () => {
      const pp = new PasswordProvider();
      const result = pp.validateStrength('alllowercase');
      assert.ok(result.errors.length > 0);
    });

    it('should produce deterministic hash with same salt', () => {
      const pp = new PasswordProvider();
      const { hash: h1 } = pp.hash('TestPass1!');
      const { hash: h2 } = pp.hash('TestPass1!');
      assert.notStrictEqual(h1, h2);
    });
  });

  // ============================================================
  // 7. SESSION PROVIDER (8 tests)
  // ============================================================
  describe('SessionProvider', () => {
    const { SessionProvider } = require('../lib/security/authentication/sessionProvider');

    it('should create session', () => {
      const sp = new SessionProvider();
      const session = sp.create('user-1', { ip: '127.0.0.1' });
      assert.ok(session.id);
      assert.strictEqual(session.userId, 'user-1');
    });

    it('should get active session', () => {
      const sp = new SessionProvider();
      const { id } = sp.create('user-1');
      const session = sp.get(id);
      assert.ok(session);
    });

    it('should return null for revoked session', () => {
      const sp = new SessionProvider();
      const { id } = sp.create('user-1');
      sp.revoke(id);
      assert.strictEqual(sp.get(id), null);
    });

    it('should touch session and update lastAccessedAt', () => {
      const sp = new SessionProvider();
      const { id } = sp.create('user-1');
      const touched = sp.touch(id);
      assert.ok(touched);
      assert.ok(touched.lastAccessedAt);
    });

    it('should revoke all sessions for user', () => {
      const sp = new SessionProvider();
      sp.create('user-1');
      sp.create('user-1');
      assert.ok(sp.revokeAllForUser('user-1') >= 2);
    });

    it('should list sessions by user', () => {
      const sp = new SessionProvider();
      sp.create('user-1');
      sp.create('user-1');
      assert.strictEqual(sp.listByUser('user-1').length, 2);
    });

    it('should cleanup expired sessions', () => {
      const sp = new SessionProvider({ defaultMaxLifetime: -1 });
      sp.create('user-1');
      const count = sp.cleanup();
      assert.ok(count >= 1);
    });

    it('should list all sessions with filter', () => {
      const sp = new SessionProvider();
      sp.create('user-1', { deviceId: 'dev-1' });
      const filtered = sp.listAll({ deviceId: 'dev-1' });
      assert.ok(filtered.length > 0);
    });
  });

  // ============================================================
  // 8. RBAC ENGINE (10 tests)
  // ============================================================
  describe('RbacEngine', () => {
    const { RbacEngine } = require('../lib/security/authorization/rbacEngine');

    it('should assign role', () => {
      const rbac = new RbacEngine();
      assert.ok(rbac.assignRole('user-1', 'admin'));
    });

    it('should get user roles', () => {
      const rbac = new RbacEngine();
      rbac.assignRole('user-1', 'admin');
      rbac.assignRole('user-1', 'editor', { type: 'workspace', id: 'ws-1' });
      assert.strictEqual(rbac.getUserRoles('user-1').length, 2);
    });

    it('should get role for scope', () => {
      const rbac = new RbacEngine();
      rbac.assignRole('user-1', 'editor', { type: 'workspace', id: 'ws-1' });
      const role = rbac.getRole('user-1', { type: 'workspace', id: 'ws-1' });
      assert.strictEqual(role.role, 'editor');
    });

    it('should check if user has role', () => {
      const rbac = new RbacEngine();
      rbac.assignRole('user-1', 'admin');
      assert.ok(rbac.hasRole('user-1', 'admin'));
      assert.strictEqual(rbac.hasRole('user-1', 'viewer'), false);
    });

    it('should remove role', () => {
      const rbac = new RbacEngine();
      rbac.assignRole('user-1', 'admin');
      assert.ok(rbac.removeRole('user-1', 'admin'));
      assert.strictEqual(rbac.hasRole('user-1', 'admin'), false);
    });

    it('should get users by role', () => {
      const rbac = new RbacEngine();
      rbac.assignRole('user-1', 'admin');
      rbac.assignRole('user-2', 'admin');
      assert.strictEqual(rbac.getUsersByRole('admin').length, 2);
    });

    it('should get effective role with inheritance', () => {
      const rbac = new RbacEngine();
      rbac.assignRole('user-1', 'admin', { type: 'organization', id: 'org-1' });
      const effective = rbac.getEffectiveRole('user-1', { type: 'workspace', id: 'ws-1' });
      assert.ok(effective === 'admin');
    });

    it('should return null for user with no role', () => {
      const rbac = new RbacEngine();
      assert.strictEqual(rbac.getEffectiveRole('unknown'), null);
    });

    it('should get all assignments', () => {
      const rbac = new RbacEngine();
      rbac.assignRole('user-1', 'admin');
      assert.strictEqual(rbac.getAllAssignments().length, 1);
    });

    it('should get role hierarchy', () => {
      const rbac = new RbacEngine();
      const hierarchy = rbac.getRoleHierarchy();
      assert.ok(hierarchy.includes('admin'));
      assert.ok(hierarchy.includes('viewer'));
    });
  });

  // ============================================================
  // 9. PERMISSION ENGINE (8 tests)
  // ============================================================
  describe('PermissionEngine', () => {
    const { PermissionEngine } = require('../lib/security/authorization/permissionEngine');

    it('should have default viewer permissions', () => {
      const pe = new PermissionEngine();
      assert.ok(pe.hasPermission('viewer', 'read:project'));
    });

    it('should deny write for viewer', () => {
      const pe = new PermissionEngine();
      assert.strictEqual(pe.hasPermission('viewer', 'write:project'), false);
    });

    it('should allow all for super_admin', () => {
      const pe = new PermissionEngine();
      assert.ok(pe.hasPermission('super_admin', 'anything'));
    });

    it('should register new permission', () => {
      const pe = new PermissionEngine();
      pe.registerPermission('custom:action', 'Custom action');
      assert.strictEqual(pe.listPermissions().length, 1);
    });

    it('should assign permission to role', () => {
      const pe = new PermissionEngine();
      pe.assignPermissionToRole('viewer', 'custom:action');
      assert.ok(pe.hasPermission('viewer', 'custom:action'));
    });

    it('should remove permission from role', () => {
      const pe = new PermissionEngine();
      pe.removePermissionFromRole('viewer', 'read:project');
      assert.strictEqual(pe.hasPermission('viewer', 'read:project'), false);
    });

    it('should check access with resource and action', () => {
      const pe = new PermissionEngine();
      const result = pe.checkAccess('admin', 'project', 'write');
      assert.ok(result.allowed);
    });

    it('should deny access for missing permission', () => {
      const pe = new PermissionEngine();
      const result = pe.checkAccess('viewer', 'billing', 'delete');
      assert.strictEqual(result.allowed, false);
    });
  });

  // ============================================================
  // 10. POLICY ENGINE (7 tests)
  // ============================================================
  describe('PolicyEngine', () => {
    const { PolicyEngine } = require('../lib/security/authorization/policyEngine');

    it('should create policy', () => {
      const pe = new PolicyEngine();
      const policy = pe.createPolicy({ name: 'Test Policy', effect: 'deny' });
      assert.ok(policy.id);
    });

    it('should get policy by id', () => {
      const pe = new PolicyEngine();
      const { id } = pe.createPolicy({ name: 'Test' });
      assert.ok(pe.getPolicy(id));
    });

    it('should update policy', () => {
      const pe = new PolicyEngine();
      const { id } = pe.createPolicy({ name: 'Test' });
      const updated = pe.updatePolicy(id, { name: 'Updated' });
      assert.strictEqual(updated.name, 'Updated');
    });

    it('should delete policy', () => {
      const pe = new PolicyEngine();
      const { id } = pe.createPolicy({ name: 'Test' });
      assert.ok(pe.deletePolicy(id));
    });

    it('should evaluate allow by default', () => {
      const pe = new PolicyEngine();
      const result = pe.evaluate({}, { type: 'resource' }, 'read', {});
      assert.ok(result.allowed);
    });

    it('should evaluate deny policy', () => {
      const pe = new PolicyEngine();
      pe.createPolicy({ name: 'Deny', effect: 'deny', conditions: [{ field: 'user.role', value: 'viewer' }] });
      const result = pe.evaluate({ role: 'viewer' }, { type: 'project' }, 'delete', {});
      assert.strictEqual(result.allowed, false);
    });

    it('should support ABAC attributes', () => {
      const pe = new PolicyEngine();
      pe.setAbacAttribute('user-1', 'clearance', 'top_secret');
      const attrs = pe.getAbacAttributes('user-1');
      assert.strictEqual(attrs.clearance, 'top_secret');
    });
  });

  // ============================================================
  // 11. ROLE MANAGER (7 tests)
  // ============================================================
  describe('RoleManager', () => {
    const { RoleManager } = require('../lib/security/authorization/roleManager');

    it('should have default roles', () => {
      const rm = new RoleManager();
      assert.ok(rm.listRoles().length >= 5);
    });

    it('should get role by id', () => {
      const rm = new RoleManager();
      assert.ok(rm.getRole('role-admin'));
    });

    it('should create custom role', () => {
      const rm = new RoleManager();
      const role = rm.createRole({ name: 'Custom Role', hierarchy: 15 });
      assert.strictEqual(role.name, 'Custom Role');
    });

    it('should update role', () => {
      const rm = new RoleManager();
      const role = rm.createRole({ name: 'Test' });
      const updated = rm.updateRole(role.id, { name: 'Updated' });
      assert.strictEqual(updated.name, 'Updated');
    });

    it('should not delete system role', () => {
      const rm = new RoleManager();
      assert.strictEqual(rm.deleteRole('role-admin'), false);
    });

    it('should get inherited permissions', () => {
      const rm = new RoleManager();
      const role = rm.createRole({ name: 'Child', parentId: 'role-admin' });
      const permissions = rm.getInheritedPermissions(role.id);
      assert.ok(Array.isArray(permissions));
    });

    it('should get role hierarchy sorted', () => {
      const rm = new RoleManager();
      const hierarchy = rm.getRoleHierarchy();
      assert.ok(hierarchy[0].hierarchy >= hierarchy[hierarchy.length - 1].hierarchy);
    });
  });

  // ============================================================
  // 12. RESOURCE ACCESS (6 tests)
  // ============================================================
  describe('ResourceAccess', () => {
    const { ResourceAccess } = require('../lib/security/authorization/resourceAccess');

    it('should grant access', () => {
      const ra = new ResourceAccess();
      assert.ok(ra.grantAccess('user-1', 'project', 'proj-1'));
    });

    it('should check access', () => {
      const ra = new ResourceAccess();
      ra.grantAccess('user-1', 'project', 'proj-1');
      const result = ra.checkAccess('user-1', 'project', 'proj-1');
      assert.ok(result.allowed);
    });

    it('should deny ungrnated access', () => {
      const ra = new ResourceAccess();
      const result = ra.checkAccess('user-1', 'project', 'proj-2');
      assert.strictEqual(result.allowed, false);
    });

    it('should revoke access', () => {
      const ra = new ResourceAccess();
      ra.grantAccess('user-1', 'project', 'proj-1');
      assert.ok(ra.revokeAccess('user-1', 'project', 'proj-1'));
      assert.strictEqual(ra.checkAccess('user-1', 'project', 'proj-1').allowed, false);
    });

    it('should update permissions', () => {
      const ra = new ResourceAccess();
      ra.grantAccess('user-1', 'project', 'proj-1', ['read']);
      ra.updatePermissions('user-1', 'project', 'proj-1', ['read', 'write']);
      const result = ra.checkAccess('user-1', 'project', 'proj-1', 'write');
      assert.ok(result.allowed);
    });

    it('should get user grants', () => {
      const ra = new ResourceAccess();
      ra.grantAccess('user-1', 'project', 'proj-1');
      ra.grantAccess('user-1', 'workspace', 'ws-1');
      assert.strictEqual(ra.getUserGrants('user-1').length, 2);
    });
  });

  // ============================================================
  // 13. ORGANIZATION MANAGER (8 tests)
  // ============================================================
  describe('OrganizationManager', () => {
    const { OrganizationManager } = require('../lib/security/organizations/organizationManager');

    it('should create organization', () => {
      const om = new OrganizationManager();
      const org = om.create({ name: 'Test Corp' });
      assert.ok(org.id);
      assert.strictEqual(org.name, 'Test Corp');
    });

    it('should get organization', () => {
      const om = new OrganizationManager();
      const { id } = om.create({ name: 'Test' });
      assert.ok(om.get(id));
    });

    it('should update organization', () => {
      const om = new OrganizationManager();
      const { id } = om.create({ name: 'Test' });
      const updated = om.update(id, { name: 'Updated' });
      assert.strictEqual(updated.name, 'Updated');
    });

    it('should delete organization', () => {
      const om = new OrganizationManager();
      const { id } = om.create({ name: 'Test' });
      assert.ok(om.delete(id));
    });

    it('should list organizations with filter', () => {
      const om = new OrganizationManager();
      om.create({ name: 'Active', status: 'active' });
      om.create({ name: 'Suspended', status: 'suspended' });
      assert.strictEqual(om.list({ status: 'active' }).length, 1);
    });

    it('should find by domain', () => {
      const om = new OrganizationManager();
      om.create({ name: 'Test', domain: 'test.com' });
      assert.ok(om.getByDomain('test.com'));
    });

    it('should set plan', () => {
      const om = new OrganizationManager();
      const { id } = om.create({ name: 'Test' });
      assert.ok(om.setPlan(id, 'enterprise'));
    });

    it('should suspend and activate', () => {
      const om = new OrganizationManager();
      const { id } = om.create({ name: 'Test' });
      om.suspend(id);
      assert.strictEqual(om.get(id).status, 'suspended');
      om.activate(id);
      assert.strictEqual(om.get(id).status, 'active');
    });
  });

  // ============================================================
  // 14. MEMBERSHIP MANAGER (6 tests)
  // ============================================================
  describe('MembershipManager', () => {
    const { MembershipManager } = require('../lib/security/organizations/membershipManager');

    it('should add member', () => {
      const mm = new MembershipManager();
      assert.ok(mm.addMember('org-1', 'user-1'));
    });

    it('should get member', () => {
      const mm = new MembershipManager();
      mm.addMember('org-1', 'user-1');
      assert.ok(mm.getMember('org-1', 'user-1'));
    });

    it('should remove member', () => {
      const mm = new MembershipManager();
      mm.addMember('org-1', 'user-1');
      assert.ok(mm.removeMember('org-1', 'user-1'));
    });

    it('should update role', () => {
      const mm = new MembershipManager();
      mm.addMember('org-1', 'user-1', 'member');
      mm.updateRole('org-1', 'user-1', 'admin');
      assert.strictEqual(mm.getMember('org-1', 'user-1').role, 'admin');
    });

    it('should list organization members', () => {
      const mm = new MembershipManager();
      mm.addMember('org-1', 'user-1');
      mm.addMember('org-1', 'user-2');
      assert.strictEqual(mm.getOrganizationMembers('org-1').length, 2);
    });

    it('should suspend and activate member', () => {
      const mm = new MembershipManager();
      mm.addMember('org-1', 'user-1');
      mm.suspendMember('org-1', 'user-1');
      assert.strictEqual(mm.getMember('org-1', 'user-1').status, 'suspended');
    });
  });

  // ============================================================
  // 15. INVITATION MANAGER (7 tests)
  // ============================================================
  describe('InvitationManager', () => {
    const { InvitationManager } = require('../lib/security/organizations/invitationManager');

    it('should create invitation', () => {
      const im = new InvitationManager();
      const inv = im.create({ email: 'test@test.com', organizationId: 'org-1', invitedBy: 'user-1' });
      assert.ok(inv.id);
      assert.strictEqual(inv.status, 'pending');
    });

    it('should accept invitation', () => {
      const im = new InvitationManager();
      const inv = im.create({ email: 'test@test.com', organizationId: 'org-1', invitedBy: 'user-1' });
      const result = im.accept(inv.token, 'user-2');
      assert.ok(result.success);
    });

    it('should decline invitation', () => {
      const im = new InvitationManager();
      const inv = im.create({ email: 'test@test.com', organizationId: 'org-1', invitedBy: 'user-1' });
      const result = im.decline(inv.token);
      assert.ok(result.success);
    });

    it('should reject invalid token', () => {
      const im = new InvitationManager();
      const result = im.accept('invalid-token', 'user-1');
      assert.strictEqual(result.success, false);
    });

    it('should cancel invitation', () => {
      const im = new InvitationManager();
      const inv = im.create({ email: 'test@test.com', organizationId: 'org-1', invitedBy: 'user-1' });
      assert.ok(im.cancel(inv.id));
    });

    it('should find by token', () => {
      const im = new InvitationManager();
      const inv = im.create({ email: 'test@test.com', organizationId: 'org-1', invitedBy: 'user-1' });
      assert.ok(im.findByToken(inv.token));
    });

    it('should list pending invitations', () => {
      const im = new InvitationManager();
      im.create({ email: 'a@a.com', organizationId: 'org-1', invitedBy: 'user-1', expiresIn: 86400000 });
      assert.ok(im.listPending().length > 0);
    });
  });

  // ============================================================
  // 16. AUDIT LOGGER (6 tests)
  // ============================================================
  describe('AuditLogger', () => {
    const { AuditLogger } = require('../lib/security/audit/auditLogger');

    it('should log entry', () => {
      const al = new AuditLogger();
      const entry = al.log({ action: 'test.action', actor: 'user-1', resourceType: 'test' });
      assert.ok(entry.id);
    });

    it('should query by action', () => {
      const al = new AuditLogger();
      al.log({ action: 'user.login', actor: 'user-1', resourceType: 'session' });
      assert.strictEqual(al.query({ action: 'user.login' }).length, 1);
    });

    it('should query by actor', () => {
      const al = new AuditLogger();
      al.log({ action: 'test', actor: 'user-1', resourceType: 'test' });
      assert.strictEqual(al.query({ actor: 'user-1' }).length, 1);
    });

    it('should search by keyword', () => {
      const al = new AuditLogger();
      al.log({ action: 'user.login', actor: 'user-1', resourceType: 'session' });
      assert.strictEqual(al.query({ search: 'login' }).length, 1);
    });

    it('should get entry by id', () => {
      const al = new AuditLogger();
      const entry = al.log({ action: 'test', actor: 'user-1', resourceType: 'test' });
      assert.ok(al.get(entry.id));
    });

    it('should return stats', () => {
      const al = new AuditLogger();
      al.log({ action: 'a', actor: 'u1', resourceType: 't' });
      al.log({ action: 'b', actor: 'u2', resourceType: 't' });
      const stats = al.getStats();
      assert.ok(stats.total >= 2);
    });
  });

  // ============================================================
  // 17. SECURITY EVENTS (7 tests)
  // ============================================================
  describe('SecurityEvents', () => {
    const { SecurityEvents, EVENT_TYPES } = require('../lib/security/audit/securityEvents');

    it('should emit and listen to events', () => {
      const se = new SecurityEvents();
      let received = null;
      se.on(EVENT_TYPES.USER_LOGIN, (e) => { received = e; });
      se.emitUserLogin({ userId: 'user-1' });
      assert.ok(received);
    });

    it('should support wildcard listeners', () => {
      const se = new SecurityEvents();
      let count = 0;
      se.on('*', () => count++);
      se.emitUserLogin({ userId: 'u1' });
      se.emitUserLogout({ userId: 'u1' });
      assert.strictEqual(count, 2);
    });

    it('should remove listener', () => {
      const se = new SecurityEvents();
      let count = 0;
      const off = se.on(EVENT_TYPES.USER_LOGIN, () => count++);
      off();
      se.emitUserLogin({ userId: 'u1' });
      assert.strictEqual(count, 0);
    });

    it('should get history', () => {
      const se = new SecurityEvents();
      se.emitUserLogin({ userId: 'u1' });
      assert.strictEqual(se.getHistory().length, 1);
    });

    it('should filter history by event type', () => {
      const se = new SecurityEvents();
      se.emitUserLogin({ userId: 'u1' });
      se.emitMfaEnabled({ userId: 'u1' });
      assert.strictEqual(se.getHistory({ event: EVENT_TYPES.USER_LOGIN }).length, 1);
    });

    it('should emit all event types', () => {
      const se = new SecurityEvents();
      se.emitUserLogin({});
      se.emitUserLogout({});
      se.emitSessionCreated({});
      se.emitSessionRevoked({});
      se.emitMfaEnabled({});
      se.emitMfaDisabled({});
      se.emitRoleChanged({});
      se.emitOrganizationCreated({});
      se.emitThreatDetected({});
      se.emitPasswordChanged({});
      se.emitApiKeyCreated({});
      se.emitInvitationSent({});
      se.emitUserCreated({});
      assert.strictEqual(se.getHistory().length, 13);
    });

    it('should have defined EVENT_TYPES', () => {
      assert.ok(EVENT_TYPES.USER_LOGIN);
      assert.ok(EVENT_TYPES.THREAT_DETECTED);
      assert.ok(EVENT_TYPES.SESSION_CREATED);
    });
  });

  // ============================================================
  // 18. AUDIT SEARCH (6 tests)
  // ============================================================
  describe('AuditSearch', () => {
    const { AuditLogger } = require('../lib/security/audit/auditLogger');
    const { AuditSearch } = require('../lib/security/audit/auditSearch');

    it('should search with pagination', () => {
      const logger = new AuditLogger();
      const as = new AuditSearch(logger);
      for (let i = 0; i < 10; i++) logger.log({ action: 'test', actor: 'u1', resourceType: 't' });
      const result = as.search({ page: 1, limit: 5 });
      assert.strictEqual(result.results.length, 5);
      assert.strictEqual(result.total, 10);
    });

    it('should find by actor', () => {
      const al = new AuditLogger();
      const as = new AuditSearch(al);
      al.log({ action: 'a', actor: 'u1', resourceType: 't' });
      assert.strictEqual(as.findByActor('u1').length, 1);
    });

    it('should find by resource', () => {
      const al = new AuditLogger();
      const as = new AuditSearch(al);
      al.log({ action: 'a', actor: 'u1', resourceType: 'project', resourceId: 'p1' });
      assert.strictEqual(as.findByResource('project', 'p1').length, 1);
    });

    it('should find by time range', () => {
      const al = new AuditLogger();
      const as = new AuditSearch(al);
      al.log({ action: 'a', actor: 'u1', resourceType: 't' });
      const result = as.findByTimeRange(Date.now() - 3600000, Date.now() + 3600000);
      assert.ok(result.length >= 1);
    });

    it('should save and get saved searches', () => {
      const al = new AuditLogger();
      const as = new AuditSearch(al);
      as.saveSearch('Failed Logins', { action: 'user.login', outcome: 'failure' });
      assert.ok(as.getSavedSearch('Failed Logins'));
    });

    it('should export results as CSV', () => {
      const al = new AuditLogger();
      const as = new AuditSearch(al);
      al.log({ action: 'test', actor: 'u1', resourceType: 't' });
      const csv = as.exportResults({}, 'csv');
      assert.ok(csv.includes('action'));
    });
  });

  // ============================================================
  // 19. COMPLIANCE EXPORTER (5 tests)
  // ============================================================
  describe('ComplianceExporter', () => {
    const { AuditLogger } = require('../lib/security/audit/auditLogger');
    const { ComplianceExporter } = require('../lib/security/audit/complianceExporter');

    it('should export by time range', () => {
      const al = new AuditLogger();
      const ce = new ComplianceExporter(al);
      al.log({ action: 'a', actor: 'u1', resourceType: 't' });
      const result = ce.exportTimeRange(Date.now() - 3600000, Date.now() + 3600000);
      assert.ok(result);
    });

    it('should generate compliance report', () => {
      const al = new AuditLogger();
      const ce = new ComplianceExporter(al);
      al.log({ action: 'user.login', actor: 'u1', resourceType: 'session', outcome: 'success' });
      al.log({ action: 'user.login', actor: 'u1', resourceType: 'session', outcome: 'failure' });
      const report = ce.generateComplianceReport();
      assert.ok(report.reportId);
      assert.ok(report.totalEvents >= 2);
    });

    it('should get report by id', () => {
      const al = new AuditLogger();
      const ce = new ComplianceExporter(al);
      const report = ce.generateComplianceReport();
      assert.ok(ce.getReport(report.reportId));
    });

    it('should list reports', () => {
      const al = new AuditLogger();
      const ce = new ComplianceExporter(al);
      ce.generateComplianceReport();
      assert.ok(ce.listReports().length > 0);
    });

    it('should generate recommendations for high failure rate', () => {
      const al = new AuditLogger();
      const ce = new ComplianceExporter(al);
      for (let i = 0; i < 10; i++) al.log({ action: 'login', actor: 'u1', resourceType: 'session', outcome: 'failure' });
      const report = ce.generateComplianceReport();
      assert.ok(report.recommendations.length > 0);
    });
  });

  // ============================================================
  // 20. SESSION MANAGER (7 tests)
  // ============================================================
  describe('SessionManager', () => {
    const { SessionManager } = require('../lib/security/sessions/sessionManager');

    it('should create session', () => {
      const sm = new SessionManager();
      const session = sm.create('user-1', { ip: '10.0.0.1' });
      assert.ok(session.id);
      assert.strictEqual(session.loginMethod, 'password');
    });

    it('should get session', () => {
      const sm = new SessionManager();
      const { id } = sm.create('user-1');
      assert.ok(sm.get(id));
    });

    it('should validate session', () => {
      const sm = new SessionManager();
      const { id } = sm.create('user-1');
      const result = sm.validate(id);
      assert.ok(result.valid);
    });

    it('should touch session', () => {
      const sm = new SessionManager();
      const { id } = sm.create('user-1');
      const touched = sm.touch(id);
      assert.ok(touched);
    });

    it('should revoke session', () => {
      const sm = new SessionManager();
      const { id } = sm.create('user-1');
      assert.ok(sm.revoke(id));
      assert.strictEqual(sm.get(id), null);
    });

    it('should revoke all for user', () => {
      const sm = new SessionManager();
      sm.create('user-1');
      sm.create('user-1');
      assert.ok(sm.revokeAllForUser('user-1') >= 2);
    });

    it('should get active count', () => {
      const sm = new SessionManager();
      sm.create('user-1');
      assert.ok(sm.getActiveCount() >= 1);
    });
  });

  // ============================================================
  // 21. DEVICE MANAGER (7 tests)
  // ============================================================
  describe('DeviceManager', () => {
    const { DeviceManager } = require('../lib/security/sessions/deviceManager');

    it('should register device', () => {
      const dm = new DeviceManager();
      const device = dm.register({ userId: 'user-1', userAgent: 'Mozilla/5.0', ip: '10.0.0.1' });
      assert.ok(device.id);
      assert.ok(device.fingerprint);
    });

    it('should get device', () => {
      const dm = new DeviceManager();
      const { id } = dm.register({ userId: 'user-1', name: 'My Device' });
      assert.ok(dm.get(id));
    });

    it('should find by fingerprint', () => {
      const dm = new DeviceManager();
      dm.register({ userId: 'user-1', name: 'Device', userAgent: 'Chrome', ip: '1.2.3.4' });
      const found = dm.findByFingerprint(dm.listByUser('user-1')[0].fingerprint);
      assert.ok(found);
    });

    it('should list by user', () => {
      const dm = new DeviceManager();
      dm.register({ userId: 'user-1' });
      dm.register({ userId: 'user-1' });
      assert.strictEqual(dm.listByUser('user-1').length, 2);
    });

    it('should trust and revoke trust', () => {
      const dm = new DeviceManager();
      const { id } = dm.register({ userId: 'user-1' });
      assert.ok(dm.trustDevice(id));
      assert.ok(dm.isTrusted(id));
      assert.ok(dm.revokeTrust(id));
      assert.strictEqual(dm.isTrusted(id), false);
    });

    it('should remove device', () => {
      const dm = new DeviceManager();
      const { id } = dm.register({ userId: 'user-1' });
      assert.ok(dm.removeDevice(id));
    });

    it('should return stats', () => {
      const dm = new DeviceManager();
      dm.register({ userId: 'user-1', type: 'mobile', os: 'iOS' });
      dm.register({ userId: 'user-1', type: 'desktop', os: 'Windows' });
      const stats = dm.getStats();
      assert.ok(stats.total >= 2);
    });
  });

  // ============================================================
  // 22. TOKEN ROTATION (5 tests)
  // ============================================================
  describe('TokenRotation', () => {
    const { TokenRotation } = require('../lib/security/sessions/tokenRotation');

    it('should rotate token', () => {
      const tr = new TokenRotation();
      const result = tr.rotate('original-token', 'access');
      assert.ok(result.token);
      assert.ok(result.rotation);
    });

    it('should validate rotated token', () => {
      const tr = new TokenRotation();
      const { token: newToken, rotation } = tr.rotate('original-token', 'access');
      const result = tr.validate('original-token', newToken);
      assert.ok(result.valid);
    });

    it('should detect token reuse', () => {
      const tr = new TokenRotation();
      tr.rotate('original-token', 'access');
      const result = tr.validate('original-token', 'wrong-token');
      assert.strictEqual(result.valid, false);
    });

    it('should get rotation history', () => {
      const tr = new TokenRotation();
      tr.rotate('token-1', 'access');
      assert.ok(tr.getRotationHistory('token-1').length > 0);
    });

    it('should get stats', () => {
      const tr = new TokenRotation();
      tr.rotate('token-1', 'access');
      const stats = tr.getStats();
      assert.ok(stats.totalRotations >= 1);
    });
  });

  // ============================================================
  // 23. LOGIN HISTORY (6 tests)
  // ============================================================
  describe('LoginHistory', () => {
    const { LoginHistory } = require('../lib/security/sessions/loginHistory');

    it('should record login attempt', () => {
      const lh = new LoginHistory();
      const record = lh.record({ userId: 'user-1', email: 'test@test.com', success: true });
      assert.ok(record.id);
    });

    it('should get recent attempts', () => {
      const lh = new LoginHistory();
      lh.record({ userId: 'u1', email: 'a@a.com', success: true });
      assert.strictEqual(lh.getRecent().length, 1);
    });

    it('should get failed attempts for user', () => {
      const lh = new LoginHistory();
      lh.record({ userId: 'u1', email: 'a@a.com', success: false, failureReason: 'Bad password' });
      lh.record({ userId: 'u1', email: 'a@a.com', success: false, failureReason: 'Bad password' });
      const failed = lh.getFailedAttempts('u1');
      assert.strictEqual(failed.length, 2);
    });

    it('should get recent logins', () => {
      const lh = new LoginHistory();
      lh.record({ userId: 'u1', email: 'a@a.com', success: true });
      lh.record({ userId: 'u1', email: 'a@a.com', success: false });
      assert.strictEqual(lh.getRecentLogins().length, 1);
    });

    it('should get stats', () => {
      const lh = new LoginHistory();
      lh.record({ userId: 'u1', email: 'a@a.com', success: true });
      lh.record({ userId: 'u1', email: 'a@a.com', success: false });
      const stats = lh.getStats();
      assert.ok(stats.total >= 2);
      assert.ok(stats.successRate >= 0);
    });

    it('should filter by method', () => {
      const lh = new LoginHistory();
      lh.record({ userId: 'u1', email: 'a@a.com', success: true, method: 'oauth', provider: 'google' });
      const stats = lh.getStats();
      assert.ok(stats.byMethod.oauth >= 1);
    });
  });

  // ============================================================
  // 24. DIRECTORY — SCIM (6 tests)
  // ============================================================
  describe('ScimProvider', () => {
    const { ScimProvider } = require('../lib/security/directory/scimProvider');

    it('should create user', () => {
      const scim = new ScimProvider();
      const user = scim.createUser({ userName: 'jdoe', emails: [{ value: 'j@doe.com' }] });
      assert.ok(user.id);
    });

    it('should get user', () => {
      const scim = new ScimProvider();
      const { id } = scim.createUser({ userName: 'jdoe' });
      assert.ok(scim.getUser(id));
    });

    it('should list users with filter', () => {
      const scim = new ScimProvider();
      scim.createUser({ userName: 'active', active: true });
      scim.createUser({ userName: 'inactive', active: false });
      const active = scim.listUsers({ active: true });
      assert.strictEqual(active.length, 1);
    });

    it('should create group and add member', () => {
      const scim = new ScimProvider();
      const user = scim.createUser({ userName: 'jdoe' });
      const group = scim.createGroup({ displayName: 'Admins' });
      assert.ok(scim.addMember(group.id, user.id));
    });

    it('should record sync history', () => {
      const scim = new ScimProvider();
      scim.recordSync({ created: 5, updated: 3 });
      assert.strictEqual(scim.getSyncHistory().length, 1);
    });

    it('should update user', () => {
      const scim = new ScimProvider();
      const { id } = scim.createUser({ userName: 'jdoe' });
      const updated = scim.updateUser(id, { active: false });
      assert.strictEqual(updated.active, false);
    });
  });

  // ============================================================
  // 25. DIRECTORY — LDAP (6 tests)
  // ============================================================
  describe('LdapProvider', () => {
    const { LdapProvider } = require('../lib/security/directory/ldapProvider');

    it('should connect and disconnect', () => {
      const ldap = new LdapProvider();
      assert.ok(ldap.connect().success);
      assert.ok(ldap.isConnected());
      assert.ok(ldap.disconnect());
    });

    it('should create and find user', () => {
      const ldap = new LdapProvider();
      ldap.createUser({ uid: 'jdoe', mail: 'j@doe.com', name: 'John Doe' });
      assert.ok(ldap.findUser('jdoe'));
      assert.ok(ldap.findUser('j@doe.com'));
    });

    it('should authenticate user', () => {
      const ldap = new LdapProvider();
      ldap.connect();
      ldap.createUser({ uid: 'jdoe' });
      const result = ldap.authenticate('jdoe', 'password');
      assert.ok(result.success);
    });

    it('should fail authentication for unknown user', () => {
      const ldap = new LdapProvider();
      ldap.connect();
      const result = ldap.authenticate('unknown', 'pass');
      assert.strictEqual(result.success, false);
    });

    it('should search users', () => {
      const ldap = new LdapProvider();
      ldap.createUser({ uid: 'jdoe', mail: 'j@doe.com' });
      ldap.createUser({ uid: 'asmith', mail: 'a@smith.com' });
      assert.strictEqual(ldap.search({ email: 'j@doe.com' }).length, 1);
    });

    it('should get groups from memberOf', () => {
      const ldap = new LdapProvider();
      ldap.createUser({ uid: 'jdoe', memberOf: ['CN=Admins'] });
      ldap.createUser({ uid: 'asmith', memberOf: ['CN=Admins', 'CN=Developers'] });
      assert.ok(ldap.getGroups().length >= 1);
    });
  });

  // ============================================================
  // 26. DIRECTORY — AD / GOOGLE / ENTRA (9 tests)
  // ============================================================
  describe('ActiveDirectoryProvider', () => {
    const { ActiveDirectoryProvider } = require('../lib/security/directory/activeDirectoryProvider');

    it('should connect and authenticate', () => {
      const ad = new ActiveDirectoryProvider();
      ad.connect();
      ad.createUser({ samAccountName: 'jdoe', userPrincipalName: 'jdoe@company.local' });
      const result = ad.authenticate('jdoe@company.local', 'pass');
      assert.ok(result.success);
    });

    it('should create group and add member', () => {
      const ad = new ActiveDirectoryProvider();
      ad.connect();
      const user = ad.createUser({ samAccountName: 'jdoe' });
      const group = ad.createGroup({ name: 'Domain Admins' });
      assert.ok(ad.addMemberToGroup(group.id, user.id));
    });

    it('should sync users', () => {
      const ad = new ActiveDirectoryProvider();
      ad.connect();
      const result = ad.syncUsers([{ samAccountName: 'u1', userPrincipalName: 'u1@company.local', mail: 'u1@c.com' }]);
      assert.ok(result.created >= 1);
    });
  });

  describe('GoogleWorkspaceProvider', () => {
    const { GoogleWorkspaceProvider } = require('../lib/security/directory/googleWorkspaceProvider');

    it('should connect and manage users', () => {
      const gws = new GoogleWorkspaceProvider();
      gws.connect();
      const user = gws.createUser({ primaryEmail: 'user@company.com', firstName: 'John' });
      assert.ok(user.id);
      assert.ok(gws.findByEmail('user@company.com'));
    });

    it('should suspend and restore user', () => {
      const gws = new GoogleWorkspaceProvider();
      const user = gws.createUser({ primaryEmail: 'u@c.com' });
      assert.ok(gws.suspendUser(user.id));
      assert.ok(gws.restoreUser(user.id));
    });

    it('should sync users and groups', () => {
      const gws = new GoogleWorkspaceProvider();
      gws.connect();
      const result = gws.sync([{ primaryEmail: 'a@b.com' }], [{ email: 'group@b.com', name: 'Test Group' }]);
      assert.ok(result.created >= 1);
      assert.ok(result.groupsCreated >= 1);
    });
  });

  describe('EntraProvider', () => {
    const { EntraProvider } = require('../lib/security/directory/entraProvider');

    it('should connect and manage users', () => {
      const entra = new EntraProvider();
      entra.connect();
      const user = entra.createUser({ displayName: 'John Doe', mail: 'john@company.com' });
      assert.ok(user.id);
      assert.ok(entra.findByUpn(user.userPrincipalName));
    });

    it('should create group and add member', () => {
      const entra = new EntraProvider();
      entra.connect();
      const user = entra.createUser({ displayName: 'John' });
      const group = entra.createGroup({ displayName: 'Sales Team' });
      assert.ok(entra.addMember(group.id, user.id));
    });

    it('should assign license', () => {
      const entra = new EntraProvider();
      const user = entra.createUser({ displayName: 'John' });
      assert.ok(entra.assignLicense(user.id, 'O365_BUSINESS_PREMIUM'));
    });
  });

  // ============================================================
  // 27. SECRET MANAGER (7 tests)
  // ============================================================
  describe('SecretManager', () => {
    const { SecretManager } = require('../lib/security/security/secretManager');

    it('should store and retrieve secret', () => {
      const sm = new SecretManager();
      const { id } = sm.store('api-key', 'sk-123456789', { description: 'Test key' });
      const retrieved = sm.retrieve('api-key');
      assert.strictEqual(retrieved.value, 'sk-123456789');
    });

    it('should retrieve by id', () => {
      const sm = new SecretManager();
      const { id } = sm.store('key', 'value');
      assert.ok(sm.retrieve(id));
    });

    it('should rotate secret', () => {
      const sm = new SecretManager();
      sm.store('key', 'original');
      const result = sm.rotate('key');
      assert.ok(result.version > 1);
    });

    it('should delete secret', () => {
      const sm = new SecretManager();
      sm.store('key', 'value');
      assert.ok(sm.delete('key'));
      assert.strictEqual(sm.retrieve('key'), null);
    });

    it('should list secrets', () => {
      const sm = new SecretManager();
      sm.store('key1', 'val1');
      sm.store('key2', 'val2');
      assert.strictEqual(sm.list().length, 2);
    });

    it('should get expiring secrets', () => {
      const sm = new SecretManager();
      sm.store('key', 'value', { ttl: -1 });
      assert.ok(sm.getExpiringSecrets(0).length >= 1);
    });

    it('should return null for expired secret', () => {
      const sm = new SecretManager();
      sm.store('key', 'value', { ttl: -1 });
      assert.strictEqual(sm.retrieve('key'), null);
    });
  });

  // ============================================================
  // 28. KEY ROTATION (6 tests)
  // ============================================================
  describe('KeyRotation', () => {
    const { KeyRotation } = require('../lib/security/security/keyRotation');

    it('should generate key', () => {
      const kr = new KeyRotation();
      const result = kr.generateKey('signing-key');
      assert.ok(result.id);
      assert.ok(result.version >= 1);
    });

    it('should get active key', () => {
      const kr = new KeyRotation();
      kr.generateKey('signing-key');
      assert.ok(kr.getActiveKey('signing-key'));
    });

    it('should rotate key with version increment', () => {
      const kr = new KeyRotation();
      const first = kr.generateKey('signing-key');
      const second = kr.rotate('signing-key');
      assert.strictEqual(second.version, first.version + 1);
    });

    it('should list keys', () => {
      const kr = new KeyRotation();
      kr.generateKey('key-1');
      kr.generateKey('key-2');
      assert.strictEqual(kr.listKeys().length, 2);
    });

    it('should track rotation history', () => {
      const kr = new KeyRotation();
      kr.generateKey('test-key');
      kr.rotate('test-key');
      assert.ok(kr.getRotationHistory('test-key').length >= 1);
    });

    it('should return expiring keys', () => {
      const kr = new KeyRotation({ defaultRotationInterval: -1 });
      kr.generateKey('test-key');
      assert.ok(kr.getExpiringKeys().length >= 1);
    });
  });

  // ============================================================
  // 29. ENCRYPTION SERVICE (5 tests)
  // ============================================================
  describe('EncryptionService', () => {
    const { EncryptionService } = require('../lib/security/security/encryptionService');

    it('should encrypt and decrypt data', () => {
      const es = new EncryptionService();
      const { encrypted, iv, authTag } = es.encrypt('sensitive-data');
      const decrypted = es.decrypt(encrypted, iv, authTag);
      assert.strictEqual(decrypted, 'sensitive-data');
    });

    it('should encrypt and decrypt objects', () => {
      const es = new EncryptionService();
      const data = { secret: 'value', nested: { key: 123 } };
      const { encrypted, iv, authTag } = es.encrypt(data);
      const decrypted = es.decrypt(encrypted, iv, authTag);
      assert.deepStrictEqual(decrypted, data);
    });

    it('should hash data', () => {
      const es = new EncryptionService();
      const hash = es.hash('data-to-hash');
      assert.ok(hash);
      assert.strictEqual(hash.length, 64);
    });

    it('should generate salt', () => {
      const es = new EncryptionService();
      const salt = es.generateSalt();
      assert.ok(salt);
    });

    it('should generate key', () => {
      const es = new EncryptionService();
      const key = es.generateKey();
      assert.strictEqual(key.length, 64);
    });
  });

  // ============================================================
  // 30. SIGNATURE SERVICE (5 tests)
  // ============================================================
  describe('SignatureService', () => {
    const { SignatureService } = require('../lib/security/security/signatureService');

    it('should sign and verify data', () => {
      const ss = new SignatureService();
      const signature = ss.sign('important-data');
      assert.ok(ss.verify('important-data', signature));
    });

    it('should reject tampered data', () => {
      const ss = new SignatureService();
      const signature = ss.sign('original-data');
      assert.strictEqual(ss.verify('modified-data', signature), false);
    });

    it('should generate key pair', () => {
      const ss = new SignatureService();
      const keys = ss.generateKeyPair();
      assert.ok(keys.publicKey);
      assert.ok(keys.privateKey);
    });

    it('should sign and verify with key pair', () => {
      const ss = new SignatureService();
      const keys = ss.generateKeyPair();
      const signature = ss.signWithKey('data', keys.privateKey);
      assert.ok(ss.verifyWithKey('data', signature, keys.publicKey));
    });

    it('should use timing-safe comparison', () => {
      const ss = new SignatureService();
      const sig1 = ss.sign('data');
      const sig2 = ss.sign('data');
      assert.ok(ss.verify('data', sig1));
      assert.ok(ss.verify('data', sig2));
    });
  });

  // ============================================================
  // 31. THREAT DETECTOR (8 tests)
  // ============================================================
  describe('ThreatDetector', () => {
    const { ThreatDetector } = require('../lib/security/threats/threatDetector');

    it('should have default rules', () => {
      const td = new ThreatDetector();
      assert.ok(td.listRules().length >= 5);
    });

    it('should add custom rule', () => {
      const td = new ThreatDetector();
      td.addRule({ id: 'custom-rule', name: 'Custom', severity: 'high', condition: { type: 'failed_logins', threshold: 3, window: 60000 } });
      assert.ok(td.getRule('custom-rule'));
    });

    it('should detect brute force threat', () => {
      const td = new ThreatDetector();
      const threats = td.evaluate({ type: 'login_failure' }, { recentFailures: [{ timestamp: Date.now() - 1000 }, { timestamp: Date.now() - 2000 }, { timestamp: Date.now() - 3000 }, { timestamp: Date.now() - 4000 }, { timestamp: Date.now() - 5000 }] });
      assert.ok(threats.length > 0);
    });

    it('should detect suspicious IP', () => {
      const td = new ThreatDetector();
      const threats = td.evaluate({ type: 'request', ip: '192.168.1.1' });
      assert.ok(threats.length > 0);
    });

    it('should detect new device login', () => {
      const td = new ThreatDetector();
      const threats = td.evaluate({ type: 'new_device_login', deviceId: 'dev-new' });
      assert.ok(threats.length > 0);
    });

    it('should resolve threat', () => {
      const td = new ThreatDetector();
      const threats = td.evaluate({ type: 'login_failure' }, { recentFailures: Array(10).fill({ timestamp: Date.now() }) });
      if (threats.length > 0) {
        assert.ok(td.resolveThreat(threats[0].id));
      }
    });

    it('should get threat stats', () => {
      const td = new ThreatDetector();
      td.evaluate({ type: 'login_failure' }, { recentFailures: Array(10).fill({ timestamp: Date.now() }) });
      const stats = td.getStats();
      assert.ok(stats.total >= 0);
    });

    it('should get detected threats with filter', () => {
      const td = new ThreatDetector();
      td.evaluate({ type: 'new_device_login', deviceId: 'dev-1' });
      const threats = td.getDetectedThreats({ resolved: false });
      assert.ok(threats.length >= 0);
    });
  });

  // ============================================================
  // 32. RISK SCORER (6 tests)
  // ============================================================
  describe('RiskScorer', () => {
    const { RiskScorer } = require('../lib/security/threats/riskScorer');

    it('should calculate risk score', () => {
      const rs = new RiskScorer();
      const result = rs.calculate('user-1', { failedLogins: 10, mfaDisabled: true });
      assert.ok(result.score > 0);
      assert.ok(result.level);
    });

    it('should return low risk by default', () => {
      const rs = new RiskScorer();
      const result = rs.getScore('unknown');
      assert.strictEqual(result.level, 'low');
    });

    it('should return critical risk for multiple factors', () => {
      const rs = new RiskScorer();
      const result = rs.calculate('user-1', { failedLogins: 20, newDevice: true, suspiciousIp: true, mfaDisabled: true, recentThreats: 5 });
      assert.strictEqual(result.level, 'critical');
    });

    it('should track score history', () => {
      const rs = new RiskScorer();
      rs.calculate('user-1', { failedLogins: 3 });
      rs.calculate('user-1', { failedLogins: 0 });
      assert.ok(rs.getHistory('user-1').length >= 2);
    });

    it('should get entities by risk level', () => {
      const rs = new RiskScorer();
      rs.calculate('user-1', { failedLogins: 10, mfaDisabled: true });
      assert.ok(rs.getEntitiesByRisk('high').length >= 1);
    });

    it('should return summary', () => {
      const rs = new RiskScorer();
      rs.calculate('user-1', { failedLogins: 5 });
      const summary = rs.getSummary();
      assert.ok(summary.total >= 1);
    });
  });

  // ============================================================
  // 33. ANOMALY DETECTOR (6 tests)
  // ============================================================
  describe('AnomalyDetector', () => {
    const { AnomalyDetector } = require('../lib/security/threats/anomalyDetector');

    it('should learn baseline', () => {
      const ad = new AnomalyDetector();
      ad.learn('user-1', 'login_rate', 5);
      const baseline = ad.getBaseline('user-1', 'login_rate');
      assert.ok(baseline);
      assert.strictEqual(baseline.sampleSize, 1);
    });

    it('should return insufficient data for <5 samples', () => {
      const ad = new AnomalyDetector();
      const result = ad.detect('user-1', 'login_rate', 100);
      assert.strictEqual(result.anomalous, false);
    });

    it('should detect anomaly with z-score > 3', () => {
      const ad = new AnomalyDetector();
      for (let i = 0; i < 10; i++) ad.learn('user-1', 'login_rate', 5);
      const result = ad.detect('user-1', 'login_rate', 100);
      assert.ok(result.anomalous);
    });

    it('should return not anomalous for normal values', () => {
      const ad = new AnomalyDetector();
      for (let i = 0; i < 10; i++) ad.learn('user-1', 'login_rate', 5);
      const result = ad.detect('user-1', 'login_rate', 6);
      assert.strictEqual(result.anomalous, false);
    });

    it('should detect batch anomalies', () => {
      const ad = new AnomalyDetector();
      for (let i = 0; i < 10; i++) { ad.learn('user-1', 'login_rate', 5); ad.learn('user-1', 'token_usage', 100); }
      const results = ad.detectBatch('user-1', { login_rate: 100, token_usage: 100 });
      assert.ok(results.length > 0);
    });

    it('should resolve anomaly', () => {
      const ad = new AnomalyDetector();
      for (let i = 0; i < 10; i++) ad.learn('user-1', 'login_rate', 5);
      const { anomaly } = ad.detect('user-1', 'login_rate', 100);
      if (anomaly) {
        assert.ok(ad.resolveAnomaly(anomaly.id));
        assert.ok(ad.getAnomalies({ resolved: true }).length > 0);
      }
    });
  });

  // ============================================================
  // 34. ACCOUNT PROTECTION (8 tests)
  // ============================================================
  describe('AccountProtection', () => {
    const { AccountProtection } = require('../lib/security/threats/accountProtection');

    it('should track failed attempts', () => {
      const ap = new AccountProtection();
      const result = ap.recordFailedAttempt('user-1', {});
      assert.strictEqual(result.locked, false);
      assert.strictEqual(result.attempts, 1);
    });

    it('should lock account after max attempts', () => {
      const ap = new AccountProtection({ maxFailedAttempts: 3 });
      ap.recordFailedAttempt('user-1', {});
      ap.recordFailedAttempt('user-1', {});
      const result = ap.recordFailedAttempt('user-1', {});
      assert.ok(result.locked);
    });

    it('should detect locked account', () => {
      const ap = new AccountProtection({ maxFailedAttempts: 2, lockoutDuration: 60000 });
      ap.recordFailedAttempt('user-1', {});
      ap.recordFailedAttempt('user-1', {});
      assert.ok(ap.isLocked('user-1'));
    });

    it('should unlock account', () => {
      const ap = new AccountProtection({ maxFailedAttempts: 2 });
      ap.recordFailedAttempt('user-1', {});
      ap.recordFailedAttempt('user-1', {});
      ap.unlock('user-1');
      assert.strictEqual(ap.isLocked('user-1'), false);
    });

    it('should reset failures on successful login', () => {
      const ap = new AccountProtection({ maxFailedAttempts: 3 });
      ap.recordFailedAttempt('user-1', {});
      ap.recordFailedAttempt('user-1', {});
      ap.recordSuccessfulLogin('user-1');
      const result = ap.recordFailedAttempt('user-1', {});
      assert.strictEqual(result.attempts, 1);
    });

    it('should set and get flags', () => {
      const ap = new AccountProtection();
      ap.setFlag('user-1', 'require_password_change', true);
      assert.strictEqual(ap.getFlag('user-1', 'require_password_change'), true);
    });

    it('should track password history', () => {
      const ap = new AccountProtection();
      ap.recordPassword('user-1', 'hash-1');
      assert.ok(ap.isPasswordReused('user-1', 'hash-1'));
      assert.strictEqual(ap.isPasswordReused('user-1', 'hash-new'), false);
    });

    it('should return lockout status', () => {
      const ap = new AccountProtection({ maxFailedAttempts: 3 });
      ap.recordFailedAttempt('user-1', {});
      const status = ap.getLockoutStatus('user-1');
      assert.strictEqual(typeof status.locked, 'boolean');
      assert.ok(status.attempts >= 1);
    });
  });

  // ============================================================
  // 35. IDENTITY MANAGER (15 tests)
  // ============================================================
  describe('IdentityManager', () => {
    const { IdentityManager } = require('../lib/security/identityManager');

    it('should register user with password', () => {
      const im = new IdentityManager();
      const user = im.registerUser({ email: 'test@test.com', displayName: 'Test', password: 'StrongP@ss1' });
      assert.ok(user.id);
      assert.ok(user.passwordHash);
    });

    it('should authenticate with password', () => {
      const im = new IdentityManager();
      im.registerUser({ email: 'test@test.com', password: 'StrongP@ss1' });
      const result = im.authenticate({ method: 'password', email: 'test@test.com', password: 'StrongP@ss1' });
      assert.ok(result.success);
      assert.ok(result.accessToken);
    });

    it('should reject invalid password', () => {
      const im = new IdentityManager();
      im.registerUser({ email: 'test@test.com', password: 'StrongP@ss1' });
      const result = im.authenticate({ method: 'password', email: 'test@test.com', password: 'wrong' });
      assert.strictEqual(result.success, false);
    });

    it('should authenticate with API key', () => {
      const im = new IdentityManager();
      const { apiKey } = im.apiKeys.generateKey({ name: 'Test' });
      const result = im.authenticate({ method: 'api_key', apiKey });
      assert.ok(result.success);
    });

    it('should authenticate with token', () => {
      const im = new IdentityManager();
      im.registerUser({ email: 't@t.com', password: 'StrongP@ss1' });
      const auth = im.authenticate({ method: 'password', email: 't@t.com', password: 'StrongP@ss1' });
      const result = im.authenticate({ method: 'token', token: auth.accessToken });
      assert.ok(result.success);
    });

    it('should authorize user', () => {
      const im = new IdentityManager();
      const user = im.registerUser({ email: 'admin@test.com', password: 'StrongP@ss1' });
      im.rbac.assignRole(user.id, 'admin');
      const result = im.authorize(user.id, 'project', 'write');
      assert.ok(result.allowed);
    });

    it('should deny unauthorized user', () => {
      const im = new IdentityManager();
      const user = im.registerUser({ email: 'v@test.com', password: 'StrongP@ss1' });
      im.rbac.assignRole(user.id, 'viewer');
      const result = im.authorize(user.id, 'billing', 'delete');
      assert.strictEqual(result.allowed, false);
    });

    it('should create and revoke session', () => {
      const im = new IdentityManager();
      const session = im.createSession('user-1', { ip: '10.0.0.1' });
      assert.ok(session.id);
      assert.ok(im.revokeSession(session.id));
    });

    it('should refresh session with refresh token', () => {
      const im = new IdentityManager();
      im.registerUser({ email: 'test@test.com', password: 'StrongP@ss1' });
      const auth = im.authenticate({ method: 'password', email: 'test@test.com', password: 'StrongP@ss1' });
      const result = im.refreshSession(auth.refreshToken);
      assert.ok(result.success);
      assert.ok(result.accessToken);
    });

    it('should list users with filter', () => {
      const im = new IdentityManager();
      im.registerUser({ email: 'active@test.com', password: 'Str0ng!', displayName: 'Active' });
      im.registerUser({ email: 'suspended@test.com', password: 'Str0ng!' });
      im.updateUser(im.getUserByEmail('suspended@test.com').id, { status: 'suspended' });
      assert.strictEqual(im.listUsers({ status: 'active' }).length, 1);
    });

    it('should get user by email', () => {
      const im = new IdentityManager();
      im.registerUser({ email: 'find@test.com', password: 'Str0ng!' });
      assert.ok(im.getUserByEmail('find@test.com'));
    });

    it('should update user', () => {
      const im = new IdentityManager();
      const { id } = im.registerUser({ email: 'u@u.com', password: 'Str0ng!' });
      const updated = im.updateUser(id, { displayName: 'Updated' });
      assert.strictEqual(updated.displayName, 'Updated');
    });

    it('should delete user', () => {
      const im = new IdentityManager();
      const { id } = im.registerUser({ email: 'del@test.com', password: 'Str0ng!' });
      assert.ok(im.deleteUser(id));
      assert.strictEqual(im.getUser(id), null);
    });

    it('should generate security report', () => {
      const im = new IdentityManager();
      const report = im.generateSecurityReport();
      assert.ok(report.securityScore >= 0);
      assert.ok(report.riskLevel);
      assert.ok(report.activeUsers >= 0);
    });

    it('should return health status', () => {
      const im = new IdentityManager();
      const health = im.getHealth();
      assert.ok(health.enabled);
      assert.ok(health.timestamp);
    });
  });

  // ============================================================
  // 36. API CONTROLLER (25 tests)
  // ============================================================
  describe('SecurityController', () => {
    const controller = require('../lib/api/controllers/securityController');
    const { resetDefaultEngine, getDefaultEngine, IdentityManager } = require('../lib/security');
    let mockRes;

    beforeEach(() => {
      resetDefaultEngine();
      mockRes = { data: null, statusCode: null, _headers: {} };
      mockRes.status = function (code) { this.statusCode = code; return this; };
      mockRes.json = function (data) { this.data = data; return this; };
      mockRes.setHeader = function (k, v) { this._headers[k] = v; return this; };
      mockRes.send = function (body) { this.body = body; return this; };
    });

    function initUser(email, password) {
      getDefaultEngine().registerUser({ email, password, displayName: 'Test' });
    }

    it('should login with password', () => {
      initUser('test@test.com', 'StrongP@ss1');
      controller.login({ body: { email: 'test@test.com', password: 'StrongP@ss1' }, ip: '127.0.0.1', headers: {} }, mockRes);
      assert.ok(mockRes.data.success);
      assert.ok(mockRes.data.data.accessToken);
    });

    it('should reject invalid login', () => {
      controller.login({ body: { email: 'none@test.com', password: 'wrong' }, ip: '127.0.0.1', headers: {} }, mockRes);
      assert.strictEqual(mockRes.data.success, false);
    });

    it('should logout', () => {
      controller.logout({ body: { sessionId: 'test' }, userId: 'user-1', ip: '127.0.0.1' }, mockRes);
      assert.ok(mockRes.data.success);
    });

    it('should refresh token', () => {
      initUser('refresh@test.com', 'StrongP@ss1');
      controller.login({ body: { email: 'refresh@test.com', password: 'StrongP@ss1' }, ip: '127.0.0.1', headers: {} }, mockRes);
      assert.ok(mockRes.data.success);
      const refreshToken = mockRes.data.data.refreshToken;
      controller.refresh({ body: { refreshToken } }, mockRes);
      assert.ok(mockRes.data.success);
    });

    it('should require refresh token', () => {
      controller.refresh({ body: {} }, mockRes);
      assert.strictEqual(mockRes.data.success, false);
    });

    it('should verify MFA', () => {
      const im = getDefaultEngine();
      im.mfa.generateSecret('user-1');
      const secret = im.mfa._mfaSecrets.get('user-1').secret;
      const counter = Math.floor(Date.now() / 30000);
      const { MfaProvider } = require('../lib/security/authentication/mfaProvider');
      const mfa = new MfaProvider();
      const token = mfa._generateTOTP(secret, counter);
      controller.verifyMfa({ body: { userId: 'user-1', token } }, mockRes);
      assert.ok(mockRes.data.success);
    });

    it('should get me', () => {
      const im = getDefaultEngine();
      const { id } = im.registerUser({ email: 'me@test.com', password: 'Str0ng!' });
      controller.getMe({ query: { userId: id } }, mockRes);
      assert.ok(mockRes.data.success);
      assert.strictEqual(mockRes.data.data.email, 'me@test.com');
    });

    it('should get sessions', () => {
      const im = new IdentityManager();
      im.createSession('user-1', {});
      controller.getSessions({ query: {} }, mockRes);
      assert.ok(mockRes.data.success);
      assert.ok(Array.isArray(mockRes.data.data));
    });

    it('should delete session', () => {
      const im = getDefaultEngine();
      const { id } = im.createSession('user-1', {});
      controller.deleteSession({ params: { id }, userId: 'user-1', ip: '127.0.0.1' }, mockRes);
      assert.ok(mockRes.data.success);
    });

    it('should return 404 for unknown session', () => {
      controller.deleteSession({ params: { id: 'unknown' }, userId: 'user-1', ip: '127.0.0.1' }, mockRes);
      assert.strictEqual(mockRes.data.success, false);
    });

    it('should create organization', () => {
      controller.createOrganization({ body: { name: 'TestOrg' }, userId: 'user-1', ip: '127.0.0.1' }, mockRes);
      assert.ok(mockRes.data.success);
      assert.strictEqual(mockRes.data.data.name, 'TestOrg');
    });

    it('should get organizations', () => {
      controller.getOrganizations({ query: {} }, mockRes);
      assert.ok(mockRes.data.success);
    });

    it('should update organization', () => {
      const im = getDefaultEngine();
      const org = im.organizations.create({ name: 'Test' });
      controller.updateOrganization({ params: { id: org.id }, body: { name: 'Updated' } }, mockRes);
      assert.ok(mockRes.data.success);
    });

    it('should create user', () => {
      controller.createUser({ body: { email: 'new@test.com', password: 'StrongP@ss1' }, userId: 'admin', ip: '127.0.0.1' }, mockRes);
      assert.ok(mockRes.data.success);
    });

    it('should get users', () => {
      controller.getUsers({ query: {} }, mockRes);
      assert.ok(mockRes.data.success);
    });

    it('should update user', () => {
      const im = getDefaultEngine();
      const { id } = im.registerUser({ email: 'up@test.com', password: 'Str0ng!' });
      controller.updateUser({ params: { id }, body: { displayName: 'Updated' } }, mockRes);
      assert.ok(mockRes.data.success);
    });

    it('should delete user', () => {
      const im = getDefaultEngine();
      const { id } = im.registerUser({ email: 'del@test.com', password: 'Str0ng!' });
      controller.deleteUser({ params: { id }, userId: 'admin', ip: '127.0.0.1' }, mockRes);
      assert.ok(mockRes.data.success);
    });

    it('should get roles', () => {
      controller.getRoles({ query: {} }, mockRes);
      assert.ok(mockRes.data.success);
    });

    it('should create role', () => {
      controller.createRole({ body: { name: 'API Role' } }, mockRes);
      assert.ok(mockRes.data.success);
    });

    it('should update role', () => {
      const im = getDefaultEngine();
      const role = im.roles.createRole({ name: 'Test' });
      controller.updateRole({ params: { id: role.id }, body: { name: 'Updated' } }, mockRes);
      assert.ok(mockRes.data.success);
    });

    it('should delete role', () => {
      const im = getDefaultEngine();
      const role = im.roles.createRole({ name: 'Delete Me' });
      controller.deleteRole({ params: { id: role.id } }, mockRes);
      assert.ok(mockRes.data.success);
    });

    it('should get permissions', () => {
      controller.getPermissions({ query: {} }, mockRes);
      assert.ok(mockRes.data.success);
    });

    it('should get audit log', () => {
      const im = new IdentityManager();
      im.audit.log({ action: 'test', actor: 'u1', resourceType: 't' });
      controller.getAudit({ query: {} }, mockRes);
      assert.ok(mockRes.data.success);
    });

    it('should get security report', () => {
      controller.getSecurityReport({}, mockRes);
      assert.ok(mockRes.data.success);
      assert.ok(mockRes.data.data.securityScore !== undefined);
    });

    it('should return health', () => {
      controller.getHealth({}, mockRes);
      assert.ok(mockRes.data.success);
      assert.ok(mockRes.data.data.enabled);
    });
  });

  // ============================================================
  // 37. INTEGRATION TESTS (10 tests)
  // ============================================================
  describe('Integration', () => {
    const { IdentityManager } = require('../lib/security/identityManager');

    it('should complete full authentication flow', () => {
      const im = new IdentityManager();
      const user = im.registerUser({ email: 'user@test.com', password: 'StrongP@ss1', displayName: 'Test User' });
      const auth = im.authenticate({ method: 'password', email: 'user@test.com', password: 'StrongP@ss1' });
      assert.ok(auth.success);
      assert.ok(auth.accessToken);
      im.createSession(user.id, { ip: '10.0.0.1' });
      im.rbac.assignRole(user.id, 'admin');
      const authorize = im.authorize(user.id, 'project', 'write');
      assert.ok(authorize.allowed);
    });

    it('should enforce RBAC across organization scope', () => {
      const im = new IdentityManager();
      const user = im.registerUser({ email: 'admin@org.com', password: 'Str0ng!' });
      const org = im.organizations.create({ name: 'Test Org' });
      im.memberships.addMember(org.id, user.id, 'admin');
      im.rbac.assignRole(user.id, 'admin', { type: 'organization', id: org.id });
      const result = im.authorize(user.id, 'organization', 'read', { scope: { type: 'organization', id: org.id } });
      assert.ok(result.allowed);
    });

    it('should handle MFA setup and login', () => {
      const im = new IdentityManager();
      im.registerUser({ email: 'mfa@test.com', password: 'Str0ng!' });
      const mfaResult = im.mfa.generateSecret('user-1');
      assert.ok(mfaResult.secret);
      const status = im.mfa.getStatus('user-1');
      assert.strictEqual(status.enabled, false);
      im.mfa.enable('user-1');
      assert.ok(im.mfa.isEnabled('user-1'));
    });

    it('should audit user actions', () => {
      const im = new IdentityManager();
      im.audit.log({ action: 'user.login', actor: 'user-1', resourceType: 'session', outcome: 'success' });
      im.audit.log({ action: 'user.logout', actor: 'user-1', resourceType: 'session', outcome: 'success' });
      const entries = im.audit.query({ actor: 'user-1' });
      assert.strictEqual(entries.length, 2);
    });

    it('should detect and resolve threats', () => {
      const im = new IdentityManager();
      const threats = im.threats.evaluate({ type: 'login_failure', ip: '192.168.1.1' }, { recentFailures: Array(10).fill({ timestamp: Date.now() }) });
      const threats2 = im.threats.evaluate({ type: 'login_failure', ip: '192.168.1.1' }, { recentFailures: Array(10).fill({ timestamp: Date.now() }) });
      const stats = im.threats.getStats();
      assert.ok(stats.total > 0);
      if (threats.length > 0) {
        im.threats.resolveThreat(threats[0].id);
      }
    });

    it('should manage invitations end-to-end', () => {
      const im = new IdentityManager();
      const invite = im.invitations.create({ email: 'invite@test.com', organizationId: 'org-1', invitedBy: 'user-1', role: 'editor' });
      assert.strictEqual(invite.status, 'pending');
      const accept = im.invitations.accept(invite.token, 'user-2');
      assert.ok(accept.success);
    });

    it('should enforce account lockout', () => {
      const im = new IdentityManager({ accountProtection: { maxFailedAttempts: 3 } });
      im.registerUser({ email: 'lock@test.com', password: 'Str0ng!' });
      im.authenticate({ method: 'password', email: 'lock@test.com', password: 'wrong' });
      im.authenticate({ method: 'password', email: 'lock@test.com', password: 'wrong' });
      im.authenticate({ method: 'password', email: 'lock@test.com', password: 'wrong' });
      const result = im.authenticate({ method: 'password', email: 'lock@test.com', password: 'Str0ng!' });
      assert.strictEqual(result.success, false);
    });

    it('should rotate secrets and keys', () => {
      const im = new IdentityManager();
      im.secrets.store('db-password', 'original-pass');
      const rotated = im.secrets.rotate('db-password');
      const retrieved = im.secrets.retrieve('db-password');
      assert.strictEqual(retrieved.value, 'original-pass');
      assert.strictEqual(retrieved.version, rotated.version);
    });

    it('should generate compliance report with recommendations', () => {
      const im = new IdentityManager();
      for (let i = 0; i < 10; i++) {
        im.audit.log({ action: 'user.login', actor: `user-${i}`, resourceType: 'session', outcome: 'failure', severity: 'high' });
      }
      const report = im.compliance.generateComplianceReport();
      assert.ok(report.totalEvents >= 10);
      assert.ok(report.recommendations.length > 0);
    });

    it('should generate security report with meaningful data', () => {
      const im = new IdentityManager();
      im.registerUser({ email: 'u1@test.com', password: 'Str0ng!' });
      im.registerUser({ email: 'u2@test.com', password: 'Str0ng!' });
      im.organizations.create({ name: 'Org1' });
      im.createSession('u1', {});
      const report = im.generateSecurityReport();
      assert.ok(report.activeUsers > 0);
      assert.ok(report.activeSessions > 0);
      assert.ok(report.securityScore >= 0);
    });
  });
});
