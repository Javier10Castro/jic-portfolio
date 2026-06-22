class MultiRegion {
  constructor() { this._regions = {}; }
  addRegion(name, config) { this._regions[name] = { ...config, name, status: 'active', latency: Math.floor(Math.random() * 100) + 20 }; return { success: true }; }
  removeRegion(name) { delete this._regions[name]; }
  replicate(fromRegion, toRegion, data) { return { success: true, from: fromRegion, to: toRegion, replicatedAt: Date.now(), size: JSON.stringify(data).length }; }
  getStatus() { return Object.values(this._regions); }
  count() { return Object.keys(this._regions).length; }
  clear() { this._regions = {}; }
}
module.exports = { MultiRegion };
