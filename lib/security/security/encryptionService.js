const crypto = require('crypto');

class EncryptionService {
  constructor(options = {}) {
    this._algorithm = options.algorithm || 'aes-256-gcm';
    this._key = options.key || crypto.randomBytes(32).toString('hex');
    this._encoding = options.encoding || 'hex';
  }

  encrypt(data) {
    if (typeof data === 'object') data = JSON.stringify(data);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this._algorithm, Buffer.from(this._key, this._encoding).subarray(0, 32), iv);
    let encrypted = cipher.update(data, 'utf8', this._encoding);
    encrypted += cipher.final(this._encoding);
    const authTag = cipher.getAuthTag().toString(this._encoding);
    return { encrypted, iv: iv.toString(this._encoding), authTag, algorithm: this._algorithm };
  }

  decrypt(encrypted, iv, authTag) {
    const decipher = crypto.createDecipheriv(
      this._algorithm,
      Buffer.from(this._key, this._encoding).subarray(0, 32),
      Buffer.from(iv, this._encoding)
    );
    decipher.setAuthTag(Buffer.from(authTag, this._encoding));
    let decrypted = decipher.update(encrypted, this._encoding, 'utf8');
    decrypted += decipher.final('utf8');
    try { return JSON.parse(decrypted); } catch { return decrypted; }
  }

  hash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(data).digest(this._encoding);
  }

  generateSalt(length = 32) {
    return crypto.randomBytes(length).toString(this._encoding);
  }

  generateKey(length = 32) {
    return crypto.randomBytes(length).toString(this._encoding);
  }

  clear() {}
}

module.exports = { EncryptionService };
