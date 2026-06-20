const crypto = require('crypto');

class RoleManager {
  constructor() {
    this._roles = new Map();
    this._initDefaults();
  }

  _initDefaults() {
    const defaults = [
      { id: 'role-viewer', name: 'Viewer', description: 'Read-only access', hierarchy: 10, system: true },
      { id: 'role-editor', name: 'Editor', description: 'Can create and edit resources', hierarchy: 20, system: true },
      { id: 'role-admin', name: 'Admin', description: 'Full administrative access', hierarchy: 30, system: true },
      { id: 'role-owner', name: 'Owner', description: 'Organization ownership', hierarchy: 40, system: true },
      { id: 'role-super-admin', name: 'Super Admin', description: 'System-wide access', hierarchy: 50, system: true }
    ];
    for (const role of defaults) this._roles.set(role.id, { ...role, createdAt: Date.now(), permissions: [] });
  }

  createRole(input) {
    const id = input.id || `role-${crypto.randomUUID().substring(0, 8)}`;
    if (this._roles.has(id)) throw new Error(`Role ${id} already exists`);
    const role = {
      id, name: input.name, description: input.description || '', parentId: input.parentId || null,
      hierarchy: input.hierarchy || 1, system: input.system || false,
      permissions: input.permissions || [], createdAt: Date.now()
    };
    this._roles.set(id, role);
    return role;
  }

  updateRole(id, updates) {
    const role = this._roles.get(id);
    if (!role) return null;
    if (role.system && (updates.name || updates.description === false)) return null;
    Object.assign(role, updates, { updatedAt: Date.now() });
    return role;
  }

  deleteRole(id) {
    const role = this._roles.get(id);
    if (!role || role.system) return false;
    for (const r of this._roles.values()) { if (r.parentId === id) r.parentId = null; }
    return this._roles.delete(id);
  }

  getRole(id) {
    return this._roles.get(id) || null;
  }

  listRoles() {
    return Array.from(this._roles.values());
  }

  getInheritedPermissions(roleId) {
    const permissions = new Set();
    const visited = new Set();
    const walk = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      const role = this._roles.get(id);
      if (!role) return;
      for (const p of role.permissions) permissions.add(p);
      if (role.parentId) walk(role.parentId);
    };
    walk(roleId);
    return Array.from(permissions);
  }

  getRoleHierarchy() {
    return Array.from(this._roles.values()).sort((a, b) => b.hierarchy - a.hierarchy);
  }

  clear() {
    this._roles.clear();
    this._initDefaults();
  }
}

module.exports = { RoleManager };
