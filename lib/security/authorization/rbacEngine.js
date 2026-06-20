class RbacEngine {
  constructor() {
    this._roleAssignments = new Map();
    this._defaultRoles = ['viewer', 'editor', 'admin', 'owner', 'super_admin'];
  }

  assignRole(userId, role, scope = { type: 'global', id: null }) {
    const key = `${userId}:${scope.type}:${scope.id || 'global'}`;
    this._roleAssignments.set(key, { userId, role, scope, assignedAt: Date.now() });
    return true;
  }

  removeRole(userId, role, scope = { type: 'global', id: null }) {
    const key = `${userId}:${scope.type}:${scope.id || 'global'}`;
    const current = this._roleAssignments.get(key);
    if (current && current.role === role) {
      this._roleAssignments.delete(key);
      return true;
    }
    return false;
  }

  getUserRoles(userId) {
    const roles = [];
    for (const entry of this._roleAssignments.values()) {
      if (entry.userId === userId) roles.push(entry);
    }
    return roles;
  }

  getRole(userId, scope = { type: 'global', id: null }) {
    const key = `${userId}:${scope.type}:${scope.id || 'global'}`;
    return this._roleAssignments.get(key) || null;
  }

  getUsersByRole(role) {
    return Array.from(this._roleAssignments.values()).filter(e => e.role === role).map(e => e.userId);
  }

  hasRole(userId, role, scope = { type: 'global', id: null }) {
    const entry = this.getRole(userId, scope);
    if (!entry) return false;
    return entry.role === role;
  }

  getEffectiveRole(userId, scope = { type: 'global', id: null }) {
    const direct = this.getRole(userId, scope);
    if (direct) return direct.role;
    if (scope.type === 'workspace') {
      const allOrgRoles = Array.from(this._roleAssignments.values()).filter(e => e.userId === userId && e.scope.type === 'organization');
      if (allOrgRoles.length > 0) return allOrgRoles[0].role;
    }
    const global = this.getRole(userId, { type: 'global', id: null });
    return global ? global.role : null;
  }

  getAllAssignments() {
    return Array.from(this._roleAssignments.values());
  }

  clear() {
    this._roleAssignments.clear();
  }

  getRoleHierarchy() {
    return ['viewer', 'editor', 'admin', 'owner', 'super_admin'];
  }
}

module.exports = { RbacEngine };
