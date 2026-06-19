class WorkflowVersioning {
  constructor() {
    this._versions = new Map();
  }

  createVersion(workflow) {
    const defId = workflow.definitionId || workflow.id;
    if (!this._versions.has(defId)) this._versions.set(defId, []);
    const versions = this._versions.get(defId);
    const version = {
      number: versions.length + 1,
      workflowId: workflow.id,
      definition: JSON.parse(JSON.stringify(workflow.definition || workflow)),
      createdAt: Date.now(),
      checksum: this._checksum(workflow),
    };
    versions.push(version);
    return version;
  }

  getVersion(defId, versionNumber) {
    const versions = this._versions.get(defId);
    if (!versions) return null;
    return versions.find(v => v.number === versionNumber) || null;
  }

  getLatestVersion(defId) {
    const versions = this._versions.get(defId);
    if (!versions || versions.length === 0) return null;
    return versions[versions.length - 1];
  }

  listVersions(defId) {
    return [...(this._versions.get(defId) || [])];
  }

  migrate(workflow, targetVersion) {
    const currentVersion = workflow.version || 1;
    if (targetVersion <= currentVersion) return workflow;
    const updated = JSON.parse(JSON.stringify(workflow));
    updated.version = targetVersion;
    updated.migratedAt = Date.now();
    updated.migratedFrom = currentVersion;
    return updated;
  }

  diff(defId, versionA, versionB) {
    const a = this.getVersion(defId, versionA);
    const b = this.getVersion(defId, versionB);
    if (!a || !b) return null;
    const changes = [];
    const aSteps = JSON.stringify(a.definition.steps || []);
    const bSteps = JSON.stringify(b.definition.steps || []);
    if (aSteps !== bSteps) changes.push({ field: 'steps', from: a.definition.steps, to: b.definition.steps });
    if (a.definition.timeout !== b.definition.timeout) changes.push({ field: 'timeout', from: a.definition.timeout, to: b.definition.timeout });
    if (a.definition.retryPolicy !== b.definition.retryPolicy) changes.push({ field: 'retryPolicy', from: a.definition.retryPolicy, to: b.definition.retryPolicy });
    return { versionA, versionB, changes, changed: changes.length > 0 };
  }

  _checksum(workflow) {
    const str = typeof workflow === 'string' ? workflow : JSON.stringify(workflow);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(36);
  }
}

module.exports = WorkflowVersioning;
