class PluginConfig {
  constructor(pluginId, defaults = {}) {
    this._pluginId = pluginId;
    this._config = { ...defaults };
    this._defaults = { ...defaults };
    this._listeners = {};
  }

  get(key, defaultValue) {
    if (key === undefined) return { ...this._config };
    return key in this._config ? this._config[key] : defaultValue;
  }

  set(key, value) {
    const old = this._config[key];
    this._config[key] = value;
    if (this._listeners[key]) this._listeners[key].forEach(h => h(value, old));
    return this;
  }

  setAll(config) { this._config = { ...this._config, ...config }; return this; }

  onChange(key, handler) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(handler);
  }

  reset(key) {
    if (key) this._config[key] = this._defaults[key];
    else this._config = { ...this._defaults };
  }

  toJSON() { return { ...this._config }; }
}

module.exports = { PluginConfig };
