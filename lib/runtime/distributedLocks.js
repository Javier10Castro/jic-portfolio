class DistributedLocks {
  constructor() {
    this._locks = {};
    this._idCounter = 0;
  }

  acquire(lockName, holder, ttl) {
    if (!lockName || !holder) {
      return null;
    }
    const now = Date.now();
    const existing = this._locks[lockName];
    if (existing && !existing.expired && (existing.acquiredAt + existing.ttl) > now) {
      return null;
    }
    const lock = {
      name: lockName,
      holder: holder,
      acquiredAt: now,
      ttl: ttl > 0 ? ttl : 30000,
      expired: false
    };
    this._locks[lockName] = lock;
    return { name: lock.name, holder: lock.holder, acquiredAt: lock.acquiredAt, ttl: lock.ttl, expired: lock.expired };
  }

  release(lockName, holder) {
    if (!lockName || !holder) {
      return false;
    }
    const lock = this._locks[lockName];
    if (!lock) {
      return false;
    }
    if (lock.holder !== holder) {
      return false;
    }
    delete this._locks[lockName];
    return true;
  }

  isLocked(lockName) {
    if (!lockName) {
      return false;
    }
    const lock = this._locks[lockName];
    if (!lock) {
      return false;
    }
    const now = Date.now();
    if ((lock.acquiredAt + lock.ttl) <= now) {
      lock.expired = true;
      delete this._locks[lockName];
      return false;
    }
    return true;
  }

  getLock(lockName) {
    if (!lockName) {
      return null;
    }
    const lock = this._locks[lockName];
    if (!lock) {
      return null;
    }
    const now = Date.now();
    if ((lock.acquiredAt + lock.ttl) <= now) {
      lock.expired = true;
      delete this._locks[lockName];
      return null;
    }
    const expired = (lock.acquiredAt + lock.ttl) <= now;
    return { name: lock.name, holder: lock.holder, acquiredAt: lock.acquiredAt, ttl: lock.ttl, expired: expired };
  }

  listLocks() {
    const now = Date.now();
    const result = [];
    for (const name of Object.keys(this._locks)) {
      const lock = this._locks[name];
      if ((lock.acquiredAt + lock.ttl) <= now) {
        lock.expired = true;
        delete this._locks[name];
        continue;
      }
      result.push({ name: lock.name, holder: lock.holder, acquiredAt: lock.acquiredAt, ttl: lock.ttl, expired: false });
    }
    return result;
  }

  forceRelease(lockName) {
    if (!lockName) {
      return false;
    }
    if (!this._locks[lockName]) {
      return false;
    }
    delete this._locks[lockName];
    return true;
  }

  clear() {
    this._locks = {};
  }
}

module.exports = { DistributedLocks };
