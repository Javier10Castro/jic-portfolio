function _generateEntryId() {
  return `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

let _datasets = new Map();

class BenchmarkDatasets {
  register(name, data) {
    if (_datasets.has(name)) throw new Error(`Dataset already registered: ${name}`);
    const dataset = {
      name,
      description: data.description || '',
      entries: (data.entries || []).map(e => ({ id: _generateEntryId(), input: e.input, expected: e.expected })),
      tags: data.tags || [],
      version: data.version || 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    _datasets.set(name, dataset);
    return dataset;
  }

  get(name) {
    return _datasets.get(name) || null;
  }

  list(filter = {}) {
    let results = Array.from(_datasets.values());
    if (filter.tags && filter.tags.length) results = results.filter(d => filter.tags.some(t => d.tags.includes(t)));
    return results;
  }

  getEntries(name, count) {
    const dataset = _datasets.get(name);
    if (!dataset) throw new Error(`Dataset not found: ${name}`);
    const entries = [...dataset.entries];
    if (count && count < entries.length) {
      const shuffled = entries.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }
    return entries;
  }

  addEntries(name, entries) {
    const dataset = _datasets.get(name);
    if (!dataset) throw new Error(`Dataset not found: ${name}`);
    const newEntries = entries.map(e => ({ id: _generateEntryId(), input: e.input, expected: e.expected }));
    dataset.entries.push(...newEntries);
    dataset.updatedAt = Date.now();
    return newEntries;
  }

  removeEntries(name, entryIds) {
    const dataset = _datasets.get(name);
    if (!dataset) throw new Error(`Dataset not found: ${name}`);
    const idSet = new Set(entryIds);
    dataset.entries = dataset.entries.filter(e => !idSet.has(e.id));
    dataset.updatedAt = Date.now();
    return true;
  }

  split(name, trainPercent = 80) {
    const dataset = _datasets.get(name);
    if (!dataset) throw new Error(`Dataset not found: ${name}`);
    const entries = [...dataset.entries];
    const shuffled = entries.sort(() => Math.random() - 0.5);
    const splitIdx = Math.floor((shuffled.length * trainPercent) / 100);
    return {
      train: shuffled.slice(0, splitIdx),
      test: shuffled.slice(splitIdx),
    };
  }

  unregister(name) {
    return _datasets.delete(name);
  }

  clear() {
    _datasets.clear();
  }
}

module.exports = { BenchmarkDatasets };
