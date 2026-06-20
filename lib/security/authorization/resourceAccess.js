class ResourceAccess {
  constructor() {
    this._grants = new Map();
  }

  grantAccess(userId, resourceType, resourceId, permissions = ['read']) {
    const key = `${userId}:${resourceType}:${resourceId}`;
    this._grants.set(key, { userId, resourceType, resourceId, permissions, grantedAt: Date.now() });
    return true;
  }

  revokeAccess(userId, resourceType, resourceId) {
    const key = `${userId}:${resourceType}:${resourceId}`;
    return this._grants.delete(key);
  }

  checkAccess(userId, resourceType, resourceId, permission = 'read') {
    const direct = this._grants.get(`${userId}:${resourceType}:${resourceId}`);
    if (direct && direct.permissions.includes(permission)) return { allowed: true };
    if (direct && direct.permissions.includes('*')) return { allowed: true };
    const wildcard = this._grants.get(`${userId}:${resourceType}:*`);
    if (wildcard && wildcard.permissions.includes(permission)) return { allowed: true };
    return { allowed: false, reason: 'No direct grant' };
  }

  getUserGrants(userId) {
    return Array.from(this._grants.values()).filter(g => g.userId === userId);
  }

  getResourceGrants(resourceType, resourceId) {
    return Array.from(this._grants.values()).filter(g => g.resourceType === resourceType && g.resourceId === resourceId);
  }

  updatePermissions(userId, resourceType, resourceId, permissions) {
    const key = `${userId}:${resourceType}:${resourceId}`;
    const grant = this._grants.get(key);
    if (!grant) return false;
    grant.permissions = permissions;
    return true;
  }

  clear() {
    this._grants.clear();
  }
}

module.exports = { ResourceAccess };
