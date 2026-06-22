const PERMISSIONS = {
  INTEGRATIONS_READ: 'integrations.read',
  INTEGRATIONS_WRITE: 'integrations.write',
  INTEGRATIONS_ADMIN: 'integrations.admin',
  WEBHOOKS: 'webhooks',
  SYNC: 'sync',
  SECRETS: 'secrets'
};

class IntegrationPermissions {
  constructor() {
    this._grants = {};
  }

  grant(provider, permission) {
    if (!this._grants[provider]) {
      this._grants[provider] = new Set();
    }
    this._grants[provider].add(permission);
  }

  revoke(provider, permission) {
    if (this._grants[provider]) {
      this._grants[provider].delete(permission);
    }
  }

  hasPermission(provider, permission) {
    return this._grants[provider] ? this._grants[provider].has(permission) : false;
  }

  getPermissions(provider) {
    return this._grants[provider] ? Array.from(this._grants[provider]) : [];
  }

  revokeAll(provider) {
    delete this._grants[provider];
  }

  clear() {
    this._grants = {};
  }
}

IntegrationPermissions.PERMISSIONS = PERMISSIONS;
module.exports = { IntegrationPermissions, PERMISSIONS };
