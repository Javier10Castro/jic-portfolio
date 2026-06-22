class DatasetManager {
  constructor() {
    this.datasets = new Map();
    this.entries = new Map();
  }

  create(name, config) {
    const dataset = {
      name,
      config: config || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      entryCount: 0,
    };
    this.datasets.set(name, dataset);
    this.entries.set(name, []);
    return dataset;
  }

  get(name) {
    return this.datasets.get(name) || null;
  }

  list(filter) {
    let all = Array.from(this.datasets.values());
    if (filter) {
      if (filter.tag) {
        all = all.filter(d => d.config.tags && d.config.tags.includes(filter.tag));
      }
      if (filter.createdAfter) {
        all = all.filter(d => d.createdAt >= new Date(filter.createdAfter));
      }
    }
    return all;
  }

  update(name, updates) {
    const ds = this.datasets.get(name);
    if (!ds) return null;
    Object.assign(ds, updates);
    ds.updatedAt = new Date();
    return ds;
  }

  delete(name) {
    this.datasets.delete(name);
    this.entries.delete(name);
  }

  addEntry(name, entry) {
    const entries = this.entries.get(name);
    if (!entries) return null;
    const id = this._generateId();
    const full = { id, ...entry, createdAt: new Date() };
    entries.push(full);
    const ds = this.datasets.get(name);
    if (ds) ds.entryCount = entries.length;
    return full;
  }

  addEntries(name, entries) {
    const added = [];
    for (const entry of entries) {
      const result = this.addEntry(name, entry);
      if (result) added.push(result);
    }
    return added;
  }

  getEntries(name, filter) {
    const entries = this.entries.get(name);
    if (!entries) return [];
    if (!filter) return [...entries];
    return entries.filter(e => {
      for (const [key, value] of Object.entries(filter)) {
        if (e[key] !== value) return false;
      }
      return true;
    });
  }

  getEntry(name, entryId) {
    const entries = this.entries.get(name);
    if (!entries) return null;
    return entries.find(e => e.id === entryId) || null;
  }

  clear() {
    this.datasets.clear();
    this.entries.clear();
  }

  _generateId() {
    return 'entry_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }
}

module.exports = DatasetManager;
