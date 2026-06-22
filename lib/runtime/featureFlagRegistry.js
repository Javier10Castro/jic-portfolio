class FeatureFlagRegistry {
  constructor() {
    this._flags = new Map();
  }

  register(flag) {
    if (!flag || !flag.key) {
      throw new Error('Flag must have a key');
    }
    if (this._flags.has(flag.key)) {
      throw new Error(`Flag with key '${flag.key}' already exists`);
    }
    this._flags.set(flag.key, {
      key: flag.key,
      name: flag.name || '',
      description: flag.description || '',
      enabled: flag.enabled === true,
      tags: Array.isArray(flag.tags) ? [...flag.tags] : [],
      createdAt: flag.createdAt || new Date().toISOString()
    });
  }

  unregister(key) {
    if (!key) return false;
    return this._flags.delete(key);
  }

  get(key) {
    if (!key) return null;
    const flag = this._flags.get(key);
    return flag ? { ...flag } : null;
  }

  list(filters) {
    let result = Array.from(this._flags.values()).map(f => ({ ...f }));
    if (filters) {
      if (filters.enabled !== undefined) {
        result = result.filter(f => f.enabled === !!filters.enabled);
      }
      if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
        result = result.filter(f => filters.tags.some(t => f.tags.includes(t)));
      }
    }
    return result;
  }

  search(query) {
    if (!query || typeof query !== 'string') return [];
    const q = query.toLowerCase();
    return Array.from(this._flags.values())
      .filter(f => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q))
      .map(f => ({ ...f }));
  }

  count() {
    return this._flags.size;
  }

  clear() {
    this._flags.clear();
  }
}

module.exports = { FeatureFlagRegistry };
