class PluginInstaller {
  constructor(options = {}) {
    this._registry = options.registry;
    this._loader = options.loader;
    this._events = options.events;
    this._validator = options.validator;
    this._compatibility = options.compatibility;
    this._platformVersion = options.platformVersion || '4.3.0';
  }

  install(pluginData, options = {}) {
    const manifest = typeof pluginData === 'string' ? this._parseManifest(pluginData) : (pluginData.manifest || pluginData);

    if (!manifest || !manifest.id) return { success: false, error: 'Invalid manifest' };

    if (this._registry.getPluginRaw(manifest.id)) return { success: false, error: 'Already installed' };

    if (this._validator) {
      const validation = this._validator.validate(manifest);
      if (!validation.valid) return { success: false, error: `Validation failed: ${validation.errors.join(', ')}` };
    }

    if (this._compatibility) {
      const compat = this._compatibility.check({ manifest }, this._platformVersion);
      if (!compat.compatible) {
        if (this._events) this._events.emit('plugin.compatibility.failed', { pluginId: manifest.id, issues: compat.issues });
        return { success: false, error: `Compatibility: ${compat.issues.join('; ')}` };
      }
    }

    const plugin = {
      id: manifest.id,
      manifest,
      enabled: options.enabled !== false,
      installedAt: Date.now(),
      source: options.source || 'local',
      _load: manifest._load || null
    };

    this._registry.register(plugin);

    if (plugin.enabled && this._loader) {
      const loadResult = this._loader.load(plugin);
      if (!loadResult.success) {
        this._registry.unregister(plugin.id);
        return { success: false, error: loadResult.error };
      }
    }

    if (this._events) this._events.emit('plugin.installed', { pluginId: plugin.id, version: manifest.version });
    return { success: true, plugin };
  }

  _parseManifest(json) {
    try { return JSON.parse(json); } catch (e) { return null; }
  }
}

module.exports = { PluginInstaller };
