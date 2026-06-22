const PERMISSIONS = {
  CORE_READ: 'core.read',
  CORE_WRITE: 'core.write',
  API_ACCESS: 'api.access',
  WEBHOOKS: 'webhooks',
  FILESYSTEM_READ: 'filesystem.read',
  FILESYSTEM_WRITE: 'filesystem.write',
  NETWORK: 'network',
  STORAGE: 'storage',
  EVENTS: 'events',
  AGENTS: 'agents',
  WORKFLOWS: 'workflows',
  BILLING: 'billing',
  SECURITY: 'security',
  COST: 'cost',
  TELEMETRY: 'telemetry',
  ADMIN: 'admin'
};

class PluginPermissions {
  constructor() {
    this._granted = {};
  }

  grant(pluginId, permission) {
    if (!this._isValidPermission(permission)) return { success: false, error: `Invalid permission: ${permission}` };
    if (!this._granted[pluginId]) this._granted[pluginId] = [];
    if (!this._granted[pluginId].includes(permission)) this._granted[pluginId].push(permission);
    return { success: true };
  }

  revoke(pluginId, permission) {
    if (!this._granted[pluginId]) return { success: false, error: 'No permissions for plugin' };
    this._granted[pluginId] = this._granted[pluginId].filter(p => p !== permission);
    return { success: true };
  }

  hasPermission(pluginId, permission) {
    const perms = this._granted[pluginId] || [];
    return perms.includes(permission) || perms.includes(PERMISSIONS.ADMIN);
  }

  getPermissions(pluginId) { return this._granted[pluginId] ? [...this._granted[pluginId]] : []; }
  getPluginsWithPermission(permission) {
    return Object.entries(this._granted).filter(([, perms]) => perms.includes(permission)).map(([id]) => id);
  }

  revokeAll(pluginId) { delete this._granted[pluginId]; }

  _isValidPermission(perm) { return Object.values(PERMISSIONS).includes(perm); }

  clear() { this._granted = {}; }
}

module.exports = { PluginPermissions, PERMISSIONS };
