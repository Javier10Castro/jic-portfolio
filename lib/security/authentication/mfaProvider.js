const crypto = require('crypto');

class MfaProvider {
  constructor(options = {}) {
    this._mfaSecrets = new Map();
    this._recoveryCodes = new Map();
    this._issuer = options.issuer || 'AI Platform';
    this._totpWindow = options.totpWindow || 1;
  }

  generateSecret(userId) {
    const secret = crypto.randomBytes(20).toString('hex');
    this._mfaSecrets.set(userId, {
      secret,
      enabled: false,
      createdAt: Date.now(),
      verified: false
    });
    const recoveryCodes = [];
    for (let i = 0; i < 8; i++) {
      recoveryCodes.push(crypto.randomBytes(6).toString('hex').substring(0, 10));
    }
    this._recoveryCodes.set(userId, recoveryCodes.map(code => ({ code, used: false })));
    return {
      secret,
      qrCodeUrl: `otpauth://totp/${this._issuer}:${userId}?secret=${secret}&issuer=${this._issuer}`,
      recoveryCodes
    };
  }

  verifyToken(userId, token) {
    const mfa = this._mfaSecrets.get(userId);
    if (!mfa) return { valid: false, error: 'MFA not configured' };
    const expected = this._generateTOTP(mfa.secret, Math.floor(Date.now() / 30000));
    if (token === expected) {
      mfa.verified = true;
      return { valid: true };
    }
    for (let i = -this._totpWindow; i <= this._totpWindow; i++) {
      if (i === 0) continue;
      const alt = this._generateTOTP(mfa.secret, Math.floor(Date.now() / 30000) + i);
      if (token === alt) {
        mfa.verified = true;
        return { valid: true };
      }
    }
    const recoveryResult = this._useRecoveryCode(userId, token);
    if (recoveryResult) return { valid: true, method: 'recovery_code' };
    return { valid: false, error: 'Invalid token' };
  }

  enable(userId) {
    const mfa = this._mfaSecrets.get(userId);
    if (!mfa) return false;
    mfa.enabled = true;
    return true;
  }

  disable(userId) {
    this._mfaSecrets.delete(userId);
    this._recoveryCodes.delete(userId);
    return true;
  }

  isEnabled(userId) {
    const mfa = this._mfaSecrets.get(userId);
    return mfa ? mfa.enabled : false;
  }

  getRecoveryCodes(userId) {
    const codes = this._recoveryCodes.get(userId);
    return codes ? codes.map(c => ({ code: c.code, used: c.used })) : [];
  }

  getStatus(userId) {
    const mfa = this._mfaSecrets.get(userId);
    return {
      enabled: mfa ? mfa.enabled : false,
      verified: mfa ? mfa.verified : false,
      recoveryCodesRemaining: this._recoveryCodes.get(userId)?.filter(c => !c.used).length || 0
    };
  }

  _generateTOTP(secret, counter) {
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'));
    const buf = Buffer.alloc(8);
    for (let i = 7; i >= 0; i--) { buf[i] = counter & 0xff; counter = counter >> 8; }
    hmac.update(buf);
    const digest = hmac.digest();
    const offset = digest[digest.length - 1] & 0xf;
    const code = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
    return String(code % 1000000).padStart(6, '0');
  }

  _useRecoveryCode(userId, code) {
    const codes = this._recoveryCodes.get(userId);
    if (!codes) return false;
    const entry = codes.find(c => c.code === code && !c.used);
    if (!entry) return false;
    entry.used = true;
    return true;
  }
}

module.exports = { MfaProvider };
