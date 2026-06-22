class PromptSnapshots {
  constructor() {
    this._snapshots = new Map();
    this._counter = 0;
  }

  snapshot(promptId, version, label) {
    this._counter++;
    const id = `snap_${this._counter}`;
    const entry = {
      id,
      promptId,
      version,
      label: label || '',
      text: '',
      metadata: {},
      capturedAt: new Date().toISOString()
    };

    if (typeof version === 'object' && version.text !== undefined) {
      entry.text = version.text;
      entry.metadata = version.metadata || {};
      entry.version = version.version || 0;
    }

    this._snapshots.set(id, entry);
    return { ...entry };
  }

  get(snapshotId) {
    return this._snapshots.has(snapshotId) ? { ...this._snapshots.get(snapshotId) } : null;
  }

  list(promptId) {
    const results = [];
    for (const entry of this._snapshots.values()) {
      if (!promptId || entry.promptId === promptId) {
        results.push({ ...entry });
      }
    }
    return results.sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));
  }

  restore(snapshotId) {
    const entry = this._snapshots.get(snapshotId);
    if (!entry) return null;
    return { text: entry.text, metadata: { ...entry.metadata } };
  }

  compare(snapshotId1, snapshotId2) {
    const a = this._snapshots.get(snapshotId1);
    const b = this._snapshots.get(snapshotId2);
    if (!a || !b) return null;

    const diff = { added: {}, removed: {}, changed: {} };

    const aLines = a.text.split('\n');
    const bLines = b.text.split('\n');

    const aSet = new Set(aLines);
    const bSet = new Set(bLines);

    for (const line of bLines) {
      if (!aSet.has(line)) diff.added[line] = true;
    }

    for (const line of aLines) {
      if (!bSet.has(line)) diff.removed[line] = true;
    }

    const metaKeys = new Set([...Object.keys(a.metadata), ...Object.keys(b.metadata)]);
    for (const key of metaKeys) {
      if (JSON.stringify(a.metadata[key]) !== JSON.stringify(b.metadata[key])) {
        diff.changed[key] = { from: a.metadata[key], to: b.metadata[key] };
      }
    }

    return diff;
  }

  delete(snapshotId) {
    return this._snapshots.delete(snapshotId);
  }

  clear() {
    this._snapshots.clear();
    this._counter = 0;
  }
}

module.exports = { PromptSnapshots };
