class IntegrationStorage {
  constructor() {
    this._data = {};
  }

  get(key) {
    return this._data[key];
  }

  set(key, value) {
    this._data[key] = value;
  }

  delete(key) {
    delete this._data[key];
  }

  has(key) {
    return key in this._data;
  }

  getNamespaced(provider, key) {
    return this._data[`${provider}:${key}`];
  }

  setNamespaced(provider, key, value) {
    this._data[`${provider}:${key}`] = value;
  }

  deleteNamespaced(provider, key) {
    delete this._data[`${provider}:${key}`];
  }

  getProviderData(provider) {
    const prefix = `${provider}:`;
    const result = {};
    for (const [key, value] of Object.entries(this._data)) {
      if (key.startsWith(prefix)) {
        result[key.slice(prefix.length)] = value;
      }
    }
    return result;
  }

  clear() {
    this._data = {};
  }
}

module.exports = { IntegrationStorage };
