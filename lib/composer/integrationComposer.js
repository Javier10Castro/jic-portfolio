class IntegrationComposer {
  constructor() {
    this._compositions = new Map();
    this._counter = 0;
  }

  compose(appId, integrations) {
    if (!appId || !Array.isArray(integrations)) {
      return { composed: false, count: 0 };
    }
    const items = integrations.map((i) => ({
      ...i,
      _id: i.id || `integ_${++this._counter}`,
    }));
    const existing = this._compositions.get(appId) || [];
    this._compositions.set(appId, [...existing, ...items]);
    return { composed: true, count: items.length };
  }

  getComposed(appId) {
    if (!appId) return null;
    return this._compositions.get(appId) || null;
  }

  addIntegration(appId, integration) {
    if (!appId || !integration) return null;
    const item = {
      ...integration,
      _id: integration.id || `integ_${++this._counter}`,
    };
    const existing = this._compositions.get(appId) || [];
    existing.push(item);
    this._compositions.set(appId, existing);
    return item;
  }

  removeIntegration(appId, integrationId) {
    if (!appId || !integrationId) return false;
    const existing = this._compositions.get(appId);
    if (!existing) return false;
    const filtered = existing.filter((i) => i._id !== integrationId);
    if (filtered.length === existing.length) return false;
    this._compositions.set(appId, filtered);
    return true;
  }

  clear() {
    this._compositions.clear();
    this._counter = 0;
  }
}

module.exports = { IntegrationComposer };
