class SecretRotation {
  constructor() {
    this._rotations = new Map();
    this._timers = new Map();
  }

  scheduleRotation(secretKey, interval) {
    if (!secretKey) {
      throw new Error('secretKey is required');
    }
    interval = Number(interval);
    if (isNaN(interval) || interval <= 0) {
      throw new Error('interval must be a positive number');
    }
    const existing = this._rotations.get(secretKey);
    if (existing) {
      existing.interval = interval;
      existing.nextRotation = Date.now() + interval;
    } else {
      this._rotations.set(secretKey, {
        secretKey,
        interval,
        lastRotated: null,
        nextRotation: Date.now() + interval
      });
    }
  }

  rotate(secretKey) {
    if (!secretKey) return false;
    const rotation = this._rotations.get(secretKey);
    if (!rotation) return false;
    rotation.lastRotated = new Date().toISOString();
    rotation.nextRotation = Date.now() + rotation.interval;
    return true;
  }

  getRotationStatus(secretKey) {
    if (!secretKey) return null;
    const rotation = this._rotations.get(secretKey);
    if (!rotation) return null;
    return {
      lastRotated: rotation.lastRotated,
      nextRotation: rotation.nextRotation ? new Date(rotation.nextRotation).toISOString() : null,
      interval: rotation.interval
    };
  }

  listRotations() {
    return Array.from(this._rotations.values()).map(r => ({
      secretKey: r.secretKey,
      interval: r.interval,
      lastRotated: r.lastRotated,
      nextRotation: r.nextRotation ? new Date(r.nextRotation).toISOString() : null
    }));
  }

  cancelRotation(secretKey) {
    if (!secretKey) return false;
    const existed = this._rotations.has(secretKey);
    this._rotations.delete(secretKey);
    if (this._timers.has(secretKey)) {
      clearInterval(this._timers.get(secretKey));
      this._timers.delete(secretKey);
    }
    return existed;
  }

  clear() {
    for (const timer of this._timers.values()) {
      clearInterval(timer);
    }
    this._timers.clear();
    this._rotations.clear();
  }
}

module.exports = { SecretRotation };
