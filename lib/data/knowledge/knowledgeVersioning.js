class KnowledgeVersioning {
  constructor() {
    this._versions = new Map();
  }

  createVersion(doc) {
    if (!doc || !doc.id) return null;
    const version = {
      id: `${doc.id}_v${Date.now()}`,
      docId: doc.id,
      data: JSON.parse(JSON.stringify(doc)),
      version: (this._versions.get(doc.id) || []).length + 1,
      createdAt: new Date().toISOString(),
    };
    if (!this._versions.has(doc.id)) this._versions.set(doc.id, []);
    this._versions.get(doc.id).push(version);
    return version;
  }

  getVersion(docId, version) {
    if (docId == null || version == null) return null;
    const versions = this._versions.get(docId);
    if (!versions) return null;
    return versions.find(v => v.version === version) || null;
  }

  listVersions(docId) {
    if (docId == null) return [];
    return this._versions.get(docId) || [];
  }

  clear() {
    this._versions.clear();
  }
}

module.exports = { KnowledgeVersioning };
