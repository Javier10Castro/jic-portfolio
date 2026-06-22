class DataComposer {
  constructor() {
    this._compositions = new Map();
    this._counter = 0;
  }

  compose(appId, data) {
    if (!appId || !data) {
      return { composed: false };
    }
    const config = {
      ...data,
      _id: data.id || `data_${++this._counter}`,
      _sources: (data.sources || []).map((s) => ({
        ...s,
        _id: s.id || `ds_${++this._counter}`,
      })),
    };
    this._compositions.set(appId, config);
    return { composed: true };
  }

  getComposed(appId) {
    if (!appId) return null;
    return this._compositions.get(appId) || null;
  }

  addDataSource(appId, source) {
    if (!appId || !source) return null;
    const existing = this._compositions.get(appId);
    if (!existing) return null;
    const item = { ...source, _id: source.id || `ds_${++this._counter}` };
    existing._sources = existing._sources || [];
    existing._sources.push(item);
    return item;
  }

  removeDataSource(appId, sourceId) {
    if (!appId || !sourceId) return false;
    const existing = this._compositions.get(appId);
    if (!existing || !existing._sources) return false;
    const filtered = existing._sources.filter((s) => s._id !== sourceId);
    if (filtered.length === existing._sources.length) return false;
    existing._sources = filtered;
    return true;
  }

  clear() {
    this._compositions.clear();
    this._counter = 0;
  }
}

module.exports = { DataComposer };
