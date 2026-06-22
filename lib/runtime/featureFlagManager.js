const { FeatureFlagRegistry } = require('./featureFlagRegistry');
const { FeatureFlagTargeting } = require('./featureFlagTargeting');
const { FeatureFlagEvaluator } = require('./featureFlagEvaluator');
const { FeatureFlagRollouts } = require('./featureFlagRollouts');
const { FeatureFlagExperiments } = require('./featureFlagExperiments');
const { FeatureFlagAudit } = require('./featureFlagAudit');

class FeatureFlagManager {
  constructor() {
    this._registry = new FeatureFlagRegistry();
    this._targeting = new FeatureFlagTargeting();
    this._evaluator = new FeatureFlagEvaluator(this._registry, this._targeting);
    this._rollouts = new FeatureFlagRollouts();
    this._experiments = new FeatureFlagExperiments();
    this._audit = new FeatureFlagAudit();
  }

  createFlag(flag) {
    this._registry.register(flag);
    this._audit.recordChange(flag.key, 'create', 'system', { flag });
  }

  evaluate(key, context) {
    const enabled = this._evaluator.isEnabled(key, context);
    let result = enabled;
    const rollout = this._rollouts.getRollout(key);
    if (rollout) {
      result = result && this._rollouts.isInRollout(key, context);
    }
    if (result) {
      const variant = this._experiments.assignVariant(key, context);
      if (variant) {
        result = variant;
      }
    }
    return { key, enabled, value: result, context: context || {} };
  }

  startRollout(key, percentage) {
    this._rollouts.startRollout(key, percentage);
    this._audit.recordChange(key, 'start_rollout', 'system', { percentage });
  }

  createExperiment(key, variants) {
    this._experiments.createExperiment(key, variants);
    this._audit.recordChange(key, 'create_experiment', 'system', { variants });
  }

  getStatus() {
    const flags = this._registry.list();
    const total = flags.length;
    const enabled = flags.filter(f => f.enabled).length;
    const rollouts = this._rollouts.listRollouts().length;
    const experiments = [];
    for (const exp of this._experiments._experiments.values()) {
      experiments.push(exp.flagKey);
    }
    return { total, enabled, rollouts, experiments: experiments.length };
  }

  clear() {
    this._registry.clear();
    this._targeting.clear();
    this._rollouts.clear();
    this._experiments.clear();
    this._audit.clear();
  }
}

module.exports = { FeatureFlagManager };
