class RollbackManager {
  constructor() {
    this._history = [];
    this._rollbacks = {};
  }

  executeRollback(name, targetVersion) {
    if (!name || !targetVersion) {
      return null;
    }
    const rollback = {
      name: name,
      rolledBackFrom: this._rollbacks[name] ? this._rollbacks[name].currentVersion : 'unknown',
      targetVersion: targetVersion,
      timestamp: Date.now(),
      success: true
    };
    this._rollbacks[name] = { currentVersion: targetVersion, lastRollback: rollback.timestamp };
    this._history.push(rollback);
    return { success: true, rolledBackFrom: rollback.rolledBackFrom, targetVersion: rollback.targetVersion, timestamp: rollback.timestamp };
  }

  canRollback(name) {
    if (!name) {
      return false;
    }
    return this._rollbacks[name] !== undefined;
  }

  getRollbackHistory() {
    return this._history.slice();
  }

  clear() {
    this._history = [];
    this._rollbacks = {};
  }
}

module.exports = { RollbackManager };
