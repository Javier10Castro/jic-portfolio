const crypto = require('crypto');

class PasswordProvider {
  constructor(options = {}) {
    this._iterations = options.iterations || 100000;
    this._keyLength = options.keyLength || 64;
    this._digest = options.digest || 'sha512';
    this._saltLength = options.saltLength || 32;
    this._minLength = options.minLength || 8;
    this._requireUppercase = options.requireUppercase !== false;
    this._requireLowercase = options.requireLowercase !== false;
    this._requireNumber = options.requireNumber !== false;
    this._requireSpecial = options.requireSpecial !== false;
  }

  hash(password) {
    const salt = crypto.randomBytes(this._saltLength).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, this._iterations, this._keyLength, this._digest).toString('hex');
    return { hash, salt, iterations: this._iterations };
  }

  verify(password, hash, salt) {
    const computed = crypto.pbkdf2Sync(password, salt, this._iterations, this._keyLength, this._digest).toString('hex');
    return computed === hash;
  }

  validateStrength(password) {
    const errors = [];
    if (password.length < this._minLength) errors.push(`Minimum ${this._minLength} characters`);
    if (this._requireUppercase && !/[A-Z]/.test(password)) errors.push('Must contain uppercase letter');
    if (this._requireLowercase && !/[a-z]/.test(password)) errors.push('Must contain lowercase letter');
    if (this._requireNumber && !/\d/.test(password)) errors.push('Must contain number');
    if (this._requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Must contain special character');
    const score = Math.max(0, 100 - errors.length * 20);
    const strength = score >= 80 ? 'strong' : score >= 50 ? 'medium' : 'weak';
    return { valid: errors.length === 0, score, strength, errors };
  }
}

module.exports = { PasswordProvider };
