class RuntimeSimulation {
  constructor() {
    this._results = [];
  }

  simulateChange(change) {
    if (!change) {
      return null;
    }
    const warnings = [];
    let wouldSucceed = true;
    if (!change.type) {
      warnings.push('Change type is missing');
      wouldSucceed = false;
    }
    if (!change.target) {
      warnings.push('Change target is missing');
      wouldSucceed = false;
    }
    if (change.type === 'config' && !change.value && change.value !== false && change.value !== 0 && change.value !== '') {
      warnings.push('Config change has no value');
      wouldSucceed = false;
    }
    const result = {
      change: { type: change.type, target: change.target, value: change.value },
      impact: this._estimateImpact(change),
      wouldSucceed: wouldSucceed,
      warnings: warnings
    };
    this._results.push(result);
    return result;
  }

  _estimateImpact(change) {
    if (!change || !change.type) {
      return { severity: 'unknown', affectedComponents: 0, estimatedDowntime: 0 };
    }
    switch (change.type) {
      case 'config':
        return { severity: 'low', affectedComponents: 1, estimatedDowntime: 0 };
      case 'deploy':
        return { severity: 'medium', affectedComponents: 3, estimatedDowntime: 5000 };
      case 'rollback':
        return { severity: 'high', affectedComponents: 5, estimatedDowntime: 10000 };
      case 'infra':
        return { severity: 'critical', affectedComponents: 10, estimatedDowntime: 30000 };
      default:
        return { severity: 'unknown', affectedComponents: 0, estimatedDowntime: 0 };
    }
  }

  simulateRollout(rolloutConfig) {
    if (!rolloutConfig) {
      return null;
    }
    const warnings = [];
    let wouldSucceed = true;
    if (!rolloutConfig.name) {
      warnings.push('Rollout name is missing');
      wouldSucceed = false;
    }
    if (!rolloutConfig.strategy) {
      warnings.push('Rollout strategy is missing');
      wouldSucceed = false;
    }
    if (!rolloutConfig.phases || rolloutConfig.phases.length === 0) {
      warnings.push('No phases defined');
      wouldSucceed = false;
    }
    const result = {
      change: { name: rolloutConfig.name, strategy: rolloutConfig.strategy, phases: rolloutConfig.phases ? rolloutConfig.phases.length : 0 },
      impact: { severity: 'medium', affectedComponents: 3, estimatedDowntime: 5000 },
      wouldSucceed: wouldSucceed,
      warnings: warnings
    };
    this._results.push(result);
    return result;
  }

  getSimulationResults() {
    return this._results.slice();
  }

  clear() {
    this._results = [];
  }
}

module.exports = { RuntimeSimulation };
