class PolicyVersioning {
  constructor() {
    this.versions = new Map();
    this.nextVersion = new Map();
  }

  createVersion(policy) {
    if (!policy || !policy.id) return null;
    const policyId = policy.id;
    if (!this.nextVersion.has(policyId)) this.nextVersion.set(policyId, 1);
    const version = this.nextVersion.get(policyId);
    this.nextVersion.set(policyId, version + 1);
    const snapshot = {
      policyId, version, policy: JSON.parse(JSON.stringify(policy)),
      createdAt: new Date().toISOString()
    };
    const key = `${policyId}_v${version}`;
    this.versions.set(key, snapshot);
    return snapshot;
  }

  getVersion(policyId, version) {
    if (!policyId || version === undefined) return null;
    return this.versions.get(`${policyId}_v${version}`) || null;
  }

  getLatestVersion(policyId) {
    if (!policyId) return null;
    const version = this.nextVersion.get(policyId);
    if (!version || version <= 1) return null;
    return this.versions.get(`${policyId}_v${version - 1}`) || null;
  }

  listVersions(policyId) {
    if (!policyId) return [];
    return Array.from(this.versions.keys())
      .filter(k => k.startsWith(`${policyId}_v`))
      .map(k => this.versions.get(k))
      .sort((a, b) => b.version - a.version);
  }

  clear() {
    this.versions.clear();
    this.nextVersion.clear();
  }
}

module.exports = new PolicyVersioning();
