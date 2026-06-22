class PluginComposer {
  constructor() {
    this._compositions = new Map();
    this._counter = 0;
  }

  compose(appId, plugins) {
    if (!appId || !Array.isArray(plugins)) {
      return { composed: false, count: 0 };
    }
    const items = plugins.map((p) => ({
      ...p,
      _id: p.id || `plugin_${++this._counter}`,
    }));
    const existing = this._compositions.get(appId) || [];
    this._compositions.set(appId, [...existing, ...items]);
    return { composed: true, count: items.length };
  }

  getComposed(appId) {
    if (!appId) return null;
    return this._compositions.get(appId) || null;
  }

  addPlugin(appId, plugin) {
    if (!appId || !plugin) return null;
    const item = { ...plugin, _id: plugin.id || `plugin_${++this._counter}` };
    const existing = this._compositions.get(appId) || [];
    existing.push(item);
    this._compositions.set(appId, existing);
    return item;
  }

  removePlugin(appId, pluginId) {
    if (!appId || !pluginId) return false;
    const existing = this._compositions.get(appId);
    if (!existing) return false;
    const filtered = existing.filter((p) => p._id !== pluginId);
    if (filtered.length === existing.length) return false;
    this._compositions.set(appId, filtered);
    return true;
  }

  clear() {
    this._compositions.clear();
    this._counter = 0;
  }
}

module.exports = { PluginComposer };
