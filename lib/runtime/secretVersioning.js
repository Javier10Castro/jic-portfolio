class SecretVersioning {
  constructor() {
    this._versions = new Map();
  }

  createVersion(secretKey, value) {
    if (!secretKey || value === undefined) {
      throw new Error('secretKey and value are required');
    }
    if (!this._versions.has(secretKey)) {
      this._versions.set(secretKey, []);
    }
    const versions = this._versions.get(secretKey);
    const version = versions.length + 1;
    versions.push({
      version,
      secretKey,
      value,
      createdAt: new Date().toISOString()
    });
    return version;
  }

  getVersion(secretKey, version) {
    if (!secretKey || !version) return null;
    const versions = this._versions.get(secretKey);
    if (!versions) return null;
    const entry = versions.find(v => v.version === version);
    return entry ? { ...entry } : null;
  }

  getLatestVersion(secretKey) {
    if (!secretKey) return null;
    const versions = this._versions.get(secretKey);
    if (!versions || versions.length === 0) return null;
    return { ...versions[versions.length - 1] };
  }

  listVersions(secretKey) {
    if (!secretKey) return [];
    const versions = this._versions.get(secretKey);
    if (!versions) return [];
    return versions.map(v => ({ version: v.version, secretKey: v.secretKey, createdAt: v.createdAt }));
  }

  clear() {
    this._versions.clear();
  }
}

module.exports = { SecretVersioning };
