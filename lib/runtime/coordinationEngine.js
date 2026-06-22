const { DistributedLocks } = require('./distributedLocks');
const { LeaseManager } = require('./leaseManager');
const { LeaderRuntime } = require('./leaderRuntime');

class CoordinationEngine {
  constructor() {
    this._locks = new DistributedLocks();
    this._leases = new LeaseManager();
    this._leaders = new LeaderRuntime();
  }

  executeWithLock(name, holder, fn) {
    if (!name || !holder || typeof fn !== 'function') {
      return null;
    }
    const lock = this._locks.acquire(name, holder, 30000);
    if (!lock) {
      return null;
    }
    try {
      const result = fn();
      return result;
    } finally {
      this._locks.release(name, holder);
    }
  }

  getStatus() {
    return {
      locks: this._locks.listLocks(),
      leases: this._leases.listLeases(),
      leaders: this._leaders.listGroups()
    };
  }

  clear() {
    this._locks.clear();
    this._leases.clear();
    this._leaders.clear();
  }
}

module.exports = { CoordinationEngine };
