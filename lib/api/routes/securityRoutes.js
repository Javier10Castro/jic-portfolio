const { Router } = require('express');
const securityController = require('../controllers/securityController');

function createSecurityRoutes() {
  const router = Router();

  router.post('/auth/login', securityController.login);
  router.post('/auth/logout', securityController.logout);
  router.post('/auth/refresh', securityController.refresh);
  router.post('/auth/mfa/verify', securityController.verifyMfa);
  router.get('/me', securityController.getMe);
  router.get('/sessions', securityController.getSessions);
  router.delete('/sessions/:id', securityController.deleteSession);
  router.get('/organizations', securityController.getOrganizations);
  router.post('/organizations', securityController.createOrganization);
  router.patch('/organizations/:id', securityController.updateOrganization);
  router.get('/users', securityController.getUsers);
  router.post('/users', securityController.createUser);
  router.patch('/users/:id', securityController.updateUser);
  router.delete('/users/:id', securityController.deleteUser);
  router.get('/roles', securityController.getRoles);
  router.post('/roles', securityController.createRole);
  router.patch('/roles/:id', securityController.updateRole);
  router.delete('/roles/:id', securityController.deleteRole);
  router.get('/permissions', securityController.getPermissions);
  router.get('/audit', securityController.getAudit);
  router.get('/security/events', securityController.getSecurityEvents);
  router.get('/threats', securityController.getThreats);
  router.post('/invitations', securityController.createInvitation);
  router.post('/scim/sync', securityController.syncScim);
  router.get('/report', securityController.getSecurityReport);
  router.get('/health', securityController.getHealth);

  return router;
}

module.exports = { createSecurityRoutes };
