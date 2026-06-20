const crypto = require('crypto');

class KeyRotation {
  constructor(options = {}) {
    this._keys = new Map();
    this._rotationHistory = new Map();
    this._defaultAlgorithm = options.defaultAlgorithm || 'aes-256-gcm';
    this._defaultRotationInterval = options.defaultRotationInterval || 86400000 * 90;
    this._keySize = options.keySize || 32;
  }

  generateKey(name, algorithm) {
    const keyMaterial = crypto.randomBytes(this._keySize);
    const version = this._getNextVersion(name);
    const key = {
      name, version, algorithm: algorithm || this._defaultAlgorithm,
      keyMaterial: keyMaterial.toString('hex'),
      createdAt: Date.now(),
      expiresAt: Date.now() + this._defaultRotationInterval,
      active: true
    };
    const id = `key-${name}-v${version}`;
    this._keys.set(id, key);
    return { id, name, version, algorithm: key.algorithm };
  }

  getActiveKey(name) {
    for (const [id, key] of this._keys) {
      if (key.name === name && key.active && Date.now() < key.expiresAt) return key;
    }
    return null;
  }

  rotate(name) {
    const current = this.getActiveKey(name);
    if (current) {
      current.active = false;
      this._recordRotation(current);
    }
    return this.generateKey(name);
  }

  getKey(id) { return this._keys.get(id) || null; }

  listKeys() {
    return Array.from(this._keys.values()).map(k => ({
      id: `key-${k.name}-v${k.version}`, name: k.name, version: k.version,
      algorithm: k.algorithm, createdAt: k.createdAt, expiresAt: k.expiresAt, active: k.active
    }));
  }

  getRotationHistory(name) {
    return this._rotationHistory.get(name) || [];
  }

  getExpiringKeys(days = 30) {
    const threshold = Date.now() + days * 86400000;
    return this.listKeys().filter(k => k.active && k.expiresAt <= threshold);
  }

  _getNextVersion(name) {
    let max = 0;
    for (const [id, key] of this._keys) {
      if (key.name === name && key.version > max) max = key.version;
    }
    return max + 1;
  }

  _recordRotation(key) {
    if (!this._rotationHistory.has(key.name)) this._rotationHistory.set(key.name, []);
    this._rotationHistory.get(key.name).push({ ...key, rotatedAt: Date.now() });
  }

  clear() {
    this._keys.clear();
    this._rotationHistory.clear();
  }
}

module.exports = { KeyRotation };
