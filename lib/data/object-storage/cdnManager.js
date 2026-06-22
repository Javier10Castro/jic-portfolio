class CdnManager {
  constructor() {
    this._distributions = {};
  }

  distribute(asset, provider) {
    if (!asset || !asset.id) return null;
    const prov = provider || 'default';
    const entry = {
      assetId: asset.id,
      url: `https://cdn.${prov}/${asset.id}`,
      provider: prov,
      distributedAt: Date.now(),
      status: 'distributed'
    };
    this._distributions[asset.id] = entry;
    return { ...entry };
  }

  invalidate(assetId) {
    if (this._distributions[assetId]) {
      this._distributions[assetId].status = 'invalidated';
    }
    return true;
  }

  getDistributionStatus(assetId) {
    return this._distributions[assetId] ? { ...this._distributions[assetId] } : null;
  }

  listDistributions() {
    return Object.values(this._distributions).map(d => ({ ...d }));
  }

  clear() {
    this._distributions = {};
  }
}

module.exports = { CdnManager };
