class PluginUninstaller {
  constructor(options = {}) {
    this._registry = options.registry;
    this._loader = options.loader;
    this._events = options.events;
    this._storage = options.storage;
  }

  uninstall(pluginId) {
    const plugin = this._registry.getPluginRaw(pluginId);
    if (!plugin) return { success: false, error: 'Plugin not found' };

    if (this._loader && this._loader.isLoaded(pluginId)) {
      this._loader.unload(pluginId);
    }

    if (this._storage) {
      this._storage.deleteNamespaced(pluginId, '__state');
    }

    this._registry.unregister(pluginId);
    if (this._events) this._events.emit('plugin.removed', { pluginId });
    return { success: true };
  }
}

module.exports = { PluginUninstaller };
