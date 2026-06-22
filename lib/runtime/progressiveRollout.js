class ProgressiveRollout {
  constructor() {
    this._rollouts = {};
  }

  startProgressive(config) {
    if (!config || !config.name || !config.phases || !Array.isArray(config.phases) || config.phases.length === 0) {
      return null;
    }
    for (let i = 0; i < config.phases.length; i++) {
      if (!config.phases[i].percent || !config.phases[i].duration) {
        return null;
      }
    }
    if (this._rollouts[config.name]) {
      return null;
    }
    const rollout = {
      name: config.name,
      phases: config.phases.map(function(p) {
        return { percent: p.percent, duration: p.duration, criteria: p.criteria || null };
      }),
      currentPhaseIndex: 0,
      status: 'running',
      startedAt: Date.now(),
      completedAt: null
    };
    this._rollouts[config.name] = rollout;
    return { name: rollout.name, phases: rollout.phases, currentPhaseIndex: rollout.currentPhaseIndex, status: rollout.status };
  }

  advancePhase(name) {
    if (!name) {
      return false;
    }
    const rollout = this._rollouts[name];
    if (!rollout) {
      return false;
    }
    if (rollout.status !== 'running') {
      return false;
    }
    if (rollout.currentPhaseIndex >= rollout.phases.length - 1) {
      rollout.status = 'completed';
      rollout.completedAt = Date.now();
      return false;
    }
    rollout.currentPhaseIndex++;
    return true;
  }

  getCurrentPhase(name) {
    if (!name) {
      return null;
    }
    const rollout = this._rollouts[name];
    if (!rollout) {
      return null;
    }
    const phase = rollout.phases[rollout.currentPhaseIndex];
    if (!phase) {
      return null;
    }
    return { index: rollout.currentPhaseIndex, percent: phase.percent, duration: phase.duration, criteria: phase.criteria };
  }

  getProgress(name) {
    if (!name) {
      return null;
    }
    const rollout = this._rollouts[name];
    if (!rollout) {
      return null;
    }
    return {
      currentPhase: rollout.currentPhaseIndex + 1,
      totalPhases: rollout.phases.length,
      percentComplete: Math.round(((rollout.currentPhaseIndex + 1) / rollout.phases.length) * 100)
    };
  }

  clear() {
    this._rollouts = {};
  }
}

module.exports = { ProgressiveRollout };
