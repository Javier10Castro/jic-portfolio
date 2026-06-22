class PluginStorage {
  constructor() {
    this._data = {};
  }

  get(key) { return this._data[key]; }
  set(key, value) { this._data[key] = value; }
  delete(key) { delete this._data[key]; }
  has(key) { return key in this._data; }
  getAll() { return { ...this._data }; }
  clear() { this._data = {}; }

  getNamespaced(pluginId, key) { return this._data[`${pluginId}:${key}`]; }
  setNamespaced(pluginId, key, value) { this._data[`${pluginId}:${key}`] = value; }
  deleteNamespaced(pluginId, key) { delete this._data[`${pluginId}:${key}`]; }
  getPluginData(pluginId) {
    const result = {};
    Object.entries(this._data).forEach(([k, v]) => { if (k.startsWith(`${pluginId}:`)) result[k.slice(pluginId.length + 1)] = v; });
    return result;
  }
}

module.exports = { PluginStorage };
