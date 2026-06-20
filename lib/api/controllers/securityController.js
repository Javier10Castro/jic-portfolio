const { getDefaultEngine, IdentityManager } = require('../../security');
const { success, created, error } = require('../responses/apiResponse');

function _getEngine() {
  return getDefaultEngine();
}

function login(req, res) {
  const { email, password, apiKey, provider, code, token, method } = req.body;
  const result = _getEngine().authenticate({ method: method || 'password', email, password, apiKey, provider, code, token, ip: req.ip, userAgent: req.headers['user-agent'] });
  if (!result.success) return error(res, { statusCode: 401, name: 'AuthenticationError', message: result.error });
  _getEngine().audit.log({ action: 'user.login', actor: result.user?.id || result.key?.id, resourceType: 'session', outcome: 'success', ip: req.ip });
  return success(res, result);
}

function logout(req, res) {
  const sessionId = req.body.sessionId || req.headers['x-session-id'];
  if (sessionId) _getEngine().revokeSession(sessionId);
  _getEngine().securityEvents.emitUserLogout({ sessionId, userId: req.userId });
  _getEngine().audit.log({ action: 'user.logout', actor: req.userId, resourceType: 'session', resourceId: sessionId, outcome: 'success', ip: req.ip });
  return success(res, { message: 'Logged out successfully' });
}

function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return error(res, { statusCode: 400, name: 'ValidationError', message: 'Refresh token required' });
  const result = _getEngine().refreshSession(refreshToken);
  if (!result.success) return error(res, { statusCode: 401, name: 'AuthenticationError', message: result.error });
  return success(res, result);
}

function verifyMfa(req, res) {
  const { userId, token } = req.body;
  if (!userId || !token) return error(res, { statusCode: 400, name: 'ValidationError', message: 'userId and token required' });
  const result = _getEngine().mfa.verifyToken(userId, token);
  if (!result.valid) return error(res, { statusCode: 401, name: 'MfaError', message: result.error });
  _getEngine().mfa.enable(userId);
  _getEngine().securityEvents.emitMfaEnabled({ userId });
  return success(res, { verified: true });
}

function getMe(req, res) {
  const userId = req.userId || req.query.userId;
  if (!userId) return error(res, { statusCode: 400, name: 'ValidationError', message: 'userId required' });
  const user = _getEngine().getUser(userId);
  if (!user) return error(res, { statusCode: 404, name: 'NotFoundError', message: 'User not found' });
  return success(res, { id: user.id, email: user.email, username: user.username, displayName: user.displayName, mfaEnabled: user.mfaEnabled, status: user.status, createdAt: user.createdAt });
}

function getSessions(req, res) {
  const userId = req.query.userId;
  const filter = userId ? { userId } : {};
  const sessions = _getEngine().sessionManager.listAll(filter);
  return success(res, sessions);
}

function deleteSession(req, res) {
  const { id } = req.params;
  const revoked = _getEngine().revokeSession(id);
  if (!revoked) return error(res, { statusCode: 404, name: 'NotFoundError', message: 'Session not found' });
  _getEngine().securityEvents.emitSessionRevoked({ sessionId: id });
  _getEngine().audit.log({ action: 'session.revoked', actor: req.userId, resourceType: 'session', resourceId: id, outcome: 'success', ip: req.ip });
  return success(res, { revoked: true });
}

function getOrganizations(req, res) {
  const orgs = _getEngine().organizations.list(req.query);
  return success(res, orgs);
}

function createOrganization(req, res) {
  const org = _getEngine().organizations.create(req.body);
  _getEngine().securityEvents.emitOrganizationCreated({ organizationId: org.id, name: org.name });
  _getEngine().audit.log({ action: 'organization.created', actor: req.userId, resourceType: 'organization', resourceId: org.id, outcome: 'success', ip: req.ip });
  return created(res, org);
}

function updateOrganization(req, res) {
  const { id } = req.params;
  const org = _getEngine().organizations.update(id, req.body);
  if (!org) return error(res, { statusCode: 404, name: 'NotFoundError', message: 'Organization not found' });
  return success(res, org);
}

function getUsers(req, res) {
  const users = _getEngine().listUsers(req.query);
  return success(res, users);
}

function createUser(req, res) {
  const user = _getEngine().registerUser(req.body);
  _getEngine().securityEvents.emitUserCreated({ userId: user.id, email: user.email });
  _getEngine().audit.log({ action: 'user.created', actor: req.userId, resourceType: 'user', resourceId: user.id, outcome: 'success', ip: req.ip });
  return created(res, { id: user.id, email: user.email, displayName: user.displayName });
}

function updateUser(req, res) {
  const { id } = req.params;
  if (req.body.password) {
    const strength = _getEngine().password.validateStrength(req.body.password);
    if (!strength.valid) return error(res, { statusCode: 400, name: 'ValidationError', message: `Password too weak: ${strength.errors.join(', ')}` });
  }
  const user = _getEngine().updateUser(id, req.body);
  if (!user) return error(res, { statusCode: 404, name: 'NotFoundError', message: 'User not found' });
  return success(res, { id: user.id, email: user.email, displayName: user.displayName });
}

function deleteUser(req, res) {
  const { id } = req.params;
  const deleted = _getEngine().deleteUser(id);
  if (!deleted) return error(res, { statusCode: 404, name: 'NotFoundError', message: 'User not found' });
  _getEngine().securityEvents.emitUserDeleted({ userId: id });
  _getEngine().audit.log({ action: 'user.deleted', actor: req.userId, resourceType: 'user', resourceId: id, outcome: 'success', ip: req.ip });
  return success(res, { deleted: true });
}

function getRoles(req, res) {
  const roles = _getEngine().roles.listRoles();
  return success(res, roles);
}

function createRole(req, res) {
  try {
    const role = _getEngine().roles.createRole(req.body);
    return created(res, role);
  } catch (e) {
    return error(res, { statusCode: 400, name: 'ValidationError', message: e.message });
  }
}

function updateRole(req, res) {
  const { id } = req.params;
  const role = _getEngine().roles.updateRole(id, req.body);
  if (!role) return error(res, { statusCode: 404, name: 'NotFoundError', message: 'Role not found' });
  _getEngine().securityEvents.emitRoleChanged({ roleId: id, changes: req.body });
  return success(res, role);
}

function deleteRole(req, res) {
  const { id } = req.params;
  const deleted = _getEngine().roles.deleteRole(id);
  if (!deleted) return error(res, { statusCode: 404, name: 'NotFoundError', message: 'Role not found or system role' });
  return success(res, { deleted: true });
}

function getPermissions(req, res) {
  const permissions = _getEngine().permissions.listPermissions();
  return success(res, permissions);
}

function getAudit(req, res) {
  const { action, actor, resourceType, resourceId, severity, outcome, since, until, search, page, limit } = req.query;
  const result = _getEngine().auditSearch.search({ action, actor, resourceType, resourceId, severity, outcome, since: since ? parseInt(since) : undefined, until: until ? parseInt(until) : undefined, search, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
  return success(res, result.results, { total: result.total, page: result.page, limit: result.limit });
}

function getSecurityEvents(req, res) {
  const { event, since } = req.query;
  const events = _getEngine().securityEvents.getHistory({ event, since: since ? parseInt(since) : undefined });
  return success(res, events);
}

function getThreats(req, res) {
  const { severity, resolved, since } = req.query;
  const filter = {};
  if (severity) filter.severity = severity;
  if (resolved !== undefined) filter.resolved = resolved === 'true';
  if (since) filter.since = parseInt(since);
  const threats = _getEngine().threats.getDetectedThreats(filter);
  return success(res, threats, { stats: _getEngine().threats.getStats() });
}

function createInvitation(req, res) {
  const invitation = _getEngine().invitations.create(req.body);
  _getEngine().securityEvents.emitInvitationSent({ invitationId: invitation.id, email: invitation.email, organizationId: invitation.organizationId });
  _getEngine().audit.log({ action: 'invitation.sent', actor: req.userId, resourceType: 'invitation', resourceId: invitation.id, outcome: 'success', ip: req.ip });
  return created(res, invitation);
}

function syncScim(req, res) {
  const { users, groups } = req.body;
  const result = _getEngine().scim.sync(users || [], groups || []);
  _getEngine().scim.recordSync(result);
  _getEngine().audit.log({ action: 'scim.sync', actor: req.userId, resourceType: 'scim', outcome: 'success', details: result, ip: req.ip });
  return success(res, result);
}

function getSecurityReport(req, res) {
  const report = _getEngine().generateSecurityReport();
  return success(res, report);
}

function getHealth(req, res) {
  return success(res, _getEngine().getHealth());
}

module.exports = {
  login, logout, refresh, verifyMfa, getMe,
  getSessions, deleteSession,
  getOrganizations, createOrganization, updateOrganization,
  getUsers, createUser, updateUser, deleteUser,
  getRoles, createRole, updateRole, deleteRole,
  getPermissions, getAudit, getSecurityEvents, getThreats,
  createInvitation, syncScim, getSecurityReport, getHealth
};
