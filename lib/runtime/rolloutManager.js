class RolloutManager {
  constructor() {
    this._rollouts = {};
  }

  createRollout(name, config) {
    if (!name || !config) {
      return null;
    }
    if (!config.type || !config.target || !config.strategy) {
      return null;
    }
    if (this._rollouts[name]) {
      return null;
    }
    const rollout = {
      name: name,
      type: config.type,
      target: config.target,
      strategy: config.strategy,
      phases: config.phases || [],
      status: 'created',
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      pausedAt: null,
      cancelledAt: null,
      failedAt: null
    };
    this._rollouts[name] = rollout;
    return { name: rollout.name, type: rollout.type, target: rollout.target, strategy: rollout.strategy, phases: rollout.phases, status: rollout.status, createdAt: rollout.createdAt };
  }

  getRollout(name) {
    if (!name) {
      return null;
    }
    const rollout = this._rollouts[name];
    if (!rollout) {
      return null;
    }
    return {
      name: rollout.name,
      type: rollout.type,
      target: rollout.target,
      strategy: rollout.strategy,
      phases: rollout.phases,
      status: rollout.status,
      createdAt: rollout.createdAt,
      startedAt: rollout.startedAt,
      completedAt: rollout.completedAt,
      pausedAt: rollout.pausedAt,
      cancelledAt: rollout.cancelledAt,
      failedAt: rollout.failedAt
    };
  }

  listRollouts() {
    const result = [];
    for (const name of Object.keys(this._rollouts)) {
      const r = this._rollouts[name];
      result.push({ name: r.name, type: r.type, target: r.target, strategy: r.strategy, status: r.status });
    }
    return result;
  }

  startRollout(name) {
    if (!name) {
      return false;
    }
    const rollout = this._rollouts[name];
    if (!rollout) {
      return false;
    }
    if (rollout.status !== 'created' && rollout.status !== 'paused') {
      return false;
    }
    rollout.status = 'active';
    rollout.startedAt = Date.now();
    rollout.pausedAt = null;
    return true;
  }

  pauseRollout(name) {
    if (!name) {
      return false;
    }
    const rollout = this._rollouts[name];
    if (!rollout) {
      return false;
    }
    if (rollout.status !== 'active') {
      return false;
    }
    rollout.status = 'paused';
    rollout.pausedAt = Date.now();
    return true;
  }

  resumeRollout(name) {
    if (!name) {
      return false;
    }
    const rollout = this._rollouts[name];
    if (!rollout) {
      return false;
    }
    if (rollout.status !== 'paused') {
      return false;
    }
    rollout.status = 'active';
    rollout.pausedAt = null;
    return true;
  }

  completeRollout(name) {
    if (!name) {
      return false;
    }
    const rollout = this._rollouts[name];
    if (!rollout) {
      return false;
    }
    if (rollout.status !== 'active') {
      return false;
    }
    rollout.status = 'completed';
    rollout.completedAt = Date.now();
    return true;
  }

  cancelRollout(name) {
    if (!name) {
      return false;
    }
    const rollout = this._rollouts[name];
    if (!rollout) {
      return false;
    }
    if (rollout.status === 'completed' || rollout.status === 'cancelled') {
      return false;
    }
    rollout.status = 'cancelled';
    rollout.cancelledAt = Date.now();
    return true;
  }

  getStatus() {
    const result = { active: 0, completed: 0, failed: 0, paused: 0 };
    for (const name of Object.keys(this._rollouts)) {
      const r = this._rollouts[name];
      if (r.status === 'active') result.active++;
      else if (r.status === 'completed') result.completed++;
      else if (r.status === 'failed') result.failed++;
      else if (r.status === 'paused') result.paused++;
    }
    return result;
  }

  clear() {
    this._rollouts = {};
  }
}

module.exports = { RolloutManager };
