const crypto = require('crypto');

class SecretManager {
  constructor(options = {}) {
    this._secrets = new Map();
    this._masterKey = options.masterKey || crypto.randomBytes(32).toString('hex');
    this._defaultRotationDays = options.defaultRotationDays || 90;
  }

  store(name, value, metadata = {}) {
    const id = crypto.randomUUID();
    const encrypted = this._encrypt(value);
    const secret = {
      id, name, encrypted, metadata,
      version: 1, createdAt: Date.now(),
      expiresAt: Date.now() + (metadata.ttl || this._defaultRotationDays * 86400000),
      rotationDueAt: Date.now() + this._defaultRotationDays * 86400000
    };
    this._secrets.set(id, secret);
    this._secrets.set(name, secret);
    return { id, name, version: 1 };
  }

  retrieve(nameOrId) {
    const secret = this._secrets.get(nameOrId);
    if (!secret) return null;
    if (Date.now() > secret.expiresAt) return null;
    return { id: secret.id, name: secret.name, value: this._decrypt(secret.encrypted), version: secret.version, metadata: secret.metadata };
  }

  rotate(nameOrId) {
    const current = this._secrets.get(nameOrId);
    if (!current) return null;
    const decrypted = this._decrypt(current.encrypted);
    current.version++;
    current.encrypted = this._encrypt(decrypted);
    current.rotationDueAt = Date.now() + this._defaultRotationDays * 86400000;
    current.rotatedAt = Date.now();
    return { id: current.id, name: current.name, version: current.version };
  }

  delete(nameOrId) {
    const secret = this._secrets.get(nameOrId);
    if (!secret) return false;
    this._secrets.delete(secret.id);
    this._secrets.delete(secret.name);
    return true;
  }

  list() {
    const seen = new Set();
    const results = [];
    for (const [key, secret] of this._secrets) {
      if (seen.has(secret.id)) continue;
      seen.add(secret.id);
      results.push({ id: secret.id, name: secret.name, version: secret.version, createdAt: secret.createdAt, rotationDueAt: secret.rotationDueAt, expiresAt: secret.expiresAt });
    }
    return results;
  }

  getExpiringSecrets(days = 7) {
    const threshold = Date.now() + days * 86400000;
    return this.list().filter(s => s.rotationDueAt <= threshold || s.expiresAt <= threshold);
  }

  _encrypt(value) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this._masterKey, 'hex').subarray(0, 32), iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  _decrypt(encrypted) {
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const data = parts[2];
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(this._masterKey, 'hex').subarray(0, 32), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  clear() {
    this._secrets.clear();
  }
}

module.exports = { SecretManager };
