const policyVersioning = require('./policyVersioning');

class PolicyRollback {
  constructor() {
    this.history = [];
  }

  rollback(policyId, targetVersion) {
    if (!policyId || targetVersion === undefined) return { success: false };
    const target = policyVersioning.getVersion(policyId, targetVersion);
    if (!target) return { success: false };
    const latest = policyVersioning.getLatestVersion(policyId);
    if (!latest) return { success: false };
    const currentVersion = latest.version;
    if (targetVersion >= currentVersion) return { success: false };
    const newSnapshot = policyVersioning.createVersion(target.policy);
    if (!newSnapshot) return { success: false };
    const entry = { policyId, fromVersion: currentVersion, toVersion: targetVersion, newVersion: newSnapshot.version, timestamp: new Date().toISOString() };
    this.history.push(entry);
    return { success: true, policy: newSnapshot.policy, previousVersion: currentVersion, newVersion: newSnapshot.version };
  }

  canRollback(policyId, targetVersion) {
    if (!policyId || targetVersion === undefined) return false;
    const target = policyVersioning.getVersion(policyId, targetVersion);
    if (!target) return false;
    const latest = policyVersioning.getLatestVersion(policyId);
    if (!latest) return false;
    return targetVersion < latest.version;
  }

  getRollbackHistory() {
    return [...this.history];
  }

  clear() {
    this.history = [];
  }
}

module.exports = new PolicyRollback();
