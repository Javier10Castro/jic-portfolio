class PluginVersionManager {
  constructor() {
    this._versions = {};
  }

  registerVersion(pluginId, version, data) {
    if (!this._versions[pluginId]) this._versions[pluginId] = [];
    const entry = { version, data: { ...data }, installedAt: Date.now() };
    const existing = this._versions[pluginId].findIndex(v => v.version === version);
    if (existing >= 0) this._versions[pluginId][existing] = entry;
    else this._versions[pluginId].push(entry);
    return entry;
  }

  getVersion(pluginId, version) {
    const versions = this._versions[pluginId];
    if (!versions) return null;
    return versions.find(v => v.version === version) || null;
  }

  getVersions(pluginId) { return this._versions[pluginId] ? [...this._versions[pluginId]] : []; }

  getLatestVersion(pluginId) {
    const versions = this._versions[pluginId];
    if (!versions || !versions.length) return null;
    return versions.reduce((a, b) => this._compareVersions(a.version, b.version) > 0 ? a : b);
  }

  _compareVersions(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i] || 0, nb = pb[i] || 0;
      if (na !== nb) return na - nb;
    }
    return 0;
  }

  clear() { this._versions = {}; }
}

module.exports = { PluginVersionManager };
