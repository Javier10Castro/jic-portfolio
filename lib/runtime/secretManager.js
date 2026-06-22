const { SecretProviders } = require('./secretProviders');
const { SecretRotation } = require('./secretRotation');
const { SecretVersioning } = require('./secretVersioning');
const { SecretAudit } = require('./secretAudit');

class SecretManager {
  constructor() {
    this._providers = new SecretProviders();
    this._rotation = new SecretRotation();
    this._versioning = new SecretVersioning();
    this._audit = new SecretAudit();
    this._localStore = new Map();
  }

  getSecret(key, context) {
    if (!key) throw new Error('key is required');
    const provider = this._providers.getProvider('default');
    if (provider) {
      try {
        return provider.getSecret(key, context);
      } catch (e) {
        this._audit.recordAccess(key, 'read', context && context.actor ? context.actor : 'system');
        return null;
      }
    }
    this._audit.recordAccess(key, 'read', context && context.actor ? context.actor : 'system');
    if (context && context.simulate) {
      return '***masked***';
    }
    const local = this._localStore.get(key);
    return local !== undefined ? local : null;
  }

  setSecret(key, value) {
    if (!key || value === undefined) throw new Error('key and value are required');
    const provider = this._providers.getProvider('default');
    if (provider) {
      provider.setSecret(key, value);
    } else {
      this._localStore.set(key, value);
    }
    this._versioning.createVersion(key, value);
    this._audit.recordAccess(key, 'write', 'system');
  }

  rotateSecret(key) {
    if (!key) throw new Error('key is required');
    const result = this._rotation.rotate(key);
    this._audit.recordAccess(key, 'rotate', 'system');
    return result;
  }

  getStatus() {
    return {
      total: this._localStore.size,
      providers: this._providers.listProviders().length,
      rotations: this._rotation.listRotations().length
    };
  }

  clear() {
    this._providers.clear();
    this._rotation.clear();
    this._versioning.clear();
    this._audit.clear();
    this._localStore.clear();
  }
}

module.exports = { SecretManager };
