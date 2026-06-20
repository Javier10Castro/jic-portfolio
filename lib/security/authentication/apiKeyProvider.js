const crypto = require('crypto');

class ApiKeyProvider {
  constructor(options = {}) {
    this._keys = new Map();
    this._hashAlgorithm = options.hashAlgorithm || 'sha256';
    this._keyPrefix = options.keyPrefix || 'aip_';
    this._defaultExpiry = options.defaultExpiry || 86400 * 90;
  }

  generateKey(metadata = {}) {
    const raw = crypto.randomBytes(32).toString('hex');
    const apiKey = `${this._keyPrefix}${raw}`;
    const hash = this._hash(apiKey);
    const id = crypto.randomUUID();
    const now = Date.now();
    this._keys.set(id, {
      id,
      hash,
      prefix: apiKey.substring(0, 8),
      metadata,
      createdAt: now,
      expiresAt: now + this._defaultExpiry * 1000,
      revoked: false,
      lastUsedAt: null
    });
    return { id, apiKey, expiresAt: now + this._defaultExpiry * 1000 };
  }

  validateKey(apiKey) {
    const hash = this._hash(apiKey);
    for (const entry of this._keys.values()) {
      if (entry.hash === hash) {
        if (entry.revoked) return { valid: false, error: 'API key revoked' };
        if (Date.now() > entry.expiresAt) return { valid: false, error: 'API key expired' };
        entry.lastUsedAt = Date.now();
        return { valid: true, key: entry };
      }
    }
    return { valid: false, error: 'Invalid API key' };
  }

  revokeKey(id) {
    const key = this._keys.get(id);
    if (!key) return false;
    key.revoked = true;
    return true;
  }

  getKey(id) {
    return this._keys.get(id) || null;
  }

  listKeys(filter = {}) {
    let results = Array.from(this._keys.values());
    if (filter.revoked !== undefined) results = results.filter(k => k.revoked === filter.revoked);
    return results;
  }

  _hash(data) {
    return crypto.createHash(this._hashAlgorithm).update(data).digest('hex');
  }
}

module.exports = { ApiKeyProvider };
