class RuntimeHealth {
  constructor() {
    this._checks = new Map();
    this._statuses = new Map();
  }

  registerCheck(name, checkFn) {
    if (!name || typeof checkFn !== 'function') {
      return false;
    }
    if (this._checks.has(name)) {
      return false;
    }
    this._checks.set(name, checkFn);
    return true;
  }

  runCheck(name) {
    if (!this._checks.has(name)) {
      return null;
    }
    const checkFn = this._checks.get(name);
    let status;
    try {
      const result = checkFn();
      if (result === true || result === 'healthy') {
        status = 'healthy';
      } else if (result === false || result === 'down') {
        status = 'down';
      } else {
        status = 'degraded';
      }
    } catch (_) {
      status = 'down';
    }
    const entry = {
      name: name,
      status: status,
      timestamp: Date.now(),
    };
    this._statuses.set(name, entry);
    return entry;
  }

  runAll() {
    const results = [];
    for (const name of this._checks.keys()) {
      const result = this.runCheck(name);
      if (result) {
        results.push(result);
      }
    }
    return results;
  }

  getStatus(name) {
    if (!this._statuses.has(name)) {
      return null;
    }
    return this._statuses.get(name);
  }

  getAllStatus() {
    const result = {};
    for (const [name, status] of this._statuses) {
      result[name] = status;
    }
    return result;
  }

  clear() {
    this._checks.clear();
    this._statuses.clear();
  }
}

module.exports = { RuntimeHealth };
