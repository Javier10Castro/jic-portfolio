class RuntimeComposer {
  constructor() {
    this._compositions = new Map();
    this._counter = 0;
  }

  compose(appId, runtime) {
    if (!appId || !runtime) {
      return { composed: false };
    }
    const config = {
      ...runtime,
      _id: runtime.id || `rt_${++this._counter}`,
    };
    this._compositions.set(appId, config);
    return { composed: true };
  }

  getComposed(appId) {
    if (!appId) return null;
    return this._compositions.get(appId) || null;
  }

  updateRuntime(appId, config) {
    if (!appId || !config) return null;
    const existing = this._compositions.get(appId);
    if (!existing) {
      this._compositions.set(appId, {
        ...config,
        _id: config.id || `rt_${++this._counter}`,
      });
    } else {
      this._compositions.set(appId, { ...existing, ...config });
    }
    return this._compositions.get(appId);
  }

  clear() {
    this._compositions.clear();
    this._counter = 0;
  }
}

module.exports = { RuntimeComposer };
