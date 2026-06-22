class RuntimeRegistry {
  constructor() {
    this._registry = new Map();
  }

  register(name, component) {
    if (!name || component === undefined || component === null) {
      return false;
    }
    if (this._registry.has(name)) {
      return false;
    }
    this._registry.set(name, component);
    return true;
  }

  unregister(name) {
    if (!this._registry.has(name)) {
      return false;
    }
    this._registry.delete(name);
    return true;
  }

  get(name) {
    if (!this._registry.has(name)) {
      return null;
    }
    return this._registry.get(name);
  }

  list() {
    return Array.from(this._registry.keys());
  }

  findByType(type) {
    if (!type) {
      return [];
    }
    const results = [];
    for (const [, component] of this._registry) {
      if (component && typeof component === 'object' && component.constructor && component.constructor.name === type) {
        results.push(component);
      } else if (component && typeof component === 'object' && type && component.type === type) {
        results.push(component);
      }
    }
    return results;
  }

  count() {
    return this._registry.size;
  }

  clear() {
    this._registry.clear();
  }
}

module.exports = { RuntimeRegistry };
