const crypto = require('crypto');

class TokenRotation {
  constructor(options = {}) {
    this._rotationHistory = new Map();
    this._maxHistoryPerToken = options.maxHistoryPerToken || 5;
    this._rotationInterval = options.rotationInterval || 3600000;
  }

  rotate(oldToken, tokenType = 'access', metadata = {}) {
    const newToken = crypto.randomBytes(32).toString('hex');
    const rotation = {
      oldToken, newToken, tokenType,
      timestamp: Date.now(),
      metadata,
      expiresAt: Date.now() + this._rotationInterval
    };
    if (!this._rotationHistory.has(oldToken)) this._rotationHistory.set(oldToken, []);
    const history = this._rotationHistory.get(oldToken);
    history.push(rotation);
    if (history.length > this._maxHistoryPerToken) history.shift();
    return { token: newToken, rotation };
  }

  validate(originalToken, currentToken) {
    const history = this._rotationHistory.get(originalToken);
    if (!history) return { valid: false, error: 'No rotation history' };
    const lastRotation = history[history.length - 1];
    if (!lastRotation) return { valid: false, error: 'No rotation record' };
    if (lastRotation.newToken !== currentToken) return { valid: false, error: 'Token mismatch — possible reuse attack' };
    return { valid: true, rotation: lastRotation };
  }

  getRotationHistory(token) {
    return this._rotationHistory.get(token) || [];
  }

  revokeTokenChain(token) {
    let count = 0;
    for (const [key, history] of this._rotationHistory) {
      const matches = history.filter(r => r.oldToken === token || r.newToken === token);
      count += matches.length;
    }
    this._rotationHistory.delete(token);
    return count;
  }

  getStats() {
    let totalRotations = 0;
    for (const history of this._rotationHistory.values()) totalRotations += history.length;
    return { totalTokens: this._rotationHistory.size, totalRotations };
  }

  clear() {
    this._rotationHistory.clear();
  }
}

module.exports = { TokenRotation };
