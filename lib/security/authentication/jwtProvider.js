const crypto = require('crypto');

class JwtProvider {
  constructor(options = {}) {
    this._secret = options.secret || 'dev-jwt-secret';
    this._issuer = options.issuer || 'ai-platform';
    this._audience = options.audience || 'ai-platform-api';
    this._accessTokenExpiry = options.accessTokenExpiry || 3600;
    this._refreshTokenExpiry = options.refreshTokenExpiry || 86400 * 7;
    this._algorithm = 'HS256';
  }

  generateAccessToken(payload = {}) {
    const header = this._base64UrlEncode(JSON.stringify({ alg: this._algorithm, typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const body = this._base64UrlEncode(JSON.stringify({
      ...payload,
      iss: this._issuer,
      aud: this._audience,
      iat: now,
      exp: now + this._accessTokenExpiry,
      type: 'access'
    }));
    const signature = this._sign(`${header}.${body}`);
    return `${header}.${body}.${signature}`;
  }

  generateRefreshToken(payload = {}) {
    const header = this._base64UrlEncode(JSON.stringify({ alg: this._algorithm, typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const body = this._base64UrlEncode(JSON.stringify({
      ...payload,
      iss: this._issuer,
      aud: this._audience,
      iat: now,
      exp: now + this._refreshTokenExpiry,
      type: 'refresh'
    }));
    const signature = this._sign(`${header}.${body}`);
    return `${header}.${body}.${signature}`;
  }

  verify(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return { valid: false, error: 'Malformed token' };
      const [header, body, signature] = parts;
      const expected = this._sign(`${header}.${body}`);
      if (signature !== expected) return { valid: false, error: 'Invalid signature' };
      const decoded = JSON.parse(this._base64UrlDecode(body));
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) return { valid: false, error: 'Token expired' };
      return { valid: true, payload: decoded };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  refresh(accessToken) {
    const result = this.verify(accessToken);
    if (!result.valid) return { success: false, error: result.error };
    if (result.payload.type !== 'refresh') return { success: false, error: 'Not a refresh token' };
    const { iss, aud, iat, exp, type, ...payload } = result.payload;
    return { success: true, accessToken: this.generateAccessToken(payload), refreshToken: this.generateRefreshToken(payload) };
  }

  decode(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(this._base64UrlDecode(parts[1]));
    } catch { return null; }
  }

  _sign(data) {
    return crypto.createHmac('sha256', this._secret).update(data).digest('base64url');
  }

  _base64UrlEncode(data) {
    return Buffer.from(data).toString('base64url');
  }

  _base64UrlDecode(data) {
    return Buffer.from(data, 'base64url').toString('utf8');
  }
}

module.exports = { JwtProvider };
