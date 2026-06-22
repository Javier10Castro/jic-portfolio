class PluginRegistry {
  constructor() {
    this._plugins = {};
    this._categories = {};
  }

  register(plugin) {
    this._plugins[plugin.id] = plugin;
    (plugin.manifest.categories || ['uncategorized']).forEach(cat => {
      if (!this._categories[cat]) this._categories[cat] = [];
      if (!this._categories[cat].includes(plugin.id)) this._categories[cat].push(plugin.id);
    });
  }

  unregister(pluginId) {
    const plugin = this._plugins[pluginId];
    if (!plugin) return null;
    (plugin.manifest.categories || ['uncategorized']).forEach(cat => {
      if (this._categories[cat]) this._categories[cat] = this._categories[cat].filter(id => id !== pluginId);
    });
    delete this._plugins[pluginId];
    return plugin;
  }

  getPlugin(id) { return this._plugins[id] ? { ...this._plugins[id] } : null; }
  getPluginRaw(id) { return this._plugins[id] || null; }

  listPlugins(filter) {
    let items = Object.values(this._plugins);
    if (filter) Object.entries(filter).forEach(([k, v]) => { items = items.filter(p => p[k] === v || (p.manifest && p.manifest[k] === v)); });
    return items;
  }

  getCategories() {
    return Object.entries(this._categories).map(([name, plugins]) => ({ name, count: plugins.length }));
  }

  getPluginsByCategory(category) {
    const ids = this._categories[category] || [];
    return ids.map(id => this._plugins[id]).filter(Boolean);
  }

  getCount() { return Object.keys(this._plugins).length; }
  clear() { this._plugins = {}; this._categories = {}; }
}

module.exports = { PluginRegistry };
