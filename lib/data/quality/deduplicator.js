class Deduplicator {
  constructor() {
    this._index = [];
  }

  deduplicate(records, keys) {
    if (!Array.isArray(records)) return { deduplicated: [], removed: [] };
    if (!keys || keys.length === 0) return { deduplicated: [...records], removed: [] };
    const seen = new Set();
    const deduplicated = [];
    const removed = [];
    records.forEach(rec => {
      const fingerprint = keys.map(k => String(rec[k] || '')).join('|');
      if (seen.has(fingerprint)) {
        removed.push(rec);
      } else {
        seen.add(fingerprint);
        deduplicated.push(rec);
      }
    });
    return { deduplicated, removed };
  }

  findDuplicates(records, keys) {
    if (!Array.isArray(records) || !keys || keys.length === 0) return [];
    const seen = new Set();
    const duplicates = [];
    records.forEach(rec => {
      const fingerprint = keys.map(k => String(rec[k] || '')).join('|');
      if (seen.has(fingerprint)) duplicates.push(rec);
      else seen.add(fingerprint);
    });
    return duplicates;
  }

  addToIndex(record, keys) {
    if (!record || !keys) return false;
    const fingerprint = keys.map(k => String(record[k] || '')).join('|');
    this._index.push(fingerprint);
    return true;
  }

  isDuplicate(record, keys) {
    if (!record || !keys) return false;
    const fingerprint = keys.map(k => String(record[k] || '')).join('|');
    return this._index.includes(fingerprint);
  }

  clear() {
    this._index = [];
  }
}

module.exports = { Deduplicator };
