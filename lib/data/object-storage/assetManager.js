class AssetManager {
  constructor() {
    this._assets = {};
  }

  registerAsset(asset) {
    if (!asset || !asset.id) return null;
    this._assets[asset.id] = {
      ...asset,
      tags: asset.tags || [],
      registeredAt: Date.now()
    };
    return { ...this._assets[asset.id] };
  }

  getAsset(id) {
    return this._assets[id] ? { ...this._assets[id] } : null;
  }

  updateAsset(id, changes) {
    if (!this._assets[id]) return null;
    Object.assign(this._assets[id], changes);
    return { ...this._assets[id] };
  }

  deleteAsset(id) {
    delete this._assets[id];
    return true;
  }

  listAssets(filters) {
    let list = Object.values(this._assets);
    if (!filters) return list.map(a => ({ ...a }));
    if (filters.type) list = list.filter(a => a.type === filters.type);
    if (filters.tag) list = list.filter(a => a.tags && a.tags.includes(filters.tag));
    if (filters.version !== undefined) list = list.filter(a => a.version === filters.version);
    return list.map(a => ({ ...a }));
  }

  getAssetStats() {
    const list = Object.values(this._assets);
    const byType = {};
    let totalSize = 0;
    list.forEach(a => {
      byType[a.type] = (byType[a.type] || 0) + 1;
      totalSize += a.size || 0;
    });
    return { total: list.length, byType, totalSize };
  }

  clear() {
    this._assets = {};
  }
}

module.exports = { AssetManager };
