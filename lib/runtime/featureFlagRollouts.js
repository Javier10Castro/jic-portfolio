const crypto = require('crypto');

class FeatureFlagRollouts {
  constructor() {
    this._rollouts = new Map();
  }

  startRollout(flagKey, percentage) {
    if (!flagKey) {
      throw new Error('flagKey is required');
    }
    percentage = Number(percentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      throw new Error('percentage must be between 0 and 100');
    }
    this._rollouts.set(flagKey, {
      flagKey,
      percentage,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  getRollout(flagKey) {
    if (!flagKey) return null;
    const rollout = this._rollouts.get(flagKey);
    return rollout ? { ...rollout } : null;
  }

  updateRollout(flagKey, percentage) {
    if (!flagKey) {
      throw new Error('flagKey is required');
    }
    const rollout = this._rollouts.get(flagKey);
    if (!rollout) {
      throw new Error(`Rollout for '${flagKey}' not found`);
    }
    percentage = Number(percentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      throw new Error('percentage must be between 0 and 100');
    }
    rollout.percentage = percentage;
    rollout.updatedAt = new Date().toISOString();
  }

  isInRollout(flagKey, context) {
    if (!flagKey) return false;
    const rollout = this._rollouts.get(flagKey);
    if (!rollout) return false;
    if (rollout.percentage === 0) return false;
    if (rollout.percentage === 100) return true;
    const ctxId = context && context.userId ? String(context.userId) : (context && context.sessionId ? String(context.sessionId) : Math.random().toString());
    const hash = crypto.createHash('md5').update(flagKey + ':' + ctxId).digest('hex');
    const bucket = parseInt(hash.substring(0, 8), 16) % 100;
    return bucket < rollout.percentage;
  }

  completeRollout(flagKey) {
    if (!flagKey) {
      throw new Error('flagKey is required');
    }
    const rollout = this._rollouts.get(flagKey);
    if (!rollout) {
      throw new Error(`Rollout for '${flagKey}' not found`);
    }
    rollout.percentage = 100;
    rollout.updatedAt = new Date().toISOString();
  }

  stopRollout(flagKey) {
    if (!flagKey) {
      throw new Error('flagKey is required');
    }
    const rollout = this._rollouts.get(flagKey);
    if (!rollout) {
      throw new Error(`Rollout for '${flagKey}' not found`);
    }
    rollout.percentage = 0;
    rollout.updatedAt = new Date().toISOString();
  }

  listRollouts() {
    return Array.from(this._rollouts.values()).map(r => ({ ...r }));
  }

  clear() {
    this._rollouts.clear();
  }
}

module.exports = { FeatureFlagRollouts };
