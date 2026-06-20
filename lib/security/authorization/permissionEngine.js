class PermissionEngine {
  constructor() {
    this._permissions = new Map();
    this._rolePermissions = new Map();
    this._initDefaults();
  }

  _initDefaults() {
    const defaults = {
      viewer: ['read:project', 'read:workspace', 'read:organization'],
      editor: ['read:project', 'write:project', 'read:workspace', 'write:workspace', 'read:organization'],
      admin: ['read:project', 'write:project', 'delete:project', 'read:workspace', 'write:workspace', 'delete:workspace', 'read:organization', 'write:organization', 'manage:members'],
      owner: ['read:project', 'write:project', 'delete:project', 'read:workspace', 'write:workspace', 'delete:workspace', 'read:organization', 'write:organization', 'delete:organization', 'manage:members', 'manage:billing', 'manage:settings'],
      super_admin: ['*']
    };
    for (const [role, perms] of Object.entries(defaults)) {
      this._rolePermissions.set(role, new Set(perms));
    }
  }

  registerPermission(name, description) {
    this._permissions.set(name, { name, description, registeredAt: Date.now() });
  }

  assignPermissionToRole(role, permission) {
    if (!this._rolePermissions.has(role)) this._rolePermissions.set(role, new Set());
    this._rolePermissions.get(role).add(permission);
  }

  removePermissionFromRole(role, permission) {
    const perms = this._rolePermissions.get(role);
    if (!perms) return false;
    return perms.delete(permission);
  }

  hasPermission(role, permission) {
    const perms = this._rolePermissions.get(role);
    if (!perms) return false;
    if (perms.has('*')) return true;
    if (perms.has(permission)) return true;
    const parts = permission.split(':');
    if (parts.length === 2 && perms.has(`${parts[0]}:*`)) return true;
    return false;
  }

  getPermissionsForRole(role) {
    return Array.from(this._rolePermissions.get(role) || []);
  }

  getEffectivePermissions(roles) {
    const all = new Set();
    for (const role of roles) {
      const perms = this._rolePermissions.get(role);
      if (perms) {
        if (perms.has('*')) return ['*'];
        for (const p of perms) all.add(p);
      }
    }
    return Array.from(all);
  }

  checkAccess(userRole, resource, action) {
    const permission = `${action}:${resource}`;
    if (this.hasPermission(userRole, permission)) return { allowed: true };
    const wildcard = `${action}:*`;
    if (this.hasPermission(userRole, wildcard)) return { allowed: true };
    return { allowed: false, reason: `Missing permission: ${permission}` };
  }

  listPermissions() {
    return Array.from(this._permissions.values());
  }

  clear() {
    this._permissions.clear();
    this._rolePermissions.clear();
    this._initDefaults();
  }
}

module.exports = { PermissionEngine };
