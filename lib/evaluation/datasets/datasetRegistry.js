class DatasetRegistry {
  constructor() {
    this.registry = new Map();
  }

  register(name, dataset) {
    this.registry.set(name, {
      name,
      dataset,
      registeredAt: new Date(),
      tags: dataset.config && dataset.config.tags ? [...dataset.config.tags] : [],
      description: dataset.config ? dataset.config.description : '',
    });
  }

  unregister(name) {
    this.registry.delete(name);
  }

  get(name) {
    const entry = this.registry.get(name);
    return entry ? entry.dataset : null;
  }

  list(filter) {
    let results = Array.from(this.registry.values());
    if (filter) {
      if (filter.tag) {
        results = results.filter(r => r.tags.includes(filter.tag));
      }
      if (filter.description) {
        results = results.filter(r =>
          r.description.toLowerCase().includes(filter.description.toLowerCase())
        );
      }
    }
    return results.map(r => ({ name: r.name, tags: r.tags, description: r.description }));
  }

  search(query) {
    const q = query.toLowerCase();
    return Array.from(this.registry.values())
      .filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      )
      .map(r => ({ name: r.name, tags: r.tags, description: r.description }));
  }

  getByTag(tag) {
    return Array.from(this.registry.values())
      .filter(r => r.tags.includes(tag))
      .map(r => ({ name: r.name, tags: r.tags, description: r.description }));
  }

  clear() {
    this.registry.clear();
  }
}

module.exports = DatasetRegistry;
