class AccountProtection {
  constructor(options = {}) {
    this._lockouts = new Map();
    this._flags = new Map();
    this._maxFailedAttempts = options.maxFailedAttempts || 5;
    this._lockoutDuration = options.lockoutDuration || 900000;
    this._passwordHistory = new Map();
    this._passwordMaxHistory = options.passwordMaxHistory || 5;
  }

  recordFailedAttempt(userId, context = {}) {
    if (!this._lockouts.has(userId)) {
      this._lockouts.set(userId, { attempts: [], lockedUntil: null, consecutiveFailures: 0 });
    }
    const record = this._lockouts.get(userId);
    record.consecutiveFailures++;
    record.attempts.push({ timestamp: Date.now(), ip: context.ip, userAgent: context.userAgent });
    if (record.consecutiveFailures >= this._maxFailedAttempts) {
      record.lockedUntil = Date.now() + this._lockoutDuration;
      return { locked: true, lockedUntil: record.lockedUntil, attempts: record.consecutiveFailures };
    }
    return { locked: false, attempts: record.consecutiveFailures, remaining: this._maxFailedAttempts - record.consecutiveFailures };
  }

  recordSuccessfulLogin(userId) {
    const record = this._lockouts.get(userId);
    if (record) record.consecutiveFailures = 0;
  }

  isLocked(userId) {
    const record = this._lockouts.get(userId);
    if (!record || !record.lockedUntil) return false;
    if (Date.now() > record.lockedUntil) {
      record.lockedUntil = null;
      record.consecutiveFailures = 0;
      return false;
    }
    return true;
  }

  unlock(userId) {
    const record = this._lockouts.get(userId);
    if (!record) return false;
    record.lockedUntil = null;
    record.consecutiveFailures = 0;
    return true;
  }

  setFlag(userId, flag, value = true) {
    if (!this._flags.has(userId)) this._flags.set(userId, {});
    this._flags.get(userId)[flag] = { value, setAt: Date.now() };
  }

  getFlag(userId, flag) {
    const userFlags = this._flags.get(userId);
    if (!userFlags) return null;
    const entry = userFlags[flag];
    return entry ? entry.value : null;
  }

  getFlags(userId) {
    const userFlags = this._flags.get(userId);
    if (!userFlags) return {};
    const result = {};
    for (const [key, entry] of Object.entries(userFlags)) result[key] = entry.value;
    return result;
  }

  recordPassword(userId, passwordHash) {
    if (!this._passwordHistory.has(userId)) this._passwordHistory.set(userId, []);
    const history = this._passwordHistory.get(userId);
    history.push({ hash: passwordHash, createdAt: Date.now() });
    if (history.length > this._passwordMaxHistory) history.shift();
  }

  isPasswordReused(userId, passwordHash) {
    const history = this._passwordHistory.get(userId) || [];
    return history.some(h => h.hash === passwordHash);
  }

  requirePasswordChange(userId) {
    this.setFlag(userId, 'require_password_change', true);
  }

  getLockoutStatus(userId) {
    const record = this._lockouts.get(userId);
    if (!record) return { locked: false, attempts: 0 };
    const locked = !!(record.lockedUntil && Date.now() < record.lockedUntil);
    return {
      locked,
      attempts: record.consecutiveFailures,
      maxAttempts: this._maxFailedAttempts,
      lockedUntil: record.lockedUntil,
      remainingLockout: locked ? Math.ceil((record.lockedUntil - Date.now()) / 1000) : 0
    };
  }

  clear() {
    this._lockouts.clear();
    this._flags.clear();
    this._passwordHistory.clear();
  }
}

module.exports = { AccountProtection };
