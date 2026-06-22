class LeaseManager {
  constructor() {
    this._leases = {};
  }

  acquireLease(name, holder, duration) {
    if (!name || !holder || !duration || duration <= 0) {
      return null;
    }
    const now = Date.now();
    const existing = this._leases[name];
    if (existing && existing.expiresAt > now) {
      return null;
    }
    const lease = {
      name: name,
      holder: holder,
      expiresAt: now + duration
    };
    this._leases[name] = lease;
    return { name: lease.name, holder: lease.holder, expiresAt: lease.expiresAt };
  }

  renewLease(name, holder, duration) {
    if (!name || !holder || !duration || duration <= 0) {
      return false;
    }
    const lease = this._leases[name];
    if (!lease) {
      return false;
    }
    if (lease.holder !== holder) {
      return false;
    }
    const now = Date.now();
    if (lease.expiresAt <= now) {
      delete this._leases[name];
      return false;
    }
    lease.expiresAt = now + duration;
    return true;
  }

  releaseLease(name, holder) {
    if (!name || !holder) {
      return false;
    }
    const lease = this._leases[name];
    if (!lease) {
      return false;
    }
    if (lease.holder !== holder) {
      return false;
    }
    delete this._leases[name];
    return true;
  }

  isLeaseValid(name) {
    if (!name) {
      return false;
    }
    const lease = this._leases[name];
    if (!lease) {
      return false;
    }
    const now = Date.now();
    if (lease.expiresAt <= now) {
      delete this._leases[name];
      return false;
    }
    return true;
  }

  getLease(name) {
    if (!name) {
      return null;
    }
    const lease = this._leases[name];
    if (!lease) {
      return null;
    }
    const now = Date.now();
    if (lease.expiresAt <= now) {
      delete this._leases[name];
      return null;
    }
    return { name: lease.name, holder: lease.holder, expiresAt: lease.expiresAt };
  }

  listLeases() {
    const now = Date.now();
    const result = [];
    for (const name of Object.keys(this._leases)) {
      const lease = this._leases[name];
      if (lease.expiresAt <= now) {
        delete this._leases[name];
        continue;
      }
      result.push({ name: lease.name, holder: lease.holder, expiresAt: lease.expiresAt });
    }
    return result;
  }

  clear() {
    this._leases = {};
  }
}

module.exports = { LeaseManager };
