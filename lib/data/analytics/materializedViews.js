class MaterializedViews {
  constructor() {
    this._views = {};
  }

  createView(name, query, config) {
    if (!name) return null;
    this._views[name] = {
      query: query || '',
      config: config || {},
      refreshInterval: (config && config.refreshInterval) || 3600000,
      lastRefreshed: Date.now(),
      data: [],
      createdAt: Date.now()
    };
    return { name, query: this._views[name].query, config: this._views[name].config, refreshInterval: this._views[name].refreshInterval, lastRefreshed: this._views[name].lastRefreshed };
  }

  getView(name) {
    return this._views[name] ? { name, query: this._views[name].query, config: this._views[name].config, refreshInterval: this._views[name].refreshInterval, lastRefreshed: this._views[name].lastRefreshed } : null;
  }

  listViews() {
    return Object.keys(this._views);
  }

  refreshView(name) {
    if (!this._views[name]) return null;
    this._views[name].lastRefreshed = Date.now();
    this._views[name].data = [{ refreshed: true, at: this._views[name].lastRefreshed }];
    return { name, lastRefreshed: this._views[name].lastRefreshed };
  }

  refreshAll() {
    const results = [];
    Object.keys(this._views).forEach(name => results.push(this.refreshView(name)));
    return results;
  }

  dropView(name) {
    delete this._views[name];
    return true;
  }

  queryView(name) {
    if (!this._views[name]) return null;
    return { view: name, results: [...this._views[name].data], rowCount: this._views[name].data.length };
  }

  clear() {
    this._views = {};
  }
}

module.exports = { MaterializedViews };
