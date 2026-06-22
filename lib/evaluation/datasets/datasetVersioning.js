class DatasetVersioning {
  constructor() {
    this.versions = new Map();
    this.current = new Map();
  }

  createVersion(datasetName, entries) {
    if (!this.versions.has(datasetName)) {
      this.versions.set(datasetName, []);
    }
    const versionList = this.versions.get(datasetName);
    const versionNumber = versionList.length + 1;
    const version = {
      version: versionNumber,
      entries: JSON.parse(JSON.stringify(entries)),
      createdAt: new Date(),
      datasetName,
    };
    versionList.push(version);
    this.current.set(datasetName, versionNumber);
    return version;
  }

  getVersion(datasetName, version) {
    const versionList = this.versions.get(datasetName);
    if (!versionList) return null;
    if (typeof version === 'number') {
      return versionList.find(v => v.version === version) || null;
    }
    return versionList[versionList.length - 1] || null;
  }

  listVersions(datasetName) {
    const versionList = this.versions.get(datasetName);
    if (!versionList) return [];
    return versionList.map(v => ({
      version: v.version,
      createdAt: v.createdAt,
      entryCount: v.entries.length,
    }));
  }

  compareVersions(datasetName, v1, v2) {
    const ver1 = this.getVersion(datasetName, v1);
    const ver2 = this.getVersion(datasetName, v2);
    if (!ver1 || !ver2) return null;
    const entries1 = ver1.entries;
    const entries2 = ver2.entries;
    const idSet1 = new Set(entries1.map(e => e.id));
    const idSet2 = new Set(entries2.map(e => e.id));
    const added = entries2.filter(e => !idSet1.has(e.id));
    const removed = entries1.filter(e => !idSet2.has(e.id));
    const common = entries1.filter(e => idSet2.has(e.id));
    const modified = common.filter(e => {
      const match = entries2.find(e2 => e2.id === e.id);
      return match && JSON.stringify(e) !== JSON.stringify(match);
    });
    return { added, removed, modified, countA: entries1.length, countB: entries2.length };
  }

  rollback(datasetName, version) {
    const ver = this.getVersion(datasetName, version);
    if (!ver) return null;
    this.current.set(datasetName, ver.version);
    return JSON.parse(JSON.stringify(ver.entries));
  }

  clear() {
    this.versions.clear();
    this.current.clear();
  }
}

module.exports = DatasetVersioning;
