class PluginLifecycle {
  constructor(options = {}) {
    this._registry = options.registry;
    this._loader = options.loader;
    this._events = options.events;
    this._pluginStorage = options.pluginStorage;
    this._states = {};
  }

  enable(pluginId) {
    const plugin = this._registry.getPluginRaw(pluginId);
    if (!plugin) return { success: false, error: 'Plugin not found' };
    if (plugin.enabled) return { success: false, error: 'Already enabled' };
    plugin.enabled = true;
    if (this._loader && !this._loader.isLoaded(pluginId)) {
      const result = this._loader.load(plugin);
      if (!result.success) { plugin.enabled = false; return result; }
    }
    this._states[pluginId] = 'enabled';
    if (this._events) this._events.emit('plugin.enabled', { pluginId });
    return { success: true };
  }

  disable(pluginId) {
    const plugin = this._registry.getPluginRaw(pluginId);
    if (!plugin) return { success: false, error: 'Plugin not found' };
    if (!plugin.enabled) return { success: false, error: 'Already disabled' };
    plugin.enabled = false;
    if (this._loader && this._loader.isLoaded(pluginId)) {
      this._loader.unload(pluginId);
    }
    this._states[pluginId] = 'disabled';
    if (this._events) this._events.emit('plugin.disabled', { pluginId });
    return { success: true };
  }

  reload(pluginId, newManifest) {
    this.disable(pluginId);
    const plugin = this._registry.getPluginRaw(pluginId);
    if (plugin && newManifest) {
      plugin.manifest = { ...plugin.manifest, ...newManifest };
    }
    if (plugin && plugin.enabled !== false) {
      this.enable(pluginId);
    }
    if (this._events) this._events.emit('plugin.updated', { pluginId });
    return { success: true };
  }

  getState(pluginId) { return this._states[pluginId] || (this._registry.getPluginRaw(pluginId)?.enabled ? 'enabled' : 'disabled'); }
  getStates() { return { ...this._states }; }
  clear() { this._states = {}; }
}

module.exports = { PluginLifecycle };
