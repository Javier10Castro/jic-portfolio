class PromptVersioning {
  constructor() {
    this._versions = new Map();
    this._counters = new Map();
  }

  createVersion(promptId, text, metadata) {
    const current = this._counters.get(promptId) || 0;
    const version = current + 1;
    this._counters.set(promptId, version);

    const entry = {
      version,
      promptId,
      text,
      metadata: metadata || {},
      createdAt: new Date().toISOString()
    };

    const list = this._versions.get(promptId) || [];
    list.push(entry);
    this._versions.set(promptId, list);

    return { ...entry };
  }

  getVersion(promptId, version) {
    const list = this._versions.get(promptId);
    if (!list) return null;
    const found = list.find(v => v.version === version);
    return found ? { ...found } : null;
  }

  getLatestVersion(promptId) {
    const list = this._versions.get(promptId);
    if (!list || list.length === 0) return null;
    const sorted = [...list].sort((a, b) => b.version - a.version);
    return { ...sorted[0] };
  }

  listVersions(promptId) {
    const list = this._versions.get(promptId);
    if (!list) return [];
    return [...list].sort((a, b) => b.version - a.version);
  }

  compareVersions(promptId, v1, v2) {
    const a = this.getVersion(promptId, v1);
    const b = this.getVersion(promptId, v2);
    if (!a || !b) return null;

    const diff = { added: {}, removed: {}, changed: {} };

    const aLines = a.text.split('\n');
    const bLines = b.text.split('\n');

    const aSet = new Set(aLines);
    const bSet = new Set(bLines);

    for (const line of bLines) {
      if (!aSet.has(line)) {
        diff.added[line] = true;
      }
    }

    for (const line of aLines) {
      if (!bSet.has(line)) {
        diff.removed[line] = true;
      }
    }

    const metaKeys = new Set([...Object.keys(a.metadata), ...Object.keys(b.metadata)]);
    for (const key of metaKeys) {
      if (JSON.stringify(a.metadata[key]) !== JSON.stringify(b.metadata[key])) {
        diff.changed[key] = { from: a.metadata[key], to: b.metadata[key] };
      }
    }

    return diff;
  }

  rollback(promptId, version) {
    const source = this.getVersion(promptId, version);
    if (!source) return null;
    return this.createVersion(promptId, source.text, { ...source.metadata, rollbackFrom: version });
  }

  clear() {
    this._versions.clear();
    this._counters.clear();
  }
}

module.exports = { PromptVersioning };
