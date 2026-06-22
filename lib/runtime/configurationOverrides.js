class ConfigurationOverrides {
  constructor() {
    this._overrides = new Map();
  }

  setOverride(name, value) {
    if (!name) {
      throw new Error('name is required');
    }
    this._overrides.set(name, {
      name,
      value,
      createdAt: this._overrides.has(name) ? this._overrides.get(name).createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  getOverride(name) {
    if (!name) return null;
    const ovr = this._overrides.get(name);
    return ovr ? { ...ovr } : null;
  }

  removeOverride(name) {
    if (!name) return false;
    return this._overrides.delete(name);
  }

  listOverrides() {
    return Array.from(this._overrides.values()).map(o => ({ ...o }));
  }

  hasOverride(name) {
    if (!name) return false;
    return this._overrides.has(name);
  }

  clear() {
    this._overrides.clear();
  }
}

module.exports = { ConfigurationOverrides };
