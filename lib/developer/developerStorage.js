class DeveloperStorage {
  constructor() { this._data = {}; }
  get(key) { return this._data[key]; }
  set(key, value) { this._data[key] = value; }
  delete(key) { delete this._data[key]; }
  has(key) { return key in this._data; }
  getAll() { return { ...this._data }; }
  clear() { this._data = {}; }
}

module.exports = { DeveloperStorage };
