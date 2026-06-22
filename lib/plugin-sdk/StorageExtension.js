class StorageExtension {
  constructor(pluginId, storage) {
    this._pluginId = pluginId;
    this._storage = storage;
  }

  get(key) { return this._storage.getNamespaced(this._pluginId, key); }
  set(key, value) { this._storage.setNamespaced(this._pluginId, key, value); }
  delete(key) { this._storage.deleteNamespaced(this._pluginId, key); }
  has(key) { return this._storage.getNamespaced(this._pluginId, key) !== undefined; }
  getAll() { return this._storage.getPluginData(this._pluginId); }
  clear() {
    const data = this._storage.getPluginData(this._pluginId);
    Object.keys(data).forEach(k => this._storage.deleteNamespaced(this._pluginId, k));
  }
}

module.exports = { StorageExtension };
