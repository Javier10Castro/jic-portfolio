class SafeMode {
  constructor() {
    this._safeMode = {
      active: false,
      enteredAt: null,
      reason: null
    };
    this._safeFeatures = new Set();
    this._defaultFeatures = ['read', 'status', 'health'];
  }

  enterSafeMode(reason) {
    if (!reason) {
      return false;
    }
    if (this._safeMode.active) {
      return false;
    }
    this._safeMode.active = true;
    this._safeMode.enteredAt = Date.now();
    this._safeMode.reason = reason;
    return true;
  }

  exitSafeMode() {
    if (!this._safeMode.active) {
      return false;
    }
    this._safeMode.active = false;
    this._safeMode.enteredAt = null;
    this._safeMode.reason = null;
    return true;
  }

  isSafeMode() {
    return this._safeMode.active;
  }

  getSafeModeInfo() {
    return {
      active: this._safeMode.active,
      enteredAt: this._safeMode.enteredAt,
      reason: this._safeMode.reason
    };
  }

  addSafeFeature(feature) {
    if (!feature) {
      return false;
    }
    this._safeFeatures.add(feature);
    return true;
  }

  isFeatureAllowed(feature) {
    if (!feature) {
      return false;
    }
    if (!this._safeMode.active) {
      return true;
    }
    if (this._defaultFeatures.indexOf(feature) !== -1) {
      return true;
    }
    return this._safeFeatures.has(feature);
  }

  clear() {
    this._safeMode = { active: false, enteredAt: null, reason: null };
    this._safeFeatures = new Set();
  }
}

module.exports = { SafeMode };
