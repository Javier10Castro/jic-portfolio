class PlanVersions {
  constructor() {
    this._versions = {};
  }

  createVersion(planId, planData, notes) {
    if (!this._versions[planId]) this._versions[planId] = [];
    const version = {
      version: this._versions[planId].length + 1,
      planId, data: { ...planData }, notes: notes || '',
      createdAt: Date.now()
    };
    this._versions[planId].push(version);
    return version;
  }

  getVersions(planId) { return this._versions[planId] ? [...this._versions[planId]] : []; }
  getVersion(planId, versionNumber) {
    const versions = this._versions[planId];
    if (!versions) return null;
    return versions.find(v => v.version === versionNumber) || null;
  }
  getLatestVersion(planId) {
    const versions = this._versions[planId];
    if (!versions || !versions.length) return null;
    return versions[versions.length - 1];
  }
  clear() { this._versions = {}; }
}

module.exports = { PlanVersions };
