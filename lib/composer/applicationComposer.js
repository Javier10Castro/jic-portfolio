class ApplicationComposer {
  constructor() {
    this._compositions = new Map();
    this._counter = 0;
  }

  compose(appId, blueprint, options = {}) {
    if (!appId || !blueprint) {
      throw new Error('appId and blueprint are required');
    }
    const id = appId;
    const composition = {
      id,
      blueprint,
      options,
      status: 'composed',
      stages: ['discovery', 'matching', 'resolution', 'allocation', 'composition'],
      createdAt: new Date().toISOString()
    };
    this._compositions.set(id, composition);
    return composition;
  }

  getComposition(appId) {
    if (!appId) return null;
    return this._compositions.get(appId) || null;
  }

  listCompositions() {
    return Array.from(this._compositions.values());
  }

  clear() {
    this._compositions.clear();
    this._counter = 0;
  }
}

module.exports = { ApplicationComposer };
