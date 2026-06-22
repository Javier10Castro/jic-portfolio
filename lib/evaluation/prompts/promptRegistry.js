class PromptRegistry {
  constructor() {
    this._registry = new Map();
  }

  register(id, template) {
    if (this._registry.has(id)) {
      throw new Error(`Prompt with id '${id}' is already registered`);
    }
    const entry = {
      id,
      text: template.text,
      description: template.description || '',
      tags: template.tags || [],
      createdAt: new Date().toISOString()
    };
    this._registry.set(id, entry);
    return entry;
  }

  get(id) {
    return this._registry.has(id) ? { ...this._registry.get(id) } : null;
  }

  update(id, updates) {
    const entry = this._registry.get(id);
    if (!entry) {
      return null;
    }
    const allowed = ['text', 'description', 'tags'];
    for (const key of Object.keys(updates)) {
      if (allowed.includes(key)) {
        entry[key] = updates[key];
      }
    }
    return { ...entry };
  }

  unregister(id) {
    return this._registry.delete(id);
  }

  list(filter) {
    const results = [];
    for (const entry of this._registry.values()) {
      if (!filter || !filter.tag || (entry.tags && entry.tags.includes(filter.tag))) {
        results.push({ ...entry });
      }
    }
    return results;
  }

  search(query) {
    const lower = query.toLowerCase();
    const results = [];
    for (const entry of this._registry.values()) {
      if (entry.text.toLowerCase().includes(lower)) {
        results.push({ ...entry });
      }
    }
    return results;
  }

  clear() {
    this._registry.clear();
  }
}

module.exports = { PromptRegistry };
