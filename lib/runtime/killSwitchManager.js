class KillSwitchManager {
  constructor() {
    this._switches = {};
  }

  activate(key, reason) {
    if (!key) {
      return null;
    }
    if (this._switches[key] && this._switches[key].active) {
      return null;
    }
    const sw = {
      key: key,
      reason: reason || 'No reason provided',
      active: true,
      activated: Date.now(),
      deactivated: null
    };
    this._switches[key] = sw;
    return { key: sw.key, activated: sw.activated, reason: sw.reason, timestamp: sw.activated };
  }

  deactivate(key) {
    if (!key) {
      return false;
    }
    const sw = this._switches[key];
    if (!sw) {
      return false;
    }
    if (!sw.active) {
      return false;
    }
    sw.active = false;
    sw.deactivated = Date.now();
    return true;
  }

  isActive(key) {
    if (!key) {
      return false;
    }
    const sw = this._switches[key];
    if (!sw) {
      return false;
    }
    return sw.active === true;
  }

  getSwitch(key) {
    if (!key) {
      return null;
    }
    const sw = this._switches[key];
    if (!sw) {
      return null;
    }
    return { key: sw.key, reason: sw.reason, active: sw.active, activated: sw.activated, deactivated: sw.deactivated };
  }

  listActive() {
    const result = [];
    for (const key of Object.keys(this._switches)) {
      const sw = this._switches[key];
      if (sw.active) {
        result.push({ key: sw.key, reason: sw.reason, activated: sw.activated });
      }
    }
    return result;
  }

  listAll() {
    const result = [];
    for (const key of Object.keys(this._switches)) {
      const sw = this._switches[key];
      result.push({ key: sw.key, reason: sw.reason, active: sw.active, activated: sw.activated, deactivated: sw.deactivated });
    }
    return result;
  }

  clear() {
    this._switches = {};
  }
}

module.exports = { KillSwitchManager };
