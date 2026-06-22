class PluginLoader {
  constructor(options = {}) {
    this._sandbox = options.sandbox;
    this._loaded = {};
  }

  load(plugin) {
    const id = plugin.id;
    if (this._loaded[id]) return { success: false, error: 'Already loaded' };

    let instance;
    if (plugin._load) {
      try {
        instance = plugin._load(plugin.manifest);
      } catch (e) {
        return { success: false, error: `Load error: ${e.message}` };
      }
    } else {
      instance = { id, manifest: plugin.manifest, name: plugin.manifest.name };
    }

    const wrapped = this._sandbox ? this._sandbox.wrap(instance, plugin) : instance;
    this._loaded[id] = { plugin, instance: wrapped, loadedAt: Date.now() };
    return { success: true, instance: wrapped };
  }

  unload(pluginId) {
    const entry = this._loaded[pluginId];
    if (!entry) return { success: false, error: 'Not loaded' };
    if (entry.instance && entry.instance.onUnload) {
      try { entry.instance.onUnload(); } catch (e) { /* noop */ }
    }
    delete this._loaded[pluginId];
    return { success: true };
  }

  isLoaded(id) { return !!this._loaded[id]; }
  getInstance(id) { return this._loaded[id] ? this._loaded[id].instance : null; }
  getLoadedPlugins() { return Object.values(this._loaded).map(e => ({ id: e.plugin.id, name: e.plugin.manifest.name, loadedAt: e.loadedAt })); }
  getCount() { return Object.keys(this._loaded).length; }
  clear() { this._loaded = {}; }
}

module.exports = { PluginLoader };
