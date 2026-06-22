class VersionManager {
  constructor() {
    this._versions = new Map();
    this._counter = 0;
  }

  _parseVersion(version) {
    const parts = String(version).split('.');
    if (parts.length !== 3 || parts.some(p => isNaN(parseInt(p, 10)) || parseInt(p, 10) < 0)) {
      throw new Error(`Invalid version format "${version}". Must be semver (e.g. 1.0.0)`);
    }
    return parts.map(p => parseInt(p, 10));
  }

  _formatVersion(parts) {
    return parts.join('.');
  }

  createVersion(projectId, version) {
    if (!projectId) throw new Error('Project ID is required');
    this._parseVersion(version);
    if (!this._versions.has(projectId)) {
      this._versions.set(projectId, []);
    }
    const versions = this._versions.get(projectId);
    if (versions.some(v => v.version === version)) {
      throw new Error(`Version "${version}" already exists for project "${projectId}"`);
    }
    const entry = { projectId, version, createdAt: new Date().toISOString() };
    versions.push(entry);
    return entry;
  }

  getVersion(projectId, version) {
    if (!this._versions.has(projectId)) return null;
    return this._versions.get(projectId).find(v => v.version === version) || null;
  }

  getLatest(projectId) {
    if (!this._versions.has(projectId)) return null;
    const versions = this._versions.get(projectId);
    if (versions.length === 0) return null;
    const sorted = [...versions].sort((a, b) => {
      const aParts = this._parseVersion(a.version);
      const bParts = this._parseVersion(b.version);
      for (let i = 0; i < 3; i++) {
        if (aParts[i] !== bParts[i]) return bParts[i] - aParts[i];
      }
      return 0;
    });
    return sorted[0];
  }

  listVersions(projectId) {
    if (!this._versions.has(projectId)) return [];
    return [...this._versions.get(projectId)];
  }

  _increment(projectId, index) {
    if (!this._versions.has(projectId) || this._versions.get(projectId).length === 0) {
      return this.createVersion(projectId, '1.0.0');
    }
    const latest = this.getLatest(projectId);
    const parts = this._parseVersion(latest.version);
    parts[index] += 1;
    for (let i = index + 1; i < 3; i++) {
      parts[i] = 0;
    }
    const newVersion = this._formatVersion(parts);
    return this.createVersion(projectId, newVersion);
  }

  incrementMajor(projectId) {
    return this._increment(projectId, 0);
  }

  incrementMinor(projectId) {
    return this._increment(projectId, 1);
  }

  incrementPatch(projectId) {
    return this._increment(projectId, 2);
  }

  clear() {
    this._versions.clear();
  }
}

module.exports = { VersionManager };
