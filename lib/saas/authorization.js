const ROLES = { OWNER: 'owner', ADMIN: 'admin', EDITOR: 'editor', VIEWER: 'viewer' };

const PERMISSIONS = {
  projects: { create: [], read: [], update: [], delete: [] },
  deployments: { create: [], read: [], rollback: [] },
  settings: { read: [], update: [] },
  billing: { read: [], update: [] },
  users: { read: [], invite: [], remove: [], updateRole: [] },
  audit: { read: [] },
  apiKeys: { create: [], read: [], revoke: [] },
};

PERMISSIONS.projects.create   = [ROLES.OWNER, ROLES.ADMIN, ROLES.EDITOR];
PERMISSIONS.projects.read     = [ROLES.OWNER, ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER];
PERMISSIONS.projects.update   = [ROLES.OWNER, ROLES.ADMIN, ROLES.EDITOR];
PERMISSIONS.projects.delete   = [ROLES.OWNER, ROLES.ADMIN];

PERMISSIONS.deployments.create  = [ROLES.OWNER, ROLES.ADMIN, ROLES.EDITOR];
PERMISSIONS.deployments.read    = [ROLES.OWNER, ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER];
PERMISSIONS.deployments.rollback = [ROLES.OWNER, ROLES.ADMIN];

PERMISSIONS.settings.read   = [ROLES.OWNER, ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER];
PERMISSIONS.settings.update = [ROLES.OWNER, ROLES.ADMIN];

PERMISSIONS.billing.read   = [ROLES.OWNER, ROLES.ADMIN];
PERMISSIONS.billing.update = [ROLES.OWNER];

PERMISSIONS.users.read      = [ROLES.OWNER, ROLES.ADMIN];
PERMISSIONS.users.invite    = [ROLES.OWNER, ROLES.ADMIN];
PERMISSIONS.users.remove    = [ROLES.OWNER, ROLES.ADMIN];
PERMISSIONS.users.updateRole = [ROLES.OWNER];

PERMISSIONS.audit.read = [ROLES.OWNER, ROLES.ADMIN];

PERMISSIONS.apiKeys.create = [ROLES.OWNER, ROLES.ADMIN];
PERMISSIONS.apiKeys.read   = [ROLES.OWNER, ROLES.ADMIN, ROLES.EDITOR];
PERMISSIONS.apiKeys.revoke = [ROLES.OWNER, ROLES.ADMIN];

function can(role, resource, action) {
  if (!role || !resource || !action) return false;
  const resourcePerms = PERMISSIONS[resource];
  if (!resourcePerms) return false;
  const actionPerms = resourcePerms[action];
  if (!actionPerms) return false;
  return actionPerms.includes(role);
}

function requireRole(role, resource, action) {
  if (!can(role, resource, action)) {
    throw new Error(`Forbidden: role "${role}" cannot ${action} on "${resource}"`);
  }
  return true;
}

function hasPermission(role, resource, action) {
  return can(role, resource, action);
}

function listPermissions(role) {
  const result = {};
  for (const [resource, actions] of Object.entries(PERMISSIONS)) {
    result[resource] = {};
    for (const [action, roles] of Object.entries(actions)) {
      result[resource][action] = roles.includes(role);
    }
  }
  return result;
}

module.exports = { ROLES, PERMISSIONS, can, requireRole, hasPermission, listPermissions };
