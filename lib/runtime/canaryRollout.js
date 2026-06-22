class CanaryRollout {
  constructor() {
    this._canaries = {};
  }

  startCanary(config) {
    if (!config || !config.service || !config.newVersion) {
      return null;
    }
    if (this._canaries[config.service]) {
      return null;
    }
    const canary = {
      name: config.service,
      service: config.service,
      newVersion: config.newVersion,
      canaryPercent: (config.canaryPercent > 0 && config.canaryPercent <= 100) ? config.canaryPercent : 10,
      interval: (config.interval > 0) ? config.interval : 60000,
      autoPromote: config.autoPromote !== undefined ? !!config.autoPromote : true,
      status: 'running',
      startedAt: Date.now(),
      promotedAt: null,
      rolledBackAt: null
    };
    this._canaries[config.service] = canary;
    return { name: canary.name, service: canary.service, newVersion: canary.newVersion, canaryPercent: canary.canaryPercent, status: canary.status, startedAt: canary.startedAt };
  }

  getCanaryStatus(name) {
    if (!name) {
      return null;
    }
    const canary = this._canaries[name];
    if (!canary) {
      return null;
    }
    return {
      name: canary.name,
      service: canary.service,
      newVersion: canary.newVersion,
      canaryPercent: canary.canaryPercent,
      interval: canary.interval,
      autoPromote: canary.autoPromote,
      status: canary.status,
      startedAt: canary.startedAt,
      promotedAt: canary.promotedAt,
      rolledBackAt: canary.rolledBackAt
    };
  }

  promoteCanary(name) {
    if (!name) {
      return false;
    }
    const canary = this._canaries[name];
    if (!canary) {
      return false;
    }
    if (canary.status !== 'running') {
      return false;
    }
    canary.status = 'promoted';
    canary.canaryPercent = 100;
    canary.promotedAt = Date.now();
    return true;
  }

  rollbackCanary(name) {
    if (!name) {
      return false;
    }
    const canary = this._canaries[name];
    if (!canary) {
      return false;
    }
    if (canary.status !== 'running') {
      return false;
    }
    canary.status = 'rolled-back';
    canary.canaryPercent = 0;
    canary.rolledBackAt = Date.now();
    return true;
  }

  adjustCanaryPercent(name, percent) {
    if (!name || percent === undefined || percent === null) {
      return false;
    }
    const canary = this._canaries[name];
    if (!canary) {
      return false;
    }
    if (canary.status !== 'running') {
      return false;
    }
    const safePercent = Math.max(0, Math.min(100, percent));
    canary.canaryPercent = safePercent;
    return true;
  }

  clear() {
    this._canaries = {};
  }
}

module.exports = { CanaryRollout };
